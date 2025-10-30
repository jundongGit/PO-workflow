# PO-Workflow 部署文档

## 项目信息

- **项目名称**: PO-Workflow (Invoice PDF自动化处理系统)
- **域名**: workflow.cloud01.top
- **服务器IP**: 13.236.4.130
- **服务器用户**: ubuntu
- **SSH密钥**: /Users/jundong/Documents/FREEAI/Dev/Website_WWH.pem

## 端口分配

**重要**: 端口 3001 已被现有项目 `vcwwh-backend` 使用，因此本项目使用以下端口：

- **后端端口**: 3002 (映射容器内部 3001)
- **前端端口**: 3003 (映射容器内部 80)
- **Nginx Proxy Manager**: 80, 81, 443 (已有服务)

## 服务器现有项目（不要影响）

- vcwwh-backend (端口 3001)
- passport_ocr (端口 3004-3005)
- easyclaim (端口 3666)
- autoclip (端口 8001)
- coupon (MongoDB 27017)
- busroute (端口 3008, 3010-3011, 3080)
- nginx-proxy-manager (端口 80, 81, 443)

## 快速部署

### 1. 自动部署（推荐）

```bash
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow
./deploy.sh
```

部署脚本会自动完成:
- 创建服务器目录
- 上传项目文件
- 构建 Docker 镜像
- 启动容器
- 显示部署状态

### 2. 手动部署

#### 2.1 准备环境变量

确保 `server/.env` 文件存在并包含:
```
OPENAI_API_KEY=your_openai_api_key_here
```

#### 2.2 上传文件到服务器

```bash
rsync -avz --progress \
  -e "ssh -i /Users/jundong/Documents/FREEAI/Dev/Website_WWH.pem -o StrictHostKeyChecking=no" \
  --exclude 'node_modules' --exclude '.git' --exclude 'uploads/*' --exclude 'document/*' \
  ./ ubuntu@13.236.4.130:/home/ubuntu/projects/PO-workflow/
```

#### 2.3 SSH 到服务器并启动

```bash
ssh -i /Users/jundong/Documents/FREEAI/Dev/Website_WWH.pem ubuntu@13.236.4.130

cd /home/ubuntu/projects/PO-workflow
mkdir -p uploads document
docker-compose up -d --build
```

#### 2.4 查看容器状态

```bash
docker ps | grep po-workflow
docker logs po-workflow-backend
docker logs po-workflow-frontend
```

## 配置 Nginx Proxy Manager

### 步骤 1: 访问 NPM 管理界面

打开浏览器访问: `http://13.236.4.130:81`

### 步骤 2: 添加 Proxy Host

1. 点击 "Proxy Hosts" -> "Add Proxy Host"
2. 填写以下信息:

**Details 标签:**
- Domain Names: `workflow.cloud01.top`
- Scheme: `http`
- Forward Hostname / IP: `13.236.4.130` (或 `po-workflow-frontend`)
- Forward Port: `3003`
- Cache Assets: ✓
- Block Common Exploits: ✓
- Websockets Support: ✓

**SSL 标签:**
- SSL Certificate: Request a new SSL Certificate
- Force SSL: ✓
- HTTP/2 Support: ✓
- HSTS Enabled: ✓
- Email: 您的邮箱
- Agree to Let's Encrypt Terms: ✓

**Advanced 标签:**
添加以下自定义 Nginx 配置以支持 SSE（Server-Sent Events）:

```nginx
# Proxy API requests to backend
location /api/ {
    proxy_pass http://13.236.4.130:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # SSE support
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400s;
    chunked_transfer_encoding on;
}
```

3. 点击 "Save"

### 步骤 3: 等待 SSL 证书

等待 Let's Encrypt 证书自动申请和配置（通常 1-2 分钟）。

## 验证部署

### 1. 检查服务健康

```bash
# 后端健康检查
curl http://13.236.4.130:3002/api/health

# 前端访问测试
curl http://13.236.4.130:3003/
```

### 2. 通过域名访问

打开浏览器访问: `https://workflow.cloud01.top`

### 3. 测试功能

1. 上传 PDF 文件
2. 检查 AI 提取结果
3. 确认信息并启动自动化
4. 观察实时日志

## Docker 架构

### 容器列表

1. **po-workflow-backend** (Node.js + Playwright + Poppler)
   - 内部端口: 3001
   - 外部端口: 3002
   - 功能: API 服务器、PDF 处理、浏览器自动化
   - 持久化数据: uploads/, document/, .browser-data/

2. **po-workflow-frontend** (Nginx + React Build)
   - 内部端口: 80
   - 外部端口: 3003
   - 功能: 静态文件服务、API 反向代理

### 数据持久化

以下目录被挂载为 Docker volumes：
- `./uploads` - 临时上传文件
- `./document` - 永久文档存储
- `./server/.browser-data` - Playwright 浏览器会话

## 常用命令

### 查看日志

```bash
# 实时日志
docker logs -f po-workflow-backend
docker logs -f po-workflow-frontend

# 最近 100 行
docker logs --tail 100 po-workflow-backend
```

### 重启服务

```bash
cd /home/ubuntu/projects/PO-workflow
docker-compose restart
```

### 停止服务

```bash
cd /home/ubuntu/projects/PO-workflow
docker-compose down
```

### 更新代码

```bash
# 在本地执行
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow
./deploy.sh
```

### 清理并重新构建

```bash
cd /home/ubuntu/projects/PO-workflow
docker-compose down
docker system prune -f
docker-compose up -d --build --force-recreate
```

## 故障排查

### 问题 1: 容器无法启动

```bash
# 检查容器状态
docker ps -a | grep po-workflow

# 查看详细日志
docker logs po-workflow-backend
docker logs po-workflow-frontend

# 检查端口占用
sudo netstat -tlnp | grep -E '3002|3003'
```

### 问题 2: 无法访问域名

1. 检查 DNS 解析:
   ```bash
   nslookup workflow.cloud01.top
   ```

2. 检查 NPM 配置:
   - 访问 `http://13.236.4.130:81`
   - 确认 proxy host 配置正确
   - 确认 SSL 证书状态

3. 检查防火墙:
   ```bash
   sudo ufw status
   ```

### 问题 3: 后端 API 错误

```bash
# 进入容器检查
docker exec -it po-workflow-backend /bin/sh

# 检查环境变量
docker exec po-workflow-backend printenv | grep OPENAI

# 检查文件权限
docker exec po-workflow-backend ls -la /app/uploads /app/document
```

### 问题 4: Playwright 浏览器问题

```bash
# 重新安装浏览器
docker exec po-workflow-backend npx playwright install chromium

# 检查浏览器路径
docker exec po-workflow-backend which chromium
```

## 安全注意事项

1. **环境变量**: OPENAI_API_KEY 通过 Docker 环境变量传递，不要提交到 Git
2. **SSH 密钥**: Website_WWH.pem 权限应为 400 或 600
3. **防火墙**: 仅开放必要端口 (80, 443, 81)
4. **SSL**: 强制使用 HTTPS，不允许 HTTP 访问
5. **文件上传**: 已限制 PDF 文件类型和 10MB 大小

## 监控和维护

### 定期检查

```bash
# 每周检查一次磁盘空间
df -h

# 清理旧的上传文件（保留最近7天）
find /home/ubuntu/projects/PO-workflow/uploads -type f -mtime +7 -delete

# 检查 Docker 资源使用
docker stats --no-stream
```

### 备份

```bash
# 备份文档文件夹
tar -czf po-workflow-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/projects/PO-workflow/document

# 备份数据库（如果将来使用）
# mysqldump -u user -p database > backup.sql
```

## 技术栈

- **前端**: React 18, Server-Sent Events (SSE)
- **后端**: Node.js 18, Express.js
- **自动化**: Playwright (Chromium headless)
- **AI**: OpenAI GPT-4 Vision API
- **PDF 处理**: poppler-utils (pdftoppm)
- **容器化**: Docker, Docker Compose
- **反向代理**: Nginx, Nginx Proxy Manager
- **SSL**: Let's Encrypt

## 支持

如有问题，请检查:
1. Docker 容器日志
2. Nginx Proxy Manager 日志
3. 服务器系统日志: `journalctl -xe`
4. 浏览器开发者工具 (Console, Network)

---

**最后更新**: 2025-10-27
**维护者**: jundong
