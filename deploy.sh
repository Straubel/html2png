#!/bin/bash

echo "HTML2PNG 服务器部署脚本"
echo "========================"

# 检查Node.js版本
NODE_VERSION=$(node --version)
echo "当前Node.js版本: $NODE_VERSION"

# 检查版本是否满足要求
NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 16 ]; then
    echo "错误: 需要Node.js 16.14.0或更高版本"
    exit 1
fi

echo "✅ Node.js版本检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env文件不存在，从.env.example复制..."
    cp .env.example .env
    echo "请编辑.env文件，填入你的七牛云配置"
    exit 1
fi

echo "✅ 环境配置检查完成"

# 安装PM2 (如果需要)
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2进程管理器..."
    npm install -g pm2
fi

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'html2png',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }],
};
EOF

# 创建日志目录
mkdir -p logs

echo "🚀 部署完成！"
echo ""
echo "启动服务: npm start"
echo "或使用PM2: pm2 start ecosystem.config.js"
echo "健康检查: curl http://localhost:3000/health"
echo ""
echo "请确保已正确配置.env文件中的七牛云信息！"