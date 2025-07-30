# HTML转PNG工具

一个轻量级的HTTP服务，将HTML代码转换为PNG图片并上传到七牛云存储。

## 功能特性

- 🖼️ HTML转PNG图片转换
- ☁️ 自动上传到七牛云
- 🔧 可配置的转换选项
- 📊 资源使用监控
- 🛡️ 错误处理和验证
- 🚀 资源优化，最小化服务器占用

## 系统要求

- Node.js >= 16.14.0 (推荐 16.20.2+)
- 内存: 最少 512MB 可用内存
- 七牛云存储账户

## 快速开始

### 1. 服务器部署

```bash
# 上传项目到服务器后
chmod +x deploy.sh
./deploy.sh
```

### 2. 手动安装

```bash
npm install --production
```

### 3. 配置环境变量

复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的七牛云配置：
```env
PORT=3000
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_DOMAIN=your_custom_domain.com
```

### 4. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
# 或使用优化启动脚本
./start-prod.sh
```

使用PM2管理进程：
```bash
pm2 start ecosystem.config.js
pm2 logs html2png
pm2 stop html2png
```

## API 文档

### 健康检查

```http
GET /health
```

响应：
```json
{
  "status": "OK",
  "message": "HTML to PNG service is running",
  "memory": {
    "total": 8192,
    "used": 2048,
    "free": 6144,
    "percentage": 25
  },
  "activeRequests": 0
}
```

### HTML转PNG

```http
POST /convert
Content-Type: application/json

{
  "html": "<html><body><h1>Hello World</h1></body></html>",
  "options": {
    "width": 1200,
    "height": 800,
    "fullPage": false,
    "deviceScaleFactor": 1
  }
}
```

#### 请求参数

| 参数 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|--------|
| html | string | 是 | HTML代码内容 | - |
| options.width | number | 否 | 视口宽度 (100-4000) | 1200 |
| options.height | number | 否 | 视口高度 (100-4000) | 800 |
| options.deviceScaleFactor | number | 否 | 设备缩放比例 (0.5-3) | 1 |
| options.fullPage | boolean | 否 | 是否截取整页 | false |
| options.omitBackground | boolean | 否 | 是否省略背景 | false |
| options.autoWidth | boolean | 否 | 自动适应内容宽度 | false |
| options.padding | number | 否 | 内容周围内边距(px) (0-100) | 0 |
| options.timeout | number | 否 | 超时时间(ms) (1000-60000) | 30000 |

**注意：** `autoWidth` 与 `fullPage` 参数互斥，启用 `autoWidth` 时会自动忽略 `fullPage` 设置。

#### 响应示例

成功：
```json
{
  "success": true,
  "imageUrl": "https://your-domain.com/html2png/1627890123456-abc123.png",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "size": 125000
}
```

失败：
```json
{
  "success": false,
  "error": "HTML content must be a non-empty string",
  "code": "VALIDATION_ERROR"
}
```

## 错误代码

| 代码 | 描述 |
|------|------|
| VALIDATION_ERROR | 输入验证失败 |
| TIMEOUT_ERROR | 页面加载超时 |
| NETWORK_ERROR | 网络连接错误 |
| BROWSER_ERROR | 浏览器协议错误 |
| CONVERSION_ERROR | HTML转换失败 |
| AUTH_ERROR | 七牛云认证失败 |
| QUOTA_ERROR | 存储配额超限 |
| UPLOAD_ERROR | 上传失败 |

## 资源限制

- HTML内容大小限制：1MB
- 并发转换请求：5个
- 内存使用阈值：80%
- 请求超时时间：30秒

## 使用示例

### curl示例

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1><p>This is a test page.</p></body></html>",
    "options": {
      "width": 800,
      "height": 600,
      "fullPage": true
    }
  }'
```

### JavaScript示例

```javascript
const response = await fetch('http://localhost:3000/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<html><body><h1>Hello World</h1></body></html>',
    options: {
      width: 1200,
      height: 800,
      fullPage: false
    }
  })
});

const result = await response.json();
console.log('Image URL:', result.imageUrl);
```

## 部署建议

### Docker部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2部署

```bash
npm install -g pm2
pm2 start src/app.js --name html2png
```

## 故障排除

1. **内存不足**：增加服务器内存或调整 `maxConcurrentRequests` 配置
2. **转换超时**：检查HTML内容复杂度，增加 `timeout` 配置
3. **七牛云上传失败**：检查访问密钥和存储桶配置
4. **字体缺失**：在Docker中安装中文字体包

## 许可证

MIT License