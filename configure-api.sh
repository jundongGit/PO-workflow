#!/bin/bash

# 自动配置Chrome扩展API地址

echo ""
echo "============================================"
echo "  Invoice Automation - API配置工具"
echo "============================================"
echo ""

# 获取API URL
echo "请输入您的Vercel API地址："
echo "例如: https://invoice-automation-api.vercel.app"
echo ""
read -p "API URL: " API_URL

# 验证URL
if [ -z "$API_URL" ]; then
    echo ""
    echo "[错误] URL不能为空"
    exit 1
fi

# 确保URL以/api结尾
if [[ ! "$API_URL" == */api ]]; then
    API_URL="${API_URL}/api"
fi

echo ""
echo "将配置API地址为: $API_URL"
echo ""

# 备份原文件
WORKER_FILE="chrome-extension/background/service-worker.js"

if [ ! -f "$WORKER_FILE" ]; then
    echo "[错误] 找不到文件: $WORKER_FILE"
    exit 1
fi

echo "正在备份原文件..."
cp "$WORKER_FILE" "$WORKER_FILE.backup"

# 使用sed替换API_URL
echo "正在更新配置..."

# macOS 使用 sed -i ''
# Linux 使用 sed -i
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|API_URL: '.*'|API_URL: '$API_URL'|g" "$WORKER_FILE"
else
    sed -i "s|API_URL: '.*'|API_URL: '$API_URL'|g" "$WORKER_FILE"
fi

echo ""
echo "============================================"
echo "  ✅ 配置成功！"
echo "============================================"
echo ""
echo "API地址已设置为: $API_URL"
echo ""
echo "备份文件位于: $WORKER_FILE.backup"
echo ""
echo "下一步: 打包扩展给用户"
echo "运行: ./package-extension.sh"
echo ""
