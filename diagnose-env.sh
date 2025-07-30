#!/bin/bash

echo "🔍 HTML2PNG 环境变量诊断工具"
echo "============================"

echo ""
echo "1. 检查 .env 文件："
if [ -f ".env" ]; then
    echo "✅ .env 文件存在"
    echo "📋 .env 文件内容:"
    grep -v "^#" .env | grep -v "^$" | while read line; do
        key=$(echo $line | cut -d'=' -f1)
        value=$(echo $line | cut -d'=' -f2-)
        if [[ $key == *"SECRET"* ]] || [[ $key == *"KEY"* ]]; then
            echo "   $key=*****(已隐藏)"
        else
            echo "   $line"
        fi
    done
else
    echo "❌ .env 文件不存在"
    echo "💡 请运行: cp .env.example .env"
    exit 1
fi

echo ""
echo "2. 检查当前环境变量："
echo "PORT: ${PORT:-未设置}"
echo "NODE_ENV: ${NODE_ENV:-未设置}"
echo "QINIU_ACCESS_KEY: $([ -n "$QINIU_ACCESS_KEY" ] && echo "已设置" || echo "❌ 未设置")"
echo "QINIU_SECRET_KEY: $([ -n "$QINIU_SECRET_KEY" ] && echo "已设置" || echo "❌ 未设置")"
echo "QINIU_BUCKET: ${QINIU_BUCKET:-❌ 未设置}"
echo "QINIU_DOMAIN: ${QINIU_DOMAIN:-未设置(可选)}"

echo ""
echo "3. 加载 .env 并重新检查："
if [ -f ".env" ]; then
    source .env
    echo "重新加载后:"
    echo "QINIU_ACCESS_KEY: $([ -n "$QINIU_ACCESS_KEY" ] && echo "已设置(${QINIU_ACCESS_KEY:0:8}...)" || echo "❌ 未设置")"
    echo "QINIU_SECRET_KEY: $([ -n "$QINIU_SECRET_KEY" ] && echo "已设置(${QINIU_SECRET_KEY:0:8}...)" || echo "❌ 未设置")"
    echo "QINIU_BUCKET: ${QINIU_BUCKET:-❌ 未设置}"
    echo "QINIU_DOMAIN: ${QINIU_DOMAIN:-未设置(可选)}"
fi

echo ""
echo "4. 进程检查："
ps aux | grep node | grep -v grep | head -3

echo ""
echo "5. 建议解决方案："
if [ -z "$QINIU_ACCESS_KEY" ] || [ -z "$QINIU_SECRET_KEY" ] || [ -z "$QINIU_BUCKET" ]; then
    echo "❌ 环境变量未正确设置"
    echo "💡 解决步骤:"
    echo "   1. 编辑 .env 文件，填入正确的七牛云配置"
    echo "   2. 重启服务: pm2 restart html2png"
    echo "   3. 或者: pkill -f node && npm start"
else
    echo "✅ 环境变量看起来正确"
    echo "💡 如果仍有问题，请重启服务"
fi