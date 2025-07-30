#!/bin/bash

echo "📝 安装现代字体支持"
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
    echo "📦 安装现代字体 (Ubuntu/Debian)..."
    
    sudo apt-get update
    sudo apt-get install -y \
        fonts-noto-cjk \
        fonts-noto-color-emoji \
        fonts-roboto \
        fonts-open-sans \
        fonts-liberation \
        fonts-dejavu-core \
        fonts-droid-fallback \
        ttf-wqy-zenhei \
        ttf-wqy-microhei

# CentOS/RHEL/Fedora 系统
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    echo "📦 安装现代字体 (CentOS/RHEL/Fedora)..."
    
    sudo yum install -y \
        google-noto-cjk-fonts \
        google-roboto-fonts \
        liberation-fonts \
        dejavu-fonts-common \
        wqy-zenhei-fonts \
        wqy-microhei-fonts

else
    echo "❌ 不支持的操作系统: $OS"
    exit 1
fi

# 下载并安装苹方字体（如果可能）
echo "📥 尝试安装苹方字体..."
mkdir -p ~/.fonts

# 创建模拟苹方字体的字体配置
cat > ~/.fonts.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- 苹方字体替换映射 -->
  <alias>
    <family>PingFang SC</family>
    <prefer>
      <family>Noto Sans CJK SC</family>
      <family>Source Han Sans SC</family>
      <family>WenQuanYi Zen Hei</family>
      <family>Roboto</family>
    </prefer>
  </alias>
  
  <alias>
    <family>PingFang TC</family>
    <prefer>
      <family>Noto Sans CJK TC</family>
      <family>Source Han Sans TC</family>
      <family>WenQuanYi Zen Hei</family>
    </prefer>
  </alias>
  
  <alias>
    <family>SF Pro Display</family>
    <prefer>
      <family>Roboto</family>
      <family>Open Sans</family>
      <family>Liberation Sans</family>
    </prefer>
  </alias>
  
  <alias>
    <family>SF Pro Text</family>
    <prefer>
      <family>Roboto</family>
      <family>Open Sans</family>
      <family>Liberation Sans</family>
    </prefer>
  </alias>
</fontconfig>
EOF

# 更新字体缓存
echo "🔄 更新字体缓存..."
sudo fc-cache -fv

echo ""
echo "✅ 现代字体安装完成！"
echo ""
echo "📋 字体映射："
echo "   PingFang SC → Noto Sans CJK SC / Roboto"
echo "   SF Pro → Roboto / Open Sans"
echo ""
echo "🔍 检查可用字体："
fc-list | grep -E "(Noto|Roboto|Liberation|WenQuanYi)" | head -5

echo ""
echo "🔄 请重启 HTML2PNG 服务：" 
echo "   pm2 restart html2png"