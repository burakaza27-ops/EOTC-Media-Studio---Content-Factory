/**
 * EOTC Media Studio v7.0 — Pipeline Orchestrator
 * ═════════════════════════════════════════════════════════════
 * Command center for all content generation. Coordinates:
 *  - Canonical Scripture Engine (zero-hallucination, local 81-book DB)
 *  - Liturgical calendar intelligence + Bahire Hasab computus
 *  - AI generation + dual-model theological auditing (OpenRouter + Google AI Studio)
 *  - High-fidelity 3× retina rendering (Puppeteer, mood-aware)
 *  - 9:16 / 1:1 / 4:5 Video Reel generation (FFmpeg Ken Burns + audio)
 *  - Duplicate detection (Supabase + local fallback)
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
  dispatchWorkflow
} from './utils/github.js';

import {
  sendImageToTelegram,
  sendCarouselToTelegram,
  sendVideoToTelegram,
  sendPhotoToChat,
  sendVideoToChat,
  sendMediaGroupToChat,
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
 */
async function maybeRenderVideo(imagePath, baseName, subtitleLines = [], contentType = '', options = {}) {
  const wantVideo = options.generateVideo !== undefined ? options.generateVideo : GENERATE_VIDEO;
  if (!wantVideo) return {};

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

    if (options.targetChatId && results) {
      for (const [profile, videoPath] of Object.entries(results)) {
        if (videoPath && fs.existsSync(videoPath)) {
          const caption = `🎬 <b>EOTC Video Reel (${profile})</b>\n\n${subtitleLines[0] || ''}`;
          await sendVideoToChat(options.targetChatId, videoPath, caption).catch(e => console.warn(`Chat reel delivery notice: ${e.message}`));
        }
      }
    } else if (isTelegramConfigured() && results) {
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
async function maybeRenderCarouselVideo(imagePaths, baseName, options = {}) {
  const wantVideo = options.generateVideo !== undefined ? options.generateVideo : GENERATE_VIDEO;
  if (!wantVideo) return {};

  try {
    const ffCheck = await checkFFmpeg();
    if (!ffCheck.available) return {};
    const videoPath = await renderCarouselVideo(imagePaths, OUTPUT_DIR, baseName, 4);

    if (options.targetChatId && videoPath && fs.existsSync(videoPath)) {
      const caption = `🎬 <b>EOTC Teaching Carousel Reel</b>`;
      await sendVideoToChat(options.targetChatId, videoPath, caption).catch(e => console.warn(`Chat carousel reel delivery notice: ${e.message}`));
    } else if (isTelegramConfigured() && videoPath && fs.existsSync(videoPath)) {
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

export async function runQuotePipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️  POWER QUOTE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const customTheme = options.customTheme || process.env.CUSTOM_THEME || null;
  const ctx = buildLiturgicalContext(useLiturgical);
  if (customTheme && ctx) {
    ctx.event = customTheme;
  }

  // Pull a canonical verified verse to seed the theme
  const canonVerse = ctx ? getVerifiedVerse(ctx.mood, ctx.event) : null;
  if (canonVerse) console.log(`📖 Canon anchor: ${canonVerse.reference}`);

  const quoteData = await generateQuote(ctx);

  // Duplicate check
  const isDupe = await checkDuplicate(quoteData.text, 'quote');
  if (isDupe && !customTheme) {
    console.log('⚠️ Duplicate detected. Regenerating...');
    return runQuotePipeline(useLiturgical, options);
  }

  const outputPath = path.join(OUTPUT_DIR, 'power_quote.png');
  await renderQuote({
    text: quoteData.text,
    theme: quoteData.theme,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);
  await recordContent(quoteData.text, 'quote');

  const caption = `✝️ ${quoteData.text}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'power_quote', [quoteData.text], 'quote', options);

  console.log('✅ Quote pipeline complete.');
  return outputPath;
}

export async function runVersePipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📖 DAILY VERSE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const customTheme = options.customTheme || process.env.CUSTOM_THEME || null;
  const ctx = buildLiturgicalContext(useLiturgical);
  if (customTheme && ctx) {
    ctx.event = customTheme;
  }

  // Try canonical verified verse first — eliminates hallucination risk
  const canonVerse = getVerifiedVerse(customTheme || ctx?.mood || '', ctx?.event || '');
  console.log(`📖 Canonical seed verse: ${canonVerse.reference}`);

  const verseData = await generateDailyVerse(ctx);

  // If AI returned the same reference, use our canonical version for safety
  if (verseData.reference === canonVerse.reference) {
    verseData.verse = canonVerse.verse; // Use guaranteed-accurate text
    console.log(`✅ Using verified canonical text for ${canonVerse.reference}`);
  }

  const isDupe = await checkDuplicate(verseData.verse, 'verse');
  if (isDupe && !customTheme) {
    console.log('⚠️ Duplicate verse. Regenerating...');
    return runVersePipeline(useLiturgical, options);
  }

  const outputPath = path.join(OUTPUT_DIR, 'daily_verse.png');
  await renderDailyVerse({
    ...verseData,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);
  await recordContent(verseData.verse, 'verse');

  const caption = `📖 ${verseData.verse}\n— ${verseData.reference}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'daily_verse', [verseData.verse, `— ${verseData.reference}`], 'verse', options);

  console.log('✅ Verse pipeline complete.');
  return outputPath;
}

export async function runCarouselPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 CAROUSEL PIPELINE');
  console.log('═══════════════════════════════════════════');

  const customTheme = options.customTheme || process.env.CUSTOM_THEME || null;
  const ctx = buildLiturgicalContext(useLiturgical);
  const carouselData = await generateCarousel(customTheme, ctx);

  const outputPaths = await renderCarousel({
    slides: carouselData.slides,
    theme: carouselData.theme,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, OUTPUT_DIR);

  outputPaths.forEach(p => validateFileSize(p));

  const caption = `📊 <b>${carouselData.theme}</b>\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendMediaGroupToChat(options.targetChatId, outputPaths, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendCarouselToTelegram(outputPaths, caption);
  }

  // Video reel of all carousel slides (optional)
  await maybeRenderCarouselVideo(outputPaths, 'carousel', options);

  console.log('✅ Carousel pipeline complete.');
  return outputPaths;
}

export async function runReflectionPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  🕊️ WEEKLY REFLECTION PIPELINE');
  console.log('═══════════════════════════════════════════');

  const customTheme = options.customTheme || process.env.CUSTOM_THEME || null;
  const ctx = buildLiturgicalContext(useLiturgical);
  if (customTheme && ctx) {
    ctx.event = customTheme;
  }

  const reflectionData = await generateWeeklyReflection(ctx);

  const outputPath = path.join(OUTPUT_DIR, 'weekly_reflection.png');
  await renderWeeklyReflection({
    ...reflectionData,
    liturgicalContext: ctx ? { mood: ctx.mood, ethiopianDate: ctx.ethiopianDateGeez } : null
  }, outputPath);

  validateFileSize(outputPath);

  const caption = `🕊️ <b>${reflectionData.title}</b>\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Reflection pipeline complete.');
  return outputPath;
}

export async function runSaintPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️ SAINT OF THE DAY PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const today = new Date();
  const ethDate = toEthiopianDate(today);
  const requestedDay = options.day ? parseInt(options.day, 10) : ethDate.day;
  const ethDay = (requestedDay >= 1 && requestedDay <= 30) ? requestedDay : ethDate.day;
  const dailyData = DAILY_COMMEMORATIONS[ethDay] || DAILY_COMMEMORATIONS[1];

  // Enrich with synaxarium data if available
  const synaxariumData = getSynaxariumEntry(ethDay);
  if (synaxariumData) {
    console.log(`📜 Synaxarium entry found for day ${ethDay}: ${synaxariumData.saint}`);
  }

  const saintData = await generateSaintOfDay(dailyData, ctx);
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

  const caption = `✝️ <b>${saintData.saint || dailyData.saint}</b>\n\n${saintData.lesson || ''}\n${hymnLine ? `🎵 ${hymnLine}\n` : ''}\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  // Video reel (optional)
  await maybeRenderVideo(outputPath, 'saint_day', [saintData.saint, saintData.lesson], 'saint', options);

  console.log('✅ Saint pipeline complete.');
  return outputPath;
}

export async function runFastingPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  🍽️ FASTING GUIDE PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  let fastingInfo = getFastingInfo();

  if (!fastingInfo.active && !options.targetChatId && !process.env.CUSTOM_THEME) {
    console.log('ℹ️ No active fasting season today. Skipping fasting guide.');
    return null;
  }

  // Fallback to Wednesday/Friday or Great Lent guide if requested explicitly
  if (!fastingInfo.active) {
    fastingInfo = {
      name: 'ጾመ ድኅነት (ረቡዕና ዓርብ)',
      currentDay: 1,
      totalDays: 2,
      rules: ['ከእንስሳት ተዋጽኦ (ሥጋ፣ ወተት፣ ቅቤ) መከልከል', 'እስከ ፱ ሰዓት መጾም', 'በጸሎትና በንስሐ መትጋት']
    };
  }

  console.log(`📿 Fasting Guide: ${fastingInfo.name}`);

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

  const caption = `🍽️ <b>${fastingInfo.name}</b>\nDay ${fastingInfo.currentDay}/${fastingInfo.totalDays}\n\n${guideData.encouragement || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Fasting guide pipeline complete.');
  return outputPath;
}

export async function runHolyWeekPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️ HOLY WEEK PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  let holyWeekDay = getHolyWeekDay();

  if (!holyWeekDay.isHolyWeek && !options.targetChatId && !process.env.CUSTOM_THEME) {
    console.log('ℹ️ Not Holy Week today. Skipping.');
    return null;
  }

  // Fallback to Good Friday (ዐርብ - ስቅለት) if requested on demand
  if (!holyWeekDay.isHolyWeek) {
    holyWeekDay = {
      isHolyWeek: true,
      amharic: 'ዓርብ (ስቅለት)',
      english: 'Good Friday (The Crucifixion of Christ)',
      theme: 'The Crucifixion and death of Christ for the salvation of the world'
    };
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

  const caption = `✝️ <b>ሰሙነ ሕማማት — ${content.dayName}</b>\n${content.subtitle}\n\n${content.teaching || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Holy Week pipeline complete.');
  return outputPath;
}

export async function runHistoryPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📜 CHURCH HISTORY PIPELINE');
  console.log('═══════════════════════════════════════════');

  const customTheme = options.customTheme || process.env.CUSTOM_THEME || null;
  const ctx = buildLiturgicalContext(useLiturgical);

  let topic = null;
  if (customTheme) {
    topic = { title: customTheme, era: 'የኢትዮጵያ ቤተ ክርስቲያን ታሪክ', year: '፪ሺህ ዓመታት', theme: customTheme };
  } else {
    const topicIndex = Math.floor(Math.random() * CHURCH_HISTORY_TOPICS.length);
    topic = CHURCH_HISTORY_TOPICS[topicIndex];
  }
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

  const caption = `📜 <b>${historyData.title || topic.title}</b>\n${topic.era} • ${topic.year}\n\n${historyData.significance || ''}\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ History pipeline complete.');
  return outputPath;
}

export async function runCalendarPipeline(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  📅 WEEKLY CALENDAR PIPELINE');
  console.log('═══════════════════════════════════════════');

  const ctx = buildLiturgicalContext(useLiturgical);
  const weekData = getWeekCalendarData();

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

  const caption = `📅 <b>የሳምንቱ መርሃ ግብር — ${weekTitle}</b>\n\n${ctx ? `📅 ${ctx.ethiopianDate}` : ''}`;

  if (options.targetChatId) {
    await sendPhotoToChat(options.targetChatId, outputPath, caption).catch(e => console.warn(`Delivery notice: ${e.message}`));
  } else if (isTelegramConfigured()) {
    await sendImageToTelegram(outputPath, caption);
  }

  console.log('✅ Calendar pipeline complete.');
  return outputPath;
}

// ═══════════════════════════════════════════════════════════
//  PIPELINE REGISTRY
// ═══════════════════════════════════════════════════════════

export const PIPELINES = {
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
export async function runAllPipelines(useLiturgical = true, options = {}) {
  console.log('\n═══════════════════════════════════════════');
  console.log('  ✝️  FULL STUDIO RUN — ALL 9 PIPELINES');
  console.log('═══════════════════════════════════════════');
  const results = {};
  for (const [name, fn] of Object.entries(PIPELINES)) {
    try {
      console.log(`\n▶ Running: ${name}`);
      results[name] = await fn(useLiturgical, options);
    } catch (err) {
      console.error(`❌ ${name} pipeline failed: ${err.message}`);
      results[name] = null;
    }
  }
  return results;
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    contentType: (process.env.CONTENT_TYPE || 'quote').toLowerCase().trim(),
    useLiturgical: (process.env.USE_LITURGICAL || 'true').toLowerCase() === 'true',
    generateVideo: (process.env.GENERATE_VIDEO || 'false').toLowerCase() === 'true',
    customTheme: process.env.CUSTOM_THEME || null,
    dispatchCloud: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dispatch') {
      options.dispatchCloud = true;
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        options.contentType = args[++i].toLowerCase();
      }
    } else if (arg === '--type' || arg === '-t') {
      if (args[i + 1]) options.contentType = args[++i].toLowerCase();
    } else if (arg === '--theme') {
      if (args[i + 1]) options.customTheme = args[++i];
    } else if (arg === '--video' || arg === '-v') {
      options.generateVideo = true;
    } else if (arg === '--no-liturgical') {
      options.useLiturgical = false;
    } else if (!arg.startsWith('-') && i === 0) {
      options.contentType = arg.toLowerCase();
    }
  }

  return options;
}

export async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  ✝️  EOTC MEDIA STUDIO v7.0                          ║`);
  console.log(`║  Canonical · Video Reels · Bot · Web Studio          ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  ensureOutputDir();

  const cliOptions = parseCliArgs();
  const contentType   = cliOptions.contentType;
  const useLiturgical = cliOptions.useLiturgical;
  const customTheme   = cliOptions.customTheme;
  const wantVideo     = cliOptions.generateVideo;

  console.log(`📋 Content Type:     ${contentType}`);
  console.log(`📅 Liturgical Mode:  ${useLiturgical ? 'ON' : 'OFF'}`);
  if (customTheme) console.log(`🎯 Custom Theme:     ${customTheme}`);
  console.log(`🤖 AI Configured:    ${isAIConfigured() ? 'YES' : 'NO'}`);
  console.log(`📱 Telegram:         ${isTelegramConfigured() ? 'YES' : 'NO'}`);
  console.log(`🎬 Video Reels:      ${wantVideo ? `ON (${VIDEO_PROFILES_ENV.join(', ')})` : 'OFF'}`);

  // Handle remote GitHub Actions dispatch
  if (cliOptions.dispatchCloud) {
    console.log(`\n🚀 Dispatching GitHub Action workflow for "${contentType}" (video: ${wantVideo})...`);
    try {
      const res = await dispatchWorkflow('generate-media.yml', {
        content_type: contentType,
        use_liturgical: useLiturgical ? 'true' : 'false',
        generate_video: wantVideo ? 'true' : 'false',
        video_profiles: VIDEO_PROFILES_ENV.join(',')
      });
      console.log(`✅ Workflow successfully dispatched to GitHub Actions! Ref: ${res.ref}`);
      return res;
    } catch (err) {
      console.error(`❌ GitHub dispatch failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (!isAIConfigured()) {
    throw new Error('AI API key is required but not set. Please configure OPENROUTER_API_KEY or GOOGLE_AI_STUDIO_API.');
  }

  // Handle 'all' batch mode
  if (contentType === 'all') {
    const results = await runAllPipelines(useLiturgical, { customTheme, generateVideo: wantVideo });
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
    const result = await pipelineFn(useLiturgical, { customTheme, generateVideo: wantVideo });
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

const isDirectRun = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].replace(/\\/g, '/').endsWith('src/index.js')
);

if (isDirectRun) {
  main();
}