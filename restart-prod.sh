#!/bin/bash

echo "🔄 重启 HTML2PNG 服务"
echo "==================="

# 停止服务
./stop-prod.sh

echo ""
echo "⏳ 等待2秒..."
sleep 2

# 启动服务
./start-prod.sh