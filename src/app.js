const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const htmlToPngService = require('./services/htmlToPng');
const qiniuService = require('./services/qiniu');
const { ResourceManager, ValidationUtils, ErrorHandler } = require('./utils/resourceManager');

// Load environment variables
dotenv.config();

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