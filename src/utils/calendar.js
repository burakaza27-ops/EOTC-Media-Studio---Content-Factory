/**
 * EOTC Liturgical Calendar Engine
 * ================================
 * Converts Gregorian dates to the Ethiopian calendar and determines
 * the current liturgical season, feast, or saint commemoration.
 *
 * This module is the "brain" behind context-aware content generation.
 * It provides rich thematic context to the AI so that generated quotes,
 * verses, and carousels are perfectly aligned with the Church calendar.
 *
 * Design Principles:
 *   - Zero external Ge'ez language in output (per user requirement)
 *   - Pure computation — no API calls, no network dependencies
 *   - Graceful fallback: if no special day is found, returns null
 */

// ─── Ethiopian Calendar Conversion ──────────────────────────────────────────

/**
 * Converts a Gregorian date to the Ethiopian calendar.
 * The Ethiopian calendar is ~7-8 years behind the Gregorian calendar.
 * The Ethiopian New Year (Enkutatash) falls on September 11 (or 12 in leap years).
 */
export function toEthiopianDate(gregorianDate = new Date()) {
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1; // 1-indexed
  const gDay = gregorianDate.getDate();

  // Ethiopian New Year offset
  // If before Sept 11, we're in the previous Ethiopian year
  const isBeforeNewYear = gMonth < 9 || (gMonth === 9 && gDay < 11);
  const ethYear = isBeforeNewYear ? gYear - 8 : gYear - 7;

  // Calculate Ethiopian month and day
  // Ethiopian months: 13 months (12 x 30 days + Pagume 5/6 days)
  // New Year = Meskerem 1 = September 11 (usually)

  // Days from Sept 11 of the relevant Gregorian year
  const newYearGregorian = new Date(isBeforeNewYear ? gYear - 1 : gYear, 8, 11); // Sept 11
  const diffMs = gregorianDate.getTime() - newYearGregorian.getTime();
  const dayOfEthYear = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let ethMonth, ethDay;

  if (dayOfEthYear < 0) {
    // Edge case: handle dates very close to new year
    ethMonth = 13; // Pagume
    ethDay = 30 + dayOfEthYear + 1;
  } else if (dayOfEthYear < 360) {
    ethMonth = Math.floor(dayOfEthYear / 30) + 1;
    ethDay = (dayOfEthYear % 30) + 1;
  } else {
    ethMonth = 13; // Pagume
    ethDay = dayOfEthYear - 360 + 1;
  }

  return { year: ethYear, month: ethMonth, day: ethDay };
}

// ─── Ethiopian Month Names ──────────────────────────────────────────────────

const ETHIOPIAN_MONTHS = {
  1: 'Meskerem', 2: 'Tikimt', 3: 'Hidar', 4: 'Tahsas',
  5: 'Tir', 6: 'Yekatit', 7: 'Megabit', 8: 'Miyazya',
  9: 'Ginbot', 10: 'Sene', 11: 'Hamle', 12: 'Nehase', 13: 'Pagume'
};

// ─── Monthly Saint Commemorations ───────────────────────────────────────────
// These are fixed days in the Ethiopian calendar that honor specific saints.

const MONTHLY_COMMEMORATIONS = {
  1:  { saint: 'Lideta Mariam (Birth of the Virgin Mary)', theme: 'The Blessed Virgin Mary, her birth, and her role in salvation', type: 'saint' },
  3:  { saint: 'Nahu (The Prophet Nahum)', theme: 'Prophetic wisdom and divine justice', type: 'saint' },
  5:  { saint: 'Abune Gebre Menfes Kidus', theme: 'Monastic life, holiness, and spiritual discipline', type: 'saint' },
  7:  { saint: 'Holy Trinity (Selassie)', theme: 'The mystery of the Holy Trinity — Father, Son, and Holy Spirit', type: 'feast' },
  12: { saint: 'St. Michael the Archangel', theme: 'The protection of the Archangel Michael, spiritual warfare, and divine guardianship', type: 'saint' },
  16: { saint: 'Covenant of Mercy (Kidane Mihret)', theme: 'The mercy of the Virgin Mary and her covenant of intercession for humanity', type: 'feast' },
  19: { saint: 'St. Gabriel the Archangel', theme: 'The Archangel Gabriel, divine messages, and the Annunciation', type: 'saint' },
  21: { saint: 'The Virgin Mary (Kidist Mariam)', theme: 'The purity, grace, and intercession of the Blessed Virgin Mary', type: 'saint' },
  23: { saint: 'St. George (Giorgis)', theme: 'The courage and faith of St. George, martyrdom, and spiritual victory', type: 'saint' },
  27: { saint: 'Medhane Alem (Savior of the World)', theme: 'Jesus Christ as the Savior of all humanity, redemption, and eternal life', type: 'feast' },
  29: { saint: 'Bale Wold (Feast of God the Son)', theme: 'The incarnation of Christ, divine love, and the mystery of salvation', type: 'feast' },
};

// ─── Major Fixed Feasts (Ethiopian Calendar) ────────────────────────────────

const MAJOR_FEASTS = [
  // Meskerem (Month 1)
  { month: 1, day: 1,  name: 'Enkutatash (Ethiopian New Year)', theme: 'New beginnings, gratitude, renewal of faith, and the beauty of creation', type: 'major_feast', mood: 'joyful' },
  { month: 1, day: 17, name: 'Meskel (Finding of the True Cross)', theme: 'The discovery of the True Cross by Queen Helena, the light of Christ conquering darkness, and the triumph of faith', type: 'major_feast', mood: 'triumphant' },

  // Tahsas (Month 4)
  { month: 4, day: 29, name: 'Genna (Ethiopian Christmas)', theme: 'The birth of Jesus Christ in Bethlehem, divine humility, the light entering the world, and the joy of Emmanuel', type: 'major_feast', mood: 'joyful' },

  // Tir (Month 5)
  { month: 5, day: 11, name: 'Timkat (Epiphany / Baptism of Christ)', theme: 'The baptism of Jesus in the Jordan River, spiritual cleansing, the revelation of the Holy Trinity, and renewal through water', type: 'major_feast', mood: 'celebratory' },

  // Megabit (Month 7) — approximate; Hosanna/Palm Sunday is moveable
  { month: 7, day: 25, name: 'DebreZeit (Mount of Olives)', theme: 'Christ on the Mount of Olives, reflection on sacrifice, and the depth of divine love', type: 'feast', mood: 'contemplative' },

  // Nehase (Month 12)
  { month: 12, day: 1, name: 'Filseta (Assumption of Mary) begins', theme: 'The fasting period honoring the Assumption of the Virgin Mary, devotion, and spiritual surrender', type: 'feast', mood: 'contemplative' },
  { month: 12, day: 16, name: 'Filseta (Assumption of Mary)', theme: 'The Assumption of the Blessed Virgin Mary into heaven, her eternal glory, and her intercession for all believers', type: 'major_feast', mood: 'celebratory' },
];

// ─── Fasting Seasons (Approximate Ethiopian Calendar Ranges) ────────────────
// Note: Some fasts (like Abiy Tsom / Great Lent) are moveable based on Easter.
// We use approximate ranges and the system will refine over time.

const FASTING_SEASONS = [
  {
    name: 'Tsome Nebiyat (Advent / Prophets Fast)',
    startMonth: 3, startDay: 15, endMonth: 4, endDay: 28,
    theme: 'Preparation for the coming of Christ, the prophecies of the Messiah, repentance, and patient anticipation',
    mood: 'contemplative'
  },
  {
    name: 'Abiy Tsom (Great Lent)',
    startMonth: 6, startDay: 25, endMonth: 8, endDay: 9,
    theme: 'The 55 days of Great Lent — deep repentance, fasting, prayer, spiritual warfare, and preparation for the Resurrection',
    mood: 'penitential'
  },
  {
    name: 'Tsome Hawariat (Apostles Fast)',
    startMonth: 9, startDay: 15, endMonth: 10, endDay: 12,
    theme: 'Honoring the apostles, their mission to spread the Gospel, and the call to discipleship',
    mood: 'contemplative'
  },
  {
    name: 'Tsome Filseta (Fast of the Assumption)',
    startMonth: 12, startDay: 1, endMonth: 12, endDay: 15,
    theme: 'Devotion to the Virgin Mary, her earthly journey, and spiritual surrender before her Assumption',
    mood: 'contemplative'
  },
];

// ─── Weekly Fasting ─────────────────────────────────────────────────────────

function getWeeklyFastContext(gregorianDate) {
  const dayOfWeek = gregorianDate.getDay(); // 0=Sunday ... 6=Saturday
  if (dayOfWeek === 3) { // Wednesday
    return {
      name: 'Wednesday Fast',
      theme: 'Remembering the betrayal of Judas — the cost of unfaithfulness, and the call to loyalty and integrity in our walk with God',
      type: 'weekly_fast',
      mood: 'contemplative'
    };
  }
  if (dayOfWeek === 5) { // Friday
    return {
      name: 'Friday Fast',
      theme: 'Remembering the Crucifixion of Christ — the depth of divine sacrifice, the power of the Cross, and the promise of redemption',
      type: 'weekly_fast',
      mood: 'penitential'
    };
  }
  return null;
}

// ─── Main Liturgical Context Engine ─────────────────────────────────────────

/**
 * Returns the liturgical context for today (or a given date).
 * Priority: Major Feast > Fasting Season > Monthly Saint > Weekly Fast > null
 *
 * @param {Date} [date] - Optional date to check. Defaults to today.
 * @returns {object|null} - Liturgical context object, or null if it's a "normal" day.
 */
export function getLiturgicalContext(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  const ethMonthName = ETHIOPIAN_MONTHS[ethDate.month] || 'Unknown';

  console.log(`📅 Ethiopian Date: ${ethMonthName} ${ethDate.day}, ${ethDate.year} (Eth. month ${ethDate.month})`);

  // 1. Check Major Fixed Feasts (highest priority)
  for (const feast of MAJOR_FEASTS) {
    if (ethDate.month === feast.month && ethDate.day === feast.day) {
      console.log(`🎉 Major Feast detected: ${feast.name}`);
      return {
        event: feast.name,
        theme: feast.theme,
        type: feast.type,
        mood: feast.mood,
        ethiopianDate: `${ethMonthName} ${ethDate.day}`,
        priority: 'high'
      };
    }
  }

  // 2. Check Fasting Seasons
  for (const fast of FASTING_SEASONS) {
    const inRange = isDateInRange(ethDate, fast.startMonth, fast.startDay, fast.endMonth, fast.endDay);
    if (inRange) {
      console.log(`🕊️ Fasting Season detected: ${fast.name}`);
      return {
        event: fast.name,
        theme: fast.theme,
        type: 'fasting_season',
        mood: fast.mood,
        ethiopianDate: `${ethMonthName} ${ethDate.day}`,
        priority: 'medium'
      };
    }
  }

  // 3. Check Monthly Saint Commemorations
  const monthlySaint = MONTHLY_COMMEMORATIONS[ethDate.day];
  if (monthlySaint) {
    console.log(`⛪ Monthly Commemoration: ${monthlySaint.saint}`);
    return {
      event: monthlySaint.saint,
      theme: monthlySaint.theme,
      type: monthlySaint.type,
      mood: 'devotional',
      ethiopianDate: `${ethMonthName} ${ethDate.day}`,
      priority: 'medium'
    };
  }

  // 4. Check Weekly Fast (Wednesday/Friday)
  const weeklyFast = getWeeklyFastContext(date);
  if (weeklyFast) {
    console.log(`🍞 Weekly Fast: ${weeklyFast.name}`);
    return {
      event: weeklyFast.name,
      theme: weeklyFast.theme,
      type: weeklyFast.type,
      mood: weeklyFast.mood,
      ethiopianDate: `${ethMonthName} ${ethDate.day}`,
      priority: 'low'
    };
  }

  // 5. No special liturgical event today
  console.log(`📅 No special liturgical event. Regular day: ${ethMonthName} ${ethDate.day}`);
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isDateInRange(ethDate, startMonth, startDay, endMonth, endDay) {
  const current = ethDate.month * 100 + ethDate.day;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Wraps around year boundary
  return current >= start || current <= end;
}

/**
 * Formats the liturgical context into a human-readable string
 * suitable for injecting into an AI prompt.
 */
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
    `Your generated content MUST reflect this specific occasion. Do NOT generate generic content.`,
    `--- END LITURGICAL CONTEXT ---\n`
  ].join('\n');
}
