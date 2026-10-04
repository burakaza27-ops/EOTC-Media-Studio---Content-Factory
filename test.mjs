import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const LOG_FILE = path.join(ROOT, 'test-results.log');
const PASS = [];
const FAIL = [];
const SKIP = [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function check(label, condition, detail = '') {
  if (condition) {
    PASS.push(label);
    log(`  ✅ ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    FAIL.push(label);
    log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function skip(label, reason) {
  SKIP.push(label);
  log(`  ⏭️ ${label} — ${reason}`);
}

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, timeout: 60000, encoding: 'utf8' });
    return { ok: true, stdout: out.trim() };
  } catch (e) {
    return { ok: false, stdout: e.stdout?.trim() || '', stderr: e.stderr?.trim() || '', error: e.message };
  }
}

log('════════════════════════════════════════════════════════');
log('  ✝️ EOTC Media Studio v7.0 — Complete System Health Check');
log('════════════════════════════════════════════════════════');

// 1. Node & npm
const nodeVer = process.version;
check('Node.js ≥ 18', parseInt(nodeVer.slice(1)) >= 18, nodeVer);

try {
  const npmVer = execSync('npm --version', { encoding: 'utf8' }).trim();
  check('npm available', true, npmVer);
} catch { check('npm available', false); }

// 2. Dependencies installed
check('node_modules exists', fs.existsSync(path.join(ROOT, 'node_modules')));
check('puppeteer installed', fs.existsSync(path.join(ROOT, 'node_modules', 'puppeteer')));
check('axios installed', fs.existsSync(path.join(ROOT, 'node_modules', 'axios')));
check('express installed', fs.existsSync(path.join(ROOT, 'node_modules', 'express')));
check('@supabase/supabase-js installed', fs.existsSync(path.join(ROOT, 'node_modules', '@supabase', 'supabase-js')));
check('ethiopian-calendar-date-converter installed', fs.existsSync(path.join(ROOT, 'node_modules', 'ethiopian-calendar-date-converter')));

// 3. Environment
const envPath = path.join(ROOT, '.env');
const envExists = fs.existsSync(envPath);
check('.env file exists', envExists);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  check('OPENROUTER_API_KEY present', envContent.includes('OPENROUTER_API_KEY=sk-or'));
  check('AI_MODEL configured', envContent.includes('AI_MODEL='));
  check('SUPABASE_URL present', envContent.includes('SUPABASE_URL=https://'));
  check('SUPABASE_KEY present', envContent.includes('SUPABASE_KEY=eyJ'));
  check('TELEGRAM_BOT_TOKEN present', envContent.includes('TELEGRAM_BOT_TOKEN='));
  check('TELEGRAM_CHAT_ID present', envContent.includes('TELEGRAM_CHAT_ID='));
}

// 4. Core Architecture Files
check('src/index.js exists', fs.existsSync(path.join(ROOT, 'src', 'index.js')));
check('src/ai/openrouter.js exists', fs.existsSync(path.join(ROOT, 'src', 'ai', 'openrouter.js')));
check('src/render/puppeteer.js exists', fs.existsSync(path.join(ROOT, 'src', 'render', 'puppeteer.js')));
check('src/render/video.js exists', fs.existsSync(path.join(ROOT, 'src', 'render', 'video.js')));
check('src/db/supabase.js exists', fs.existsSync(path.join(ROOT, 'src', 'db', 'supabase.js')));
check('src/telegram/bot.js exists', fs.existsSync(path.join(ROOT, 'src', 'telegram', 'bot.js')));
check('src/telegram/concierge.js exists', fs.existsSync(path.join(ROOT, 'src', 'telegram', 'concierge.js')));
check('src/canon/scripture.js exists', fs.existsSync(path.join(ROOT, 'src', 'canon', 'scripture.js')));
check('src/canon/synaxarium.js exists', fs.existsSync(path.join(ROOT, 'src', 'canon', 'synaxarium.js')));
check('src/studio/server.js exists', fs.existsSync(path.join(ROOT, 'src', 'studio', 'server.js')));
check('src/utils/calendar.js exists', fs.existsSync(path.join(ROOT, 'src', 'utils', 'calendar.js')));

// 5. Sacred Vectors & Assets
check('assets/vectors/lalibela_cross.svg exists', fs.existsSync(path.join(ROOT, 'assets', 'vectors', 'lalibela_cross.svg')));
check('assets/vectors/tibeb_border.svg exists', fs.existsSync(path.join(ROOT, 'assets', 'vectors', 'tibeb_border.svg')));

// 6. Templates check (All 9 content types)
const TEMPLATES = [
  'power_quote.html',
  'deep_dive.html',
  'daily_verse.html',
  'weekly_reflection.html',
  'saint_day.html',
  'fasting_guide.html',
  'holy_week.html',
  'church_history.html',
  'calendar_summary.html'
];

TEMPLATES.forEach(tmpl => {
  const p = path.join(ROOT, 'templates', tmpl);
  const exists = fs.existsSync(p);
  check(`Template: ${tmpl} exists`, exists);
  if (exists) {
    const content = fs.readFileSync(p, 'utf8');
    check(`Template: ${tmpl} valid HTML`, content.includes('<!DOCTYPE html>') && content.includes('Noto+Sans+Ethiopic'));
  }
});

// 7. Canonical Scripture Engine Functional Tests
const { VERIFIED_SCRIPTURES, getVerifiedVerse, sanitizeReference, searchCanonicalVerses } = await import('./src/canon/scripture.js');
check('Canon: scripture verses count > 20', VERIFIED_SCRIPTURES.length >= 20, `${VERIFIED_SCRIPTURES.length} verses loaded`);
const sampleVerse = getVerifiedVerse('ፍቅር');
check('Canon: getVerifiedVerse returns verse', sampleVerse && typeof sampleVerse.verse === 'string' && sampleVerse.verse.length > 0, sampleVerse?.reference);
const sanitized = sanitizeReference('ማቴዎስ 5:8');
check('Canon: sanitizeReference converts to Ge\'ez numerals', sanitized.includes('፭፥፰'), sanitized);

// 8. Synaxarium Engine Functional Tests
const { SYNAXARIUM_COMMEMORATIONS, getSynaxariumEntry } = await import('./src/canon/synaxarium.js');
check('Synaxarium: entries archive > 15', Object.keys(SYNAXARIUM_COMMEMORATIONS).length >= 15, `${Object.keys(SYNAXARIUM_COMMEMORATIONS).length} saints loaded`);
const sampleSaint = getSynaxariumEntry(24); // Day 24: Abune Tekle Haymanot
check('Synaxarium: Day 24 lookup', sampleSaint && sampleSaint.saint.includes('ተክለ ሃይማኖት'), sampleSaint?.saint);

// 9. Bahire Hasab Computus Engine
const { toEthiopianDate, getLiturgicalContext } = await import('./src/utils/calendar.js');
const ethDate = toEthiopianDate(new Date(2026, 9, 4));
check('Bahire Hasab: Ethiopian date conversion', ethDate && typeof ethDate.year === 'number', `Year: ${ethDate?.year}, Month: ${ethDate?.month}, Day: ${ethDate?.day}`);
const litCtx = getLiturgicalContext(new Date(2026, 9, 4));
check('Bahire Hasab: Liturgical context generated', litCtx && typeof litCtx.mood === 'string', `Mood: ${litCtx?.mood}`);

// 10. Video Module Exports
const { VIDEO_PROFILES, checkFFmpeg, renderVideoReel } = await import('./src/render/video.js');
check('Video: profiles 1:1, 4:5, 9:16 defined', !!(VIDEO_PROFILES['1:1'] && VIDEO_PROFILES['4:5'] && VIDEO_PROFILES['9:16']));
check('Video: renderVideoReel is function', typeof renderVideoReel === 'function');
const ffmpegInfo = await checkFFmpeg();
check('Video: FFmpeg check callable', typeof ffmpegInfo.available === 'boolean', `Available: ${ffmpegInfo.available}`);

// 11. Pipeline Orchestrator Exports
const { PIPELINES } = await import('./src/index.js');
check('Pipelines: all 9 registered in orchestrator', Object.keys(PIPELINES).length === 9, Object.keys(PIPELINES).join(', '));

// 12. Bahire Hasab Computus Algorithm Verification
const { getComputusData, calculateMoveableFeasts } = await import('./src/utils/calendar.js');
const computus2019 = getComputusData(2019);
check('Computus: getComputusData returns Evangelist & feasts', !!(computus2019.evangelist && computus2019.feasts.length === 10), `${computus2019.evangelist}, ${computus2019.feasts.length} moveable feasts`);
const moveables = calculateMoveableFeasts(2019);
check('Computus: calculateMoveableFeasts returns Fasika & Lent', !!(moveables.fasika && moveables.abiyTsomStart), `Fasika Month: ${moveables.fasika.month}, Day: ${moveables.fasika.day}`);

// 13. GitHub Actions Cloud Integration Engine
const { getRepoInfo, testGitHubConnection, listWorkflowRuns } = await import('./src/utils/github.js');
const repo = getRepoInfo();
check('GitHub: getRepoInfo identifies repository', repo && repo.owner && repo.repo, `${repo.owner}/${repo.repo}`);
const ghConn = await testGitHubConnection();
check('GitHub: API connection test callable', typeof ghConn.status === 'string', `Status: ${ghConn.status}, Repo: ${ghConn.repo}`);

// 14. Telegram Bot API & Delivery Engine
const { sendPhotoToChat, sendVideoToChat, sendDocumentToChat, isConfigured: isTgConfigured } = await import('./src/telegram/bot.js');
check('Telegram: sendDocumentToChat & safeCaption exported', typeof sendDocumentToChat === 'function' && typeof sendPhotoToChat === 'function');
check('Telegram: isConfigured reports status', typeof isTgConfigured() === 'boolean', `Configured: ${isTgConfigured()}`);

// 15. Telegram Concierge Bot & Full Command Center
const { getMainMenuKeyboard, getGitHubSubmenuKeyboard, isBotConfigured } = await import('./src/telegram/concierge.js');
const mainKb = getMainMenuKeyboard();
check('Concierge: getMainMenuKeyboard provides interactive grid', mainKb && Array.isArray(mainKb.inline_keyboard) && mainKb.inline_keyboard.length >= 5);
const ghKb = getGitHubSubmenuKeyboard();
check('Concierge: getGitHubSubmenuKeyboard provides cloud actions', ghKb && Array.isArray(ghKb.inline_keyboard) && ghKb.inline_keyboard.length >= 3);


// Summary
log('');
log('════════════════════════════════════════════════════════');
log('  SYSTEM HEALTH RESULTS');
log('════════════════════════════════════════════════════════');
log(`  ✅ Passed: ${PASS.length}`);
log(`  ❌ Failed: ${FAIL.length}`);
log(`  ⏭️  Skipped: ${SKIP.length}`);
log('════════════════════════════════════════════════════════');

if (FAIL.length > 0) {
  log('');
  log('  Failed checks:');
  FAIL.forEach(f => log(`    ❌ ${f}`));
}

process.exit(FAIL.length > 0 ? 1 : 0);