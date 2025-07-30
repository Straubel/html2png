#!/bin/bash

echo "🔧 安装Chrome运行所需的系统依赖"
echo "================================="

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "检测到操作系统: $OS $VER"

# Ubuntu/Debian 系统
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "📦 安装 Ubuntu/Debian 依赖..."
    
    # 更新包列表
    sudo apt-get update
    
    # 安装 Chrome 依赖
    sudo apt-get install -y \
        wget \
        gnupg \
        ca-certificates \
        apt-transport-https \
        software-properties-common \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libatspi2.0-0 \
        libcups2 \
        libdrm2 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libxss1 \
        libxtst6 \
        fonts-liberation \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0

# CentOS/RHEL/Fedora 系统
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    echo "📦 安装 CentOS/RHEL/Fedora 依赖..."
    
    sudo yum update -y
    sudo yum install -y \
        wget \
        curl \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils

else
    echo "❌ 不支持的操作系统: $OS"
    echo "请手动安装 Chrome 运行依赖"
    exit 1
fi

echo ""
echo "✅ 系统依赖安装完成！"
echo ""
echo "🔄 现在需要重启 HTML2PNG 服务："
echo "   pm2 restart html2png"
echo "   或者"
echo "   pkill -f node && npm start"