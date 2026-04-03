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

async function launchBrowser(width = 1080, height = 1080, retryCount = 0) {
  const browserArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-file-access-from-files'
  ];

  try {
    return await puppeteer.launch({
      executablePath: PUPPETEER_EXEC_PATH || undefined,
      headless: true,
      args: browserArgs,
      defaultViewport: { width, height, deviceScaleFactor: 3 } // 3x retina for ultra-crisp output
    });
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Browser launch failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await sleep(1000);
      return launchBrowser(width, height, retryCount + 1);
    }
    throw error;
  }
}

async function renderTemplate(page, htmlFile, variables, outputPath) {
  const templatePath = path.join(__dirname, '../../templates', htmlFile);
  
  await page.setCacheEnabled(false);
  const loadResult = await page.goto(`file://${templatePath}`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  if (!loadResult) throw new Error(`Failed to load template ${htmlFile}`);

  // Inject variables
  await page.evaluate((vars) => {
    for (const [id, value] of Object.entries(vars)) {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'reflection-body') {
          // Special handling for multi-paragraph HTML
          el.innerHTML = value.split('\n\n').map(p => `<p>${p}</p>`).join('');
        } else {
          el.textContent = value;
        }
      }
    }
  }, variables);

  try {
    await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 });
  } catch (fontError) {
    console.log('⚠️ Font ready check timed out, continuing...');
  }

  // Inject rendering quality CSS at runtime
  await page.addStyleTag({ content: `
    * { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
    html { text-rendering: optimizeLegibility !important; }
  `});

  await sleep(2000); // Extra settle time for fonts, gradients, and animations

  // Get exact viewport dimensions to clip precisely
  const viewport = page.viewport();
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    captureBeyondViewport: false
  });

  return outputPath;
}

export async function renderQuote({ text, theme }, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering quote...');
    browser = await launchBrowser(1080, 1080);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'power_quote.html', {
      'quote-text': text,
      'theme-badge': theme
    }, outputPath);
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderDailyVerse(verseData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering daily verse...');
    browser = await launchBrowser(1080, 1080);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'daily_verse.html', {
      'quote-text': verseData.verse,
      'scripture-ref': verseData.reference
    }, outputPath);
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderWeeklyReflection(reflectionData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering weekly reflection...');
    browser = await launchBrowser(1080, 1920); // Story size
    const page = await browser.newPage();
    
    await renderTemplate(page, 'weekly_reflection.html', {
      'title': reflectionData.title,
      'scripture-text': reflectionData.scripture,
      'scripture-ref': reflectionData.reference,
      'reflection-body': reflectionData.reflection, // Will be parsed as paragraphs inside evaluate
      'prayer-text': reflectionData.prayer
    }, outputPath);
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderCarousel({ slides, theme }, outputDir) {
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
      
      await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.evaluate((slideData, index, total, themeName) => {
        const el = id => document.getElementById(id);
        if (el('slide-number')) el('slide-number').textContent = index + 1;
        if (el('slide-total')) el('slide-total').textContent = `${index + 1} OF ${total}`;
        if (el('topic-badge')) el('topic-badge').textContent = themeName;
        if (el('title')) el('title').textContent = slideData.title || '';
        if (el('quote-text')) el('quote-text').textContent = slideData.content || '';
        
        const refObj = el('scripture-ref');
        const refBox = el('reference-box');
        if (slideData.reference && refObj && refBox) {
          refObj.textContent = slideData.reference;
          refBox.style.display = 'block';
        } else if (refBox) {
          refBox.style.display = 'none';
        }
        
        const progressBar = el('progress-bar');
        if (progressBar) progressBar.style.width = ((index + 1) / total * 100) + '%';
        
        const progressDots = document.querySelectorAll('.dot');
        progressDots.forEach((dot, dotIndex) => {
          dot.classList.toggle('active', dotIndex === index);
        });
      }, slide, i, slides.length, theme);
      
      try { await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 }); } catch {}

      // Inject rendering quality CSS
      await page.addStyleTag({ content: `
        * { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
        html { text-rendering: optimizeLegibility !important; }
      `});

      await sleep(1500);
      
      const vp = page.viewport();
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: vp.width, height: vp.height },
        captureBeyondViewport: false
      });
      outputPaths.push(outputPath);
      await page.close();
    }
    
    console.log(`✅ Carousel rendered: ${outputPaths.length} slides`);
    return outputPaths;
    
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export function isConfigured() {
  return true;
}