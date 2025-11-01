const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let mainWindow;
let backendProcess;
let frontendProcess;

// 后端服务器端口
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

// 检测是否为开发模式
const isDev = !app.isPackaged;

// 启动后端服务器
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');

    const serverPath = isDev
      ? path.join(__dirname, '../server')
      : path.join(process.resourcesPath, 'server');

    backendProcess = spawn('npm', ['start'], {
      cwd: serverPath,
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    // 等待后端服务器启动
    waitOn({
      resources: [`http://localhost:${BACKEND_PORT}/api/health`],
      timeout: 60000,
      interval: 1000
    }).then(() => {
      console.log('Backend server started successfully');
      resolve();
    }).catch((error) => {
      console.error('Backend server failed to start:', error);
      reject(error);
    });
  });
}

// 启动前端服务器（开发模式）或使用打包后的文件（生产模式）
function startFrontend() {
  if (isDev) {
    return new Promise((resolve, reject) => {
      console.log('Starting frontend development server...');

      const clientPath = path.join(__dirname, '../client');

      frontendProcess = spawn('npm', ['start'], {
        cwd: clientPath,
        shell: true,
        env: {
          ...process.env,
          BROWSER: 'none'
        }
      });

      frontendProcess.stdout.on('data', (data) => {
        console.log(`Frontend: ${data}`);
      });

      frontendProcess.stderr.on('data', (data) => {
        console.error(`Frontend Error: ${data}`);
      });

      frontendProcess.on('error', (error) => {
        console.error('Failed to start frontend:', error);
        reject(error);
      });

      // 等待前端服务器启动
      waitOn({
        resources: [`http://localhost:${FRONTEND_PORT}`],
        timeout: 120000,
        interval: 1000
      }).then(() => {
        console.log('Frontend server started successfully');
        resolve();
      }).catch((error) => {
        console.error('Frontend server failed to start:', error);
        reject(error);
      });
    });
  } else {
    // 生产模式：直接加载打包后的文件
    return Promise.resolve();
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Invoice Automation',
    show: false
  });

  // 加载应用
  const startUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, '../client/build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 开发模式下打开开发工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 创建菜单
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'Shift+CmdOrCtrl+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    }
  ];

  // macOS 特殊菜单
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { label: 'About ' + app.name, role: 'about' },
        { type: 'separator' },
        { label: 'Hide ' + app.name, accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 清理进程
function cleanup() {
  console.log('Cleaning up processes...');

  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill();
    backendProcess = null;
  }

  if (frontendProcess) {
    console.log('Killing frontend process...');
    frontendProcess.kill();
    frontendProcess = null;
  }
}

// 应用初始化
app.whenReady().then(async () => {
  try {
    // 启动后端服务器
    await startBackend();

    // 启动前端服务器（仅开发模式）
    if (isDev) {
      await startFrontend();
    }

    // 创建窗口
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时清理
app.on('before-quit', () => {
  cleanup();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup();
  app.quit();
});
