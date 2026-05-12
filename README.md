# ✝️ EOTC Media Studio v5.0

**World-class automated spiritual content engine for the Ethiopian Orthodox Tewahedo Church.**

Generates stunning, broadcast-ready images — quotes, daily verses, teaching carousels, and weekly reflections — powered by AI with theological auditing, liturgical calendar intelligence, and instant Telegram delivery.

---

## 🎯 What It Does

| Content Type | Description | Output |
|---|---|---|
| **Power Quote** | AI-generated poetic Amharic spiritual quote | 1080×1080 dark glassmorphic card |
| **Daily Verse** | Literal 1962 EOTC Bible verse with sacred geometry | 1080×1080 dark atmospheric design |
| **Deep Dive Carousel** | 5-slide progressive teaching series | 5× 1080×1350 slides |
| **Weekly Reflection** | Multi-paragraph priestly teaching + prayer | 1080×1920 elegant parchment design |

Every piece of content passes through a **dual-AI pipeline**: generation → theological auditing → rendering → delivery.

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Liturgical   │────▶│  AI Engine   │────▶│  Theological │────▶│  Puppeteer   │
│  Calendar     │     │  (OpenRouter) │     │  Auditor     │     │  Renderer    │
│  Engine       │     │              │     │  (Proofreader)│     │  (3x Retina) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                       │
                                                                       ▼
                                          ┌──────────────┐     ┌──────────────┐
                                          │  Supabase    │◀────│  Telegram    │
                                          │  (Dedup DB)  │     │  Delivery    │
                                          └──────────────┘     └──────────────┘
```

---

## 📅 Liturgical Intelligence

The calendar engine (`src/utils/calendar.js`) provides:
- **Ethiopian Calendar Conversion** — Gregorian → Ethiopian date
- **Bahire Hasab (Computus)** — Mathematically computes moveable feasts (Easter, Lent, Pentecost)
- **30-Day Saint Commemorations** — Every day of the month has a patron saint
- **Major Fixed Feasts** — Meskel, Genna, Timkat, Filseta, etc.
- **Fasting Seasons** — Great Lent, Nineveh, Apostles Fast, weekly Wed/Fri
- **Zemene (Seasons)** — Tsige, Keremt, Bega, Sebket

The AI prompts receive rich liturgical context that shapes tone, content, and scriptural selection.

---

## 🚀 Usage

### Manual Run (Local)
```bash
npm run quote        # Power Quote + Liturgical
npm run verse        # Daily Verse + Liturgical
npm run carousel     # 5-Slide Carousel + Liturgical
npm run reflection   # Weekly Reflection + Liturgical
```

### GitHub Actions (Manual Dispatch)
1. Go to **Actions** → **"✝️ EOTC Media Studio — Generate Content"**
2. Click **"Run workflow"**
3. Select content type and liturgical toggle
4. Content is generated, rendered, and sent to Telegram automatically

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

---

## 📁 Project Structure

```
eotc-media-studio/
├── src/
│   ├── index.js              # Pipeline orchestrator
│   ├── ai/
│   │   └── openrouter.js     # AI generation + theological auditor
│   ├── db/
│   │   └── supabase.js       # Duplicate detection
│   ├── render/
│   │   └── puppeteer.js      # 3x retina screenshot renderer
│   ├── telegram/
│   │   └── bot.js            # Multi-group Telegram delivery
│   └── utils/
│       └── calendar.js       # Full EOTC liturgical calendar engine
├── templates/
│   ├── power_quote.html      # Glassmorphic dark card
│   ├── daily_verse.html      # Sacred geometry + golden halo
│   ├── deep_dive.html        # Carousel slide template
│   └── weekly_reflection.html # Parchment-style long-form
├── .github/
│   └── workflows/
│       └── generate-media.yml # Manual dispatch workflow
└── package.json
```

---

## 🎨 Design Philosophy

Every template is built with these principles:
- **Multi-layer atmospheric backgrounds** — gradient, bloom, grain, vignette
- **Sacred geometry** — decorative rings, L-bracket corner frames, ornamental separators
- **Premium typography** — Noto Sans Ethiopic at 3x retina, gradient text fills
- **Cinematic lighting** — golden halo animations, blue dimensional blooms
- **Film-grade texture** — SVG noise grain for analog depth

---

## 📜 License

MIT — Built for the glory of God and the Ethiopian Orthodox Tewahedo Church.
