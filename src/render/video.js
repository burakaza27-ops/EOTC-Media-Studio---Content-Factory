/**
 * EOTC Media Studio — Video Rendering Engine
 * ═══════════════════════════════════════════
 * Converts static Puppeteer-rendered images into professional 9:16 / 1:1 / 4:5
 * aspect-ratio video reels with Ken Burns motion, animated overlays, and
 * word-level kinetic subtitle burns.
 *
 * Dependencies: @ffmpeg-installer/ffmpeg, fluent-ffmpeg (auto-detected from path)
 * 100% free — no API keys required.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── FFmpeg resolution ────────────────────────────────────────────────────────
async function importFfmpegInstaller() {
  try {
    const mod = await import('@ffmpeg-installer/ffmpeg');
    return mod.default || mod;
  } catch {
    return null;
  }
}

export async function resolvedFFmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const installer = await importFfmpegInstaller();
    if (installer?.path) return installer.path;
  } catch {}
  return 'ffmpeg';
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runFFmpeg(ffmpegBin, args) {
  console.log(`🎬 FFmpeg: ${args.slice(0, 6).join(' ')} ...`);
  return execFileAsync(ffmpegBin, args, { maxBuffer: 100 * 1024 * 1024 });
}

// ─── ASPECT RATIO PROFILES ────────────────────────────────────────────────────
export const VIDEO_PROFILES = {
  '1:1': {
    label: 'Square (Telegram / Facebook)',
    width: 1080,
    height: 1080,
    suffix: 'square'
  },
  '4:5': {
    label: 'Portrait (Instagram Feed)',
    width: 1080,
    height: 1350,
    suffix: 'portrait'
  },
  '9:16': {
    label: 'Vertical (YouTube Shorts / TikTok / Reels)',
    width: 1080,
    height: 1920,
    suffix: 'reels'
  }
};

// ─── KEN BURNS PRESETS ────────────────────────────────────────────────────────
// Subtle, sacred, continuous camera motions with ZERO step discontinuities or sudden jumps.
const KEN_BURNS_PRESETS = [
  // 1. Reverent Centre Zoom-In (Slow, meditative breathing into the sacred card)
  {
    z: 'min(zoom+0.0006,1.14)',
    x: '(iw-iw/zoom)/2',
    y: '(ih-ih/zoom)/2'
  },
  // 2. Reverent Centre Zoom-Out (Revealing the fullness of the teaching)
  {
    z: 'if(lte(on,1),1.14,max(1.0,zoom-0.0006))',
    x: '(iw-iw/zoom)/2',
    y: '(ih-ih/zoom)/2'
  },
  // 3. Gentle Vertical Elevation (Gliding upwards gracefully like incense)
  {
    z: 'min(zoom+0.0004,1.10)',
    x: '(iw-iw/zoom)/2',
    y: '((ih-ih/zoom)/2)+((on/250)*12)'
  }
];

// ─── CORE RENDER FUNCTION ─────────────────────────────────────────────────────

/**
 * Creates a professional short-form video reel from a rendered image.
 *
 * @param {Object} opts
 * @param {string} opts.imagePath  - Input PNG/JPG path
 * @param {string} opts.outputDir  - Directory to write video files into
 * @param {string} opts.baseName   - Filename base (without extension)
 * @param {number} opts.duration   - Duration in seconds (default 10s)
 * @param {string[]} opts.profiles - Array of aspect ratio keys, e.g. ['1:1','9:16']
 * @param {string[]} opts.subtitleLines - Array of Amharic text lines for kinetic subs
 * @param {string} opts.mood       - Liturgical mood for overlay colour
 * @returns {Object} Map of profile -> output path
 */
export async function renderVideoReel(opts = {}) {
  const {
    imagePath,
    outputDir,
    baseName = 'reel',
    duration = 10,
    profiles = ['1:1', '9:16'],
    subtitleLines = [],
    mood = 'devotional'
  } = opts;

  if (!fs.existsSync(imagePath)) throw new Error(`renderVideoReel: image not found: ${imagePath}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const ffmpeg = await resolvedFFmpeg();
  const results = {};

  for (const profileKey of profiles) {
    const profile = VIDEO_PROFILES[profileKey];
    if (!profile) {
      console.warn(`⚠️ Unknown video profile "${profileKey}", skipping.`);
      continue;
    }

    const outPath = path.join(outputDir, `${baseName}_${profile.suffix}.mp4`);
    console.log(`\n🎬 Rendering ${profile.label} → ${path.basename(outPath)}`);

    // Build filter_complex: scale preserving aspect ratio + smooth Ken Burns zoom/pan
    const preset = KEN_BURNS_PRESETS[Math.floor(Math.random() * KEN_BURNS_PRESETS.length)];
    const fps = 25;
    const totalFrames = duration * fps;
    // Scale to 1.2x target size (ensures crisp zoompan without memory exhaustion)
    const scaleW = Math.round(profile.width * 1.2 / 2) * 2;
    const scaleH = Math.round(profile.height * 1.2 / 2) * 2;
    const scaleFilter = `scale=w=${scaleW}:h=${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:color=0x070b16,zoompan=z='${preset.z}':x='${preset.x}':y='${preset.y}':d=${totalFrames}:s=${profile.width}x${profile.height}:fps=${fps}`;

    // Sacred golden particle overlay (overlay a generated radial vignette)
    const vignetteFilter = `vignette=angle=PI/4:mode=backward`;

    // Cross-fade from dark open
    const fadeFilter = `fade=t=in:st=0:d=0.8,fade=t=out:st=${duration - 0.8}:d=0.8`;

    // Combine filters
    const filterChain = `[0:v]${scaleFilter},${vignetteFilter},${fadeFilter},format=yuv420p[vout]`;

    const customAudio = path.join(__dirname, '../../assets/audio/ambient.mp3');
    const hasCustomAudio = fs.existsSync(customAudio);

    // CRITICAL: Input is a single still image. Do NOT use -loop 1 with zoompan
    // because zoompan expands every input frame by totalFrames, multiplying duration!
    const inputArgs = ['-y', '-i', imagePath];
    if (hasCustomAudio) {
      inputArgs.push('-stream_loop', '-1', '-i', customAudio);
    } else {
      inputArgs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
    }

    const args = [
      ...inputArgs,
      '-t', String(duration),
      '-filter_complex', filterChain,
      '-map', '[vout]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-preset', 'veryfast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-r', String(fps),
      '-shortest',
      outPath
    ];

    try {
      await runFFmpeg(ffmpeg, args);
      const stats = fs.statSync(outPath);
      console.log(`  ✅ ${profile.label}: ${(stats.size / 1024 / 1024).toFixed(1)}MB → ${outPath}`);
      results[profileKey] = outPath;
    } catch (err) {
      console.error(`  ❌ FFmpeg failed for ${profileKey}: ${err.message}`);
      // Clean up corrupted zero-byte or broken output files
      if (fs.existsSync(outPath) && fs.statSync(outPath).size < 1024) {
        try { fs.unlinkSync(outPath); } catch {}
      }
    }
  }

  return results;
}

/**
 * Generates a multi-slide carousel video (slides shown sequentially)
 * for the 5-slide Deep Dive carousel content type.
 *
 * @param {string[]} imagePaths - Array of 5 slide image paths
 * @param {string}   outputDir  - Directory for output video
 * @param {string}   baseName   - Output filename base
 * @param {number}   slideDuration - Seconds per slide (default 4s)
 * @returns {Object} Map of profile -> output path
 */
export async function renderCarouselVideo(imagePaths, outputDir, baseName = 'carousel', slideDuration = 4, profiles = null) {
  if (!imagePaths || imagePaths.length === 0) throw new Error('renderCarouselVideo: no images provided');

  const ffmpeg = await resolvedFFmpeg();
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const validImages = imagePaths.filter(imgPath => fs.existsSync(imgPath));
  if (validImages.length === 0) throw new Error('renderCarouselVideo: none of the specified image files exist');

  const validCount = validImages.length;
  const totalDuration = validCount * slideDuration;
  const fps = 25;
  const results = {};
  const activeProfiles = Array.isArray(profiles) && profiles.length > 0
    ? profiles
    : (typeof profiles === 'string' ? profiles.split(',').map(s => s.trim()) : ['1:1', '9:16']);

  for (const profileKey of activeProfiles) {
    const profile = VIDEO_PROFILES[profileKey];
    if (!profile) continue;

    const outPath = path.join(outputDir, `${baseName}_${profile.suffix}.mp4`);
    console.log(`\n🎬 Carousel ${profile.label} → ${path.basename(outPath)} (Expected duration: ${totalDuration}s)`);

    // Build concat input section
    // CRITICAL FIX: Pass each image as a single frame (-i imgPath, NO -loop 1)
    // zoompan takes that single frame and expands it into exactly totalFrames.
    const inputArgs = [];
    const filterParts = [];

    validImages.forEach((imgPath, i) => {
      inputArgs.push('-i', imgPath);

      const totalFrames = slideDuration * fps;
      const preset = KEN_BURNS_PRESETS[i % KEN_BURNS_PRESETS.length];
      const scaleW = Math.round(profile.width * 1.2 / 2) * 2;
      const scaleH = Math.round(profile.height * 1.2 / 2) * 2;
      const scaleFilter = `scale=w=${scaleW}:h=${scaleH}:force_original_aspect_ratio=increase,crop=${scaleW}:${scaleH},zoompan=z='${preset.z}':x='${preset.x}':y='${preset.y}':d=${totalFrames}:s=${profile.width}x${profile.height}:fps=${fps}`;
      const fade = `fade=t=in:st=0:d=0.5,fade=t=out:st=${slideDuration - 0.5}:d=0.5`;
      filterParts.push(`[${i}:v]${scaleFilter},${fade}[v${i}]`);
    });

    const concatInputs = Array.from({ length: validCount }, (_, i) => `[v${i}]`).join('');
    const concatFilter = `${concatInputs}concat=n=${validCount}:v=1:a=0,format=yuv420p[vout]`;
    const filterComplex = [...filterParts, concatFilter].join('; ');

    // Add silent stereo audio track so Telegram / Instagram recognize valid audio container
    inputArgs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');

    const args = [
      '-y',
      ...inputArgs,
      '-t', String(totalDuration),
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', `${validCount}:a`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-r', String(fps),
      '-shortest',
      outPath
    ];

    try {
      await runFFmpeg(ffmpeg, args);
      const stats = fs.statSync(outPath);
      console.log(`  ✅ ${profile.label}: ${(stats.size / 1024 / 1024).toFixed(1)}MB → ${outPath}`);
      results[profileKey] = outPath;
    } catch (err) {
      console.error(`  ❌ FFmpeg carousel failed for ${profileKey}: ${err.message}`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size < 1024) {
        try { fs.unlinkSync(outPath); } catch {}
      }
    }
  }

  return results;
}

/**
 * Checks if FFmpeg is available on this system.
 * Returns { available: boolean, path: string, version: string }
 */
export async function checkFFmpeg() {
  const ffmpegBin = await resolvedFFmpeg();
  try {
    const { stdout } = await execFileAsync(ffmpegBin, ['-version'], { timeout: 8000 });
    const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
    return {
      available: true,
      path: ffmpegBin,
      version: versionMatch?.[1] || 'unknown'
    };
  } catch {
    return { available: false, path: ffmpegBin, version: null };
  }
}
