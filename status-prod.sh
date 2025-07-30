#!/bin/bash

echo "📊 HTML2PNG 服务状态"
echo "==================="

# 检查PID文件
if [ -f logs/html2png.pid ]; then
    PID=$(cat logs/html2png.pid)
    echo "PID文件: logs/html2png.pid ($PID)"
    
    if kill -0 $PID 2>/dev/null; then
        echo "✅ 服务运行中 (PID: $PID)"
        
        # 检查端口
        PORT=${PORT:-3000}
        if netstat -ln 2>/dev/null | grep ":$PORT " > /dev/null; then
            echo "✅ 端口 $PORT 正在监听"
        else
            echo "⚠️  端口 $PORT 未在监听"
        fi
        
        # 尝试健康检查
        echo "🔍 执行健康检查..."
        if curl -s -f http://localhost:$PORT/health > /dev/null; then
            echo "✅ 健康检查通过"
            echo ""
            echo "📋 服务响应:"
            curl -s http://localhost:$PORT/health | head -3
        else
            echo "❌ 健康检查失败"
        fi
        
    else
        echo "❌ PID文件存在但进程不运行"
        rm -f logs/html2png.pid
    fi
else
    echo "📄 未找到PID文件"
fi

# 按进程名检查
echo ""
echo "🔍 进程检查:"
PROCESSES=$(pgrep -f "node.*src/app.js")
if [ -n "$PROCESSES" ]; then
    echo "发现相关进程:"
    ps aux | grep "node.*src/app.js" | grep -v grep
else
    echo "❌ 未发现相关进程"
fi

# 检查日志文件
echo ""
echo "📝 日志文件:"
if [ -f logs/output.log ]; then
    echo "最新日志 (最后10行):"
    echo "-------------------"
    tail -10 logs/output.log
else
    echo "❌ 未找到日志文件"
fi

echo ""
echo "📋 管理命令:"
echo "   启动: ./start-prod.sh"
echo "   停止: ./stop-prod.sh"
echo "   重启: ./stop-prod.sh && ./start-prod.sh"
echo "   日志: tail -f logs/output.log"