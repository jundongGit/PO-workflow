import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processPDF } from './pdfProcessor.js';
import { processPDFWithAI } from './aiProcessor.js';
import { automateProcore, closeBrowser, addLogListener, clearLogListeners } from './playwrightAutomation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads and document directories exist
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const DOCUMENT_DIR = path.join(__dirname, '../../document');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENT_DIR)) {
  fs.mkdirSync(DOCUMENT_DIR, { recursive: true });
}

// File metadata storage (in production, use a database)
const fileMetadata = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const savedFilename = 'invoice-' + uniqueSuffix + ext;

    // Store original filename mapping
    req.originalFilename = file.originalname;
    req.savedFilename = savedFilename;

    cb(null, savedFilename);
  }
});

// Configure multer for document storage (keeps original filename)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENT_DIR);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// API Routes

// Upload and process PDF
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const useAI = req.query.useAI !== 'false'; // Default to AI processing

    console.log(`Processing uploaded file: ${req.originalFilename}`);
    console.log(`Using ${useAI ? 'AI' : 'regex'} processing method`);

    let result;
    try {
      if (useAI) {
        // Use AI-powered processing (GPT-4 Vision)
        result = await processPDFWithAI(filePath);
      } else {
        // Fallback to regex-based processing
        result = await processPDF(filePath);
      }
    } catch (processingError) {
      console.error('Primary processing failed, trying fallback method...');
      // If AI fails, try regex as fallback
      if (useAI) {
        console.log('Falling back to regex processing...');
        result = await processPDF(filePath);
        result.processingMethod = 'regex-fallback';
      } else {
        throw processingError;
      }
    }

    // Copy file to document folder with original filename
    const originalFilename = req.originalFilename || req.file.originalname;
    const documentPath = path.join(DOCUMENT_DIR, originalFilename);

    try {
      fs.copyFileSync(filePath, documentPath);
      console.log(`File copied to document folder: ${documentPath}`);
    } catch (copyError) {
      console.error('Failed to copy file to document folder:', copyError);
    }

    // Store file metadata
    const metadata = {
      id: fileName,
      originalName: originalFilename,
      savedName: fileName,
      filePath: filePath,
      documentPath: documentPath, // Path to the document folder copy
      uploadDate: new Date().toISOString(),
      fileSize: req.file.size,
      invoiceNumber: result.invoiceNumber,
      clientOrderNumber: result.clientOrderNumber,
      processed: true,
      processingMethod: result.extractionMethod || result.processingMethod || 'unknown',
      aiModel: result.aiModel || null
    };

    fileMetadata.set(fileName, metadata);

    console.log('File uploaded and processed successfully:', metadata);

    res.json({
      success: true,
      data: result,
      fileInfo: {
        id: fileName,
        originalName: metadata.originalName,
        fileSize: metadata.fileSize,
        uploadDate: metadata.uploadDate,
        processingMethod: metadata.processingMethod
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process PDF',
      details: error.message
    });
  }
});

// Trigger Procore automation
app.post('/api/automate', async (req, res) => {
  try {
    const { clientOrderNumber, invoiceNumber, totalAmount, fileId } = req.body;

    if (!clientOrderNumber) {
      return res.status(400).json({ error: 'Client Order Number is required' });
    }

    // Get PDF file path from metadata if fileId is provided
    let pdfFilePath = null;
    if (fileId) {
      const metadata = fileMetadata.get(fileId);
      if (metadata) {
        // Use documentPath (file in document folder) instead of filePath (file in uploads folder)
        pdfFilePath = metadata.documentPath || metadata.filePath;
        console.log(`Using PDF file: ${pdfFilePath}`);
      } else {
        console.warn(`File ID ${fileId} not found in metadata`);
      }
    }

    const result = await automateProcore(clientOrderNumber, invoiceNumber, totalAmount, pdfFilePath);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in automation:', error);
    res.status(500).json({
      error: 'Automation failed',
      details: error.message
    });
  }
});

// Get list of uploaded files
app.get('/api/files', (req, res) => {
  try {
    const files = Array.from(fileMetadata.values()).map(file => ({
      id: file.id,
      originalName: file.originalName,
      uploadDate: file.uploadDate,
      fileSize: file.fileSize,
      invoiceNumber: file.invoiceNumber,
      clientOrderNumber: file.clientOrderNumber,
      processed: file.processed
    }));

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    res.json({
      success: true,
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files',
      details: error.message
    });
  }
});

// Get single file info
app.get('/api/files/:id', (req, res) => {
  try {
    const fileId = req.params.id;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      file: metadata
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file',
      details: error.message
    });
  }
});

// Delete file
app.delete('/api/files/:id', (req, res) => {
  try {
    const fileId = req.params.id;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete physical file
    if (fs.existsSync(metadata.filePath)) {
      fs.unlinkSync(metadata.filePath);
      console.log(`Deleted file: ${metadata.filePath}`);
    }

    // Delete metadata
    fileMetadata.delete(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

// Real-time automation logs (Server-Sent Events)
app.get('/api/automation-logs', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Log stream connected' })}\n\n`);

  // Add log listener
  const removeListener = addLogListener((logEntry) => {
    res.write(`data: ${JSON.stringify({ type: 'log', ...logEntry })}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    removeListener();
    res.end();
  });
});

// Close browser
app.post('/api/browser/close', async (req, res) => {
  try {
    await closeBrowser();
    res.json({
      success: true,
      message: 'Browser closed successfully'
    });
  } catch (error) {
    console.error('Error closing browser:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close browser',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uploadedFiles: fileMetadata.size
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
