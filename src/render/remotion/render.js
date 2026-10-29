/**
 * EOTC Media Studio — Remotion High-Definition Video Reel Renderer
 * ════════════════════════════════════════════════════════════════
 * Programmatic motion-graphics rendering engine for TikTok / Shorts / Reels / Telegram
 * 100% free, runs locally with Chrome & Remotion.
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Redirect TEMP/TMP to D drive project folder to avoid C drive full errors ──
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const LOCAL_TEMP = path.join(PROJECT_ROOT, 'temp', 'remotion');
fs.mkdirSync(LOCAL_TEMP, { recursive: true });
process.env.TEMP = LOCAL_TEMP;
process.env.TMP  = LOCAL_TEMP;

let cachedBundleLocation = null;

/**
 * Detects the local Chrome / Chromium executable on the machine.
 * Prefers PUPPETEER_EXEC_PATH from .env, then well-known Windows locations.
 */
function getChromeExecutable() {
  if (process.env.PUPPETEER_EXEC_PATH && fs.existsSync(process.env.PUPPETEER_EXEC_PATH)) {
    return process.env.PUPPETEER_EXEC_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
      : null,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ].filter(Boolean);

  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return undefined;
}

/**
 * Lazily bundles the Remotion root component and caches the bundle to the D-drive temp folder.
 */
export async function getRemotionBundle() {
  if (cachedBundleLocation && fs.existsSync(cachedBundleLocation)) {
    return cachedBundleLocation;
  }
  const entryPoint = path.join(__dirname, 'index.jsx');
  console.log(`📦 Bundling Remotion composition...`);
  // outDir directs the webpack bundle onto the D-drive project temp
  const outDir = path.join(LOCAL_TEMP, 'bundle');
  cachedBundleLocation = await bundle({
    entryPoint,
    outDir
  });
  console.log(`✅ Remotion bundle ready: ${cachedBundleLocation}`);
  return cachedBundleLocation;
}

export const REMOTION_PROFILES = {
  '9:16': {
    compositionId: 'EOTCReelVertical',
    label: 'Vertical Reel (YouTube Shorts / TikTok / Reels)',
    suffix: 'reels'
  },
  '1:1': {
    compositionId: 'EOTCReelSquare',
    label: 'Square Reel (Telegram / Facebook)',
    suffix: 'square'
  }
};

/**
 * Renders an animated EOTC Video Reel using Remotion.
 *
 * @param {Object} opts
 * @param {string} opts.outputDir  - Directory to write MP4 files
 * @param {string} opts.baseName   - Base filename without extension
 * @param {string} opts.quote      - Amharic spiritual quote or verse text
 * @param {string} opts.reference  - Scripture or patristic reference (Ge'ez numerals)
 * @param {string} opts.theme      - Theme badge title (e.g., 'የዕለቱ ኃይለ ቃል')
 * @param {string} opts.date       - Liturgical Ethiopian date string
 * @param {string[]} opts.profiles - ['9:16', '1:1']
 * @returns {Promise<Object>} Map of profile -> output video path
 */
export async function renderRemotionReel(opts = {}) {
  const {
    outputDir,
    baseName = 'eotc_reel',
    quote = 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
    reference = 'መዝሙረ ዳዊት ፳፯፥፩',
    theme = 'የዕለቱ ኃይለ ቃል',
    date = 'ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
    profiles = ['9:16']
  } = opts;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const bundleLocation = await getRemotionBundle();
  const results = {};

  const inputProps = {
    title: opts.title || theme,
    quote,
    reference,
    theme,
    date
  };

  const chromePath = getChromeExecutable();
  if (chromePath) {
    console.log(`🚀 Using local Chrome engine: ${chromePath}`);
  } else {
    console.log(`🌐 No explicit Chrome path found; Remotion will auto-detect browser`);
  }

  const browserOpts = chromePath ? {
    browserExecutable: chromePath,
    chromiumOptions: { executablePath: chromePath }
  } : {};

  const onBrowserDownload = ({ percent }) => {
    console.log(`  🌐 Remotion browser fetch progress: ${Math.round((percent || 0) * 100)}%`);
  };

  for (const profileKey of profiles) {
    const config = REMOTION_PROFILES[profileKey];
    if (!config) {
      console.warn(`⚠️ Unknown Remotion profile "${profileKey}", skipping.`);
      continue;
    }

    const outPath = path.join(outputDir, `${baseName}_${config.suffix}.mp4`);
    console.log(`\n🎬 [Remotion] Rendering ${config.label} → ${path.basename(outPath)}`);

    try {
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: config.compositionId,
        inputProps,
        ...browserOpts,
        onBrowserDownload
      });

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outPath,
        inputProps,
        ...browserOpts,
        onBrowserDownload,
        onProgress: ({ progress }) => {
          const percent = Math.round(progress * 100);
          if (percent % 20 === 0) {
            process.stdout.write(`  ⏳ Remotion rendering: ${percent}%\r`);
          }
        }
      });

      const stats = fs.statSync(outPath);
      console.log(`\n  ✅ ${config.label}: ${(stats.size / 1024 / 1024).toFixed(1)}MB → ${outPath}`);
      results[profileKey] = outPath;
    } catch (err) {
      console.error(`\n  ❌ Remotion failed for ${profileKey}: ${err.message}`);
    }
  }

  return results;
}
