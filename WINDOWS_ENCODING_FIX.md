# Windows 乱码问题解决方案

## 问题描述

在 Windows 系统上运行 `update-extension.bat` 时，可能会看到中文字符显示为乱码。

![乱码示例](https://user-images.githubusercontent.com/example/garbled-text.png)

## 原因

Windows 命令提示符（CMD）的默认编码与脚本文件编码不匹配，导致中文字符无法正确显示。

## 解决方案

### 方案 1: 使用英文版脚本（推荐）✅

我们提供了一个完全英文的版本，不会有任何编码问题：

**下载并运行：**
```
update-extension-en.bat
```

功能完全相同，只是界面改为英文：
- `[1/5] Downloading...` 下载中
- `[2/5] Cleaning old version...` 清理旧版本
- `[3/5] Extracting files...` 解压文件
- `[4/5] Verifying...` 验证安装
- `[5/5] Opening Chrome...` 打开 Chrome

### 方案 2: 修改系统编码设置

**临时方案（只对当前窗口有效）：**

1. 打开命令提示符（CMD）
2. 运行以下命令：
   ```batch
   chcp 65001
   ```
3. 然后再运行脚本：
   ```batch
   update-extension.bat
   ```

**永久方案（修改系统设置）：**

1. 打开"设置" → "时间和语言" → "语言"
2. 点击"管理语言设置"
3. 点击"更改系统区域设置"
4. 勾选"Beta 版：使用 Unicode UTF-8 提供全球语言支持"
5. 重启电脑

⚠️ **注意**：修改系统编码可能影响某些旧程序，请谨慎操作。

### 方案 3: 使用 PowerShell

PowerShell 对 UTF-8 支持更好。右键点击脚本选择"使用 PowerShell 运行"。

或者在 PowerShell 中运行：
```powershell
.\update-extension.bat
```

### 方案 4: 使用 Windows Terminal

Windows 11 或安装了 Windows Terminal 的 Windows 10：

1. 打开 Windows Terminal
2. 运行脚本：
   ```
   .\update-extension.bat
   ```

Windows Terminal 默认支持 UTF-8，不会出现乱码。

## 快速对照表

| 方案 | 难度 | 推荐度 | 说明 |
|------|------|--------|------|
| **英文版脚本** | ⭐ | ⭐⭐⭐⭐⭐ | 最简单，无需任何设置 |
| PowerShell | ⭐⭐ | ⭐⭐⭐⭐ | 右键点击即可 |
| Windows Terminal | ⭐⭐ | ⭐⭐⭐⭐ | 需要安装，但体验最好 |
| 临时修改编码 | ⭐⭐⭐ | ⭐⭐⭐ | 每次都要手动设置 |
| 永久修改编码 | ⭐⭐⭐⭐ | ⭐⭐ | 可能影响其他程序 |

## 重要提示

**乱码不影响脚本功能！**

即使看到乱码，脚本仍然会：
- ✅ 正确下载扩展包
- ✅ 正确解压文件
- ✅ 正确打开 Chrome
- ✅ 正确复制路径到剪贴板

只是界面显示不美观而已，不影响实际使用。

## 两个版本的对比

### 中文版 (update-extension.bat)
```
============================================
  Invoice Automation - 一键更新
  版本: v1.4.3
============================================

[1/5] 下载 v1.4.3...
✓ 下载完成

[2/5] 清理旧版本...
✓ 已清理旧版本
```

### 英文版 (update-extension-en.bat)
```
============================================
  Invoice Automation - One-Click Update
  Version: v1.4.3
============================================

[1/5] Downloading v1.4.3...
[OK] Download complete

[2/5] Cleaning old version...
[OK] Old version removed
```

## 下载地址

**GitHub Release**: https://github.com/jundongGit/PO-workflow/releases/latest

提供的文件：
- `update-extension.bat` - 中文版（可能乱码）
- `update-extension-en.bat` - 英文版（无编码问题）✅
- `update-extension.sh` - Mac/Linux 版

## 获取帮助

如果仍然有问题，请在 GitHub 提交 Issue：
https://github.com/jundongGit/PO-workflow/issues

---

**建议**：Windows 用户直接使用 `update-extension-en.bat` 英文版，简单又可靠！
