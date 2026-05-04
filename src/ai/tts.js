/**
 * ═══════════════════════════════════════════════════════
 *  EOTC Media Studio — Amharic Text-to-Speech Engine
 *  Keyless, free-tier Google Translate TTS integration
 *  Supports automatic text chunking for long passages
 * ═══════════════════════════════════════════════════════
 */

import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Sanitize text for TTS processing
 * Strips HTML tags, excess whitespace, and special characters
 * that could break the Google TTS endpoint
 */
function sanitizeForTTS(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/<[^>]*>/g, '')          // Strip HTML tags
        .replace(/&[a-z]+;/gi, ' ')       // Strip HTML entities
        .replace(/[#*_~`]/g, '')          // Strip markdown characters
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .trim();
}

/**
 * Generates Amharic voiceover audio from text using Google Translate TTS
 * 
 * @param {string} text - The Amharic text to convert to speech
 * @param {object} options - Optional configuration
 * @param {boolean} options.slow - Speak slowly (default: false)
 * @returns {Promise<string|null>} Path to the generated .mp3 file, or null on failure
 */
export async function generateAmharicAudio(text, options = {}) {
    const cleanText = sanitizeForTTS(text);

    if (!cleanText || cleanText.length < 5) {
        console.log('⚠️ Text too short for voiceover. Skipping TTS.');
        return null;
    }

    console.log(`🎙️ Generating Amharic Voiceover (${cleanText.length} chars)...`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Google TTS has a per-request character limit (~200 chars)
            // getAllAudioBase64 automatically chunks long text
            const results = await googleTTS.getAllAudioBase64(cleanText, {
                lang: 'am',
                slow: options.slow || false,
                host: 'https://translate.google.com',
                timeout: 15000,
            });

            if (!results || results.length === 0) {
                throw new Error('No audio data returned from Google TTS');
            }

            const outputPath = path.join(__dirname, '../../temp', `voiceover_${Date.now()}.mp3`);

            // Ensure temp directory exists
            const tempDir = path.dirname(outputPath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Stitch the audio chunks together into a single MP3 buffer
            const audioBuffer = Buffer.concat(
                results.map(res => Buffer.from(res.base64, 'base64'))
            );

            if (audioBuffer.length < 100) {
                throw new Error('Generated audio buffer is suspiciously small');
            }

            fs.writeFileSync(outputPath, audioBuffer);
            console.log(`✅ Voiceover saved: ${outputPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
            return outputPath;

        } catch (error) {
            console.error(`❌ TTS Attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * attempt;
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    console.error('❌ All TTS attempts exhausted. Voiceover skipped.');
    return null;
}
