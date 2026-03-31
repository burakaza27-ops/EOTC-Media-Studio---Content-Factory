import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

const log = (level, ...args) => {
  if (LOG_LEVELS[level] >= LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    console[`${level === 'DEBUG' ? 'log' : level.toLowerCase()}`](`[${timestamp}] [${level}]`, ...args);
  }
};

class PipelineError extends Error {
  constructor(message, stage, isRetryable = false) {
    super(message);
    this.name = 'PipelineError';
    this.stage = stage;
    this.isRetryable = isRetryable;
  }
}

async function withTimeout(promise, ms, timeoutMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms))
  ]);
}

import { generateQuote, generateDailyVerse, generateCarousel, generateWeeklyReflection } from './ai/openrouter.js';
import { checkDuplicate, saveQuote } from './db/supabase.js';
import { sendToTelegram, sendMessage, sendCarousel } from './telegram/bot.js';
import { renderQuote, renderDailyVerse, renderCarousel, renderWeeklyReflection } from './render/puppeteer.js';
import { getLiturgicalContext } from './utils/calendar.js';

const CONFIG = {
  tempDir: path.join(__dirname, '../temp'),
  carouselDir: path.join(__dirname, '../temp/carousel'),
  outputDir: __dirname,
  outputFile: 'output.png',
  stages: {
    ai: 'AI Generation',
    duplicate: 'Duplicate Check',
    render: 'Image Rendering',
    save: 'Database Save',
    telegram: 'Telegram Send'
  }
};

function ensureDirectories() {
  if (!fs.existsSync(CONFIG.tempDir)) fs.mkdirSync(CONFIG.tempDir, { recursive: true });
  if (!fs.existsSync(CONFIG.carouselDir)) fs.mkdirSync(CONFIG.carouselDir, { recursive: true });
}

function getCarouselDir() {
  const dir = path.join(CONFIG.carouselDir, `run_${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getOutputPath() {
  const timestamp = Date.now();
  return {
    temp: path.join(CONFIG.tempDir, `media_${timestamp}.png`),
    final: path.join(CONFIG.outputDir, CONFIG.outputFile)
  };
}

async function runStage(stageName, fn) {
  log('INFO', `🚀 Starting: ${CONFIG.stages[stageName] || stageName}`);
  const startTime = Date.now();
  try {
    const result = await fn();
    log('INFO', `✅ Completed: ${CONFIG.stages[stageName] || stageName} (${Date.now() - startTime}ms)`);
    return result;
  } catch (error) {
    throw new PipelineError(`${CONFIG.stages[stageName] || stageName} failed: ${error.message}`, stageName);
  }
}

async function pipelineWrapper(paths, genFn, renderFn, getCaptionFn, dbTextFn, stageNameModifier) {
  const aiData = await runStage(`ai_${stageNameModifier}`, async () => {
    return await withTimeout(genFn(), 60000, 'AI generation timeout');
  });

  const dbText = dbTextFn(aiData);
  const isDuplicate = await runStage('duplicate', () => checkDuplicate(dbText));
  
  if (isDuplicate) {
    log('WARN', '⚠️ Duplicate detected - stopping pipeline');
    await sendMessage(`⚠️ <b>EOTC Media Studio</b>\n\nDuplicate skipped.\n\n"${dbText}"`);
    return;
  }

  const tempOutputPath = await runStage(`render_${stageNameModifier}`, async () => {
    return await withTimeout(renderFn(aiData, paths.temp), 45000, 'Render timeout');
  });

  if (!fs.existsSync(tempOutputPath)) throw new PipelineError('Render output not found', 'render');
  fs.copyFileSync(tempOutputPath, paths.final);
  log('INFO', `📦 Output saved to: ${paths.final}`);

  await runStage('save', () => saveQuote(dbText));

  await runStage(`telegram_${stageNameModifier}`, async () => {
    const caption = getCaptionFn(aiData);
    const result = await sendToTelegram(paths.final, caption);
    if (result?.skipped) log('WARN', '📋 Telegram skipped (not configured)');
    else if (!result?.success) throw new Error(result?.error || 'Telegram send failed');
  });
}

async function runQuotePipeline(paths, liturgicalContext = null) {
  await pipelineWrapper(paths,
    () => generateQuote(liturgicalContext),
    renderQuote,
    (data) => {
      const litTag = data.liturgicalEvent ? `\n🗓️ ${data.liturgicalEvent}` : '';
      return `<b>✨ የእለቱ መንፈሳዊ ቃል</b>${litTag}\n\n${data.text}\n\n#EOTCYouth #${data.theme} #OrthodoxQuote`;
    },
    (data) => data.text,
    'quote'
  );
}

async function runVersePipeline(paths, liturgicalContext = null) {
  await pipelineWrapper(paths,
    () => generateDailyVerse(liturgicalContext),
    renderDailyVerse,
    (data) => {
      const litTag = data.liturgicalEvent ? `\n🗓️ ${data.liturgicalEvent}` : '';
      return `<b>📖 የእግዚአብሔር ቃል</b>${litTag}\n\nበእለቱ የምናነበው\n<i>${data.verse}</i>\n— <b>${data.reference}</b>\n\n#DailyVerse #EOTC #Scripture`;
    },
    (data) => `${data.verse} - ${data.reference}`,
    'verse'
  );
}

async function runReflectionPipeline(paths, liturgicalContext = null) {
  await pipelineWrapper(paths,
    () => generateWeeklyReflection(liturgicalContext),
    renderWeeklyReflection,
    (data) => {
      const litTag = data.liturgicalEvent ? `\n🗓️ ${data.liturgicalEvent}` : '';
      return `<b>✝️ የሳምንቱ መንፈሳዊ ትምህርት</b>${litTag}\n\n<b>የርዕስ ቃል:</b> ${data.title}\n\n<i>"${data.scripture}"</i> — ${data.reference}\n\n#WeeklyReflection #OrthodoxTeaching #${data.theme}`;
    },
    (data) => `Reflection: ${data.title} - ${data.reference}`,
    'reflection'
  );
}

async function runCarouselPipeline(liturgicalContext = null) {
  const carouselData = await runStage('ai_carousel', async () => {
    return await withTimeout(generateCarousel(null, liturgicalContext), 70000, 'Carousel generation timeout');
  });

  const outputDir = getCarouselDir();
  
  const carouselPaths = await runStage('render_carousel', async () => {
    return await withTimeout(renderCarousel(carouselData, outputDir), 90000, 'Carousel render timeout');
  });

  await runStage('save', () => saveQuote(`Carousel: ${carouselData.theme} - ${carouselData.slides[0]?.title}`));

  await runStage('telegram_carousel', async () => {
    const litTag = carouselData.liturgicalEvent ? `\n🗓️ ${carouselData.liturgicalEvent}` : '';
    const caption = `<b>🎠 መንፈሳዊ ትምህርት | ${carouselData.theme}</b>${litTag}\n\nበእያንዳንዱ ገጽ ላይ ያለውን መልካም ዜና ተከተሉ. ሥዕሎቹን ወደ ጎን እያሳለፉ ያንብቡ።\n\n#EOTCYouth #OrthodoxTeaching #${carouselData.theme}`;
    const result = await sendCarousel(carouselPaths, caption);
    if (result?.skipped) log('WARN', '📋 Carousel Telegram skipped');
    else if (!result?.success) throw new Error(result?.error || 'Carousel send failed');
  });
}

async function main() {
  const args = process.argv.slice(2);
  const contentType = args.find(a => !a.startsWith('--')) || 'quote';
  const useLiturgical = args.includes('--liturgical');
  const startTime = Date.now();
  
  log('INFO', '═══════════════════════════════════════════════════════');
  log('INFO', `🎬 EOTC Media Studio v4.0 - Liturgical Intelligence`);
  log('INFO', `📋 Content Flow: [${contentType.toUpperCase()}]${useLiturgical ? ' + 📅 LITURGICAL' : ''}`);
  log('INFO', '═══════════════════════════════════════════════════════');
  
  ensureDirectories();
  const paths = getOutputPath();
  
  // Resolve liturgical context if the flag is active
  let liturgicalContext = null;
  if (useLiturgical) {
    liturgicalContext = getLiturgicalContext();
    if (liturgicalContext) {
      log('INFO', `📅 Liturgical Context: ${liturgicalContext.event} (${liturgicalContext.mood})`);
    } else {
      log('INFO', '📅 No special liturgical event today. Using general theme.');
    }
  }
  
  try {
    switch(contentType) {
      case 'verse': await runVersePipeline(paths, liturgicalContext); break;
      case 'reflection': await runReflectionPipeline(paths, liturgicalContext); break;
      case 'carousel': await runCarouselPipeline(liturgicalContext); break;
      case 'quote':
      default: await runQuotePipeline(paths, liturgicalContext); break;
    }
    
    log('INFO', '═══════════════════════════════════════════════════════');
    log('INFO', `✅ Pipeline [${contentType}] complete in ${Date.now() - startTime}ms`);
    log('INFO', '═══════════════════════════════════════════════════════');
    
  } catch (error) {
    const errorMsg = error.stage ? `[${error.stage}] ${error.message}` : error.message;
    log('ERROR', '❌ Pipeline failed:', errorMsg);
    if (error.stage !== 'init') {
      try {
        await sendMessage(`❌ <b>System Error (${contentType})</b>\n\n${errorMsg}`);
      } catch (e) {}
    }
    process.exit(1);
  } finally {
    // Cleanup temporary output paths
    try {
      if (fs.existsSync(paths.temp)) fs.unlinkSync(paths.temp);
      const tempFiles = fs.readdirSync(CONFIG.tempDir).filter(f => f.startsWith('media_'));
      tempFiles.forEach(f => fs.unlinkSync(path.join(CONFIG.tempDir, f)));
    } catch {}
  }
}

process.on('SIGINT', () => process.exit(0));
process.on('unhandledRejection', (r) => { log('ERROR', 'Unhandled rejection:', r); process.exit(1); });

main();