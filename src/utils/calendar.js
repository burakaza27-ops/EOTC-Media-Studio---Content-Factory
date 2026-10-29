/**
 * EOTC Liturgical Calendar Engine
 * ================================
 * Converts Gregorian dates to the Ethiopian calendar comprehensively determining
 * the current liturgical season, feast, fasting week, or daily saint commemoration.
 * Features: True Bahire Hasab (Computus) for moveable feasts, 30-day commemorations, and Zemene (Seasons).
 */

import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { createChildLogger } from './logger.js';

const log = createChildLogger('calendar');

// ─── Ethiopian Calendar Conversion ──────────────────────────────────────────
// Delegated to the verified ethiopian-calendar-date-converter library.
// The previous custom implementation had off-by-one errors in leap year
// boundary calculations that caused every date to be wrong.

export function toEthiopianDate(gregorianDate = new Date()) {
  // Normalize the Gregorian calendar date components (year, month, day) to UTC noon
  // to ensure 100% deterministic, timezone-independent calendar conversions across
  // all host environments (UTC servers, GitHub Actions CI runners, and EAT local time).
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth();
  const day = gregorianDate.getDate();
  const normalized = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const eth = EthDateTime.fromEuropeanDate(normalized);
  return { year: eth.year, month: eth.month, day: eth.date };
}

// ─── Constants & Reference Arrays ───────────────────────────────────────────

export const ETHIOPIAN_MONTHS = {
  1: 'Meskerem', 2: 'Tikimt', 3: 'Hidar', 4: 'Tahsas',
  5: 'Tir', 6: 'Yekatit', 7: 'Megabit', 8: 'Miyazya',
  9: 'Ginbot', 10: 'Sene', 11: 'Hamle', 12: 'Nehase', 13: 'Pagume'
};

export const ETHIOPIAN_MONTHS_AMHARIC = {
  1: 'መስከረም', 2: 'ጥቅምት', 3: 'ኅዳር', 4: 'ታኅሣሥ',
  5: 'ጥር', 6: 'የካቲት', 7: 'መጋቢት', 8: 'ሚያዝያ',
  9: 'ግንቦት', 10: 'ሰኔ', 11: 'ሐምሌ', 12: 'ነሐሴ', 13: 'ጳጉሜ'
};

const DAILY_COMMEMORATIONS = {
  1:  { saint: 'ልደታ ለማርያም እና ነቢዩ ኤልያስ (Lideta Mariam & Elyas)', theme: 'የእመቤታችን የቅድስት ድንግል ማርያም ልደትና ነቢዩ ኤልያስ በሰረገላ እሳት ወደ ሰማይ ያረገበት መታሰቢያ ነው። ከሐና እና ከኢያቄም የተወለደችው ድንግል የድኅነታችን መጀመሪያ ናት።', type: 'saint' },
  2:  { saint: 'ሐዋርያው ታዴዎስ (Thaddeus the Apostle)', theme: 'ከዐሥራ ሁለቱ ሐዋርያት አንዱ የሆነው ቅዱስ ታዴዎስ በፋርስና በአርመንያ ወንጌልን አስተምሮ በሰማዕትነት ያለፈበት መታሰቢያ ነው።', type: 'saint' },
  3:  { saint: "በዓታ ለማርያም (Ba'eta Mariam - Presentation)", theme: 'እመቤታችን ቅድስት ድንግል ማርያም በሦስት ዓመቷ ወደ ቤተ መቅደስ የገባችበትና በአጸደ መቅደስ በመላእክት እየተመገበች ያደገችበት በዓታ ለማርያም መታሰቢያ ነው።', type: 'saint' },
  4:  { saint: 'ዮሐንስ ወልደ ነጎድጓድ (Yohannes Wolde Negedgwad)', theme: 'በጌታችን ደረት ላይ የተደገፈውና በመስቀሉ ሥር ቆሞ እመቤታችንን በአደራ የተቀበለው ፍቁረ እግዚእ ቅዱስ ዮሐንስ ወንጌላዊ መታሰቢያ ነው።', type: 'saint' },
  5:  { saint: 'አቡነ ገብረ መንፈስ ቅዱስ (Abune Gebre Menfes Kidus)', theme: 'በቆላና በደብር ከ፫፻ ዓመታት በላይ በጾምና በጸሎት የተጋደሉት፣ አራዊት የታዘዙላቸው ታላቁ ጻድቅ አቡነ ገብረ መንፈስ ቅዱስ ወርሃዊ መታሰቢያ ነው።', type: 'saint' },
  6:  { saint: 'ኢየሱስ እና ቁስቋም ማርያም (Iyesus & Qusquam)', theme: 'ጌታችን መድኃኒታችን ኢየሱስ ክርስቶስ ከድንግል እናቱና ከጻድቁ ዮሴፍ ጋር በስደት ወደ ግብፅ በሄደ ጊዜ በደብረ ቁስቋም ያደረበትና የተሰወረበት ወርሃዊ መታሰቢያ ነው።', type: 'feast', isLordFeast: true },
  7:  { saint: 'ቅድስት ሥላሴ (Kidist Selassie — The Holy Trinity)', theme: 'አብ፣ ወልድ፣ መንፈስ ቅዱስ — በስም፣ በአካል፣ በግብር ሦስት፤ በባሕርይ፣ በህልውና፣ በመለኮት አንድ የሆኑ የቅድስት ሥላሴ ወርሃዊ በዓል ነው።', type: 'feast', isLordFeast: true },
  8:  { saint: 'አባ ኪሮስ እና ኪሩቤል (Abba Kiros & The Cherubim)', theme: 'ታላቁ ባሕታዊ አባ ኪሮስ በገዳማዊ ሕይወት እግዚአብሔርን ያገለገሉበትና የእግዚአብሔርን ዙፋን የሚያጥኑ እልፍ አዕላፍ ኪሩቤል መታሰቢያ ነው።', type: 'saint' },
  9:  { saint: 'ሐዋርያው ቶማስ (Thomas the Apostle)', theme: 'የጌታችንን የትንሣኤውን ምሥጢር አይቶ "ጌታዬና አምላኬ" ብሎ የመሰከረውና በሕንድ አገር ወንጌልን አስተምሮ በሰማዕትነት ያለፈው ቅዱስ ቶማስ ሐዋርያ መታሰቢያ ነው።', type: 'saint' },
  10: { saint: 'በዓለ መስቀል (Meskel — The Holy Cross)', theme: 'ድኅነት የተፈጸመበት፣ የዲያብሎስ ኃይል የተሻረበት የከበረና ሕያው የጌታችን የኢየሱስ ክርስቶስ ቅዱስ መስቀል ወርሃዊ መታሰቢያ ነው።', type: 'feast' },
  11: { saint: 'ቅድስት ሐና እና ቅዱስ ኢያቄም (Hanna & Joachim)', theme: 'የእመቤታችን የድንግል ማርያም ደጋግ ወላጆች ቅድስት ሐና እና ጻድቁ ኢያቄም በጾምና በጸሎት ጸንተው የተስፋውን ፍሬ የተቀበሉበት መታሰቢያ ነው።', type: 'saint' },
  12: { saint: 'ቅዱስ ሚካኤል (St. Michael the Archangel)', theme: 'የመላእክት አለቃ ቅዱስ ሚካኤል ሕዝበ እግዚአብሔርን የሚጠብቅ፣ ሰይጣንን ድል የነሣና በምልጃው ፈጥኖ የሚደርስ የታመነ መልአክ መታሰቢያ ነው።', type: 'saint' },
  13: { saint: 'ቅዱስ ሩፋኤል (St. Raphael the Archangel)', theme: 'ፈዋሹና ፈጣኑ መልአክ ቅዱስ ሩፋኤል የጦቢያን ዓይን ያበራ፣ ሳራን ከጭንቀት ያዳነና በፈዋሽነቱ የሚታወቅ የመላእክት አለቃ መታሰቢያ ነው።', type: 'saint' },
  14: { saint: 'አቡነ አረጋዊ እና ገብረ ክርስቶስ (Abune Aregawi & Gebre Kristos)', theme: 'ከተሰዐቱ ቅዱሳን አንዱ የደብረ ዳሞ መሥራች አቡነ አረጋዊ እና ንግሥናውን ንቆ ስለ ክርስቶስ ብሎ የደኸየው መርዓዊው ገብረ ክርስቶስ መታሰቢያ ነው።', type: 'saint' },
  15: { saint: 'ቅዱስ ቂርቆስ እና ኢየሉጣ (Kirkos & Iyalutha)', theme: 'ሕፃኑ ቅዱስ ቂርቆስና እናቱ ቅድስት ኢየሉጣ በእቶነ እሳት ውስጥ ስለ ክርስቶስ ፍቅር ምስክር ሆነው በሰማዕትነት ያለፉበት ታላቅ መታሰቢያ ነው።', type: 'saint' },
  16: { saint: 'ኪዳነ ምሕረት (Kidane Mihret — Covenant of Mercy)', theme: 'ጌታችን ለድንግል እናቱ "የስምሽን የጠራ፣ መታሰቢያሽን ያደረገ እምርልሻለሁ" ብሎ የገባላት የፍቅርና የምሕረት ቃል ኪዳን ወርሃዊ በዓል ነው።', type: 'feast' },
  17: { saint: 'ቅዱስ እስጢፋኖስ (St. Stephen the Protomartyr)', theme: 'የመጀመሪያው ክርስቲያን ሰማዕትና ዲያቆን ቅዱስ እስጢፋኖስ በድንጋይ ተወግሮ ሲያልፍ "ይህን ኃጢአት አትቁጠርባቸው" ብሎ በፍቅር የጸለየው አርአያ መታሰቢያ ነው።', type: 'saint' },
  18: { saint: 'አቡነ ኤዎስጣቴዎስ (Abune Ewostatewos)', theme: 'ስለ ቀናች ሃይማኖትና ስለ ቀዳሚት ሰንበት ክብር የተጋደሉት፣ ባሕርን እንደ የብስ ተሻግረው ወንጌልን ያበሰሩት ጻድቁ አቡነ ኤዎስጣቴዎስ መታሰቢያ ነው።', type: 'saint' },
  19: { saint: 'ቅዱስ ገብርኤል (St. Gabriel the Archangel)', theme: 'የብስራት መልአክ የሆነው ቅዱስ ገብርኤል ለነቢዩ ዳንኤል ምሥጢርን የገለጠ፥ ሦስቱን ሕፃናት ከእቶነ እሳት ያዳነ፥ ለእመቤታችንም የድኅነት ብስራትን ያበሰረበት መታሰቢያ ነው።', type: 'saint' },
  20: { saint: "ሕንፀተ ቤተ ክርስቲያን (Hnstata Mariam)", theme: 'በፊልጵስዩስ ከተማ በእመቤታችን ስም የመጀመሪያዋ ቤተ ክርስቲያን የታነጸችበትና የውዳሴ ማርያም ደራሲ ቅዱስ ኤፍሬም ሶርያዊ የሚታሰብበት የተባረከ ዕለት ነው።', type: 'saint' },
  21: { saint: 'ቅድስት ማርያም (Kidist Mariam — The Virgin Mary)', theme: 'የአምላክ እናት፣ እመቤታችን ቅድስት ድንግል ማርያም ወላዲተ አምላክ ወርሃዊ በዓል ነው። አማላጅነቷና ረድኤቷ ለሕዝበ ክርስቲያን ሁሉ መጠጊያ ነው።', type: 'saint' },
  22: { saint: 'ቅዱስ ዑራኤል (St. Uriel the Archangel)', theme: 'ብርሃናዊው መልአክ ቅዱስ ዑራኤል ለዕዝራ ሱቱኤል ጥበብንና ምሥጢርን የገለጠ፣ የጌታችንን ክቡር ደም በጽዋ ተቀብሎ ዓለምን የረጨ የመላእክት አለቃ መታሰቢያ ነው።', type: 'saint' },
  23: { saint: 'ቅዱስ ጊዮርጊስ (St. George the Great Martyr)', theme: 'ስለ ክርስቶስ ስም ሰባት ዓመት ሙሉ ልዩ ልዩ ሥቃይን የታገሠውና ድል የነሣው ኮከበ ገዳም፣ ታላቁ ሰማዕት ቅዱስ ጊዮርጊስ ወርሃዊ መታሰቢያ ነው።', type: 'saint' },
  24: { saint: 'አቡነ ተክለ ሃይማኖት (Abune Tekle Haymanot)', theme: 'ኢትዮጵያዊው ፀሐይ፣ የደብረ ሊባኖስ ገዳም መሥራች፣ ለ፳፪ ዓመታት በአንድ እግራቸው የቆሙትና ክንፍ የተሰጣቸው ታላቁ አባት አቡነ ተክለ ሃይማኖት መታሰቢያ ነው።', type: 'saint' },
  25: { saint: 'ቅዱስ መርቆሬዎስ (St. Mercurius the Martyr)', theme: 'ባለ ሁለት ሰይፉ ሰማዕት ቅዱስ መርቆሬዎስ ስለ እውነተኛይቱ ተዋሕዶ እምነት በሮም ንጉሥ ፊት ያለ ፍርሃት የመሰከረ ኃያል ሰማዕት መታሰቢያ ነው።', type: 'saint' },
  26: { saint: 'አረጋዊው ዮሴፍ (Joseph the Carpenter)', theme: 'የእመቤታችን ጠባቂና የጌታችን አሳዳጊ የነበረው ጻድቁና ታማኙ አረጋዊ ዮሴፍ በትሕትናውና በቅን ታዛዥነቱ የሚዘከርበት መታሰቢያ ነው።', type: 'saint' },
  27: { saint: 'መድኃኔዓለም (Medhane Alem — Savior of the World)', theme: 'ዓለምን ሁሉ ለማዳን በመስቀል ላይ ቅዱስ ሥጋውን የቆረሰ፣ ክቡር ደሙን ያፈሰሰ የጌታችንና መድኃኒታችን የኢየሱስ ክርስቶስ ወርሃዊ የበዓለ ድኅነት መታሰቢያ ነው።', type: 'feast', isLordFeast: true },
  28: { saint: 'አማኑኤል (Amanuael — Emmanuel, God With Us)', theme: 'አማኑኤል ማለት "እግዚአብሔር ከእኛ ጋር ሆነ" ማለት ነው። ሰው ሆኖ ከእኛ ጋር የተዋሐደውና ያዳነን የጌታችንና አምላካችን የኢየሱስ ክርስቶስ ወርሃዊ በዓል ነው።', type: 'feast', isLordFeast: true },
  29: { saint: 'በዓለ ወልድ (Bale Wold — Feast of God the Son)', theme: 'የእግዚአብሔር አብ የባሕርይ ልጅ፣ ለእኛ ድኅነት ከድንግል ማርያም በተዋሕዶ ሰው የሆነው የጌታችን የወልደ እግዚአብሔር ወርሃዊ በዓል ነው።', type: 'feast', isLordFeast: true },
  30: { saint: 'ቅዱስ ማርቆስ (St. Mark the Evangelist)', theme: 'የወንጌል ጸሐፊ፣ የአንበሳ ምሳሌ የተሰጠውና የእስክንድርያ መንበር መሥራች የሆነው ሐዋርያው ቅዱስ ማርቆስ በሰማዕትነት ያለፈበት ወርሃዊ መታሰቢያ ነው።', type: 'saint' },
};


const MAJOR_FIXED_FEASTS = [
  // ── Meskerem (Month 1) ──
  { month: 1,  day: 1,  name: 'እንቁጣጣሽ (Enkutatash — Ethiopian New Year)', theme: 'የኢትዮጵያ አዲስ ዓመት እንቁጣጣሽ — አሮጌው ዓመት ተፈጽሞ አዲሱ በሰላም የተተካበት፣ ሕፃናት አደይ አበባ ይዘው እግዚአብሔርን የሚያመሰግኑበት የበረከት ዕለት ነው።', type: 'major_feast', mood: 'joyful' },
  { month: 1,  day: 2,  name: 'በዓለ ዮሐንስ (Feast of St. John the Baptist)', theme: 'የጌታችን መንገድ ጠራጊና መጥምቅ የሆነው የቅዱስ ዮሐንስ መጥምቅ መታሰቢያ ነው። "እርሱ ሊልቅ እኔ ግን ላንስ ያስፈልጋል" በማለት ፍጹም ትሕትናን አስተምሯል።', type: 'feast', mood: 'devotional' },
  { month: 1,  day: 17, name: 'መስቀል (Meskel — Finding of the True Cross)', theme: 'ንግሥት ዕሌኒ የጌታችንን ክቡር መስቀል በደመራ ጭስ መሪነት ቆፍራ ያገኘችበት ታላቅ በዓል ነው። "መስቀል በደመና ተገኘ!" እያልን የድኅነታችንን ምልክት በደስታ እናከብራለን።', type: 'major_feast', mood: 'triumphant' },
  { month: 1,  day: 26, name: 'ቅድስት ማርያም (Kidist Mariam — Start of Zemene Tsige)', theme: 'የዘመነ ጽጌ መግቢያና የእመቤታችን ቅድስት ድንግል ማርያም ወርሃዊ መታሰቢያ ነው። የእመቤታችንና የልጇ የስደት መከራ የሚታሰብበት ወቅት ነው።', type: 'feast', mood: 'joyful' },

  // ── Tikimt (Month 2) ──
  { month: 2,  day: 1,  name: 'ልደታ ለማርያም (Lideta Mariam)', theme: 'የእመቤታችን የቅድስት ድንግል ማርያም ወርሃዊ የልደት በዓል ነው። ዓለምን የፈጠረውን አምላክ በማህፀኗ የተሸከመችው ንጽሕት ድንግል የተወለደችበት መታሰቢያ ነው።', type: 'feast', mood: 'joyful' },
  { month: 2,  day: 12, name: 'ቅዱስ ሚካኤል (Tikimt Mikael)', theme: 'የመላእክት አለቃ ቅዱስ ሚካኤል ወርሃዊ በዓል ነው። ሰይጣንን ድል የነሣና ለምእመናን ዘወትር የሚማልደው የዋሁ መልአክ ይታሰባል።', type: 'feast', mood: 'celebratory' },
  { month: 2,  day: 21, name: 'ቅድስት ማርያም (Tikimt Mariam)', theme: 'በዘመነ ጽጌ ወቅት የሚከበረው የእመቤታችን የድንግል ማርያም ወርሃዊ በዓል። ምእመናን ማኅሌተ ጽጌንና ውዳሴ ማርያምን በደስታ ያቀርባሉ።', type: 'feast', mood: 'devotional' },

  // ── Hidar (Month 3) ──
  { month: 3,  day: 1,  name: 'ልደታ ለማርያም (Lideta Mariam — Nativity of the Virgin Mary)', theme: 'የድኅነታችን መጀመሪያ የሆነችው የእመቤታችን የቅድስት ድንግል ማርያም ዓመታዊ የልደት መታሰቢያ። ሐና እና ኢያቄም በደስታ የተሞሉበት ዕለት ነው።', type: 'major_feast', mood: 'joyful' },
  { month: 3,  day: 6,  name: 'ቁስቋም (Qusquam — Flight to Egypt / End of Zemene Tsige)', theme: 'ቅዱስ ቤተሰብ በግብፅ ደብረ ቁስቋም ያረፉበትና የዘመነ ጽጌ ፍጻሜ የሆነው ታላቁ በዓል። የኢሳይያስ ትንቢት የተፈጸመበት ምስጢር ነው።', type: 'major_feast', mood: 'joyful' },
  { month: 3,  day: 12, name: 'ኅዳር ሚካኤል (Hidar Michael — Annual Feast of Archangel Michael)', theme: 'የመላእክት አለቃ ቅዱስ ሚካኤል ታላቅ ዓመታዊ በዓል። ሰይጣንን ከሰማይ ያወረደበትና ሕዝበ እግዚአብሔርን ከጠላት እጅ የታደገበት በዓል በታላቅ ድምቀት ይከበራል።', type: 'major_feast', mood: 'celebratory' },
  { month: 3,  day: 21, name: 'ጽዮን ማርያም (Tsion Mariam — St. Mary of Zion)', theme: 'ታቦተ ጽዮን ወደ አክሱም የገባችበትና እመቤታችን ቅድስት ድንግል ማርያም በጽዮን የምትከበርበት ታላቁ ዓመታዊ በዓል። ድንግል ማርያም እውነተኛይቱ የቃል ኪዳን ታቦት ናት።', type: 'major_feast', mood: 'joyful' },

  // ── Tahsas (Month 4) ──
  { month: 4,  day: 7,  name: 'ቅድስት ሥላሴ (Kidist Selassie)', theme: 'የቅድስት ሥላሴ ወርሃዊ በዓል — ፫ አካል ፩ አምላክ። አብ ወላዲ፣ ወልድ ተወላዲ፣ መንፈስ ቅዱስ ሠራፂ ብለን የምናምንበት የሃይማኖታችን መሠረት ነው።', type: 'feast', mood: 'devotional' },
  { month: 4,  day: 28, name: 'የገና ጋድ (Gahad Genna — Vigil of Christmas)', theme: 'የገና ዋዜማ ጋድ — የብርሃን ጌታ ኢየሱስ ክርስቶስ በቤተልሔም እስኪወለድ በጾምና በጸሎት የሚጠበቅበት ቅዱስ ዋዜማ ነው።', type: 'feast', mood: 'penitential' },
  { month: 4,  day: 29, name: 'ገና / ልደት (Genna / Lidet — Ethiopian Christmas)', theme: 'የጌታችንና የመድኃኒታችን የኢየሱስ ክርስቶስ የልደት በዓል — ልደተ ብርሃን። መላእክት "ስብሐት ለእግዚአብሔር በአርያም" ብለው ያመሰገኑበት የድኅነት ቀን ነው።', type: 'major_feast', mood: 'joyful' },

  // ── Tir (Month 5) ──
  { month: 5,  day: 10, name: 'የጥምቀት ጋድ (Gahad Timkat — Vigil of Epiphany)', theme: 'የጥምቀት ዋዜማ ጋድ (ከተራ) — ታቦታት ወደ ባሕረ ጥምቀት በዝማሬና በታላቅ ክብር የሚወርዱበት የተባረከ ዕለት ነው።', type: 'feast', mood: 'penitential' },
  { month: 5,  day: 11, name: 'ጥምቀት (Timkat — Ethiopian Epiphany)', theme: 'ጌታችን ኢየሱስ ክርስቶስ በዮርዳኖስ ባሕር በዮሐንስ እጅ የተጠመቀበት ታላቁ የጥምቀት በዓል — ምሥጢረ ሥላሴ የተገለጠበት በዓለ ኤጲፋንያ ነው።', type: 'major_feast', mood: 'celebratory' },
  { month: 5,  day: 12, name: 'ቃና ዘገሊላ (Kana Zegelila — Wedding at Cana)', theme: 'ጌታችን በቃና ዘገሊላ ሰርግ ላይ ውኃውን ወደ ወይን ጠጅ የለወጠበት የመጀመሪያው ተአምር መታሰቢያ ነው።', type: 'feast', mood: 'celebratory' },

  // ── Yekatit (Month 6) ──
  { month: 6,  day: 16, name: 'ኪዳነ ምሕረት (Kidane Mihret — Covenant of Mercy)', theme: 'የእመቤታችን የኪዳነ ምሕረት ዓመታዊ በዓል — ጌታችን ለድንግል እናቱ "የስምሽን የጠራውን እምርልሻለሁ" ብሎ የምሕረት ቃል ኪዳን የሰጣት ታላቅ በዓል ነው።', type: 'major_feast', mood: 'joyful' },
  { month: 6,  day: 23, name: 'ቅዱስ ጊዮርጊስ (Yekatit Giyorgis)', theme: 'ታላቁ ሰማዕት ቅዱስ ጊዮርጊስ ስለ ክርስቶስ ፍቅር ምስክር ሆኖ ሰባት ዓመት የተጋደለበት ወርሃዊ መታሰቢያ ነው።', type: 'feast', mood: 'celebratory' },

  // ── Megabit (Month 7) ──
  { month: 7,  day: 1,  name: 'ልደታ ለማርያም (Megabit Lideta)', theme: 'በመጋቢት ወር የሚከበረው የእመቤታችን የድንግል ማርያም የልደት መታሰቢያ። ጽጌ ጽጌያት ድንግል የሕይወት ፍሬ ክርስቶስን ያስገኘችልን ናት።', type: 'feast', mood: 'devotional' },
  { month: 7,  day: 19, name: 'ቅዱስ ገብርኤል (Megabit Gabriel)', theme: 'የሊቀ መላእክት ቅዱስ ገብርኤል ዓመታዊ በዓል — ለነቢዩ ዳንኤል ምሥጢርን የገለጠ፣ ሠለስቱ ደቂቅን ከእቶነ እሳት ያዳነበት ታላቅ መታሰቢያ ነው።', type: 'major_feast', mood: 'celebratory' },
  { month: 7,  day: 29, name: 'ሰቆቃወ ድንግል (Sequqawe Dingil — Annunciation)', theme: 'በዓለ ብሥራት — መልአኩ ቅዱስ ገብርኤል ለእመቤታችን የልደተ ክርስቶስን ምሥጢር ያበሰረበትና ቃል ሥጋ የሆነበት የድኅነት ጅማሮ ነው።', type: 'major_feast', mood: 'joyful' },

  // ── Miyazya (Month 8) ──
  { month: 8,  day: 1,  name: 'ልደታ ለማርያም (Miyazya Lideta)', theme: 'በሚያዝያ ወር የሚዘከረው የእመቤታችን የድንግል ማርያም ወርሃዊ መታሰቢያ።', type: 'feast', mood: 'contemplative' },
  { month: 8,  day: 23, name: 'ቅዱስ ጊዮርጊስ (Miyazya Giyorgis — Annual Feast of St. George)', theme: 'የታላቁ ሰማዕት የቅዱስ ጊዮርጊስ ዓመታዊ የዕረፍት በዓል — ስለ ሃይማኖቱ አንገቱን ለሰይፍ የሰጠበት፣ አክሊለ ክብር የተቀዳጀበት ታላቅ በዓል ነው።', type: 'major_feast', mood: 'celebratory' },

  // ── Ginbot (Month 9) ──
  { month: 9,  day: 5,  name: 'ደብረ ታቦር (Debre Tabor — Transfiguration of Christ)', theme: 'ጌታችን በደብረ ታቦር ላይ ክብረ መለኮቱን የገለጠበት፣ መልኩ እንደ ፀሐይ የበራበት፣ ልብሱ እንደ ብርሃን ነጭ የሆነበት በዓለ ደብረ ታቦር ነው።', type: 'major_feast', mood: 'triumphant' },
  { month: 9,  day: 12, name: 'ቅዱስ ሚካኤል (Ginbot Mikael)', theme: 'የመላእክት አለቃ ቅዱስ ሚካኤል ወርሃዊ መታሰቢያ — ሕዝበ ክርስቲያንን በምልጃው የሚጠብቅበት የተባረከ ዕለት።', type: 'feast', mood: 'celebratory' },

  // ── Sene (Month 10) ──
  { month: 10, day: 19, name: 'ቅዱስ ገብርኤል (Sene Gabriel)', theme: 'የቅዱስ ገብርኤል ዓመታዊ በዓል — ሠለስቱ ደቂቅን ከሚነደው እቶነ እሳት ያዳነበትና በታላቅ ተአምር የታየበት የሰኔ ገብርኤል ታላቅ በዓል ነው።', type: 'feast', mood: 'devotional' },
  { month: 10, day: 28, name: 'አማኑኤል (Sene Amanuel — Emmanuel)', theme: 'አማኑኤል — እግዚአብሔር ከእኛ ጋር ነው፤ በክረምት ወቅት ምእመናን የእግዚአብሔርን ፍቅርና ጥበቃ የሚያስቡበት ወርሃዊ በዓል ነው።', type: 'feast', mood: 'devotional' },

  // ── Hamle (Month 11) ──
  { month: 11, day: 5,  name: 'ቡሄ (Buhe — Feast of the Transfiguration)', theme: 'የደብረ ታቦር በዓል (ቡሄ) — ሕፃናት ችቦ አብርተው "ሆያ ሆዬ" እያሉ የሚያመሰግኑበት፣ ሙልሙል ዳቦ የሚታደልበት የብርሃንና የደስታ በዓል ነው።', type: 'major_feast', mood: 'joyful' },
  { month: 11, day: 7,  name: 'ቅድስት ሥላሴ (Hamle Selassie)', theme: 'የቅድስት ሥላሴ ዓመታዊ ታላቅ በዓል — ፫ቱ አካላት በአንድ መለኮት የሚመሰገኑበት የሐምሌ ሥላሴ በዓል።', type: 'feast', mood: 'devotional' },
  { month: 11, day: 12, name: 'ቅዱስ ሚካኤል (Hamle Mikael)', theme: 'የመላእክት አለቃ ቅዱስ ሚካኤል ወርሃዊ መታሰቢያ።', type: 'feast', mood: 'celebratory' },

  // ── Nehase (Month 12) ──
  { month: 12, day: 1,  name: 'ጾመ ፍልሰታ መግቢያ (Start of Tsome Filseta)', theme: 'የእመቤታችን የቅድስት ድንግል ማርያም የፍልሰታ ጾም መግቢያ — ምእመናን በጾምና በጸሎት፣ በውዳሴ ማርያምና በቅዳሴ ወደ እግዚአብሔር የሚቀርቡበት ወቅት ነው።', type: 'feast', mood: 'penitential' },
  { month: 12, day: 7,  name: 'ቅድስት ሥላሴ (Nehase Selassie)', theme: 'በጾመ ፍልሰታ ወቅት የሚከበረው የቅድስት ሥላሴ ወርሃዊ በዓል።', type: 'feast', mood: 'contemplative' },
  { month: 12, day: 16, name: 'ፍልሰታ (Filseta — Assumption of the Virgin Mary)', theme: 'የእመቤታችን የቅድስት ድንግል ማርያም ትንሣኤና ዕርገት መታሰቢያ — ቅዱስ ሥጋዋ ወደ ሰማይ ያረገበትና በልጇ ዘንድ ክብርን የተቀዳጀችበት ታላቅ የደስታ በዓል ነው።', type: 'major_feast', mood: 'celebratory' },

  // ── Pagume (Month 13) ──
  { month: 13, day: 1,  name: 'ጳጉሜ (Pagume — The 13th Month Begins)', theme: '፲፫ኛው የኢትዮጵያ ወር ጳጉሜ — የንስሐ፣ የጸሎትና ራስን ለአዲሱ ዓመት የማዘጋጃ የተባረከች ወር ናት።', type: 'feast', mood: 'contemplative' },
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

export function calculateMoveableFeasts(ethYear) {
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

export function getComputusData(ethYear) {
  const ameteAlem = ethYear + 5500;
  const EVANGELISTS = ['ዮሐንስ', 'ማቴዎስ', 'ማርቆስ', 'ሉቃስ'];
  const evIndex = ameteAlem % 4;
  const evangelist = EVANGELISTS[evIndex];
  const isLeap = evIndex === 3; // Luke has 6 Pagume days before John

  // Classical Bahire Hasab Metrics
  const medeb = ameteAlem % 19;
  const wenber = (medeb - 1 + 19) % 19;
  const abeqte = (wenber * 11) % 30;
  const metqe = (wenber * 19) % 30 || 30;
  const metqeMonth = metqe > 14 ? 'መስከረም' : 'ጥቅምት';

  const moveables = calculateMoveableFeasts(ethYear);

  const formatMDate = (d) => {
    const mName = ETHIOPIAN_MONTHS_AMHARIC[d.month] || '';
    return `${mName} ${toGeezNumerals(d.day)} (${d.day})`;
  };

  const rikbeKahnat = offsetEthDate(moveables.fasika, +24);

  return {
    year: ethYear,
    yearGeez: toGeezNumerals(ethYear),
    ameteAlem: ameteAlem,
    ameteAlemGeez: toGeezNumerals(ameteAlem),
    evangelist: `ዘመነ ${evangelist}`,
    wenber: wenber,
    abeqte: abeqte,
    metqe: `${metqeMonth} ${metqe}`,
    pagumeDays: isLeap ? 6 : 5,
    feasts: [
      { name: 'ጾመ ነነዌ (Fast of Nineveh)', date: formatMDate(moveables.nenewe), raw: moveables.nenewe },
      { name: 'ዐቢይ ጾም (Great Lent begins)', date: formatMDate(moveables.abiyTsomStart), raw: moveables.abiyTsomStart },
      { name: 'ደብረ ዘይት (Debre Zeit)', date: formatMDate(moveables.debreZeit), raw: moveables.debreZeit },
      { name: 'ሆሣዕና (Palm Sunday)', date: formatMDate(moveables.hosanna), raw: moveables.hosanna },
      { name: 'ጸሎተ ሐሙስ (Maundy Thursday)', date: formatMDate(moveables.hqmuss), raw: moveables.hqmuss },
      { name: 'ስቅለት (Good Friday)', date: formatMDate(moveables.siklet), raw: moveables.siklet },
      { name: 'ትንሣኤ / ፋሲካ (Holy Easter / Fasika)', date: formatMDate(moveables.fasika), raw: moveables.fasika },
      { name: 'ርክበ ካህናት (Rikbe Kahnat)', date: formatMDate(rikbeKahnat), raw: rikbeKahnat },
      { name: 'ዕርገት (Ascension)', date: formatMDate(moveables.erget), raw: moveables.erget },
      { name: 'ጰራቅሊጦስ (Pentecost)', date: formatMDate(moveables.perakletos), raw: moveables.perakletos },
      { name: 'ጾመ ሐዋርያት (Apostles Fast begins)', date: formatMDate(moveables.tsomeHawariatStart), raw: moveables.tsomeHawariatStart }
    ]
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

  log.info(`Ethiopian Date: ${ethMonthName} ${ethDate.day}, ${ethDate.year}`, {
    month: ethDate.month,
    monthName: ethMonthName,
    day: ethDate.day,
    year: ethDate.year
  });

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
  if (isSameEthDate(ethDate, moveables.hosanna))    return createFeast('ሆሣዕና (Hosanna — Palm Sunday)', 'ጌታችን በክብርና በትሕትና ወደ ኢየሩሳሌም የገባበት፣ ሕዝቡና ሕፃናቱ "ሆሣዕና በአርያም!" እያሉ የዘመሩበት ታላቁ የሆሣዕና በዓል ነው።', 'major_feast', 'joyful', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.hqmuss))     return createFeast('ጸሎተ ሐሙስ (Tselote Hamus — Maundy Thursday)', 'ጌታችን ምሥጢረ ቁርባንን የመሠረተበትና የደቀ መዛሙርቱን እግር ያጠበበት፣ ጸሎተ ሐሙስ ነው።', 'major_feast', 'penitential', ethDate, ethMonthName);
  if (isSameEthDate(ethDate, moveables.siklet))     return createFeast('ስቅለት (Siklet — Good Friday)', 'ጌታችን መድኃኒታችን ኢየሱስ ክርስቶስ ስለ ዓለም ድኅነት በጎልጎታ በመስቀል ላይ ቅዱስ ሥጋውን ቆርሶ ክቡር ደሙን ያፈሰሰበት ዕለተ ዓርብ ስቅለት ነው።', 'major_feast', 'penitential', ethDate, ethMonthName);

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
      ? 'የይሁዳን ክህደትና የጌታችንን መያዝ በማሰብ በጾምና በጸሎት፣ በንስሐ የምንተጋበት የረቡዕ ጾም ነው።'
      : 'ጌታችንና መድኃኒታችን ኢየሱስ ክርስቶስ ስለ እኛ ድኅነት በመስቀል ላይ የፈጸመውን ሕማማተ መስቀል እያሰብን በጾምና በጸሎት የምንቆምበት የተቀደሰ ዕለት ነው።';

    const compositeTheme = `${wTheme} በዛሬው ዕለት ${dailySaint.saint} ይታሰባል፦ ${dailySaint.theme}`;
    return createFast(wName, compositeTheme, 'weekly_fast', 'penitential', ethDate, ethMonthName);
  }

  // If no major fast or feast, return the daily saint with full seasonal context
  const baselineTheme = `Today the Church commemorates ${dailySaint.saint}: ${dailySaint.theme}. We are currently in ${zemene.name} — ${zemene.theme}.`;
  return createFeast(`Daily Commemoration: ${dailySaint.saint}`, baselineTheme, 'devotional', 'devotional', ethDate, ethMonthName);
}

// ─── Ge'ez Numeral System ───────────────────────────────────────────────────

const GEEZ_ONES = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
const GEEZ_TENS = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];

export function toGeezNumerals(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  num = Math.floor(num);
  if (num === 0) return '0';
  if (num < 0) return '-' + toGeezNumerals(-num);
  // Single digits (1-9)
  if (num < 10) return GEEZ_ONES[num];
  // Tens and teens (10-99)
  if (num < 100) return GEEZ_TENS[Math.floor(num / 10)] + (GEEZ_ONES[num % 10] || '');
  // Hundreds up to 9,999 (grouped into hundreds ፻)
  if (num < 10000) {
    const hundreds = Math.floor(num / 100);
    const rem = num % 100;
    const hundredStr = hundreds === 1 ? '፻' : toGeezNumerals(hundreds) + '፻';
    return hundredStr + (rem > 0 ? toGeezNumerals(rem) : '');
  }
  // Myriads (10,000+) using ፼
  if (num < 100000000) {
    const myriad = Math.floor(num / 10000);
    const rem = num % 10000;
    const myriadStr = myriad === 1 ? '፼' : toGeezNumerals(myriad) + '፼';
    return myriadStr + (rem > 0 ? toGeezNumerals(rem) : '');
  }
  return String(num); // Fallback for very large numbers
}

/**
 * Returns Ethiopian date formatted in Amharic with Ge'ez numerals.
 * Example: "ግንቦት ፬ ፳፻፲፰"
 */
export function getEthiopianDateGeez(gregorianDate = new Date()) {
  const eth = toEthiopianDate(gregorianDate);
  const monthName = ETHIOPIAN_MONTHS_AMHARIC[eth.month] || '';
  return `${monthName} ${toGeezNumerals(eth.day)} ${toGeezNumerals(eth.year)}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createFeast(name, theme, type, mood, ethDate, ethMonthName) {
  return { event: name, theme: theme, type: type, mood: mood, ethiopianDate: `${ethMonthName} ${ethDate.day}`, ethiopianDateGeez: getEthiopianDateGeez(), priority: 'high' };
}

function createFast(name, theme, type, mood, ethDate, ethMonthName) {
  return { event: name, theme: theme, type: type, mood: mood, ethiopianDate: `${ethMonthName} ${ethDate.day}`, ethiopianDateGeez: getEthiopianDateGeez(), priority: 'medium' };
}

function getZemene(ethDate) {
  const m = ethDate.month;
  const d = ethDate.day;

  // ── Zemene Tsige (Season of Flowers / Holy Family) — Meskerem 26 to Hidar 6
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 1, day: 26 }, { year: ethDate.year, month: 3, day: 6 })) {
    return {
      name: 'ዘመነ ጽጌ (Zemene Tsige — Season of Flowers)',
      theme: 'The season commemorating the Flight of the Holy Family to Egypt. Just as the Lord was protected in a foreign land, the faithful find shelter in God through every exile and trial. Nature blooms as the Church celebrates the Virgin Mary and the infant Christ.'
    };
  }

  // ── Keremt (Rainy Season / Monastic Season) — Sene 26 to Meskerem 25
  if (isEthDateInRange(ethDate, { year: ethDate.year, month: 10, day: 26 }, { year: ethDate.year + 1, month: 1, day: 25 })) {
    return {
      name: 'ዘመነ ክረምት (Keremt — Rainy Season / Monastic Retreat)',
      theme: 'The long rainy season — a time when monks and clergy traditionally remain in their monasteries for intense study, prayer, and fasting. God sends the rain from heaven as a sign of His provision.'
    };
  }

  // ── Zemene Bega (Dry Season / Harvest Season)
  if ((m === 9 || m === 10) || (m === 8 && d >= 15)) {
    return {
      name: 'ዘመነ በጋ (Zemene Bega — Dry / Harvest Season)',
      theme: 'The dry, golden harvest season — the earth gives its fruit and the Church rejoices. A time of great feasts including ቡሄ and the preparations for the rains.'
    };
  }

  // ── Default: Zemene Sebket (Season of Preaching)
  return {
    name: 'ዘመነ ስብከት (Zemene Sebket — Season of Preaching)',
    theme: 'The season dedicated to the apostolic preaching of the Gospel — when the Church goes forth boldly, teaching, baptizing, and extending the Kingdom of God to every corner of the earth.'
  };
}

export function formatContextForPrompt(context) {
  if (!context) return '';

  const moodInstructions = {
    joyful:       'The tone must be radiant, warm, celebratory, and full of living hope. Avoid heaviness. Let the joy overflow like the songs of እንቁጣጣሽ.',
    triumphant:   'The tone must be bold, victorious, and thunderously powerful. Christ has conquered — speak with absolute certainty of divine victory. Use language of ድል (victory) and ክብር (glory).',
    celebratory:  'The tone must be festive, deeply grateful, and uplifting — as if writing for thousands gathered in worship at ቅዳሴ.',
    contemplative:'The tone must be gentle, reflective, and inward. Invite the reader to pause, breathe, and listen to the still small voice of God. Use ስንብት (meditation) language.',
    penitential:  'The tone must be solemn yet hopeful — acknowledging the weight of sin while anchoring in the inexhaustible mercy of God. Speak of ንስሐ (repentance) leading to ምሕረት (mercy). Avoid despair; always end with hope.',
    devotional:   'The tone must be reverent, intimate, and warm — like a trusted spiritual father (አባት) speaking directly to the soul of a young believer.',
  };

  const typeGuidance = {
    major_feast:    'This is a MAJOR feast — treat it with maximum theological depth, cultural richness, and celebratory energy. Reference specific Ethiopian Orthodox traditions, rituals, and scriptural fulfillments.',
    feast:          'This is a feast day. Give it liturgical weight, connect it to the broader salvation narrative, and honor any saints or archangels commemorated.',
    fasting_start:  'This is the VERY FIRST DAY of a fasting season. Explicitly celebrate this beginning. Use language of starting, committing, and entering.',
    fasting_season: 'This is an ONGOING fast — NOT the first day. Do NOT say "begins today" or "starts now." Speak to someone already in the middle of the fast: encourage, deepen, sustain.',
    abiy_tsom_sunday: 'This is a specific named Sunday of Great Lent with its own unique theological theme. Focus ENTIRELY on this Sunday\'s specific theme — do not speak generally about Lent.',
    weekly_fast:    'This is a weekly fast (Wednesday or Friday). Connect the day\'s fast to its specific spiritual meaning AND to the daily saint being commemorated.',
    fasika_season:  'This is the joyful 50-day Fasika season — there is NO FASTING today. The tone must be entirely triumphant and resurrection-focused.',
    devotional:     'This is an ordinary day with a daily saint commemoration. Make the saint\'s story vivid and draw a practical spiritual lesson for modern Ethiopian believers.',
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

// ─── Fasting Progress Info ──────────────────────────────────────────────────

/**
 * Returns current fasting season info if active, including day count and progress.
 * Used by the Fasting Guide content type.
 */
export function getFastingInfo(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  const moveables = calculateMoveableFeasts(ethDate.year);
  
  const ethVal = ethDate.month * 30 + ethDate.day;
  
  // Great Lent (55 days)
  const lentStart = moveables.abiyTsomStart;
  const lentEnd = offsetEthDate(moveables.fasika, -1);
  if (isEthDateInRange(ethDate, lentStart, lentEnd)) {
    const startVal = lentStart.month * 30 + lentStart.day;
    const dayNum = ethVal - startVal + 1;
    return { active: true, name: 'ዐቢይ ጾም (Great Lent)', nameAmharic: 'ዐቢይ ጾም', totalDays: 55, currentDay: dayNum, rules: [
      'ከማንኛውም የእንስሳ ተዋጽኦ ሙሉ በሙሉ መራቅ — ሥጋ፣ ወተት፣ እንቁላል፣ ቅቤ',
      'እስከ ምሽቱ ፱ ሰዓት ድረስ ምግብ አለመብላት (በተለይ የመጀመሪያ ሳምንት)',
      'ከዕፅዋት የተዘጋጁ ምግቦች ብቻ — ሽሮ፣ ምስር፣ ድንች፣ አትክልት',
      'በየቀኑ ጸሎትና ስግደት ማብዛት',
      'ንስሐ መግባት — ከካህን ጋር የኑዛዜ ጊዜ',
      'መጽሐፍ ቅዱስ ማንበብ — በተለይ መዝሙረ ዳዊት'
    ]};
  }
  
  // Nineveh (3 days)
  const ninEnd = offsetEthDate(moveables.nenewe, 2);
  if (isEthDateInRange(ethDate, moveables.nenewe, ninEnd)) {
    const startVal = moveables.nenewe.month * 30 + moveables.nenewe.day;
    const dayNum = ethVal - startVal + 1;
    return { active: true, name: 'ጾመ ነነዌ (Fast of Nineveh)', nameAmharic: 'ጾመ ነነዌ', totalDays: 3, currentDay: dayNum, rules: [
      'ሦስት ቀን ፍጹም ጾም — ውኃ እንኳ ሳይጠጡ (ለጠንካሮች)',
      'ከእንስሳ ተዋጽኦ ሙሉ በሙሉ መራቅ',
      'ንስሐ መግባትና ኃጢአትን መናዘዝ',
      'የነነዌ ሰዎችን ንስሐ ማሰብ — ዮናስ ምዕራፍ ፫'
    ]};
  }

  // Apostles Fast
  const apostlesEnd = { year: ethDate.year, month: 11, day: 5 };
  if (isEthDateInRange(ethDate, moveables.tsomeHawariatStart, apostlesEnd)) {
    const startVal = moveables.tsomeHawariatStart.month * 30 + moveables.tsomeHawariatStart.day;
    const endVal = apostlesEnd.month * 30 + apostlesEnd.day;
    const dayNum = ethVal - startVal + 1;
    const totalDays = endVal - startVal + 1;
    return { active: true, name: 'ጾመ ሐዋርያት (Apostles Fast)', nameAmharic: 'ጾመ ሐዋርያት', totalDays, currentDay: dayNum, rules: [
      'ከእንስሳ ተዋጽኦ መራቅ — ሥጋ፣ ወተት፣ እንቁላል',
      'የሐዋርያትን የሕይወት ታሪክ ማንበብ',
      'ስብከትና ወንጌል ማካፈል — ሐዋርያት እንዳደረጉት',
      'የሌሊት ጸሎት ማብዛት'
    ]};
  }
  
  // Fixed fasts (with specific rules per fast)
  for (const fast of FIXED_FASTS) {
    const fStart = { year: ethDate.year, month: fast.startMonth, day: fast.startDay };
    const fEnd = { year: ethDate.year, month: fast.endMonth, day: fast.endDay };
    if (isEthDateInRange(ethDate, fStart, fEnd)) {
      const startVal = fStart.month * 30 + fStart.day;
      const endVal = fEnd.month * 30 + fEnd.day;
      const dayNum = ethVal - startVal + 1;
      const totalDays = endVal - startVal + 1;
      
      let rules = ['ከእንስሳ ተዋጽኦ ሙሉ በሙሉ መራቅ', 'ጸሎትና ስግደት ማብዛት'];
      if (fast.name.includes('ፍልሰታ')) {
        rules = [
          'ከእንስሳ ተዋጽኦ ሙሉ በሙሉ መራቅ',
          'ውዳሴ ማርያም በየቀኑ ማንበብ',
          'ማኅሌት መዘመር — የእመቤታችንን ቅድስና ማሰብ',
          'ንስሐ መግባትና ምሕረት መጠየቅ'
        ];
      } else if (fast.name.includes('ነቢያት')) {
        rules = [
          'ከእንስሳ ተዋጽኦ ሙሉ በሙሉ መራቅ',
          'የነቢያትን መጻሕፍት ማንበብ — ኢሳይያስ፣ ኤርምያስ፣ ሕዝቅኤል',
          'ለመሲሑ መምጣት ልብን ማዘጋጀት',
          'ጸሎትና ስግደት ማብዛት'
        ];
      }
      return { active: true, name: fast.name, nameAmharic: fast.name.split(' (')[0], totalDays, currentDay: dayNum, rules };
    }
  }
  
  // Weekly fast check (Wednesday = Judas betrayal, Friday = Crucifixion)
  const gDay = date.getDay();
  if (gDay === 3 || gDay === 5) {
    const wName = gDay === 3 ? 'የረቡዕ ጾም (Wednesday Fast)' : 'የዓርብ ጾም (Friday Fast)';
    const wNameAm = gDay === 3 ? 'የረቡዕ ጾም' : 'የዓርብ ጾም';
    const wReason = gDay === 3 
      ? 'ረቡዕ — የይሁዳ ክህደት የሚታሰብበት ቀን'
      : 'ዓርብ — የጌታችን ስቅለት የሚታሰብበት ቀን';
    return { active: true, name: wName, nameAmharic: wNameAm, totalDays: 1, currentDay: 1, rules: [
      'ከእንስሳ ተዋጽኦ መራቅ — ሥጋ፣ ወተት፣ እንቁላል፣ ቅቤ',
      wReason,
      'ጸሎት ማብዛት'
    ]};
  }

  return { active: false };
}

// ─── Holy Week Day Detection ────────────────────────────────────────────────

const HOLY_WEEK_DAYS = [
  { offset: -7, amharic: 'ሆሣዕና', english: 'Palm Sunday — Triumphal Entry', theme: 'Christ enters Jerusalem as the Prince of Peace, fulfilling Zechariah\'s prophecy.' },
  { offset: -6, amharic: 'ሰኞ — ሰሙነ ሕማማት', english: 'Monday — Cursing of the Fig Tree', theme: 'Jesus curses the barren fig tree — a warning against spiritual fruitlessness.' },
  { offset: -5, amharic: 'ማክሰኞ — ሰሙነ ሕማማት', english: 'Tuesday — Parables of Judgment', theme: 'Jesus teaches with authority in the Temple: the wicked tenants, the great banquet, the ten virgins.' },
  { offset: -4, amharic: 'ረቡዕ — ሰሙነ ሕማማት', english: 'Wednesday — Betrayal of Judas', theme: 'Judas agrees to betray the Lord for thirty pieces of silver. The price of a slave for the King of Kings.' },
  { offset: -3, amharic: 'ጸሎተ ሐሙስ', english: 'Maundy Thursday — The Last Supper', theme: 'Christ washes feet, institutes the Eucharist, and prays in Gethsemane.' },
  { offset: -2, amharic: 'ስቅለት', english: 'Good Friday — The Crucifixion', theme: 'The Son of God is nailed to the Cross. Darkness covers the earth. "It is finished."' },
  { offset: -1, amharic: 'ቅዳሜ ስዑር', english: 'Holy Saturday — Harrowing of Hell', theme: 'Christ descends to Sheol and breaks open the gates of death, liberating the righteous who waited.' }
];

export function getHolyWeekDay(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  const moveables = calculateMoveableFeasts(ethDate.year);
  
  for (const day of HOLY_WEEK_DAYS) {
    const targetDate = offsetEthDate(moveables.fasika, day.offset);
    if (isSameEthDate(ethDate, targetDate)) {
      return { isHolyWeek: true, ...day };
    }
  }
  return { isHolyWeek: false };
}

// ─── Pagume Detection ───────────────────────────────────────────────────────

export function isPagume(date = new Date()) {
  const ethDate = toEthiopianDate(date);
  if (ethDate.month === 13) {
    const isLeap = ethDate.year % 4 === 3;
    const totalDays = isLeap ? 6 : 5;
    return { isPagume: true, day: ethDate.day, totalDays, daysToNewYear: totalDays - ethDate.day + 1 };
  }
  return { isPagume: false };
}

// ─── Weekly Calendar Data ───────────────────────────────────────────────────

const WEEKDAY_NAMES_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

export function getWeekCalendarData(startDate = new Date()) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const eth = toEthiopianDate(d);
    const saint = DAILY_COMMEMORATIONS[eth.day];
    const ctx = getLiturgicalContext(d);
    const weekdayName = WEEKDAY_NAMES_AM[d.getDay()];
    
    let moodType = 'normal';
    if (ctx.type?.includes('feast') || ctx.type?.includes('major')) moodType = 'feast';
    if (ctx.type?.includes('fast') || ctx.mood === 'penitential') moodType = 'fast';
    
    days.push({
      ethDay: toGeezNumerals(eth.day),
      ethMonth: ETHIOPIAN_MONTHS_AMHARIC[eth.month],
      weekday: weekdayName,
      saint: saint?.saint || '',
      event: ctx.event || '',
      mood: moodType,
      isFeast: ctx.type?.includes('feast'),
      isFast: ctx.type?.includes('fast') || ctx.mood === 'penitential'
    });
  }
  return days;
}

// ─── Church History Topics ──────────────────────────────────────────────────

export const CHURCH_HISTORY_TOPICS = [
  { era: 'ሐዋርያዊ ዘመን', year: '34 AD', title: 'ፊልጶስና ኢትዮጵያዊው ጃንደረባ', theme: 'ኢትዮጵያዊው ጃንደረባ በሐዋርያው ፊልጶስ ተጠምቆ ክርስትናን ወደ ኢትዮጵያ ያመጣበት ታሪክ (የሐዋ. ሥራ ፰፥፳፮-፴፱)። ኢትዮጵያ ከአውሮፓ በፊት ክርስትናን የተቀበለች ጥንታዊት አገር ናት።', scripture: 'የሐዋ. ሥራ ፰፥፳፮-፴፱' },
  { era: 'የአክሱም ዘመን', year: '330 AD', title: 'ንጉሥ ኢዛና — ክርስትናን ያቀፈ ንጉሥ', theme: 'የአክሱም ንጉሥ ኢዛና በአባ ሰላማ ከሣቴ ብርሃን ትምህርት አምኖ ክርስትናን የመንግሥት ሃይማኖት አደረገ። በመስቀል ምልክት የታተመ መሐለቅ ያወጣ በዓለም የመጀመሪያው ንጉሥ ነው።', scripture: '' },
  { era: 'ገዳማዊ ዘመን', year: '480 AD', title: 'ዘጠኙ ቅዱሳን — የገዳማት መሥራቾች', theme: 'ከተለያዩ የሮም ግዛቶች የመጡት ዘጠኙ ቅዱሳን መጻሕፍትን ወደ ግእዝ ተርጉመው ገዳማትን አቋቋሙ፤ ወንጌልን በኢትዮጵያ ምድር በስፋት አዳረሱ።', scripture: '' },
  { era: 'ወርቃማ ዘመን', year: '6th Century', title: 'ቅዱስ ያሬድ — የኢትዮጵያ ዜማ አባት', theme: 'ቅዱስ ያሬድ የኢትዮጵያን ቤተ ክርስቲያን ዜማ (ግእዝ፣ ዕዝል፣ አራራይ) ያዘጋጀና ድጓን የደረሰ የታላቅ መንፈሳዊ ጥበብ አባት ነው።', scripture: '' },
  { era: 'የዛግዌ ሥርወ መንግሥት', year: '1181-1221 AD', title: 'ንጉሥ ላሊበላ — አዲሲቷ ኢየሩሳሌም', theme: 'ጻድቁ ንጉሥ ላሊበላ ከዓለት የተፈለፈሉ ዐሥራ አንዱን ድንቅ አብያተ ክርስቲያናት በማነጽ አዲሲቷን ኢየሩሳሌም በኢትዮጵያ ምድር አቆመ።', scripture: '' },
  { era: 'ሰሎሞናዊ ሥርወ መንግሥት', year: '1270 AD', title: 'ክብረ ነገሥት — የነገሥታት ክብር', theme: 'ክብረ ነገሥት የታቦተ ጽዮንን ወደ ኢትዮጵያ መምጣትና የኢትዮጵያን መንፈሳዊ ታሪክ የሚዘክር ታላቅ የታሪክና የሃይማኖት መጽሐፍ ነው።', scripture: '፩ኛ ነገ. ፲፥፩-፲፫' },
  { era: 'የመካከለኛው ዘመን', year: '1337 AD', title: 'አቡነ ኤዎስጣቴዎስ — የሰንበት ተከራካሪ', theme: 'አቡነ ኤዎስጣቴዎስ ስለ ቀዳሚት ሰንበት ክብርና ስለ ቀናች ተዋሕዶ እምነት ተጋድለው በስደት ወንጌልን በዓለም ያስተማሩ ታላቅ አባት ናቸው።', scripture: 'ዘጸ. ፳፥፰-፲፩' },
  { era: 'የተሐድሶ ዘመን', year: '1450 AD', title: 'የደብረ ምጥማቅ ጉባኤ — የሰንበት ውሳኔ', theme: 'በደብረ ምጥማቅ ጉባኤ የሰንበት ክርክር ተፈትቶ ቀዳሚት ሰንበትና እሑድ በክብር እንዲጠበቁ የቀኖና ውሳኔ የተሰጠበት ታሪካዊ ጉባኤ ነው።', scripture: '' },
  { era: 'የአድባራት ዘመን', year: '14th Century', title: 'አቡነ ተክለ ሃይማኖት — የኢትዮጵያ ታላቅ ቅዱስ', theme: 'አቡነ ተክለ ሃይማኖት ወንጌልን በኢትዮጵያ ሰብከው፣ ደብረ ሊባኖስን ገዳም መሥርተው ለ፳፪ ዓመታት በአንድ እግራቸው የቆሙ ታላቅ ጻድቅ ናቸው።', scripture: '' },
  { era: 'የጦርነት ዘመን', year: '1540 AD', title: 'የግራኝ ወረራና የቤተ ክርስቲያን ጽናት', theme: 'በአሕመድ ግራኝ ወረራ ወቅት በርካታ አብያተ ክርስቲያናት ቢቃጠሉም ቤተ ክርስቲያን በምእመናን ጽናትና በእግዚአብሔር ጥበቃ ድል ነሥታ ጸንታ ኖራለች።', scripture: 'ማቴ. ፲፮፥፲፰' },
  { era: 'ጎንደር ዘመን', year: '1636 AD', title: 'ፋሲለደስ — የጎንደር ቤተ መንግሥትና አብያተ ክርስቲያናት', theme: 'አፄ ፋሲለደስ ጎንደርን ዋና ከተማ አድርገው ደብረ ብርሃን ሥላሴን ጨምሮ በርካታ ታሪካዊ አብያተ ክርስቲያናትን ያነጹበት ወርቃማ የታሪክ ዘመን ነው።', scripture: '' },
  { era: 'ዘመናዊ ዘመን', year: '1896 AD', title: 'አድዋ — እምነት ድልን አመጣ', theme: 'በአድዋ ጦርነት የታቦተ ማርያምና የታቦተ ጊዮርጊስ ረድኤት ታክሎበት የኢትዮጵያ ሠራዊት ቅኝ ገዢዎችን ድል በማድረግ የነጻነት ተምሳሌት ሆነ።', scripture: 'መዝ. ፳፥፯' },
  { era: 'ዘመናዊ ዘመን', year: '1959 AD', title: 'የኢትዮጵያ ቤተ ክርስቲያን ነጻነት', theme: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ከ፩ሺህ ፮፻ ዓመታት በኋላ የመጀመሪያውን ኢትዮጵያዊ ፓትርያርክ አቡነ ባስልዮስን የሾመችበት ታላቅ የነጻነት ምዕራፍ ነው።', scripture: '' },
  { era: 'ስደት ዘመን', year: '1974-1991 AD', title: 'ቤተ ክርስቲያን በደርግ ዘመን', theme: 'በደርግ የኮሚኒዝም ዘመን ፓትርያርክ አቡነ ቴዎፍሎስ በሰማዕትነት ቢያልፉም ምእመናን በእምነታቸው ጸንተው ቤተ ክርስቲያንን ጠብቀዋል።', scripture: 'ራእ. ፲፪፥፲፩' },
  { era: 'ጥንታዊ ዘመን', year: '4th Century', title: 'ኪዳነ ምሕረት — የምሕረት ቃል ኪዳን', theme: 'ጌታችን ከመቃብር ተነሥቶ ለእመቤታችን የገባላት የኪዳነ ምሕረት ቃል ኪዳን የምእመናን መጽናኛና የተስፋ መሠረት ሆኖ ጸንቷል።', scripture: 'ዮሐ. ፲፱፥፳፮-፳፯' },
];

export { DAILY_COMMEMORATIONS };
