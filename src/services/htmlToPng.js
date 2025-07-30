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
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--allow-running-insecure-content',
          '--disable-blink-features=AutomationControlled',
          '--font-render-hinting=none',
          '--enable-font-antialiasing',
          '--allow-file-access-from-files'
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
      padding = 0, // 新增：内容周围的内边距
      fontFamily = 'default' // 新增：字体选项 'default', 'pingfang', 'custom'
    } = options;

    let page = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // 监听所有网络请求
      const failedRequests = [];
      const successRequests = [];
      
      page.on('requestfailed', request => {
        const url = request.url();
        const failure = request.failure();
        failedRequests.push({
          url,
          method: request.method(),
          resourceType: request.resourceType(),
          errorText: failure ? failure.errorText : 'Unknown error'
        });
        console.log(`❌ 资源加载失败: ${request.resourceType()} - ${url}`);
        console.log(`   错误: ${failure ? failure.errorText : 'Unknown error'}`);
      });

      page.on('response', response => {
        const url = response.url();
        const status = response.status();
        if (status >= 400) {
          failedRequests.push({
            url,
            status,
            statusText: response.statusText(),
            resourceType: 'response_error'
          });
          console.log(`❌ HTTP错误: ${status} - ${url}`);
        } else if (url.includes('font') || url.includes('css') || url.includes('icon')) {
          successRequests.push({
            url,
            status,
            resourceType: 'font/css'
          });
          console.log(`✅ 资源加载成功: ${status} - ${url}`);
        }
      });

      // 启用请求拦截来监控
      await page.setRequestInterception(false); // 不拦截，只监控

      // Set viewport
      await page.setViewport({
        width,
        height,
        deviceScaleFactor
      });

      // Set timeout for page operations
      page.setDefaultTimeout(timeout);

      // Set HTML content with Chinese font fallback - 完全禁用自动中文字体注入
      let htmlWithFontFallback;
      
      // 检查HTML中是否包含icon元素
      const hasIcons = html.includes('fa-') || html.includes('material-icons') || html.includes('icon-') || html.includes('glyphicon');
      
      if (hasIcons) {
        // 有icon时，完全不注入中文字体，让原始CSS生效
        console.log('🎯 检测到icon元素，保持原始字体设置');
        htmlWithFontFallback = html;
      } else {
        // 没有icon时才注入中文字体
        console.log('📝 注入中文字体支持');
        
        let fontCSS = '';
        if (fontFamily === 'pingfang') {
          fontCSS = `
            body, p, h1, h2, h3, h4, h5, h6, div, span { 
              font-family: "PingFang SC", "PingFang TC", "Apple System Font", "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif !important; 
            }`;
        } else if (fontFamily === 'default') {
          fontCSS = `
            body, p, h1, h2, h3, h4, h5, h6, div, span { 
              font-family: "Microsoft YaHei", "WenQuanYi Zen Hei", "Noto Sans CJK SC", "Source Han Sans SC", "Droid Sans Fallback", "Hiragino Sans GB", Arial, sans-serif !important; 
            }`;
        }
        // fontFamily === 'custom' 时不注入任何字体CSS
        
        if (fontCSS) {
          htmlWithFontFallback = html.replace(
            /<head>/i,
            `<head><style>${fontCSS}</style>`
          );
        } else {
          htmlWithFontFallback = html;
        }
      }
      
      // 如果是自动宽度，添加布局CSS
      if (autoWidth) {
        const layoutCSS = `
          <style>
            html, body { 
              margin: 0; 
              padding: ${padding}px; 
              width: fit-content; 
              min-width: auto; 
              max-width: none;
              overflow: visible;
              box-sizing: border-box;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        `;
        
        if (htmlWithFontFallback.includes('<head>')) {
          htmlWithFontFallback = htmlWithFontFallback.replace('</head>', layoutCSS + '</head>');
        } else {
          htmlWithFontFallback = layoutCSS + htmlWithFontFallback;
        }
      }

      await page.setContent(htmlWithFontFallback, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout
      });

      // 等待字体加载完成
      console.log('⏳ 等待字体和资源加载完成...');
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
              console.log('字体加载完成');
              resolve();
            });
          } else {
            // 如果不支持 document.fonts，等待一下
            setTimeout(resolve, 1000);
          }
        });
      });

      // 检查页面中的字体
      const fontInfo = await page.evaluate(() => {
        const elements = document.querySelectorAll('i[class*="fa"], .fa, .material-icons');
        const fontFamilies = [];
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          fontFamilies.push({
            element: el.className,
            fontFamily: style.fontFamily,
            content: el.textContent || el.innerHTML
          });
        });
        return fontFamilies;
      });

      console.log('🔤 页面中的icon元素字体信息:');
      fontInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. 类名: ${info.element}`);
        console.log(`      字体: ${info.fontFamily}`);
        console.log(`      内容: ${info.content || '(空)'}`);
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
          
          // 获取所有可能的宽度值
          const widths = [
            body.scrollWidth,
            body.offsetWidth,
            body.clientWidth,
            html.clientWidth,
            html.scrollWidth,
            html.offsetWidth
          ];
          
          // 获取所有元素的边界框来确定实际内容范围
          const allElements = document.querySelectorAll('*');
          let minX = Infinity, minY = Infinity, maxRight = 0, maxBottom = 0;
          
          for (let element of allElements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              minX = Math.min(minX, rect.left);
              minY = Math.min(minY, rect.top);
              maxRight = Math.max(maxRight, rect.right);
              maxBottom = Math.max(maxBottom, rect.bottom);
            }
          }
          
          // 如果有具体的元素边界，使用它；否则使用传统方法
          const actualWidth = maxRight > 0 ? Math.ceil(maxRight - Math.max(0, minX)) : Math.max(...widths);
          const actualHeight = maxBottom > 0 ? Math.ceil(maxBottom - Math.max(0, minY)) : Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          );
          
          return {
            width: actualWidth,
            height: actualHeight,
            offsetX: Math.max(0, minX),
            offsetY: Math.max(0, minY),
            detectionMethod: maxRight > 0 ? 'boundingBox' : 'traditional'
          };
        });

        console.log(`📐 内容尺寸检测 (${contentSize.detectionMethod}):`, contentSize);

        // 设置页面视口为内容实际大小
        const finalWidth = Math.min(contentSize.width + padding * 2, 4000);
        const finalHeight = Math.min(contentSize.height + padding * 2, 4000);
        
        await page.setViewport({
          width: finalWidth,
          height: finalHeight,
          deviceScaleFactor
        });

        // 自动宽度模式下不使用fullPage，而是使用clip进行精确裁剪
        screenshotOptions.clip = {
          x: Math.max(0, contentSize.offsetX - padding),
          y: Math.max(0, contentSize.offsetY - padding), 
          width: finalWidth,
          height: finalHeight
        };
      } else {
        // 传统模式下可以使用fullPage
        screenshotOptions.fullPage = fullPage;
      }

      const screenshot = await page.screenshot(screenshotOptions);

      // 输出资源加载汇总
      console.log(`📊 资源加载汇总:`);
      console.log(`   ✅ 成功: ${successRequests.length} 个资源`);
      console.log(`   ❌ 失败: ${failedRequests.length} 个资源`);
      
      if (failedRequests.length > 0) {
        console.log(`📋 失败的资源详情:`);
        failedRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. [${req.resourceType || 'unknown'}] ${req.url}`);
          console.log(`      错误: ${req.errorText || req.statusText || 'Unknown error'}`);
        });
      }

      if (successRequests.length > 0) {
        console.log(`📋 成功的字体/CSS资源:`);
        successRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. [${req.status}] ${req.url}`);
        });
      }

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