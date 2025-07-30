const qiniu = require('qiniu');
const crypto = require('crypto');

class QiniuService {
  constructor() {
    this.accessKey = process.env.QINIU_ACCESS_KEY;
    this.secretKey = process.env.QINIU_SECRET_KEY;
    this.bucket = process.env.QINIU_BUCKET;
    this.domain = process.env.QINIU_DOMAIN;

    if (!this.accessKey || !this.secretKey || !this.bucket) {
      console.warn('Qiniu credentials not configured. Please set QINIU_ACCESS_KEY, QINIU_SECRET_KEY, and QINIU_BUCKET in your environment variables.');
    }

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
      if (!this.accessKey || !this.secretKey || !this.bucket) {
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
              imageUrl = `https://${this.domain}/${respBody.key}`;
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
      if (!this.accessKey || !this.secretKey || !this.bucket) {
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
              imageUrl = `https://${this.domain}/${respBody.key}`;
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