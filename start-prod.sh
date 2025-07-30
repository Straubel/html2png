#!/bin/bash

# 生产环境启动脚本
export NODE_ENV=production
export PORT=${PORT:-3000}

# 确保从.env文件加载环境变量
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 启动参数优化
node \
  --max-old-space-size=512 \
  --optimize-for-size \
  --gc-interval=100 \
  src/app.js