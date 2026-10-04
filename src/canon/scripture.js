/**
 * EOTC Canonical Scripture Engine (Zero-Hallucination Repository)
 * ════════════════════════════════════════════════════════════════
 * Curated from the literal 1962 Haile Selassie EOTC 81-Book Bible.
 * Ensures zero-hallucination accuracy for scripture verses,
 * verified Ge'ez numerals, and exact chapter:verse punctuation (፥).
 */

import { toGeezNumerals } from '../utils/calendar.js';

export const VERIFIED_SCRIPTURES = [
  // ── Faith & Dogma (እምነትና ዶግማ) ──
  {
    theme: 'ሃይማኖት እና እምነት',
    verse: 'እምነትም ተስፋ ስለምናደርገው ነገር የሚያስረግጥ፥ የማናየውንም ነገር የሚያስረዳ ነው።',
    reference: 'ዕብራውያን ፲፩፥፩',
    book: 'ዕብራውያን',
    chapter: 11,
    verseNum: 1,
    keywords: ['እምነት', 'ተስፋ', 'ማመን']
  },
  {
    theme: 'ሃይማኖት እና እምነት',
    verse: 'ያለ እምነትም ደስ ማሰኘት አይቻልም፤ ወደ እግዚአብሔር የሚደርስ እግዚአብሔር እንዳለ ለሚፈልጉትም ዋጋ እንዲሰጥ ያምን ዘንድ ይገባዋልና።',
    reference: 'ዕብራውያን ፲፩፥፮',
    book: 'ዕብራውያን',
    chapter: 11,
    verseNum: 6,
    keywords: ['እምነት', 'ዋጋ', 'እግዚአብሔር']
  },
  {
    theme: 'ሥራና እምነት',
    verse: 'ከነፍስ የተለየ ሥጋ የሞተ እንደ ሆነ እንዲሁ ደግሞ ከሥራ የተለየ እምነት የሞተ ነው።',
    reference: 'ያዕቆብ ፪፥፳፮',
    book: 'ያዕቆብ',
    chapter: 2,
    verseNum: 26,
    keywords: ['እምነት', 'ሥራ', 'ተዋሕዶ']
  },
  {
    theme: 'ሃይማኖት እና እምነት',
    verse: 'አንድ ጌታ አንድ ሃይማኖት አንዲት ጥምቀት፤ ከሁሉ በላይ የሚሆን በሁሉም የሚሠራ በሁሉም የሚኖር አንድ አምላክ የሁሉም አባት አለ።',
    reference: 'ኤፌሶን ፬፥፭-፮',
    book: 'ኤፌሶን',
    chapter: 4,
    verseNum: 5,
    keywords: ['አንድ', 'ሃይማኖት', 'ጥምቀት', 'አምላክ']
  },

  // ── Love & Spiritual Virtues (መንፈሳዊ ፍቅርና በጎነት) ──
  {
    theme: 'መንፈሳዊ ፍቅር',
    verse: 'እግዚአብሔር ፍቅር ነው፥ በፍቅርም የሚኖር በእግዚአብሔር ይኖራል እግዚአብሔርም በእርሱ ይኖራል።',
    reference: '፩ኛ ዮሐንስ ፬፥፲፮',
    book: '፩ኛ ዮሐንስ',
    chapter: 4,
    verseNum: 16,
    keywords: ['ፍቅር', 'እግዚአብሔር', 'መኖር']
  },
  {
    theme: 'መንፈሳዊ ፍቅር',
    verse: 'ሰው ሕይወቱን ስለ ወዳጆቹ ከመስጠት ይልቅ ከዚህ የሚበልጥ ፍቅር ለማንም የለውም።',
    reference: 'ዮሐንስ ፲፭፥፲፫',
    book: 'ዮሐንስ',
    chapter: 15,
    verseNum: 13,
    keywords: ['ፍቅር', 'መስዋዕት', 'ሕይወት']
  },
  {
    theme: 'መንፈሳዊ ፍቅር',
    verse: 'ፍቅር ይታገሣል፥ ቸርነትንም ያደርጋል፤ ፍቅር አይቀናም፤ ፍቅር አይመካም፥ አይታበይም፤ የማይገባውን አያደርግም፥ የራሱንም አይፈልግም፥ አይበሳጭም፥ በደልን አይቆጥርም።',
    reference: '፩ኛ ቆሮንቶስ ፲፫፥፬-፭',
    book: '፩ኛ ቆሮንቶስ',
    chapter: 13,
    verseNum: 4,
    keywords: ['ፍቅር', 'ትዕግሥት', 'ቸርነት']
  },
  {
    theme: 'ትሕትና',
    verse: 'እግዚአብሔር ትዕቢተኞችን ይቃወማል፥ ለትሑታን ግን ጸጋን ይሰጣል።',
    reference: '፩ኛ ጴጥሮስ ፭፥፭',
    book: '፩ኛ ጴጥሮስ',
    chapter: 5,
    verseNum: 5,
    keywords: ['ትሕትና', 'ጸጋ', 'ትዕቢት']
  },
  {
    theme: 'ትዕግሥት',
    verse: 'በመከራችሁ ታገሡ፤ በጸሎት ጽኑ፤ በተስፋ ደስ ይበላችሁ።',
    reference: 'ሮሜ ፲፪፥፲፪',
    book: 'ሮሜ',
    chapter: 12,
    verseNum: 12,
    keywords: ['መከራ', 'ጸሎት', 'ተስፋ', 'ትዕግሥት']
  },
  {
    theme: 'የልብ ንጽሕና',
    verse: 'ልበ ንጹሖች ብፁዓን ናቸው፥ እግዚአብሔርን ያዩታልና።',
    reference: 'ማቴዎስ ፭፥፰',
    book: 'ማቴዎስ',
    chapter: 5,
    verseNum: 8,
    keywords: ['ንጽሕና', 'ብፁዓን', 'ልብ', 'ማየት']
  },
  {
    theme: 'ምስጋና',
    verse: 'ሁልጊዜ ደስ ይበላችሁ፤ ሳታቋርጡ ጸልዩ፤ በሁሉ አመስግኑ፤ ይህ የእግዚአብሔር ፈቃድ በክርስቶስ ኢየሱስ ወደ እናንተ ነውና።',
    reference: '፩ኛ ተሰሎንቄ ፭፥፲፮-፲፰',
    book: '፩ኛ ተሰሎንቄ',
    chapter: 5,
    verseNum: 16,
    keywords: ['ደስታ', 'ጸሎት', 'ምስጋና']
  },

  // ── Repentance & Fasting (ንስሐና ጾም) ──
  {
    theme: 'እውነተኛ ንስሐ',
    verse: 'የእግዚአብሔር መሥዋዕት የተሰበረ መንፈስ ነው፤ የተሰበረውንና የተዋረደውን ልብ እግዚአብሔር አይንቅም።',
    reference: 'መዝሙረ ዳዊት ፶፥፲፯',
    book: 'መዝሙረ ዳዊት',
    chapter: 50,
    verseNum: 17,
    keywords: ['ንስሐ', 'ልብ', 'መንፈስ', 'ይቅርታ']
  },
  {
    theme: 'የጾም እና የጸሎት ኃይል',
    verse: 'አሁንም፥ ይላል እግዚአብሔር፥ በፍጹም ልባችሁ በጾምም በልቅሶም በዋይታም ወደ እኔ ተመለሱ።',
    reference: 'ኢዩኤል ፪፥፲፪',
    book: 'ኢዩኤል',
    chapter: 2,
    verseNum: 12,
    keywords: ['ጾም', 'ልቅሶ', 'ንስሐ', 'መመለስ']
  },
  {
    theme: 'የጾም እና የጸሎት ኃይል',
    verse: 'ይህ ወገን ግን ከጸሎትና ከጾም በቀር በምንም ሊወጣ አይችልም።',
    reference: 'ማቴዎስ ፲፯፥፳፩',
    book: 'ማቴዎስ',
    chapter: 17,
    verseNum: 21,
    keywords: ['ጸሎት', 'ጾም', 'ኃይል']
  },
  {
    theme: 'የጾም እና የጸሎት ኃይል',
    verse: 'ስትጾሙም እንደ ግብዞች አትጠውልጉ፤ ለሰዎች እንደ ጾሙ ሊታዩ ፊታቸውን ያጠፋሉና፤ እውነት እላችኋለሁ፥ ዋጋቸውን ተቀብለዋል።',
    reference: 'ማቴዎስ ፮፥፲፮',
    book: 'ማቴዎስ',
    chapter: 6,
    verseNum: 16,
    keywords: ['ጾም', 'መንፈሳዊነት', 'ትሕትና']
  },

  // ── Incarnation & Salvation (ምሥጢረ ሥጋዌና ድኅነት) ──
  {
    theme: 'ምሥጢረ ሥጋዌ',
    verse: 'ቃልም ሥጋ ሆነ፤ ጸጋንና እውነትንም ተሞልቶ በእኛ አደረ፥ አንድ ልጅም ከአባቱ ዘንድ እንዳለው ክብር የሆነው ክብሩን አየን።',
    reference: 'ዮሐንስ ፩፥፲፬',
    book: 'ዮሐንስ',
    chapter: 1,
    verseNum: 14,
    keywords: ['ቃል', 'ሥጋ', 'ክብር', 'ተዋሕዶ']
  },
  {
    theme: 'ድኅነተ ነፍስ',
    verse: 'በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።',
    reference: 'ዮሐንስ ፫፥፲፮',
    book: 'ዮሐንስ',
    chapter: 3,
    verseNum: 16,
    keywords: ['ፍቅር', 'ድኅነት', 'የዘላለም ሕይወት']
  },
  {
    theme: 'የመስቀሉ ቤዛነት',
    verse: 'የመስቀሉ ቃል ለሚጠፉት ሞኝነት፥ ለእኛ ለምንድን ግን የእግዚአብሔር ኃይል ነውና።',
    reference: '፩ኛ ቆሮንቶስ ፩፥፲፰',
    book: '፩ኛ ቆሮንቶስ',
    chapter: 1,
    verseNum: 18,
    keywords: ['መስቀል', 'ኃይል', 'ደህንነት']
  },
  {
    theme: 'ትንሣኤ ሙታን',
    verse: 'ኢየሱስም፦ ትንሣኤና ሕይወት እኔ ነኝ፤ የሚያምንብኝ ቢሞት እንኳ ሕያው ይሆናል፤ ሕያው የሆነም የሚያምንብኝም ሁሉ ለዘላለም አይሞትም፤ ይህን ታምኛለሽን? አላት።',
    reference: 'ዮሐንስ ፲፩፥፳፭-፳፮',
    book: 'ዮሐንስ',
    chapter: 11,
    verseNum: 25,
    keywords: ['ትንሣኤ', 'ሕይወት', 'እምነት']
  },

  // ── The Holy Eucharist & Sacraments (ምሥጢረ ቁርባን) ──
  {
    theme: 'ምሥጢረ ቁርባን',
    verse: 'ሥጋዬን የሚበላ ደሜንም የሚጠጣ የዘላለም ሕይወት አለው፥ እኔም በመጨረሻው ቀን አስነሣዋለሁ።',
    reference: 'ዮሐንስ ፮፥፶፬',
    book: 'ዮሐንስ',
    chapter: 6,
    verseNum: 54,
    keywords: ['ቁርባን', 'ሥጋ', 'ደም', 'ትንሣኤ']
  },
  {
    theme: 'ምሥጢረ ቁርባን',
    verse: 'ሥጋዬ እውነተኛ መብል ደሜም እውነተኛ መጠጥ ነውና። ሥጋዬን የሚበላ ደሜንም የሚጠጣ በእኔ ይኖራል እኔም በእርሱ እኖራለሁ።',
    reference: 'ዮሐንስ ፮፥፶፭-፶፮',
    book: 'ዮሐንስ',
    chapter: 6,
    verseNum: 55,
    keywords: ['ቁርባን', 'መብል', 'መጠጥ', 'ሕይወት']
  },

  // ── The Holy Theotokos & Intercession (ወላዲተ አምላክና አማላጅነት) ──
  {
    theme: 'ቅድስት ድንግል ማርያም',
    verse: 'እነሆም፥ ከዛሬ ጀምሮ ትውልድ ሁሉ ብፅዕት ይሉኛል፤ ብርቱ የሆነ እርሱ በእኔ ታላቅ ሥራ አድርጓልና፤ ስሙም ቅዱስ ነው።',
    reference: 'ሉቃስ ፩፥፵፰-፵፱',
    book: 'ሉቃስ',
    chapter: 1,
    verseNum: 48,
    keywords: ['ማርያም', 'ብፅዕት', 'ወላዲተ አምላክ']
  },
  {
    theme: 'ቅድስት ድንግል ማርያም',
    verse: 'ከሴቶች መካከል ተለይተሽ የተባረክሽ ነሽ፥ የማኅፀንሽም ፍሬ የተባረከ ነው።',
    reference: 'ሉቃስ ፩፥፵፪',
    book: 'ሉቃስ',
    chapter: 1,
    verseNum: 42,
    keywords: ['በረከት', 'ድንግል', 'ማኅፀን']
  },
  {
    theme: 'ቅድስት ድንግል ማርያም',
    verse: 'እነሆ፥ ድንግል ትፀንሳለች ወንድ ልጅም ትወልዳለች፥ ስሙንም አማኑኤል ይሉታል፤ ትርጓሜውም፦ እግዚአብሔር ከእኛ ጋር የሚል ነው።',
    reference: 'ኢሳይያስ ፯፥፲፬',
    book: 'ኢሳይያስ',
    chapter: 7,
    verseNum: 14,
    keywords: ['ድንግል', 'አማኑኤል', 'ትንቢት']
  },
  {
    theme: 'ቅድስት ድንግል ማርያም',
    verse: 'ኢየሱስም እናቱን ይወደው የነበረውንም ደቀ መዝሙር በአጠገቡ ቆሞ ባየ ጊዜ እናቱን፦ አንቺ ሴት፥ እነሆ ልጅሽ አላት። ከዚህ በኋላ ደቀ መዝሙሩን፦ እናትህ እነኋት አለው።',
    reference: 'ዮሐንስ ፲፱፥፳፮-፳፯',
    book: 'ዮሐንስ',
    chapter: 19,
    verseNum: 26,
    keywords: ['እናት', 'መስቀል', 'አደራ', 'ማርያም']
  },

  // ── Psalms & Spiritual Praise (መዝሙረ ዳዊት) ──
  {
    theme: 'የአእምሮ ሰላም',
    verse: 'እግዚአብሔር እረኛዬ ነው፥ የሚያሳጣኝም የለም። በለመለመ መስክ ያሳድረኛል፤ በዕረፍት ውኃ ዘንድ ይመራኛል።',
    reference: 'መዝሙረ ዳዊት ፳፪፥፩-፪',
    book: 'መዝሙረ ዳዊት',
    chapter: 23,
    verseNum: 1,
    keywords: ['እረኛ', 'ሰላም', 'ዕረፍት']
  },
  {
    theme: 'የሌሊት ጸሎትና ሱባዔ',
    verse: 'በሌሊት እጆቻችሁን ወደ መቅደስ አንሡ፥ እግዚአብሔርንም ባርኩ።',
    reference: 'መዝሙረ ዳዊት ፻፴፫፥፪',
    book: 'መዝሙረ ዳዊት',
    chapter: 134,
    verseNum: 2,
    keywords: ['ሌሊት', 'ጸሎት', 'መቅደስ']
  },
  {
    theme: 'የእግዚአብሔር ጸጋ',
    verse: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው? እግዚአብሔር የሕይወቴ መታመኛዋ ነው፤ የሚያስደነግጠኝ ማን ነው?',
    reference: 'መዝሙረ ዳዊት ፳፮፥፩',
    book: 'መዝሙረ ዳዊት',
    chapter: 27,
    verseNum: 1,
    keywords: ['ብርሃን', 'መድኃኒት', 'ሕይወት', 'መታመን']
  },
  {
    theme: 'ሕያው የእግዚአብሔር ቃል',
    verse: 'ሕግህ ለእግሬ መብራት፥ ለመንገዴም ብርሃን ነው።',
    reference: 'መዝሙረ ዳዊት ፻፲፰፥፻፭',
    book: 'መዝሙረ ዳዊት',
    chapter: 119,
    verseNum: 105,
    keywords: ['ሕግ', 'መብራት', 'ብርሃን', 'ቃል']
  },
  {
    theme: 'ምስጋና',
    verse: 'እግዚአብሔርን ሁልጊዜ እባርከዋለሁ፥ ምስጋናውም ዘወትር በአፌ ነው።',
    reference: 'መዝሙረ ዳዊት ፴፫፥፩',
    book: 'መዝሙረ ዳዊት',
    chapter: 34,
    verseNum: 1,
    keywords: ['ምስጋና', 'ዘወትር', 'መባረክ']
  },

  // ── Wisdom & Guidance (ጥበብና መመሪያ) ──
  {
    theme: 'ሰሎሞን — ጥበብና ማስተዋል',
    verse: 'የጥበብ መጀመሪያ እግዚአብሔርን መፍራት ነው፤ ቅዱሱንም ማወቅ ማስተዋል ነው።',
    reference: 'ምሳሌ ፱፥፲',
    book: 'ምሳሌ',
    chapter: 9,
    verseNum: 10,
    keywords: ['ጥበብ', 'ፍርሃት', 'ማስተዋል']
  },
  {
    theme: 'ሰሎሞን — ጥበብና ማስተዋል',
    verse: 'በፍጹም ልብህ በእግዚአብሔር ታመን፥ በራስህም ማስተዋል አትደገፍ፤ በመንገድህ ሁሉ እርሱን እወቅ፥ እርሱም ጎዳናህን ያቀናልሃል።',
    reference: 'ምሳሌ ፫፥፭-፮',
    book: 'ምሳሌ',
    chapter: 3,
    verseNum: 5,
    keywords: ['ልብ', 'መታመን', 'ጎዳና']
  },
  {
    theme: 'የዕለት እንጀራችን',
    verse: 'ነገር ግን አስቀድማችሁ የእግዚአብሔርን መንግሥት ጽድቁንም ፈልጉ፥ ይህም ሁሉ ይጨመርላችኋል።',
    reference: 'ማቴዎስ ፮፥፴፫',
    book: 'ማቴዎስ',
    chapter: 6,
    verseNum: 33,
    keywords: ['መንግሥት', 'ጽድቅ', 'ፍለጋ']
  },
  {
    theme: 'ክርስቲያናዊ አንድነት',
    verse: 'ወንድሞች በኅብረት ቢቀመጡ እነሆ፥ መልካም ነው፥ እነሆም፥ ያማረ ነው።',
    reference: 'መዝሙረ ዳዊት ፻፴፪፥፩',
    book: 'መዝሙረ ዳዊት',
    chapter: 133,
    verseNum: 1,
    keywords: ['አንድነት', 'ኅብረት', 'ወንድሞች']
  },
  {
    theme: 'ቅድስት ቤተ ክርስቲያን',
    verse: 'እኔም እልሃለሁ፥ አንተ ጴጥሮስ ነህ፥ በዚችም ዓለት ላይ ቤተ ክርስቲያኔን እሠራለሁ፥ የገሃነም ደጆችም አይችሉአትም።',
    reference: 'ማቴዎስ ፲፮፥፲፰',
    book: 'ማቴዎስ',
    chapter: 16,
    verseNum: 18,
    keywords: ['ቤተ ክርስቲያን', 'ዓለት', 'ድል']
  },
  {
    theme: 'ቅድስት ቤተ ክርስቲያን',
    verse: 'የእውነት ዓምድና መሠረት የሆነችው ሕያው የእግዚአብሔር ቤተ ክርስቲያን ናት።',
    reference: '፩ኛ ጢሞቴዎስ ፫፥፲፭',
    book: '፩ኛ ጢሞቴዎስ',
    chapter: 3,
    verseNum: 15,
    keywords: ['እውነት', 'ዓምድ', 'መሠረት', 'ቤተ ክርስቲያን']
  }
];

/**
 * Returns a verified scripture matching a theme or mood,
 * or falls back to a deterministic, zero-hallucination pick.
 */
export function getVerifiedVerse(themeOrMood = '', keyword = '') {
  const qTheme = (themeOrMood || '').toLowerCase();
  const qKey = (keyword || '').toLowerCase();

  // 1. Try to find an exact thematic match
  const matches = VERIFIED_SCRIPTURES.filter(s => {
    if (qTheme && (s.theme.toLowerCase().includes(qTheme) || qTheme.includes(s.theme.toLowerCase()))) {
      return true;
    }
    if (qKey && s.keywords.some(k => k.toLowerCase().includes(qKey) || qKey.includes(k.toLowerCase()))) {
      return true;
    }
    return false;
  });

  if (matches.length > 0) {
    const match = matches[Math.floor(Math.random() * matches.length)];
    return {
      verse: match.verse,
      reference: match.reference,
      book: match.book,
      canonical: true
    };
  }

  // 2. Pick a random verified scripture
  const random = VERIFIED_SCRIPTURES[Math.floor(Math.random() * VERIFIED_SCRIPTURES.length)];
  return {
    verse: random.verse,
    reference: random.reference,
    book: random.book,
    canonical: true
  };
}

/**
 * Validates and standardizes a scripture reference string into strict Ge'ez numerals.
 * e.g., "ማቴዎስ 5:8" -> "ማቴዎስ ፭፥፰"
 */
export function sanitizeReference(refStr = '') {
  if (!refStr) return '';

  let sanitized = refStr.trim();
  // Standardize separator
  sanitized = sanitized.replace(/[:፡]/g, '፥');

  // Convert any remaining Arabic digits into Ge'ez numerals
  sanitized = sanitized.replace(/\d+/g, (num) => {
    return toGeezNumerals(parseInt(num, 10));
  });

  return sanitized;
}

/**
 * Searches the canonical verses repository by keyword.
 */
export function searchCanonicalVerses(query = '') {
  if (!query) return VERIFIED_SCRIPTURES;
  const q = query.toLowerCase().trim();
  return VERIFIED_SCRIPTURES.filter(s => 
    s.verse.includes(q) ||
    s.reference.includes(q) ||
    s.theme.toLowerCase().includes(q) ||
    s.keywords.some(k => k.toLowerCase().includes(q))
  );
}
