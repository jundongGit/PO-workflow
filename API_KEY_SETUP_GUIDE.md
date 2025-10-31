# API Key 配置指南

## 📋 概述

现在扩展支持通过设置页面安全地配置 OpenAI API Key，无需修改源代码！

## 🚀 快速开始

### 第 1 步：安装扩展

```bash
# 解压安装包
unzip InvoiceAutomation-ChromeExtension-v1.2.0.zip -d InvoiceAutomation-v1.2.0

# 在 Chrome 中安装
# 1. 访问 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 InvoiceAutomation-v1.2.0/extension 文件夹
```

### 第 2 步：配置 API Key

安装后，有两种方式打开设置页面：

#### 方式 1：通过扩展弹窗

1. 点击扩展图标打开弹窗
2. 点击底部的「⚙️ 设置」链接
3. 自动打开设置页面

#### 方式 2：通过扩展管理页面

1. 访问 `chrome://extensions/`
2. 找到 "Invoice Automation for Procore"
3. 点击「详情」按钮
4. 点击「扩展程序选项」
5. 打开设置页面

### 第 3 步：输入 API Key

1. 在设置页面中找到「API 配置」部分
2. 在「OpenAI API Key」输入框中输入您的 API Key
   - 格式：`sk-...`
   - 点击眼睛图标可以显示/隐藏密码
3. （可选）自定义「API 地址」
   - 默认：`https://api.openai.com/v1/chat/completions`
   - 如果使用代理服务，可以修改为代理地址
4. 点击「🧪 测试连接」验证 API Key 是否有效
5. 点击「💾 保存设置」保存配置

### 第 4 步：开始使用

保存设置后，扩展会自动重新加载。现在可以：

1. 点击扩展图标
2. 上传 PDF 发票
3. AI 自动识别发票信息
4. 一键填写到 Procore

## 🔧 设置页面功能详解

### API 配置

| 字段 | 必填 | 说明 |
|------|------|------|
| OpenAI API Key | ✅ | 从 [OpenAI Platform](https://platform.openai.com/api-keys) 获取 |
| API 地址 | ⬜ | 默认使用 OpenAI 官方地址，可自定义 |

### 更新设置

| 功能 | 说明 |
|------|------|
| 启用自动更新检查 | 每24小时自动检查一次新版本 |
| 当前版本 | 显示已安装的扩展版本 |
| 最后检查时间 | 显示上次检查更新的时间 |
| 立即检查更新 | 手动检查是否有新版本 |

### 功能按钮

| 按钮 | 功能 |
|------|------|
| 🧪 测试连接 | 验证 API Key 和 API 地址是否正确 |
| 💾 保存设置 | 保存所有配置并重新加载扩展 |
| 🔄 立即检查更新 | 手动检查扩展更新 |

## 🧪 测试 API 配置

### 测试步骤

1. 打开设置页面
2. 输入 API Key
3. 点击「🧪 测试连接」
4. 等待测试结果

### 测试结果说明

**✅ 成功**
```
✅ API 连接测试成功！
```
说明 API Key 有效，可以正常使用。

**❌ 失败**
```
❌ API 测试失败: Incorrect API key provided
```
可能的原因：
- API Key 输入错误
- API Key 已过期
- API Key 权限不足
- 网络连接问题

**❌ 连接失败**
```
❌ 连接失败: Failed to fetch
```
可能的原因：
- 网络无法访问 OpenAI API
- API 地址配置错误
- 需要使用代理

## 🔐 安全性说明

### API Key 存储

- API Key 使用 Chrome 的 `chrome.storage.local` API 安全存储
- 数据仅保存在本地，不会上传到任何服务器
- 只有当前扩展可以访问存储的数据

### 显示/隐藏

- 输入框默认为密码类型（显示为 `••••••••`）
- 点击眼睛图标可以临时显示密码
- 关闭设置页面后自动隐藏

### 最佳实践

1. ✅ 使用专门的 API Key 用于此扩展
2. ✅ 定期轮换 API Key
3. ✅ 不要截图或分享包含 API Key 的设置页面
4. ❌ 不要在公共电脑上保存 API Key
5. ❌ 不要将 API Key 提交到代码仓库

## 🌐 使用代理服务

如果无法直接访问 OpenAI API，可以使用代理服务：

### 配置代理

1. 获取代理服务的 API 端点
   - 示例：`https://your-proxy.com/v1/chat/completions`
2. 在设置页面的「API 地址」中输入代理地址
3. 输入代理服务提供的 API Key
4. 点击「测试连接」验证
5. 保存设置

### 常见代理服务

- OpenAI 官方（默认）：`https://api.openai.com/v1/chat/completions`
- Azure OpenAI：`https://{your-resource}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2024-02-15-preview`
- 其他代理服务：根据服务商文档配置

## ❓ 常见问题

### Q1: 如何获取 OpenAI API Key？

**A**:
1. 访问 https://platform.openai.com/
2. 登录或注册账号
3. 进入 https://platform.openai.com/api-keys
4. 点击「Create new secret key」
5. 复制生成的 API Key（只显示一次！）

### Q2: API Key 会过期吗？

**A**: OpenAI API Key 默认不会过期，除非您手动删除。但建议：
- 定期轮换 API Key（如每3-6个月）
- 如果发现异常使用，立即重新生成

### Q3: 配置后还是提示「未配置 API Key」？

**A**: 检查以下几点：
1. 是否点击了「保存设置」按钮？
2. 是否等待扩展重新加载完成？
3. 尝试完全关闭并重新打开 Chrome
4. 检查 Chrome 控制台是否有错误信息

### Q4: 测试连接成功，但使用时失败？

**A**: 可能的原因：
1. API Key 余额不足
2. 达到 API 调用频率限制
3. 网络不稳定
4. PDF 文件过大导致超时

### Q5: 可以在多台电脑上使用同一个 API Key 吗？

**A**: 可以！但是：
- 所有设备共享 API 调用配额
- 需要在每台电脑上单独配置
- 建议使用 Chrome 同步功能（未来版本支持）

### Q6: 如何修改已保存的 API Key？

**A**:
1. 打开设置页面
2. 当前 API Key 会以密码形式显示
3. 直接输入新的 API Key
4. 点击「测试连接」验证新 Key
5. 点击「保存设置」

### Q7: 如何删除已保存的 API Key？

**A**:
```javascript
// 方法 1：通过设置页面
// 将 API Key 输入框清空后保存（会提示错误）

// 方法 2：通过 Chrome DevTools
chrome.storage.local.remove(['openai_api_key', 'openai_api_url']);

// 方法 3：卸载扩展
// 卸载扩展会自动清除所有数据
```

## 📊 使用监控

### 查看 API 使用情况

1. 访问 https://platform.openai.com/usage
2. 查看 API 调用次数和费用
3. 设置使用限额避免超支

### 估算成本

使用 GPT-4o 处理一张发票：
- 输入：约 1000 tokens（图片 + 提示词）
- 输出：约 200 tokens（JSON 结果）
- 成本：约 $0.01-0.02 USD/张

如果每天处理 50 张发票：
- 月成本：约 $15-30 USD

## 🔄 更新 API Key

当您需要更换 API Key 时（如 Key 泄露、定期轮换）：

### 步骤

1. **生成新的 API Key**
   - 访问 https://platform.openai.com/api-keys
   - 创建新的 API Key
   - 复制新 Key

2. **更新扩展配置**
   - 打开设置页面
   - 输入新的 API Key
   - 测试连接
   - 保存设置

3. **删除旧的 API Key**
   - 返回 OpenAI Platform
   - 删除旧的 API Key
   - 确保旧 Key 无法继续使用

## 🎓 进阶技巧

### 1. 使用环境变量（开发者）

如果您是开发者，可以通过环境变量配置默认 API Key：

```javascript
// 在 service-worker.js 中
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  // ...
};
```

### 2. 团队共享配置（企业用户）

对于企业用户，可以：
1. 使用企业统一的 OpenAI 账号
2. 创建组织级别的 API Key
3. 设置使用配额和监控
4. 定期审计 API 使用情况

### 3. 自动化测试

```javascript
// 使用 Playwright 自动测试 API 配置
test('Configure API Key', async ({ page }) => {
  await page.goto('chrome-extension://your-extension-id/settings.html');
  await page.fill('#apiKeyInput', 'sk-test-key');
  await page.click('#testApiBtn');
  await expect(page.locator('.status-message')).toContainText('成功');
});
```

## 📞 获取帮助

如果遇到问题：

1. **查看文档**
   - 本文档
   - DEPLOYMENT_COMPLETE.md
   - ONLINE_UPDATE_GUIDE.md

2. **检查日志**
   - 打开 Chrome DevTools (F12)
   - 查看 Console 标签
   - 查找错误信息

3. **提交反馈**
   - GitHub Issues: https://github.com/jundongGit/PO-workflow/issues
   - 提供详细的错误信息和截图

## ✨ 下一步

配置完成后，您可以：

1. ✅ 测试上传 PDF 发票
2. ✅ 验证 AI 识别准确性
3. ✅ 测试 Procore 自动填表
4. ✅ 开启自动更新检查
5. ✅ 推荐给团队使用

---

**需要帮助？** 查看完整文档或联系技术支持。
