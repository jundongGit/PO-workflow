import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

/**
 * Smart extraction of Invoice Number and Client Order Number
 * Uses pattern matching and keyword detection
 */
function extractInvoiceData(text) {
  const result = {
    invoiceNumber: null,
    clientOrderNumber: null,
    rawText: text
  };

  // Common patterns for Invoice Number
  const invoicePatterns = [
    /Invoice\s*(?:Number|No\.?|#)\s*:?\s*([A-Z0-9\-]+)/i,
    /Invoice\s*:?\s*([A-Z0-9\-]+)/i,
    /INV\s*(?:Number|No\.?|#)?\s*:?\s*([A-Z0-9\-]+)/i,
    /Invoice\s+ID\s*:?\s*([A-Z0-9\-]+)/i,
    /^([A-Z]{2,3}\-?\d{4,})/m  // Pattern like "INV-12345" at start of line
  ];

  // Common patterns for Client Order Number / PO Number
  const orderPatterns = [
    /(?:Client\s+)?Order\s*(?:Number|No\.?|#)\s*:?\s*([A-Z0-9\-]+)/i,
    /PO\s*(?:Number|No\.?|#)?\s*:?\s*([A-Z0-9\-]+)/i,
    /Purchase\s+Order\s*(?:Number|No\.?)?\s*:?\s*([A-Z0-9\-]+)/i,
    /Client\s+(?:PO|Order)\s*:?\s*([A-Z0-9\-]+)/i,
    /Order\s*:?\s*([A-Z0-9\-]+)/i
  ];

  // Try to find Invoice Number
  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.invoiceNumber = match[1].trim();
      break;
    }
  }

  // Try to find Client Order Number
  for (const pattern of orderPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.clientOrderNumber = match[1].trim();
      break;
    }
  }

  // Fallback: Look for any number-like patterns if nothing found
  if (!result.invoiceNumber || !result.clientOrderNumber) {
    // Split text into lines for better analysis
    const lines = text.split('\n').filter(line => line.trim());

    // Look for lines that might contain these numbers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for invoice-related keywords
      if (!result.invoiceNumber && /invoice/i.test(line)) {
        const numberMatch = line.match(/[A-Z0-9\-]{4,}/);
        if (numberMatch) {
          result.invoiceNumber = numberMatch[0];
        }
      }

      // Check for order-related keywords
      if (!result.clientOrderNumber && /(order|po|purchase)/i.test(line)) {
        const numberMatch = line.match(/[A-Z0-9\-]{4,}/);
        if (numberMatch) {
          result.clientOrderNumber = numberMatch[0];
        }
      }
    }
  }

  return result;
}

/**
 * Main function to process PDF
 */
export async function processPDF(filePath) {
  try {
    console.log('Processing PDF:', filePath);

    const text = await extractTextFromPDF(filePath);
    const extractedData = extractInvoiceData(text);

    console.log('Extracted data:', extractedData);

    return {
      invoiceNumber: extractedData.invoiceNumber,
      clientOrderNumber: extractedData.clientOrderNumber,
      confidence: {
        invoiceNumber: extractedData.invoiceNumber ? 'high' : 'none',
        clientOrderNumber: extractedData.clientOrderNumber ? 'high' : 'none'
      }
    };
  } catch (error) {
    console.error('Error in processPDF:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}
