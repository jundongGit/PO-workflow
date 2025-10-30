/**
 * Vercel Serverless Function for Invoice Analysis
 * Endpoint: POST /api/analyze
 */

import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).setHeaders(corsHeaders).json({
      error: 'Method not allowed'
    });
  }

  try {
    const { image, fileName } = req.body;

    if (!image) {
      return res.status(400).setHeaders(corsHeaders).json({
        error: 'Image data is required'
      });
    }

    console.log(`Analyzing invoice: ${fileName || 'unknown'}`);

    // Call OpenAI Vision API
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
                url: image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Return result
    return res.status(200).setHeaders(corsHeaders).json({
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
      extractionMethod: 'vision-api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);

    return res.status(500).setHeaders(corsHeaders).json({
      error: 'Failed to analyze invoice',
      message: error.message
    });
  }
}
