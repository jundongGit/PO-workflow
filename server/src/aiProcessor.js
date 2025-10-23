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
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert invoice data extractor. Please analyze this invoice/document image and extract the following information:

1. Invoice Number (may also be labeled as: Invoice #, Invoice No, INV, Bill Number, etc.)
2. Client Order Number (may also be labeled as: PO Number, Purchase Order, Client PO, Order Number, P.O. #, etc.)

Return the extracted information in JSON format with the following structure:
{
  "invoiceNumber": "extracted value or null if not found",
  "clientOrderNumber": "extracted value or null if not found",
  "confidence": {
    "invoiceNumber": "high/medium/low/none",
    "clientOrderNumber": "high/medium/low/none"
  },
  "notes": "any relevant notes about the extraction"
}

IMPORTANT:
- Be precise and extract the exact values as they appear
- If a field is not found, set it to null
- Indicate confidence level based on clarity and certainty
- Look carefully for alternative labels (PO#, Order No., etc.)`
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
      confidence: result.confidence || {
        invoiceNumber: result.invoiceNumber ? 'high' : 'none',
        clientOrderNumber: result.clientOrderNumber ? 'high' : 'none'
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
 * Main function to process PDF with AI
 */
export async function processPDFWithAI(pdfPath) {
  try {
    console.log('Starting AI-powered PDF processing...');

    // Step 1: Convert PDF to image
    const imagePath = await pdfToImage(pdfPath);

    // Step 2: Extract data using OpenAI Vision
    const result = await extractInvoiceDataWithAI(imagePath);

    console.log('AI processing completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in processPDFWithAI:', error);
    throw new Error(`AI PDF processing failed: ${error.message}`);
  }
}
