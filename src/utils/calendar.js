/**
 * EOTC Liturgical Calendar Engine
 * ================================
 * Converts Gregorian dates to the Ethiopian calendar comprehensively determining
 * the current liturgical season, feast, fasting week, or daily saint commemoration.
 * Features: True Bahire Hasab (Computus) for moveable feasts, 30-day commemorations, and Zemene (Seasons).
 */

// ─── Ethiopian Calendar Conversion ──────────────────────────────────────────

export function toEthiopianDate(gregorianDate = new Date()) {
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1; // 1-indexed
  const gDay = gregorianDate.getDate();

  const isBeforeNewYear = gMonth < 9 || (gMonth === 9 && gDay < 11);
  const isLeapYear = (gYear % 4 === 3);
  const newYearDay = (isLeapYear && gMonth === 9) ? 12 : 11;
  const isBeforeNewYearExact = gMonth < 9 || (gMonth === 9 && gDay < newYearDay);
  
  const ethYear = isBeforeNewYearExact ? gYear - 8 : gYear - 7;
  const newYearGregorian = new Date(isBeforeNewYearExact ? gYear - 1 : gYear, 8, isBeforeNewYearExact && ((gYear-1) % 4 === 3) ? 12 : 11);
  
  const diffMs = gregorianDate.getTime() - newYearGregorian.getTime();
  const dayOfEthYear = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let ethMonth, ethDay;

  if (dayOfEthYear < 0) {
    ethMonth = 13; 
    ethDay = 30 + dayOfEthYear + 1;
  } else if (dayOfEthYear < 360) {
    ethMonth = Math.floor(dayOfEthYear / 30) + 1;
    ethDay = (dayOfEthYear % 30) + 1;
  } else {
    ethMonth = 13; 
    ethDay = dayOfEthYear - 360 + 1;
  }

  return { year: ethYear, month: ethMonth, day: ethDay };
}

// ─── Constants & Reference Arrays ───────────────────────────────────────────

const ETHIOPIAN_MONTHS = {
  1: 'Meskerem', 2: 'Tikimt', 3: 'Hidar', 4: 'Tahsas',
  5: 'Tir', 6: 'Yekatit', 7: 'Megabit', 8: 'Miyazya',
  9: 'Ginbot', 10: 'Sene', 11: 'Hamle', 12: 'Nehase', 13: 'Pagume'
};

const DAILY_COMMEMORATIONS = {
  1:  { saint: 'Lideta Mariam & Elyas', theme: 'The birth of the Virgin Mary, and the zeal of Elijah the Prophet', type: 'saint' },
  2:  { saint: 'Thaddeus the Apostle', theme: 'The apostolic mission and spreading the Gospel to the ends of the earth', type: 'saint' },
  3:  { saint: 'Ba\'eta (Presentation of Mary)', theme: 'The presentation of Mary in the Temple, dedication to God, and prophetic wisdom', type: 'saint' },
  4:  { saint: 'Yohannes Wolde Negedgwad', theme: 'John the Son of Thunder, deep theological revelation and divine love', type: 'saint' },
  5:  { saint: 'Abune Gebre Menfes Kidus', theme: 'Extreme asceticism, holiness, and the pillars of the Church', type: 'saint' },
  6:  { saint: 'Kusquam (Flight to Egypt)', theme: 'The hardship of the Holy Family in exile and God’s protection', type: 'saint' },
  7:  { saint: 'Holy Trinity (Selassie)', theme: 'The Mystery of the Holy Trinity — Father, Son, and Holy Spirit', type: 'feast' },
  8:  { saint: 'Abba Kiros & The Cherubim', theme: 'Monastic devotion and the heavenly hosts guarding the throne of God', type: 'saint' },
  9:  { saint: 'Thomas the Apostle', theme: 'Faith overcoming doubt and witnessing the Resurrection', type: 'saint' },
  10: { saint: 'Meskel (The Holy Cross)', theme: 'The power of the True Cross, salvation, and victory over darkness', type: 'feast' },
  11: { saint: 'Hanna & Joachim', theme: 'The righteous parents of the Virgin Mary and patient, unwavering faith', type: 'saint' },
  12: { saint: 'St. Michael the Archangel', theme: 'The protection of the Archangel Michael, spiritual warfare, and divine guardianship', type: 'saint' },
  13: { saint: 'St. Rufael the Archangel', theme: 'Archangel Raphael, divine healing, and answered prayers', type: 'saint' },
  14: { saint: 'Abune Aregawi & Gebre Kristos', theme: 'Monastic foundation, grace, and forsaking worldly riches for Christ', type: 'saint' },
  15: { saint: 'Kirkos & Iyeluta', theme: 'The steadfast faith of the child martyr Kirkos and his mother in the face of fire', type: 'saint' },
  16: { saint: 'Kidane Mihret (Covenant of Mercy)', theme: 'The infinite mercy of the Virgin Mary and her covenant of intercession for humanity', type: 'feast' },
  17: { saint: 'Estifanos (St. Stephen)', theme: 'The courage of St. Stephen, the first martyr, and forgiving one\'s enemies', type: 'saint' },
  18: { saint: 'Ewostatewos (Eustathius)', theme: 'Apostolic teaching, Sabbath observance, and monastic reform', type: 'saint' },
  19: { saint: 'St. Gabriel the Archangel', theme: 'The Archangel Gabriel, divine messages, and the Annunciation', type: 'saint' },
  20: { saint: 'Hnstata', theme: 'Building of the Church and congregational unity in Christ', type: 'saint' },
  21: { saint: 'Kidist Mariam (The Virgin Mary)', theme: 'The purity, grace, and intercession of the Blessed Virgin Mary, Mother of God', type: 'saint' },
  22: { saint: 'St. Urael the Archangel', theme: 'Archangel Uriel, the cup of salvation, and illumination of wisdom', type: 'saint' },
  23: { saint: 'St. George (Giorgis)', theme: 'The courage and unyielding faith of St. George, martyrdom, and spiritual victory', type: 'saint' },
  24: { saint: 'Tekle Haymanot', theme: 'The great Ethiopian saint, extreme prayer, spreading the Gospel, and spiritual fathers', type: 'saint' },
  25: { saint: 'Merkorewos (Mercurius)', theme: 'The heroic martyr Mercurius and standing firm for Christ against the world', type: 'saint' },
  26: { saint: 'Yosef (Joseph the Carpenter)', theme: 'The righteous Guardian, quiet obedience to God, and protecting the Holy Family', type: 'saint' },
  27: { saint: 'Medhane Alem (Savior of the World)', theme: 'Jesus Christ as the Savior of all humanity, redemption on the Cross, and eternal life', type: 'feast' },
  28: { saint: 'Amanuael (Emmanuel)', theme: 'God with us — the incarnation of Christ and His abiding presence with humanity', type: 'feast' },
  29: { saint: 'Bale Wold (Feast of God the Son)', theme: 'The incarnation, divine love, and the mystery of salvation through the Son', type: 'feast' },
  30: { saint: 'Markos (Mark the Evangelist)', theme: 'The roar of the Gospel, spreading the Good News, and the foundation of the Church', type: 'saint' }
};

const MAJOR_FIXED_FEASTS = [
  { month: 1, day: 1,  name: 'Enkutatash (Ethiopian New Year)', theme: 'New beginnings, gratitude, renewal of faith, and the beauty of creation', type: 'major_feast', mood: 'joyful' },
  { month: 1, day: 17, name: 'Meskel (Finding of the True Cross)', theme: 'The discovery of the True Cross by Queen Helena, the light of Christ conquering darkness', type: 'major_feast', mood: 'triumphant' },
  { month: 4, day: 29, name: 'Genna (Ethiopian Christmas)', theme: 'The birth of Jesus Christ in Bethlehem, divine humility, the light entering the world', type: 'major_feast', mood: 'joyful' },
  { month: 5, day: 11, name: 'Timkat (Epiphany / Baptism of Christ)', theme: 'The baptism of Jesus in the Jordan River, spiritual cleansing, and the Holy Trinity', type: 'major_feast', mood: 'celebratory' },
  { month: 12, day: 16, name: 'Filseta (Assumption of Mary)', theme: 'The Assumption of the Blessed Virgin Mary into heaven, her eternal glory and intercession', type: 'major_feast', mood: 'celebratory' },
];

const FIXED_FASTS = [
  { name: 'Tsome Nebiyat (Prophets Fast)', startMonth: 3, startDay: 15, endMonth: 4, endDay: 28, theme: 'Preparation for the coming of Christ, prophetic anticipation, and repentance', mood: 'contemplative' },
  { name: 'Tsome Filseta (Fast of the Assumption)', startMonth: 12, startDay: 1, endMonth: 12, endDay: 15, theme: 'Devotion to the Virgin Mary, spiritual surrender, and imitating her purity', mood: 'contemplative' },
  { name: 'Gahad (Vigil of Christmas)', startMonth: 4, startDay: 28, endMonth: 4, endDay: 28, theme: 'Strict preparation, intense fasting, and waiting for the morning light of Christ', mood: 'penitential' },
  { name: 'Gahad (Vigil of Epiphany)', startMonth: 5, startDay: 10, endMonth: 5, endDay: 10, theme: 'Intense purification before the waters of Epiphany and spiritual renewal', mood: 'penitential' }
];

// ─── Bahire Hasab (Computus) ────────────────────────────────────────────────

function offsetEthDate(eDate, days) {
  let newDay = eDate.day + days;
  let newMonth = eDate.month;
  let newYear = eDate.year;
  
  while(newDay > 30) {
    if (newMonth === 13) {
       newDay -= (newYear % 4 === 3 ? 6 : 5);
       newMonth = 1;
       newYear++;
    } else {
       newDay -= 30;
       newMonth++;
    }
  }
  while(newDay < 1) {
     if (newMonth === 1) {
        newMonth = 13;
        newYear--;
        newDay += (newYear % 4 === 3 ? 6 : 5);
     } else {
        newMonth--;
        newDay += 30;
     }
  }
  return { year: newYear, month: newMonth, day: newDay };
}

function calculateMoveableFeasts(ethYear) {
  const gYear = ethYear + 8; // Safely approximate the Gregorian year for Easter
  
  // Julian Easter (Meeus/Jones/Butcher algorithm)
  const a = gYear % 4;
  const b = gYear % 7;
  const c = gYear % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  
  // Convert Julian date to Gregorian (+13 days valid until 2100)
  const gregorianEasterDate = new Date(gYear, month - 1, day + 13);
  const ethEaster = toEthiopianDate(gregorianEasterDate);
  const fasika = ethEaster;

  return {
    nenewe: offsetEthDate(fasika, -69),
    abiyTsomStart: offsetEthDate(fasika, -55),
    debreZeit: offsetEthDate(fasika, -28),
    hosanna: offsetEthDate(fasika, -7),
    hqmuss: offsetEthDate(fasika, -3), // Tselote Hamus (Maundy Thursday)
    siklet: offsetEthDate(fasika, -2), // Siklet (Good Friday)
    fasika: fasika,
    erget: offsetEthDate(fasika, +39),
    perakletos: offsetEthDate(fasika, +49),
    tsomeHawariatStart: offsetEthDate(fasika, +50)
  };
}

function isSameEthDate(d1, d2) {
  return d1.month === d2.month && d1.day === d2.day;
}

function isEthDateInRange(date, start, end) {
  const c = date.month * 100 + date.day;
  const s = start.month * 100 + start.day;
  const e = end.month * 100 + end.day;
  if (s <= e) return c >= s && c <= e;
  return c >= s || c <= e; // Handles year wrap
}

// ─── Lenten Weeks (8 Sundays of Abiy Tsom) ──────────────────────────────────
const LENTEN_WEEKS = [
  { name: 'Zewerede (He Who Descended)', theme: 'The incarnation of Christ who came down from Heaven for our salvation' },
  { name: 'Kidist (Holy)', theme: 'The holiness of God and our calling to live sanctified lives' },
  { name: 'Mikurab (The Temple)', theme: 'Christ teaching in the Temple and cleansing our bodies as the temple of the Holy Spirit' },
  { name: 'Metsagu (The Infirm)', theme: 'Christ healing the paralytic, representing spiritual healing and liberation from sin' },
  { name: 'Debre Zeit (Mount of Olives)', theme: 'The Second Coming of Christ, preparedness, and eternal judgment' },
  { name: 'Gebir Her (Faithful Servant)', theme: 'Using our God-given talents and remaining faithful servants to the Lord' },
  { name: 'Nicodimos (Nicodemus)', theme: 'Being born again in spirit, seeking Christ in the darkness, and true conversion' },
  { name: 'Hosanna (Palm Sunday)', theme: 'The triumphal entry of Jesus into Jerusalem, declaring Him as the true King of Peace' }
];

// ─── Main Liturgical Context Engine ─────────────────────────────────────────

export function getLiturgicalContext(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  const ethMonthName = ETHIOPIAN_MONTHS[ethDate.month] || 'Unknown';
  const gDayOfWeek = date.getDay(); // 0: Sun, 3: Wed, 5: Fri

  console.log(`📅 Ethiopian Date: ${ethMonthName} ${ethDate.day}, ${ethDate.year}`);

  // Calculate Moveable Feasts using Bahire Hasab
  const moveables = calculateMoveableFeasts(ethDate.year);

  // 1. Check Moveable Major Feasts (Highest Priority)
  if (isSameEthDate(ethDate, moveables.fasika)) return createFeast('Fasika (Easter Resurrection)', 'The glorious Resurrection of Jesus Christ conquering death, the greatest feast of the Church', 'major_feast', 'triumphant', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.erget)) return createFeast('Erget (Ascension)', 'The Ascension of Christ into heaven in glory, seated at the right hand of the Father', 'major_feast', 'celebratory', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.perakletos)) return createFeast('Perakletos (Pentecost)', 'The descent of the Holy Spirit upon the Apostles, empowering the Church', 'major_feast', 'joyful', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.hosanna)) return createFeast('Hosanna (Palm Sunday)', 'The triumphal entry into Jerusalem, declaring Jesus as King of Peace', 'major_feast', 'joyful', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.siklet)) return createFeast('Siklet (Good Friday)', 'The profound sacrifice of Christ on the cross, His pure love and our redemption', 'feast', 'penitential', ethDate, ethMonthName);

  // 2. Check Fixed Major Feasts
  for (const feast of MAJOR_FIXED_FEASTS) {
    if (ethDate.month === feast.month && ethDate.day === feast.day) {
      return createFeast(feast.name, feast.theme, feast.type, feast.mood, ethDate, ethMonthName);
    }
  }

  // 3. Check Moveable Fasts (Bahire Hasab Ranges)
  // Abiy Tsom (Great Lent) -> 55 Days before Easter
  if (isEthDateInRange(ethDate, moveables.abiyTsomStart, offsetEthDate(moveables.fasika, -1))) {
    // Determine the specific Lenten Week if it's a Sunday
    if (gDayOfWeek === 0) { // Sunday
      const daysSinceStart = (ethDate.month * 30 + ethDate.day) - (moveables.abiyTsomStart.month * 30 + moveables.abiyTsomStart.day);
      let weekIndex = Math.floor(daysSinceStart / 7);
      if (weekIndex >= 0 && weekIndex < LENTEN_WEEKS.length) {
         return createFast(LENTEN_WEEKS[weekIndex].name, LENTEN_WEEKS[weekIndex].theme, 'abiy_tsom_sunday', 'contemplative', ethDate, ethMonthName);
      }
    }
    // Generic Great Lent Day
    return createFast('Abiy Tsom (Great Lent)', 'Deep repentance, intense fasting, spiritual warfare, and preparation for the Resurrection', 'fasting_season', 'penitential', ethDate, ethMonthName);
  }

  // Tsome Nenewe (Fast of Nineveh) -> 3 days
  if (isEthDateInRange(ethDate, moveables.nenewe, offsetEthDate(moveables.nenewe, 2))) {
    return createFast('Tsome Nenewe (Fast of Nineveh)', 'The repentance of Nineveh: turning away from sin and trusting in God\'s ultimate mercy and forgiveness', 'fasting_season', 'penitential', ethDate, ethMonthName);
  }

  // Tsome Hawariat (Apostles Fast) -> From Pentecost to Hamle 5
  if (isEthDateInRange(ethDate, moveables.tsomeHawariatStart, { year: ethDate.year, month: 11, day: 5 })) {
    return createFast('Tsome Hawariat (Apostles Fast)', 'Honoring the apostles, their mission to spread the Gospel, and the call to discipleship', 'fasting_season', 'contemplative', ethDate, ethMonthName);
  }

  // 4. Check Fixed Fasts
  for (const fast of FIXED_FASTS) {
    if (isEthDateInRange(ethDate, { year: ethDate.year, month: fast.startMonth, day: fast.startDay }, { year: ethDate.year, month: fast.endMonth, day: fast.endDay })) {
      return createFast(fast.name, fast.theme, 'fasting_season', fast.mood, ethDate, ethMonthName);
    }
  }

  // 5. Check Zemene (Ecological/Liturgical Seasons)
  const zemene = getZemene(ethDate);

  // 6. Apply Daily Saint (Medium priority - forms the baseline of every day)
  const dailySaint = DAILY_COMMEMORATIONS[ethDate.day];

  // 7. Check Weekly Fasts (Wednesday Friday)
  if (gDayOfWeek === 3 || gDayOfWeek === 5) {
    const wName = gDayOfWeek === 3 ? 'Wednesday Fast' : 'Friday Fast';
    const wTheme = gDayOfWeek === 3 ? 'Remembering the betrayal of Judas — the cost of unfaithfulness' : 'Remembering the Crucifixion of Christ — the depth of divine sacrifice';
    
    // Combine Weekly fast with Daily Saint and Season
    const compositeTheme = `${wTheme}. Also remembering ${dailySaint.saint}: ${dailySaint.theme}. We are in ${zemene.name} (${zemene.theme}).`;
    return createFast(wName, compositeTheme, 'weekly_fast', 'contemplative', ethDate, ethMonthName);
  }

  // If no major fast or feast, return the daily saint with the seasonal context
  const baselineTheme = `Commemorating ${dailySaint.saint}: ${dailySaint.theme}. We are currently in ${zemene.name} (${zemene.theme}).`;
  return createFeast(`Daily Commemoration: ${dailySaint.saint}`, baselineTheme, 'devotional', 'devotional', ethDate, ethMonthName);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createFeast(name, theme, type, mood, ethDate, ethMonthName) {
  return { event: name, theme: theme, type: type, mood: mood, ethiopianDate: `${ethMonthName} ${ethDate.day}`, priority: 'high' };
}

function createFast(name, theme, type, mood, ethDate, ethMonthName) {
  return { event: name, theme: theme, type: type, mood: mood, ethiopianDate: `${ethMonthName} ${ethDate.day}`, priority: 'medium' };
}

function getZemene(ethDate) {
  // Zemene Tsige (Season of Flowers) - approx Meskerem 26 to Hidar 6
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 1, day: 26 }, { year: ethDate.year, month: 3, day: 6 })) {
    return { name: 'Zemene Tsige (Season of Flowers)', theme: 'The flight of the Holy Family to Egypt, divine protection in exile, and the blossoming of true faith' };
  }
  // Keremt (Rainy Season / Winter) - Sene 26 to Meskerem 25
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 10, day: 26 }, { year: ethDate.year + 1, month: 1, day: 25 })) {
    return { name: 'Keremt (Rainy Season)', theme: 'God granting rain from heaven, fruitfulness, and the waters of life' };
  }
  return { name: 'Zemene Sebket (Season of Preaching)', theme: 'The ongoing mission to preach the Kingdom of God and walk in His light' };
}

export function formatContextForPrompt(context) {
  if (!context) return '';

  const moodInstructions = {
    joyful: 'The tone should be bright, celebratory, and full of hope.',
    triumphant: 'The tone should be bold, victorious, and powerful.',
    celebratory: 'The tone should be festive, grateful, and uplifting.',
    contemplative: 'The tone should be reflective, gentle, and deeply contemplative.',
    penitential: 'The tone should be humble, introspective, and focused on repentance and renewal.',
    devotional: 'The tone should be reverent, warm, and full of spiritual devotion.'
  };

  const moodInstruction = moodInstructions[context.mood] || '';

  return [
    `\n\n--- LITURGICAL CONTEXT (IMPORTANT) ---`,
    `Today is a special day in the Ethiopian Orthodox Church calendar: "${context.event}".`,
    `Ethiopian Calendar Date: ${context.ethiopianDate}.`,
    `Theme: ${context.theme}.`,
    moodInstruction,
    `Your generated content MUST deeply reflect this specific occasion and theme. Do NOT generate generic or unrelated content.`,
    `--- END LITURGICAL CONTEXT ---\n`
  ].join('\n');
}
