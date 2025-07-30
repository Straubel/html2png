#!/bin/bash

echo "🔍 环境变量检查工具"
echo "==================="

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "❌ .env文件不存在"
    echo "📝 正在从.env.example创建.env文件..."
    cp .env.example .env
    echo "✅ .env文件已创建，请编辑填入你的七牛云配置"
    exit 1
fi

echo "✅ .env文件存在"

# 加载.env文件
source .env

echo ""
echo "📋 当前环境变量:"
echo "PORT: ${PORT:-未设置(默认3000)}"
echo "QINIU_ACCESS_KEY: ${QINIU_ACCESS_KEY:-❌ 未设置}"
echo "QINIU_SECRET_KEY: ${QINIU_SECRET_KEY:-❌ 未设置}"
echo "QINIU_BUCKET: ${QINIU_BUCKET:-❌ 未设置}"
echo "QINIU_DOMAIN: ${QINIU_DOMAIN:-未设置(可选)}"

echo ""

# 检查必需的环境变量
if [ -z "$QINIU_ACCESS_KEY" ] || [ -z "$QINIU_SECRET_KEY" ] || [ -z "$QINIU_BUCKET" ]; then
    echo "❌ 缺少必需的七牛云配置"
    echo "请编辑.env文件，填入正确的七牛云信息"
    exit 1
fi

echo "✅ 所有必需的环境变量已配置"
echo "🚀 可以启动服务了！"