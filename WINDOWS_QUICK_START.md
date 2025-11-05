# Windows 快速启动指南

> 最简单的 Windows 启动方式（3 分钟上手）

---

## 🎯 三步启动

### 第 1 步: 安装 Node.js

如果还没有安装 Node.js：

1. 访问 https://nodejs.org/
2. 下载并安装 LTS 版本
3. 安装时勾选 "Add to PATH"

验证安装:
```cmd
node --version
npm --version
```

---

### 第 2 步: 配置环境变量

1. 进入项目目录:
   ```cmd
   cd PO-workflow
   ```

2. 复制配置文件:
   ```cmd
   cd server
   copy .env.example .env
   ```

3. 编辑 `.env` 文件:
   ```cmd
   notepad .env
   ```

4. 添加必要的配置:
   ```env
   OPENAI_API_KEY=your-api-key-here
   PROCORE_EMAIL=your-email@example.com
   PROCORE_PASSWORD=your-password
   ```

5. 保存并关闭

---

### 第 3 步: 启动项目

#### 方式 A: 双击启动（最简单）

**双击运行** `quick-start.bat` 文件

等待服务启动完成后，打开浏览器访问: **http://localhost:3000**

---

#### 方式 B: PowerShell 启动（推荐）

1. 右键点击 `quick-start.ps1`
2. 选择 "使用 PowerShell 运行"

或者在 PowerShell 中执行:
```powershell
.\quick-start.ps1
```

> 如果遇到权限错误，以管理员身份运行 PowerShell 并执行:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

#### 方式 C: 手动启动

**打开两个命令提示符窗口：**

**窗口 1 - 后端**:
```cmd
cd PO-workflow\server
node src\index.js
```

**窗口 2 - 前端**:
```cmd
cd PO-workflow\client
set BROWSER=none
npm start
```

---

## ✅ 验证安装

打开浏览器访问:
- **前端**: http://localhost:3000
- **后端健康检查**: http://localhost:3001/api/health

---

## 🛑 停止服务

- **批处理脚本**: 关闭命令提示符窗口
- **PowerShell 脚本**: 按 `Ctrl + C`
- **手动启动**: 在每个窗口按 `Ctrl + C`

---

## 🔧 常见问题

### 问题: 端口被占用

**快速解决**:
```cmd
netstat -ano | findstr :3000
taskkill /F /PID <显示的PID>
```

### 问题: npm 安装失败

**切换镜像源**:
```cmd
npm config set registry https://registry.npmmirror.com
```

### 问题: PowerShell 无法运行脚本

**以管理员身份运行 PowerShell**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 完整文档

详细部署指南、故障排查和高级配置，请参阅: **[WINDOWS_DEPLOYMENT.md](WINDOWS_DEPLOYMENT.md)**

---

## 📞 需要帮助？

- 查看后端终端日志
- 打开浏览器 F12 查看前端控制台
- 参考完整文档: [WINDOWS_DEPLOYMENT.md](WINDOWS_DEPLOYMENT.md)

---

**快速启动完成！现在你可以开始使用 Invoice Automation 了！** 🎉
