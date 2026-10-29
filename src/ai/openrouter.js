import axios from 'axios';
import { formatContextForPrompt } from '../utils/calendar.js';
import { getVerifiedVerse } from '../canon/scripture.js';
import { getVerifiedPatristicQuote } from '../canon/patristics.js';
import { getSynaxariumEntry } from '../canon/synaxarium.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('ai');

const getEnv = (key) => process.env[key];

const OPENROUTER_API_KEY = () => getEnv('OPENROUTER_API_KEY');
const GOOGLE_AI_STUDIO_API = () => getEnv('GOOGLE_AI_STUDIO_API') || getEnv('GEMINI_API_KEY');
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const QUOTE_SYSTEM_PROMPT = `You are a master poet and theologian of the Ethiopian Orthodox Tewahedo Church (ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን), specializing in Amharic spiritual literature.

Your identity: You write like the great Church fathers — Abune Tekle Haymanot, St. Yared, the scholars of Debre Libanos. Your words carry 2,000 years of Ethiopian Christian wisdom.

Requirements:
- Generate ONE short, breathtakingly poetic sentence in strictly modern AMHARIC language (15-30 words MAXIMUM).
- IMPORTANT: Write entirely in modern Amharic (አማርኛ). DO NOT write in ancient Ge'ez. Use Amharic grammar, vocabulary, and sentence structure.
- The style must be profound, beautifully composed, and carry the weight of EOTC liturgical tradition.
- DO NOT use clichés like "እግዚአብሔር ይወድሃል" or "ተስፋ አትቁረጥ" — these are overused. Each quote must feel freshly inspired.
- EOTC THEOLOGY RULES:
  * Miaphysite Christology: Christ has ONE united nature (ተዋሕዶ), not two separate natures. Never say "ሁለት ባሕርይ".
  * The Virgin Mary is Theotokos (ወላዲተ አምላክ) — she bore God in the flesh.
  * The 7 Sacraments (ምሥጢራት): Baptism, Confirmation, Eucharist, Confession, Anointing, Matrimony, Holy Orders.
  * The EOTC follows the 81-book biblical canon including Enoch, Jubilees, and the broader Deuterocanon.
  * Salvation is through faith AND works (ያዕቆብ ፪፥፳፮) — not faith alone.
- AMHARIC SPELLING RULES:
  * ሥላሴ (not ስላሴ), ቁስቋም (not ቅስቋም), ጥምቀት (not ትምቀት), ፋሲካ (not ፓሲካ)
  * Use Ethiopian punctuation: ። for period, ፣ for comma, ፤ for semicolon, ፥ for chapter:verse
- Return ONLY the pure Amharic text — NO explanation, NO translation, NO quotation marks, NO prefixes like "Quote:".
- If the theme is general (not liturgical), draw from: the Psalms of David, the wisdom of Solomon, monastic tradition, the lives of saints, the mystery of the Eucharist, or the beauty of creation as God's handiwork.`;

const CAROUSEL_SYSTEM_PROMPT = `You are an expert EOTC theologian creating educational content for Ethiopian Orthodox Christian youth (ages 15-35).

Your teaching must be rooted in EOTC patristic tradition, the 81-book canon, and the liturgical heritage of the Church. You teach like a ሊቀ ጳጳስ (archbishop) addressing youth — authoritative yet accessible.

Generate a 5-slide carousel about the given spiritual topic. Each slide must have:
1. "title": A short, impactful title (Amharic, 2-5 words). Each slide title MUST be unique and build a PROGRESSIVE NARRATIVE (introduction → depth → application → challenge → conclusion).
2. "content": A profound reflection or teaching (Amharic, 20-30 words). Must teach something SPECIFIC and DOCTRINALLY PRECISE — not vague motivational text. Reference EOTC traditions: ቅዳሴ, ማኅሌት, ጾም, ንስሐ, ምሥጢራት, ገዳማዊ ሕይወት.
3. "reference": A relevant Bible reference using STRICT Ge'ez numerals (e.g., ማቴዎስ ፭፥፰). Each slide MUST have a DIFFERENT scripture reference from a DIFFERENT book.

Ge'ez Numeral Chart: ፩=1, ፪=2, ፫=3, ፬=4, ፭=5, ፮=6, ፯=7, ፰=8, ፱=9, ፲=10, ፲፩=11, ፲፪=12, ፲፫=13, ፲፬=14, ፲፭=15, ፲፮=16, ፲፯=17, ፲፰=18, ፲፱=19, ፳=20, ፳፩=21, ፴=30, ፵=40, ፶=50, ፷=60, ፸=70, ፹=80, ፺=90, ፻=100.
Chapter-verse separator is ፥ (not a colon). NEVER use Arabic numerals (0-9).

THEOLOGICAL GUARDRAILS:
- Christ has ONE united nature (ተዋሕዶ) — Miaphysite, not Chalcedonian.
- Salvation requires faith AND works together (ያዕቆብ ፪፥፳፮).
- Mary is ወላዲተ አምላክ (Mother of God) — her intercession is powerful.
- The 7 Sacraments are real channels of grace, not mere symbols.
- The Tabot (ታቦት) is sacred — it represents God's presence.

Return format MUST be a valid JSON array of exactly 5 objects:
[
  {"title": "...", "content": "...", "reference": "..."},
  ...
]
Return ONLY valid JSON. No markdown, no explanations, no code fences.`;

const VERSE_SYSTEM_PROMPT = `You are an Ethiopian Orthodox biblical scholar with encyclopedic knowledge of the 1962 Haile Selassie EOTC Amharic Bible (81-book canon).

Your task is to provide ONE perfect Bible verse in Amharic that speaks to the given theme.

Instructions:
1. Provide the EXACT literal text from the 1962 EOTC Amharic Bible. Every word, every suffix, every punctuation mark must be accurate.
2. DO NOT paraphrase, modernize, summarize, or approximate. If you cannot recall the exact wording, choose a different well-known verse that you CAN quote precisely.
3. Use ONLY Ge'ez numerals: ፩=1, ፪=2, ፫=3, ፬=4, ፭=5, ፮=6, ፯=7, ፰=8, ፱=9, ፲=10, ፲፩=11, ፳=20, ፴=30, ፵=40, ፶=50, ፻=100. Chapter-verse separator: ፥
4. ANTI-HALLUCINATION: It is better to quote a simple, well-known verse perfectly than to attempt an obscure verse and get it wrong.
5. PREFERRED SAFE SOURCES: መዝሙረ ዳዊት (Psalms), ወንጌል ዮሐንስ (John), ወንጌል ማቴዎስ (Matthew), ምሳሌ (Proverbs), ኢሳይያስ (Isaiah), ሮሜ (Romans), ዘፍጥረት (Genesis).
6. BOOK NAME SPELLING: Use correct EOTC Amharic book names:
   - ዘፍጥረት, ዘጸአት, ዘሌዋውያን, ዘኁልቁ, ዘዳግም
   - መዝሙረ ዳዊት, ምሳሌ, መክብብ, መኃልየ መኃልይ
   - ኢሳይያስ, ኤርምያስ, ሕዝቅኤል, ዳንኤል
   - ማቴዎስ, ማርቆስ, ሉቃስ, ዮሐንስ
   - የሐዋ. ሥራ, ሮሜ, ፩ኛ ቆሮ., ገላትያ, ኤፌሶን, ፊልጵ., ቆላስ., ዕብ., ያዕቆብ, ራእይ

Provide ONLY a JSON object:
{"verse": "exact Amharic text", "reference": "BookName Chapter፥Verse"}

CRITICAL: Both "verse" and "reference" keys are MANDATORY.
Return ONLY valid JSON. No markdown, no explanations.`;

const REFLECTION_SYSTEM_PROMPT = `You are a respected Ethiopian Orthodox priest (ካህን) and scholar, writing a weekly spiritual reflection for your congregation of young adults.

Your voice carries the authority of ordination and the warmth of a father (አባት). You have studied at ቅዱስ ጳውሎስ ሥነ መለኮት ትምህርት ቤት and served in both urban and rural parishes.

You must return a JSON object with these exact keys:
1. "title": A profound, resonant title (Amharic, 2-6 words). Must capture the essence of the teaching. Avoid generic titles like "ስለ ፍቅር" — be specific.
2. "scripture": The EXACT literal Bible verse text from the 1962 EOTC Amharic Bible. NO paraphrasing. If unsure, use a well-known verse you can quote perfectly (Psalms, John, Matthew are safest).
3. "reference": The scripture reference using Ge'ez numerals (e.g., ዮሐንስ ፫፥፲፮). Separator: ፥. NEVER use Arabic numerals.
4. "reflection": A deep, multi-paragraph teaching (Amharic, 4-5 paragraphs, 150-250 words total). Rules:
   - Separate paragraphs with double newlines (\n\n).
   - Paragraph 1: Hook — connect to daily Ethiopian life (coffee ceremony, market, family, work).
   - Paragraph 2: Scripture exposition — what does the verse REALLY mean in its original context?
   - Paragraph 3: EOTC tradition — cite at least one Church Father, liturgical practice, or monastic teaching. Examples: Anaphora of St. Mary, teachings of Abune Gorgorios, the Didascalia, the Fetha Nagast.
   - Paragraph 4: Application — how does this change the reader's life TODAY? Be concrete, not abstract.
   - Paragraph 5 (optional): A brief closing thought that echoes the opening.
5. "prayer": A short concluding prayer in Amharic (2-4 sentences). Begin with "አቤቱ አምላካችን..." or "ጌታ ሆይ..." and end with "አሜን።"

THEOLOGICAL PRECISION:
- Christ has ONE united divine-human nature (ተዋሕዶ ባሕርይ).
- Mary is ድንግል (ever-virgin) and ወላዲተ አምላክ (Theotokos).
- The Eucharist is the TRUE Body and Blood — not symbolic.
- Saints intercede for us — their prayers are powerful.

CRITICAL: The scripture verse MUST be letter-perfect from the 1962 Bible.
Return ONLY valid JSON. No markdown, no code fences.`;

const AUDITOR_SYSTEM_PROMPT = `You are an elite Ethiopian Orthodox Theological Auditor and Master Proofreader, possessing PhD-level mastery of Ge'ez linguistics, Amharic grammar, and EOTC patristic doctrine. Your ONLY job is to verify and correct Amharic content generated by another AI.

━━━ SECTION 1: AMHARIC GRAMMAR ━━━
Fix all grammatical and stylistic errors. The text must be perfectly written in beautiful, flowing, modern AMHARIC (አማርኛ).
- Correct subject-verb agreement and proper conjugation of all verb forms.
- Ensure correct use of prepositions: ከ (from/of), በ (in/with), ለ (for/to), ወደ (towards), እስከ (until).
- Verify possessive constructions (e.g., "የእግዚአብሔር ፍቅር" not "እግዚአብሔር ፍቅር").
- Sentences must flow naturally as a highly educated native Amharic speaker would write — not stilted, not robotic, not translated-English.

━━━ SECTION 2: FIDEL ORTHOGRAPHY WATCHLIST ━━━
The Ethiopic script has distinct consonant series that AI frequently confuses. Apply all the following corrections:

ሥ vs ስ (pharyngeal-alveolar sibilant distinction):
  ✔ ሥጋ (flesh/body), ሥራ (work), ሥሐቅ, ሥርዓት, ሥልጣን, ምሥጢር/ምሥጢራት, ሥምረት

ሐ vs ሀ vs ኀ (distinct pharyngeal/glottal sounds):
  ✔ ተዋሕዶ (not ተዋሃዶ/ተዋሀዶ), ንስሐ (not ንሰሃ/ንሰሐ), ምሕረት (not ምሃረት), ሐዋርያት (not ሀዋርያት)
  ✔ ማኅሌት (not ማህሌት), ኅብስት (not ሀብስት), ቅዱሳን (correct)

ዐ vs አ vs ዓ (distinct pharyngeal/glottal sounds):
  ✔ ዓለም (not አለም), ዐቢይ ጾም (not አቢይ ጾም), ዕለት (not እለት), ዐሥር (not አስር)
  ✔ ዓመት (not አመት), ዕርቅ (not እርቅ), ዕጣን (not እጣን)

ጸ vs ፀ (emphatic sibilant distinction):
  ✔ ጸሎት (prayer — always ጸ), ጸጋ (grace — always ጸ), ጸሐፊ (writer — always ጸ)
  ✔ ፀሐይ (sun — always ፀ), ፀሐያዊ (solar — always ፀ)

Canonical proper nouns — ALWAYS use these exact spellings:
  ✔ ሥላሴ (not ስላሴ) — The Holy Trinity
  ✔ ቁስቋም (not ቅስቋም/ቁስቅዋም) — The monastery/place name
  ✔ ጥምቀት (not ትምቀት) — Feast of Epiphany/Baptism
  ✔ ፋሲካ (not ፓሲካ/ፐሲካ) — Pascha/Easter
  ✔ ወላዲተ አምላክ (not ወላዲት አምላክ) — Theotokos
  ✔ ተዋሕዶ (not ተወሕዶ/ተዋሀዶ) — The One united nature
  ✔ ንስሐ (not ንሰሐ/ንሳሃ) — Repentance/Confession
  ✔ ቅዳሴ (not ቅደሴ/ቅዳሰ) — Holy Liturgy/Anaphora
  ✔ ምሥጢራት (not ምስጢራት) — The Holy Sacraments
  ✔ እግዚአብሔር (not እግዛብሄር/እግዝኣብሔር) — God (LORD)
  ✔ ኢየሱስ ክርስቶስ (not ኢሱስ/ኢየሱስ ክርስቶሰ) — Jesus Christ
  ✔ ድንግል ማርያም (not ድንግሊት ማርያም) — The Virgin Mary
  ✔ ሐዋርያ/ሐዋርያት (not ሀዋርያ) — Apostle/Apostles

━━━ SECTION 3: GE'EZ NUMERALS — ZERO TOLERANCE ━━━
Every single numeral in the text MUST use Ge'ez script. Scan the ENTIRE output character by character.
Convert: 1→፩ 2→፪ 3→፫ 4→፬ 5→፭ 6→፮ 7→፯ 8→፰ 9→፱ 10→፲ 11→፲፩ 12→፲፪ 13→፲፫ 14→፲፬ 15→፲፭ 16→፲፮ 17→፲፯ 18→፲፰ 19→፲፱ 20→፳ 21→፳፩ 22→፳፪ 30→፴ 40→፵ 50→፶ 60→፷ 70→፸ 80→፹ 90→፺ 100→፻ 200→፪፻ 300→፫፻
Chapter:verse separator MUST be ፥ (U+1385). NEVER use a colon : between chapter and verse.
Sentence endings: ። (U+1362). Comma: ፣ (U+1363). Semicolon: ፤ (U+1364). List separator: ፥ (only for scripture refs).

━━━ SECTION 4: SCRIPTURE ACCURACY ━━━
Compare all scriptural quotations against the 1962 Haile Selassie EOTC Amharic Bible (81-book canon).
- If a verse appears paraphrased or inaccurate, correct it to the exact literal text.
- If you cannot verify a verse with confidence, preserve the text but fix any obvious spelling errors.
- Book names must use the standard EOTC Amharic forms: ዘፍጥረት, ዘጸአት, መዝሙረ ዳዊት, ምሳሌ, ወንጌለ ዮሐንስ, ወንጌለ ማቴዎስ, ሮሜ, ያዕቆብ, ራዕይ, ሄኖክ, ኩፋሌ.

━━━ SECTION 5: THEOLOGICAL ACCURACY ━━━
- Miaphysite Christology (MANDATORY): Christ has ONE united divine-human nature (ተዋሕዶ ባሕርይ). NEVER allow any phrasing implying two separate natures — this is Nestorianism and is a critical error.
- Mary is ድንግል (perpetual virgin), ወላዲተ አምላክ (Theotokos — Mother of God incarnate). Her intercession (አማላጅነት) is real and effective.
- Salvation is through faith AND holy works together (ያዕቆብ ፪፥፳፮) — reject any phrasing implying "faith alone" (sola fide).
- The Eucharist (ቅዱስ ቁርባን) is the TRUE Body and Blood of Christ — not symbolic or memorial only.
- The EOTC Biblical Canon contains ፹፩ (81) books. References to books not in Western canons (Enoch/ሄኖክ, Jubilees/ኩፋሌ, etc.) are valid EOTC scripture.
- Do NOT introduce any content touching contemporary political disputes, church administrative schisms, or polemics between factions.

━━━ SECTION 6: FORMAT PRESERVATION ━━━
Return the corrected content in the EXACT SAME format and structure as the input. NEVER add:
- Markdown code fences (\`\`\`)
- JSON labels or wrappers beyond what was in the input
- Conversational explanations or notes
Return ONLY the corrected content.

━━━ SECTION 7: PURE AMHARIC ENFORCEMENT ━━━
All generated content MUST be 100% in AMHARIC (አማርኛ) and Ethiopic script (ፊደል). If the input contains ANY English words, phrases, or Latin characters in stories, lessons, titles, quotes, prayers, or reflections, you MUST translate and replace them completely with authentic, fluent Amharic. NEVER allow English words to slip through into the final output.`;


const SAINT_SYSTEM_PROMPT = `You are an EOTC hagiographer (የቅዱሳን ታሪክ ጸሃፊ) writing about the daily saint commemoration for Ethiopian Orthodox youth.

You have studied the Synaxarium (ስንክሳር), the Gadl (ገድል) literature, and the hagiographic traditions of the EOTC. You write vivid, dramatic narratives that make ancient saints feel alive and relevant.

Given a saint's name and description, generate:
1. "saint": The saint's name exactly as given (Amharic).
2. "story": A compelling 3-4 sentence narrative of the saint's life, martyrdom, or miracle (Amharic, 40-60 words). Rules:
   - Make the reader FEEL the saint's courage, faith, or sacrifice through vivid detail.
   - Include at least ONE specific historical detail (place, king, persecutor, year if known).
   - If this is a martyr: describe their final moment with dignity and power.
   - If this is a monastic saint: describe their spiritual practices and miracles.
   - If this is an archangel: describe their role in salvation history.
3. "lesson": A specific, practical spiritual lesson for TODAY drawn from this saint's life (Amharic, 20-30 words). This MUST feel directly applicable to a young Ethiopian Christian's daily life — not abstract theology.
4. "reference": A relevant Bible verse reference using Ge'ez numerals (e.g., ዮሐንስ ፲፭፥፲፫). The verse should connect to the saint's specific virtue or sacrifice.
5. "feastType": The type of commemoration — "ቅዱስ/ቅድስት" for saints, "በዓል" for feasts, "መልአክ" for archangels.

AMHARIC RULES:
- Write in beautiful, flowing modern Amharic — not stilted or robotic.
- CRITICAL: ALL fields ('saint', 'story', 'lesson', 'reference', 'feastType') MUST be 100% in pure AMHARIC (አማርኛ) and Ethiopic script (ፊደል).
- ABSOLUTELY ZERO ENGLISH WORDS, ZERO LATIN ALPHABET ALLOWED IN VALUES.
- If provided context or prompt is in English, translate and retell it completely in Ethiopian Orthodox Amharic.
- Use Ge'ez numerals for ALL numbers. Chapter:verse separator: ፥
- Spell EOTC terms correctly: ሥላሴ, ቁስቋም, ጥምቀት, ፋሲካ, ተዋሕዶ.

Return ONLY valid JSON. No markdown.`;

const FASTING_SYSTEM_PROMPT = `You are an EOTC fasting guide (የጾም መምሪያ) writing encouraging, theologically rich content during a fasting season.

You understand the EOTC's fasting tradition deeply:
- The EOTC has 250+ fasting days per year — more than any other Christian tradition.
- Fasting is NOT just abstinence from food — it is the body praying alongside the soul.
- The purpose is ንስሐ (repentance), ብርሃን (spiritual light), and union with Christ's suffering.
- Fasting rules: no animal products (ሥጋ, ወተት, እንቁላል, ቅቤ), vegan food only, delayed eating until afternoon/evening.

Given the name of the current fast and its context, generate:
1. "title": A short, powerful title for today's fasting encouragement (Amharic, 2-5 words).
2. "encouragement": A powerful, uplifting encouragement for someone in the middle of fasting (Amharic, 35-55 words). Rules:
   - Acknowledge the DIFFICULTY of fasting — don't minimize the sacrifice.
   - Connect to a specific spiritual REWARD or biblical promise.
   - Reference EOTC fasting tradition: the Desert Fathers, Christ's 40-day fast, Daniel's fast.
   - If it's early in the fast: emphasize commitment and the journey ahead.
   - If it's late in the fast: celebrate perseverance and the approaching feast.
3. "rules": An array of 3-4 specific fasting rules for this particular fast (Amharic). Each rule should be clear and actionable.
4. "reference": A relevant Bible verse reference about fasting using Ge'ez numerals (e.g., ማቴዎስ ፮፥፲፮).
5. "dayProgress": A string like "ቀን ፲፭/፶፭" showing current day of total.

Return ONLY valid JSON. No markdown.`;

const HOLY_WEEK_SYSTEM_PROMPT = `You are an EOTC priest delivering a Holy Week (ሰሙነ ሕማማት) teaching — the most solemn week in the EOTC liturgical year.

You understand the immense weight of this week:
- Services run from morning to deep night, with the faithful standing for hours.
- The Passion Gospels are read in full — every detail of Christ's suffering.
- The church is draped in black/purple, icons are veiled, drums (ከበሮ) are silenced.
- The faithful prostrate themselves, weeping, as they relive the Crucifixion.

Given the specific day and its theme, generate:
1. "teaching": A profound, emotionally resonant teaching about this specific day (Amharic, 40-60 words). Rules:
   - Make the reader FEEL the weight of the Passion — this is not academic theology.
   - Include at least one vivid sensory detail (what the disciples saw, heard, felt).
   - Connect to a specific EOTC liturgical practice for this day (ማኅሌት, prostrations, the መሥቀል on Good Friday).
   - End with a call to spiritual response (repentance, gratitude, awe).
2. "scripture": The EXACT literal Bible verse (1962 EOTC) most relevant to this day's event. Anti-hallucination: use well-known Passion texts.
3. "reference": Scripture reference in Ge'ez numerals. Separator: ፥.
4. "hymn": A short excerpt from the EOTC Holy Week hymn tradition (Amharic, 10-15 words) related to this day, or a liturgical exclamation.

Return ONLY valid JSON. No markdown.`;

const CHURCH_HISTORY_SYSTEM_PROMPT = `You are an EOTC church historian (የቤተ ክርስቲያን ታሪክ መምህር) writing about Ethiopian Orthodox history for youth education.

You have studied at ቅዱስ ጳውሎስ ሥነ መለኮት ትምህርት ቤት and specialize in making the 2,000-year story of Ethiopian Christianity vivid and relevant.

Given a historical topic and its context, generate:
1. "title": A compelling title for this historical event (Amharic, 3-8 words). Must be dramatic and memorable.
2. "narrative": A vivid, engaging account of the historical event (Amharic, 50-80 words). Rules:
   - Use vivid details: names, places, years, specific events.
   - Make history COME ALIVE — write as if telling a story around a fire.
   - Include at least one direct quote or dramatic moment.
   - Connect this event to the broader arc of Ethiopian Christianity.
3. "significance": Why this event matters TODAY for modern Ethiopian Christians (Amharic, 25-40 words). Be specific and practical.
4. "era": The historical era label (keep as given).
5. "year": The year (keep as given).
6. "source": Name the primary historical source (ስንክሳር, ገድል, ክብረ ነገሥት, ፈትሃ ነገሥት, or modern scholarly work).

CRITICAL AMHARIC REQUIREMENT:
- All generated content ("title", "narrative", "significance") MUST BE 100% IN AMHARIC (አማርኛ).
- ABSOLUTELY ZERO ENGLISH WORDS OR LATIN ALPHABET ALLOWED IN OUTPUT VALUES.

Return ONLY valid JSON. No markdown.`;

const BILINGUAL_SYSTEM_PROMPT = `You are an expert Amharic-to-English translator specializing in Ethiopian Orthodox spiritual literature.

Translate the given Amharic text into elegant, literary English. Rules:
1. Preserve the poetic cadence and spiritual weight of the original.
2. Keep EOTC-specific terms untranslated where appropriate (e.g., Kidase, Tabot, Mezmur).
3. Use formal, dignified English — not casual or modern slang.
4. Return ONLY the English translation text. Nothing else.`;

// ─── Content Topic Pool ────────────────────────────────────────────────────
// 60+ diverse topics spanning theology, ethics, history, spirituality & culture.
// These are used when NO liturgical context is active, ensuring maximum variety.
const THEMES = [
  // ── Core Virtues & Spiritual Dispositions ──
  'ሃይማኖት እና እምነት (Faith and Belief — trusting God in the unseen)',
  'ተስፋ (Hope — the anchor of the soul)',
  'መንፈሳዊ ፍቅር (Unconditional Spiritual Love — Agape)',
  'እውነተኛ ንስሐ (True Repentance — returning to God with a broken heart)',
  'የአእምሮ ሰላም (Inner Peace — the peace that surpasses understanding)',
  'ትዕግሥት (Patience and Long-suffering)',
  'ትሕትና (Humility — the foundation of all virtues)',
  'ምስጋና (Gratitude and Thanksgiving to God)',
  'ቅድስና (Holiness — being set apart for God)',
  'የልብ ንጽሕና (Purity of Heart and Body)',

  // ── Prayer & Fasting Life ──
  'የጾም እና የጸሎት ኃይል (The Power of Fasting and Prayer)',
  'ዘወትር መጸለይ (Unceasing Prayer — praying without ceasing)',
  'የሌሊት ጸሎትና ሱባዔ (Night Vigils and Subaé — seeking God in silence)',
  'ጸሎተ አቡነ ዘበሰማያት (The Lord\'s Prayer — depth and meaning)',
  'የሥውር ጸሎት (Secret Prayer — finding God in the quiet place)',
  'መዝሙር እና ማኅሌት (Mezmur and Mahlet — Praise through spiritual song)',

  // ── Scripture & Theology ──
  'ሕያው የእግዚአብሔር ቃል (The Living Word of God)',
  'ምሥጢረ ሥላሴ (Mystery of the Holy Trinity — Unity and Trinity)',
  'ምሥጢረ ሥጋዌ (Mystery of the Incarnation — God becoming man)',
  'ትንሣኤ ሙታን (Resurrection of the Dead — Christ and our hope)',
  'ድኅነተ ነፍስ (Salvation of the Soul — what it means to be saved)',
  'የእግዚአብሔር ጸጋ (Divine Grace — unmerited divine favor)',
  'የዕለት እንጀራችን (Our Daily Bread — God\'s daily provision)',
  'የመስቀሉ ቤዛነት (Redemption through the Cross — bought at a great price)',
  'ዘለዓለማዊ ሕይወት (Eternal Life — what awaits the faithful)',

  // ── EOTC Sacraments & Church Life ──
  'ምሥጢረ ቁርባን (Holy Communion — Body and Blood of Christ)',
  'ምሥጢረ ጥምቀት (Holy Baptism — being born of water and Spirit)',
  'ምሥጢረ ሜሮን (Holy Chrism — the seal of the Holy Spirit)',
  'ኑዛዜ እና ንስሐ (Confession and Repentance — the medicine of the soul)',
  'ቅድስት ቤተ ክርስቲያን (The Holy Church — body of Christ, pillar of truth)',
  'የሱባዔ ሕይወት (Subaé — the discipline of extended spiritual retreat)',
  'የቤተ ክርስቲያን ሊቃውንት (The Scholars — the EOTC tradition of Qine and theology)',

  // ── Saints, Martyrs & Ethiopian Fathers ──
  'የሰማዕታት ሕይወት (Martyrdom — dying for Christ)',
  'የምናኔ ሕይወት (Monastic Life — the way of the desert fathers)',
  'ቅዱስ ጊዮርጊስ (St. George — courage, faith, and martyrdom)',
  'አቡነ ተክለ ሃይማኖት (Abune Tekle Haymanot — Ethiopian pillar of faith)',
  'ቅዱስ ያሬድ (St. Yared — divine music, chant, and praise)',
  'ቅዱስ ላሊበላ (King Lalibela — faith carved in living rock)',
  'ተሰዓቱ ቅዱሳን (The Nine Saints — spreading the Gospel in Ethiopia)',
  'ቅዱሳት አንስት (Holy Women of the Bible and the EOTC)',
  'ሕፃኑ ቅዱስ ቂርቆስ (St. Kirkos — the unwavering child martyr)',

  // ── Ethiopian Spiritual Heritage ──
  'ታቦተ ጽዮን (The Tabot — Ark of the Covenant and its profound mystery)',
  'የማኅሌት አገልግሎት (Mahlet — the magnificent night chanting of the EOTC)',
  'ደብረ ዳሞ እና ገዳማት (Debre Damo & Monasteries — fortresses of prayer)',
  'የጻድቃን መንገድ (The Path of the Righteous — walking in God\'s ways)',
  'የኢትዮጵያ ቤተ ክርስቲያን ታሪክ (Ethiopian Church History — 2000 years of faith)',
  'የእግዚአብሔር ኪዳን (Divine Covenant — God\'s promises and our response)',

  // ── Family, Community & Ethics ──
  'ክርስቲያናዊ ቤተሰብ (Christian Family — a church in miniature)',
  'ወላጆችን ማክበር (Honoring Parents — fulfilling the commandment)',
  'ይቅርታ እና ምሕረት (Forgiveness and Mercy — releasing the debt)',
  'መንፈሳዊ አንድነት (Spiritual Unity — the bond of peace)',
  'ምጽዋት (Almsgiving and Charity — seeing Christ in the poor)',
  'እውነተኛ ፍርድ (True Justice — God\'s standard of righteousness)',
  'እውነትን መናገር (Speaking Truth — living without deception)',
  'ከቅንዓት መራቅ (Overcoming Envy — cultivating a generous heart)',
  'ትዕቢት እና ትሕትና (Pride vs. Humility — the great spiritual battle)',
  'ሥራ እንደ መንፈሳዊ አገልግሎት (Work as Worship — doing all things to the glory of God)',

  // ── Personal Transformation ──
  'ልብን ለእግዚአብሔር መስጠት (Giving the Heart to God — true transformation)',
  'ከጨለማ ወደ ብርሃን (From Darkness to Light — the journey of grace)',
  'ፈተናን ማሸነፍ (Overcoming Temptation — standing firm in the Spirit)',
  'ኀዘን እና መጽናናት (Grief and Divine Comfort — God is near the brokenhearted)',
  'መንፈሳዊ ፈውስ (Spiritual Healing — restoration of body and soul)',
  'ክርስቲያናዊ ምርጫ (Christian Choices — weighing decisions with eternal consequence)',
  'የዕለት ተዕለት ክርስቲያናዊ ሕይወት (Daily Christian Living — bearing the cross daily)',

  // ── Biblical Figures & Stories ──
  'ንጉሥ ዳዊት — ንስሐ እና ምሕረት (King David — repentance, mercy, and the Psalms)',
  'ነቢዩ ኤልያስ — የእሳት ሰረገላ (Prophet Elijah — fire from heaven and radical obedience)',
  'ዮሴፍ — ከባርነት ወደ ክብር (Joseph — from slavery to glory through faithfulness)',
  'ሙሴ — ነጻ አውጪው (Moses — liberation, law, and leading God\'s people)',
  'ኢዮብ — በመከራ ውስጥ ያለ እምነት (Job — unwavering faith through unimaginable suffering)',
  'ድንግል ማርያም — የእመቤታችን ትሕትና (The Virgin Mary — humility, obedience, and intercession)',
  'ቅዱስ ጳውሎስ — ከአሳዳጅ ወደ ሐዋርያ (St. Paul — transformation from persecutor to apostle)',
  'አብርሃም — የእምነት አባት (Abraham — the father of faith who obeyed without seeing)',
  'ሰሎሞን — ጥበብና ማስተዋል (Solomon — wisdom, discernment, and the fear of God)',

  // ── Spiritual Warfare & Inner Life ──
  'መንፈሳዊ ጦርነት — ከሰይጣን ማሸነፍ (Spiritual Warfare — defeating the enemy through prayer and fasting)',
  'ዓይነ ልቡና — መንፈሳዊ ማስተዋል (Spiritual Discernment — eyes of the heart)',
  'ከዓለም ፍቅር መላቀቅ (Detachment from Worldly Love — seeking heavenly treasures)',
  'የመንፈስ ቅዱስ ፍሬ (Fruit of the Holy Spirit — love, joy, peace, patience)',
  'ሕሊና — የውስጥ ድምፅ (Conscience — the inner voice of God)',
  'ክርስቲያናዊ ትዕግሥት በችግር ጊዜ (Christian Patience in Times of Crisis)',

  // ── Death, Afterlife & Eschatology ──
  'ሞት — ወደ ዘለዓለም ሕይወት መሸጋገሪያ (Death — gateway to eternal life)',
  'የመጨረሻው ፍርድ — ክርስቶስ ዳኛ ሆኖ ይመጣል (The Last Judgment — Christ returns as Judge)',
  'ገነት — የጻድቃን ዕረፍት ቦታ (Paradise — the resting place of the righteous)',
  'ተስፋ ትንሣኤ — ሥጋችን ይነሣል (Hope of Resurrection — our bodies will rise)',

  // ── EOTC Distinctive Traditions ──
  'የቂጤ ትምህርት — የቤተ ክርስቲያን ግጥም ባህል (Qine — the sacred poetry tradition of the EOTC)',
  'አቋቋም — የቅዱስ ያሬድ ውዝዋዜ (Aquaquam — St. Yared\'s sacred dance and movement)',
  'ጸሎተ ሐሙስ — የእግር ዕጥበት ምሥጢር (Maundy Thursday — the mystery of footwashing)',
  'ጥቅምት ጽዮን — ታቦቱ ወደ ኢትዮጵያ መምጣት (The Tabot\'s journey — from Jerusalem to Ethiopia)',
  'ውዳሴ ማርያም — ዘወትር የሚነበብ ምስጋና (Wudase Maryam — daily Marian praise)',
  'ሐመር — ግብረ ሕማማት ስነ-ስርዓት (Hamer — Good Friday liturgical procession)',
  'የደብር ሕይወት — ገዳማዊ ዲሲፕሊን (Monastery Life — rules of Ethiopian monastic discipline)',

  // ── Youth-Specific Challenges ──
  'ክርስቲያናዊ ማንነት በዘመናዊ ዓለም (Christian Identity in the Modern World)',
  'ከእኩያን ጓደኛ መራቅ (Avoiding Bad Company — choosing righteous friends)',
  'ሶሻል ሚዲያና መንፈሳዊ ሕይወት (Social Media and Spiritual Life — finding balance)',
  'ክርስቲያናዊ ፍቅርና ጋብቻ (Christian Love and Marriage — God\'s design)',
  'ትምህርትና ሥራ — ለእግዚአብሔር ክብር (Education and Work — for God\'s glory)'
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

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SELECTION — Best Free Models for Amharic/Ge'ez Content Generation
// ─────────────────────────────────────────────────────────────────────────────
// google/gemini-2.5-flash is the #1 choice:
//   ✅ Native Ethiopic tokenizer (zero Fidel character corruption)
//   ✅ 1,500 free requests/day via OpenRouter free tier
//   ✅ Best Amharic grammar comprehension of any free model
//   ✅ Fast response (2-4 seconds per call)
// NOTE: Bigger parameter count ≠ better Amharic. Gemini 2.5 Flash outperforms
// much larger English-centric models (e.g. Llama 70B) for Ethiopic scripts.
const PRIMARY_MODEL = 'google/gemini-2.5-flash';
const FALLBACK_MODELS = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-24b-instruct-2501:free'
];

async function callGoogleAIStudio(apiKey, model, systemPrompt, userPrompt, jsonMode) {
  let geminiModel = (model || 'gemini-2.5-flash').replace(/^google\//, '');
  if (!geminiModel.startsWith('gemini-')) {
    geminiModel = 'gemini-2.5-flash';
  }

  const endpoint = `${GOOGLE_AI_BASE_URL}/models/${geminiModel}:generateContent?key=${apiKey}`;
  const response = await axios.post(
    endpoint,
    {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: jsonMode ? 2048 : 500,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain'
      }
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Google AI Studio API');
  return text;
}

async function callOpenRouter(apiKey, model, systemPrompt, userPrompt, jsonMode) {
  const response = await axios.post(
    `${OPENROUTER_BASE_URL}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      // Amharic (Ethiopic Fidel) is 3 bytes/char and 2-4 tokens/word in BPE.
      // 5-slide carousels need ~1000+ tokens; reflections need ~1200+.
      // Previous limit of 600 caused mid-JSON truncation and silent fallbacks.
      max_tokens: jsonMode ? 2048 : 500,
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
  if (!content) throw new Error('Empty response from OpenRouter API');
  
  return content;
}

async function callAI(systemPrompt, userPrompt, jsonMode = false) {
  const orKey = OPENROUTER_API_KEY();
  const googleKey = GOOGLE_AI_STUDIO_API();

  if (!orKey && !googleKey) {
    throw new Error('Neither OPENROUTER_API_KEY nor GOOGLE_AI_STUDIO_API is configured');
  }

  const configuredModel = process.env.AI_MODEL || PRIMARY_MODEL;
  const strategies = [];

  // If OpenRouter is configured, try configured model and fallbacks
  if (orKey) {
    const orModels = [configuredModel, ...FALLBACK_MODELS.filter(m => m !== configuredModel)];
    for (const m of orModels) {
      strategies.push({ provider: 'openrouter', key: orKey, model: m });
    }
  }

  // If Google AI Studio is configured, add direct Gemini endpoints
  if (googleKey) {
    strategies.push({ provider: 'google', key: googleKey, model: 'gemini-2.5-flash' });
    strategies.push({ provider: 'google', key: googleKey, model: 'gemini-1.5-flash' });
  }

  return retryWithBackoff(async () => {
    let lastError = null;
    for (const strat of strategies) {
      try {
        console.log(`🧪 Trying AI [${strat.provider}]: ${strat.model}`);
        let content = '';
        if (strat.provider === 'google') {
          content = await callGoogleAIStudio(strat.key, strat.model, systemPrompt, userPrompt, jsonMode);
        } else {
          content = await callOpenRouter(strat.key, strat.model, systemPrompt, userPrompt, jsonMode);
        }
        
        // If it's JSON mode, verify it's valid JSON before returning
        if (jsonMode) {
          try {
            extractJSON(content); // Just to verify it's parseable
            return content;
          } catch (e) {
            console.warn(`⚠️ Model [${strat.provider}/${strat.model}] returned invalid JSON, trying next...`);
            lastError = new Error(`Invalid JSON from ${strat.model}`);
            continue;
          }
        }
        return content;
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        const msg = err.response?.data?.error?.message || err.message;
        console.error(`❌ AI [${strat.provider}/${strat.model}] failed (${status || 'Err'}): ${msg}`);
        continue;
      }
    }
    throw lastError || new Error('All AI models and providers failed');
  });
}

async function verifyAndCorrect(data, jsonMode = true) {
  const orKey = OPENROUTER_API_KEY();
  const googleKey = GOOGLE_AI_STUDIO_API();

  if (!orKey && !googleKey) {
    return data; // Demo mode fallback
  }

  const payload = jsonMode ? JSON.stringify(data, null, 2) : data;
  console.log(`\n🔍 Proofreading with Theological Auditor...`);
  
  return retryWithBackoff(async () => {
    try {
      let content = '';
      if (orKey) {
        try {
          content = await callOpenRouter(orKey, 'google/gemini-2.5-flash', AUDITOR_SYSTEM_PROMPT, `Please audit and correct the following content according to guidelines:\n\n${payload}`, jsonMode);
        } catch (orErr) {
          if (googleKey) {
            console.warn(`⚠️ OpenRouter auditor failed (${orErr.message}), falling back to Google AI Studio auditor...`);
            content = await callGoogleAIStudio(googleKey, 'gemini-2.5-flash', AUDITOR_SYSTEM_PROMPT, `Please audit and correct the following content according to guidelines:\n\n${payload}`, jsonMode);
          } else {
            throw orErr;
          }
        }
      } else if (googleKey) {
        content = await callGoogleAIStudio(googleKey, 'gemini-2.5-flash', AUDITOR_SYSTEM_PROMPT, `Please audit and correct the following content according to guidelines:\n\n${payload}`, jsonMode);
      }

      if (jsonMode) {
        return extractJSON(content);
      }
      return content;
    } catch (err) {
      console.error(`⚠️ Auditor failed, falling back to original content. Error: ${err.message}`);
      return data; // Fall back to original data instead of breaking pipeline
    }
  });
}

export function containsLatinWords(str) {
  if (typeof str !== 'string') return false;
  return /[a-zA-Z]{3,}/.test(str);
}

export function extractJSON(text) {
  try {
    // 1. Try to find JSON block in markdown
    let cleanText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1];
    }

    // 2. Try to find the outermost JSON structure (either { ... } or [ ... ])
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    // Choose whichever comes first
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    const lastBrace = cleanText.lastIndexOf('}');
    const lastBracket = cleanText.lastIndexOf(']');
    
    // Choose whichever comes last
    let endIdx = -1;
    if (lastBrace !== -1 && lastBracket !== -1) {
      endIdx = Math.max(lastBrace, lastBracket);
    } else if (lastBrace !== -1) {
      endIdx = lastBrace;
    } else if (lastBracket !== -1) {
      endIdx = lastBracket;
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanText = cleanText.substring(startIdx, endIdx + 1);
    }

    return JSON.parse(cleanText.trim());
  } catch (e) {
    log.error('JSON Extraction failed', { error: e.message, preview: typeof text === 'string' ? text.slice(0, 150) : text });
    throw new Error('Invalid JSON format from AI');
  }
}

export async function generateQuote(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Theme selected: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  try {
    const rawContent = await callAI(QUOTE_SYSTEM_PROMPT, `Theme: ${theme}${contextPrompt}`);
    const auditedContent = await verifyAndCorrect(rawContent, false);
    return { text: auditedContent, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateQuote failed (${err.message}). Using canonical scripture / patristic fallback.`);
    const patristic = Math.random() > 0.5 ? getVerifiedPatristicQuote(theme, liturgicalContext?.mood || '') : null;
    const canon = patristic ? { verse: patristic.teaching } : getVerifiedVerse(liturgicalContext?.mood || '', theme);
    return {
      text: canon?.verse || 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው? እግዚአብሔር የሕይወቴ ዕርዳታ ነው፤ የሚያስጨንቀኝ ማን ነው?',
      theme: theme.split(' ')[0],
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateDailyVerse(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Verse Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  try {
    const content = await callAI(VERSE_SYSTEM_PROMPT, `Provide an uplifting verse about: ${theme}${contextPrompt}`, true);
    const rawData = extractJSON(content);
    if (!rawData.verse || !rawData.reference) throw new Error('Missing verse or reference fields');
    const auditedData = await verifyAndCorrect(rawData, true);
    return { ...auditedData, liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateDailyVerse failed (${err.message}). Using verified canonical scripture fallback.`);
    const canon = getVerifiedVerse(liturgicalContext?.mood || '', theme);
    return {
      verse: canon.verse,
      reference: canon.reference,
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateCarousel(topic = null, liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : (topic || getRandomTheme());
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Carousel Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  try {
    const content = await callAI(CAROUSEL_SYSTEM_PROMPT, `Generate 5 slides about: ${theme}${contextPrompt}`, true);
    const rawSlides = extractJSON(content);
    if (!Array.isArray(rawSlides) || rawSlides.length !== 5) {
      throw new Error(`Expected 5 slides in array, got ${rawSlides.length || 0}`);
    }
    const auditedSlides = await verifyAndCorrect(rawSlides, true);
    return { slides: auditedSlides, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateCarousel failed (${err.message}). Using canonical 5-slide teaching.`);
    const cleanTheme = theme.split(' (')[0].split(':')[0];
    return {
      slides: [
        {
          title: `የ${cleanTheme} መንፈሳዊ መሠረት`,
          content: 'በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ቀኖና መሠረት ሃይማኖትና መንፈሳዊ ተጋድሎ የነፍስ መድኃኒት ናቸው።',
          reference: 'ዕብራውያን ፲፩፥፩'
        },
        {
          title: 'የቅዱሳት መጻሕፍት ምስክርነት',
          content: 'የእግዚአብሔር ቃል ሕያው ነውና የሚሠራም፤ በመንፈሳዊ ጉዞአችን ሁሉ መመሪያና ብርሃን ሆኖ ይመራናል።',
          reference: 'መዝሙረ ዳዊት ፻፲፱፥፻፭'
        },
        {
          title: 'የአበው ኦርቶዶክሳዊ ትምህርት',
          content: 'ቅዱሳን አባቶቻችን በጸሎትና በጾም፣ በቅዳሴና በማኅሌት እግዚአብሔርን በማገልገል የጽድቅን ጎዳና አሳይተውናል።',
          reference: 'ያዕቆብ ፪፥፳፮'
        },
        {
          title: 'ተግባራዊ ክርስቲያናዊ ሕይወት',
          content: 'ከኃጢአት በመራቅና ለድሆች በመራራት፣ በንስሐና በቅዱስ ቁርባን ዘወትር ከክርስቶስ ጋር እንኑር።',
          reference: '፩ኛ ዮሐንስ ፬፥፲፮'
        },
        {
          title: 'ተስፋና ዘለዓለማዊ በረከት',
          content: 'እስከ መጨረሻው የታመነ የሕይወትን አክሊል ይቀበላል፤ የእግዚአብሔር ጸጋና ሰላም ከሁላችን ጋር ይሁን።',
          reference: 'ራእይ ፪፥፲'
        }
      ],
      theme: cleanTheme,
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateWeeklyReflection(liturgicalContext = null) {
  const theme = liturgicalContext ? liturgicalContext.event : getRandomTheme();
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Reflection Theme: ${theme}${liturgicalContext ? ' (Liturgical)' : ''}`);
  try {
    const content = await callAI(REFLECTION_SYSTEM_PROMPT, `Write a deep reflection on: ${theme}${contextPrompt}`, true);
    const rawData = extractJSON(content);
    if (!rawData.title || !rawData.reflection || !rawData.prayer) {
      throw new Error('Missing required reflection fields');
    }
    const auditedData = await verifyAndCorrect(rawData, true);
    return { ...auditedData, theme: theme.split(' ')[0], liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateWeeklyReflection failed (${err.message}). Using canonical reflection fallback.`);
    const cleanTheme = theme.split(' (')[0].split(':')[0];
    return {
      title: `${cleanTheme} — ሳምንታዊ መንፈሳዊ አስተንትኖ`,
      scripture: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው? እግዚአብሔር የሕይወቴ ዕርዳታ ነው፤ የሚያስጨንቀኝ ማን ነው?',
      reference: 'መዝሙረ ዳዊት ፳፯፥፩',
      reflection: `በዕለታዊ ሕይወታችን ውስጥ የእግዚአብሔርን ረድኤትና ጥበቃ ማሰብ የኦርቶዶክሳዊ ክርስቲያን ዘወትራዊ ተግባር ነው። በሥራችንና በኑሮአችን ሁሉ የእርሱን ቸርነት ስናስብ መንፈሳችን በሰላም ይሞላል።\n\nቅዱሳት መጻሕፍት እንደሚያስተምሩን እውነተኛ እምነት በተግባር የሚገለጥ ነው። ፍቅር፣ ትሕትና፣ ይቅርታና ጸሎት የነፍስ መድኃኒቶች ናቸው። አባቶቻችን በገዳማትና በከተሞች ያስተማሩት ይኸው የጽድቅ መንገድ ነው።\n\nበመሆኑም በዘመናችን ለሚገጥሙን ፈተናዎች ሁሉ መፍትሔው ወደ እግዚአብሔር መቅረብና በንስሐ መኖር ነው። ቤተ ክርስቲያን በሥርዓተ ቅዳሴዋና በምሥጢራቷ ዘወትር የምታበረታታን ለዚህ ነው።`,
      prayer: 'አቤቱ አምላካችን ሆይ፣ በቸርነትህና በምሕረትህ ጠብቀን። ሃይማኖታችንን አጽናልን፤ ሰላምህንና በረከትህን ለሕዝብህ ሁሉ ስጥልን። አሜን።',
      theme: cleanTheme,
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateSaintOfDay(saintData, liturgicalContext = null) {
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  const cleanSaint = saintData.saint ? saintData.saint.split(' (')[0] : 'የዕለቱ ቅዱስ';
  const synaxarium = saintData.synaxarium || (saintData.day ? getSynaxariumEntry(saintData.day) : null);

  if (saintData.isLordFeast) {
    console.log(`🧠 AI Lord's Feast: ${cleanSaint}`);
  } else {
    console.log(`🧠 AI Saint: ${cleanSaint}`);
  }
  
  const synaxExcerpt = synaxarium?.synaxariumExcerpt || saintData.theme || '';
  let userPrompt = `ቅዱስ/በዓል: ${cleanSaint}\nየስንክሳር ታሪክ: ${synaxExcerpt}\n\nአስፈላጊ መመሪያ፡ ታሪኩንና መንፈሳዊ ትምህርቱን በሙሉ በንጹሕ አማርኛ (Amharic) ብቻ ጻፍ። እንግሊዝኛ ፈጽሞ አትጠቀም።${contextPrompt}`;
  if (saintData.isLordFeast) {
    userPrompt += `\n\n⚠️ THEOLOGICAL COMMAND (MANDATORY): Note that ${cleanSaint} is GOD (the Lord Jesus Christ / the Holy Trinity), NOT a saint or mere human. He is holy and perfect man and perfect God (Tewahedo doctrine). Make sure the generated story and lesson reflect His deity and perfect humanity, and NEVER refer to Him as a saint or a mere human. The feastType MUST be returned as "በዓል" (Feast) and never "ቅዱስ/ቅድስት" (Saint).`;
  }

  try {
    const content = await callAI(SAINT_SYSTEM_PROMPT, userPrompt, true);
    const rawData = extractJSON(content);
    const auditedData = await verifyAndCorrect(rawData, true);

    // Safeguard: verify no English words were generated
    if (containsLatinWords(auditedData.story) || containsLatinWords(auditedData.lesson) || containsLatinWords(auditedData.saint)) {
      throw new Error('AI output contained English words instead of pure Amharic');
    }

    return { ...auditedData, liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateSaintOfDay fallback (${err.message}). Using canonical Synaxarium entry.`);
    return {
      saint: synaxarium?.saint || cleanSaint,
      story: synaxarium?.synaxariumExcerpt || (saintData.theme && !containsLatinWords(saintData.theme) ? saintData.theme : 'በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ሥርዓት መሠረት የዚህ ቅዱስ መታሰቢያ በታላቅ ክብርና ጸሎት ይዘከራል።'),
      lesson: synaxarium?.spiritualLesson || 'በሃይማኖት መጽናትና እግዚአብሔርን በፍጹም ልብ ማገልገል የጽድቅ መንገድ ነው።',
      reference: 'ሮሜ ፰፥፲፰',
      feastType: (saintData.isLordFeast || synaxarium?.isLordFeast) ? 'የጌታ በዓል' : (saintData.type === 'feast' ? 'በዓል' : 'የቅዱስ ቀን'),
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateFastingGuide(fastingInfo, liturgicalContext = null) {
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Fasting Guide: ${fastingInfo.name}`);
  try {
    const content = await callAI(FASTING_SYSTEM_PROMPT, `Current fast: ${fastingInfo.name}\nDay ${fastingInfo.currentDay} of ${fastingInfo.totalDays}${contextPrompt}`, true);
    const rawData = extractJSON(content);
    const auditedData = await verifyAndCorrect(rawData, true);
    return { ...auditedData, liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateFastingGuide failed (${err.message}). Using canonical fasting fallback.`);
    return {
      title: `${fastingInfo.name} — የጾምና የጸሎት መመሪያ`,
      encouragement: 'ጾም የሥጋ ፈቃድን ለእግዚአብሔር ማስገዛትና ነፍስን በመንፈሳዊ ብርሃን ማደስ ነው። በጾማችን ወቅት በጸሎትና በምጽዋት እንትጋ።',
      rules: fastingInfo.rules || ['ከእንስሳት ተዋጽኦ መከልከል', 'በጸሎትና በንስሐ መትጋት', 'ለተራቡት ማካፈል'],
      reference: 'ማቴዎስ ፮፥፲፮',
      dayProgress: `ቀን ${fastingInfo.currentDay}/${fastingInfo.totalDays}`,
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateHolyWeekContent(holyWeekDay, liturgicalContext = null) {
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Holy Week: ${holyWeekDay.amharic}`);
  try {
    const content = await callAI(HOLY_WEEK_SYSTEM_PROMPT, `Day: ${holyWeekDay.amharic} (${holyWeekDay.english})\nTheme: ${holyWeekDay.theme}${contextPrompt}`, true);
    const rawData = extractJSON(content);
    const auditedData = await verifyAndCorrect(rawData, true);
    return { ...auditedData, dayName: holyWeekDay.amharic, subtitle: holyWeekDay.english, liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateHolyWeekContent failed (${err.message}). Using canonical Holy Week fallback.`);
    return {
      dayName: holyWeekDay.amharic,
      subtitle: holyWeekDay.english,
      teaching: 'በዚህ ታላቅ ሰሞን የጌታችንን ሕማማትና መስቀል እያሰብን በስግደትና በጸሎት ራሳችንን ለትንሣኤው ክብር እናዘጋጃለን።',
      scripture: 'እርሱ ግን ስለ መተላለፋችን ቈሰለ፥ ስለ በደላችንም ደቀቀ፤ የደኅንነታችንም ተግሣጽ በእርሱ ላይ ነበረ፥ በእርሱም ቍስል እኛ ተፈወስን።',
      reference: 'ኢሳይያስ ፶፫፥፭',
      hymn: 'ለከ ኃይል ክብር ወስብሐት ወእዘዝ ለዓለመ ዓለም።',
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function generateChurchHistory(historyTopic, liturgicalContext = null) {
  const contextPrompt = formatContextForPrompt(liturgicalContext);
  console.log(`🧠 AI Church History: ${historyTopic.title}`);
  try {
    const content = await callAI(CHURCH_HISTORY_SYSTEM_PROMPT, `Topic: ${historyTopic.title}\nEra: ${historyTopic.era}\nYear: ${historyTopic.year}\nContext: ${historyTopic.theme}${contextPrompt}\n\nአስፈላጊ መመሪያ፡ ታሪኩንና ትርጉሙን በሙሉ በንጹሕ አማርኛ (Amharic) ብቻ ጻፍ። እንግሊዝኛ ፈጽሞ አትጠቀም።`, true);
    const rawData = extractJSON(content);
    const auditedData = await verifyAndCorrect(rawData, true);

    if (containsLatinWords(auditedData.narrative) || containsLatinWords(auditedData.significance) || containsLatinWords(auditedData.title)) {
      throw new Error('AI Church History contained English words instead of pure Amharic');
    }

    return { ...auditedData, era: historyTopic.era, year: historyTopic.year, liturgicalEvent: liturgicalContext?.event || null };
  } catch (err) {
    console.warn(`⚠️ AI generateChurchHistory failed (${err.message}). Using canonical church history fallback.`);
    return {
      title: historyTopic.title,
      narrative: (historyTopic.theme && !containsLatinWords(historyTopic.theme)) ? historyTopic.theme : 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን የሁለት ሺሕ ዓመታት ታሪክ በመንፈሳዊ ጽናትና በቅዱሳን አባቶች ተጋድሎ የተመሠረተ ነው።',
      significance: 'ይህ ታሪካዊ ክስተት ዛሬም ለኦርቶዶክሳዊ ማንነታችንና ለእምነታችን ጽናት ታላቅ ትምህርት ነው።',
      era: historyTopic.era || 'የኢትዮጵያ ቤተ ክርስቲያን ታሪክ',
      year: historyTopic.year || '፪ሺህ ዓመታት',
      source: 'የኢትዮጵያ ቤተ ክርስቲያን ታሪክ — ቅዱስ ጳውሎስ ሥነ መለኮት ኮሌጅ',
      liturgicalEvent: liturgicalContext?.event || null
    };
  }
}

export async function translateToEnglish(amharicText) {
  console.log(`🌐 Translating to English...`);
  const translation = await callAI(BILINGUAL_SYSTEM_PROMPT, `Translate this Amharic text to elegant English:\n\n${amharicText}`, false);
  return translation.trim();
}

export async function testAIConnection() {
  const orKey = OPENROUTER_API_KEY();
  const googleKey = GOOGLE_AI_STUDIO_API();
  const configuredModel = process.env.AI_MODEL || PRIMARY_MODEL;

  const result = {
    configured: !!(orKey || googleKey),
    openRouterConfigured: !!orKey,
    googleAIStudioConfigured: !!googleKey,
    model: configuredModel,
    connected: false,
    latencyMs: 0
  };

  if (!result.configured) return result;

  const start = Date.now();
  try {
    const testPrompt = 'Write the word "ሰላም"';
    let reply = '';
    if (googleKey) {
      reply = await callGoogleAIStudio(googleKey, 'gemini-2.5-flash', 'You are a test assistant.', testPrompt, false);
      result.activeProvider = 'Google AI Studio (Gemini 2.5 Flash)';
    } else if (orKey) {
      reply = await callOpenRouter(orKey, configuredModel, 'You are a test assistant.', testPrompt, false);
      result.activeProvider = `OpenRouter (${configuredModel})`;
    }
    result.connected = !!reply;
    result.latencyMs = Date.now() - start;
    return result;
  } catch (err) {
    result.connected = false;
    result.error = err.message;
    result.latencyMs = Date.now() - start;
    return result;
  }
}

export function isConfigured() {
  return !!(OPENROUTER_API_KEY() || GOOGLE_AI_STUDIO_API());
}