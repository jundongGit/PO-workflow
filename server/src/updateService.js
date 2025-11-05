import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置你的 GitHub 仓库信息
const GITHUB_REPO = 'jundonggit/po-workflow'; // 替换为你的仓库
const UPDATE_CHECK_INTERVAL = 3600000; // 1小时检查一次

/**
 * 从 GitHub API 获取最新版本信息
 */
export async function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': 'PO-Workflow-Update-Checker'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const release = JSON.parse(data);

          if (release.message === 'Not Found') {
            resolve(null);
            return;
          }

          resolve({
            version: release.tag_name.replace('v', ''),
            name: release.name,
            releaseDate: release.published_at,
            notes: release.body,
            downloadUrl: release.assets[0]?.browser_download_url,
            zipballUrl: release.zipball_url
          });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 获取当前版本
 */
export function getCurrentVersion() {
  try {
    const versionPath = path.join(__dirname, '../../VERSION.json');
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      return versionData.version;
    }
  } catch (error) {
    console.error('Failed to read current version:', error);
  }
  return '1.0.0';
}

/**
 * 比较版本号
 */
export function compareVersions(current, latest) {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return 1;
    if (latestParts[i] < currentParts[i]) return -1;
  }
  return 0;
}

/**
 * 检查是否有新版本
 */
export async function hasNewVersion() {
  try {
    const currentVersion = getCurrentVersion();
    const latestRelease = await checkForUpdates();

    if (!latestRelease) {
      return { hasUpdate: false };
    }

    const comparison = compareVersions(currentVersion, latestRelease.version);

    return {
      hasUpdate: comparison < 0,
      currentVersion,
      latestVersion: latestRelease.version,
      releaseInfo: latestRelease
    };
  } catch (error) {
    console.error('Update check failed:', error);
    return { hasUpdate: false, error: error.message };
  }
}

/**
 * 下载更新文件
 */
export async function downloadUpdate(downloadUrl, savePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(savePath);

    https.get(downloadUrl, (response) => {
      // 处理重定向
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadUpdate(response.headers.location, savePath)
          .then(resolve)
          .catch(reject);
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = (downloadedSize / totalSize * 100).toFixed(2);
        console.log(`Download progress: ${progress}%`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(savePath);
      });
    }).on('error', (error) => {
      fs.unlink(savePath, () => {});
      reject(error);
    });
  });
}

/**
 * 启动后台更新检查
 */
export function startUpdateChecker(callback) {
  // 立即检查一次
  hasNewVersion().then(callback);

  // 定期检查
  setInterval(() => {
    hasNewVersion().then(callback);
  }, UPDATE_CHECK_INTERVAL);
}
