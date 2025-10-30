# Invoice Automation Chrome Extension

AI-powered invoice processing and Procore automation directly in your browser.

## ✨ Features

### 🚀 **Multiple PDF Upload Methods**
- **Popup Interface**: Click extension icon and upload
- **Drag & Drop**: Drag PDF directly to popup window
- **Right-Click Menu**: Right-click PDF link and process
- **Page Integration**: (Coming soon) Floating button on Procore pages

### 🤖 **AI-Powered Recognition**
- **OpenAI GPT-4o Vision**: Intelligent document analysis
- **High Accuracy**: Automatically extracts:
  - Invoice Number
  - Client Order Number
  - Total Amount (Ex GST)
- **Confidence Levels**: Visual indicators for data quality
- **Manual Correction**: Edit any field before automation

### 🔄 **Procore Automation**
- **Direct DOM Manipulation**: No external browser needed
- **Smart Project Search**: Finds projects by Client Order Number
- **Auto-Fill Forms**: Updates PO fields automatically
- **Session Persistence**: Works with existing Procore login

### 💾 **Lightweight & Fast**
- **2-5MB Extension**: vs 200MB Electron app
- **Browser-Native**: No installation required
- **Auto-Updates**: Chrome handles updates automatically
- **Cross-Platform**: Windows, Mac, Linux

## 📦 Installation

### Method 1: Automated Install (Recommended)

**Windows:**
```batch
1. Download the extension package
2. Double-click install.bat
3. Follow on-screen instructions
```

**Mac/Linux:**
```bash
1. Download the extension package
2. chmod +x install.sh
3. ./install.sh
4. Follow on-screen instructions
```

### Method 2: Manual Install

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Done! Extension icon will appear in toolbar

## 🎯 Usage

### Step 1: Upload PDF Invoice

**Option A: Popup**
1. Click extension icon in Chrome toolbar
2. Click "Choose PDF File" or drag PDF into window
3. Wait for processing

**Option B: Right-Click**
1. Right-click any PDF link on a webpage
2. Select "Process with Invoice Automation"
3. Automatic processing starts

### Step 2: Review Recognition Results

- **Green checkmark**: High confidence, ready to use
- **Yellow warning**: Medium confidence, recommend review
- **Red alert**: Low confidence, please verify carefully

Edit any field by clicking "Edit Information"

### Step 3: Start Automation

1. Click "Start Automation" button
2. Chrome will navigate to Procore (or use existing tab)
3. Watch as fields are filled automatically
4. Verify and save manually when complete

## 🔧 Configuration

### Backend API Setup

The extension requires a backend API for AI processing.

#### Deploy to Vercel (Free):

```bash
# Navigate to backend directory
cd chrome-extension-backend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
npm install
vercel --prod

# Add OpenAI API key
vercel env add OPENAI_API_KEY
# Paste your key, select all environments

# Redeploy
vercel --prod
```

#### Update Extension:

After deploying, update the API URL in:
```
extension/background/service-worker.js
```

Change line 7:
```javascript
const CONFIG = {
  API_URL: 'https://your-project.vercel.app/api'
};
```

Then reload extension in `chrome://extensions/`

### OpenAI API Key

Get your API key:
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Add to Vercel environment variables

**Cost**: ~$0.01 per invoice analysis

## 📊 Architecture

```
Chrome Extension
├── Popup (React-like UI)
│   ├── PDF Upload
│   ├── Progress Display
│   └── Results Form
│
├── Background Service Worker
│   ├── API Communication
│   ├── Context Menus
│   └── State Management
│
├── Content Script (Procore)
│   ├── DOM Automation
│   ├── Form Filling
│   └── Progress Overlay
│
└── PDF Processor (PDF.js)
    ├── PDF to Image
    ├── Base64 Encoding
    └── Compression

Cloud Backend (Vercel)
└── Serverless API
    ├── Image Analysis
    ├── OpenAI Integration
    └── CORS Handling
```

## 🗂️ Project Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Main UI
│   ├── popup.css             # Styles
│   └── popup.js              # UI logic
├── background/
│   └── service-worker.js     # Background processes
├── content-scripts/
│   └── procore-automation.js # Page automation
├── lib/
│   └── pdf-processor.js      # PDF handling
└── styles/
    └── content.css           # Injected styles

chrome-extension-backend/
├── api/
│   └── analyze.js            # AI analysis endpoint
├── package.json
└── vercel.json               # Deployment config

chrome-extension-installer/
├── install.bat               # Windows installer
├── install.sh                # Mac/Linux installer
└── README.txt                # User guide
```

## 🔍 Troubleshooting

### Extension Not Loading

**Symptoms**: Extension doesn't appear after install

**Solutions**:
1. Refresh `chrome://extensions/` page
2. Check that "Developer mode" is ON
3. Look for error messages in extension details
4. Try removing and re-adding extension

### AI Recognition Fails

**Symptoms**: "API request failed" error

**Solutions**:
1. Check internet connection
2. Verify backend API is deployed and running
3. Check API URL in `service-worker.js`
4. Verify OpenAI API key is set in Vercel
5. Check Vercel logs: `vercel logs`

### Automation Fails

**Symptoms**: Fields not filled on Procore page

**Solutions**:
1. Ensure you're logged into Procore
2. Verify Client Order Number is correct
3. Check browser console for errors (F12)
4. Try refreshing Procore page
5. Complete remaining steps manually

### PDF Upload Fails

**Symptoms**: "Failed to process PDF"

**Solutions**:
1. Check PDF file size (<20MB recommended)
2. Ensure PDF is not corrupted
3. Try another PDF file
4. Check browser console for errors

## 🆚 Comparison: Chrome Extension vs Electron App

| Feature | Chrome Extension | Electron App |
|---------|-----------------|--------------|
| **Installation** | 30 seconds | 5 minutes |
| **File Size** | 2-5MB | 200-300MB |
| **Updates** | Automatic | Manual download |
| **Startup Time** | Instant | 10-30 seconds |
| **Memory Usage** | <50MB | 200-500MB |
| **Cross-Platform** | Native | Needs separate builds |
| **Distribution** | Single package | OS-specific files |
| **User Experience** | Integrated | Standalone app |

## 📝 Development

### Running Locally

```bash
# Load extension in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select extension folder

# Run backend locally
cd chrome-extension-backend
npm install
vercel dev
# API at http://localhost:3000
```

### Making Changes

1. Edit extension files
2. Go to `chrome://extensions/`
3. Click reload icon on extension card
4. Test changes

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Background**: chrome://extensions/ → "Service worker" link
- **Content Script**: F12 on Procore page
- **API**: Check Vercel logs

## 🛣️ Roadmap

### v1.1 (Next)
- [ ] Floating upload button on Procore pages
- [ ] Batch processing multiple PDFs
- [ ] Processing history with search
- [ ] Settings page for API configuration

### v1.2
- [ ] Support for additional invoice formats
- [ ] Export data to Excel/CSV
- [ ] Keyboard shortcuts
- [ ] Dark mode

### v2.0
- [ ] Chrome Web Store publication
- [ ] Auto-update from store
- [ ] User analytics dashboard
- [ ] Multi-language support

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

- **Email**: support@your-company.com
- **Issues**: Create issue in repository
- **Documentation**: https://docs.your-company.com

## 🎉 Credits

- **AI**: OpenAI GPT-4o
- **PDF Processing**: PDF.js by Mozilla
- **Deployment**: Vercel
- **Design**: Custom UI

---

**Version**: 1.0.0
**Release Date**: 2025-10-29
**Status**: ✅ Production Ready
