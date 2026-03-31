import axios from 'axios';
import { formatContextForPrompt } from '../utils/calendar.js';

const getEnv = (key) => process.env[key];

const OPENROUTER_API_KEY = () => getEnv('OPENROUTER_API_KEY');
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const QUOTE_SYSTEM_PROMPT = `You are a master poet and theologian specializing in Amharic (Ge'ez script) spiritual content for Ethiopian Orthodox Christians.

Requirements:
- Generate ONE short, breathtakingly poetic Amharic sentence (max 30 words)
- The style should be profound, soul-stirring, and beautifully composed in traditional Ethiopian Orthodox liturgical tone (but accessible to youth)
- DO NOT use clichés or generic Christian phrases; make it deeply resonant with EOTC theology
- Return ONLY the Amharic text - NO explanation, NO translations, NO quotation marks
- Must be strictly in Amharic (Ge'ez script)`;

const CAROUSEL_SYSTEM_PROMPT = `You are an expert theologian creating content for Ethiopian Orthodox Christian youth.

Generate a 5-slide carousel about the given spiritual topic. Each slide should have:
1. "title": A short, impactful title (Amharic, 2-5 words)
2. "content": A profound reflection or teaching (Amharic, 15-25 words)
3. "reference": A relevant Bible reference in Amharic notation (e.g., ማቴዎስ ፭፥፰)

Return format MUST be a valid JSON array of 5 objects:
[
  {"title": "...", "content": "...", "reference": "..."},
  ...
]
Return ONLY JSON, no markdown formatting or explanations.`;

const VERSE_SYSTEM_PROMPT = `You are an Ethiopian Orthodox biblical scholar. Your task is to provide a REAL Bible verse in Amharic based on a given theme.

Provide ONLY a JSON object with:
1. "verse": The exact Amharic text of the scripture (from the 1954 Amharic Bible or EOTC tradition)
2. "reference": The book, chapter, and verse in Amharic notation (e.g., መዝሙር ፳፫፥፩)

DO NOT hallucinate verses. If unsure, use a well-known verse from Psalms or Gospels.
Return ONLY JSON, no markdown. Format:
{"verse": "...", "reference": "..."}`;

const REFLECTION_SYSTEM_PROMPT = `You are a respected Ethiopian Orthodox priest writing a weekly spiritual reflection for youth.

Generate a deep, meaningful weekly reflection based on a theme. Provide ONLY a JSON object with:
1. "title": A profound title (Amharic, 2-6 words)
2. "scripture": A relevant Bible verse (Amharic)
3. "reference": The scripture reference (Amharic)
4. "reflection": A deep, multi-paragraph teaching (Amharic, 3-4 paragraphs, very profound and encouraging)
5. "prayer": A short concluding prayer starting with "አቤቱ አምላካችን..." (Amharic)

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

async function callAI(systemPrompt, userPrompt, jsonMode = false) {
  const apiKey = OPENROUTER_API_KEY();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  return retryWithBackoff(async () => {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL || 'google/gemini-2.0-flash-001',
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
    
    // Clean up potential markdown formatting wrapping the JSON
    if (jsonMode) {
      let cleanContent = content;
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.substring(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.substring(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3);
      }
      return cleanContent.trim();
    }
    return content;
  });
}

function extractJSON(text) {
  try {
    const match = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON Extraction failed on:', text);
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