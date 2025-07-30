const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const htmlToPngService = require('./services/htmlToPng');
const qiniuService = require('./services/qiniu');
const { ResourceManager, ValidationUtils, ErrorHandler } = require('./utils/resourceManager');

// Load environment variables
const path = require('path');
const fs = require('fs');

// 尝试多个路径加载.env文件
const envPaths = ['.env', '../.env', '../../.env'];
let envLoaded = false;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ 环境变量已从 ${envPath} 加载`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️  未找到.env文件，请确保已创建.env文件并配置七牛云信息');
}

// 调试环境变量
console.log('🔍 环境变量检查:');
console.log('PORT:', process.env.PORT || '未设置(使用默认3000)');
console.log('QINIU_ACCESS_KEY:', process.env.QINIU_ACCESS_KEY ? '已设置' : '❌ 未设置');
console.log('QINIU_SECRET_KEY:', process.env.QINIU_SECRET_KEY ? '已设置' : '❌ 未设置');
console.log('QINIU_BUCKET:', process.env.QINIU_BUCKET ? '已设置' : '❌ 未设置');
console.log('QINIU_DOMAIN:', process.env.QINIU_DOMAIN || '未设置(可选)');
console.log('');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize resource manager
const resourceManager = new ResourceManager();
resourceManager.startMonitoring();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for better resource management
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const memUsage = resourceManager.checkMemoryUsage();
  res.json({ 
    status: 'OK', 
    message: 'HTML to PNG service is running',
    memory: memUsage,
    activeRequests: resourceManager.currentRequests
  });
});

// Main conversion endpoint
app.post('/convert', async (req, res) => {
  let requestAcquired = false;
  
  try {
    const { html, options = {} } = req.body;
    
    // Validate input
    ValidationUtils.validateHtml(html);
    ValidationUtils.validateOptions(options);

    // Acquire resource lock
    await resourceManager.acquireRequest();
    requestAcquired = true;

    console.log(`Starting conversion - Memory: ${resourceManager.checkMemoryUsage().percentage}%`);

    // Convert HTML to PNG
    const pngBuffer = await htmlToPngService.convertHtmlToPng(html, options);
    
    // Upload to Qiniu
    const imageUrl = await qiniuService.uploadBuffer(pngBuffer, `screenshot-${Date.now()}.png`);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      timestamp: new Date().toISOString(),
      size: pngBuffer.length
    });

    console.log(`Conversion completed successfully - Size: ${Math.round(pngBuffer.length / 1024)}KB`);

  } catch (error) {
    console.error('Conversion error:', error);
    
    let apiError;
    if (error.message.includes('Failed to convert HTML to PNG')) {
      apiError = ErrorHandler.handlePuppeteerError(error);
    } else if (error.message.includes('Upload failed')) {
      apiError = ErrorHandler.handleQiniuError(error);
    } else {
      apiError = error.statusCode ? error : ErrorHandler.createApiError(error.message, 400);
    }

    res.status(apiError.statusCode || 500).json({
      success: false,
      error: apiError.message,
      code: apiError.code || 'UNKNOWN_ERROR'
    });
  } finally {
    if (requestAcquired) {
      resourceManager.releaseRequest();
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`HTML to PNG server running on port ${PORT}`);
});

module.exports = app;