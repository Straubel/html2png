#!/bin/bash

echo "📦 快速安装 Chrome 核心依赖"
echo "=========================="

# 一键安装最核心的依赖库
if command -v apt-get &> /dev/null; then
    echo "使用 apt-get 安装依赖..."
    sudo apt-get update && sudo apt-get install -y \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libxss1 \
        libxtst6 \
        fonts-liberation \
        libasound2

elif command -v yum &> /dev/null; then
    echo "使用 yum 安装依赖..."
    sudo yum install -y \
        atk \
        cups-libs \
        gtk3 \
        libXScrnSaver \
        libXtst \
        alsa-lib

elif command -v dnf &> /dev/null; then
    echo "使用 dnf 安装依赖..."
    sudo dnf install -y \
        atk \
        cups-libs \
        gtk3 \
        libXScrnSaver \
        libXtst \
        alsa-lib

else
    echo "❌ 未找到包管理器，请手动安装依赖"
    exit 1
fi

echo "✅ 核心依赖安装完成！"