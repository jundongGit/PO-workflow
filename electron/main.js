const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

// Log file variables (will be initialized after app is ready)
let logDir = null;
let logFile = null;
let logInitialized = false;

// Initialize logging after app is ready
function initializeLogging() {
  if (logInitialized) return;

  try {
    logDir = path.join(app.getPath('userData'), 'logs');
    logFile = path.join(logDir, 'app.log');

    // Create logs directory
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    logInitialized = true;
    log('[Electron] Logging initialized');
  } catch (err) {
    console.error('[Electron] Failed to initialize logging:', err);
  }
}

// Log function that writes to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);

  if (logInitialized && logFile) {
    try {
      fs.appendFileSync(logFile, logMessage);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}

function showError(title, message) {
  log(`ERROR: ${title} - ${message}`);

  const fullMessage = logFile
    ? `${message}\n\n日志文件位置:\n${logFile}`
    : message;

  dialog.showErrorBox(title, fullMessage);
}

// Helper function to check if server is ready
function checkServerReady(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });

      req.on('error', (err) => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Server on port ${port} failed to start within ${timeout}ms`));
        } else {
          setTimeout(check, 1000);
        }
      });

      req.end();
    };

    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const startURL = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, '../client/build/index.html')}`;

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    // In production, server is in extraResources
    const isPackaged = app.isPackaged;
    const resourcesPath = isPackaged ? process.resourcesPath : path.join(__dirname, '..');

    const serverPath = isPackaged
      ? path.join(resourcesPath, 'server/src/index.js')
      : path.join(__dirname, '../server/src/index.js');

    const serverCwd = isPackaged
      ? path.join(resourcesPath, 'server')
      : path.join(__dirname, '../server');

    log('[Electron] Starting backend server...');
    log(`[Electron] Server path: ${serverPath}`);
    log(`[Electron] Server cwd: ${serverCwd}`);
    log(`[Electron] isPackaged: ${isPackaged}`);
    log(`[Electron] resourcesPath: ${resourcesPath}`);

    // Check if server files exist
    if (!fs.existsSync(serverPath)) {
      const error = `Server file not found: ${serverPath}`;
      log(`[Electron ERROR] ${error}`);
      showError('启动失败', `找不到服务器文件:\n${serverPath}`);
      reject(new Error(error));
      return;
    }

    serverProcess = spawn('node', [serverPath], {
      cwd: serverCwd,
      env: {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production'
      },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      log(`[Backend] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      log(`[Backend Error] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (error) => {
      log(`[Electron] Failed to start backend: ${error.message}`);
      showError('后端服务启动失败', `无法启动后端服务:\n${error.message}`);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      log(`[Electron] Backend process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        showError('后端服务异常退出', `后端服务退出，代码: ${code}`);
      }
    });

    // Wait for backend server to be ready
    checkServerReady(BACKEND_PORT, 30000)
      .then(() => {
        log('[Electron] Backend server is ready');
        resolve();
      })
      .catch((err) => {
        log(`[Electron] Backend server failed to start: ${err.message}`);
        showError('服务器启动超时', `后端服务器在30秒内未能启动:\n${err.message}`);
        reject(err);
      });
  });
}

app.on('ready', async () => {
  // Initialize logging first
  initializeLogging();

  log('[Electron] Application starting...');
  log(`[Electron] userData path: ${app.getPath('userData')}`);
  log(`[Electron] Log file: ${logFile}`);

  try {
    // Start backend server first
    await startBackendServer();

    // If in development, wait for frontend dev server
    if (isDev) {
      log('[Electron] Waiting for frontend dev server...');
      await checkServerReady(FRONTEND_PORT, 60000);
      log('[Electron] Frontend dev server is ready');
    }

    // Create Electron window
    createWindow();
    log('[Electron] Application started successfully');
  } catch (error) {
    log(`[Electron] Failed to start application: ${error.message}`);
    log(`[Electron] Error stack: ${error.stack}`);
    showError('应用启动失败', `Invoice Automation启动失败:\n\n${error.message}`);
    setTimeout(() => app.quit(), 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    log('[Electron] Stopping backend server...');
    serverProcess.kill('SIGTERM');

    // Force kill after 3 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        log('[Electron] Force killing backend server...');
        serverProcess.kill('SIGKILL');
      }
    }, 3000);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`[Electron] Uncaught exception: ${error.message}`);
  log(`[Electron] Stack: ${error.stack}`);
  showError('程序异常', `发生未捕获的异常:\n${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`[Electron] Unhandled rejection: ${reason}`);
  showError('Promise异常', `发生未处理的Promise拒绝:\n${reason}`);
});
