const puppeteer = require('puppeteer');

class HtmlToPngService {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // v19 uses 'true' instead of 'new'
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--memory-pressure-off',
          '--max_old_space_size=512',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    return this.browser;
  }

  async convertHtmlToPng(html, options = {}) {
    const {
      width = 1200,
      height = 800,
      deviceScaleFactor = 1,
      fullPage = false,
      omitBackground = false,
      quality = 100,
      timeout = 30000
    } = options;

    let page = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport
      await page.setViewport({
        width,
        height,
        deviceScaleFactor
      });

      // Set timeout for page operations
      page.setDefaultTimeout(timeout);

      // Set HTML content
      await page.setContent(html, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage,
        omitBackground,
        quality
      });

      return screenshot;

    } catch (error) {
      throw new Error(`Failed to convert HTML to PNG: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Create singleton instance
const htmlToPngService = new HtmlToPngService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down browser...');
  await htmlToPngService.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down browser...');
  await htmlToPngService.closeBrowser();
  process.exit(0);
});

module.exports = htmlToPngService;