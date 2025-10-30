#!/bin/bash

# PO-Workflow Deployment Script
# Domain: workflow.cloud01.top
# Server: 13.236.4.130

set -e

echo "========================================="
echo "  PO-Workflow 部署脚本"
echo "========================================="

# Configuration
SERVER_IP="13.236.4.130"
SERVER_USER="ubuntu"
SSH_KEY="/Users/jundong/Documents/FREEAI/Dev/Website_WWH.pem"
PROJECT_NAME="PO-workflow"
DEPLOY_DIR="/home/ubuntu/projects/${PROJECT_NAME}"
DOMAIN="workflow.cloud01.top"

# Backend port (3001 occupied by vcwwh-backend, using 3002)
BACKEND_PORT=3002
FRONTEND_PORT=3003

echo ""
echo "配置信息:"
echo "  服务器: ${SERVER_IP}"
echo "  域名: ${DOMAIN}"
echo "  后端端口: ${BACKEND_PORT} (内部3001)"
echo "  前端端口: ${FRONTEND_PORT}"
echo "  部署目录: ${DEPLOY_DIR}"
echo ""

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "错误: server/.env 文件不存在！"
    echo "请确保 server/.env 包含 OPENAI_API_KEY"
    exit 1
fi

echo "步骤 1: 准备部署文件..."
# Create .dockerignore if not exists
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
*.md
.DS_Store
.env.local
uploads/*
!uploads/.gitkeep
document/*
!document/.gitkeep
.browser-data
client/build
.playwright-mcp
test
*.log
EOF

echo "步骤 2: 连接服务器并创建目录..."
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
mkdir -p /home/ubuntu/projects/PO-workflow
ENDSSH

echo "步骤 3: 上传项目文件到服务器..."
rsync -avz --progress \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'uploads/*' \
  --exclude 'document/*' \
  --exclude '.browser-data' \
  --exclude 'client/build' \
  --exclude '.playwright-mcp' \
  --exclude 'test' \
  --exclude '*.log' \
  ./ "${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/"

echo "步骤 4: 在服务器上构建和启动 Docker 容器..."
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" << ENDSSH
cd ${DEPLOY_DIR}

# Create necessary directories
mkdir -p uploads document

# Check if containers exist and stop them
if docker ps -a | grep -q po-workflow; then
    echo "停止现有容器..."
    docker-compose down || true
fi

# Build and start containers
echo "构建并启动 Docker 容器..."
docker-compose up -d --build

# Wait for services to be healthy
echo "等待服务启动..."
sleep 10

# Check container status
echo ""
echo "容器状态:"
docker ps | grep po-workflow || echo "警告: 未找到运行中的容器"

# Check logs
echo ""
echo "后端日志 (最后 20 行):"
docker logs --tail 20 po-workflow-backend 2>&1 || echo "无法获取后端日志"

echo ""
echo "前端日志 (最后 20 行):"
docker logs --tail 20 po-workflow-frontend 2>&1 || echo "无法获取前端日志"
ENDSSH

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "后端服务: http://${SERVER_IP}:${BACKEND_PORT}"
echo "前端服务: http://${SERVER_IP}:${FRONTEND_PORT}"
echo ""
echo "下一步:"
echo "1. 在 Nginx Proxy Manager (http://${SERVER_IP}:81) 配置反向代理:"
echo "   - 域名: ${DOMAIN}"
echo "   - Forward Hostname/IP: ${SERVER_IP}"
echo "   - Forward Port: ${FRONTEND_PORT}"
echo "   - 启用 SSL (Let's Encrypt)"
echo "   - 添加自定义 Nginx 配置（支持 SSE）:"
echo ""
echo "   location /api/ {"
echo "       proxy_pass http://${SERVER_IP}:${BACKEND_PORT};"
echo "       proxy_buffering off;"
echo "       proxy_cache off;"
echo "       proxy_read_timeout 86400s;"
echo "   }"
echo ""
echo "2. 访问: https://${DOMAIN}"
echo ""
echo "========================================="

# Optionally test the deployment
echo ""
read -p "是否测试部署? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "测试后端健康检查..."
    curl -f "http://${SERVER_IP}:${BACKEND_PORT}/api/health" && echo " ✓ 后端正常" || echo " ✗ 后端异常"

    echo "测试前端访问..."
    curl -f "http://${SERVER_IP}:${FRONTEND_PORT}/" > /dev/null 2>&1 && echo " ✓ 前端正常" || echo " ✗ 前端异常"
fi

echo ""
echo "========================================="
echo "  部署脚本执行完成"
echo "========================================="
