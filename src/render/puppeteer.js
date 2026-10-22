import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('render');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveExecutablePath() {
  if (process.env.PUPPETEER_EXEC_PATH && fs.existsSync(process.env.PUPPETEER_EXEC_PATH)) {
    return process.env.PUPPETEER_EXEC_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return undefined;
}

const PUPPETEER_EXEC_PATH = resolveExecutablePath();
const MAX_RETRIES = 2;
const MAX_FILE_SIZE_BYTES = 9.5 * 1024 * 1024; // 9.5MB — safe margin under Telegram's 10MB limit

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * If a rendered PNG exceeds the Telegram size limit, re-screenshot as JPEG
 * at progressive quality levels until the file fits.
 * Returns the final output path (may switch extension to .jpg).
 */
async function compressIfNeeded(page, pngPath, clip) {
  const stats = fs.statSync(pngPath);
  if (stats.size <= MAX_FILE_SIZE_BYTES) return pngPath;

  const sizeMb = (stats.size / 1024 / 1024).toFixed(1);
  log.warn(`PNG is ${sizeMb}MB — compressing to JPEG...`, { sizeMb, maxMb: 10 });
  const jpgPath = pngPath.replace(/\.png$/i, '.jpg');

  for (const quality of [85, 75, 65]) {
    await page.screenshot({
      path: jpgPath,
      type: 'jpeg',
      quality,
      fullPage: false,
      clip,
      captureBeyondViewport: false
    });
    const jpgStats = fs.statSync(jpgPath);
    const jpgMb = (jpgStats.size / 1024 / 1024).toFixed(1);
    log.debug(`JPEG compression attempt`, { quality, sizeMb: jpgMb });
    if (jpgStats.size <= MAX_FILE_SIZE_BYTES) {
      // Remove oversized PNG, keep JPEG
      try { fs.unlinkSync(pngPath); } catch {}
      return jpgPath;
    }
  }

  // Last resort: keep JPEG at quality 55
  await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 55, fullPage: false, clip, captureBeyondViewport: false });
  try { fs.unlinkSync(pngPath); } catch {}
  const finalMb = (fs.statSync(jpgPath).size / 1024 / 1024).toFixed(1);
  log.warn(`Final JPEG size: ${finalMb}MB`, { sizeMb: finalMb });
  return jpgPath;
}

// ═══════════════════════════════════════════════════════════
//  MOOD-BASED COLOR PALETTES
//  Each liturgical mood maps to a unique color scheme
//  injected into templates via CSS custom properties.
// ═══════════════════════════════════════════════════════════

const MOOD_PALETTES = {
  joyful: {
    '--mood-primary': '#d4af37',
    '--mood-primary-light': '#f0d890',
    '--mood-primary-dim': '#8a7122',
    '--mood-glow': 'rgba(212, 175, 55, 0.25)',
    '--mood-bg-accent': 'rgba(212, 175, 55, 0.08)',
    '--mood-accent-secondary': 'rgba(218, 165, 32, 0.12)',
  },
  triumphant: {
    '--mood-primary': '#ffd700',
    '--mood-primary-light': '#fff4b0',
    '--mood-primary-dim': '#b8962e',
    '--mood-glow': 'rgba(255, 215, 0, 0.30)',
    '--mood-bg-accent': 'rgba(255, 215, 0, 0.10)',
    '--mood-accent-secondary': 'rgba(255, 255, 255, 0.15)',
  },
  penitential: {
    '--mood-primary': '#9b72cf',
    '--mood-primary-light': '#c4a8e0',
    '--mood-primary-dim': '#6b4d8a',
    '--mood-glow': 'rgba(155, 114, 207, 0.22)',
    '--mood-bg-accent': 'rgba(100, 60, 150, 0.10)',
    '--mood-accent-secondary': 'rgba(155, 114, 207, 0.08)',
  },
  contemplative: {
    '--mood-primary': '#6b9bd2',
    '--mood-primary-light': '#a8c8e8',
    '--mood-primary-dim': '#4a6d94',
    '--mood-glow': 'rgba(107, 155, 210, 0.20)',
    '--mood-bg-accent': 'rgba(60, 100, 160, 0.08)',
    '--mood-accent-secondary': 'rgba(107, 155, 210, 0.06)',
  },
  celebratory: {
    '--mood-primary': '#d4af37',
    '--mood-primary-light': '#f3e5ab',
    '--mood-primary-dim': '#8a7122',
    '--mood-glow': 'rgba(212, 175, 55, 0.28)',
    '--mood-bg-accent': 'rgba(212, 175, 55, 0.10)',
    '--mood-accent-secondary': 'rgba(34, 139, 34, 0.08)',
  },
  devotional: {
    '--mood-primary': '#d4af37',
    '--mood-primary-light': '#f0d890',
    '--mood-primary-dim': '#8a7122',
    '--mood-glow': 'rgba(212, 175, 55, 0.20)',
    '--mood-bg-accent': 'rgba(212, 175, 55, 0.06)',
    '--mood-accent-secondary': 'rgba(212, 175, 55, 0.05)',
  }
};

const DEFAULT_MOOD = 'devotional';

// ═══════════════════════════════════════════════════════════
//  SINGLETON BROWSER POOL
//  Instead of launching and killing Chromium 9 times during an
//  'all' pipeline run, keep one browser alive and open/close pages.
// ═══════════════════════════════════════════════════════════

let _browserInstance = null;
let _browserLaunchPromise = null;

async function getBrowser() {
  // If already launched, verify it's still alive
  if (_browserInstance) {
    try {
      // Quick liveness check
      await _browserInstance.version();
      return _browserInstance;
    } catch {
      _browserInstance = null;
    }
  }

  // Prevent concurrent launch attempts
  if (_browserLaunchPromise) {
    return _browserLaunchPromise;
  }

  _browserLaunchPromise = (async () => {
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      // SECURITY: Removed --disable-web-security and --allow-file-access-from-files
      // which allowed XSS and arbitrary file reads in rendered templates.
      '--disable-features=IsolateOrigins,site-per-process'
    ];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        _browserInstance = await puppeteer.launch({
          executablePath: PUPPETEER_EXEC_PATH || undefined,
          headless: true,
          args: browserArgs,
          // Default viewport — individual renders override via page.setViewport()
          defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 2 }
        });
        log.info('Browser pool: Chromium launched (singleton)');
        
        // Auto-cleanup if process exits
        _browserInstance.on('disconnected', () => {
          _browserInstance = null;
          _browserLaunchPromise = null;
        });
        
        return _browserInstance;
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        log.warn(`Browser launch failed, retrying (${attempt + 1}/${MAX_RETRIES})...`, { error: error.message });
        await sleep(1000);
      }
    }
  })();

  try {
    const browser = await _browserLaunchPromise;
    return browser;
  } finally {
    _browserLaunchPromise = null;
  }
}

/**
 * Opens a new page with the given viewport, runs the render, then closes the page.
 * The browser itself stays alive for reuse.
 */
async function withPage(width, height, scaleFactor, fn) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: scaleFactor });
    return await fn(page);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Gracefully close the shared browser (call on process exit).
 */
export async function closeBrowserPool() {
  if (_browserInstance) {
    try {
      await _browserInstance.close();
      log.info('Browser pool: Chromium closed');
    } catch {}
    _browserInstance = null;
  }
}

/**
 * Injects mood-based CSS variables and Ethiopian date badge into the page.
 * This is called for EVERY template to ensure consistent contextual styling.
 */
async function injectContext(page, context = {}) {
  const mood = context?.mood || DEFAULT_MOOD;
  const palette = MOOD_PALETTES[mood] || MOOD_PALETTES[DEFAULT_MOOD];
  const ethDate = context?.ethiopianDate || context?.ethiopianDateFormatted || '';

  // Inject mood palette as CSS custom properties
  const cssVars = Object.entries(palette)
    .map(([key, val]) => `${key}: ${val};`)
    .join('\n    ');

  await page.addStyleTag({ content: `
    :root {
      ${cssVars}
    }
    * { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
    html { text-rendering: optimizeLegibility !important; }
    .eth-date:empty { display: none !important; }
  `});

  // Inject Ethiopian date badge if the element exists
  if (ethDate) {
    await page.evaluate((dateText) => {
      const badge = document.getElementById('eth-date-badge');
      if (badge) {
        badge.textContent = dateText;
        badge.style.display = 'block';
      }
    }, ethDate);
  }
}

async function renderTemplate(page, htmlFile, variables, outputPath, options = {}) {
  const templatePath = path.join(__dirname, '../../templates', htmlFile);
  
  await page.setCacheEnabled(false);
  const loadResult = await page.goto(`file://${templatePath}`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  if (!loadResult) throw new Error(`Failed to load template ${htmlFile}`);

  // Inject variables — use textContent by default to prevent XSS.
  // Only specific IDs that require structured HTML use innerHTML with sanitization.
  await page.evaluate((vars) => {
    // IDs that legitimately need HTML injection (structured content from pipeline code, not AI)
    const HTML_IDS = new Set(['reflection-body', 'fasting-rules-list', 'calendar-grid', 'kidase-dialogue']);
    
    for (const [id, value] of Object.entries(vars)) {
      if (id === 'progress-percent') {
        const bar = document.getElementById('progress-bar');
        if (bar) bar.style.width = `${value}%`;
      }
      const el = document.getElementById(id);
      if (el) {
        if (id === 'reflection-body') {
          // Split paragraphs and wrap — content is Amharic text, not raw HTML
          const paras = String(value).split('\n\n').map(p => {
            const safe = p.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<p>${safe}</p>`;
          }).join('');
          el.innerHTML = paras;
        } else if (HTML_IDS.has(id)) {
          // These contain pipeline-generated HTML (grid rows, rule lists).
          // They come from our own JS code, not raw AI output.
          el.innerHTML = value;
        } else {
          // Default: safe textContent injection (no HTML execution)
          el.textContent = value;
        }
      }
    }
  }, variables);

  // Inject liturgical context (mood colors + date)
  await injectContext(page, options.liturgicalContext);

  try {
    await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 });
  } catch (fontError) {
    console.log('⚠️ Font ready check timed out, continuing...');
  }

  await sleep(2000);

  // Handle dynamic height for long content
  if (options.dynamicHeight) {
    const fullHeight = await page.evaluate(() => {
      return Math.max(document.body.scrollHeight, document.body.offsetHeight, 1920);
    });
    
    const viewport = page.viewport();
    await page.setViewport({
      width: viewport.width,
      height: fullHeight,
      deviceScaleFactor: viewport.deviceScaleFactor
    });
  }

  const vp = page.viewport();
  const clip = { x: 0, y: 0, width: vp.width, height: vp.height };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false,
    clip,
    captureBeyondViewport: false
  });

  // Auto-compress if PNG exceeds Telegram's 10MB limit
  const finalPath = await compressIfNeeded(page, outputPath, clip);
  return finalPath;
}

// ═══════════════════════════════════════════════════════════
//  RENDER FUNCTIONS — One per content type
// ═══════════════════════════════════════════════════════════

export async function renderQuote({ text, theme, liturgicalContext }, outputPath) {
  return withPage(1080, 1080, 2, async (page) => {
    console.log('🎨 Rendering quote...');
    
    await renderTemplate(page, 'power_quote.html', {
      'quote-text': text,
      'theme-badge': theme
    }, outputPath, { liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderDailyVerse(verseData, outputPath) {
  return withPage(1080, 1080, 2, async (page) => {
    console.log('🎨 Rendering daily verse...');
    
    await renderTemplate(page, 'daily_verse.html', {
      'quote-text': verseData.verse,
      'scripture-ref': verseData.reference
    }, outputPath, { liturgicalContext: verseData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderWeeklyReflection(reflectionData, outputPath) {
  return withPage(1080, 1920, 2, async (page) => {
    console.log('🎨 Rendering weekly reflection...');
    
    await renderTemplate(page, 'weekly_reflection.html', {
      'title': reflectionData.title,
      'scripture-text': reflectionData.scripture,
      'scripture-ref': reflectionData.reference,
      'reflection-body': reflectionData.reflection,
      'prayer-text': reflectionData.prayer
    }, outputPath, { dynamicHeight: true, liturgicalContext: reflectionData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderCarousel({ slides, theme, liturgicalContext, aspectRatio = null }, outputDir) {
  const templatePath = path.join(__dirname, '../../templates/deep_dive.html');
  const outputPaths = [];

  const targetRatio = (aspectRatio || process.env.CAROUSEL_ASPECT_RATIO || process.env.ASPECT_RATIO || '1:1').trim();
  const ASPECT_CONFIGS = {
    '1:1':  { width: 1080, height: 1080, label: '1:1 Square' },
    '9:16': { width: 1080, height: 1920, label: '9:16 Vertical Reel/Story' },
    '4:5':  { width: 1080, height: 1350, label: '4:5 Portrait Feed' }
  };
  const config = ASPECT_CONFIGS[targetRatio] || ASPECT_CONFIGS['1:1'];

  fs.mkdirSync(outputDir, { recursive: true });
  
  const browser = await getBrowser();
  console.log(`🎨 Rendering ${slides.length} carousel slides (${config.label} ${config.width}×${config.height})...`);
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const outputPath = path.join(outputDir, `carousel_${i + 1}.png`);
    
    console.log(`  📊 Rendering slide ${i + 1}/${slides.length}...`);
    const page = await browser.newPage();
    try {
      await page.setCacheEnabled(false);
      await page.setViewport({ width: config.width, height: config.height, deviceScaleFactor: 2 });
      
      await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.evaluate((slideData, index, total, themeName, ratioKey, w, h) => {
        const ratioClass = `aspect-${ratioKey.replace(':', '-')}`;
        document.body.classList.add(ratioClass);
        document.body.style.width = `${w}px`;
        document.body.style.height = `${h}px`;

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
        
        const dotsContainer = el('progress-dots');
        if (dotsContainer) {
          dotsContainer.innerHTML = '';
          for (let d = 0; d < total; d++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (d === index ? ' active' : '');
            dotsContainer.appendChild(dot);
          }
        }
      }, slide, i, slides.length, theme, targetRatio, config.width, config.height);

      await injectContext(page, liturgicalContext);
      
      try { await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 }); } catch {}
      await sleep(1500);
      
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: config.width, height: config.height },
        captureBeyondViewport: false
      });
      outputPaths.push(outputPath);
    } finally {
      await page.close().catch(() => {});
    }
  }
  
  console.log(`✅ Carousel rendered: ${outputPaths.length} slides (${config.label})`);
  return outputPaths;
}

export async function renderSaintOfDay(saintData, outputPath) {
  return withPage(1080, 1080, 2, async (page) => {
    if (saintData.isLordFeast) {
      console.log('🎨 Rendering Feast of the Lord...');
    } else {
      console.log('🎨 Rendering Saint of the Day...');
    }
    
    const footerText = saintData.isLordFeast ? 'Feast of the Day • EOTC Youth' : 'Saint of the Day • EOTC Youth';
    
    await renderTemplate(page, 'saint_day.html', {
      'saint-name': saintData.saint,
      'saint-story': saintData.story,
      'saint-lesson': saintData.lesson,
      'feast-type-badge': saintData.feastType || (saintData.isLordFeast ? 'በዓል' : 'Saint'),
      'scripture-ref': saintData.reference || '',
      'footer-text': footerText
    }, outputPath, { liturgicalContext: saintData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderFastingGuide(fastingData, outputPath) {
  return withPage(1080, 1350, 2, async (page) => {
    console.log('🎨 Rendering Fasting Guide...');
    
    await renderTemplate(page, 'fasting_guide.html', {
      'fast-name': fastingData.name,
      'fast-day-count': fastingData.dayLabel,
      'encouragement-text': fastingData.encouragement,
      'fasting-rules-list': fastingData.rulesHtml,
      'scripture-ref': fastingData.reference || '',
      'progress-percent': fastingData.progressPercent || '0'
    }, outputPath, { liturgicalContext: fastingData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderCalendarSummary(calendarData, outputPath) {
  return withPage(1080, 1920, 2, async (page) => {
    console.log('🎨 Rendering Weekly Calendar...');
    
    await renderTemplate(page, 'calendar_summary.html', {
      'week-title': calendarData.weekTitle,
      'calendar-grid': calendarData.gridHtml
    }, outputPath, { dynamicHeight: true, liturgicalContext: calendarData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderHolyWeek(holyWeekData, outputPath) {
  return withPage(1080, 1350, 2, async (page) => {
    console.log(`🎨 Rendering Holy Week: ${holyWeekData.dayName}...`);
    
    await renderTemplate(page, 'holy_week.html', {
      'day-name': holyWeekData.dayName,
      'day-subtitle': holyWeekData.subtitle,
      'teaching-text': holyWeekData.teaching,
      'scripture-text': holyWeekData.scripture,
      'scripture-ref': holyWeekData.reference
    }, outputPath, { liturgicalContext: holyWeekData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export async function renderChurchHistory(historyData, outputPath) {
  return withPage(1080, 1350, 2, async (page) => {
    console.log('🎨 Rendering Church History...');
    
    await renderTemplate(page, 'church_history.html', {
      'era-badge': historyData.era,
      'title': historyData.title,
      'history-text': historyData.narrative,
      'significance-text': historyData.significance,
      'year-badge': historyData.year || ''
    }, outputPath, { liturgicalContext: historyData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  });
}

export function isConfigured() {
  return true;
}