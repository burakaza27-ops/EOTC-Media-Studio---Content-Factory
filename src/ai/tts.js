import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAmharicAudio(text) {
    console.log("🎙️ Fetching Free Google Amharic Voiceover...");
    
    try {
        // This library automatically breaks long text into chunks that Google accepts
        const results = await googleTTS.getAllAudioBase64(text, {
            lang: 'am',    // Amharic language code
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });

        const outputPath = path.join(__dirname, '../../temp', `voiceover_${Date.now()}.mp3`);
        
        // Stitch the audio chunks together
        const audioBuffer = Buffer.concat(
            results.map(res => Buffer.from(res.base64, 'base64'))
        );
        
        fs.writeFileSync(outputPath, audioBuffer);
        console.log(`✅ Free Voiceover saved: ${outputPath}`);
        
        return outputPath;
    } catch (error) {
        console.error("❌ Google TTS Error: ", error.message);
        return null;
    }
}
