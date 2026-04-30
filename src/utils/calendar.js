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

  const isEthLeapYearThisGYear = (gYear % 4 === 3);
  const newYearDay = (isEthLeapYearThisGYear && gMonth === 9) ? 12 : 11;
  const isBeforeNewYearExact = gMonth < 9 || (gMonth === 9 && gDay < newYearDay);
  
  const ethYear = isBeforeNewYearExact ? gYear - 8 : gYear - 7;
  
  // Use UTC to avoid any Daylight Saving Time Math.floor() skipping bugs
  const targetUTC = Date.UTC(gYear, gMonth - 1, gDay);
  const newYearGregorianUTC = Date.UTC(
    isBeforeNewYearExact ? gYear - 1 : gYear,
    8,
    isBeforeNewYearExact && ((gYear - 1) % 4 === 3) ? 12 : 11
  );
  
  const diffMs = targetUTC - newYearGregorianUTC;
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
  1:  { saint: 'ልደታ ለማርያም እና ነቢዩ ኤልያስ (Lideta Mariam & Elyas)', theme: 'The birth of the Most Holy Virgin Mary — chosen before time to be the Theotokos (God-bearer). She was born holy from the womb of Hanna and Joachim who prayed for her for years. Also commemorating Elijah the Prophet, who by prayer shut and opened the heavens, and was taken to heaven in a chariot of fire without tasting death.', type: 'saint' },
  2:  { saint: 'ሐዋርያው ታዴዎስ (Thaddeus the Apostle)', theme: 'The apostle Thaddeus — one of the twelve — who took the Gospel to Persia and Armenia and was martyred by an arrow. He is the patron of desperate causes and hopeless situations. His life teaches that God uses the overlooked to change the world.', type: 'saint' },
  3:  { saint: "በዓታ ለማርያም (Ba'eta Mariam - Presentation)", theme: "At age three, the Virgin Mary was presented in the Temple by her parents and dedicated entirely to God — living in the Holy of Holies, fed by angels. This is a model of total consecration: giving our most precious possession back to God who gave it.", type: 'saint' },
  4:  { saint: 'ዮሐንስ ወልደ ነጎድጓድ (Yohannes Wolde Negedgwad)', theme: 'John the Beloved Apostle — the one who leaned on Christ\'s chest at the Last Supper, who stood at the foot of the Cross, who received the Book of Revelation on Patmos. His life reveals the supreme privilege of intimacy with God and the transforming power of divine love.', type: 'saint' },
  5:  { saint: 'አቡነ ገብረ መንፈስ ቅዱስ (Abune Gebre Menfes Kidus)', theme: 'The great Ethiopian ascetic who lived over 360 years in the wilderness, clothed only in his hair, fed by wild animals who became his companions. He represents the ultimate victory of the spirit over the body and the possibility of total union with God through radical self-denial.', type: 'saint' },
  6:  { saint: 'ኢየሱስ እና ቁስቋም ማርያም (Iyesus & Qusquam)', theme: 'Monthly commemoration of Jesus Christ himself and the sacred mountain of Qusquam in Egypt where the Holy Family sought refuge. It was here that idols fell silent before the infant King and the soil was sanctified by His footsteps. God himself became a refugee — no exile is beneath His presence.', type: 'saint' },
  7:  { saint: 'ቅድስት ሥላሴ (Kidist Selassie — The Holy Trinity)', theme: 'Monthly feast of the Most Holy Trinity — Father, Son, and Holy Spirit: three Persons, one undivided God. The EOTC holds this mystery at the center of all theology. The Trinity is not a philosophical puzzle but a living communion of love into which believers are invited through baptism and prayer.', type: 'feast' },
  8:  { saint: 'አባ ኪሮስ እና ኪሩቤል (Abba Kiros & The Cherubim)', theme: 'Abba Kiros, monk and martyr, and the Cherubim — the four living creatures of fire who guard the Throne of God and cry "Holy, holy, holy" without ceasing. They remind us that the proper response to encountering God is awe, surrender, and unending praise.', type: 'saint' },
  9:  { saint: 'ሐዋርያው ቶማስ (Thomas the Apostle)', theme: 'Thomas who said "Unless I see the nail marks..." and then cried "My Lord and my God!" when he did. He is the patron of honest seekers — those who need evidence for their faith. Christ did not rebuke his doubt but met him in it. Thomas later took the Gospel to India and was martyred.', type: 'saint' },
  10: { saint: 'በዓለ መስቀል (Meskel — The Holy Cross)', theme: 'Monthly commemoration of the True Cross of Christ — the instrument of our salvation transformed into the throne of glory. The Cross is not merely a symbol of suffering but of the love that transforms suffering into life. "By the Cross, joy has come into all the world."', type: 'feast' },
  11: { saint: 'ቅድስት ሐና እና ቅዱስ ኢያቄም (Hanna & Joachim)', theme: 'The righteous and elderly parents of the Virgin Mary who prayed with tears for a child for decades. Their patient, unwavering faith was rewarded beyond imagination — their daughter became the Mother of God. This feast honors all who pray and wait in hope for what seems impossible.', type: 'saint' },
  12: { saint: 'ቅዱስ ሚካኤል (St. Michael the Archangel)', theme: 'Michael the Archangel — whose name means "Who is like God?" Commander of the heavenly armies, he cast Satan from heaven, guards the gates of paradise, accompanies souls at death, and intervenes for the people of God. He is Ethiopia\'s most beloved protector, with 44+ shrines in his name.', type: 'saint' },
  13: { saint: 'ቅዱስ ሩፋኤል (St. Raphael the Archangel)', theme: 'Raphael the Archangel — whose name means "God heals." He guided Tobias, healed Tobit\'s blindness, bound the demon Asmodeus, and declared: "I am one of the seven angels who stand before the throne." He is the heavenly physician, ever-present when God\'s people cry for healing.', type: 'saint' },
  14: { saint: 'አቡነ አረጋዊ እና ገብረ ክርስቶስ (Abune Aregawi & Gebre Kristos)', theme: 'Abune Aregawi — one of the Nine Saints who came from Rome to Ethiopia in the 5th century and established Debre Damo monastery on a cliff accessible only by rope. And Gebre Kristos — a wealthy king who gave away his kingdom and became a beggar for Christ\'s sake. Both show: nothing is too precious to give up for God.', type: 'saint' },
  15: { saint: 'ቅዱስ ቂርቆስ እና ኢየሉጣ (Kirkos & Iyalutha)', theme: 'The child martyr Kirkos (Cyricus), barely 3 years old, who confessed Christ before the Roman governor and was thrown to the ground — yet the governor was miraculously struck down. His mother Iyalutha was beheaded alongside him. Their story: the faith of children can shame the powerful, and a mother\'s courage is a holy thing.', type: 'saint' },
  16: { saint: 'ኪዳነ ምሕረት (Kidane Mihret — Covenant of Mercy)', theme: 'Monthly feast of the Covenant of Mercy (ኪዳነ ምሕረት) — when the risen Christ appeared to the Virgin Mary 40 days after the Resurrection and gave her a covenant: "Whoever calls upon your name for mercy shall receive it." This is the foundation of EOTC Marian intercession — not worship of Mary, but confidence in her maternal advocacy.', type: 'feast' },
  17: { saint: 'ቅዱስ እስጢፋኖስ (St. Stephen the Protomartyr)', theme: 'Stephen — the first Christian martyr — full of the Holy Spirit and wisdom, his face shining like an angel\'s as he was stoned. He cried: "Lord, do not hold this sin against them." His death scattered the early church and spread the Gospel to all nations. Stephen shows: what the world means as defeat, God uses as seed.', type: 'saint' },
  18: { saint: 'አቡነ ኤዎስጣቴዎስ (Abune Ewostatewos)', theme: 'Eustathius — the 14th-century Ethiopian monk and reformer who insisted on observing the Sabbath (Saturday) as well as Sunday, for which he was exiled from Ethiopia. He traveled to Egypt, Cyprus, and Armenia, gathering disciples. His persistence was vindicated at the Council of Debre Mitmaq in 1450. He teaches: stand for truth even when the institution opposes you.', type: 'saint' },
  19: { saint: 'ቅዱስ ገብርኤል (St. Gabriel the Archangel)', theme: 'Gabriel — whose name means "God is my strength" — the divine messenger. He announced to Zechariah the birth of John the Baptist, to the Virgin Mary the Incarnation of Christ, and in Daniel he explained visions of the end times. He is the archangel of revelation, of divine announcements that change everything.', type: 'saint' },
  20: { saint: "ሕንፀተ ቤተ ክርስቲያን (Hnstata Mariam)", theme: "Commemorating the rest and refuge of the Virgin Mary — the places she sanctified by her presence. The EOTC venerates the locations of her exile, her prayer, and her dormition as holy ground. Where Mary rested, the ground became a sanctuary. Where we welcome God's presence into our lives, our very bodies become temples.", type: 'saint' },
  21: { saint: 'ቅድስት ማርያም (Kidist Mariam — The Virgin Mary)', theme: 'Monthly feast of the Most Holy Virgin Mary — Theotokos, Ever-Virgin, Queen of Heaven and Mother of all the faithful. The EOTC honors her with unique depth: she is the Second Ark of the Covenant, the Burning Bush, the Heavenly Ladder. Her intercession is constant, her love maternal and fierce. "She is the joy of all generations."', type: 'saint' },
  22: { saint: 'ቅዱስ ዑራኤል (St. Uriel the Archangel)', theme: 'Uriel the Archangel — "God is my light." He guards the gate of Eden, stands over thunder and terror, and illuminates the darkest places of creation. In 2 Esdras he answers Ezra\'s deepest theological questions. He represents the fearless light of God that penetrates every darkness. MANDATORY SCRIPTURE TO QUOTE: "ስሙ ዑራኤል የተባለው ወደ እኔ የተላከው መልአክ መለሰልኝ፤ የልዑልን የጌትነቱን ምክር ታገኝ ዘንድ ልቡናህ ማድነቅን አደነቀን? አለኝ" (Reference: ዕዝራ ሱቱኤል ፪፥፩-፪). You MUST use this exact verse and reference.', type: 'saint' },
  23: { saint: 'ቅዱስ ጊዮርጊስ (St. George the Great Martyr)', theme: 'George — soldier of Christ, "Great Martyr and Trophy-bearer." He refused to recant his faith before the emperor Diocletian and endured seven years of miraculous tortures before his beheading. Ethiopia loves George as a warrior of unbreakable faith. His famous icon shows him slaying the dragon — a picture of the believer destroying the Devil through courage and prayer.', type: 'saint' },
  24: { saint: 'አቡነ ተክለ ሃይማኖት (Abune Tekle Haymanot)', theme: 'Ethiopia\'s greatest saint — Tekle Haymanot, "Plant of the Faith." He evangelized pagan regions of Ethiopia, stood in prayer for 22 years on one leg (the other fell off, held by an angel), and received the gift of three sets of wings at his death. He embodies the EOTC ideal: prayer without ceasing, evangelism without fear, holiness without compromise.', type: 'saint' },
  25: { saint: 'ቅዱስ መርቆሬዎስ (St. Mercurius the Martyr)', theme: 'Mercurius — "He of Many Swords" — a Roman soldier who refused to offer sacrifice to pagan gods and was martyred. He is venerated in the EOTC as a powerful intercessor and spiritual warrior. His feast celebrates the courage to refuse what the world demands when it contradicts what God commands.', type: 'saint' },
  26: { saint: 'አረጋዊው ዮሴፍ (Joseph the Carpenter)', theme: 'Joseph the Carpenter — the silent guardian. He accepted the scandal of the Virgin\'s pregnancy on nothing but a dream. He worked with his hands, protected the Holy Family in Egypt, and raised the Son of God. The EOTC honors him as the model of faithful, quiet obedience: doing what God says without needing to understand it.', type: 'saint' },
  27: { saint: 'መድኃኔዓለም (Medhane Alem — Savior of the World)', theme: 'Monthly feast of "Medhane Alem" — Jesus Christ as Savior of the entire world. The EOTC\'s greatest church in Addis Ababa bears this name. This feast meditates on the universal scope of the Cross: not one nation, not one people — but every human soul ever born is offered rescue. "For God so loved the world..."', type: 'feast' },
  28: { saint: 'አማኑኤል (Amanuael — Emmanuel, God With Us)', theme: 'Emmanuel — "God with us." The Incarnation of Christ: the eternal, infinite God chose to enter time, space, and human flesh. Not from a distance but from within. This feast is a meditation on the astonishing nearness of God — He is not far away but as close as the next heartbeat, the next breath, the next moment of honest prayer.', type: 'feast' },
  29: { saint: 'በዓለ ወልድ (Bale Wold — Feast of God the Son)', theme: 'Monthly feast of God the Son — the second Person of the Trinity, eternally begotten of the Father, who for our salvation became incarnate of the Holy Spirit and the Virgin Mary. This feast meditates on the Eternal Logos: "In the beginning was the Word, and the Word was with God, and the Word was God." He is the image of the invisible God.', type: 'feast' },
  30: { saint: 'ቅዱስ ማርቆስ (St. Mark the Evangelist)', theme: 'Mark the Evangelist — author of the first and most urgent Gospel, founded the Church in Alexandria (Egypt), and was martyred there. His Gospel roars with action and power: immediately after one miracle comes another. The EOTC Alexandria Patriarchate traces its lineage directly to Mark. His lion symbol roars still in EOTC worship and iconography.', type: 'saint' },
};


const MAJOR_FIXED_FEASTS = [
  // ── Meskerem (Month 1) ──
  { month: 1,  day: 1,  name: 'እንቁጣጣሽ (Enkutatash — Ethiopian New Year)', theme: 'The Ethiopian New Year, Enkutatash, meaning "Gift of Jewels." A day of new beginnings, singing, flowers, and gratitude to God for the completion of another year. Children present bouquets and sing songs of praise across the land.', type: 'major_feast', mood: 'joyful' },
  { month: 1,  day: 2,  name: 'በዓለ ወልድ (Bale Wold — Feast of the Son)', theme: 'The second feast of God the Son in the New Year — commemorating the Incarnation of Christ and the mystery of divine love that descended for humanity\'s sake.', type: 'feast', mood: 'devotional' },
  { month: 1,  day: 17, name: 'መስቀል (Meskel — Finding of the True Cross)', theme: 'Queen Helena\'s discovery of the True Cross of Christ, guided by a great fire (Demera). The bonfire symbolizes the cross and its light conquering all darkness. Ethiopia keeps this feast with bonfires, crowds, and triumphant song.', type: 'major_feast', mood: 'triumphant' },
  { month: 1,  day: 26, name: 'ቅድስት ማርያም (Kidist Mariam — Start of Zemene Tsige)', theme: 'The monthly feast of the Blessed Virgin Mary coinciding with the opening of the Season of Flowers (Zemene Tsige) — commemorating the Holy Family\'s exile and God\'s protection through all wilderness.', type: 'feast', mood: 'joyful' },

  // ── Hidar (Month 3) ──
  { month: 3,  day: 1,  name: 'ልደታ ለማርያም (Lideta Mariam — Nativity of the Virgin Mary)', theme: 'The birth of the Most Holy Virgin Mary, daughter of Hanna and Joachim, chosen before the ages to be Theotokos — the God-bearer. Her birth brought the dawn of salvation closer to the world.', type: 'major_feast', mood: 'joyful' },
  { month: 3,  day: 6,  name: 'ቁስቋም (Qusquam — Flight to Egypt / End of Zemene Tsige)', theme: 'The annual culmination of the Season of Flowers celebrating the Holy Family\'s divine protection on Mount Qusquam in Egypt. The idols fell as the Christ-child entered, fulfilling Isaiah\'s prophecy.', type: 'major_feast', mood: 'joyful' },
  { month: 3,  day: 12, name: 'ኅዳር ሚካኤል (Hidar Michael — Annual Feast of Archangel Michael)', theme: 'The great annual feast of St. Michael the Archangel — Commander of the heavenly hosts, defeater of Satan, protector of God\'s people. Thousands gather at his shrines across Ethiopia in pilgrimage.', type: 'major_feast', mood: 'celebratory' },
  { month: 3,  day: 21, name: 'ጽዮን ማርያም (Tsion Mariam — St. Mary of Zion)', theme: 'Celebrating the sacred Tabernacle of St. Mary of Zion in Axum — spiritual home of the Ark of the Covenant. The Virgin Mary is the living Ark who bore the Word of God made flesh.', type: 'major_feast', mood: 'joyful' },

  // ── Tahsas (Month 4) ──
  { month: 4,  day: 28, name: 'የገና ጋድ (Gahad Genna — Vigil of Christmas)', theme: 'The strict fast of Christmas Eve — absolute abstinence from all food and drink until the midnight Mass. A holy vigil, burning with anticipation for the Light of the World to be born in the silence of Bethlehem.', type: 'feast', mood: 'penitential' },
  { month: 4,  day: 29, name: 'ገና / ልደት (Genna / Lidet — Ethiopian Christmas)', theme: 'The Nativity of our Lord Jesus Christ in the manger of Bethlehem. The eternal Son of God took on human flesh, born of the Virgin Mary. Angels sang, shepherds ran, and a star blazed over the birthplace of salvation. Ethiopian Christians celebrate with all-night liturgy and the game of Genna.', type: 'major_feast', mood: 'joyful' },

  // ── Tir (Month 5) ──
  { month: 5,  day: 10, name: 'የጥምቀት ጋድ (Gahad Timkat — Vigil of Epiphany)', theme: 'The eve of Timkat — a night of procession, vigil, and intense prayer as the Tabot (replica of the Ark) is carried to water. A night where heaven and earth draw near in anticipation.', type: 'feast', mood: 'penitential' },
  { month: 5,  day: 11, name: 'ጥምቀት (Timkat — Ethiopian Epiphany)', theme: 'The Baptism of Jesus Christ in the Jordan River by John the Baptist — the Holy Trinity manifest in one moment: the Father speaks, the Spirit descends, the Son is baptized. Ethiopia\'s most spectacular feast: Tabots carried, hymns sung, believers sprinkled with holy water.', type: 'major_feast', mood: 'celebratory' },
  { month: 5,  day: 12, name: 'ቃና ዘገሊላ / ሚካኤል (Kana Zegelila / Timkat Feast of St. Michael)', theme: 'The second day of Timkat celebrations dedicated to the Archangel Michael and the miracle at Cana. The Tabots return in triumphant procession as the faithful continue in joy.', type: 'feast', mood: 'celebratory' },

  // ── Yekatit (Month 6) ──
  { month: 6,  day: 16, name: 'ኪዳነ ምሕረት (Kidane Mihret — Covenant of Mercy)', theme: 'The great annual feast of the Covenant of Mercy — when the risen Christ appeared to His mother the Virgin Mary and promised that whoever calls upon her name shall receive mercy. Ethiopia\'s beloved feast of intercession and maternal love.', type: 'major_feast', mood: 'joyful' },

  // ── Ginbot (Month 9) ──
  { month: 9,  day: 5,  name: 'ደብረ ታቦር (Debre Tabor — Transfiguration of Christ)', theme: 'The radiant Transfiguration of Christ on Mount Tabor — His face shone as the sun, His garments became white as light, Moses and Elijah appeared beside Him. A preview of the glory that awaits the faithful.', type: 'major_feast', mood: 'triumphant' },

  // ── Hamle (Month 11) ──
  { month: 11, day: 5,  name: 'ቡሄ (Buhe — Feast of the Transfiguration)', theme: 'Ethiopia\'s beloved cultural celebration of the Transfiguration of Christ — Buhe. Boys run with torches (chibo), singing songs of praise, and families bake bread. A feast of light, joy, and the divine glory revealed on the mountain.', type: 'major_feast', mood: 'joyful' },

  // ── Nehase (Month 12) ──
  { month: 12, day: 1,  name: 'ጾመ ፍልሰታ መግቢያ (Start of Tsome Filseta)', theme: 'The beginning of the 15-day Fast of the Assumption — the most beloved Marian fast in Ethiopia. Believers fast with devotion, chanting Marian hymns (Mezmur) and preparing for the great feast of Mary\'s dormition and assumption.', type: 'feast', mood: 'penitential' },
  { month: 12, day: 16, name: 'ፍልሰታ (Filseta — Assumption of the Virgin Mary)', theme: 'The blessed dormition and assumption of the Virgin Mary into heaven — body and soul. She who bore the King of Kings was received into eternal glory. Ethiopia erupts in song and celebration: her departure was not death but translation to glory.', type: 'major_feast', mood: 'celebratory' },

  // ── Slete Berhan (Sun Feast) — 29th of each month ──
  { month: 1,  day: 29, name: 'በዓለ ወልድ (Bale Wold — Monthly Feast of God the Son)', theme: 'Monthly commemoration of the divine light of Christ who is the Light of the world. The Sun feast reminds us that God clothed the creation in radiance and will clothe His saints in eternal glory.', type: 'feast', mood: 'joyful' },
];


const FIXED_FASTS = [
  { name: 'ጾመ ነቢያት (Fast of the Prophets)', startMonth: 3, startDay: 15, endMonth: 4, endDay: 28, theme: 'A 43-day fast of prophetic anticipation — mourning the spiritual hunger of the world before the Incarnation and crying out for the coming of the Messiah. The prophets fasted for us; we fast in their memory and in longing for the Kingdom.', mood: 'contemplative' },
  { name: 'ጾመ ፍልሰታ (Fast of the Assumption)', startMonth: 12, startDay: 1, endMonth: 12, endDay: 15, theme: 'A 15-day fast of Marian devotion — perhaps Ethiopia\'s most beloved fast. Believers abstain from all animal products, fill the churches with hymns (Mezmur), and contemplate the purity and surrender of the Virgin Mary who said: "Let it be done to me according to your word."', mood: 'contemplative' },
  { name: 'የገና ጋድ (Vigil Fast of Christmas)', startMonth: 4, startDay: 28, endMonth: 4, endDay: 28, theme: 'The strictest single-day fast of the year — complete abstinence until the midnight liturgy of Christmas. A vigil of sacred hunger waiting for the Bread of Life to be born.', mood: 'penitential' },
  { name: 'የጥምቀት ጋድ (Vigil Fast of Epiphany)', startMonth: 5, startDay: 10, endMonth: 5, endDay: 10, theme: 'Fasting before the great feast of Timkat — purifying the body and soul before the waters of Epiphany sanctify the faithful. A night of procession, prayer, and holy anticipation.', mood: 'penitential' }
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
  { name: 'ዘወረደ (Zewerede - He Who Descended)', theme: 'The incarnation of Christ who came down from Heaven for our salvation' },
  { name: 'ቅድስት (Kidist - Holy)', theme: 'The holiness of God and our calling to live sanctified lives' },
  { name: 'ምኩራብ (Mikurab - The Temple)', theme: 'Christ teaching in the Temple and cleansing our bodies as the temple of the Holy Spirit' },
  { name: 'መጻጉዕ (Metsagu - The Infirm)', theme: 'Christ healing the paralytic, representing spiritual healing and liberation from sin' },
  { name: 'ደብረ ዘይት (Debre Zeit - Mount of Olives)', theme: 'The Second Coming of Christ, preparedness, and eternal judgment' },
  { name: 'ገብርኄር (Gebir Her - Faithful Servant)', theme: 'Using our God-given talents and remaining faithful servants to the Lord' },
  { name: 'ኒቆዲሞስ (Nicodimos - Nicodemus)', theme: 'Being born again in spirit, seeking Christ in the darkness, and true conversion' },
  { name: 'ሆሣዕና (Hosanna - Palm Sunday)', theme: 'The triumphal entry of Jesus into Jerusalem, declaring Him as the true King of Peace' }
];

// ─── Main Liturgical Context Engine ─────────────────────────────────────────

export function getLiturgicalContext(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  const ethMonthName = ETHIOPIAN_MONTHS[ethDate.month] || 'Unknown';
  const gDayOfWeek = date.getDay(); // 0: Sun, 3: Wed, 5: Fri

  console.log(`📅 Ethiopian Date: ${ethMonthName} ${ethDate.day}, ${ethDate.year}`);

  // Calculate Moveable Feasts using Bahire Hasab
  const moveables = calculateMoveableFeasts(ethDate.year);

  // ── Determine if we are in the 50-day Fasika season (no fasting period) ──
  const inFasikaSeason = (() => {
    const ethVal  = ethDate.month * 1000 + ethDate.day;
    const fasVal  = moveables.fasika.month * 1000 + moveables.fasika.day;
    const perkVal = moveables.perakletos.month * 1000 + moveables.perakletos.day;
    // Handle year-wrap edge case (extremely rare but safe)
    if (fasVal <= perkVal) return ethVal >= fasVal && ethVal <= perkVal;
    return ethVal >= fasVal || ethVal <= perkVal;
  })();

  // 1. Check Moveable Major Feasts (Highest Priority)
  if (isSameEthDate(ethDate, moveables.fasika))     return createFeast('ፋሲካ (Fasika — Easter Resurrection)', 'The glorious Resurrection of Jesus Christ conquering death, the greatest feast of the Church. On this day death itself was defeated and eternal life was granted to all who believe. "ሞት ተዋጠ ለድል!" — Death is swallowed up in victory.', 'major_feast', 'triumphant', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.erget))      return createFeast('ዕርገት (Erget — Ascension of Christ)', 'The bodily Ascension of the risen Lord Jesus Christ into the highest heavens, seated at the right hand of God the Father Almighty. He ascended so that He might fill all things and send the Comforter.', 'major_feast', 'celebratory', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.perakletos)) return createFeast('ጰራቅሊጦስ (Perakletos — Pentecost)', 'The descent of the Holy Spirit as tongues of fire upon the Apostles in Jerusalem, birthing the Church and empowering believers with spiritual gifts. The 50-day fasting exemption now ends and the Apostles Fast begins.', 'major_feast', 'joyful', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.hosanna))    return createFeast('ሆሣዕና (Hosanna — Palm Sunday)', 'The triumphal entry of Jesus into Jerusalem riding a donkey — fulfilling prophecy and declaring Him the King of Peace. The crowd cried "ሆሳዕና!" as they laid palm branches before Him.', 'major_feast', 'joyful', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.hqmuss))     return createFeast('ጸሎተ ሐሙስ (Tselote Hamus — Maundy Thursday)', 'The night of the Last Supper where Christ instituted the Holy Eucharist and washed the disciples\' feet. He was then betrayed in Gethsemane. A night of deepest prayer and holy mystery.', 'major_feast', 'penitential', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.siklet))     return createFeast('ስቅለት (Siklet — Good Friday)', 'The voluntary sacrifice of Christ on the Holy Cross — the turning point of all history. His blood shed for the redemption of humanity. "ወደ ምድር ሁሉ ቃሉ ወጣ" — His word went out to all the earth.', 'major_feast', 'penitential', ethDate, ethMonthName);

  // 2. Check Fixed Major Feasts
  for (const feast of MAJOR_FIXED_FEASTS) {
    if (ethDate.month === feast.month && ethDate.day === feast.day) {
      return createFeast(feast.name, feast.theme, feast.type, feast.mood, ethDate, ethMonthName);
    }
  }

  // 3. Check Moveable Fasts (Bahire Hasab Ranges)
  // ዐቢይ ጾም (Great Lent) -> 55 Days before Easter
  if (isEthDateInRange(ethDate, moveables.abiyTsomStart, offsetEthDate(moveables.fasika, -1))) {
    // Determine the specific Lenten Week if it's a Sunday
    if (gDayOfWeek === 0) { // Sunday
      const daysSinceStart = (ethDate.month * 30 + ethDate.day) - (moveables.abiyTsomStart.month * 30 + moveables.abiyTsomStart.day);
      let weekIndex = Math.floor(daysSinceStart / 7);
      if (weekIndex >= 0 && weekIndex < LENTEN_WEEKS.length) {
         return createFast(LENTEN_WEEKS[weekIndex].name, LENTEN_WEEKS[weekIndex].theme, 'abiy_tsom_sunday', 'contemplative', ethDate, ethMonthName);
      }
    }
    
    // Check if it's the precise first day
    if (isSameEthDate(ethDate, moveables.abiyTsomStart)) {
      return createFast('Start of ዐቢይ ጾም (Great Lent)', 'The beginning of Great Lent: deep repentance, intense fasting, spiritual warfare, and preparation for the Resurrection', 'fasting_start', 'penitential', ethDate, ethMonthName);
    }

    // Generic Great Lent Day
    return createFast('ዐቢይ ጾም (Great Lent)', 'Deep repentance, intense fasting, spiritual warfare, and preparation for the Resurrection', 'fasting_season', 'penitential', ethDate, ethMonthName);
  }

  // ጾመ ነነዌ (Fast of Nineveh) -> 3 days
  if (isEthDateInRange(ethDate, moveables.nenewe, offsetEthDate(moveables.nenewe, 2))) {
    if (isSameEthDate(ethDate, moveables.nenewe)) {
      return createFast('Start of ጾመ ነነዌ (Fast of Nineveh)', 'The beginning of the Fast of Nineveh: turning away from sin and trusting in God\'s ultimate mercy and forgiveness', 'fasting_start', 'penitential', ethDate, ethMonthName);
    }
    return createFast('ጾመ ነነዌ (Fast of Nineveh)', 'The repentance of Nineveh: turning away from sin and trusting in God\'s ultimate mercy and forgiveness', 'fasting_season', 'penitential', ethDate, ethMonthName);
  }

  // ጾመ ሐዋርያት (Apostles Fast) -> From Pentecost to Hamle 5
  if (isEthDateInRange(ethDate, moveables.tsomeHawariatStart, { year: ethDate.year, month: 11, day: 5 })) {
    if (isSameEthDate(ethDate, moveables.tsomeHawariatStart)) {
      return createFast('Start of ጾመ ሐዋርያት (Apostles Fast)', 'The beginning of the Apostles Fast: honoring their mission and the call to discipleship', 'fasting_start', 'contemplative', ethDate, ethMonthName);
    }
    return createFast('ጾመ ሐዋርያት (Apostles Fast)', 'Honoring the apostles, their mission to spread the Gospel, and the call to discipleship', 'fasting_season', 'contemplative', ethDate, ethMonthName);
  }

  // 4. Check Fixed Fasts
  for (const fast of FIXED_FASTS) {
    if (isEthDateInRange(ethDate, { year: ethDate.year, month: fast.startMonth, day: fast.startDay }, { year: ethDate.year, month: fast.endMonth, day: fast.endDay })) {
      if (ethDate.month === fast.startMonth && ethDate.day === fast.startDay) {
        return createFast(`Start of ${fast.name}`, fast.theme, 'fasting_start', fast.mood, ethDate, ethMonthName);
      }
      return createFast(fast.name, fast.theme, 'fasting_season', fast.mood, ethDate, ethMonthName);
    }
  }

  // 5. Check Zemene (Ecological/Liturgical Seasons)
  const zemene = getZemene(ethDate);

  // 6. Apply Daily Saint (Medium priority - forms the baseline of every day)
  const dailySaint = DAILY_COMMEMORATIONS[ethDate.day];

  // 7. Check Weekly Fasts (Wednesday & Friday)
  // CRITICAL EOTC RULE: During the 50-day Fasika season (Easter to Pentecost),
  // Wednesday and Friday fasts are COMPLETELY LIFTED. This is a canonical rule.
  if (gDayOfWeek === 3 || gDayOfWeek === 5) {
    if (inFasikaSeason) {
      // No fast — it's the joyful 50 days of resurrection celebration
      const dayName = gDayOfWeek === 3 ? 'Wednesday' : 'Friday';
      const joyTheme = `Although today is ${dayName}, there is NO FASTING during the 50-day Fasika (Easter) season — this is a canonical EOTC rule. We rejoice in the Resurrection! Today we also commemorate ${dailySaint.saint}: ${dailySaint.theme}.`;
      return createFeast(`${dayName} — Fasika Season (No Fast)`, joyTheme, 'fasika_season', 'triumphant', ethDate, ethMonthName);
    }

    const wName    = gDayOfWeek === 3 ? 'የረቡዕ ጾም (Wednesday Fast)' : 'የአርብ ጾም (Friday Fast)';
    const wTheme   = gDayOfWeek === 3
      ? 'Remembering the betrayal of Judas Iscariot with a kiss in the Garden — the cost of unfaithfulness, greed, and spiritual negligence. We fast to cleanse ourselves of all that separates us from Christ.'
      : 'Remembering the Crucifixion of our Lord Jesus Christ on Calvary — His precious blood poured out for our salvation. We fast in solemn gratitude for the depth of divine sacrifice and in solidarity with His suffering.';

    const compositeTheme = `${wTheme} Today we also commemorate ${dailySaint.saint}: ${dailySaint.theme}. Season: ${zemene.name} — ${zemene.theme}.`;
    return createFast(wName, compositeTheme, 'weekly_fast', 'penitential', ethDate, ethMonthName);
  }

  // If no major fast or feast, return the daily saint with full seasonal context
  const baselineTheme = `Today the Church commemorates ${dailySaint.saint}: ${dailySaint.theme}. We are currently in ${zemene.name} — ${zemene.theme}.`;
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
  const m = ethDate.month;
  const d = ethDate.day;

  // ── Zemene Tsige (Season of Flowers / Holy Family) — Meskerem 26 to Hidar 6
  // Commemorates the Flight of the Holy Family to Egypt
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 1, day: 26 }, { year: ethDate.year, month: 3, day: 6 })) {
    return {
      name: 'ዘመነ ጽጌ (Zemene Tsige — Season of Flowers)',
      theme: 'The season commemorating the Flight of the Holy Family to Egypt. Just as the Lord was protected in a foreign land, the faithful find shelter in God through every exile and trial. Nature blooms as the Church celebrates the Virgin Mary and the infant Christ.'
    };
  }

  // ── Keremt (Rainy Season / Monastic Season) — Sene 26 to Meskerem 25
  // A time of agricultural abundance and intense monastic retreat
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 10, day: 26 }, { year: ethDate.year + 1, month: 1, day: 25 })) {
    return {
      name: 'ዘመነ ክረምት (Keremt — Rainy Season / Monastic Retreat)',
      theme: 'The long rainy season — a time when monks and clergy traditionally remain in their monasteries for intense study, prayer, and fasting. God sends the rain from heaven as a sign of His provision and the season reminds us that spiritual growth requires seasons of quiet withdrawal.'
    };
  }

  // ── Zemene Bega (Dry Season / Harvest Season) — Meskerem 26 to Tir 30 approx
  // Actually this overlaps with Tsige, so we check a sub-range
  if ((m === 9 || m === 10) || (m === 8 && d >= 15)) {
    return {
      name: 'ዘመነ በጋ (Zemene Bega — Dry / Harvest Season)',
      theme: 'The dry, golden harvest season — the earth gives its fruit and the Church rejoices. A time of great feasts including Buhe and the preparations for the rains. Farmers harvest grain as the faithful harvest the fruits of their fasting and prayer.'
    };
  }

  // ── Default: Zemene Sebket (Season of Preaching) — the rest of the year
  return {
    name: 'ዘመነ ስብከት (Zemene Sebket — Season of Preaching)',
    theme: 'The season dedicated to the apostolic preaching of the Gospel — when the Church goes forth boldly, teaching, baptizing, and extending the Kingdom of God to every corner of the earth. A time for study of the scriptures and theological formation.'
  };
}

export function formatContextForPrompt(context) {
  if (!context) return '';

  const moodInstructions = {
    joyful:       'The tone must be radiant, warm, celebratory, and full of living hope. Avoid heaviness. Let the joy overflow.',
    triumphant:   'The tone must be bold, victorious, and thunderously powerful. Christ has conquered — speak with absolute certainty of divine victory.',
    celebratory:  'The tone must be festive, deeply grateful, and uplifting — as if writing for thousands gathered in worship.',
    contemplative:'The tone must be gentle, reflective, and inward. Invite the reader to pause, breathe, and listen to the still small voice of God.',
    penitential:  'The tone must be humble, sober, and focused on repentance, renewal, and the mercy of God. Avoid despair; end with hope.',
    devotional:   'The tone must be reverent, intimate, and warm — like a trusted spiritual father speaking directly to the soul.',
    penitential:  'The tone must be solemn yet hopeful — acknowledging the weight of sin while anchoring in the inexhaustible mercy of God.',
  };

  const typeGuidance = {
    major_feast:    'This is a MAJOR feast — treat it with maximum theological depth, cultural richness, and celebratory energy. Reference specific Ethiopian Orthodox traditions, rituals, and scriptural fulfillments associated with this feast.',
    feast:          'This is a feast day. Give it liturgical weight, connect it to the broader salvation narrative, and honor any saints or archangels commemorated.',
    fasting_start:  'This is the VERY FIRST DAY of a fasting season. Explicitly celebrate this beginning. Use language of starting, committing, and entering. Set the spiritual intention for the entire season.',
    fasting_season: 'This is an ONGOING fast — NOT the first day. Do NOT say "begins today" or "starts now." Speak to someone already in the middle of the fast: encourage, deepen, sustain.',
    abiy_tsom_sunday: 'This is a specific named Sunday of Great Lent with its own unique theological theme. Focus ENTIRELY and EXCLUSIVELY on this Sunday\'s specific theme — do not speak generally about Lent.',
    weekly_fast:    'This is a weekly fast (Wednesday or Friday). Connect the day\'s fast to its specific spiritual meaning AND to the daily saint being commemorated.',
    fasika_season:  'This is the joyful 50-day Fasika season — there is NO FASTING today. The tone must be entirely triumphant and resurrection-focused.',
    devotional:     'This is an ordinary day with a daily saint commemoration. Make the saint\'s story vivid and draw a direct, practical spiritual lesson for modern Ethiopian believers.',
  };

  const moodInstruction = moodInstructions[context.mood] || 'The tone should be spiritually rich and authentically EOTC.';
  const typeGuideline   = typeGuidance[context.type]   || '';

  return [
    `\n\n═══════════ LITURGICAL CONTEXT (MANDATORY — READ CAREFULLY) ═══════════`,
    `📅 Ethiopian Calendar Date: ${context.ethiopianDate}`,
    `🔔 Today's Occasion: "${context.event}"`,
    `📖 Theological Theme: ${context.theme}`,
    ``,
    `🎭 MOOD & TONE INSTRUCTION: ${moodInstruction}`,
    ``,
    `📋 CONTENT TYPE GUIDANCE: ${typeGuideline}`,
    ``,
    `⚠️  CRITICAL RULES:`,
    `   1. Your content MUST be deeply anchored in this specific occasion. Do NOT produce generic or recycled content.`,
    `   2. Use the exact Ethiopian feast name in your content where appropriate (in Amharic script).`,
    `   3. Reference at least one specific scriptural passage that directly connects to this theme.`,
    `   4. If this is a saints' day, make the saint come alive — tell their story, their sacrifice, their relevance today.`,
    `   5. Write as a respected EOTC theologian, not as a generic religious platform.`,
    `═══════════════════════════════════════════════════════════════════════\n`,
  ].join('\n');
}
