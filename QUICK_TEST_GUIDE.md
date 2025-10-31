# 快速测试指南

## 🎯 5分钟完成测试

### ✅ 测试清单

- [ ] 安装扩展
- [ ] 配置 API Key
- [ ] 测试 API 连接
- [ ] 测试更新检查
- [ ] 测试发票处理

## 📝 详细步骤

### 1️⃣ 安装扩展（1分钟）

```bash
# 解压已打包的文件
unzip InvoiceAutomation-ChromeExtension-v1.2.0.zip -d test-extension

# 在 Chrome 中加载
# 1. chrome://extensions/
# 2. 开启"开发者模式"
# 3. "加载已解压的扩展程序"
# 4. 选择 test-extension/extension
```

**预期结果：**
- ✅ 扩展成功加载
- ✅ 工具栏出现扩展图标
- ✅ 显示欢迎通知

### 2️⃣ 打开设置页面（30秒）

**方法 A：通过弹窗**
1. 点击扩展图标
2. 点击底部「⚙️ 设置」

**方法 B：通过扩展管理**
1. chrome://extensions/
2. 找到扩展 → 详情
3. 扩展程序选项

**预期结果：**
- ✅ 打开新标签页
- ✅ 显示设置页面
- ✅ 显示当前版本 v1.2.0

### 3️⃣ 配置 API Key（1分钟）

1. 在「OpenAI API Key」输入您的 API Key
   ```
   sk-your-api-key-here
   ```

2. （可选）点击眼睛图标查看/隐藏

3. 保持「API 地址」为默认值
   ```
   https://api.openai.com/v1/chat/completions
   ```

4. 点击「🧪 测试连接」

**预期结果：**
- ✅ 按钮显示"测试中..."
- ✅ 1-3秒后显示"✅ API 连接测试成功！"
- ✅ 顶部显示绿色成功提示

**如果失败：**
- ❌ "Incorrect API key" → 检查 API Key 是否正确
- ❌ "Failed to fetch" → 检查网络连接
- ❌ 超时 → 可能需要使用代理

### 4️⃣ 保存配置（30秒）

1. 确认 API Key 正确
2. 确认「启用自动更新检查」已勾选
3. 点击「💾 保存设置」

**预期结果：**
- ✅ 显示"✅ 设置保存成功！"
- ✅ 1秒后显示"正在重新加载扩展..."
- ✅ 2秒后扩展自动重新加载
- ✅ 页面可能自动刷新

### 5️⃣ 测试更新检查（1分钟）

1. 重新打开设置页面
2. 向下滚动到「更新设置」部分
3. 查看「当前版本」显示 v1.2.0
4. 点击「🔄 立即检查更新」

**预期结果：**
- ✅ 按钮显示"检查中..."
- ✅ 1-2秒后显示结果
- ✅ 因为已是最新版，显示"✅ 当前已是最新版本 v1.2.0"
- ✅ 「最后检查时间」更新为"刚刚"

### 6️⃣ 测试发票处理（2分钟）

1. 关闭设置页面
2. 点击扩展图标打开弹窗
3. 准备一张测试发票 PDF
4. 点击「选择PDF文件」或拖拽文件

**预期结果：**
- ✅ 显示文件名
- ✅ 显示处理进度
- ✅ 显示各个步骤（读取PDF → 转换图片 → AI识别 → 完成）
- ✅ 显示识别结果
- ✅ 可以编辑和自动填表

**如果失败：**
- ❌ "未配置 API Key" → 返回设置页面重新保存
- ❌ "API 调用失败" → 检查 API Key 余额
- ❌ 识别不准确 → PDF 质量问题，属正常

## 🧪 模拟旧版本测试更新通知

想要测试更新通知功能？

### 步骤

1. **降级版本号**
   ```bash
   cd test-extension/extension
   vim manifest.json
   # 将 "version": "1.2.0" 改为 "version": "1.0.0"
   ```

2. **重新加载扩展**
   - chrome://extensions/
   - 找到扩展，点击刷新图标

3. **触发更新检查**
   - 点击扩展图标
   - 应该自动显示更新横幅：「🎉 发现新版本 v1.2.0！」

4. **点击"下载更新"**
   - 打开 GitHub Release 页面
   - 可以下载新版本

5. **恢复版本号**
   ```bash
   vim manifest.json
   # 改回 "version": "1.2.0"
   ```

## ✅ 完整测试结果

测试完成后，您应该确认：

- ✅ 扩展成功安装并显示图标
- ✅ 设置页面可以正常打开
- ✅ API Key 可以配置和测试
- ✅ 配置可以保存并生效
- ✅ 更新检查功能正常工作
- ✅ 发票处理功能可用
- ✅ 更新通知功能正常（如果测试了）

## 📊 性能指标

正常情况下的性能：

| 操作 | 预期时间 |
|------|----------|
| 安装扩展 | < 10秒 |
| 打开设置页面 | < 1秒 |
| API 连接测试 | 1-3秒 |
| 保存配置 | < 1秒 |
| 检查更新 | 1-2秒 |
| 处理单页 PDF | 5-10秒 |
| 处理多页 PDF | 10-30秒 |

## 🐛 常见测试问题

### 问题 1：扩展加载失败

**现象：**
```
Manifest file is missing or unreadable
```

**解决：**
- 确认解压后的目录结构正确
- manifest.json 应该在 extension 文件夹根目录

### 问题 2：设置页面空白

**现象：**
- 打开设置页面但什么都不显示

**解决：**
- 打开 DevTools (F12)
- 查看 Console 是否有 JavaScript 错误
- 检查 settings.html、settings.css、settings.js 是否都存在

### 问题 3：API 连接超时

**现象：**
```
❌ 连接失败: The operation was aborted due to timeout
```

**解决：**
- 检查网络连接
- 尝试使用 VPN 或代理
- 增加超时时间（需要修改代码）

### 问题 4：保存后设置丢失

**现象：**
- 保存配置后重新打开，API Key 不见了

**解决：**
- 检查是否有多个扩展实例
- 清除扩展数据重新配置：
  ```javascript
  chrome.storage.local.clear()
  ```

## 📸 测试截图

完成测试后，建议截图保存以下页面：

1. **扩展管理页面** (chrome://extensions/)
   - 显示扩展已启用
   - 显示版本号 v1.2.0

2. **设置页面**
   - API Key 已配置（遮盖密码）
   - 测试连接成功

3. **扩展弹窗**
   - 显示更新横幅（如果测试了更新功能）
   - 显示版本信息

4. **发票识别结果**
   - 成功识别的发票信息
   - 置信度显示

## 🎉 下一步

测试通过后：

1. ✅ 准备部署到生产环境
2. ✅ 创建使用文档给团队
3. ✅ 设置 API 使用监控
4. ✅ 准备发布到 Chrome Web Store（可选）

## 💡 测试技巧

### 快速测试命令

```bash
# 清除扩展数据
chrome.storage.local.clear()

# 查看已保存的配置
chrome.storage.local.get(null, (items) => console.log(items))

# 手动触发更新检查
chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' })

# 查看扩展版本
chrome.runtime.getManifest().version
```

### 调试技巧

1. **查看扩展日志**
   - chrome://extensions/
   - 点击扩展的「背景页」或「service worker」
   - 打开 DevTools

2. **查看 Storage 数据**
   - DevTools → Application → Storage → Local Storage
   - 查看 chrome-extension://[扩展ID]

3. **网络请求监控**
   - DevTools → Network
   - 过滤 "openai.com" 查看 API 请求

---

**准备好了吗？** 开始测试吧！🚀
