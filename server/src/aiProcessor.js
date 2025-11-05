import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Convert PDF to image (first page only) using system poppler
 */
async function pdfToImage(pdfPath) {
  try {
    const outputDir = path.join(__dirname, '../../uploads/temp');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.basename(pdfPath, '.pdf');
    const outputPath = path.join(outputDir, baseName);

    console.log('Converting PDF to image using system poppler...');

    // Use system pdftoppm command
    // -png: output format
    // -f 1 -l 1: only first page
    // -singlefile: don't add page numbers to output filename
    const command = `pdftoppm -png -f 1 -l 1 -singlefile "${pdfPath}" "${outputPath}"`;

    console.log('Running command:', command);
    await execAsync(command);

    // The output file will be named {baseName}.png
    const imagePath = `${outputPath}.png`;

    if (fs.existsSync(imagePath)) {
      console.log('PDF converted to image successfully:', imagePath);
      return imagePath;
    } else {
      throw new Error('Image conversion failed - file not found');
    }
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}

/**
 * Encode image to base64
 */
function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Use OpenAI Vision API to extract invoice information
 */
async function extractInvoiceDataWithAI(imagePath) {
  try {
    console.log('Analyzing invoice with OpenAI Vision...');

    const base64Image = encodeImageToBase64(imagePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert invoice data extractor. Please analyze this invoice/document image and extract the following information:

1. Invoice Number (may also be labeled as: Invoice #, Invoice No, INV, Bill Number, etc.)
2. Client Order Number (may also be labeled as: PO Number, Purchase Order, Client PO, Order Number, P.O. #, etc.)
3. Total Amount Excluding GST/Tax (may be labeled as: Subtotal, Amount Ex GST, Net Amount, Pre-tax Total, etc.)
   - Extract the amount BEFORE GST/tax is added
   - Return as a number without currency symbols
   - If there's a "Total Ex GST" or "Subtotal" field, use that
   - If only "Total Inc GST" is available, calculate: Total Inc GST / 1.10 (assuming 10% GST)

Return the extracted information in JSON format with the following structure:
{
  "invoiceNumber": "extracted value or null if not found",
  "clientOrderNumber": "extracted value or null if not found",
  "totalAmountExGST": "numeric value or null if not found",
  "confidence": {
    "invoiceNumber": "high/medium/low/none",
    "clientOrderNumber": "high/medium/low/none",
    "totalAmountExGST": "high/medium/low/none"
  },
  "notes": "any relevant notes about the extraction"
}

IMPORTANT:
- Be precise and extract the exact values as they appear
- For totalAmountExGST, return only the numeric value (e.g., "989.40" not "$989.40")
- If a field is not found, set it to null
- Indicate confidence level based on clarity and certainty
- Look carefully for alternative labels (PO#, Order No., Subtotal, etc.)`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for more consistent extraction
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Clean up temp image
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('Cleaned up temporary image');
    }

    return {
      invoiceNumber: result.invoiceNumber,
      clientOrderNumber: result.clientOrderNumber,
      totalAmountExGST: result.totalAmountExGST,
      confidence: result.confidence || {
        invoiceNumber: result.invoiceNumber ? 'high' : 'none',
        clientOrderNumber: result.clientOrderNumber ? 'high' : 'none',
        totalAmountExGST: result.totalAmountExGST ? 'high' : 'none'
      },
      notes: result.notes || '',
      aiModel: 'gpt-4o',
      extractionMethod: 'vision-api'
    };
  } catch (error) {
    console.error('Error in AI extraction:', error);
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

/**
 * Extract invoice data using OpenAI text API (no image needed)
 */
async function extractInvoiceDataWithText(pdfText) {
  try {
    console.log('Analyzing invoice text with OpenAI...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are an expert invoice data extractor. Please analyze this invoice text and extract the following information:

1. Invoice Number (may also be labeled as: Invoice #, Invoice No, INV, Bill Number, etc.)
2. Client Order Number (may also be labeled as: PO Number, Purchase Order, Client PO, Order Number, P.O. #, etc.)
3. Total Amount Excluding GST/Tax (may be labeled as: Subtotal, Amount Ex GST, Net Amount, Pre-tax Total, etc.)
   - Extract the amount BEFORE GST/tax is added
   - Return as a number without currency symbols
   - If there's a "Total Ex GST" or "Subtotal" field, use that
   - If only "Total Inc GST" is available, calculate: Total Inc GST / 1.15 (assuming 15% GST)

Return the extracted information in JSON format with the following structure:
{
  "invoiceNumber": "extracted value or null if not found",
  "clientOrderNumber": "extracted value or null if not found",
  "totalAmountExGST": "numeric value or null if not found",
  "confidence": {
    "invoiceNumber": "high/medium/low/none",
    "clientOrderNumber": "high/medium/low/none",
    "totalAmountExGST": "high/medium/low/none"
  }
}

IMPORTANT: Return ONLY the JSON object, no additional text.

Invoice text:
${pdfText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI response:', content);

    const extractedData = JSON.parse(content);

    return {
      invoiceNumber: extractedData.invoiceNumber || null,
      clientOrderNumber: extractedData.clientOrderNumber || null,
      totalAmountExGST: extractedData.totalAmountExGST || null,
      confidence: extractedData.confidence || {},
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error in extractInvoiceDataWithText:', error);
    throw new Error(`OpenAI text analysis failed: ${error.message}`);
  }
}

/**
 * Extract invoice data from image using OpenAI Vision API
 */
export async function extractInvoiceDataFromImage(imagePath) {
  try {
    console.log('Analyzing invoice image with OpenAI Vision...');

    const base64Image = encodeImageToBase64(imagePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert invoice data extractor. Please analyze this invoice/document image and extract the following information:

1. Invoice Number (may also be labeled as: Invoice #, Invoice No, INV, Bill Number, etc.)
2. Client Order Number (may also be labeled as: PO Number, Purchase Order, Client PO, Order Number, P.O. #, etc.)
3. Total Amount Excluding GST/Tax (may be labeled as: Subtotal, Amount Ex GST, Net Amount, Pre-tax Total, etc.)
   - Extract the amount BEFORE GST/tax is added
   - Return as a number without currency symbols
   - If there's a "Total Ex GST" or "Subtotal" field, use that
   - If only "Total Inc GST" is available, calculate: Total Inc GST / 1.15 (assuming 15% GST)

Return the extracted information in JSON format with the following structure:
{
  "invoiceNumber": "extracted value or null if not found",
  "clientOrderNumber": "extracted value or null if not found",
  "totalAmountExGST": "numeric value or null if not found",
  "confidence": {
    "invoiceNumber": "high/medium/low/none",
    "clientOrderNumber": "high/medium/low/none",
    "totalAmountExGST": "high/medium/low/none"
  },
  "notes": "any relevant notes about the extraction"
}

IMPORTANT:
- Be precise and extract the exact values as they appear
- For totalAmountExGST, return only the numeric value (e.g., "989.40" not "$989.40")
- If a field is not found, set it to null
- Indicate confidence level based on clarity and certainty
- Look carefully for alternative labels (PO#, Order No., Subtotal, etc.)`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for more consistent extraction
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI Vision response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      invoiceNumber: result.invoiceNumber,
      clientOrderNumber: result.clientOrderNumber,
      totalAmountExGST: result.totalAmountExGST,
      confidence: result.confidence || {
        invoiceNumber: result.invoiceNumber ? 'high' : 'none',
        clientOrderNumber: result.clientOrderNumber ? 'high' : 'none',
        totalAmountExGST: result.totalAmountExGST ? 'high' : 'none'
      },
      notes: result.notes || '',
      aiModel: 'gpt-4o-mini',
      extractionMethod: 'vision-api-image'
    };
  } catch (error) {
    console.error('Error in image AI extraction:', error);
    throw new Error(`Image AI extraction failed: ${error.message}`);
  }
}

/**
 * Main function to process PDF with AI
 */
export async function processPDFWithAI(pdfPath) {
  try {
    console.log('Starting AI-powered PDF processing...');

    // Try text-based extraction first (doesn't require poppler)
    try {
      // Import pdf-parse to extract text
      const { default: pdfParse } = await import('pdf-parse');
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);

      console.log('PDF text extracted, sending to OpenAI...');
      const result = await extractInvoiceDataWithText(pdfData.text);

      console.log('AI text processing completed successfully:', result);
      return result;
    } catch (textError) {
      console.log('Text-based extraction failed, trying image-based...', textError.message);

      // Fallback to image-based extraction if text fails
      const imagePath = await pdfToImage(pdfPath);
      const result = await extractInvoiceDataWithAI(imagePath);

      console.log('AI image processing completed successfully:', result);
      return result;
    }
  } catch (error) {
    console.error('Error in processPDFWithAI:', error);
    throw new Error(`AI PDF processing failed: ${error.message}`);
  }
}
