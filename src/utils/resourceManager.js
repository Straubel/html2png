const os = require('os');

class ResourceManager {
  constructor() {
    this.memoryThreshold = 0.95; // 95% memory usage threshold (increased from 80%)
    this.maxConcurrentRequests = 3; // Reduced from 5 to use less memory
    this.currentRequests = 0;
    this.requestQueue = [];
  }

  checkMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = usedMem / totalMem;
    
    return {
      total: Math.round(totalMem / 1024 / 1024), // MB
      used: Math.round(usedMem / 1024 / 1024), // MB
      free: Math.round(freeMem / 1024 / 1024), // MB
      percentage: Math.round(memoryUsage * 100)
    };
  }

  isMemoryAvailable() {
    const memUsage = this.checkMemoryUsage();
    // For development/testing, be more lenient with memory usage
    return memUsage.percentage < (this.memoryThreshold * 100) || memUsage.free > 100; // Allow if at least 100MB free
  }

  async acquireRequest() {
    return new Promise((resolve, reject) => {
      if (!this.isMemoryAvailable()) {
        reject(new Error('Insufficient memory available for processing'));
        return;
      }

      if (this.currentRequests < this.maxConcurrentRequests) {
        this.currentRequests++;
        resolve();
      } else {
        // Add to queue with timeout
        const timeoutId = setTimeout(() => {
          const index = this.requestQueue.findIndex(item => item.reject === reject);
          if (index > -1) {
            this.requestQueue.splice(index, 1);
            reject(new Error('Request timeout: server too busy'));
          }
        }, 30000); // 30 second timeout

        this.requestQueue.push({
          resolve: () => {
            clearTimeout(timeoutId);
            this.currentRequests++;
            resolve();
          },
          reject
        });
      }
    });
  }

  releaseRequest() {
    this.currentRequests--;
    
    if (this.requestQueue.length > 0 && this.isMemoryAvailable()) {
      const next = this.requestQueue.shift();
      next.resolve();
    }
  }

  logResourceUsage() {
    const memUsage = this.checkMemoryUsage();
    const cpuUsage = os.loadavg()[0]; // 1-minute load average
    
    console.log(`[Resource Monitor] Memory: ${memUsage.percentage}% (${memUsage.used}MB/${memUsage.total}MB), CPU Load: ${cpuUsage.toFixed(2)}, Active Requests: ${this.currentRequests}`);
  }

  startMonitoring(intervalMs = 30000) {
    setInterval(() => {
      this.logResourceUsage();
      
      // Force garbage collection if memory usage is high
      const memUsage = this.checkMemoryUsage();
      if (memUsage.percentage > 70 && global.gc) {
        console.log('[Resource Manager] Running garbage collection');
        global.gc();
      }
    }, intervalMs);
  }
}

// Validation utilities
class ValidationUtils {
  static validateHtml(html) {
    if (!html || typeof html !== 'string') {
      throw new Error('HTML content must be a non-empty string');
    }
    
    if (html.length > 1024 * 1024) { // 1MB limit
      throw new Error('HTML content too large (max 1MB)');
    }
    
    return true;
  }

  static validateOptions(options) {
    const validOptions = {
      width: { type: 'number', min: 100, max: 4000 },
      height: { type: 'number', min: 100, max: 4000 },
      deviceScaleFactor: { type: 'number', min: 0.5, max: 3 },
      fullPage: { type: 'boolean' },
      omitBackground: { type: 'boolean' },
      timeout: { type: 'number', min: 1000, max: 60000 },
      autoWidth: { type: 'boolean' },
      padding: { type: 'number', min: 0, max: 100 },
      fontFamily: { type: 'string', enum: ['default', 'pingfang', 'custom'] }
    };

    for (const [key, value] of Object.entries(options)) {
      const validation = validOptions[key];
      if (!validation) continue;

      if (typeof value !== validation.type) {
        throw new Error(`Option '${key}' must be of type ${validation.type}`);
      }

      if (validation.min && value < validation.min) {
        throw new Error(`Option '${key}' must be at least ${validation.min}`);
      }

      if (validation.max && value > validation.max) {
        throw new Error(`Option '${key}' must be at most ${validation.max}`);
      }

      if (validation.enum && !validation.enum.includes(value)) {
        throw new Error(`Option '${key}' must be one of: ${validation.enum.join(', ')}`);
      }
    }

    return true;
  }
}

// Error handling utilities
class ErrorHandler {
  static createApiError(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }

  static handlePuppeteerError(error) {
    if (error.message.includes('Navigation timeout')) {
      return this.createApiError('Page load timeout - the content took too long to render', 408, 'TIMEOUT_ERROR');
    }
    
    if (error.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
      return this.createApiError('Network connection error', 503, 'NETWORK_ERROR');
    }
    
    if (error.message.includes('Protocol error')) {
      return this.createApiError('Browser protocol error - please try again', 500, 'BROWSER_ERROR');
    }
    
    return this.createApiError(`HTML conversion failed: ${error.message}`, 500, 'CONVERSION_ERROR');
  }

  static handleQiniuError(error) {
    if (error.message.includes('401')) {
      return this.createApiError('Qiniu authentication failed - check credentials', 401, 'AUTH_ERROR');
    }
    
    if (error.message.includes('quota exceeded')) {
      return this.createApiError('Storage quota exceeded', 507, 'QUOTA_ERROR');
    }
    
    return this.createApiError(`Upload failed: ${error.message}`, 500, 'UPLOAD_ERROR');
  }
}

module.exports = {
  ResourceManager,
  ValidationUtils,
  ErrorHandler
};