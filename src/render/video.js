import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Generates a cinematic 9:16 TikTok/Reels video
 * @param {string} imagePath - High-res Puppeteer screenshot
 * @param {string} voiceoverPath - Generated Azure TTS audio
 * @param {string} bgmPath - Path to ambient background track (optional)
 * @param {string} outputPath - Final MP4 destination
 */
export async function renderCinematicVideo(imagePath, voiceoverPath, bgmPath, outputPath) {
    console.log("🎬 Initiating Cinematic Video Render...");

    return new Promise((resolve, reject) => {
        let command = ffmpeg();

        command.input(imagePath).loop();
        if (voiceoverPath) command.input(voiceoverPath);
        if (bgmPath) command.input(bgmPath);

        // Slow cinematic zoom & vignette
        const filterGraph = [
            { filter: 'zoompan', options: 'z=\'min(zoom+0.0005,1.15)\':d=600:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':fps=60:s=1080x1920' },
            { filter: 'vignette', options: 'PI/4' }
        ];

        if (voiceoverPath && bgmPath) {
            command.complexFilter([
                ...filterGraph,
                '[1:a]volume=1.0[voice]',    
                '[2:a]volume=0.10[bgm]',     
                '[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]'
            ]);
            command.outputOptions(['-map 0:v', '-map [aout]']);
        } else if (voiceoverPath) {
            command.complexFilter(filterGraph);
            command.outputOptions(['-map 0:v', '-map 1:a']);
        }

        command.outputOptions([
            '-c:v libx264', '-preset medium', '-crf 20', '-pix_fmt yuv420p',
            '-c:a aac', '-b:a 192k', '-shortest'
        ])
        .save(outputPath)
        .on('start', () => console.log('🚀 FFmpeg Running: Zooming and Mixing...'))
        .on('progress', progress => {
            if (progress.percent) process.stdout.write(`\r⏳ Rendering: ${Math.floor(progress.percent)}%`);
        })
        .on('end', () => {
            console.log(`\n✅ Cinematic Video Rendered: ${outputPath}`);
            resolve(outputPath);
        })
        .on('error', err => reject(err));
    });
}
