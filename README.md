# ✝️ EOTC Media Studio v7.0 — Broadcast-Grade Content Factory

**The definitive, broadcast-grade multimedia publishing and automation empire for the Ethiopian Orthodox Tewahedo Church (የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን).**

Operates as a **100% free ($0 / zero-cost)** automated media publishing engine:
- **9 Specialized Liturgical Pipelines**: Quotes, Daily Verses, 5-Slide Carousels, Weekly Reflections, Saints of the Day, Fasting Guides, Holy Week, Church History, and Weekly Calendars.
- **Interactive Telegram Concierge Command Center**: Complete remote command center featuring multi-level inline keyboard menus, step-by-step interactive wizard, and direct file delivery.
- **Bi-Directional GitHub Actions Cloud Control**: Dispatch workflows, monitor live runs, inspect logs, re-run, or cancel directly from Telegram or CLI.
- **Zero-Cost Video Reel Engine**: Vertical 9:16 Shorts/Reels & 1:1 Square MP4s with cinematic Ken Burns camera motion & vignette overlays via FFmpeg.
- **Dual-Model AI Resilience**: High-availability synthesis via OpenRouter with automatic zero-configuration fallback to Google AI Studio (Gemini 2.5 Flash), accompanied by patristic theological auditing.
- **Zero-Hallucination Canonical Scripture & Synaxarium**: Local repository of verified 1962 81-book EOTC Bible verses with strict Ge'ez numerals, plus a complete 30-day patristic Synaxarium archive.
- **Accurate Bahire Hasab Computus Engine**: Full mathematical calculations for Easter (Fasika), Nineveh, Great Lent, Hosanna, Siklet, Ascension, Pentecost, and Evangelist cycles for any Ethiopian year.
- **Sacred Ecclesiastical Visual Kit**: Vector Lalibela Crosses, woven Tibeb borders, 3× Retina rendering, mood-based dynamic styling.
- **Live Local Web Studio GUI**: Visual dashboard at `http://localhost:3333` with live media preview, batch generation, and one-click download.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run complete system health check (65 automated tests)
npm test

# 3. Generate a Power Quote
npm run quote

# 4. Generate with 9:16 Video Reel
npm run reel

# 5. Launch the Interactive Telegram Command Center
npm run bot

# 6. Launch the Local Web Studio GUI
npm run studio
# 🌐 Opens http://localhost:3333

# 7. Dispatch workflow to GitHub Actions Cloud
npm run dispatch -- quote
```

---

## 📱 Interactive Telegram Command Center

The Telegram bot (`src/telegram/concierge.js`) provides complete interactive control over the entire factory:

| Command | Action |
|---|---|
| `/menu` | Interactive multi-level inline keyboard command center |
| `/wizard` | Step-by-step interactive generation wizard (Type → Video/Image → Theme → Delivery) |
| `/today` | Complete liturgical brief: date, daily saint, fast state, mood |
| `/quote [theme]` | Generate an immediate 1080×1080 power quote card |
| `/verse [ref]` | Generate a verified 1962 EOTC scripture verse card |
| `/carousel [theme]` | Generate a 5-slide progressive theological masterclass album |
| `/reflection [theme]` | Generate a multi-paragraph pastoral homily & prayer |
| `/saint [1-30]` | Full Synaxarium story, Ge'ez hymn, moral lesson, and saint card |
| `/fasting` | Active fasting status, day countdown, rules & encouragement |
| `/calendar` | Current 7-day week schedule with commemorations |
| `/reel [type]` | Generate 9:16 vertical video reel with Ken Burns pan/zoom |
| `/all` | Sequentially generate all 9 content pipelines |
| `/dispatch [type]` | Dispatch workflow to GitHub Actions cloud runners |
| `/ghstatus` | Check live status of GitHub Actions workflow runs |
| `/computus [year]` | Bahire Hasab table: Evangelist cycle, Pagume days, 10 moveable feasts |
| `/search [term]` | Canonical search across 81-book Bible & 30-day Synaxarium |
| `/recent` | Browse and download recently generated media directly into chat |
| `/status` / `/health` | Full system health diagnostics (AI, DB, FFmpeg, GitHub, memory) |

---

## ☁️ GitHub Actions Integration

The studio integrates with GitHub Actions for cloud-based headless rendering:

1. **Workflow Dispatch from Telegram or CLI**:
   - Trigger `.github/workflows/generate-media.yml` directly from Telegram bot buttons or CLI (`node src/index.js --dispatch quote --video`).
2. **Font Accuracy in CI/CD**:
   - Workflows automatically install `fonts-noto-core`, `fonts-noto-extra`, and `fonts-sil-abyssinica` on Ubuntu runners to guarantee 100% complete Ge'ez glyph rendering without missing boxes.
3. **Automated Continuous Integration**:
   - `.github/workflows/test.yml` automatically validates the 65-test health check suite on every push and pull request.
4. **Artifact Management**:
   - Output images and video reels are saved in GitHub Artifacts with 30-day retention and broadcasted to Telegram channels.

---

## 🎯 Content Pipelines (9 Formats + Batch)

| Format | CLI Command | Resolution | Description |
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
# Or via CLI flag:
node src/index.js quote --video
```

---

## 📖 Canonical Scripture & Synaxarium Engine

To eradicate AI hallucination of biblical verses and historical dates:

1. **`src/canon/scripture.js`**:
   - Curated verses from the 1962 Haile Selassie EOTC 81-book Bible.
   - Exact Ethiopian chapter:verse punctuation (`፥`) and Ge'ez numerals (`፭፥፰`).
   - Keyword & theme matching (`getVerifiedVerse('ፍቅር')`).
   - Automatic reference sanitizer (`sanitizeReference('ዮሐንስ 3:16')`).

2. **`src/canon/synaxarium.js`**:
   - Full 30-day monthly commemoration cycle (መጽሐፈ ስንክሳር).
   - Patristic excerpts, Ge'ez hymns (`ምልጣን / አቡን`), Amharic translations, and moral lessons.

3. **`src/utils/calendar.js`**:
   - Full Computus (`getComputusData(year)`) calculating moveable feasts, fasts, and evangelist cycles.

---

## 🔧 Environment Configuration

Edit `.env` (or see `.env.example`):

```ini
# AI Configuration (Dual-Provider Resilience)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
GOOGLE_AI_STUDIO_API=AIzaSy...
AI_MODEL=google/gemini-2.5-flash

# GitHub Cloud Dispatch & Actions Monitoring
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=burakaza27-ops/EOTC-Media-Studio---Content-Factory

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
│   ├── generate-media.yml     # Automated GitHub Actions workflow (with custom theme & Ethiopic fonts)
│   └── test.yml               # Automated CI continuous integration test suite
├── assets/
│   └── vectors/               # Lalibela cross and Tibeb border SVGs
├── src/
│   ├── index.js               # Master pipeline orchestrator (CLI args + cloud dispatch)
│   ├── ai/
│   │   └── openrouter.js      # Dual-AI engine (OpenRouter + Google AI Studio fallback)
│   ├── canon/
│   │   ├── scripture.js       # Canonical 81-book scripture engine (zero hallucination)
│   │   └── synaxarium.js      # 30-day Synaxarium hagiography archive
│   ├── db/
│   │   └── supabase.js        # Content deduplication and storage with offline fallback
│   ├── render/
│   │   ├── puppeteer.js       # 3× Retina Chromium renderer with mood theming & compression
│   │   └── video.js           # FFmpeg Ken Burns video reel generator (9:16, 1:1, 4:5)
│   ├── studio/
│   │   └── server.js          # Web Studio GUI server (http://localhost:3333)
│   ├── telegram/
│   │   ├── bot.js             # High-resolution media publisher & safe-caption delivery
│   │   └── concierge.js       # Interactive 2-way Telegram concierge bot & command center
│   └── utils/
│       ├── calendar.js        # Bahire Hasab computus & liturgical calendar engine
│       └── github.js          # GitHub Actions cloud integration engine
├── templates/                 # 9 production HTML/CSS templates
├── test.mjs                   # 65-check automated test suite
├── .env.example               # Full v7.0 environment configuration
└── package.json
```

---

## 📜 License

MIT License. Designed and maintained for the Ethiopian Orthodox Tewahedo Church media ministry.
