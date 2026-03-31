import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUPPETEER_EXEC_PATH = process.env.PUPPETEER_EXEC_PATH;
const MAX_RETRIES = 2;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchBrowser(width = 1080, height = 1080) {
  const browserArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-file-access-from-files',
    '--single-process'
  ];

  return puppeteer.launch({
    executablePath: PUPPETEER_EXEC_PATH || undefined,
    headless: 'new',
    args: browserArgs,
    defaultViewport: { width, height }
  });
}

export async function renderQuote(text, outputPath, retryCount = 0) {
  const templatePath = path.join(__dirname, '../../templates/power_quote.html');
  let browser = null;

  try {
    console.log('🎨 Rendering quote (attempt ' + (retryCount + 1) + ')...');
    browser = await launchBrowser();
    
    const page = await browser.newPage();
    
    await page.setCacheEnabled(false);
    
    const loadResult = await page.goto(`file://${templatePath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    if (!loadResult) {
      throw new Error('Failed to load template');
    }

    await page.waitForSelector('#quote-text', { timeout: 5000 });
    
    await page.evaluate((quoteText) => {
      const el = document.getElementById('quote-text');
      if (el) el.textContent = quoteText;
    }, text);

    try {
      await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
    } catch (fontError) {
      console.log('⚠️ Font ready check timed out, continuing...');
      await sleep(1000);
    }

    await sleep(500);

    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false,
      omitBackground: false
    });

    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;

  } catch (error) {
    if (retryCount < MAX_RETRIES && error.message.includes('Target closed')) {
      console.log('⏳ Browser crashed, retrying...');
      await sleep(1000);
      return renderQuote(text, outputPath, retryCount + 1);
    }
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.log('⚠️ Browser close warning:', closeError.message);
      }
    }
  }
}

export function isConfigured() {
  return true;
}

export async function renderCarousel(slides, outputDir) {
  const templatePath = path.join(__dirname, '../../templates/deep_dive.html');
  const outputPaths = [];
  
  let browser = null;
  
  try {
    console.log(`🎨 Rendering ${slides.length} carousel slides...`);
    browser = await launchBrowser(1080, 1350);
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const outputPath = path.join(outputDir, `carousel_${i + 1}.png`);
      
      console.log(`  📊 Rendering slide ${i + 1}/5...`);
      
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      
      await page.goto(`file://${templatePath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await page.waitForSelector('#slide-number', { timeout: 5000 });
      
      await page.evaluate((slideData, index, total) => {
        document.getElementById('slide-number').textContent = index + 1;
        document.getElementById('title').textContent = slideData.title || '';
        document.getElementById('quote-text').textContent = slideData.content || '';
        document.getElementById('scripture-ref').textContent = slideData.reference || '';
        
        const slideTotal = document.getElementById('slide-total');
        if (slideTotal) {
          slideTotal.textContent = `${index + 1} / ${total}`;
        }
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
          progressBar.style.width = ((index + 1) / total * 100) + '%';
        }
        
        const progressDots = document.querySelectorAll('.progress-dot');
        progressDots.forEach((dot, dotIndex) => {
          dot.classList.toggle('active', dotIndex <= index);
        });
      }, slide, i, slides.length);
      
      try {
        await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
      } catch {
        await sleep(1000);
      }
      
      await sleep(300);
      
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false
      });
      
      outputPaths.push(outputPath);
      await page.close();
    }
    
    console.log(`✅ Carousel rendered: ${outputPaths.length} slides`);
    return outputPaths;
    
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}