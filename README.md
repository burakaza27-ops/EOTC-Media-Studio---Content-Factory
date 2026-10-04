# ✝️ EOTC Media Studio v7.0

**The definitive, broadcast-grade multimedia content factory for the Ethiopian Orthodox Tewahedo Church.**

Operates as a **100% free ($0 / zero-cost)** automated media publishing empire:
- **9 Specialized Liturgical Pipelines** (Quotes, Verses, Carousels, Reflections, Saints, Fasting, Holy Week, Church History, Calendar)
- **Zero-Cost Video Reel Engine** (Vertical 9:16 Shorts/Reels & 1:1 Square MP4s with cinematic Ken Burns camera motion & vignette overlays via FFmpeg)
- **Canonical Scripture & Synaxarium Engine** (Zero-hallucination local 1962 81-book EOTC Bible repository + Patristic Synaxarium archive)
- **Sacred Ecclesiastical Visual Kit** (Vector Lalibela Crosses, woven Tibeb borders, 3× Retina rendering, mood-based dynamic styling)
- **Interactive 2-Way Telegram Concierge Bot** (Spiritual guide with `/today`, `/saint`, `/verse`, `/fasting`, `/calendar`, `/computus`, `/search`)
- **Live Local Web Studio GUI** (Visual dashboard at `http://localhost:3333` with live media preview, batch generation, and one-click download)
- **Dual-Model Theological Auditing** (AI synthesis proofread by patristic dogmatic guidelines before rendering)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run system health check (57 tests)
npm test

# 3. Generate a Power Quote
npm run quote

# 4. Generate all 9 pipelines in batch
npm run all

# 5. Launch the Web Studio GUI
npm run studio
# 🌐 Opens http://localhost:3333

# 6. Launch the Interactive Telegram Bot
npm run bot
```

---

## 🎯 Content Pipelines (9 Formats + Batch)

| Format | Command | Resolution | Description |
|---|---|---|---|
| **Power Quote** | `npm run quote` | 1080×1080 | Poetic Amharic spiritual quote with patristic weight |
| **Daily Verse** | `npm run verse` | 1080×1080 | Verified 1962 EOTC Bible verse with strict Ge'ez numerals |
| **Deep Dive Carousel** | `npm run carousel` | 5× 1080×1350 | 5-slide progressive theological masterclass |
| **Weekly Reflection** | `npm run reflection` | 1080×1920 | Multi-paragraph homily + pastoral prayer |
| **Saint of the Day** | `npm run saint` | 1080×1080 | Synaxarium hagiography, Ge'ez hymn, and life lesson |
| **Fasting Guide** | `npm run fasting` | 1080×1350 | Active fast tracker, day countdown, rules & encouragement |
| **Holy Week** | `npm run holyweek` | 1080×1350 | Passion Week day-by-day liturgical card |
| **Church History** | `npm run history` | 1080×1350 | Milestone moments in Ethiopian Church history |
| **Calendar Summary** | `npm run calendar` | 1080×1920 | 7-day liturgical week overview with commemorations |
| **All-in-One Batch** | `npm run all` | All formats | Generates the entire daily bundle sequentially |

---

## 🎬 Zero-Cost Video Reel Engine

Convert any rendered graphic into dynamic short-form video reels for **YouTube Shorts, TikTok, and Instagram Reels** at zero API cost:

- **Aspect Ratios**: 9:16 (1080×1920 vertical), 1:1 (1080×1080 square), 4:5 (1080×1350 portrait)
- **Camera Work**: Cinematic Ken Burns slow-pan & zoom presets tailored to liturgical reverence
- **Aesthetic Overlays**: Subtle radial golden vignette, cinematic black cross-fades
- **Multi-Slide Carousel Animation**: 5-slide carousel smoothly transitioned into an animated video deck

**Enable Video Generation**:
```bash
# In your .env file or command line:
GENERATE_VIDEO=true npm run quote
```

---

## 📖 Canonical Scripture & Synaxarium Engine

To eradicate AI hallucination of biblical verses and historical dates, v7.0 includes local canonical databases:

1. **`src/canon/scripture.js`**:
   - Curated verses from the 1962 Haile Selassie EOTC 81-book Bible.
   - Exact Ethiopian chapter:verse punctuation (`፥`) and Ge'ez numerals (`፭፥፰`).
   - Keyword & theme matching (`getVerifiedVerse('ፍቅር')`).
   - Automatic reference sanitizer (`sanitizeReference('ዮሐንስ 3:16')`).

2. **`src/canon/synaxarium.js`**:
   - Full 30-day monthly commemoration cycle (መጽሐፈ ስንክሳር).
   - Patristic excerpts, Ge'ez hymns (`ምልጣን / አቡን`), Amharic translations, and moral lessons.

---

## 📱 Interactive Telegram Concierge Bot

Run `npm run bot` to activate the 2-way spiritual companion:

| Command | Action |
|---|---|
| `/today` | Complete liturgical brief: date, daily saint, fast state, mood |
| `/saint` | Full Synaxarium story & moral lesson for today's commemoration |
| `/saint [1-30]` | Look up any monthly commemoration by day (e.g. `/saint 24`) |
| `/verse` | Canonical scripture verse of the day |
| `/fasting` | Active fasting status, progress bar, canonical rules |
| `/calendar` | Current 7-day week schedule with patron feasts |
| `/computus [year]` | Bahire Hasab mathematical calculation for Easter and movable feasts |
| `/search [keyword]` | Search canonical scripture repository |
| `/generate [type]` | (Admin only) Trigger content generation and broadcast remotely |

---

## 🖥️ Local Web Studio GUI

Run `npm run studio` and open `http://localhost:3333`:

- **Real-Time Visual Grid**: Browse all rendered PNGs and MP4 reels
- **One-Click Generator**: Trigger any of the 9 pipelines with liturgical toggle
- **Full-Screen Lightbox**: Inspect 3× Retina details and typography
- **One-Click Download**: Download images or videos directly to your device
- **Console Log Stream**: Live output and status indicators

---

## 🎨 Sacred Design Architecture

- **Noto Sans Ethiopic Typography**: Optimized letter-spacing and hierarchy for Amharic script.
- **Ecclesiastical Vectors**: Embedded SVG Lalibela Cross and woven Tibeb borders (`assets/vectors/`).
- **Dynamic Liturgical Moods**:
  - 🟡 **Joyful** (Warm gold + amber glow) — Major feasts
  - ⚡ **Triumphant** (Bright gold + white radiance) — Easter, Meskel, Timkat
  - 🟣 **Penitential** (Deep purple + muted silver) — Lent, fasting seasons
  - 🔵 **Contemplative** (Cool blue + soft silver) — Weekly reflections
  - 🟢 **Celebratory** (Rich gold + emerald accents) — Saint commemorations
  - ✝️ **Devotional** (Classic dark gold) — Daily default

---

## 🔧 Environment Configuration

Edit `.env` (or see `.env.example`):

```ini
# AI Configuration
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
AI_MODEL=google/gemini-2.5-flash

# Video Reel Generation
GENERATE_VIDEO=false
VIDEO_PROFILES=1:1,9:16
FFMPEG_PATH=

# Web Studio Port
STUDIO_PORT=3333

# Telegram Delivery & Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_CHAT_ID=-1001234567890

# Liturgical Mode
USE_LITURGICAL=true
LOG_LEVEL=INFO
```

---

## 📁 Repository Structure

```
eotc-media-studio/
├── .github/workflows/
│   └── generate-media.yml     # Automated GitHub Actions workflow (v7 with video & bot)
├── assets/
│   └── vectors/               # Lalibela cross and Tibeb border SVGs
├── src/
│   ├── index.js               # Master pipeline orchestrator (9 pipelines + batch)
│   ├── ai/
│   │   └── openrouter.js      # Dual-AI engine & theological proofreader
│   ├── canon/
│   │   ├── scripture.js       # Canonical 81-book scripture engine (zero hallucination)
│   │   └── synaxarium.js      # 30-day Synaxarium hagiography archive
│   ├── db/
│   │   └── supabase.js        # Content deduplication and storage
│   ├── render/
│   │   ├── puppeteer.js       # 3× Retina Chromium renderer with mood theming
│   │   └── video.js           # FFmpeg Ken Burns video reel generator (9:16, 1:1, 4:5)
│   ├── studio/
│   │   └── server.js          # Web Studio GUI server (http://localhost:3333)
│   ├── telegram/
│   │   ├── bot.js             # High-resolution media publisher
│   │   └── concierge.js       # Interactive 2-way Telegram concierge bot
│   └── utils/
│       └── calendar.js        # Bahire Hasab computus & liturgical calendar engine
├── templates/                 # 9 production HTML/CSS templates
├── test.mjs                   # 57-check automated test suite
├── .env.example               # Full v7.0 environment configuration
└── package.json
```

---

## 📜 License

MIT License. Designed and maintained for the Ethiopian Orthodox Tewahedo Church media ministry.
