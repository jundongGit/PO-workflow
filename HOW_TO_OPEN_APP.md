# 如何打开 Invoice Automation 应用

## macOS 安全提示解决方法

当你首次打开应用时，macOS 可能会显示安全警告："Apple 无法验证 'Invoice Automation'"。

### 方法 1：右键打开（推荐）

1. 找到应用程序图标
2. **按住 Control 键点击**（或右键点击）应用图标
3. 从菜单中选择 **"打开"**
4. 在弹出的对话框中点击 **"打开"** 按钮
5. 应用将正常启动，之后可以像平常一样双击打开

### 方法 2：系统偏好设置

1. 尝试双击打开应用（会显示警告）
2. 打开 **系统偏好设置** > **安全性与隐私**
3. 在 **"通用"** 标签页底部，你会看到一条消息关于 "Invoice Automation"
4. 点击 **"仍要打开"** 按钮
5. 在确认对话框中再次点击 **"打开"**

### 方法 3：移除隔离属性（终端命令）

打开终端并执行以下命令：

```bash
# 如果应用在 Applications 文件夹
xattr -cr /Applications/Invoice\ Automation.app

# 如果应用在 dist 文件夹
xattr -cr /Users/jundong/Documents/FREEAI/Dev/PO-workflow/dist/mac-arm64/Invoice\ Automation.app
```

然后就可以正常双击打开应用了。

### 方法 4：系统级别允许（不推荐用于生产环境）

```bash
# 允许任何来源的应用（需要管理员权限）
sudo spctl --master-disable

# 使用完后建议恢复安全设置
sudo spctl --master-enable
```

## 为什么会出现这个警告？

这个警告出现是因为应用没有经过 Apple 的公证（notarization）流程。公证需要：
1. Apple Developer 账户（年费 $99 USD）
2. 代码签名证书
3. 提交应用到 Apple 进行安全扫描

对于个人使用或内部分发，使用上述方法 1-3 即可正常使用应用。

## 应用功能

成功打开后，应用将：
- 自动启动后端服务器（端口 3001）
- 自动加载前端界面（窗口大小 1400x900）
- 提供完整的 Invoice Automation 功能
- 支持 AI 驱动的发票处理和 Procore 自动化

## 技术说明

- 应用已使用 Apple Development 证书签名
- 包含完整的 Node.js 后端和 React 前端
- 所有依赖已打包，无需额外安装
