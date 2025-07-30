#!/bin/bash

# 生产环境启动脚本
export NODE_ENV=production
export PORT=${PORT:-3000}

# 启动参数优化
node \
  --max-old-space-size=512 \
  --optimize-for-size \
  --gc-interval=100 \
  src/app.js