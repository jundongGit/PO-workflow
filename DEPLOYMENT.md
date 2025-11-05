# PO-Workflow v1.1.0 - Deployment Package

## Package Contents

- `server/` - Backend server (Node.js)
- `client/` - Frontend static files (pre-built React app)
- `quick-start.bat` - Windows quick start script
- Documentation files (README, setup guides, etc.)

## Installation

### Requirements
- Windows 10/11 (64-bit)
- Node.js 14.0.0 or higher

### Quick Start

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment:**
   - Copy `server/.env.example` to `server/.env`
   - Edit `.env` and add your API keys and credentials

3. **Launch the application:**
   - Double-click `quick-start.bat`, or
   - Run `node server/src/index.js`

4. **Access the application:**
   - Open browser: http://localhost:3001
   - Configure settings through the web interface

## What's New in v1.1.0

- Enhanced PO number matching with intelligent leading zero handling
- Improved search functionality for Procore commitments
- Better error handling and logging
- Updated version display in UI

## Support

For issues or questions, refer to:
- README.md - General documentation
- 安装说明.md - Installation guide (Chinese)
- SETUP_GUIDE.md - Detailed setup instructions

## Version

Built: 05/11/2025, 16:54:29
Version: 1.1.0
