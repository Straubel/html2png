#!/bin/bash

# 生产环境后台启动脚本
export NODE_ENV=production
export PORT=${PORT:-3000}

# 确保从.env文件加载环境变量
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🚀 启动 HTML2PNG 服务 (后台模式)"
echo "================================"

# 创建日志目录
mkdir -p logs

# 检查是否已经有进程在运行
if pgrep -f "node.*src/app.js" > /dev/null; then
    echo "⚠️  检测到服务已在运行，正在停止旧进程..."
    pkill -f "node.*src/app.js"
    sleep 2
fi

# 后台启动服务
nohup node \
  --max-old-space-size=512 \
  --optimize-for-size \
  --gc-interval=100 \
  src/app.js \
  > logs/output.log 2>&1 &

# 获取进程ID
PID=$!
echo $PID > logs/html2png.pid

echo "✅ 服务已启动"
echo "   进程ID: $PID"
echo "   端口: $PORT"
echo "   日志文件: logs/output.log"
echo "   PID文件: logs/html2png.pid"
echo ""
echo "📋 管理命令:"
echo "   查看日志: tail -f logs/output.log"
echo "   停止服务: ./stop-prod.sh"
echo "   检查状态: ./status-prod.sh"

# 等待2秒检查服务是否正常启动
sleep 2
if kill -0 $PID 2>/dev/null; then
    echo ""
    echo "🎉 服务启动成功！"
    echo "   访问地址: http://localhost:$PORT/health"
else
    echo ""
    echo "❌ 服务启动失败，请检查日志: cat logs/output.log"
    exit 1
fi