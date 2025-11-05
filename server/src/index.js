import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processPDF } from './pdfProcessor.js';
import { processPDFWithAI } from './aiProcessor.js';
import { automateProcore, closeBrowser, addLogListener, clearLogListeners, getBrowserPoolStats } from './playwrightAutomation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client directory
const CLIENT_DIR = path.join(__dirname, '../../client');
app.use(express.static(CLIENT_DIR));

// Ensure uploads and document directories exist
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const DOCUMENT_DIR = path.join(__dirname, '../../document');
const METADATA_FILE = path.join(__dirname, '../../metadata.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENT_DIR)) {
  fs.mkdirSync(DOCUMENT_DIR, { recursive: true });
}

// File metadata storage with persistence
const fileMetadata = new Map();

// Load metadata from disk
function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf8');
      const entries = JSON.parse(data);
      entries.forEach(([key, value]) => {
        fileMetadata.set(key, value);
      });
      console.log(`Loaded ${fileMetadata.size} file(s) from metadata storage`);
    }
  } catch (error) {
    console.error('Failed to load metadata:', error.message);
  }
}

// Save metadata to disk
function saveMetadata() {
  try {
    const entries = Array.from(fileMetadata.entries());
    fs.writeFileSync(METADATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save metadata:', error.message);
  }
}

// Load metadata on startup
loadMetadata();

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
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG) are allowed'));
    }
  }
});

// API Routes

// Upload and process file (PDF or Image)
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileType = req.file.mimetype;
    const useAI = req.query.useAI !== 'false'; // Default to AI processing

    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    console.log(`Processing uploaded file: ${req.originalFilename}`);
    console.log(`File type: ${isImage ? 'Image' : 'PDF'}`);
    console.log(`Using ${useAI ? 'AI' : 'regex'} processing method`);

    let result;
    try {
      if (useAI) {
        if (isImage) {
          // For images, use Vision API directly
          const { extractInvoiceDataFromImage } = await import('./aiProcessor.js');
          result = await extractInvoiceDataFromImage(filePath);
        } else {
          // For PDFs, use text extraction + text API
          result = await processPDFWithAI(filePath);
        }
      } else {
        if (isPDF) {
          // Fallback to regex-based processing for PDF
          result = await processPDF(filePath);
        } else {
          // For images without AI, we can't extract text, so return empty
          result = {
            invoiceNumber: null,
            clientOrderNumber: null,
            totalAmountExGST: null,
            processingMethod: 'image-no-ai'
          };
        }
      }
    } catch (processingError) {
      console.error('Primary processing failed, trying fallback method...');
      // If AI fails, try regex as fallback (only for PDF)
      if (useAI && isPDF) {
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
      processingMethod: result.extractionMethod || result.processingMethod || (result.model ? 'ai' : 'unknown'),
      aiModel: result.model || result.aiModel || null
    };

    fileMetadata.set(fileName, metadata);
    saveMetadata(); // Persist to disk

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
    const { clientOrderNumber, invoiceNumber, totalAmount, fileId, fileIds } = req.body;

    console.log('=== Automation Request Received ===');
    console.log('Client Order Number:', clientOrderNumber);
    console.log('Invoice Number:', invoiceNumber);
    console.log('Total Amount:', totalAmount);
    console.log('Primary File ID:', fileId);
    console.log('All File IDs:', fileIds);

    if (!clientOrderNumber) {
      return res.status(400).json({ error: 'Client Order Number is required' });
    }

    // Get all PDF file paths from metadata
    const pdfFilePaths = [];

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      console.log(`Looking up ${fileIds.length} file(s)...`);
      console.log('Available fileIds in metadata:', Array.from(fileMetadata.keys()));

      for (const fId of fileIds) {
        const metadata = fileMetadata.get(fId);
        if (metadata) {
          const filePath = metadata.documentPath || metadata.filePath;

          // 验证文件是否存在
          const fileExists = fs.existsSync(filePath);

          pdfFilePaths.push(filePath);
          console.log(`✅ Found metadata for fileId: ${fId}`);
          console.log(`   File: ${metadata.originalName}`);
          console.log(`   Path: ${filePath}`);
          console.log(`   Exists: ${fileExists ? '✓' : '✗ FILE NOT FOUND!'}`);

          if (!fileExists) {
            console.error(`   ❌ File does not exist at path: ${filePath}`);
            console.error(`   Document path: ${metadata.documentPath}`);
            console.error(`   Upload path: ${metadata.filePath}`);
          }
        } else {
          console.warn(`⚠️ File ID ${fId} not found in metadata`);
        }
      }

      console.log(`Total files to upload: ${pdfFilePaths.length}`);
    } else if (fileId) {
      // Fallback: single file mode (backward compatibility)
      console.log(`Looking up single fileId: ${fileId}`);
      const metadata = fileMetadata.get(fileId);
      if (metadata) {
        const filePath = metadata.documentPath || metadata.filePath;
        pdfFilePaths.push(filePath);
        console.log(`✅ Found metadata for fileId: ${fileId}`);
        console.log(`   Path: ${filePath}`);
      } else {
        console.error(`❌ File ID ${fileId} not found in metadata`);
      }
    } else {
      console.warn('⚠️ No fileId or fileIds provided in request');
    }

    // Generate unique sessionId for this automation task
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await automateProcore(clientOrderNumber, invoiceNumber, totalAmount, pdfFilePaths, sessionId);

    res.json({
      success: true,
      sessionId: sessionId,
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
    saveMetadata(); // Persist to disk

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
  const sessionId = req.query.sessionId;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId query parameter is required'
    });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Log stream connected', sessionId })}\n\n`);

  // Add log listener for this specific session
  const removeListener = addLogListener(sessionId, (logEntry) => {
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

// Settings management
const SETTINGS_FILE = path.join(__dirname, '../../settings.json');

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load settings:', error.message);
  }
  return {};
}

// Save settings to file
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error.message);
    return false;
  }
}

// Update .env file with current settings
function updateEnvFile(settings) {
  try {
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';

    // Read current .env file to preserve comments and structure
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add OpenAI API Key
    if (settings.openaiApiKey) {
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(
          /OPENAI_API_KEY=.*/,
          `OPENAI_API_KEY=${settings.openaiApiKey}`
        );
      } else {
        envContent += `\nOPENAI_API_KEY=${settings.openaiApiKey}`;
      }
    }

    // Update or add Procore Email
    if (settings.procoreEmail !== undefined) {
      if (envContent.includes('PROCORE_EMAIL=')) {
        envContent = envContent.replace(
          /PROCORE_EMAIL=.*/,
          `PROCORE_EMAIL=${settings.procoreEmail}`
        );
      } else {
        envContent += `\nPROCORE_EMAIL=${settings.procoreEmail}`;
      }
    }

    // Update or add Procore Password
    if (settings.procorePassword) {
      if (envContent.includes('PROCORE_PASSWORD=')) {
        envContent = envContent.replace(
          /PROCORE_PASSWORD=.*/,
          `PROCORE_PASSWORD=${settings.procorePassword}`
        );
      } else {
        envContent += `\nPROCORE_PASSWORD=${settings.procorePassword}`;
      }
    }

    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('.env file updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update .env file:', error.message);
    return false;
  }
}

// Get settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = loadSettings();
    // Return settings but mask sensitive data
    const maskedSettings = {
      ...settings,
      openaiApiKey: settings.openaiApiKey
        ? `${settings.openaiApiKey.substring(0, 7)}...${settings.openaiApiKey.slice(-4)}`
        : '',
      hasApiKey: !!settings.openaiApiKey,
      procoreEmail: settings.procoreEmail || '',
      procorePassword: settings.procorePassword
        ? '********' // Mask password completely
        : '',
      hasProcoreCredentials: !!(settings.procoreEmail && settings.procorePassword),
      poMappings: settings.poMappings || []
    };
    res.json({
      success: true,
      settings: maskedSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
      details: error.message
    });
  }
});

// Update settings
app.post('/api/settings', (req, res) => {
  try {
    const { openaiApiKey, procoreEmail, procorePassword, poMappings } = req.body;

    // Validate OpenAI API Key if provided and not masked
    if (openaiApiKey && !openaiApiKey.includes('...')) {
      if (!openaiApiKey.startsWith('sk-')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OpenAI API Key format'
        });
      }
    }

    const currentSettings = loadSettings();
    const newSettings = {
      ...currentSettings,
      poMappings: poMappings || []
    };

    // Update OpenAI API Key only if provided and not masked
    if (openaiApiKey && !openaiApiKey.includes('...')) {
      newSettings.openaiApiKey = openaiApiKey;
      process.env.OPENAI_API_KEY = openaiApiKey;
    }

    // Update Procore credentials
    if (procoreEmail !== undefined) {
      newSettings.procoreEmail = procoreEmail;
      process.env.PROCORE_EMAIL = procoreEmail;
    }

    // Only update password if it's not the masked value
    if (procorePassword && procorePassword !== '********') {
      newSettings.procorePassword = procorePassword;
      process.env.PROCORE_PASSWORD = procorePassword;
    }

    if (saveSettings(newSettings)) {
      // Also update .env file
      updateEnvFile(newSettings);

      console.log('Settings updated successfully');
      if (openaiApiKey && !openaiApiKey.includes('...')) {
        console.log(`- OpenAI API Key updated`);
      }
      if (procoreEmail) {
        console.log(`- Procore Email: ${procoreEmail}`);
      }
      if (procorePassword && procorePassword !== '********') {
        console.log(`- Procore Password updated`);
      }
      console.log(`- PO Mappings: ${poMappings ? poMappings.length : 0} rules`);

      res.json({
        success: true,
        message: 'Settings saved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save settings'
      });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      details: error.message
    });
  }
});

// Test OpenAI API Key
app.post('/api/settings/test', async (req, res) => {
  try {
    let { openaiApiKey } = req.body;

    // If the key is masked (contains '...'), use the stored key instead
    if (openaiApiKey && openaiApiKey.includes('...')) {
      const settings = loadSettings();
      openaiApiKey = settings.openaiApiKey;
    }

    if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OpenAI API Key format'
      });
    }

    // Test the API key by making a simple API call
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    try {
      // Make a minimal API call to test the key
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      if (response && response.choices && response.choices.length > 0) {
        res.json({
          success: true,
          message: 'API Key 验证成功！可以正常使用 OpenAI API',
          model: response.model
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'API 返回异常'
        });
      }
    } catch (apiError) {
      console.error('OpenAI API test failed:', apiError);
      res.status(500).json({
        success: false,
        error: 'API Key 验证失败',
        details: apiError.message
      });
    }
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test API key',
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

// Get browser pool statistics
app.get('/api/browser-pool-stats', (req, res) => {
  try {
    const stats = getBrowserPoolStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update management endpoints
import { hasNewVersion, getCurrentVersion, checkForUpdates } from './updateService.js';

// Check for updates
app.get('/api/update/check', async (req, res) => {
  try {
    const updateInfo = await hasNewVersion();
    res.json({
      success: true,
      ...updateInfo
    });
  } catch (error) {
    console.error('Update check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check for updates',
      details: error.message
    });
  }
});

// Get current version
app.get('/api/version', (req, res) => {
  try {
    const versionPath = path.join(__dirname, '../../VERSION.json');
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      res.json({
        success: true,
        ...versionData
      });
    } else {
      res.json({
        success: true,
        version: '1.1.0',
        description: 'Invoice PDF automation tool'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get version',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);

  // Load settings on startup and override environment variables
  const settings = loadSettings();
  if (settings.openaiApiKey) {
    process.env.OPENAI_API_KEY = settings.openaiApiKey;
    console.log('OpenAI API Key loaded from settings');
  }
});
