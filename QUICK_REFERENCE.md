# Chrome 扩展在线更新 - 快速参考

## 重要链接（收藏这个！）

### GitHub 仓库
```
https://github.com/jundongGit/PO-workflow
```

### version.json (更新检查)
```
https://raw.githubusercontent.com/jundongGit/PO-workflow/main/chrome-extension/version.json
```

### 当前 Release
```
https://github.com/jundongGit/PO-workflow/releases/tag/v1.2.0
```

### 下载链接
```
https://github.com/jundongGit/PO-workflow/releases/download/v1.2.0/InvoiceAutomation-ChromeExtension-v1.2.0.zip
```

---

## 快速命令

### 验证部署
```bash
bash test-deployment.sh
```

### 检查 version.json
```bash
curl -s "https://raw.githubusercontent.com/jundongGit/PO-workflow/main/chrome-extension/version.json" | jq .
```

### 查看 Release
```bash
gh release view v1.2.0
```

### 查看所有 Release
```bash
gh release list
```

---

## 发布新版本（5步）

### 1. 更新版本号
编辑以下文件：
- `chrome-extension/manifest.json` → "version": "1.3.0"
- `chrome-extension/version.json` → "version": "1.3.0"
- `chrome-extension/CHANGELOG.md` → 添加新版本日志

### 2. 打包扩展
```bash
bash package-extension.sh
```

### 3. 提交代码
```bash
git add .
git commit -m "feat: v1.3.0 - 新功能描述"
git push origin main
```

### 4. 创建标签
```bash
git tag v1.3.0
git push origin v1.3.0
```

### 5. 创建 Release
```bash
gh release create v1.3.0 \
  --title "v1.3.0 - 新功能标题" \
  --notes "Release notes 内容" \
  InvoiceAutomation-ChromeExtension-v1.3.0.zip
```

---

## 在线更新工作原理

```
扩展启动
    ↓
等待 1 分钟
    ↓
检查更新 (访问 version.json)
    ↓
比较版本号
    ↓
[如果有新版本]
    ↓
显示通知 + Badge
    ↓
用户点击"立即下载"
    ↓
跳转到 Release 页面
```

### 自动检查时机
- 扩展启动后 1 分钟
- 每 24 小时检查一次

### 手动检查
- 打开扩展弹窗
- 点击底部"检查更新"链接

---

## 配置 API Key

### 方法 1: 直接编辑（快速）
1. 找到扩展安装位置
   - Chrome: `chrome://extensions/` → 开发者模式 → 查看扩展详情
2. 编辑 `background/service-worker.js`
3. 第 10 行：`OPENAI_API_KEY: 'your-api-key'`
4. 重新加载扩展

### 方法 2: chrome.storage（推荐）
未来版本可实现设置界面，让用户通过 UI 配置。

---

## 故障排查

### 问题：扩展检查不到新版本
**解决**：
```bash
# 1. 验证 version.json
curl -s "https://raw.githubusercontent.com/jundongGit/PO-workflow/main/chrome-extension/version.json"

# 2. 清除缓存
chrome://extensions/ → 移除扩展 → 重新安装

# 3. 等待或手动检查
等待24小时或点击"检查更新"
```

### 问题：下载链接 404
**解决**：
```bash
# 1. 检查 Release 是否存在
gh release view v1.2.0

# 2. 检查 ZIP 是否已上传
gh release view v1.2.0 --json assets

# 3. 重新上传（如果需要）
gh release upload v1.2.0 InvoiceAutomation-ChromeExtension-v1.2.0.zip
```

### 问题：version.json 返回 404
**解决**：
```bash
# 1. 检查文件是否在正确位置
ls -la chrome-extension/version.json

# 2. 确认已推送到 GitHub
git log --oneline --follow chrome-extension/version.json

# 3. 检查分支
git branch  # 确保在 main 分支

# 4. 等待 GitHub 更新缓存（最多5分钟）
```

---

## 测试清单

部署新版本后，依次检查：

- [ ] version.json 可访问
- [ ] 版本号正确更新
- [ ] Release 已创建
- [ ] ZIP 文件已上传
- [ ] 下载链接有效
- [ ] 安装测试通过
- [ ] 更新检查功能正常

**快速验证**：
```bash
bash test-deployment.sh
```

---

## 安全注意事项

1. **不要提交 API Key**
   - 源代码中 API Key 已设为空字符串
   - 用户需要自行配置

2. **不要提交打包文件**
   - `.gitignore` 已排除打包目录
   - 仅通过 Release 分发

3. **定期轮换密钥**
   - 如果 API Key 泄露，立即重新生成

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `chrome-extension/version.json` | 更新检查配置 |
| `chrome-extension/manifest.json` | 扩展清单（含版本号） |
| `chrome-extension/CHANGELOG.md` | 版本历史 |
| `package-extension.sh` | 打包脚本 |
| `test-deployment.sh` | 部署验证脚本 |
| `DEPLOYMENT_COMPLETE.md` | 完整部署文档 |
| `QUICK_REFERENCE.md` | 本文档 |

---

## 有用的 Git 命令

### 查看提交历史
```bash
git log --oneline -10
```

### 查看标签
```bash
git tag -l
```

### 删除标签（如果需要）
```bash
git tag -d v1.2.0                    # 本地删除
git push origin --delete tag v1.2.0  # 远程删除
```

### 撤销最后一次提交
```bash
git reset --soft HEAD~1  # 保留更改
git reset --hard HEAD~1  # 丢弃更改
```

---

## 联系方式

- **GitHub**: [@jundongGit](https://github.com/jundongGit)
- **Issues**: https://github.com/jundongGit/PO-workflow/issues
- **Discussions**: https://github.com/jundongGit/PO-workflow/discussions

---

**收藏本文档，随时查阅！** 📌
