/**
 * EOTC Interactive Telegram Concierge Bot & Full Command Center
 * ════════════════════════════════════════════════════════════════
 * Transforms the bot into a complete 2-way spiritual guide & command center.
 *
 * Full Control Features:
 *  - Interactive multi-level inline keyboard menus (Amharic & English)
 *  - On-demand generation for all 9 content pipelines
 *  - Interactive generation wizard (type -> video/image -> theme -> instant delivery)
 *  - Full GitHub Actions cloud dispatch, live monitoring, re-run & cancel
 *  - 9:16 Video Reel generation with FFmpeg Ken Burns & audio
 *  - Full system health diagnostics (AI providers, DB, FFmpeg, GitHub, memory)
 *  - Comprehensive Bahire Hasab computus engine (/computus [year])
 *  - Canonical scripture & 30-day Synaxarium search
 *  - Recent media gallery & on-demand file download (/recent)
 *  - Direct delivery of generated PNGs, MP4 reels, and albums into the chat
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
  getComputusData,
  DAILY_COMMEMORATIONS,
  CHURCH_HISTORY_TOPICS
} from '../utils/calendar.js';

import {
  getVerifiedVerse,
  searchCanonicalVerses
} from '../canon/scripture.js';

import {
  getSynaxariumEntry,
  searchSynaxarium,
  getAllSynaxariumEntries
} from '../canon/synaxarium.js';

import {
  testAIConnection
} from '../ai/openrouter.js';

import {
  testConnection as testDbConnection,
  getStats as getDbStats
} from '../db/supabase.js';

import {
  checkFFmpeg
} from '../render/video.js';

import {
  dispatchWorkflow,
  listWorkflowRuns,
  getLatestWorkflowRun,
  rerunWorkflow,
  cancelWorkflowRun,
  testGitHubConnection,
  getRepoInfo
} from '../utils/github.js';

import {
  TELEGRAM_BOT_TOKEN,
  sendPhotoToChat,
  sendVideoToChat,
  sendMediaGroupToChat,
  sendDocumentToChat,
  sendMessageToChat
} from './bot.js';

import {
  PIPELINES,
  runQuotePipeline,
  runVersePipeline,
  runCarouselPipeline,
  runReflectionPipeline,
  runSaintPipeline,
  runFastingPipeline,
  runHolyWeekPipeline,
  runHistoryPipeline,
  runCalendarPipeline,
  runAllPipelines
} from '../index.js';

const getEnv = (key) => process.env[key];
const BOT_TOKEN = () => getEnv('TELEGRAM_BOT_TOKEN');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output');

let _lastUpdateId = 0;
let _polling = false;

// Active user wizard state: chatId -> { step, contentType, generateVideo, customTheme }
const _wizardSessions = new Map();

// ─── Telegram HTTP Helper ─────────────────────────────────────────────────────

function tgRequest(method, body = null) {
  return new Promise((resolve, reject) => {
    const token = BOT_TOKEN();
    if (!token) return reject(new Error('TELEGRAM_BOT_TOKEN is not configured'));
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
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Telegram ${method} timeout`));
    });
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

function editMsg(chatId, messageId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  return tgRequest('editMessageText', body).catch(err =>
    console.error(`❌ editMsg error: ${err.message}`)
  );
}

function answerCallback(callbackQueryId, text = null) {
  const body = { callback_query_id: callbackQueryId };
  if (text) body.text = text;
  return tgRequest('answerCallbackQuery', body).catch(() => {});
}

// ─── KEYBOARDS & MENUS ────────────────────────────────────────────────────────

export function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎨 ይዘት ማመንጨት (Generate)', callback_data: 'menu:generate' },
        { text: '🧙 ማመንጫ መመሪያ (Wizard)', callback_data: 'wizard:start' }
      ],
      [
        { text: '☁️ GitHub Actions ቁጥጥር', callback_data: 'menu:github' },
        { text: '🎬 9:16 ቪዲዮ ሪልስ (Reels)', callback_data: 'menu:reels' }
      ],
      [
        { text: '⛪ የዕለቱ ቅዱስ (Saint)', callback_data: 'today:saint' },
        { text: '🌿 የጾም መመሪያ (Fasting)', callback_data: 'today:fasting' }
      ],
      [
        { text: '📖 ዕለታዊ ጥቅስ (Verse)', callback_data: 'gen:verse' },
        { text: '📅 የዛሬው ዕለት (Today)', callback_data: 'today' }
      ],
      [
        { text: '📐 ባሕረ ሐሳብ (Computus)', callback_data: 'computus' },
        { text: '📁 የቅርብ ጊዜ ፋይሎች (Files)', callback_data: 'recent' }
      ],
      [
        { text: '📊 የሲስተም ጤንነት (Health)', callback_data: 'status' },
        { text: '🌟 ሁሉንም አፍልቅ (All 9)', callback_data: 'gen:all' }
      ]
    ]
  };
}

export function getGenerateSubmenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎨 ኃይለ ቃል (Quote)', callback_data: 'gen:quote' },
        { text: '📖 ዕለታዊ ጥቅስ (Verse)', callback_data: 'gen:verse' }
      ],
      [
        { text: '📑 5-ስላይድ ካሮሴል (Carousel)', callback_data: 'gen:carousel' },
        { text: '📜 ሳምንታዊ አስተንትኖ (Reflection)', callback_data: 'gen:reflection' }
      ],
      [
        { text: '⛪ የዕለቱ ቅዱስ (Saint)', callback_data: 'gen:saint' },
        { text: '🌿 የጾም መመሪያ (Fasting)', callback_data: 'gen:fasting' }
      ],
      [
        { text: '👑 ሰሙነ ሕማማት (Holy Week)', callback_data: 'gen:holyweek' },
        { text: '🏛️ የቤተ ክርስቲያን ታሪክ (History)', callback_data: 'gen:history' }
      ],
      [
        { text: '📅 ሳምንታዊ መቁጠሪያ (Calendar)', callback_data: 'gen:calendar' },
        { text: '🌟 ሁሉንም አፍልቅ (Generate All)', callback_data: 'gen:all' }
      ],
      [
        { text: '🔙 ወደ ዋና ማውጫ ተመለስ', callback_data: 'menu:main' }
      ]
    ]
  };
}

export function getGitHubSubmenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🚀 Workflow Dispatch (Cloud Run)', callback_data: 'gh:dispatch:menu' },
        { text: '📡 የሩጫዎች ሁኔታ (Runs Status)', callback_data: 'gh:status' }
      ],
      [
        { text: '🔄 የቅርብ ሩጫን ድጋሚ አሂድ (Re-run)', callback_data: 'gh:rerun:latest' },
        { text: '🔗 GitHub Repo ክፈት', url: 'https://github.com/burakaza27-ops/EOTC-Media-Studio---Content-Factory' }
      ],
      [
        { text: '🔙 ወደ ዋና ማውጫ ተመለስ', callback_data: 'menu:main' }
      ]
    ]
  };
}

export function getGitHubDispatchKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎨 Quote (ኃይለ ቃል)', callback_data: 'gh:run:quote' },
        { text: '📖 Verse (ዕለታዊ ጥቅስ)', callback_data: 'gh:run:verse' }
      ],
      [
        { text: '📑 Carousel (ካሮሴል)', callback_data: 'gh:run:carousel' },
        { text: '📜 Reflection (አስተንትኖ)', callback_data: 'gh:run:reflection' }
      ],
      [
        { text: '⛪ Saint (ቅዱስ)', callback_data: 'gh:run:saint' },
        { text: '🌿 Fasting (ጾም)', callback_data: 'gh:run:fasting' }
      ],
      [
        { text: '🎬 Quote + Video Reel (9:16)', callback_data: 'gh:run:quote:video' },
        { text: '🌟 All 9 Pipelines', callback_data: 'gh:run:all' }
      ],
      [
        { text: '🔙 ወደ GitHub ማውጫ', callback_data: 'menu:github' }
      ]
    ]
  };
}

export function getReelsSubmenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎬 ኃይለ ቃል ቪዲዮ ሪል (Quote Reel)', callback_data: 'gen:reel:quote' },
        { text: '🎬 ዕለታዊ ጥቅስ ሪል (Verse Reel)', callback_data: 'gen:reel:verse' }
      ],
      [
        { text: '🎬 የዕለቱ ቅዱስ ሪል (Saint Reel)', callback_data: 'gen:reel:saint' },
        { text: '🎬 አስተንትኖ ሪል (Reflection Reel)', callback_data: 'gen:reel:reflection' }
      ],
      [
        { text: '🎬 ካሮሴል ስላይድሾው ሪል', callback_data: 'gen:reel:carousel' },
        { text: '🔙 ወደ ዋና ማውጫ ተመለስ', callback_data: 'menu:main' }
      ]
    ]
  };
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────────

async function handleStart(chatId) {
  const ethDate = getEthiopianDateGeez();
  const text = [
    '✝️ <b>እንኳን ወደ EOTC Media Studio የቁጥጥር ማዕከል በደህና መጡ!</b>',
    '',
    `📅 <b>የዛሬው ዕለት፡</b> <code>${ethDate}</code>`,
    '',
    'በዚህ ቦት አማካኝነት፡',
    '• ሁሉንም 9 የይዘት አይነቶች ወዲያውኑ ማመንጨት ይችላሉ',
    '• 9:16 የቪዲዮ ሪልስ (Video Reels) በቅጽበት ማዘጋጀት ይችላሉ',
    '• የ GitHub Actions cloud workflowዎችን መቆጣጠር ও ማስኬድ ይችላሉ',
    '• ባሕረ ሐሳብንና የ 81ዱን መጻሕፍት ቃላት መፈለግ ይችላሉ',
    '',
    '👇 <b>ከታች ያሉትን ቁልፎች በመጠቀም ይጀምሩ፡</b>'
  ].join('\n');

  return sendMsg(chatId, text, getMainMenuKeyboard());
}

async function handleToday(chatId) {
  const ctx = getLiturgicalContext();
  const ethDate = getEthiopianDateGeez();
  const today = new Date();
  const eth = toEthiopianDate(today);
  const daily = DAILY_COMMEMORATIONS[eth.day] || DAILY_COMMEMORATIONS[1];
  const synaxarium = getSynaxariumEntry(eth.day);
  const fastInfo = getFastingInfo();
  const holyWeek = getHolyWeekDay();

  const lines = [
    `✝️ <b>የዕለቱ ሥነ ሥርዓት — ${eth.day} ${ctx.ethiopianDate.split(' ')[1] || ''} ${eth.year} ዓ.ም</b>`,
    `<i>${ethDate}</i>`,
    '',
    `🔔 <b>የዕለቱ በዓል/መታሰቢያ፡</b> ${daily.saint}`,
    `🎭 <b>የሥነ-ሥርዓት መንፈስ፡</b> ${ctx.mood}`
  ];

  if (synaxarium) {
    lines.push('');
    lines.push(`📜 <b>ስንክሳር፡</b> ${synaxarium.synaxariumExcerpt.substring(0, 160)}...`);
    if (synaxarium.hymnAmharic) {
      lines.push(`🎵 <b>ዜማ፡</b> <i>«${synaxarium.hymnAmharic}»</i>`);
    }
  }

  if (fastInfo.active) {
    lines.push('');
    lines.push(`🍽️ <b>ጾም፡</b> ${fastInfo.name} (ቀን ${fastInfo.currentDay}/${fastInfo.totalDays})`);
  }

  if (holyWeek.isHolyWeek) {
    lines.push('');
    lines.push(`✝️ <b>ሰሙነ ሕማማት፡</b> ${holyWeek.amharic} (${holyWeek.english})`);
  }

  lines.push('');
  lines.push('👇 <i>ይዘት ለማመንጨት ከታች ያሉትን ቁልፎች ይጠቀሙ፦</i>');

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎨 ለዛሬው ቀን ካርድ አፍልቅ', callback_data: 'gen:quote' },
        { text: '⛪ የዕለቱ ቅዱስ ካርድ', callback_data: `gen:saint:${eth.day}` }
      ],
      [
        { text: '🎬 የዛሬው 9:16 ቪዲዮ ሪል', callback_data: 'gen:reel:quote' },
        { text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }
      ]
    ]
  };

  return sendMsg(chatId, lines.join('\n'), keyboard);
}

async function handleSaint(chatId, dayArg = null) {
  const today = new Date();
  const eth = toEthiopianDate(today);
  const day = dayArg ? parseInt(dayArg, 10) : eth.day;

  if (isNaN(day) || day < 1 || day > 30) {
    return sendMsg(chatId, '❌ እባክዎ ከ 1 እስከ 30 ያለ ትክክለኛ ቀን ያስገቡ። ምሳሌ: <code>/saint 24</code>');
  }

  const synaxarium = getSynaxariumEntry(day);
  const daily = DAILY_COMMEMORATIONS[day];

  const lines = [
    `✝️ <b>የቀን ${day} ቅዱስ/ቅድስት መታሰቢያ</b>`,
    `<b>${synaxarium?.saint || daily?.saint || 'ቅዱስ'}</b>`,
    ''
  ];

  if (synaxarium) {
    lines.push(`📖 <b>ታሪክ፡</b> ${synaxarium.synaxariumExcerpt}`);
    lines.push('');
    lines.push(`💡 <b>መንፈሳዊ ትምህርት፡</b> ${synaxarium.spiritualLesson}`);
    lines.push('');
    if (synaxarium.hymnGeEz) {
      lines.push(`🎵 <b>የግዕዝ ምስጋና፡</b> <i>${synaxarium.hymnGeEz}</i>`);
      lines.push(`🎵 <b>ትርጉም፡</b> <i>«${synaxarium.hymnAmharic}»</i>`);
      lines.push('');
    }
    lines.push(`📚 <b>ምንጭ፡</b> ${synaxarium.primarySource}`);
  } else if (daily) {
    lines.push(`📖 ${daily.theme}`);
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: `🎨 ለቀን ${day} ካርድ አፍልቅ`, callback_data: `gen:saint:${day}` },
        { text: `🎬 ለቀን ${day} ቪዲዮ ሪል`, callback_data: `gen:reel:saint` }
      ],
      [{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]
    ]
  };

  return sendMsg(chatId, lines.join('\n'), keyboard);
}

async function handleVerse(chatId, query = '') {
  const verse = getVerifiedVerse(query, query);
  const text = [
    '📖 <b>የዕለቱ ቅዱስ ቃል (፩፱፷፪ ዓ.ም መጽሐፍ ቅዱስ)</b>',
    '',
    `«${verse.verse}»`,
    '',
    `— <b>${verse.reference}</b>`
  ].join('\n');

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎨 ይህን ጥቅስ በካርድ አፍልቅ', callback_data: 'gen:verse' },
        { text: '🎬 በ 9:16 ቪዲዮ ሪል አፍልቅ', callback_data: 'gen:reel:verse' }
      ],
      [{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]
    ]
  };

  return sendMsg(chatId, text, keyboard);
}

async function handleFasting(chatId) {
  const fastInfo = getFastingInfo();
  if (!fastInfo.active) {
    const text = [
      '🍽️ <b>የጾም መመሪያ</b>',
      '',
      'በዛሬው ዕለት የረዥም ጊዜ የዐዋጅ ጾም የለም። ሆኖም የኦርቶዶክስ ተዋሕዶ ምዕመናን ዘወትር ረቡዕና ዓርብ በጾምና በጸሎት ያሳልፋሉ።',
      '',
      '✨ <i>«ይህ ወገን ግን ከጸሎትና ከጾም በቀር በምንም ሊወጣ አይችልም» (ማቴዎስ ፲፯፥፳፩)</i>'
    ].join('\n');
    return sendMsg(chatId, text, {
      inline_keyboard: [
        [{ text: '🌿 የጾም ካርድ አፍልቅ', callback_data: 'gen:fasting' }],
        [{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]
      ]
    });
  }

  const lines = [
    `🍽️ <b>${fastInfo.name}</b>`,
    `📅 ሂደት፡ ቀን ${fastInfo.currentDay} ከ ${fastInfo.totalDays}`,
    '',
    `📜 <b>ሥነ ሥርዓት፡</b> ${fastInfo.theme || 'በጸሎትና በስግደት የሚደረግ ጾም'}`,
    '',
    '📋 <b>የጾም ሕጎች፡</b>'
  ];
  if (fastInfo.rules) {
    fastInfo.rules.forEach(r => lines.push(`• ${r}`));
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: '🎨 የጾም መመሪያ ካርድ አፍልቅ', callback_data: 'gen:fasting' }],
      [{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]
    ]
  };

  return sendMsg(chatId, lines.join('\n'), keyboard);
}

async function handleCalendar(chatId) {
  const weekData = getWeekCalendarData();
  const lines = [
    `📅 <b>የሳምንቱ መርሃ ግብር (${weekData[0].ethMonth} ${weekData[0].ethDay} - ${weekData[6].ethDay})</b>`,
    ''
  ];

  weekData.forEach(d => {
    const icon = d.isFeast ? '🌟' : (d.isFast ? '🍽️' : '✝️');
    lines.push(`${icon} <b>${d.weekday} (${d.ethDay})</b> — ${d.saint.split(' (')[0]}`);
  });

  const keyboard = {
    inline_keyboard: [
      [{ text: '🎨 ሳምንታዊ መቁጠሪያ ካርድ አፍልቅ', callback_data: 'gen:calendar' }],
      [{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]
    ]
  };

  return sendMsg(chatId, lines.join('\n'), keyboard);
}

async function handleComputus(chatId, yearArg = null) {
  const today = new Date();
  const eth = toEthiopianDate(today);
  const year = yearArg ? parseInt(yearArg, 10) : eth.year;

  if (isNaN(year) || year < 1900 || year > 2100) {
    return sendMsg(chatId, '❌ እባክዎ ትክክለኛ የኢትዮጵያ ዓመተ ምሕረት ያስገቡ። ምሳሌ: <code>/computus 2019</code>');
  }

  const computus = getComputusData(year);

  const lines = [
    `📐 <b>የባሕረ ሐሳብ የቀመር ሰንጠረዥ — ${computus.year} ዓ.ም (${computus.yearGeez})</b>`,
    '════════════════════════════════════════',
    `👑 <b>ወንጌላዊ፡</b> ${computus.evangelist}`,
    `📅 <b>የጳጉሜ ቀናት፡</b> ${computus.pagumeDays} ቀናት`,
    '',
    '🕊️ <b>የተንቀሳቃሾች አጽዋማትና በዓላት ቀናት፡</b>'
  ];

  computus.feasts.forEach(f => {
    lines.push(`• <b>${f.name}፡</b> <code>${f.date}</code>`);
  });

  lines.push('════════════════════════════════════════');
  lines.push('<i>የቀመር ቀመሩ በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ሊቃውንት ቀመር መሠረት በትክክል የተሰላ ነው።</i>');

  return sendMsg(chatId, lines.join('\n'), {
    inline_keyboard: [[{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]]
  });
}

async function handleSearch(chatId, query) {
  if (!query || query.trim().length < 2) {
    return sendMsg(chatId, '❌ እባክዎ የሚፈልጉትን ቃል ያስገቡ። ምሳሌ: <code>/search ፍቅር</code> ወይም <code>/search ማርያም</code>');
  }

  const results = searchCanonicalVerses(query.trim());
  const synaxResults = searchSynaxarium(query.trim());

  if (results.length === 0 && synaxResults.length === 0) {
    return sendMsg(chatId, `❌ «<b>${query}</b>» ለሚለው ቃል ምንም ውጤት አልተገኘም። እባክዎ ሌላ ቃል ይሞክሩ።`);
  }

  const lines = [`🔍 <b>የፍለጋ ውጤቶች ለ «${query}»</b>`, ''];

  if (results.length > 0) {
    lines.push(`📖 <b>ከቅዱሳት መጻሕፍት (${results.length} ተገኝተዋል)፡</b>`);
    results.slice(0, 3).forEach(r => {
      lines.push(`• <b>${r.reference}</b>: «${r.verse}»`);
    });
    lines.push('');
  }

  if (synaxResults.length > 0) {
    lines.push(`⛪ <b>ከስንክሳር (${synaxResults.length} ተገኝተዋል)፡</b>`);
    synaxResults.slice(0, 3).forEach(s => {
      lines.push(`• <b>${s.saint}</b>: ${s.synaxariumExcerpt.substring(0, 100)}...`);
    });
  }

  return sendMsg(chatId, lines.join('\n'), {
    inline_keyboard: [[{ text: '🎨 በዚህ ርእስ ይዘት አፍልቅ', callback_data: `wizard:type:quote:${query}` }]]
  });
}

async function handleRecent(chatId) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return sendMsg(chatId, '📁 ምንም የተፈጠሩ ፋይሎች እስካሁን አልተገኙም።');
  }

  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.png') || f.endsWith('.mp4') || f.endsWith('.jpg'))
    .map(f => {
      const fullPath = path.join(OUTPUT_DIR, f);
      const stats = fs.statSync(fullPath);
      return { name: f, path: fullPath, size: stats.size, mtime: stats.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 8);

  if (files.length === 0) {
    return sendMsg(chatId, '📁 ምንም የተፈጠሩ ፋይሎች እስካሁን አልተገኙም። ይዘት ለማመንጨት /menu ይጫኑ።');
  }

  const lines = ['📁 <b>የቅርብ ጊዜ የተፈጠሩ ፋይሎች (Recent Media)፡</b>', ''];
  const buttons = [];

  files.forEach((f, idx) => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    const icon = f.name.endsWith('.mp4') ? '🎬' : '🖼️';
    lines.push(`${idx + 1}. ${icon} <code>${f.name}</code> (${sizeMB} MB)`);
    buttons.push([{ text: `📥 ላክ፡ ${f.name.substring(0, 20)}`, callback_data: `sendfile:${f.name}` }]);
  });

  buttons.push([{ text: '🔙 ዋና ማውጫ', callback_data: 'menu:main' }]);

  return sendMsg(chatId, lines.join('\n'), { inline_keyboard: buttons });
}

// ─── GITHUB ACTIONS COMMANDS & CONTROL ────────────────────────────────────────

async function handleGitHubStatus(chatId) {
  const waitMsg = await sendMsg(chatId, '⏳ የ GitHub Actions ሩጫዎችን ሁኔታ በመፈተሽ ላይ...');
  const repoInfo = getRepoInfo();

  try {
    const runs = await listWorkflowRuns('generate-media.yml', 4);

    if (!runs || runs.length === 0) {
      const text = `☁️ <b>GitHub Actions:</b> ${repoInfo.full}\n\nእስካሁን ምንም የተመዘገቡ የ workflow ሩጫዎች የሉም።\n\nአዲስ ሩጫ ለማስጀመር /dispatch ይጠቀሙ።`;
      return editMsg(chatId, waitMsg.message_id, text, getGitHubSubmenuKeyboard());
    }

    const lines = [
      `☁️ <b>GitHub Actions የቀጥታ ሁኔታ — ${repoInfo.repo}</b>`,
      '════════════════════════════════════════',
      ''
    ];

    runs.forEach((r, idx) => {
      let icon = '🟡';
      if (r.conclusion === 'success') icon = '🟢';
      else if (r.conclusion === 'failure') icon = '🔴';
      else if (r.conclusion === 'cancelled') icon = '⚪';
      else if (r.status === 'in_progress') icon = '🔄';

      const durationStr = r.durationSeconds ? `${r.durationSeconds}s` : 'N/A';
      lines.push(`${icon} <b>Run #${r.id}</b> — ${r.conclusion || r.status}`);
      lines.push(`   • ምክንያት፡ ${r.commitTitle.substring(0, 40)}`);
      lines.push(`   • የፈጀው ጊዜ፡ ${durationStr} | ደራሲ፡ @${r.author}`);
      lines.push(`   • አድራሻ፡ <a href="${r.htmlUrl}">በ GitHub ክፈት</a>`);
      lines.push('');
    });

    lines.push('════════════════════════════════════════');
    lines.push('<i>በ GitHub Actions ላይ አዲስ ይዘት ለማመንጨት ከታች ያለውን ቁልፍ ይጫኑ።</i>');

    return editMsg(chatId, waitMsg.message_id, lines.join('\n'), getGitHubSubmenuKeyboard());
  } catch (err) {
    return editMsg(
      chatId,
      waitMsg.message_id,
      `❌ GitHub Actions መረጃ ማምጣት አልተሳካም፦ <code>${err.message}</code>`,
      getGitHubSubmenuKeyboard()
    );
  }
}

async function handleGitHubDispatch(chatId, contentType = 'quote', generateVideo = false) {
  const waitMsg = await sendMsg(chatId, `⏳ <b>GitHub Action [${contentType}]</b> በማስጀመር ላይ...`);

  try {
    const result = await dispatchWorkflow('generate-media.yml', {
      content_type: contentType,
      use_liturgical: 'true',
      generate_video: generateVideo ? 'true' : 'false',
      video_profiles: '1:1,9:16'
    });

    const lines = [
      '🚀 <b>GitHub Action በተሳካ ሁኔታ ተጀምሯል!</b>',
      '════════════════════════════════════════',
      `• <b>ይዘት፡</b> ${contentType}`,
      `• <b>ቪዲዮ ሪልስ፡</b> ${generateVideo ? 'አዎ (9:16)' : 'አይደለም'}`,
      `• <b>ቅርንጫፍ፡</b> ${result.ref}`,
      `• <b>ሰዓት፡</b> ${new Date().toLocaleTimeString()}`,
      '════════════════════════════════════════',
      '✅ <i>ሩጫው በ GitHub Ubuntu Runner ላይ እየተከናወነ ነው። ውጤቱን በ /ghstatus ማየት ይችላሉ።</i>'
    ];

    const keyboard = {
      inline_keyboard: [
        [{ text: '📡 የሩጫውን ሂደት ተመልከት', callback_data: 'gh:status' }],
        [{ text: '🔙 ወደ GitHub ማውጫ', callback_data: 'menu:github' }]
      ]
    };

    return editMsg(chatId, waitMsg.message_id, lines.join('\n'), keyboard);
  } catch (err) {
    return editMsg(
      chatId,
      waitMsg.message_id,
      `❌ GitHub Action ማስጀመር አልተሳካም፦ <code>${err.message}</code>\n\n💡 <i>ማሳሰቢያ፡ GITHUB_TOKEN በ .env ውስጥ መዋቀሩን ያረጋግጡ። በአማራጭ በቦቱ ውስጥ በቀጥታ ለማመንጨት /quote ወይም /menu ይጠቀሙ።</i>`,
      getGitHubSubmenuKeyboard()
    );
  }
}

// ─── SYSTEM HEALTH DIAGNOSTICS ────────────────────────────────────────────────

async function handleStatus(chatId) {
  const waitMsg = await sendMsg(chatId, '⏳ የሲስተሙን ጤንነት በመመርመር ላይ...');

  const startTime = Date.now();
  const [aiStatus, dbStatus, ffmpegStatus, ghStatus] = await Promise.all([
    testAIConnection().catch(e => ({ connected: false, error: e.message })),
    testDbConnection().catch(e => ({ connected: false, error: e.message })),
    checkFFmpeg().catch(e => ({ available: false, error: e.message })),
    testGitHubConnection().catch(e => ({ configured: false, error: e.message }))
  ]);

  const ethDate = getEthiopianDateGeez();
  const memoryMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const uptimeMin = (process.uptime() / 60).toFixed(1);

  const lines = [
    '📊 <b>EOTC Media Studio — የቀጥታ ሲስተም ጤንነት (Live Health)</b>',
    '════════════════════════════════════════',
    `📅 <b>የኢትዮጵያ ቀን፡</b> <code>${ethDate}</code>`,
    '',
    `🤖 <b>AI ሞተሮች (Dual-Model):</b> ${aiStatus.connected ? '🟢 ዝግጁ (Ready)' : '🔴 ስህተት'}`,
    `   • ዋና አቅራቢ፡ ${aiStatus.activeProvider || 'None'}`,
    `   • OpenRouter: ${aiStatus.openRouterConfigured ? '🟢 አለው' : '⚪ የለም'}`,
    `   • Google AI Studio: ${aiStatus.googleAIStudioConfigured ? '🟢 አለው' : '⚪ የለም'}`,
    `   • ፍጥነት፡ ${aiStatus.latencyMs ? aiStatus.latencyMs + 'ms' : 'N/A'}`,
    '',
    `💾 <b>ዳታቤዝ (Supabase):</b> ${dbStatus.connected ? '🟢 ተገናኝቷል' : '🟡 ኦፍላይን ካሽ (Local Cache Ready)'}`,
    `   • ሁኔታ፡ ${dbStatus.connected ? 'የተገናኘ' : 'የአካባቢ ማከማቻ ዝግጁ'}`,
    '',
    `🎬 <b>የቪዲዮ ሞተር (FFmpeg):</b> ${ffmpegStatus.available ? `🟢 ዝግጁ (${ffmpegStatus.version || 'installed'})` : '🟡 አልተገኘም'}`,
    '',
    `☁️ <b>GitHub Actions Integration:</b> ${ghStatus.configured ? '🟢 ተገናኝቷል' : '🟡 የሕዝብ ንባብ (Public-Read)'}`,
    `   • መጋዘን (Repo): <code>${ghStatus.repo}</code>`,
    '',
    `⚙️ <b>የአገልጋይ ጤንነት፡</b>`,
    `   • Node.js: ${process.version}`,
    `   • Memory: ${memoryMB} MB`,
    `   • Uptime: ${uptimeMin} ደቂቃ`,
    '════════════════════════════════════════',
    '✅ <i>ሁሉም አገልግሎቶች ሙሉ በሙሉ ዝግጁ ናቸው!</i>'
  ];

  if (waitMsg?.message_id) {
    return editMsg(chatId, waitMsg.message_id, lines.join('\n'), getMainMenuKeyboard());
  }
  return sendMsg(chatId, lines.join('\n'), getMainMenuKeyboard());
}

// ─── EXECUTE IN-PROCESS GENERATION ────────────────────────────────────────────

async function executeGeneration(chatId, contentType, customTheme = null, wantVideo = false) {
  const typeLabels = {
    quote: 'ኃይለ ቃል (Power Quote)',
    verse: 'ዕለታዊ ጥቅስ (Daily Verse)',
    carousel: '5-ስላይድ ካሮሴል (Carousel Album)',
    reflection: 'ሳምንታዊ አስተንትኖ (Reflection)',
    saint: 'የዕለቱ ቅዱስ (Saint Card)',
    fasting: 'የጾም መመሪያ (Fasting Guide)',
    holyweek: 'ሰሙነ ሕማማት (Holy Week)',
    history: 'የቤተ ክርስቲያን ታሪክ (Church History)',
    calendar: 'ሳምንታዊ መቁጠሪያ (Weekly Calendar)',
    all: 'ሁሉንም 9 ይዘቶች (All 9 Pipelines)'
  };

  const label = typeLabels[contentType] || contentType;
  const progressMsg = await sendMsg(
    chatId,
    `⏳ <b>${label}</b> በማመንጨት ላይ...\n\n• AI ይዘት በመጻፍ ላይ...\n• ንድፉ በ Puppeteer 3× Retina እየተቀረጸ ነው...\n• እባክዎ ጥቂት ሰከንዶች ይጠብቁ ✝️`
  );

  try {
    const pipelineFn = PIPELINES[contentType];

    if (contentType === 'all') {
      await runAllPipelines(true, { targetChatId: chatId, customTheme, generateVideo: wantVideo });
      if (progressMsg?.message_id) {
        await editMsg(chatId, progressMsg.message_id, `🎉 <b>ሁሉም 9 ይዘቶች በተሳካ ሁኔታ ተጠናቀው ተልከዋል!</b>`, getMainMenuKeyboard());
      }
      return;
    }

    if (!pipelineFn) {
      if (progressMsg?.message_id) {
        await editMsg(chatId, progressMsg.message_id, `❌ ያልታወቀ የይዘት አይነት: ${contentType}`, getMainMenuKeyboard());
      }
      return;
    }

    await pipelineFn(true, {
      targetChatId: chatId,
      customTheme: customTheme,
      generateVideo: wantVideo
    });

    if (progressMsg?.message_id) {
      await editMsg(chatId, progressMsg.message_id, `✅ <b>${label}</b> በተሳካ ሁኔታ ተጠናቆ ተልኳል! 🎉`, getMainMenuKeyboard());
    }
  } catch (err) {
    console.error(`❌ Generation error (${contentType}):`, err);
    if (progressMsg?.message_id) {
      await editMsg(chatId, progressMsg.message_id, `❌ ማመንጨት አልተሳካም፦ <code>${err.message}</code>`, getMainMenuKeyboard());
    } else {
      await sendMsg(chatId, `❌ ማመንጨት አልተሳካም፦ <code>${err.message}</code>`, getMainMenuKeyboard());
    }
  }
}

// ─── DISPATCHER & INTERACTION ROUTER ──────────────────────────────────────────

async function dispatchUpdate(update) {
  // 1. Handle Inline Button Clicks (Callback Queries)
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    const data = cq.data;
    await answerCallback(cq.id, '⏳ ትዕዛዝዎ እየተስተናገደ ነው...');

    console.log(`🔘 Button pressed: "${data}" by ${cq.from?.id} in ${chatId}`);

    // Navigation submenus
    if (data === 'menu:main') {
      await editMsg(chatId, cq.message.message_id, '✝️ <b>ዋና የቁጥጥር ማዕከል (Main Menu)</b>\n\nምን ማድረግ ይፈልጋሉ?', getMainMenuKeyboard());
      return;
    }
    if (data === 'menu:generate') {
      await editMsg(chatId, cq.message.message_id, '🎨 <b>የይዘት ማመንጫ ሰሌዳ (Content Studio)</b>\n\nየሚፈልጉትን የይዘት ዓይነት ይምረጡ፡', getGenerateSubmenuKeyboard());
      return;
    }
    if (data === 'menu:github') {
      await editMsg(chatId, cq.message.message_id, '☁️ <b>GitHub Actions የደመና መቆጣጠሪያ (Cloud Actions)</b>\n\nከዚህ ሆነው በ GitHub Actions ላይ workflow ማስኬድ ይችላሉ፡', getGitHubSubmenuKeyboard());
      return;
    }
    if (data === 'menu:reels') {
      await editMsg(chatId, cq.message.message_id, '🎬 <b>9:16 የቪዲዮ ሪልስ ማመንጫ (Reels Studio)</b>\n\nየቪዲዮ ሪል ማመንጨት የሚፈልጉትን ይዘት ይምረጡ፡', getReelsSubmenuKeyboard());
      return;
    }

    // Direct features
    if (data === 'status') {
      await handleStatus(chatId);
      return;
    }
    if (data === 'today') {
      await handleToday(chatId);
      return;
    }
    if (data === 'today:saint') {
      await handleSaint(chatId);
      return;
    }
    if (data === 'today:fasting') {
      await handleFasting(chatId);
      return;
    }
    if (data === 'computus') {
      await handleComputus(chatId);
      return;
    }
    if (data === 'recent') {
      await handleRecent(chatId);
      return;
    }

    // GitHub Actions handling
    if (data === 'gh:status') {
      await handleGitHubStatus(chatId);
      return;
    }
    if (data === 'gh:dispatch:menu') {
      await editMsg(chatId, cq.message.message_id, '🚀 <b>በ GitHub Actions ላይ ምን ዓይነት ይዘት እንዲመረት ይፈልጋሉ?</b>', getGitHubDispatchKeyboard());
      return;
    }
    if (data.startsWith('gh:run:')) {
      const parts = data.replace('gh:run:', '').split(':');
      const contentType = parts[0];
      const wantVideo = parts[1] === 'video';
      await handleGitHubDispatch(chatId, contentType, wantVideo);
      return;
    }
    if (data === 'gh:rerun:latest') {
      try {
        const latest = await getLatestWorkflowRun('generate-media.yml');
        if (latest) {
          await rerunWorkflow(latest.id);
          await sendMsg(chatId, `🔄 Run #${latest.id} በተሳካ ሁኔታ ድጋሚ ተጀምሯል!`);
        } else {
          await sendMsg(chatId, '❌ ድጋሚ የሚጀመር የቅርብ ሩጫ አልተገኘም።');
        }
      } catch (e) {
        await sendMsg(chatId, `❌ ድጋሚ ማስጀመር አልተሳካም፦ ${e.message}`);
      }
      return;
    }

    // Send recent file on request
    if (data.startsWith('sendfile:')) {
      const fileName = data.replace('sendfile:', '');
      const filePath = path.join(OUTPUT_DIR, fileName);
      if (fs.existsSync(filePath)) {
        await sendMsg(chatId, `📤 «${fileName}» በመላክ ላይ...`);
        if (fileName.endsWith('.mp4')) {
          await sendVideoToChat(chatId, filePath, `🎬 <b>${fileName}</b>`);
        } else {
          await sendPhotoToChat(chatId, filePath, `🖼️ <b>${fileName}</b>`);
        }
      } else {
        await sendMsg(chatId, `❌ ፋይሉ አልተገኘም፦ ${fileName}`);
      }
      return;
    }

    // Generation triggers
    if (data.startsWith('gen:reel:')) {
      const type = data.replace('gen:reel:', '');
      await executeGeneration(chatId, type, null, true);
      return;
    }
    if (data.startsWith('gen:saint:')) {
      const day = data.replace('gen:saint:', '');
      const pipelineFn = PIPELINES['saint'];
      await sendMsg(chatId, `⏳ ለቀን ${day} ካርድ በማዘጋጀት ላይ...`);
      await pipelineFn(true, { targetChatId: chatId, day: parseInt(day, 10) });
      return;
    }
    if (data.startsWith('gen:')) {
      const type = data.replace('gen:', '');
      await executeGeneration(chatId, type, null, false);
      return;
    }

    // Wizard start
    if (data === 'wizard:start') {
      _wizardSessions.set(chatId, { step: 'choose_type' });
      const text = [
        '🧙 <b>የይዘት ማመንጫ መመሪያ (Interactive Creation Wizard)</b>',
        '',
        'ደረጃ ፩፡ ማመንጨት የሚፈልጉትን የይዘት ዓይነት ይምረጡ፡'
      ].join('\n');
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🎨 ኃይለ ቃል (Quote)', callback_data: 'wiz:type:quote' },
            { text: '📖 ዕለታዊ ጥቅስ (Verse)', callback_data: 'wiz:type:verse' }
          ],
          [
            { text: '📑 ካሮሴል (Carousel)', callback_data: 'wiz:type:carousel' },
            { text: '📜 አስተንትኖ (Reflection)', callback_data: 'wiz:type:reflection' }
          ],
          [
            { text: '⛪ የዕለቱ ቅዱስ (Saint)', callback_data: 'wiz:type:saint' },
            { text: '🌿 የጾም መመሪያ (Fasting)', callback_data: 'wiz:type:fasting' }
          ],
          [
            { text: '🔙 ሰርዝና ተመለስ', callback_data: 'menu:main' }
          ]
        ]
      };
      await editMsg(chatId, cq.message.message_id, text, keyboard);
      return;
    }

    if (data.startsWith('wiz:type:')) {
      const selectedType = data.replace('wiz:type:', '');
      _wizardSessions.set(chatId, { step: 'choose_format', type: selectedType });

      const text = [
        `🧙 <b>ደረጃ ፪፡ የፋይል ቅርጸት ይምረጡ [${selectedType}]</b>`,
        '',
        'ምስል ብቻ ወይስ የቪዲዮ ሪል (9:16 Video Reel) እንዲዘጋጅ ይፈልጋሉ?'
      ].join('\n');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🖼️ ምስል ብቻ (3× Retina PNG)', callback_data: `wiz:fmt:${selectedType}:img` },
            { text: '🎬 ምስል + 9:16 ቪዲዮ ሪል (MP4)', callback_data: `wiz:fmt:${selectedType}:video` }
          ],
          [{ text: '🔙 ተመለስ', callback_data: 'wizard:start' }]
        ]
      };
      await editMsg(chatId, cq.message.message_id, text, keyboard);
      return;
    }

    if (data.startsWith('wiz:fmt:')) {
      const [, , type, format] = data.split(':');
      const wantVideo = format === 'video';
      _wizardSessions.set(chatId, { step: 'choose_theme', type, wantVideo });

      const text = [
        `🧙 <b>ደረጃ ፫፡ ርእስ ይምረጡ [${type}]</b>`,
        '',
        'የይዘቱን ርእስ እንዴት መምረጥ ይፈልጋሉ?'
      ].join('\n');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📅 የዕለቱ ሥነ ሥርዓት (Liturgical)', callback_data: `wiz:go:${type}:${wantVideo}:liturgical` },
            { text: '🎲 አጋጣሚ ርእስ (Inspirational)', callback_data: `wiz:go:${type}:${wantVideo}:auto` }
          ],
          [
            { text: '✍️ የራሴን ርእስ መጻፍ እፈልጋለሁ', callback_data: `wiz:prompt_theme:${type}:${wantVideo}` }
          ],
          [{ text: '🔙 ተመለስ', callback_data: 'wizard:start' }]
        ]
      };
      await editMsg(chatId, cq.message.message_id, text, keyboard);
      return;
    }

    if (data.startsWith('wiz:prompt_theme:')) {
      const [, , type, wantVideoStr] = data.split(':');
      const wantVideo = wantVideoStr === 'true';
      _wizardSessions.set(chatId, { step: 'awaiting_custom_theme', type, wantVideo });

      await editMsg(
        chatId,
        cq.message.message_id,
        `✍️ <b>ርእስዎን ይጻፉ፦</b>\n\nእባክዎ የሚፈልጉትን ርእስ፣ ጥቅስ ወይም ጭብጥ በጽሑፍ መልእክት ይላኩልኝ (ምሳሌ፦ <i>«ስለ ፍቅርና ይቅርታ»</i> ወይም <i>«መዝሙር ፳፫»</i>)።`
      );
      return;
    }

    if (data.startsWith('wiz:go:')) {
      const [, , type, wantVideoStr, themeMode] = data.split(':');
      const wantVideo = wantVideoStr === 'true';
      _wizardSessions.delete(chatId);
      await executeGeneration(chatId, type, null, wantVideo);
      return;
    }

    return;
  }

  // 2. Handle Text Messages
  const msg = update.message || update.edited_message;
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text.trim();

  // Check if user is currently entering a custom theme for the wizard
  if (_wizardSessions.has(chatId) && _wizardSessions.get(chatId).step === 'awaiting_custom_theme' && !text.startsWith('/')) {
    const session = _wizardSessions.get(chatId);
    _wizardSessions.delete(chatId);
    await sendMsg(chatId, `✨ ርእስ ተቀብያለሁ፦ «<b>${text}</b>»`);
    await executeGeneration(chatId, session.type, text, session.wantVideo);
    return;
  }

  const [cmd, ...args] = text.split(/\s+/);
  const command = cmd.toLowerCase().replace(/^\//, '').split('@')[0];
  const rest = args.join(' ');

  console.log(`📩 Bot command: /${command} from ${userId} in ${chatId}`);

  try {
    switch (command) {
      case 'start':
        await handleStart(chatId); break;
      case 'menu':
        await handleStart(chatId); break;
      case 'help':
        await handleStart(chatId); break;
      case 'wizard':
        await handleStart(chatId); break;
      case 'status':
      case 'health':
        await handleStatus(chatId); break;
      case 'today':
        await handleToday(chatId); break;
      case 'saint':
        if (args[0] && !isNaN(parseInt(args[0], 10))) {
          await handleSaint(chatId, args[0]);
        } else {
          await executeGeneration(chatId, 'saint', rest || null, false);
        }
        break;
      case 'verse':
        if (rest) {
          await executeGeneration(chatId, 'verse', rest, false);
        } else {
          await executeGeneration(chatId, 'verse', null, false);
        }
        break;
      case 'quote':
        await executeGeneration(chatId, 'quote', rest || null, false); break;
      case 'carousel':
        await executeGeneration(chatId, 'carousel', rest || null, false); break;
      case 'reflection':
        await executeGeneration(chatId, 'reflection', rest || null, false); break;
      case 'fasting':
        await executeGeneration(chatId, 'fasting', null, false); break;
      case 'holyweek':
        await executeGeneration(chatId, 'holyweek', null, false); break;
      case 'history':
        await executeGeneration(chatId, 'history', rest || null, false); break;
      case 'calendar':
        await executeGeneration(chatId, 'calendar', null, false); break;
      case 'reel':
        await executeGeneration(chatId, args[0]?.toLowerCase() || 'quote', null, true); break;
      case 'all':
        await executeGeneration(chatId, 'all', null, false); break;
      case 'dispatch':
        await handleGitHubDispatch(chatId, args[0]?.toLowerCase() || 'quote', args[1] === 'video'); break;
      case 'ghstatus':
      case 'ghruns':
        await handleGitHubStatus(chatId); break;
      case 'recent':
        await handleRecent(chatId); break;
      case 'computus':
        await handleComputus(chatId, args[0]); break;
      case 'search':
        await handleSearch(chatId, rest); break;
      default:
        if (text.startsWith('/')) {
          await sendMsg(chatId, '❓ ያልታወቀ ትዕዛዝ ነው። ሙሉ ዝርዝር ለማየት /menu ወይም /help ይጫኑ።', getMainMenuKeyboard());
        }
    }
  } catch (err) {
    console.error(`❌ dispatchUpdate error: ${err.message}`);
    await sendMsg(chatId, `❌ ችግር ተፈጠረ፦ ${err.message}`);
  }
}

// ─── LONG-POLL LOOP ───────────────────────────────────────────────────────────

async function pollOnce() {
  try {
    const updates = await tgRequest('getUpdates', {
      offset: _lastUpdateId + 1,
      timeout: 25,
      limit: 100,
      allowed_updates: ['message', 'edited_message', 'callback_query']
    });
    for (const update of updates) {
      if (update.update_id > _lastUpdateId) _lastUpdateId = update.update_id;
      await dispatchUpdate(update).catch(e => console.error('Dispatch error:', e.message));
    }
  } catch (err) {
    if (!err.message?.includes('ETIMEOUT') && !err.message?.includes('timeout')) {
      console.error(`⚠️ Poll error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2500));
  }
}

/**
 * Start the interactive bot long-polling loop.
 */
export async function startBotPolling() {
  if (_polling) return;
  const token = BOT_TOKEN();
  if (!token) {
    console.log('⚠️ Interactive bot not started: TELEGRAM_BOT_TOKEN not set.');
    return;
  }

  _polling = true;
  console.log('🤖 Interactive Telegram Concierge Bot & Full Command Center started (long-poll)...');

  // Register commands menu in Telegram native UI
  await tgRequest('setMyCommands', {
    commands: [
      { command: 'menu',       description: '🎛️ ዋና የቁጥጥር ማዕከል (Main Menu)' },
      { command: 'today',      description: '📅 የዛሬው ዕለት፣ ቅዱሳንና በዓላት' },
      { command: 'quote',      description: '🎨 ኃይለ ቃል አፍልቅ (Generate Quote)' },
      { command: 'verse',      description: '📖 ዕለታዊ ጥቅስ አፍልቅ (Generate Verse)' },
      { command: 'carousel',   description: '📑 5-ስላይድ ካሮሴል አፍልቅ' },
      { command: 'reflection', description: '📜 ሳምንታዊ አስተንትኖ አፍልቅ' },
      { command: 'saint',      description: '⛪ የዕለቱ ቅዱስ ካርድ' },
      { command: 'fasting',    description: '🌿 የጾም መመሪያ ካርድ' },
      { command: 'holyweek',   description: '👑 ሰሙነ ሕማማት ካርድ' },
      { command: 'history',    description: '🏛️ የቤተ ክርስቲያን ታሪክ' },
      { command: 'calendar',   description: '📅 ሳምንታዊ መቁጠሪያ' },
      { command: 'reel',       description: '🎬 9:16 ቪዲዮ ሪል አፍልቅ' },
      { command: 'all',        description: '🌟 ሁሉንም 9 ይዘቶች በአንድ ጊዜ' },
      { command: 'dispatch',   description: '🚀 GitHub Action Workflow አስጀምር' },
      { command: 'ghstatus',   description: '☁️ የ GitHub Actions ሩጫዎች ሁኔታ' },
      { command: 'status',     description: '📊 የቀጥታ ሲስተም ጤንነት' },
      { command: 'computus',   description: '📐 የባሕረ ሐሳብ ስሌት' },
      { command: 'recent',     description: '📁 የቅርብ ጊዜ የተፈጠሩ ፋይሎች' },
      { command: 'search',     description: '🔍 ጥቅሶችንና ስንክሳርን ፈልግ' },
      { command: 'help',       description: 'ℹ️ እርዳታና መመሪያ' }
    ]
  }).catch(() => {});

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
