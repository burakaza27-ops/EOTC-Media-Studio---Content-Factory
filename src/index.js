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

const logError = (ctx, error) => {
  log('ERROR', `❌ ${ctx}:`, error.message);
  if (error.stack) log('DEBUG', error.stack);
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
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    )
  ]);
}

import { generateQuote, generateCarousel } from './ai/openrouter.js';
import { checkDuplicate, saveQuote } from './db/supabase.js';
import { sendToTelegram, sendMessage, sendCarousel } from './telegram/bot.js';
import { renderQuote, renderCarousel } from './render/puppeteer.js';

const CONFIG = {
  tempDir: path.join(__dirname, '../temp'),
  carouselDir: path.join(__dirname, '../temp/carousel'),
  outputDir: __dirname,
  outputFile: 'output.png',
  maxRetries: 2,
  stages: {
    ai: 'AI Generation',
    ai_carousel: 'Carousel Content Generation',
    duplicate: 'Duplicate Check',
    render: 'Image Rendering',
    render_carousel: 'Carousel Rendering',
    save: 'Database Save',
    telegram: 'Telegram Send',
    telegram_carousel: 'Carousel Send'
  }
};

function ensureDirectories() {
  try {
    if (!fs.existsSync(CONFIG.tempDir)) {
      fs.mkdirSync(CONFIG.tempDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.carouselDir)) {
      fs.mkdirSync(CONFIG.carouselDir, { recursive: true });
    }
    log('INFO', '📁 Directories ready');
  } catch (error) {
    throw new PipelineError('Failed to create directories', 'init', false);
  }
}

function getCarouselDir() {
  const timestamp = Date.now();
  const carouselDir = path.join(CONFIG.carouselDir, `run_${timestamp}`);
  if (!fs.existsSync(carouselDir)) {
    fs.mkdirSync(carouselDir, { recursive: true });
  }
  return carouselDir;
}

function getOutputPath() {
  const timestamp = Date.now();
  const tempOutput = path.join(CONFIG.tempDir, `quote_${timestamp}.png`);
  const finalOutput = path.join(CONFIG.outputDir, CONFIG.outputFile);
  return { temp: tempOutput, final: finalOutput };
}

async function cleanup(tempPath) {
  try {
    if (tempPath && fs.existsSync(tempPath) && tempPath !== path.join(CONFIG.outputDir, CONFIG.outputFile)) {
      fs.unlinkSync(tempPath);
      log('DEBUG', '🧹 Temp file cleaned up');
    }
  } catch (error) {
    log('WARN', 'Cleanup warning:', error.message);
  }
}

async function runStage(stageName, fn) {
  log('INFO', `🚀 Starting: ${CONFIG.stages[stageName] || stageName}`);
  const startTime = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - startTime;
    log('INFO', `✅ Completed: ${CONFIG.stages[stageName] || stageName} (${elapsed}ms)`);
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    throw new PipelineError(
      `${CONFIG.stages[stageName] || stageName} failed: ${error.message}`,
      stageName,
      error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const contentType = args[0] || 'quote';
  
  const startTime = Date.now();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  log('INFO', '═══════════════════════════════════════════════════════');
  log('INFO', `🎬 EOTC Media Studio v2.0 - ${sessionId}`);
  log('INFO', `📋 Content type: ${contentType}`);
  log('INFO', '═══════════════════════════════════════════════════════');
  
  ensureDirectories();
  
  const paths = getOutputPath();
  let currentQuote = null;
  let tempOutputPath = null;
  
  try {
    if (contentType === 'carousel') {
      await runCarouselPipeline(startTime);
    } else {
      await runQuotePipeline(paths);
    }
    
    const totalTime = Date.now() - startTime;
    log('INFO', '═══════════════════════════════════════════════════════');
    log('INFO', `✅ Pipeline complete in ${totalTime}ms`);
    log('INFO', '═══════════════════════════════════════════════════════');
    
  } catch (error) {
    const errorMsg = error.stage 
      ? `${CONFIG.stages[error.stage] || error.stage}: ${error.message}`
      : error.message;
    
    log('ERROR', '═══════════════════════════════════════════════════════');
    log('ERROR', `❌ Pipeline failed: ${errorMsg}`);
    log('ERROR', '═══════════════════════════════════════════════════════');
    
    if (error.stage !== 'init') {
      try {
        await sendMessage(
          `❌ <b>EOTC Media Studio Error</b>\n\nStage: ${error.stage || 'unknown'}\nError: ${error.message}\n\nTime: ${new Date().toISOString()}`,
          'HTML'
        );
      } catch (notifyError) {
        log('WARN', 'Failed to send error notification');
      }
    }
    
    process.exit(1);
  } finally {
    await cleanup(tempOutputPath);
    
    try {
      const tempFiles = fs.readdirSync(CONFIG.tempDir).filter(f => f.startsWith('quote_'));
      tempFiles.forEach(f => {
        try {
          fs.unlinkSync(path.join(CONFIG.tempDir, f));
        } catch {}
      });
    } catch {}
  }
}

async function runQuotePipeline(paths) {
  let tempOutputPath;
  let currentQuote;
  
  currentQuote = await runStage('ai', async () => {
    return await withTimeout(generateQuote(), 45000, 'AI generation timeout');
  });
  
  log('INFO', `📝 Generated: "${currentQuote}"`);
  
  const isDuplicate = await runStage('duplicate', () => checkDuplicate(currentQuote));
  
  if (isDuplicate) {
    log('WARN', '⚠️ Duplicate detected - stopping pipeline');
    await sendMessage(`⚠️ <b>EOTC Media Studio</b>\n\nDuplicate quote skipped.\n\n"${currentQuote}"`, 'HTML');
    return;
  }
  
  tempOutputPath = await runStage('render', async () => {
    return await withTimeout(renderQuote(currentQuote, paths.temp), 30000, 'Render timeout');
  });
  
  if (!fs.existsSync(tempOutputPath)) {
    throw new PipelineError('Render output not found', 'render');
  }
  
  fs.copyFileSync(tempOutputPath, paths.final);
  log('INFO', `📦 Output saved to: ${paths.final}`);
  
  await runStage('save', () => saveQuote(currentQuote));
  
  await runStage('telegram', async () => {
    const result = await sendToTelegram(paths.final, currentQuote);
    if (result?.skipped) {
      log('WARN', '📋 Telegram skipped (not configured)');
    } else if (!result?.success) {
      throw new Error(result?.error || 'Telegram send failed');
    }
  });
}

async function runCarouselPipeline(startTime) {
  const topics = [
    'እምነት እና ፍቅር', 
    'ጸሎት እና መልካም ሥራ',
    'ተስፋ እና ትዕግስት',
    'ሥነ ነገር ፣ ማህሌት ፣ ቅንነት',
    'የእግዚአብሔር ኃይል'
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  log('INFO', `🎠 Topic: ${topic}`);
  
  const carouselSlides = await runStage('ai_carousel', async () => {
    return await withTimeout(generateCarousel(topic), 60000, 'Carousel generation timeout');
  });
  
  log('INFO', `📊 Generated ${carouselSlides.length} slides`);
  carouselSlides.forEach((slide, i) => {
    log('INFO', `  ${i + 1}. ${slide.title}`);
  });
  
  const carouselOutputDir = getCarouselDir();
  
  const carouselPaths = await runStage('render_carousel', async () => {
    return await withTimeout(renderCarousel(carouselSlides, carouselOutputDir), 60000, 'Carousel render timeout');
  });
  
  log('INFO', `📦 Carousel saved: ${carouselPaths.length} slides`);
  
  const carouselCaption = `<b>✝️ EOTC Youth - ${topic}</b>\n\nበእያንዳንዱ ገጽ ላይ ያለውን መልካም ዜና ተከተሉ\n\n#EOTC #Youth #SpiritualGrowth`;
  
  await runStage('telegram_carousel', async () => {
    const result = await sendCarousel(carouselPaths, carouselCaption);
    if (result?.skipped) {
      log('WARN', '📋 Carousel Telegram skipped');
    } else if (!result?.success) {
      throw new Error(result?.error || 'Carousel send failed');
    }
  });
}

process.on('SIGINT', () => {
  log('WARN', '⚠️ Interrupted - cleaning up...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', 'Unhandled rejection:', reason);
  process.exit(1);
});

main();