#!/bin/bash

echo "🛑 停止 HTML2PNG 服务"
echo "===================="

# 检查PID文件
if [ -f logs/html2png.pid ]; then
    PID=$(cat logs/html2png.pid)
    echo "从PID文件读取进程ID: $PID"
    
    # 检查进程是否存在
    if kill -0 $PID 2>/dev/null; then
        echo "正在停止进程 $PID..."
        kill $PID
        
        # 等待进程结束
        for i in {1..10}; do
            if ! kill -0 $PID 2>/dev/null; then
                echo "✅ 服务已停止"
                rm -f logs/html2png.pid
                exit 0
            fi
            sleep 1
        done
        
        # 如果进程仍然存在，强制杀死
        echo "⚠️  正常停止超时，强制终止进程..."
        kill -9 $PID 2>/dev/null
        rm -f logs/html2png.pid
        echo "✅ 服务已强制停止"
    else
        echo "⚠️  PID文件中的进程不存在，清理PID文件"
        rm -f logs/html2png.pid
    fi
else
    echo "📄 未找到PID文件，尝试按进程名停止..."
fi

# 按进程名查找并停止
if pgrep -f "node.*src/app.js" > /dev/null; then
    echo "发现运行中的服务进程，正在停止..."
    pkill -f "node.*src/app.js"
    sleep 2
    
    if pgrep -f "node.*src/app.js" > /dev/null; then
        echo "⚠️  正常停止失败，强制终止..."
        pkill -9 -f "node.*src/app.js"
    fi
    echo "✅ 服务已停止"
else
    echo "ℹ️  未发现运行中的服务"
fi