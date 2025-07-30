const puppeteer = require('puppeteer');

class HtmlToPngService {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
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
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--allow-running-insecure-content',
          '--disable-blink-features=AutomationControlled',
          '--font-render-hinting=none'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        ignoreHTTPSErrors: true
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
      timeout = 30000,
      autoWidth = false, // 新增：自动适应内容宽度
      padding = 0 // 新增：内容周围的内边距
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

      // Set HTML content with Chinese font fallback
      const htmlWithFontFallback = html.replace(
        /<head>/i,
        `<head><style>
          * { 
            font-family: "Microsoft YaHei", "WenQuanYi Zen Hei", "Noto Sans CJK SC", "Source Han Sans SC", "Droid Sans Fallback", "Hiragino Sans GB", Arial, sans-serif !important; 
          }
          ${autoWidth ? 'body { margin: 0; padding: ' + padding + 'px; width: fit-content; min-width: auto; }' : ''}
        </style>`
      );

      await page.setContent(htmlWithFontFallback, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout
      });

      let screenshotOptions = {
        type: 'png',
        omitBackground
      };

      // 如果启用自动宽度，获取内容的实际尺寸
      if (autoWidth) {
        const contentSize = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          
          return {
            width: Math.max(
              body.scrollWidth,
              body.offsetWidth,
              html.clientWidth,
              html.scrollWidth,
              html.offsetWidth
            ),
            height: Math.max(
              body.scrollHeight,
              body.offsetHeight,
              html.clientHeight,
              html.scrollHeight,
              html.offsetHeight
            )
          };
        });

        // 设置页面视口为内容实际大小
        await page.setViewport({
          width: Math.min(contentSize.width + padding * 2, 4000), // 限制最大宽度
          height: Math.min(contentSize.height + padding * 2, 4000), // 限制最大高度
          deviceScaleFactor
        });

        // 自动宽度模式下不使用fullPage，而是使用clip进行精确裁剪
        screenshotOptions.clip = {
          x: 0,
          y: 0,
          width: Math.min(contentSize.width + padding * 2, 4000),
          height: Math.min(contentSize.height + padding * 2, 4000)
        };
      } else {
        // 传统模式下可以使用fullPage
        screenshotOptions.fullPage = fullPage;
      }

      const screenshot = await page.screenshot(screenshotOptions);

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