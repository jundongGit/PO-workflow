/**
 * 简单的 HTTP 更新服务器
 * 用于在开发机上托管更新文件
 *
 * 使用方法：
 * 1. 将打包好的更新文件放到 releases/ 目录
 * 2. 运行: node update-server.js
 * 3. 远程用户配置更新地址为: http://你的IP:8080
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.UPDATE_SERVER_PORT || 8080;
const RELEASES_DIR = path.join(__dirname, 'releases');

// 确保 releases 目录存在
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR);
  console.log('Created releases directory');
}

// CORS 支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 获取最新版本信息
app.get('/api/latest', (req, res) => {
  try {
    const versionPath = path.join(__dirname, 'VERSION.json');
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

      // 查找最新的发布包
      const files = fs.readdirSync(RELEASES_DIR);
      const latestZip = files
        .filter(f => f.endsWith('.zip'))
        .sort()
        .reverse()[0];

      res.json({
        success: true,
        version: versionData.version,
        releaseDate: versionData.releaseDate,
        description: versionData.description,
        changes: versionData.changes,
        downloadUrl: latestZip
          ? `http://${req.get('host')}/download/${latestZip}`
          : null,
        fileSize: latestZip
          ? fs.statSync(path.join(RELEASES_DIR, latestZip)).size
          : 0
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Version file not found'
      });
    }
  } catch (error) {
    console.error('Error reading version:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get version info',
      details: error.message
    });
  }
});

// 提供文件下载
app.use('/download', express.static(RELEASES_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.zip')) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
  }
}));

// 获取所有可用版本
app.get('/api/releases', (req, res) => {
  try {
    const files = fs.readdirSync(RELEASES_DIR);
    const releases = files
      .filter(f => f.endsWith('.zip'))
      .map(file => {
        const stats = fs.statSync(path.join(RELEASES_DIR, file));
        return {
          filename: file,
          version: file.replace('po-workflow-v', '').replace('.zip', ''),
          size: stats.size,
          date: stats.mtime,
          downloadUrl: `http://localhost:${PORT}/download/${file}`
        };
      })
      .sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      releases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PO-Workflow Update Server',
    uptime: process.uptime()
  });
});

// 网页界面
app.get('/', (req, res) => {
  const versionPath = path.join(__dirname, 'VERSION.json');
  let versionInfo = { version: 'Unknown' };

  if (fs.existsSync(versionPath)) {
    versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  }

  const files = fs.existsSync(RELEASES_DIR)
    ? fs.readdirSync(RELEASES_DIR).filter(f => f.endsWith('.zip'))
    : [];

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>PO-Workflow 更新服务器</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .version {
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .files {
      margin-top: 20px;
    }
    .file-item {
      background: #f9f9f9;
      padding: 10px;
      margin: 10px 0;
      border-left: 4px solid #4CAF50;
      border-radius: 3px;
    }
    .file-item a {
      color: #4CAF50;
      text-decoration: none;
      font-weight: bold;
    }
    .file-item a:hover {
      text-decoration: underline;
    }
    .info {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 PO-Workflow 更新服务器</h1>

    <div class="version">
      <h2>当前版本: ${versionInfo.version}</h2>
      <p>发布日期: ${versionInfo.releaseDate || 'N/A'}</p>
    </div>

    <div class="info">
      <h3>📋 如何使用</h3>
      <p>远程用户需要配置更新地址为:</p>
      <code>http://${req.get('host')}</code>

      <p style="margin-top: 15px;">API 端点:</p>
      <ul>
        <li><code>GET /api/latest</code> - 获取最新版本信息</li>
        <li><code>GET /api/releases</code> - 获取所有可用版本</li>
        <li><code>GET /download/文件名</code> - 下载更新包</li>
      </ul>
    </div>

    <div class="files">
      <h3>📦 可用的更新包 (${files.length})</h3>
      ${files.length === 0
        ? '<p>暂无更新包。请将打包的 .zip 文件放到 releases/ 目录。</p>'
        : files.map(file => {
            const stats = fs.statSync(path.join(RELEASES_DIR, file));
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            return `
              <div class="file-item">
                <a href="/download/${file}" download>${file}</a>
                <span style="color: #666; margin-left: 10px;">
                  (${sizeMB} MB - ${stats.mtime.toLocaleString('zh-CN')})
                </span>
              </div>
            `;
          }).join('')
      }
    </div>

    <div class="info" style="margin-top: 30px; background: #fff3e0;">
      <h3>⚠️ 注意事项</h3>
      <ul>
        <li>确保防火墙允许 ${PORT} 端口访问</li>
        <li>保持此服务器运行，远程用户才能检查更新</li>
        <li>更新包命名格式: <code>po-workflow-v1.2.0.zip</code></li>
        <li>每次发布新版本后，更新 VERSION.json 文件</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     PO-Workflow 更新服务器已启动                      ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  本地地址: http://localhost:${PORT}                    ║`);
  console.log(`║  网络地址: http://你的IP:${PORT}                      ║`);
  console.log('║                                                        ║');
  console.log(`║  发布目录: ${RELEASES_DIR.substring(0, 35)}... ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('提示:');
  console.log('- 将打包的更新文件放到 releases/ 目录');
  console.log('- 访问 http://localhost:' + PORT + ' 查看网页界面');
  console.log('- 按 Ctrl+C 停止服务器');
  console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭更新服务器...');
  process.exit(0);
});
