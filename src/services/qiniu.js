const qiniu = require('qiniu');
const crypto = require('crypto');

class QiniuService {
  constructor() {
    // 延迟初始化，在实际使用时才读取环境变量
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return true;

    this.accessKey = process.env.QINIU_ACCESS_KEY;
    this.secretKey = process.env.QINIU_SECRET_KEY;
    this.bucket = process.env.QINIU_BUCKET;
    this.domain = process.env.QINIU_DOMAIN;

    console.log('🔍 七牛云配置检查:');
    console.log('QINIU_ACCESS_KEY:', this.accessKey ? `已设置(${this.accessKey.substring(0, 8)}...)` : '❌ 未设置');
    console.log('QINIU_SECRET_KEY:', this.secretKey ? `已设置(${this.secretKey.substring(0, 8)}...)` : '❌ 未设置');
    console.log('QINIU_BUCKET:', this.bucket || '❌ 未设置');
    console.log('QINIU_DOMAIN:', this.domain || '未设置(可选)');

    if (!this.accessKey || !this.secretKey || !this.bucket) {
      console.warn('❌ 七牛云配置不完整，请检查.env文件');
      return false;
    }

    try {
      // Configure qiniu
      const mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
      const options = {
        scope: this.bucket,
        expires: 7200 // 2 hours
      };
      
      this.putPolicy = new qiniu.rs.PutPolicy(options);
      this.uploadToken = this.putPolicy.uploadToken(mac);
      this.config = new qiniu.conf.Config();
      this.formUploader = new qiniu.form_up.FormUploader(this.config);
      this.putExtra = new qiniu.form_up.PutExtra();

      this.initialized = true;
      console.log('✅ 七牛云服务初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 七牛云初始化失败:', error.message);
      return false;
    }
  }

  generateFileName(originalName) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}-${month}-${day}`;
    
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const extension = originalName.split('.').pop();
    
    return `html2png/${dateFolder}/${timestamp}-${random}.${extension}`;
  }

  async uploadBuffer(buffer, fileName) {
    return new Promise((resolve, reject) => {
      if (!this.initialize()) {
        return reject(new Error('Qiniu credentials not configured'));
      }

      const key = this.generateFileName(fileName);

      this.formUploader.put(
        this.uploadToken,
        key,
        buffer,
        this.putExtra,
        (respErr, respBody, respInfo) => {
          if (respErr) {
            reject(new Error(`Upload failed: ${respErr.message}`));
            return;
          }

          if (respInfo.statusCode === 200) {
            let imageUrl;
            
            if (this.domain) {
              // Use custom domain if configured
              // 处理域名可能已包含协议的情况
              const cleanDomain = this.domain.replace(/^https?:\/\//, '');
              imageUrl = `https://${cleanDomain}/${respBody.key}`;
            } else {
              // Use default qiniu domain
              imageUrl = `https://${this.bucket}.qiniudn.com/${respBody.key}`;
            }

            resolve(imageUrl);
          } else {
            reject(new Error(`Upload failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
          }
        }
      );
    });
  }

  async uploadFile(filePath, fileName) {
    return new Promise((resolve, reject) => {
      if (!this.initialize()) {
        return reject(new Error('Qiniu credentials not configured'));
      }

      const key = this.generateFileName(fileName);

      this.formUploader.putFile(
        this.uploadToken,
        key,
        filePath,
        this.putExtra,
        (respErr, respBody, respInfo) => {
          if (respErr) {
            reject(new Error(`Upload failed: ${respErr.message}`));
            return;
          }

          if (respInfo.statusCode === 200) {
            let imageUrl;
            
            if (this.domain) {
              // Use custom domain if configured
              // 处理域名可能已包含协议的情况
              const cleanDomain = this.domain.replace(/^https?:\/\//, '');
              imageUrl = `https://${cleanDomain}/${respBody.key}`;
            } else {
              imageUrl = `https://${this.bucket}.qiniudn.com/${respBody.key}`;
            }

            resolve(imageUrl);
          } else {
            reject(new Error(`Upload failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
          }
        }
      );
    });
  }

  async deleteFile(key) {
    return new Promise((resolve, reject) => {
      const mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
      const bucketManager = new qiniu.rs.BucketManager(mac, this.config);

      bucketManager.delete(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(new Error(`Delete failed: ${err.message}`));
          return;
        }

        if (respInfo.statusCode === 200) {
          resolve({ success: true, message: 'File deleted successfully' });
        } else {
          reject(new Error(`Delete failed with status ${respInfo.statusCode}: ${JSON.stringify(respBody)}`));
        }
      });
    });
  }
}

// Create singleton instance
const qiniuService = new QiniuService();

module.exports = qiniuService;