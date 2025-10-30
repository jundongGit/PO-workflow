# Invoice Automation API Backend

Serverless backend API for the Invoice Automation Chrome Extension.

## 🚀 Quick Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
cd chrome-extension-backend
npm install
vercel --prod
```

### 4. Set Environment Variables

After deploying, add your OpenAI API key:

```bash
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted
# Select: Production, Preview, Development (all)
```

### 5. Redeploy

```bash
vercel --prod
```

## 📡 API Endpoints

### POST /api/analyze

Analyze invoice image and extract data using OpenAI Vision API.

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "fileName": "invoice.pdf"
}
```

**Response:**
```json
{
  "invoiceNumber": "38183",
  "clientOrderNumber": "3scott-06",
  "totalAmountExGST": "989.40",
  "confidence": {
    "invoiceNumber": "high",
    "clientOrderNumber": "high",
    "totalAmountExGST": "high"
  },
  "notes": "...",
  "aiModel": "gpt-4o",
  "extractionMethod": "vision-api",
  "timestamp": "2025-10-29T..."
}
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
vercel dev

# API will be available at http://localhost:3000/api/analyze
```

## 📝 Update Chrome Extension

After deploying, update the API URL in your Chrome extension:

1. Open `chrome-extension/background/service-worker.js`
2. Update `CONFIG.API_URL` to your Vercel deployment URL:
   ```javascript
   const CONFIG = {
     API_URL: 'https://your-project.vercel.app/api'
   };
   ```

## 💰 Cost Estimation

- **Vercel**: Free tier includes 100GB bandwidth/month
- **OpenAI GPT-4o**: ~$0.01 per invoice analysis
- **Expected**: <$10/month for 500 invoices

## 🔒 Security

- API key stored as Vercel environment variable
- CORS enabled for Chrome extension
- No data persistence (stateless)

## 📊 Monitoring

View logs in Vercel dashboard:
```bash
vercel logs
```
