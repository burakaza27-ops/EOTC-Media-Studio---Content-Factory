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

async function launchBrowser(width = 1080, height = 1080, deviceScaleFactor = 3, retryCount = 0) {
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
      defaultViewport: { width, height, deviceScaleFactor }
    });
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Browser launch failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await sleep(1000);
      return launchBrowser(width, height, deviceScaleFactor, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Injects mood-based CSS variables and Ethiopian date badge into the page.
 * This is called for EVERY template to ensure consistent contextual styling.
 */
async function injectContext(page, context = {}) {
  const mood = context?.mood || DEFAULT_MOOD;
  const palette = MOOD_PALETTES[mood] || MOOD_PALETTES[DEFAULT_MOOD];
  const ethDate = context?.ethiopianDate || '';

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
  `});

  // Inject Ethiopian date badge if the element exists
  if (ethDate) {
    await page.evaluate((dateText) => {
      const badge = document.getElementById('eth-date-badge');
      if (badge) badge.textContent = dateText;
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

  // Inject variables
  await page.evaluate((vars) => {
    for (const [id, value] of Object.entries(vars)) {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'reflection-body') {
          el.innerHTML = value.split('\n\n').map(p => `<p>${p}</p>`).join('');
        } else if (id === 'fasting-rules-list') {
          el.innerHTML = value;
        } else if (id === 'calendar-grid') {
          el.innerHTML = value;
        } else if (id === 'kidase-dialogue') {
          el.innerHTML = value;
        } else {
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
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
    captureBeyondViewport: false
  });

  return outputPath;
}

// ═══════════════════════════════════════════════════════════
//  RENDER FUNCTIONS — One per content type
// ═══════════════════════════════════════════════════════════

export async function renderQuote({ text, theme, liturgicalContext }, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering quote...');
    browser = await launchBrowser(1080, 1080, 3);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'power_quote.html', {
      'quote-text': text,
      'theme-badge': theme
    }, outputPath, { liturgicalContext });
    
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
    browser = await launchBrowser(1080, 1080, 3);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'daily_verse.html', {
      'quote-text': verseData.verse,
      'scripture-ref': verseData.reference
    }, outputPath, { liturgicalContext: verseData.liturgicalContext });
    
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
    browser = await launchBrowser(1080, 1920, 2);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'weekly_reflection.html', {
      'title': reflectionData.title,
      'scripture-text': reflectionData.scripture,
      'scripture-ref': reflectionData.reference,
      'reflection-body': reflectionData.reflection,
      'prayer-text': reflectionData.prayer
    }, outputPath, { dynamicHeight: true, liturgicalContext: reflectionData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderCarousel({ slides, theme, liturgicalContext }, outputDir) {
  const templatePath = path.join(__dirname, '../../templates/deep_dive.html');
  const outputPaths = [];
  let browser = null;
  
  try {
    console.log(`🎨 Rendering ${slides.length} carousel slides...`);
    browser = await launchBrowser(1080, 1350, 3);
    
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

      await injectContext(page, liturgicalContext);
      
      try { await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 }); } catch {}
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

export async function renderSaintOfDay(saintData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering Saint of the Day...');
    browser = await launchBrowser(1080, 1080, 3);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'saint_day.html', {
      'saint-name': saintData.saint,
      'saint-story': saintData.story,
      'saint-lesson': saintData.lesson,
      'feast-type-badge': saintData.feastType || 'Saint',
      'scripture-ref': saintData.reference || ''
    }, outputPath, { liturgicalContext: saintData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderFastingGuide(fastingData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering Fasting Guide...');
    browser = await launchBrowser(1080, 1350, 3);
    const page = await browser.newPage();
    
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
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderCalendarSummary(calendarData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering Weekly Calendar...');
    browser = await launchBrowser(1080, 1920, 2);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'calendar_summary.html', {
      'week-title': calendarData.weekTitle,
      'calendar-grid': calendarData.gridHtml
    }, outputPath, { dynamicHeight: true, liturgicalContext: calendarData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderHolyWeek(holyWeekData, outputPath) {
  let browser = null;
  try {
    console.log(`🎨 Rendering Holy Week: ${holyWeekData.dayName}...`);
    browser = await launchBrowser(1080, 1350, 3);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'holy_week.html', {
      'day-name': holyWeekData.dayName,
      'day-subtitle': holyWeekData.subtitle,
      'teaching-text': holyWeekData.teaching,
      'scripture-text': holyWeekData.scripture,
      'scripture-ref': holyWeekData.reference
    }, outputPath, { liturgicalContext: holyWeekData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export async function renderChurchHistory(historyData, outputPath) {
  let browser = null;
  try {
    console.log('🎨 Rendering Church History...');
    browser = await launchBrowser(1080, 1350, 3);
    const page = await browser.newPage();
    
    await renderTemplate(page, 'church_history.html', {
      'era-badge': historyData.era,
      'title': historyData.title,
      'history-text': historyData.narrative,
      'significance-text': historyData.significance,
      'year-badge': historyData.year || ''
    }, outputPath, { liturgicalContext: historyData.liturgicalContext });
    
    console.log(`✅ Rendered: ${outputPath}`);
    return outputPath;
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}

export function isConfigured() {
  return true;
}