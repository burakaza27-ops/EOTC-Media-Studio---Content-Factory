<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ethiopian_Orthodox_Tewahedo_Cross.svg/512px-Ethiopian_Orthodox_Tewahedo_Cross.svg.png" width="100" />
  <h1>EOTC Media Studio — Content Factory</h1>
  <p><b>World-Class Automated Content Generation Pipeline</b></p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/burakaza27-ops/EOTC-Media-Studio---Content-Factory/generate-media.yml?style=flat-square&logo=github&label=Automated%20Pipeline" />
    <img src="https://img.shields.io/badge/Puppeteer-Headless-blue?style=flat-square&logo=puppeteer" />
    <img src="https://img.shields.io/badge/OpenRouter-AI%20Engine-purple?style=flat-square&logo=openai" />
    <img src="https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase" />
  </p>
</div>

<br/>

EOTC Media Studio is an entirely automated, highly professional media pipeline designed to spread the beautiful teachings of the Ethiopian Orthodox Tewahedo Church (EOTC) to modern youth via high-quality, auto-generated visual content delivered to Telegram.

## 🚀 Features

- **Four Premium Content Types:**
  1. **Daily Verse:** Clean, stunning scripture highlights.
  2. **Power Quote:** Deep, poetic spiritual sayings.
  3. **Deep Dive Carousel:** Multi-slide, interactive spiritual teachings.
  4. **Weekly Reflection:** Long-form, story-sized reflections.
- **Dynamic AI Generation:** Fully integrated with OpenRouter (Gemini / Claude) executing refined prompts with dynamic topic rotation (Faith, Hope, Repentance, etc.).
- **Studio-Grade Rendering:** HTML5 to Image conversion using a tuned headless Puppeteer instance passing through intricate mesh-gradients, gold-accents, and Ge'ez typography (Noto Sans Ethiopic).
- **Duplicate Prevention:** Supabase caching vector logic ensures content is always fresh.
- **GitHub Action Orchestration:** Operates autonomously as an intelligent cron sequence.

## ⏰ Schedule Routine (EAT/UTC+3)

| Content Type | Time | Description |
|---|---|---|
| **Daily Verse** | 5:00 AM | Early morning scripture to start the day. |
| **Power Quote** | 12:00 PM | Midday poetic inspiration for the youth. |
| **Deep Dive** | 6:00 PM | Evening multi-slide theological carousel. |
| **Reflection** | Sun 8:00 AM | Long-form story format reflection for Sundays. |

## 🛠️ Tech Stack Make-up

1. **AI Engine (`src/ai`)**: REST calls to OpenRouter forcing strict JSON Amharic outputs.
2. **Render Engine (`src/render`)**: Puppeteer loads pure HTML/CSS templates (`templates/*`), executes precise variable injection, waits for webfonts, and snapshots beautiful PNG media.
3. **Database (`src/db`)**: Supabase PostgreSQL for tracking generations to guarantee uniqueness.
4. **Delivery (`src/telegram`)**: Direct Telegram Bot interactions resolving multi-part form-data for large payload media and grouped slides.

## ⚙️ Configuration Parameters

The system relies on GitHub Secrets for its primary operations:

```env
OPENROUTER_API_KEY=sk-or-...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJhbGci...
TELEGRAM_BOT_TOKEN=123...
TELEGRAM_CHAT_ID=-100...
```

**Variables (Non-Secret):**
```env
AI_MODEL=google/gemini-2.0-flash-001
SUPABASE_TABLE=quotes
```

## 🖥️ Local Usage

For testing the graphics rendering on a local developer environment:
```bash
# Install packages
npm i

# Run manually (requires .env)
# Options: quote | verse | carousel | reflection
npm start quote
```

## 🏗️ Architecture

1. Triggered by GitHub Actions
2. Index decides Content Type (or fallback computed via Time of Day)
3. Node triggers `AI Engine`
4. Node checks `Supabase` to prevent dupes
5. Node passes data to `Render Engine (Puppeteer)`
6. Puppeteer takes HTML templates, evaluates runtime variables, snapshots PNGs.
7. Node ships to Telegram.

---
*Created for the elegant dissemination of Holy Scripture.*
