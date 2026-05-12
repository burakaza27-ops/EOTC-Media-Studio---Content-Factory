# ✝️ EOTC Media Studio v6.0

**The most comprehensive automated liturgical content engine for the Ethiopian Orthodox Tewahedo Church.**

Generates stunning, broadcast-ready images across **9 content types** — powered by dual-AI generation with theological auditing, liturgical calendar intelligence with Bahire Hasab computus, mood-based dynamic styling, and instant multi-group Telegram delivery.

---

## 🎯 Content Types (9 Total)

| Type | Command | Output | Description |
|---|---|---|---|
| **Power Quote** | `npm run quote` | 1080×1080 | AI-generated poetic Amharic spiritual quote |
| **Daily Verse** | `npm run verse` | 1080×1080 | Literal 1962 EOTC Bible verse with sacred geometry |
| **Carousel** | `npm run carousel` | 5× 1080×1350 | 5-slide progressive teaching series |
| **Reflection** | `npm run reflection` | 1080×1920 | Multi-paragraph priestly teaching + prayer |
| **Saint of the Day** | `npm run saint` | 1080×1080 | Daily saint commemoration with story + lesson |
| **Fasting Guide** | `npm run fasting` | 1080×1350 | Current fast progress, rules, encouragement |
| **Holy Week** | `npm run holyweek` | 1080×1350 | Day-specific Passion Week teaching |
| **Church History** | `npm run history` | 1080×1350 | Key events in EOTC history (8 topics) |
| **Weekly Calendar** | `npm run calendar` | 1080×1920 | 7-day liturgical calendar with saints & moods |

Every piece of content passes through: **Generation → Theological Auditing → Mood-Based Rendering → Delivery**

---

## 🎨 Dynamic Mood System

Templates automatically shift their entire color palette based on the liturgical context:

| Mood | Colors | When Active |
|---|---|---|
| 🟡 **Joyful** | Warm gold + amber glow | Feasts, celebrations |
| ⚡ **Triumphant** | Bright gold + white radiance | Easter, Ascension, Meskel |
| 🟣 **Penitential** | Deep purple + muted silver | Lent, Good Friday, fasting |
| 🔵 **Contemplative** | Cool blue + soft silver | Ordinary days, reflections |
| 🟢 **Celebratory** | Rich gold + emerald accents | Timkat, Christmas, saint days |
| ✝️ **Devotional** | Classic gold + dark warmth | Default daily context |

Every generated image also carries an **Ethiopian date watermark** in Ge'ez numerals (e.g., "ግንቦት ፬ ፳፻፲፰").

---

## 📅 Liturgical Intelligence

The calendar engine (`src/utils/calendar.js`) provides:

- **Ethiopian Calendar Conversion** — Gregorian → Ethiopian date with Ge'ez numerals
- **Bahire Hasab (Computus)** — Mathematically computes all moveable feasts
- **30 Daily Saint Commemorations** — Every day 1-30 has a patron saint with deep context
- **20+ Major Fixed Feasts** — Meskel, Genna, Timkat, Filseta, etc.
- **Fasting Seasons** — Great Lent, Nineveh, Apostles, Prophets, Assumption, weekly
- **Fasting Progress Tracker** — Current day / total days with progress percentage
- **Holy Week Detection** — Precise 7-day Passion week identification
- **Pagume Detection** — 13th month with New Year countdown
- **Zemene (Seasons)** — Tsige, Keremt, Bega, Sebket
- **Lenten Week Themes** — 8 named Sundays of Great Lent
- **8 Church History Topics** — From Aksumite conversion to modern autocephaly

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Liturgical   │────▶│  AI Engine   │────▶│  Theological │────▶│  Puppeteer   │
│  Calendar     │     │  (OpenRouter) │     │  Auditor     │     │  Renderer    │
│  + Bahire     │     │  + 9 Prompts │     │  (Proofreader)│     │  (3x Retina) │
│  Hasab Engine │     │              │     │              │     │  + Mood CSS  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                       │
                                          ┌──────────────┐     ┌──────────────┐
                                          │  Supabase    │◀────│  Telegram    │
                                          │  (Dedup DB)  │     │  Multi-Group │
                                          └──────────────┘     └──────────────┘
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | AI model access via OpenRouter |
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram bot for delivery |
| `TELEGRAM_CHAT_ID` | ✅ | Comma-separated chat/group IDs |
| `SUPABASE_URL` | Optional | Duplicate detection database |
| `SUPABASE_KEY` | Optional | Supabase service key |
| `AI_MODEL` | Optional | Default: `google/gemini-2.5-flash` |
| `PUPPETEER_EXEC_PATH` | Optional | Chrome path (auto-detected locally) |
| `CONTENT_TYPE` | Optional | Which content type to generate |
| `USE_LITURGICAL` | Optional | Enable liturgical context (default: true) |

---

## 📁 Project Structure

```
eotc-media-studio/
├── src/
│   ├── index.js                 # v6.0 Pipeline orchestrator (9 pipelines)
│   ├── ai/
│   │   └── openrouter.js        # 11 AI prompts + theological auditor
│   ├── db/
│   │   └── supabase.js          # Duplicate detection + content memory
│   ├── render/
│   │   └── puppeteer.js         # Mood-aware 3x retina renderer (9 renderers)
│   ├── telegram/
│   │   └── bot.js               # Multi-group Telegram delivery
│   └── utils/
│       └── calendar.js          # Full EOTC liturgical calendar engine
├── templates/
│   ├── power_quote.html         # Glassmorphic dark card + mood colors
│   ├── daily_verse.html         # Sacred geometry + golden halo
│   ├── deep_dive.html           # Carousel slide with progress
│   ├── weekly_reflection.html   # Parchment-style long-form
│   ├── saint_day.html           # Saint halo + feast badge
│   ├── fasting_guide.html       # Progress bar + rules + encouragement
│   ├── holy_week.html           # Crimson cross + Passion atmosphere
│   ├── church_history.html      # Sepia narrative + significance box
│   └── calendar_summary.html    # 7-day grid with mood indicators
├── .github/
│   └── workflows/
│       └── generate-media.yml   # Manual dispatch (9 content types)
└── package.json                 # v6.0.0
```

---

## 🚀 GitHub Actions Usage

1. Go to **Actions** → **"✝️ EOTC Media Studio — Generate Content"**
2. Click **"Run workflow"**
3. Select content type from dropdown (9 options)
4. Toggle liturgical context on/off
5. Content generates, renders, and delivers to Telegram automatically

---

## 📜 License

MIT — Built for the glory of God and the Ethiopian Orthodox Tewahedo Church.
