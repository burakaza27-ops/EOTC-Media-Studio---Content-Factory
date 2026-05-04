<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ethiopian_Orthodox_Tewahedo_Cross.svg/512px-Ethiopian_Orthodox_Tewahedo_Cross.svg.png" width="100" />
  <h1>EOTC Media Studio — Content Factory</h1>
  <p><b>World-Class Automated Content & Cinematic Video Generation Pipeline</b></p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/burakaza27-ops/EOTC-Media-Studio---Content-Factory/generate-media.yml?style=flat-square&logo=github&label=Pipeline" />
    <img src="https://img.shields.io/badge/Puppeteer-Headless-blue?style=flat-square&logo=puppeteer" />
    <img src="https://img.shields.io/badge/FFmpeg-Video%20Engine-orange?style=flat-square&logo=ffmpeg" />
    <img src="https://img.shields.io/badge/Google%20TTS-Amharic%20Voice-red?style=flat-square&logo=google" />
    <img src="https://img.shields.io/badge/OpenRouter-AI%20Engine-purple?style=flat-square&logo=openai" />
    <img src="https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase" />
  </p>
</div>

<br/>

EOTC Media Studio is an entirely automated, enterprise-grade media pipeline designed to spread the beautiful teachings of the Ethiopian Orthodox Tewahedo Church (EOTC) to modern youth via high-quality, auto-generated visual content **and cinematic TikTok-ready videos** — all delivered to Telegram automatically.

## 🚀 How To Run (GitHub Actions)

> **No local setup required.** Everything runs in the cloud for free.

1. Go to the **[Actions](../../actions)** tab at the top of this repository.
2. Click **"✝️ EOTC Media Studio — Generate Content"** in the left sidebar.
3. Click the **"Run workflow"** dropdown button (grey bar on the right).
4. Select your content type (`quote`, `verse`, `carousel`, or `reflection`).
5. Click the green **"Run workflow"** button.
6. Wait for the ✅ green checkmark (usually 2-5 minutes).
7. Click into the completed run → scroll to **Artifacts** at the bottom.
8. Download your **Image** (PNG) and **TikTok Video** (MP4)!

## 🎬 Dual Output Engine

Every run now produces **two** outputs simultaneously:

| Output | Format | Purpose |
|---|---|---|
| **📸 Spiritual Image** | PNG (1080×1080 / 1080×1920) | Telegram channel post, Instagram story |
| **🎬 Cinematic Video** | MP4 (1080×1920, 30fps) | TikTok, Instagram Reels, YouTube Shorts |

### Video Features
- **Ken Burns Effect:** Buttery-smooth cinematic slow-zoom on your spiritual content
- **Vignette:** Professional darkened edges that draw focus to the text
- **Amharic Voiceover:** Google Neural TTS reads your content in natural Amharic
- **TikTok-Optimized:** H.264 codec, `faststart` for instant streaming, 9:16 vertical
- **Cost:** $0.00 — No API keys, no subscriptions, completely free forever

## ✨ Content Types

| # | Type | Dimensions | Description |
|---|---|---|---|
| 1 | **Daily Verse** | 1080×1080 | Clean, stunning scripture highlights |
| 2 | **Power Quote** | 1080×1080 | Deep, poetic spiritual sayings |
| 3 | **Deep Dive Carousel** | 1080×1350 × 5 | Multi-slide interactive teachings |
| 4 | **Weekly Reflection** | 1080×1920 | Long-form story-sized reflections |

## ⏰ Schedule (EAT / UTC+3)

| Content Type | Time | Description |
|---|---|---|
| **Daily Verse** | 5:00 AM | Early morning scripture |
| **Power Quote** | 12:00 PM | Midday inspiration |
| **Deep Dive** | 6:00 PM | Evening theological carousel |
| **Reflection** | Sun 8:00 AM | Long-form Sunday reflection |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions (Cloud)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 🧠 AI Engine (OpenRouter / Gemini)                  │
│     └→ Generates Amharic spiritual content              │
│                                                         │
│  2. 🔍 Supabase Duplicate Check                        │
│     └→ Ensures content is always fresh                  │
│                                                         │
│  3. 🎨 Puppeteer Render Engine                          │
│     └→ HTML/CSS → High-res PNG with Ge'ez fonts        │
│                                                         │
│  4. 📤 Telegram Image Broadcast                         │
│     └→ Sends image to your channel                      │
│                                                         │
│  5. 🎙️ Google TTS (Amharic Voice)                      │
│     └→ Text → Natural Amharic voiceover (.mp3)          │
│                                                         │
│  6. 🎬 FFmpeg Cinematic Renderer                        │
│     └→ Image + Voice → Ken Burns MP4 video              │
│                                                         │
│  7. 📤 Telegram Video Broadcast                         │
│     └→ Sends TikTok-ready video to your channel         │
│                                                         │
│  8. 📦 Artifact Upload                                  │
│     └→ Download PNG + MP4 from GitHub Actions page       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI** | OpenRouter (Gemini / Claude) | Amharic content generation |
| **Render** | Puppeteer (Headless Chrome) | HTML/CSS → PNG screenshots |
| **Voice** | Google Translate TTS | Free Amharic neural voiceover |
| **Video** | FFmpeg (fluent-ffmpeg) | Cinematic Ken Burns MP4 |
| **Database** | Supabase PostgreSQL | Duplicate prevention |
| **Delivery** | Telegram Bot API | Image + video broadcasting |
| **Orchestration** | GitHub Actions | Free cloud compute (2000 min/mo) |

## ⚙️ GitHub Secrets Required

Go to **Settings → Secrets → Actions** and add:

| Secret | Description |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | Target channel/group ID |

> **Note:** No Azure or Google Cloud keys needed! The Amharic TTS and video engine are completely free and keyless.

## 🖥️ Local Development

```bash
# Install dependencies
npm install

# Run manually (requires .env file)
# Options: quote | verse | carousel | reflection
npm start                    # Default: quote
node src/index.js verse --liturgical
node src/index.js reflection --liturgical
```

---
*Created for the elegant dissemination of Holy Scripture. ✝️*
