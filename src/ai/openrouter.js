import axios from 'axios';
import { formatContextForPrompt } from '../utils/calendar.js';

const getEnv = (key) => process.env[key];

const OPENROUTER_API_KEY = () => getEnv('OPENROUTER_API_KEY');
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const QUOTE_SYSTEM_PROMPT = `You are a master poet and theologian specializing in Amharic (Ge'ez script) spiritual content for Ethiopian Orthodox Christians.

Requirements:
- Generate ONE short, breathtakingly poetic Amharic sentence (max 30 words)
- The style must be profound and beautifully composed in professional Ethiopian Orthodox liturgical tone
- DO NOT use clichés or generic phrases; make it deeply resonant with EOTC theology
- Return ONLY the Amharic text - NO explanation, NO translations, NO quotation marks
- Must be strictly in Amharic (Ge'ez script)`;

const CAROUSEL_SYSTEM_PROMPT = `You are an expert theologian creating content for Ethiopian Orthodox Christian youth.

Generate a 5-slide carousel about the given spiritual topic. Each slide must have:
1. "title": A short, impactful title (Amharic, 2-5 words)
2. "content": A profound reflection or teaching (Amharic, 15-25 words)
3. "reference": A relevant Bible reference using STRICT Ge'ez numerals (e.g., ማቴዎስ ፭፥፰)

CRITICAL: Bible references must use Ge'ez numerals (፩, ፪, ፫, ፬, ፭, ፮, ፯, ፮, ፱, ፲...).
Return format MUST be a valid JSON array of 5 objects:
[
  {"title": "...", "content": "...", "reference": "..."},
  ...
]
Return ONLY JSON, no markdown formatting or explanations.`;

const VERSE_SYSTEM_PROMPT = `You are an Ethiopian Orthodox biblical scholar. Your task is to provide a PERFECT Bible verse in Amharic based on a given theme.

Instructions:
1. Provide the EXACT literal text from the Haile Selassie 1962 (EOTC) Amharic Bible.
2. DO NOT paraphrase, summarize, or use vague words. Every letter must be accurate.
3. Use ONLY Ge'ez numerals for CHAPTER and VERSE references (e.g., መዝሙር ፳፫፥፩).
4. DO NOT hallucinate. If you are unsure of the literal text, use a common verse you know perfectly (e.g. from Psalms, John, or Matthew).

Provide ONLY a JSON object with:
- "verse": The literal, error-free Amharic text.
- "reference": The book name and ref in Ge'ez numerals (e.g., ማቴዎስ ፭፥፰).

CRITICAL: You MUST include BOTH "verse" and "reference" keys. Failure to do so is unacceptable.
Return ONLY JSON, no markdown.`;

const REFLECTION_SYSTEM_PROMPT = `You are a respected Ethiopian Orthodox priest writing a weekly spiritual reflection.

Requirements:
1. "title": A profound title (Amharic, 2-6 words)
2. "scripture": The EXACT literal Bible verse text (1962 EOTC Version). NO paraphrasing.
3. "reference": The scripture reference using Ge'ez numerals (e.g., ዮሐንስ ፫፥፲፮).
4. "reflection": A deep, multi-paragraph teaching (Amharic, 3-4 paragraphs, profound and traditional).
5. "prayer": A short concluding prayer starting with "አቤቱ አምላካችን..." (Amharic)

CRITICAL: The scripture verse must be letter-perfect.
Return ONLY JSON, no markdown.`;

const THEMES = [
  'እምነት (Faith)',
  'ተስፋ (Hope)',
  'ፍቅር (Love)',
  'ንስሐ (Repentance)',
  'ሰላም (Peace)',
  'ትዕግስት (Patience)',
  'ትሕትና (Humility)',
  'ምስጋና (Thanksgiving)',
  'ጾም እና ጸሎት (Fasting and Prayer)',
  'የእግዚአብሔር ቃል (Word of God)'
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomTheme() {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
}

async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = RETRY_DELAY * Math.pow(2, i);
      console.log(`⏳ Retrying AI call in ${delay}ms... (attempt ${i + 1}/${retries})`);
      await sleep(delay);
    }
  }
}

const PRIMARY_MODEL = 'anthropic/claude-sonnet-4.6';
const FALLBACK_MODELS = ['google/gemini-2.5-flash'];

async function callOpenRouter(apiKey, model, systemPrompt, userPrompt, jsonMode) {
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: jsonMode ? 1500 : 300,
      temperature: 0.7,
      top_p: 0.9,
      response_format: jsonMode ? { type: "json_object" } : undefined
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://eotc-media-studio.local',
        'X-Title': 'EOTC Media Studio'
      },
      timeout: 60000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from AI API');
  
  return content;
}

async function callAI(systemPrompt, userPrompt, jsonMode = false) {
  const apiKey = OPENROUTER_API_KEY();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const modelId = process.env.AI_MODEL || PRIMARY_MODEL;
  const modelsToTry = [modelId, ...FALLBACK_MODELS.filter(m => m !== modelId)];

  return retryWithBackoff(async () => {
    let lastError = null;
    for (const model of modelsToTry) {
      try {
        console.log(`🧪 Trying model: ${model}`);
        const content = await callOpenRouter(apiKey, model, systemPrompt, userPrompt, jsonMode);
        
        // If it's JSON mode, verify it's valid JSON before returning
        if (jsonMode) {
          try {
            extractJSON(content); // Just to verify it's parseable
            return content;
          } catch (e) {
            console.warn(`⚠️ Model ${model} returned invalid JSON, trying next...`);
            lastError = new Error(`Invalid JSON from ${model}`);
            continue;
          }
        }
        return content;
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message;
        console.error(`❌ Model ${model} failed (${status || 'Err'}): ${msg}`);
        continue;
      }
    }
    throw lastError || new Error('All models failed');
  });
}

function extractJSON(text) {
  try {
    // 1. Try to find JSON block in markdown
    let cleanText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1];
    }

    // 2. Try to find the first { or [ and last } or ]
    const startIdx = cleanText.indexOf('{');
    const endIdx = cleanText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleanText = cleanText.substring(startIdx, endIdx + 1);
    }

    return JSON.parse(cleanText.trim());
  } catch (e) {
    console.error('JSON Extraction failed. Text received:', text);
    throw new Error('Invalid JSON format from AI');
  }
}

export async function generateQuote(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Theme selected: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  const content = await callAI(QUOTE_SYSTEM_PROMPT, `Theme: ${theme}${contextPrompt}`);
  return { text: content, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
}

export async function generateDailyVerse(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Verse Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  const content = await callAI(VERSE_SYSTEM_PROMPT, `Provide an uplifting verse about: ${theme}${contextPrompt}`, true);
  const data = extractJSON(content);
  if (!data.verse || !data.reference) throw new Error('Missing verse or reference fields');
  return { ...data, liturgicalEvent: liturgicalContext?.event || null };
}

export async function generateCarousel(topic = null, liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : (topic || getRandomTheme());
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Carousel Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  const content = await callAI(CAROUSEL_SYSTEM_PROMPT, `Generate 5 slides about: ${theme}${contextPrompt}`, true);
  const slides = extractJSON(content);
  
  if (!Array.isArray(slides) || slides.length !== 5) {
    throw new Error(`Expected 5 slides in array, got ${slides.length || 0}`);
  }
  return { slides, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
}

export async function generateWeeklyReflection(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Reflection Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  const content = await callAI(REFLECTION_SYSTEM_PROMPT, `Write a deep reflection on: ${theme}${contextPrompt}`, true);
  const data = extractJSON(content);
  
  if (!data.title || !data.reflection || !data.prayer) {
    throw new Error('Missing required reflection fields');
  }
  return { ...data, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
}

export function isConfigured() {
  return !!OPENROUTER_API_KEY();
}