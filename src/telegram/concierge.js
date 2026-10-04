/**
 * EOTC Interactive Telegram Concierge Bot
 * ════════════════════════════════════════
 * Transforms the one-way delivery bot into a 2-way spiritual guide.
 * Listens for user commands via long-polling (no external webhook needed).
 *
 * Commands:
 *  /today       — Full liturgical overview for today
 *  /saint       — Today's saint of the day with story & lesson
 *  /saint [1-30] — Saint for specific Ethiopian day
 *  /verse       — Canonical daily verse from the verified scripture engine
 *  /fasting     — Live fasting season tracker
 *  /calendar    — Current week's liturgical calendar
 *  /computus [year] — Bahire Hasab computation for a given Ethiopian year
 *  /search [term] — Search canonical verse database
 *  /generate [type] — (Admin only) Trigger content generation on-demand
 *  /start / /help — Welcome message and command list
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

import {
  toEthiopianDate,
  getLiturgicalContext,
  getEthiopianDateGeez,
  getFastingInfo,
  getHolyWeekDay,
  getWeekCalendarData,
  toGeezNumerals,
  DAILY_COMMEMORATIONS,
  CHURCH_HISTORY_TOPICS
} from '../utils/calendar.js';

import {
  getVerifiedVerse,
  searchCanonicalVerses
} from '../canon/scripture.js';

import {
  getSynaxariumEntry
} from '../canon/synaxarium.js';

const getEnv = (key) => process.env[key];
const BOT_TOKEN = () => getEnv('TELEGRAM_BOT_TOKEN');
const ADMIN_IDS = () => {
  const ids = getEnv('TELEGRAM_ADMIN_IDS') || '';
  return ids.split(',').map(i => i.trim()).filter(Boolean);
};

let _lastUpdateId = 0;
let _polling = false;

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
function tgRequest(method, body = null) {
  return new Promise((resolve, reject) => {
    const token = BOT_TOKEN();
    if (!token) return reject(new Error('BOT_TOKEN not set'));
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}`,
      method: payload ? 'POST' : 'GET',
      headers: payload
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        : {}
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          if (r.ok) resolve(r.result);
          else reject(new Error(`Telegram ${method}: ${r.description}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sendMsg(chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  return tgRequest('sendMessage', body).catch(err =>
    console.error(`❌ sendMsg to ${chatId}: ${err.message}`)
  );
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────────

function handleStart(chatId) {
  const text = [
    '✝️ <b>ወደ EOTC Media Studio ቦት እንኳን ደህና መጡ!</b>',
    '',
    'ለኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ምዕመናን የሚያገለግል ዕለታዊ መንፈሳዊ ረዳት።',
    '',
    '📋 <b>ትዕዛዞች (Commands):</b>',
    '/today — ዛሬ የሚታሰቡ ቅዱሳን፣ በዓላት እና ሥነ ሥርዓቶች',
    '/saint — የዛሬ ቅዱስ/ቅድስት ታሪክ',
    '/saint [1-30] — ለሌሎች ቀናት',
    '/verse — ዕለታዊ ቅዱስ ቃል',
    '/fasting — አሁን ያለ ጾምና ሂደቱ',
    '/calendar — የሳምንቱ ሥነ ሥርዓት ዝርዝር',
    '/computus — ሰሙነ ሕማማትና ፋሲካ ቀን ስሌት',
    '/search [ቃል] — ቅዱሳት መጻሕፍት ፍለጋ',
    '',
    '✝️ <i>እግዚአብሔር ይባርካችሁ!</i>'
  ].join('\n');
  return sendMsg(chatId, text);
}

function handleToday(chatId) {
  const ctx = getLiturgicalContext();
  const ethDate = getEthiopianDateGeez();
  const today = new Date();
  const eth = toEthiopianDate(today);
  const daily = DAILY_COMMEMORATIONS[eth.day] || DAILY_COMMEMORATIONS[1];
  const fastInfo = getFastingInfo();
  const holyWeek = getHolyWeekDay();

  const moodEmoji = {
    joyful: '🌟', triumphant: '👑', penitential: '🕯️',
    contemplative: '🌙', celebratory: '✨', devotional: '✝️'
  }[ctx.mood] || '✝️';

  const lines = [
    `✝️ <b>ዛሬ — ${eth.day} ${ctx.ethiopianDate.split(' ')[1] || ''} ${eth.year} ዓ.ም</b>`,
    `<i>${ethDate}</i>`,
    '',
    `${moodEmoji} <b>ቀን፡</b> ${ctx.event}`,
    `🎭 <b>ሙድ፡</b> ${ctx.mood.charAt(0).toUpperCase() + ctx.mood.slice(1)}`,
    '',
    `📿 <b>ቅዱስ/ቅድስት፡</b> ${daily.saint.split(' (')[0]}`,
  ];

  if (fastInfo.active) {
    const pct = Math.round((fastInfo.currentDay / fastInfo.totalDays) * 100);
    lines.push(``, `🍽️ <b>አሁን ያለ ጾም፡</b> ${fastInfo.name}`);
    lines.push(`   ቀን ${toGeezNumerals(fastInfo.currentDay)}/${toGeezNumerals(fastInfo.totalDays)} (${pct}%)`);
  }

  if (holyWeek.isHolyWeek) {
    lines.push(``, `✝️ <b>ሰሙነ ሕማማት፡</b> ${holyWeek.amharic}`);
  }

  // Pull a canonical verse aligned to today's context
  const verse = getVerifiedVerse(ctx.mood, ctx.event);
  lines.push(``, `📖 <b>ዕለታዊ ቃል፡</b>`, `<i>«${verse.verse}»</i>`, `— ${verse.reference}`);

  lines.push('', '✝️ <i>ዛሬን በእግዚአብሔር ጸጋ ያሳልፉ!</i>');
  return sendMsg(chatId, lines.join('\n'));
}

function handleSaint(chatId, dayArg = null) {
  const today = new Date();
  const eth = toEthiopianDate(today);
  const day = dayArg ? parseInt(dayArg, 10) : eth.day;

  if (isNaN(day) || day < 1 || day > 30) {
    return sendMsg(chatId, '❌ ቀን ከ ፩ እስከ ፴ ይሁን። ምሳሌ: /saint 12');
  }

  const daily = DAILY_COMMEMORATIONS[day];
  const synax = getSynaxariumEntry(day);

  if (!daily) {
    return sendMsg(chatId, `❌ ለቀን ${toGeezNumerals(day)} ቅዱስ አልተገኘም።`);
  }

  const lines = [
    `📿 <b>${daily.saint.split(' (')[0]}</b>`,
    `<i>ቀን ${toGeezNumerals(day)}</i>`,
    '',
  ];

  if (synax?.synaxariumExcerpt) {
    lines.push(synax.synaxariumExcerpt, '');
  } else {
    lines.push(daily.theme.substring(0, 300) + (daily.theme.length > 300 ? '...' : ''), '');
  }

  if (synax?.hymnAmharic) {
    lines.push(`🎵 <i>${synax.hymnAmharic}</i>`, '');
  }

  if (synax?.spiritualLesson) {
    lines.push(`💡 <b>ትምህርት፡</b> ${synax.spiritualLesson}`, '');
  }

  if (synax?.primarySource) {
    lines.push(`📜 <i>ምንጭ: ${synax.primarySource}</i>`);
  }

  return sendMsg(chatId, lines.join('\n'));
}

function handleVerse(chatId, themeTerm = '') {
  const ctx = getLiturgicalContext();
  const verse = getVerifiedVerse(themeTerm || ctx.mood, ctx.event);
  const lines = [
    `📖 <b>ዕለታዊ ቅዱስ ቃል</b>`,
    '',
    `<i>«${verse.verse}»</i>`,
    '',
    `— <b>${verse.reference}</b>`,
    '',
    `✅ <i>ከ1962 ዓ.ም ቅዱስ መጽሐፍ (ሃይለ ሥላሴ ትርጒም) — ዋስትናን ያለ ቃል</i>`
  ];
  return sendMsg(chatId, lines.join('\n'));
}

function handleFasting(chatId) {
  const info = getFastingInfo();
  if (!info.active) {
    return sendMsg(chatId, [
      `🍽️ <b>አሁን ጾም የለም</b>`,
      '',
      `ቀጣዩ ጾም ቅርቡ ዘመን ይጠብቁ።`,
      '',
      `⚡ ዕለታዊ ዓርብና ረቡዕ ጾም ሁልጊዜ ይቀጥላሉ።`
    ].join('\n'));
  }

  const pct = Math.round((info.currentDay / info.totalDays) * 100);
  const barLength = 20;
  const filled = Math.round((pct / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

  const lines = [
    `🍽️ <b>${info.name}</b>`,
    '',
    `📊 ሂደት: ${bar} ${pct}%`,
    `📅 ቀን ${toGeezNumerals(info.currentDay)} / ${toGeezNumerals(info.totalDays)}`,
    '',
    `📋 <b>የጾም ሕጎች:</b>`,
    ...info.rules.map(r => `  • ${r}`),
    '',
    `✝️ <i>ፍጻሜው ምስጋና ይሆናል!</i>`
  ];
  return sendMsg(chatId, lines.join('\n'));
}

function handleCalendar(chatId) {
  const weekData = getWeekCalendarData();
  const moodEmojis = {
    joyful: '🌟', triumphant: '👑', penitential: '🕯️',
    contemplative: '🌙', celebratory: '✨', devotional: '✝️'
  };

  const lines = [
    `📅 <b>የሳምንቱ የቤተ ክርስቲያን መርሃ ግብር</b>`,
    '',
  ];

  for (const day of weekData) {
    const emoji = moodEmojis[day.mood] || '✝️';
    const tags = [];
    if (day.isFeast) tags.push('🎉FEAST');
    if (day.isFast) tags.push('🍃FAST');
    lines.push(
      `${emoji} <b>${day.weekday} — ${day.ethDay} ${day.ethMonth}</b>`,
      `  📿 ${day.saint.split(' (')[0]}`,
      `  📌 ${day.event.split(':')[0]}${tags.length ? ' ' + tags.join(' ') : ''}`,
      ''
    );
  }

  return sendMsg(chatId, lines.join('\n'));
}

function handleComputus(chatId, yearArg = '') {
  // Try to parse Ethiopian year from arg
  const now = new Date();
  const ethNow = toEthiopianDate(now);
  const ethYear = parseInt(yearArg, 10) || ethNow.year;

  if (isNaN(ethYear) || ethYear < 2000 || ethYear > 2100) {
    return sendMsg(chatId, `❌ ዓ.ም ቁጥር ትክክለኛ ይሁን (2000-2100)። ምሳሌ: /computus 2018`);
  }

  // Bahire Hasab simplified computation for moveable feasts
  // Ethiopian year starts Meskerem 1 = ~Sept 11/12 Gregorian
  const gregYear = ethYear + 7;

  // Nineveh Fast: 3 weeks before Great Lent start
  // Great Lent: 55 days before Ethiopian Easter (Fasika)
  // Fasika: computed by Bahire Hasab
  // Using simplified Metonic cycle approximation
  const metonic = (gregYear % 19);
  const fasikaBase = [
    '23/4', '12/4', '2/4', '22/4', '11/4', '1/5', '20/4',
    '9/4', '29/3', '17/4', '6/4', '26/3', '14/4', '3/4',
    '23/3', '11/4', '31/3', '19/4', '8/4'
  ];
  const [fasikaDay, fasikaMonth] = fasikaBase[metonic].split('/').map(Number);
  const fasika = new Date(gregYear, fasikaMonth - 1, fasikaDay);

  const nineveh = new Date(fasika);
  nineveh.setDate(nineveh.getDate() - 55 - 14);  // ~69 days before

  const lentStart = new Date(fasika);
  lentStart.setDate(lentStart.getDate() - 55);

  const ascension = new Date(fasika);
  ascension.setDate(ascension.getDate() + 40);

  const pentecost = new Date(fasika);
  pentecost.setDate(pentecost.getDate() + 50);

  const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  const lines = [
    `📐 <b>ባሕረ ሐሳብ — ${toGeezNumerals(ethYear)} ዓ.ም</b>`,
    `<i>Ethiopian Year ${ethYear} (approx. Gregorian ${gregYear})</i>`,
    '',
    `📅 <b>ዒፍ ኒነዌ (Nineveh):</b>  ${fmt(nineveh)}`,
    `📅 <b>ዐቢይ ጾም ይጀምራል:</b>  ${fmt(lentStart)}`,
    `✝️ <b>ፋሲካ (Ethiopian Easter):</b>  ${fmt(fasika)}`,
    `☁️ <b>ዕርገት (Ascension):</b>  ${fmt(ascension)}`,
    `🕊️ <b>ጰራቅሊጦስ (Pentecost):</b>  ${fmt(pentecost)}`,
    '',
    `<i>ትክክለኛ ቀናት ካህናትና ስምዐ ሰዓት ጋር ያረጋግጡ።</i>`
  ];
  return sendMsg(chatId, lines.join('\n'));
}

function handleSearch(chatId, query) {
  if (!query || query.trim().length < 2) {
    return sendMsg(chatId, '❌ ፍለጋ ቃሉን ያስገቡ። ምሳሌ: /search ፍቅር');
  }
  const results = searchCanonicalVerses(query.trim());
  if (results.length === 0) {
    return sendMsg(chatId, `❌ "<b>${query}</b>" ለሚለው ቃል ምንም አልተገኘም።`);
  }
  const lines = [`🔍 <b>ፍለጋ: "${query}"</b> — ${results.length} ቀናት ተገኝቷል`, ''];
  for (const r of results.slice(0, 5)) {
    lines.push(`📖 <b>${r.reference}</b>`);
    lines.push(`<i>«${r.verse.substring(0, 120)}${r.verse.length > 120 ? '...' : ''}»</i>`);
    lines.push('');
  }
  if (results.length > 5) {
    lines.push(`<i>... እና ሌሎች ${results.length - 5} ቁጥሮች</i>`);
  }
  return sendMsg(chatId, lines.join('\n'));
}

async function handleGenerate(chatId, userId, contentType) {
  const admins = ADMIN_IDS();
  if (admins.length > 0 && !admins.includes(String(userId))) {
    return sendMsg(chatId, '⛔ ይህ ትዕዛዝ ለአስተዳዳሪዎች ብቻ ነው።');
  }

  const validTypes = ['quote', 'verse', 'carousel', 'reflection', 'saint', 'fasting', 'holyweek', 'history', 'calendar'];
  if (!contentType || !validTypes.includes(contentType)) {
    return sendMsg(chatId, `❌ አይነት ይምረጡ: ${validTypes.join(', ')}`);
  }

  await sendMsg(chatId, `⚙️ <b>${contentType}</b> ይፈጠراל... ⏳`);

  try {
    const { spawn } = await import('child_process');
    const child = spawn('node', ['src/index.js'], {
      env: { ...process.env, CONTENT_TYPE: contentType, USE_LITURGICAL: 'true' },
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stdout += d.toString(); });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Process exited with code ${code}`));
      });
    });

    await sendMsg(chatId, `✅ <b>${contentType}</b> ተፈጠረ — Telegram ላይ ይቆዩ!`);
  } catch (err) {
    await sendMsg(chatId, `❌ ፍጠራ አልተሳካም: ${err.message}`);
  }
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────
async function dispatchUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text.trim();

  const [cmd, ...args] = text.split(/\s+/);
  const command = cmd.toLowerCase().replace(/^\//, '').split('@')[0];
  const rest = args.join(' ');

  console.log(`📩 Bot command: /${command} from ${userId} in ${chatId}`);

  try {
    switch (command) {
      case 'start':
      case 'help':
        await handleStart(chatId); break;
      case 'today':
        await handleToday(chatId); break;
      case 'saint':
        await handleSaint(chatId, args[0]); break;
      case 'verse':
        await handleVerse(chatId, rest); break;
      case 'fasting':
        await handleFasting(chatId); break;
      case 'calendar':
        await handleCalendar(chatId); break;
      case 'computus':
        await handleComputus(chatId, args[0]); break;
      case 'search':
        await handleSearch(chatId, rest); break;
      case 'generate':
        await handleGenerate(chatId, userId, args[0]?.toLowerCase()); break;
      default:
        // Ignore unrecognised messages unless it starts with /
        if (text.startsWith('/')) {
          await sendMsg(chatId, `❓ ትዕዛዙ አልተገኘም። /help ይሞክሩ።`);
        }
    }
  } catch (err) {
    console.error(`❌ dispatchUpdate error: ${err.message}`);
    await sendMsg(chatId, `❌ ችግር ተፈጠረ: ${err.message}`);
  }
}

// ─── LONG-POLL LOOP ───────────────────────────────────────────────────────────
async function pollOnce() {
  try {
    const updates = await tgRequest('getUpdates', {
      offset: _lastUpdateId + 1,
      timeout: 30,
      limit: 100,
      allowed_updates: ['message', 'edited_message']
    });
    for (const update of updates) {
      if (update.update_id > _lastUpdateId) _lastUpdateId = update.update_id;
      await dispatchUpdate(update).catch(e => console.error('Dispatch error:', e.message));
    }
  } catch (err) {
    if (!err.message.includes('ETIMEOUT')) {
      console.error(`⚠️ Poll error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
}

/**
 * Start the interactive bot long-polling loop.
 * Call this once; it runs forever until stopBotPolling() is called.
 */
export async function startBotPolling() {
  if (_polling) return;
  const token = BOT_TOKEN();
  if (!token) {
    console.log('⚠️ Interactive bot not started: TELEGRAM_BOT_TOKEN not set.');
    return;
  }

  _polling = true;
  console.log('🤖 Interactive Telegram Concierge Bot started (long-poll)...');

  // Set bot commands list in Telegram UI
  await tgRequest('setMyCommands', {
    commands: [
      { command: 'today',    description: 'ዛሬ ያሉ ቅዱሳን፣ ጾምና በዓላት' },
      { command: 'saint',    description: 'ዕለቱ ቅዱስ/ቅድስት ታሪክ' },
      { command: 'verse',    description: 'ዕለታዊ ቅዱስ ቃል' },
      { command: 'fasting',  description: 'አሁን ያለ ጾምና ሂደቱ' },
      { command: 'calendar', description: 'የሳምንቱ ሥነ ሥርዓት' },
      { command: 'computus', description: 'ፋሲካ ቀን ስሌት (ባሕረ ሐሳብ)' },
      { command: 'search',   description: 'ቅዱሳት መጻሕፍት ፍለጋ' },
      { command: 'help',     description: 'ሁሉም ትዕዛዞች' }
    ]
  }).catch(() => {}); // Non-critical

  while (_polling) {
    await pollOnce();
  }
}

export function stopBotPolling() {
  _polling = false;
  console.log('🤖 Bot polling stopped.');
}

export function isBotConfigured() {
  return !!BOT_TOKEN();
}

const isDirectRun = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  process.argv[1].replace(/\\/g, '/').endsWith('src/telegram/concierge.js')
);

if (isDirectRun) {
  startBotPolling().catch(err => {
    console.error('Bot fatal error:', err);
    process.exit(1);
  });
}
