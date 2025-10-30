/**
 * PDF Processing Module
 * Converts PDF to image using PDF.js (local version)
 */

/**
 * Load PDF.js library from local files
 */
async function loadPDFJS() {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  // Load from local files
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/pdf.min.js');
    script.onload = () => {
      // Set worker to local file
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        chrome.runtime.getURL('lib/pdf.worker.min.js');
      console.log('✅ PDF.js loaded from local files');
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from local files'));
    document.head.appendChild(script);
  });
}

/**
 * Convert PDF ArrayBuffer to Base64 Image
 * @param {ArrayBuffer} pdfBuffer - PDF file as ArrayBuffer
 * @param {Object} options - Options for conversion
 * @returns {Promise<string>} - Base64 encoded PNG image
 */
export async function processPDFFile(pdfBuffer, options = {}) {
  try {
    const {
      pageNumber = 1,
      scale = 2.0, // Higher scale = better quality
      format = 'png'
    } = options;

    console.log('Loading PDF.js library...');
    const pdfjsLib = await loadPDFJS();

    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;

    console.log(`PDF loaded. Pages: ${pdf.numPages}`);

    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    console.log(`Rendering page ${pageNumber}...`);

    // Calculate viewport
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    console.log('Page rendered successfully');

    // Convert canvas to Base64
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.95 : undefined;
    const base64Image = canvas.toDataURL(mimeType, quality);

    console.log(`Image generated (size: ${Math.round(base64Image.length / 1024)}KB)`);

    return base64Image;

  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDF处理失败: ${error.message}`);
  }
}

/**
 * Extract text from PDF (alternative method for text-based PDFs)
 * @param {ArrayBuffer} pdfBuffer - PDF file as ArrayBuffer
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractPDFText(pdfBuffer) {
  try {
    const pdfjsLib = await loadPDFJS();
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();

  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`文本提取失败: ${error.message}`);
  }
}

/**
 * Get PDF metadata
 * @param {ArrayBuffer} pdfBuffer - PDF file as ArrayBuffer
 * @returns {Promise<Object>} - PDF metadata
 */
export async function getPDFMetadata(pdfBuffer) {
  try {
    const pdfjsLib = await loadPDFJS();
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;

    const metadata = await pdf.getMetadata();

    return {
      numPages: pdf.numPages,
      info: metadata.info,
      metadata: metadata.metadata
    };

  } catch (error) {
    console.error('Metadata extraction error:', error);
    return null;
  }
}

/**
 * Validate PDF file
 * @param {File} file - File object to validate
 * @returns {Object} - Validation result
 */
export function validatePDFFile(file) {
  const errors = [];

  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('文件类型必须是PDF');
  }

  // Check file size (max 20MB for browser processing)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    errors.push(`文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file size (min 1KB)
  if (file.size < 1024) {
    errors.push('文件太小，可能不是有效的PDF');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Compress image if too large
 * @param {string} base64Image - Base64 encoded image
 * @param {number} maxSizeKB - Maximum size in KB
 * @returns {Promise<string>} - Compressed base64 image
 */
export async function compressImage(base64Image, maxSizeKB = 1000) {
  try {
    const currentSizeKB = Math.round((base64Image.length * 3) / 4 / 1024);

    if (currentSizeKB <= maxSizeKB) {
      return base64Image; // No compression needed
    }

    console.log(`Compressing image from ${currentSizeKB}KB to ~${maxSizeKB}KB`);

    // Load image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = base64Image;
    });

    // Calculate compression ratio
    const compressionRatio = Math.sqrt(maxSizeKB / currentSizeKB);
    const newWidth = Math.floor(img.width * compressionRatio);
    const newHeight = Math.floor(img.height * compressionRatio);

    // Create canvas and resize
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert to base64 with quality adjustment
    const quality = Math.min(0.9, compressionRatio);
    const compressedImage = canvas.toDataURL('image/jpeg', quality);

    const newSizeKB = Math.round((compressedImage.length * 3) / 4 / 1024);
    console.log(`Image compressed to ${newSizeKB}KB`);

    return compressedImage;

  } catch (error) {
    console.error('Image compression error:', error);
    return base64Image; // Return original if compression fails
  }
}
