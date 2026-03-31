import axios from 'axios';

const getEnv = (key) => process.env[key];

const OPENROUTER_API_KEY = () => getEnv('OPENROUTER_API_KEY');
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const SYSTEM_PROMPT = `You are a master poet specializing in Amharic (Ge'ez script) spiritual content for Ethiopian Orthodox youth.

Requirements:
- Generate ONE short, breathtakingly poetic Amharic sentence
- Theme: Divine Peace (ሰላም እግዚአብሔር)
- Audience: 15-year-old Ethiopian Orthodox Christian
- Style: Profound yet accessible, NOT cliché
- Return ONLY the Amharic text - NO explanation, NO translation, NO quotes
- The text must be in proper Amharic (Ge'ez script with fidel)
- Maximum 30 words`;

const CAROUSEL_SYSTEM_PROMPT = `You are an expert content creator for Ethiopian Orthodox Christian youth content.

Generate a 5-slide carousel about a spiritual topic. Each slide should have:
1. A short title (Amharic, 3-6 words)
2. A brief Amharic point (10-20 words)
3. A Bible reference in Amharic format (e.g., ማርቆስ ፲፮፻፲፮)

Topic theme: Faith, Prayer, Love, Hope, or Spiritual Growth

Return format (JSON array):
[
  {"title": "አምላክን ታምማህ", "content": "በእያንዳንዱ ጊዜ እግዚአብሔርን ጠይቅ...", "reference": "ማርቆስ ፲፮፻፲፮"},
  ...
]

Must be 5 slides. Return ONLY valid JSON - no explanations.`;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = RETRY_DELAY * Math.pow(2, i);
      console.log(`⏳ Retrying in ${delay}ms... (attempt ${i + 1}/${retries})`);
      await sleep(delay);
    }
  }
}

export async function generateQuote() {
  const apiKey = OPENROUTER_API_KEY();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  return retryWithBackoff(async () => {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL || 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Generate an Amharic quote about Divine Peace from God.' }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://eotc-media-studio.local',
          'X-Title': 'EOTC Media Studio'
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from AI API');
    }

    const amharicRegex = /[\u1200-\u137F]/;
    if (!amharicRegex.test(content)) {
      console.warn('⚠️ Response may not contain Amharic script:', content);
    }

    return content;
  });
}

export function isConfigured() {
  return !!OPENROUTER_API_KEY();
}

export async function generateCarousel(topic = 'Faith and Spiritual Growth') {
  const apiKey = OPENROUTER_API_KEY();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  return retryWithBackoff(async () => {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL || 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: CAROUSEL_SYSTEM_PROMPT },
          { role: 'user', content: `Generate a 5-slide carousel about: ${topic}. Make it inspiring for Ethiopian Orthodox youth.` }
        ],
        max_tokens: 800,
        temperature: 0.8,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://eotc-media-studio.local',
          'X-Title': 'EOTC Media Studio'
        },
        timeout: 45000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from AI API');
    }

    let slides;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      } else {
        slides = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse carousel JSON:', parseError.message);
      throw new Error('Invalid carousel format from AI');
    }

    if (!Array.isArray(slides) || slides.length !== 5) {
      throw new Error(`Expected 5 slides, got ${slides.length || 0}`);
    }

    return slides;
  });
}