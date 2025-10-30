# 创建Windows便携版（傻瓜式一键运行）

## 🎯 目标
创建一个单一的 `.exe` 文件，用户双击即可使用，无需任何配置。

## 📦 方案：Electron Portable

### Step 1: 安装 electron-builder

```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow
npm install --save-dev electron-builder
```

### Step 2: 修改 package.json

已有配置，只需添加portable选项：

```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

### Step 3: 构建便携版

```bash
# 构建Windows便携版
npm run electron:build:win
```

输出文件：
```
dist/Invoice Automation 1.0.0.exe    （便携版，约150MB）
```

### Step 4: 分发给用户

**用户操作流程：**

1. **下载文件**
   ```
   Invoice Automation 1.0.0.exe
   ```

2. **双击运行**
   - 无需安装
   - 无需配置
   - 自动启动

3. **使用**
   - 上传PDF
   - AI识别
   - 一键自动化

**就这么简单！**

---

## ✨ 便携版优势

### vs 安装版
- ✅ 无需管理员权限
- ✅ 不写入注册表
- ✅ 可放U盘使用
- ✅ 删除即卸载

### vs Chrome扩展
- ✅ 无需安装Chrome
- ✅ 无需配置后端
- ✅ 无需联网部署
- ✅ 完全自包含

---

## 📋 完整构建步骤

### 1. 确保环境变量配置

编辑 `server/.env`:
```env
OPENAI_API_KEY=your_key_here
PROCORE_EMAIL=evelyn@maxion.co.nz
PROCORE_PASSWORD=Eve@Max1on
```

### 2. 构建前端

```bash
cd client
npm run build
```

### 3. 构建Electron应用

```bash
cd ..
npm run electron:build:win
```

### 4. 测试便携版

```bash
# 运行生成的exe文件
dist/Invoice\ Automation\ 1.0.0.exe
```

### 5. 分发

**方式A: 网盘分享**
- 上传到OneDrive/Google Drive
- 分享下载链接

**方式B: 公司内网**
- 放到文件服务器
- \\server\software\InvoiceAutomation.exe

**方式C: USB分发**
- 复制到U盘
- 直接发放

---

## 📝 用户使用说明（极简版）

创建一个 `使用说明.txt` 放在exe同目录：

```
======================================
Invoice Automation - 使用说明
======================================

【快速开始】
1. 双击 "Invoice Automation 1.0.0.exe"
2. 上传PDF发票
3. 点击"开始自动化"
4. 完成！

【首次使用】
- 第一次打开Procore网站时需要手动登录
- 登录信息会自动保存
- 以后无需重复登录

【常见问题】
Q: 显示"API错误"？
A: 检查网络连接，确保能访问OpenAI

Q: 自动化失败？
A: 检查Client Order Number是否正确

Q: 如何卸载？
A: 直接删除exe文件即可

【联系支持】
Email: support@your-company.com
电话: xxx-xxxx-xxxx
```

---

## 🔧 高级配置（可选）

### 创建快捷方式

用户可以创建桌面快捷方式：
1. 右键拖拽exe到桌面
2. 选择"创建快捷方式"

### 设置自动启动

如需开机自动启动：
1. Win+R 输入 `shell:startup`
2. 创建快捷方式到此文件夹

### 多用户使用

每个用户的数据独立存储在：
```
C:\Users\[用户名]\AppData\Roaming\Invoice Automation\
```

---

## 📊 文件大小优化

### 当前大小：~150MB

包含：
- Electron运行时: ~80MB
- Chromium浏览器: ~50MB
- Node.js运行时: ~10MB
- 应用代码: ~10MB

### 可选优化：

**方法1: 使用7-Zip自解压**
```bash
# 压缩exe文件
7z a -sfx InvoiceAutomation-Portable.exe "Invoice Automation 1.0.0.exe"

# 生成约60MB的自解压文件
```

**方法2: 在线下载运行时**
- 首次运行时下载Electron运行时
- 减少初始下载大小到~10MB
- 但增加首次启动时间

**建议：保持当前方案**
- 150MB对现代网络来说很小
- 一次下载，永久使用
- 无需额外配置

---

## ✅ 发布检查清单

构建前确认：

- [ ] .env 文件已配置
- [ ] OpenAI API Key有效
- [ ] Procore登录凭据正确
- [ ] 前端已构建 (npm run build)
- [ ] 图标文件已准备 (assets/icon.ico)
- [ ] package.json版本号已更新
- [ ] README和使用说明已准备

构建后测试：

- [ ] exe文件可以正常运行
- [ ] PDF上传功能正常
- [ ] AI识别功能正常
- [ ] Procore自动化正常
- [ ] 首次登录流程顺畅
- [ ] 错误提示友好
- [ ] 可以正常退出

---

## 🚀 立即构建

**完整构建命令：**

```bash
# 1. 进入项目目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow

# 2. 构建前端
cd client && npm run build && cd ..

# 3. 构建Electron Windows便携版
npm run electron:build:win

# 4. 输出文件位置
echo "便携版已生成: dist/Invoice Automation 1.0.0.exe"
```

**分发给用户：**

1. 复制文件到U盘或上传到网盘
2. 发送下载链接给用户
3. 告诉用户：下载后双击即可使用

**就是这么简单！** 🎉
