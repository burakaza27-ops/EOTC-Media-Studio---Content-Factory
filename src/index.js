/**
 * EOTC Media Studio v7.0 — Pipeline Orchestrator
 * ═════════════════════════════════════════════════════════════
 * Command center for all content generation. Coordinates:
 *  - Canonical Scripture Engine (zero-hallucination, local 81-book DB)
 *  - Liturgical calendar intelligence + Bahire Hasab computus
 *  - AI generation + dual-model theological auditing (OpenRouter)
 *  - High-fidelity 3× retina rendering (Puppeteer, mood-aware)
 *  - 9:16 / 1:1 / 4:5 Video Reel generation (FFmpeg Ken Burns)
 *  - Duplicate detection (Supabase)
 *  - Multi-group Telegram delivery + Interactive Concierge Bot
 *  - Web Studio GUI (http://localhost:3333)
 *
 * Content Types:
 *  quote       — Power Quote (1080×1080)
 *  verse       — Daily Verse (1080×1080)
 *  carousel    — 5-Slide Teaching Carousel (1080×1350 each)
 *  reflection  — Weekly Reflection (1080×1920)
 *  saint       — Saint of the Day (1080×1080)
 *  fasting     — Fasting Guide (1080×1350)
 *  holyweek    — Holy Week Day Card (1080×1350)
 *  history     — Church History Card (1080×1350)
 *  calendar    — Weekly Calendar Summary (1080×1920)
 *  all         — Run all 9 pipelines sequentially
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  generateQuote,
  generateDailyVerse,
  generateCarousel,
  generateWeeklyReflection,
  generateSaintOfDay,
  generateFastingGuide,
  generateHolyWeekContent,
  generateChurchHistory,
  translateToEnglish,
  isConfigured as isAIConfigured
} from './ai/openrouter.js';

import {
  renderQuote,
  renderDailyVerse,
  renderWeeklyReflection,
  renderCarousel,
  renderSaintOfDay,
  renderFastingGuide,
  renderCalendarSummary,
  renderHolyWeek,
  renderChurchHistory
} from './render/puppeteer.js';

import {
  renderVideoReel,
  renderCarouselVideo,
  checkFFmpeg
} from './render/video.js';

import {
  sendImageToTelegram,
  sendCarouselToTelegram,
  sendVideoToTelegram,
  isConfigured as isTelegramConfigured
} from './telegram/bot.js';

import { checkDuplicate, recordContent } from './db/supabase.js';

import {
  toEthiopianDate,
  getLiturgicalContext,
  getEthiopianDateGeez,
  getFastingInfo,
  getHolyWeekDay,
  isPagume,
  getWeekCalendarData,
  toGeezNumerals,
  DAILY_COMMEMORATIONS,
  CHURCH_HISTORY_TOPICS
} from './utils/calendar.js';

import { getVerifiedVerse } from './canon/scripture.js';
import { getSynaxariumEntry } from './canon/synaxarium.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Video reel mode (set GENERATE_VIDEO=true to produce .mp4 reels)
const GENERATE_VIDEO = (process.env.GENERATE_VIDEO || 'false').toLowerCase() === 'true';
const VIDEO_PROFILES_ENV = (process.env.VIDEO_PROFILES || '1:1,9:16').split(',').map(s => s.trim());


// ═══════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function validateFileSize(filePath, maxMB = 10) {
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    console.warn(`⚠️ File ${path.basename(filePath)} is ${sizeMB.toFixed(1)}MB (max ${maxMB}MB). Telegram may reject it.`);
    return false;
  }
  return true;
}

function buildLiturgicalContext(useLiturgical) {
  if (!useLiturgical) return null;
  const ctx = getLiturgicalContext();
  const ethDateGeez = getEthiopianDateGeez();
  console.log(`\n✝️  Liturgical Context:`);
  console.log(`   📅 ${ctx.ethiopianDate} (${ethDateGeez})`);
  console.log(`   🔔 ${ctx.event}`);
  console.log(`   🎭 Mood: ${ctx.mood} | Type: ${ctx.type}`);
  return { ...ctx, ethiopianDateGeez: ethDateGeez };
}

/**
 * Optionally renders video reels for a given image output path.
 * Only runs when GENERATE_VIDEO=true is set in env.
 */
async function maybeRenderVideo(imagePath, baseName, subtitleLines = [], contentType = '') {
  if (!GENERATE_VIDEO) return {};
  try {
    const ffCheck = await checkFFmpeg();
    if (!ffCheck.available) {
      console.log(`⚠️ FFmpeg not found (${ffCheck.path}) — skipping video reel.`);
      return {};
    }
    console.log(`🎬 FFmpeg ${ffCheck.version} — rendering video reels...`);
    const results = await renderVideoReel({
      imagePath,
      outputDir: OUTPUT_DIR,
      baseName,
      duration: 10,
      profiles: VIDEO_PROFILES_ENV,
      subtitleLines,
      mood: 'devotional'
    });

    if (isTelegramConfigured() && results) {
      for (const [profile, videoPath] of Object.entries(results)) {
        if (videoPath && fs.existsSync(videoPath)) {
          const caption = `🎬 <b>EOTC Video Reel (${profile})</b>\n\n${subtitleLines[0] || ''}`;
          await sendVideoToTelegram(videoPath, caption).catch(e => console.warn(`Telegram reel delivery notice: ${e.message}`));
        }
      }
    }

    return results;
  } catch (err) {
    console.warn(`⚠️ Video reel failed (non-fatal): ${err.message}`);
    return {};
  }
}

/**
 * Optionally renders carousel video reels.
 */
async function maybeRenderCarouselVideo(imagePaths, baseName) {
  if (!GENERATE_VIDEO) return {};
  try {
    const ffCheck = await checkFFmpeg();
    if (!ffCheck.available) return {};
    const videoPath = await renderCarouselVideo(imagePaths, OUTPUT_DIR, baseName, 4);

    if (isTelegramConfigured() && videoPath && fs.existsSync(videoPath)) {
      const caption = `🎬 <b>EOTC Teaching Carousel Reel</b>`;
      await sendVideoToTelegram(videoPath, caption).catch(e => console.warn(`Telegram carousel reel delivery notice: ${e.message}`));
    }

    return videoPath;
  } catch (err) {
    console.warn(`⚠️ Carousel video failed (non-fatal): ${err.message}`);
    return {};
  }
}


// ═══════════════════════════════════════════════════════════
//  PIPELINE STAGES — One per content type
// ═══════════════════════════════════════════════════════════

async function runQuotePipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️  POWER QUOTE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);

  // Pull a canonical verified verse to seed the theme
  const canonVerse = ctx ? getVerifiedVerse(ctx.mood, ctx.event) : null;
  if (canonVerse) console.log(`📖 Canon anchor: ${canonVerse.reference}`);

  const quoteData = await generateQuote(ctx);

  // Duplicate check
  const isDupe = await checkDuplicate(quoteData.text, 'quote');
  if (isDupe) {
    console.log('⚠️ Duplicate detected. Regenerating...');
    return runQuotePipeline(useLiturgical);
  }

  const outputPath = path.join(OUTPUT_DIR, 'power_quote.png');
  await renderQuote({
    text: quoteData.text,
    theme: quoteData.theme,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);
  await recordContent(quoteData.text, 'quote');

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'power_quote', [quoteData.text], 'quote');

  if (isTelegramConfigured()) {
    const caption = `✝️ ${quoteData.text}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Quote pipeline complete.');
  return outputPath;
}

async function runVersePipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📖 DAILY VERSE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);

  // Try canonical verified verse first — eliminates hallucination risk
  const canonVerse = getVerifiedVerse(ctx?.mood || '', ctx?.event || '');
  console.log(`📖 Canonical seed verse: ${canonVerse.reference}`);

  const verseData = await generateDailyVerse(ctx);

  // If AI returned the same reference, use our canonical version for safety
  if (verseData.reference === canonVerse.reference) {
    verseData.verse = canonVerse.verse; // Use guaranteed-accurate text
    console.log(`✅ Using verified canonical text for ${canonVerse.reference}`);
  }

  const isDupe = await checkDuplicate(verseData.verse, 'verse');
  if (isDupe) {
    console.log('⚠️ Duplicate verse. Regenerating...');
    return runVersePipeline(useLiturgical);
  }

  const outputPath = path.join(OUTPUT_DIR, 'daily_verse.png');
  await renderDailyVerse({
    ...verseData,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);
  await recordContent(verseData.verse, 'verse');

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'daily_verse', [verseData.verse, `— ${verseData.reference}`], 'verse');

  if (isTelegramConfigured()) {
    const caption = `📖 ${verseData.verse}\n— ${verseData.reference}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Verse pipeline complete.');
  return outputPath;
}

async function runCarouselPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 CAROUSEL PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const carouselData = await generateCarousel(null, ctx);

  const outputPaths = await renderCarousel({
    slides: carouselData.slides,
    theme: carouselData.theme,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, OUTPUT_DIR);

  outputPaths.forEach(p => validateFileSize(p));

  // Video reel of all carousel slides (optional)
  await maybeRenderCarouselVideo(outputPaths, 'carousel');

  if (isTelegramConfigured()) {
    const caption = `📊 ${carouselData.theme}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendCarouselToTelegram(outputPaths, caption);
  }

  console.log('✅ Carousel pipeline complete.');
  return outputPaths;
}

async function runReflectionPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  🕊️ WEEKLY REFLECTION PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const reflectionData = await generateWeeklyReflection(ctx);

  const outputPath = path.join(OUTPUT_DIR, 'weekly_reflection.png');
  await renderWeeklyReflection({
    ...reflectionData,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);

  if (isTelegramConfigured()) {
    const caption = `🕊️ ${reflectionData.title}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Reflection pipeline complete.');
  return outputPath;
}

async function runSaintPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️ SAINT OF THE DAY PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const today = new Date();
  const ethDate = toEthiopianDate(today);
  const ethDay = ethDate.day;
  const dailyData = DAILY_COMMEMORATIONS[ethDay] || DAILY_COMMEMORATIONS[1];

  // Enrich with synaxarium data if available
  const synaxariumData = getSynaxariumEntry(ethDay);
  if (synaxariumData) {
    console.log(`📜 Synaxarium entry found for day ${ethDay}: ${synaxariumData.saint}`);
  }

  if (dailyData.isLordFeast) {
    console.log(`📿 Today's Feast of the Lord: ${dailyData.saint}`);
  } else {
    console.log(`📿 Today's Saint: ${dailyData.saint}`);
  }

  const saintData = await generateSaintOfDay(dailyData, ctx);

  // Enhance with synaxarium hymn if available
  const hymnLine = synaxariumData?.hymnAmharic || '';

  const outputPath = path.join(OUTPUT_DIR, 'saint_day.png');
  await renderSaintOfDay({
    saint: saintData.saint || dailyData.saint.split(' (')[0],
    story: saintData.story || (synaxariumData?.synaxariumExcerpt || ''),
    lesson: saintData.lesson || (synaxariumData?.spiritualLesson || ''),
    reference: saintData.reference || '',
    hymn: hymnLine,
    feastType: saintData.feastType || (dailyData.isLordFeast ? 'በዓል' : (dailyData.type === 'feast' ? 'በዓል' : 'ቅዱስ/ቅድስት')),
    isLordFeast: dailyData.isLordFeast,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'saint_day', [saintData.saint, saintData.lesson], 'saint');

  if (isTelegramConfigured()) {
    const caption = `✝️ ${saintData.saint || dailyData.saint}\n${saintData.lesson || ''}\n${hymnLine ? `🎵 ${hymnLine}` : ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Saint pipeline complete.');
  return outputPath;
}

async function runFastingPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  🍽️ FASTING GUIDE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const fastingInfo = getFastingInfo();

  if (!fastingInfo.active) {
    console.log('ℹ️ No active fasting season today. Skipping fasting guide.');
    return null;
  }

  console.log(`📿 Current Fast: ${fastingInfo.name} — Day ${fastingInfo.currentDay}/${fastingInfo.totalDays}`);

  const guideData = await generateFastingGuide(fastingInfo, ctx);
  const progressPercent = Math.round((fastingInfo.currentDay / fastingInfo.totalDays) * 100);

  const rulesHtml = fastingInfo.rules.map(r => `<li>${r}</li>`).join('');

  const outputPath = path.join(OUTPUT_DIR, 'fasting_guide.png');
  await renderFastingGuide({
    name: fastingInfo.name,
    dayLabel: `Day ${fastingInfo.currentDay} of ${fastingInfo.totalDays}`,
    encouragement: guideData.encouragement || '',
    reference: guideData.reference || '',
    rulesHtml: rulesHtml,
    progressPercent: String(progressPercent),
    liturgicalContext: ctx ? { mood: 'penitential', ethiopianDate: ctx.ethiopianDateGeez } : { mood: 'penitential' }
  }, outputPath);

  validateFileSize(outputPath);

  if (isTelegramConfigured()) {
    const caption = `🍽️ ${fastingInfo.name}\nDay ${fastingInfo.currentDay}/${fastingInfo.totalDays}\n\n${guideData.encouragement || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Fasting guide pipeline complete.');
  return outputPath;
}

async function runHolyWeekPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️ HOLY WEEK PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const holyWeekDay = getHolyWeekDay();

  if (!holyWeekDay.isHolyWeek) {
    console.log('ℹ️ Not Holy Week today. Skipping.');
    return null;
  }

  console.log(`✝️ Holy Week Day: ${holyWeekDay.amharic} — ${holyWeekDay.english}`);

  const content = await generateHolyWeekContent(holyWeekDay, ctx);

  const outputPath = path.join(OUTPUT_DIR, 'holy_week.png');
  await renderHolyWeek({
    dayName: content.dayName || holyWeekDay.amharic,
    subtitle: content.subtitle || holyWeekDay.english,
    teaching: content.teaching || '',
    scripture: content.scripture || '',
    reference: content.reference || '',
    liturgicalContext: ctx ? { mood: 'penitential', ethiopianDate: ctx.ethiopianDateGeez } : { mood: 'penitential' }
  }, outputPath);

  validateFileSize(outputPath);

  if (isTelegramConfigured()) {
    const caption = `✝️ ሰሙነ ሕማማት — ${content.dayName}\n${content.subtitle}\n\n${content.teaching || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Holy Week pipeline complete.');
  return outputPath;
}

async function runHistoryPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📜 CHURCH HISTORY PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);

  // Pick a random history topic
  const topicIndex = Math.floor(Math.random() * CHURCH_HISTORY_TOPICS.length);
  const topic = CHURCH_HISTORY_TOPICS[topicIndex];
  console.log(`📜 History Topic: ${topic.title} (${topic.era})`);

  const historyData = await generateChurchHistory(topic, ctx);

  const outputPath = path.join(OUTPUT_DIR, 'church_history.png');
  await renderChurchHistory({
    era: historyData.era || topic.era,
    title: historyData.title || topic.title,
    narrative: historyData.narrative || '',
    significance: historyData.significance || '',
    year: historyData.year || topic.year,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);

  if (isTelegramConfigured()) {
    const caption = `📜 ${historyData.title || topic.title}\n${topic.era} • ${topic.year}\n\n${historyData.significance || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ History pipeline complete.');
  return outputPath;
}

async function runCalendarPipeline(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📅 WEEKLY CALENDAR PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const weekData = getWeekCalendarData();

  // Build HTML grid for the template
  let gridHtml = '';
  for (const day of weekData) {
    const moodClass = `mood-${day.mood}`;
    let tags = '';
    if (day.isFeast) tags += '<span class="day-feast-tag">FEAST</span>';
    if (day.isFast) tags += '<span class="day-fast-tag">FAST</span>';

    gridHtml += `
      <div class="day-row">
        <div class="day-indicator">
          <div class="day-number">${day.ethDay}</div>
          <div class="day-weekday">${day.weekday}</div>
          <div class="day-mood ${moodClass}"></div>
        </div>
        <div class="day-content">
          <div class="day-saint">${day.saint.split(' (')[0]}</div>
          <div class="day-event">${day.event.split(':')[0]}</div>
          ${tags}
        </div>
      </div>`;
  }

  const weekTitle = `${weekData[0].ethMonth} ${weekData[0].ethDay} - ${weekData[6].ethDay}`;

  const outputPath = path.join(OUTPUT_DIR, 'calendar_summary.png');
  await renderCalendarSummary({
    weekTitle: weekTitle,
    gridHtml: gridHtml,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);

  if (isTelegramConfigured()) {
    const caption = `📅 የሳምንቱ መርሃ ግብር — ${weekTitle}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Calendar pipeline complete.');
  return outputPath;
}

// ═══════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  PIPELINE REGISTRY
// ═══════════════════════════════════════════════════════════

const PIPELINES = {
  quote:      runQuotePipeline,
  verse:      runVersePipeline,
  carousel:   runCarouselPipeline,
  reflection: runReflectionPipeline,
  saint:      runSaintPipeline,
  fasting:    runFastingPipeline,
  holyweek:   runHolyWeekPipeline,
  history:    runHistoryPipeline,
  calendar:   runCalendarPipeline
};

// 'all' mode: run every pipeline sequentially
async function runAllPipelines(useLiturgical) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️  FULL STUDIO RUN — ALL 9 PIPELINES');
  console.log('═══════════════════════════════════════════');
  const results = {};
  for (const [name, fn] of Object.entries(PIPELINES)) {
    try {
      console.log(`\n▶ Running: ${name}`);
      results[name] = await fn(useLiturgical);
    } catch (err) {
      console.error(`❌ ${name} pipeline failed: ${err.message}`);
      results[name] = null;
    }
  }
  return results;
}


async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  ✝️  EOTC MEDIA STUDIO v7.0                          ║`);
  console.log(`║  Canonical · Video Reels · Bot · Web Studio          ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  ensureOutputDir();

  const contentType   = (process.env.CONTENT_TYPE  || 'quote').toLowerCase().trim();
  const useLiturgical = (process.env.USE_LITURGICAL || 'true').toLowerCase() === 'true';

  console.log(`📋 Content Type:     ${contentType}`);
  console.log(`📅 Liturgical Mode:  ${useLiturgical ? 'ON' : 'OFF'}`);
  console.log(`🤖 AI Configured:    ${isAIConfigured() ? 'YES' : 'NO'}`);
  console.log(`📱 Telegram:         ${isTelegramConfigured() ? 'YES' : 'NO'}`);
  console.log(`🎬 Video Reels:      ${GENERATE_VIDEO ? `ON (${VIDEO_PROFILES_ENV.join(', ')})` : 'OFF (set GENERATE_VIDEO=true)'}`);

  if (!isAIConfigured()) {
    throw new Error('AI API key is required but not set. Please configure OPENROUTER_API_KEY or GOOGLE_AI_STUDIO_API.');
  }

  // Handle 'all' batch mode
  if (contentType === 'all') {
    const results = await runAllPipelines(useLiturgical);
    const succeeded = Object.values(results).filter(r => r !== null).length;
    console.log(`\n🎉 All-pipeline run: ${succeeded}/9 succeeded.`);
    return;
  }

  const pipelineFn = PIPELINES[contentType];
  if (!pipelineFn) {
    const validTypes = [...Object.keys(PIPELINES), 'all'].join(', ');
    throw new Error(`Unknown content type: "${contentType}". Valid: ${validTypes}`);
  }

  try {
    const result = await pipelineFn(useLiturgical);
    if (result === null) {
      console.log('\nℹ️ Pipeline completed with no output (condition not met today).');
    } else {
      console.log(`\n🎉 Pipeline SUCCESS. Output: ${Array.isArray(result) ? result.length + ' files' : result}`);
    }
  } catch (error) {
    console.error(`\n❌ Pipeline FAILED: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

export { main, PIPELINES };

const isDirectRun = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].replace(/\\/g, '/').endsWith('src/index.js')
);

if (isDirectRun) {
  main();
}