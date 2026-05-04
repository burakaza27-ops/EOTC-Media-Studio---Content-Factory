/**
 * ═══════════════════════════════════════════════════════
 *  EOTC Media Studio — Cinematic Video Renderer
 *  FFmpeg-based Ken Burns zoom with vignette & audio mix
 *  Optimized for TikTok (9:16), Reels, and YouTube Shorts
 * ═══════════════════════════════════════════════════════
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Generates a cinematic 9:16 vertical video with Ken Burns zoom effect
 *
 * @param {string} imagePath   - Path to the high-res Puppeteer screenshot (source frame)
 * @param {string|null} voiceoverPath - Path to generated TTS audio (.mp3/.wav), or null for silent video
 * @param {string|null} bgmPath       - Path to ambient background track (.mp3), or null
 * @param {string} outputPath  - Destination path for the final .mp4
 * @param {object} options     - Optional rendering overrides
 * @param {number} options.duration    - Fallback duration in seconds if no audio (default: 15)
 * @param {string} options.resolution  - Output resolution (default: '1080x1920')
 * @param {number} options.fps         - Frame rate (default: 30)
 * @param {number} options.bgmVolume   - BGM volume 0.0-1.0 (default: 0.10)
 * @returns {Promise<string>} Path to the rendered .mp4 file
 */
export async function renderCinematicVideo(imagePath, voiceoverPath, bgmPath, outputPath, options = {}) {
    const {
        duration = 15,
        resolution = '1080x1920',
        fps = 30,
        bgmVolume = 0.10
    } = options;

    // Validate inputs
    if (!imagePath || !fs.existsSync(imagePath)) {
        throw new Error(`Source image not found: ${imagePath}`);
    }
    if (voiceoverPath && !fs.existsSync(voiceoverPath)) {
        console.log('⚠️ Voiceover file not found, rendering silent video.');
        voiceoverPath = null;
    }
    if (bgmPath && !fs.existsSync(bgmPath)) {
        console.log('⚠️ BGM file not found, skipping background music.');
        bgmPath = null;
    }

    console.log('🎬 Initiating Cinematic Video Render...');
    console.log(`   📐 Resolution: ${resolution} @ ${fps}fps`);
    console.log(`   🎙️ Voiceover: ${voiceoverPath ? 'YES' : 'NO'}`);
    console.log(`   🎵 BGM: ${bgmPath ? 'YES' : 'NO'}`);

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        // --- INPUT STREAMS ---
        // Input 0: The image (looped to create video frames)
        command.input(imagePath).loop();

        // If we have a voiceover, it determines the video length via -shortest
        // If no voiceover, we use -t to set a fixed duration
        if (voiceoverPath) {
            command.input(voiceoverPath);  // Input 1: Voiceover audio
        }
        if (bgmPath) {
            command.input(bgmPath);        // Input 2 (or 1): Background music
        }

        // --- CINEMATIC FILTER GRAPH ---
        // Ken Burns: Slow zoom from 1.0x to 1.12x centered on the frame
        // The d parameter controls total frame count (fps * seconds)
        const totalFrames = fps * (voiceoverPath ? 120 : duration); // Allow up to 2 min for voiceover
        const zoomSpeed = 0.0003; // Very subtle, cinematic zoom
        const maxZoom = 1.12;

        const videoFilters = [
            `zoompan=z='min(zoom+${zoomSpeed},${maxZoom})':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps=${fps}:s=${resolution}`,
            'vignette=PI/5'  // Subtle darkened edges for premium look
        ];

        // --- AUDIO MIXING ---
        if (voiceoverPath && bgmPath) {
            // Complex filter: apply video effects + mix two audio tracks
            const voiceIdx = 1;
            const bgmIdx = 2;
            command.complexFilter([
                `[0:v]${videoFilters.join(',')}[vout]`,
                `[${voiceIdx}:a]volume=1.0[voice]`,
                `[${bgmIdx}:a]volume=${bgmVolume}[bgm]`,
                `[voice][bgm]amix=inputs=2:duration=first:dropout_transition=3[aout]`
            ], ['vout', 'aout']);
        } else if (voiceoverPath) {
            // Video effects + voiceover only
            command.complexFilter([
                `[0:v]${videoFilters.join(',')}[vout]`,
                `[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[aout]`
            ], ['vout', 'aout']);
        } else {
            // Silent video with fixed duration
            command.complexFilter([
                `[0:v]${videoFilters.join(',')}[vout]`
            ], ['vout']);
            command.outputOptions([`-t ${duration}`]);
        }

        // --- ENCODING (TikTok / Reels Optimized) ---
        command.outputOptions([
            '-c:v libx264',       // Universal H.264 codec
            '-preset medium',     // Balance: speed vs compression
            '-crf 20',            // High visual quality
            '-pix_fmt yuv420p',   // Required for mobile playback
            '-movflags +faststart', // Enable streaming playback
            ...(voiceoverPath ? ['-c:a aac', '-b:a 192k'] : ['-an']),
            ...(voiceoverPath ? ['-shortest'] : [])
        ])
        .save(outputPath)
        .on('start', (cmd) => {
            console.log('🚀 FFmpeg Running...');
        })
        .on('progress', progress => {
            if (progress.percent) {
                process.stdout.write(`\r   ⏳ Rendering: ${Math.floor(progress.percent)}%`);
            }
        })
        .on('end', () => {
            console.log(`\n✅ Cinematic Video Rendered: ${outputPath}`);
            // Report file size
            if (fs.existsSync(outputPath)) {
                const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
                console.log(`   📦 File size: ${sizeMB} MB`);
            }
            resolve(outputPath);
        })
        .on('error', (err, stdout, stderr) => {
            console.error('\n❌ FFmpeg Error:', err.message);
            if (stderr) console.error('   FFmpeg stderr:', stderr.substring(0, 500));
            reject(err);
        });
    });
}
