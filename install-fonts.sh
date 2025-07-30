#!/bin/bash

echo "📝 安装中文字体支持"
echo "=================="

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "检测到操作系统: $OS"

# Ubuntu/Debian 系统
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "📦 安装 Ubuntu/Debian 中文字体..."
    
    sudo apt-get update
    sudo apt-get install -y \
        fonts-wqy-zenhei \
        fonts-wqy-microhei \
        fonts-droid-fallback \
        ttf-wqy-zenhei \
        ttf-wqy-microhei \
        fonts-arphic-ukai \
        fonts-arphic-uming \
        fonts-noto-cjk \
        fonts-noto-cjk-extra

# CentOS/RHEL/Fedora 系统
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    echo "📦 安装 CentOS/RHEL/Fedora 中文字体..."
    
    sudo yum install -y \
        wqy-zenhei-fonts \
        wqy-microhei-fonts \
        dejavu-sans-fonts \
        google-noto-cjk-fonts

else
    echo "❌ 不支持的操作系统: $OS"
    echo "请手动安装中文字体"
    exit 1
fi

# 更新字体缓存
echo "🔄 更新字体缓存..."
sudo fc-cache -fv

echo ""
echo "✅ 中文字体安装完成！"
echo ""
echo "📋 已安装的字体："
fc-list :lang=zh | grep -E "(WenQuanYi|Noto|Droid)" | head -5

echo ""
echo "🔄 请重启 HTML2PNG 服务以应用字体更改：" 
echo "   pm2 restart html2png"
echo "   或者"
echo "   pkill -f node && npm start"