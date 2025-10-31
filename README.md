# Invoice Automation for Procore - Web Application

AI-powered invoice processing and Procore automation system with Playwright browser automation.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Quick Start

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. Configure environment
cd server
cp .env.example .env
# Edit .env: Add OPENAI_API_KEY, PROCORE_EMAIL, PROCORE_PASSWORD

# 3. Start backend (Terminal 1)
cd server && npm start

# 4. Start frontend (Terminal 2)
cd client && npm start

# 5. Open browser
# http://localhost:3000
```

---

## Features

- **AI-Powered OCR**: Extract invoice information using OpenAI GPT-4o Vision API
- **Playwright Automation**: Complete browser automation with persistent sessions  
- **Real-time Logs**: Live automation logs streamed via Server-Sent Events (SSE)
- **Persistent Browser**: Reuses browser sessions to avoid repeated logins
- **Auto-Login**: Automatic Procore login with credentials from .env
- **PDF Preview**: Preview uploaded invoices before processing
- **Manual Override**: Edit extracted information before automation

---

## System Architecture

```
┌────────────────────────────────┐
│   React Frontend (Port 3000)   │
│  - PDF Upload UI               │
│  - Information Confirmation    │
│  - Real-time Log Display       │
└──────────────┬─────────────────┘
               │ HTTP/SSE
               ▼
┌────────────────────────────────┐
│  Express Backend (Port 3001)   │
│  - PDF Processing API          │
│  - OpenAI Integration          │
│  - Playwright Engine           │
└──────────────┬─────────────────┘
               │ Browser Control
               ▼
┌────────────────────────────────┐
│  Playwright (Chromium Browser) │
│  - Select Project              │
│  - Navigate to Commitments     │
│  - Find and Open PO            │
│  - Update PO Fields            │
└────────────────────────────────┘
```

---

## Project Structure

```
PO-workflow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main component
│   │   ├── App.css        # Styles
│   │   └── index.js       # Entry point
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js               # API server
│   │   ├── playwrightAutomation.js # Playwright automation (1538 lines)
│   │   ├── aiProcessor.js         # OpenAI GPT-4o integration
│   │   └── pdfProcessor.js        # PDF to image conversion
│   ├── .env                       # Environment variables
│   └── package.json
│
├── uploads/                # Temporary PDF storage
├── document/               # Permanent document storage
├── .browser-data/          # Playwright browser session
├── docker-compose.yml      # Docker deployment
└── README.md               # This file
```

---

## Usage

### 1. Upload PDF Invoice

1. Open http://localhost:3000
2. Click or drag-and-drop a PDF invoice
3. Wait for AI processing (10-30 seconds)

### 2. Confirm Information

Review and edit extracted data:
- **Invoice Number**: e.g., 335397
- **Client Order Number**: e.g., KIWIWASTE-006
- **Total Amount Ex GST**: e.g., 1,137.81

### 3. Start Automation

1. Click **"✅ Confirm and Start Automation"**
2. Watch real-time logs at the bottom
3. Observe Playwright browser window (Chromium)

### 4. Verify Results

The automation will:
- ✅ Select the correct project
- ✅ Navigate to Commitments page
- ✅ Find and open the PO
- ✅ Update Title with Invoice Number
- ✅ Set Status to "Received"
- ✅ Upload the PDF file
- ✅ Add a new line in Schedule of Values

**Note**: Changes are NOT saved automatically. Review and click Save manually.

---

## Automation Steps

### Step 1: Select Project
- Smart typing: stops when unique result found
- Duration: ~5-10 seconds

### Step 2: Navigate to Commitments
- Find and click "Commitments" link
- Duration: ~3-5 seconds

### Step 3: Find and Open PO
- Try 3 matching strategies:
  1. Complete number match
  2. Number variants (006, 06, 6)
  3. Project name + number fuzzy match
- Duration: ~3-5 seconds

### Step 4: Update PO Fields
- Update Title, Status, upload PDF
- Add Schedule of Values line
- Duration: ~15-30 seconds

**Total Duration**: 30-60 seconds per invoice

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload-pdf` | POST | Upload PDF and extract information |
| `/api/automate` | POST | Start Procore automation |
| `/api/automation-logs` | GET | Real-time log stream (SSE) |
| `/api/browser/close` | POST | Close Playwright browser |
| `/api/files` | GET | List uploaded files |
| `/api/health` | GET | Health check |

---

## Configuration

### Environment Variables (server/.env)

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-xxxxx

# Application Settings
PORT=3001
NODE_ENV=development

# Procore Login Credentials
PROCORE_EMAIL=your-email@example.com
PROCORE_PASSWORD=your-password
```

---

## Technologies

- **Frontend**: React 19, React Scripts 5
- **Backend**: Express 4, Node.js ES Modules
- **Automation**: Playwright 1.40
- **AI**: OpenAI GPT-4o Vision API
- **PDF Processing**: pdf-poppler, Sharp
- **Real-time**: Server-Sent Events (SSE)

---

## Troubleshooting

### Issue: "Failed to process PDF"
**Solution**: Check OpenAI API key in `.env` and ensure PDF is valid

### Issue: "Could not find project"
**Solution**: Verify Client Order Number format (e.g., "KIWIWASTE-006")

### Issue: Browser not opening
**Solution**: `cd server && npx playwright install chromium`

### Issue: "Login page detected"
**Solution**: Auto-login will use credentials from `.env`. For 2FA, manually verify in browser (5 min timeout)

### Issue: "Could not find PO"
**Solution**: Check Number column format in Commitments page

---

## Documentation

- **Testing Guide**: `WEB_VERSION_TEST_GUIDE.md`
- **Deployment**: `DEPLOYMENT.md`
- **Docker**: `docker-compose.yml`

---

## License

MIT

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-31  
**Status**: Production Ready
