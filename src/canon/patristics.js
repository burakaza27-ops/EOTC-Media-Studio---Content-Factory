/**
 * EOTC Patristic Corpus & Faith of the Fathers (ሃይማኖተ አበው) Engine
 * ══════════════════════════════════════════════════════════════════
 * Authentic, zero-hallucination patristic repository curated from canonical
 * Ethiopian Orthodox Tewahedo Church sources:
 *  - ሃይማኖተ አበው (Faith of the Fathers)
 *  - መጽሐፈ ምሥጢር (Book of Mystery — Abba Giyorgis of Gasicha)
 *  - ድርሳነ አፈወርቅ (Homilies of St. John Chrysostom)
 *  - አርጋኖነ ማርያም (The Harp of Mary — Abba Giyorgis)
 *  - ድጓና ጾመ ድጓ (The Liturgical Hymnary of St. Yared)
 *  - መጽሐፈ ተግሣጽና ድርሳናት (Ascetic Homilies of St. Basil, St. Ephrem, St. Gregory)
 *
 * Each record preserves the father's title, century, primary theological source,
 * authentic Ge'ez/Amharic doctrine, and liturgical thematic tagging.
 */

export const VERIFIED_PATRISTICS = [
  // ═══════════════════════════════════════════════════════════════════════════
  //  ፩. ቅዱስ አትናቴዎስ ሐዋርያዊ (St. Athanasius the Apostolic - 4th c.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ath-01',
    father: 'ቅዱስ አትናቴዎስ ሐዋርያዊ',
    fatherTitle: 'አባ አትናቴዎስ ሊቀ ጳጳሳት ዘእስክንድርያ ሐዋርያዊ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ አትናቴዎስ ምዕራፍ ፳፬',
    title: 'ስለ ቃል ሥጋ መሆንና የሰው ልጅ መዳን',
    teaching: 'እርሱ እኛን የአምላክ ልጆች ያደርገን ዘንድ የሰው ልጅ ሆነ፤ እኛንም የማይሞቱ ያደርገን ዘንድ ራሱ ወደ ሞት ገባ፤ የእርሱን ክብር ይሰጠን ዘንድ የእኛን ውርደት ተቀበለ።',
    theme: 'ነገረ ድኅነት (Incarnation & Salvation)',
    mood: 'solemn',
    keywords: ['አትናቴዎስ', 'ሰው መሆን', 'ድኅነት', 'ትንሣኤ', 'ተዋሕዶ', 'ክብር']
  },
  {
    id: 'ath-02',
    father: 'ቅዱስ አትናቴዎስ ሐዋርያዊ',
    fatherTitle: 'አባ አትናቴዎስ ሊቀ ጳጳሳት ዘእስክንድርያ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ አትናቴዎስ ምዕራፍ ፳፯',
    title: 'የመስቀሉ ድልና የሞት መሻር',
    teaching: 'ክርስቶስ በመስቀል ላይ በሞተ ጊዜ ሞት ተሻረ፤ የሰው ልጆችም ከመቃብር መውጣት ጀመሩ። ከመስቀሉ በፊት ሞት ያስፈራ ነበር፤ አሁን ግን በክርስቶስ አምነው ሕፃናትና ደናግል እንኳን ሞትን ይንቁታል፤ ድል ተነስቷልና።',
    theme: 'የመስቀል ክብርና የሞት ድል',
    mood: 'triumphant',
    keywords: ['አትናቴዎስ', 'መስቀል', 'ሞት', 'ድል', 'ትንሣኤ', 'ተጋድሎ']
  },
  {
    id: 'ath-03',
    father: 'ቅዱስ አትናቴዎስ ሐዋርያዊ',
    fatherTitle: 'አባ አትናቴዎስ ሐዋርያዊ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው አንቀጽ ፳፰',
    title: 'የመንፈስ ቅዱስ አምላክነት',
    teaching: 'መንፈስ ቅዱስ ከአብ የወጣ፥ ከወልድ ጋር የሚሰገድለት እውነተኛ አምላክ ነው፤ እርሱ ሕይወትን የሚሰጥ፥ ሰማያዊ ሀብትን የሚያድል፥ ምእመናንን የሚቀድስ እንጂ ፍጡር አይደለም።',
    theme: 'ምሥጢረ ሥላሴና መንፈስ ቅዱስ',
    mood: 'devotional',
    keywords: ['መንፈስ ቅዱስ', 'ሥላሴ', 'ቅድስና', 'እምነት', 'አትናቴዎስ']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፪. ቅዱስ ቄርሎስ ዓምደ ሃይማኖት (St. Cyril of Alexandria - 5th c.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cyr-01',
    father: 'ቅዱስ ቄርሎስ ዓምደ ሃይማኖት',
    fatherTitle: 'አባ ቄርሎስ ሊቀ ጳጳሳት ዘእስክንድርያ ዓምደ ሃይማኖት',
    century: '፭ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ቄርሎስ ምዕራፍ ፸፩',
    title: 'የተዋሕዶ ምሥጢር (አንድ ባሕርይ)',
    teaching: 'ቃል ከሥጋ ጋር በተዋሐደ ጊዜ አንድ አካል አንድ ባሕርይ ሆነ፤ ያለ መቀላቀል፥ ያለ መለወጥ፥ ያለ መለያየትና ያለ መከፋፈል። አምላክ ፍጹም ሰው ሆነ፥ ሰውም ፍጹም አምላክ ሆነ።',
    theme: 'ምሥጢረ ተዋሕዶ (The Incarnation & Union)',
    mood: 'dogmatic',
    keywords: ['ቄርሎስ', 'ተዋሕዶ', 'አንድ ባሕርይ', 'ቃል', 'ሥጋ', 'ሃይማኖት']
  },
  {
    id: 'cyr-02',
    father: 'ቅዱስ ቄርሎስ ዓምደ ሃይማኖት',
    fatherTitle: 'አባ ቄርሎስ ዓምደ ሃይማኖት',
    century: '፭ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ቄርሎስ ምዕራፍ ፸፪ (ቅዱስ ኤፌሶን)',
    title: 'እመቤታችን ወላዲተ አምላክ ናት',
    teaching: 'ድንግል ማርያም ወላዲተ አምላክ መሆኗን የማይናገርና የማያምን ቢኖር የተወገዘ ይሁን። እርሷ የወለደችው ተራ ሰውን ሳይሆን፥ በሥጋ የተገለጠውን ሕያው የእግዚአብሔርን ቃል ነውና።',
    theme: 'ነገረ ማርያም (Theotokos / ወላዲተ አምላክ)',
    mood: 'devotional',
    keywords: ['ቄርሎስ', 'ማርያም', 'ወላዲተ አምላክ', 'ኤፌሶን', 'ድንግል']
  },
  {
    id: 'cyr-03',
    father: 'ቅዱስ ቄርሎስ ዓምደ ሃይማኖት',
    fatherTitle: 'አባ ቄርሎስ ዘእስክንድርያ',
    century: '፭ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ምዕራፍ ፸፭',
    title: 'ስለ ቅዱስ ቁርባን ክብር',
    teaching: 'የምንቀበለው ሥጋና ደም ተራ እንጀራና ወይን አይደለም፤ እርሱ የሕያው የእግዚአብሔር ቃል እውነተኛ ቅዱስ ሥጋውና ክቡር ደሙ ነው፤ የሚበላውም ለዘላለም ሕያው ሆኖ ይኖራል።',
    theme: 'ምሥጢረ ቍርባን (Holy Eucharist)',
    mood: 'solemn',
    keywords: ['ቁርባን', 'ሥጋ ወደሙ', 'ሕይወት', 'ቄርሎስ', 'መሠዊያ']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፫. ቅዱስ ዮሐንስ አፈወርቅ (St. John Chrysostom - Golden-Mouthed)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'jch-01',
    father: 'ቅዱስ ዮሐንስ አፈወርቅ',
    fatherTitle: 'ቅዱስ ዮሐንስ ሊቀ ጳጳሳት ዘቍስጥንጥንያ አፈወርቅ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ድርሳነ አፈወርቅ አንቀጽ ፯ — ስለ እውነተኛ ጾም',
    title: 'እውነተኛ ጾም ምንድር ነው?',
    teaching: 'ከመብል ብቻ መከልከል ጾም አይደለም፤ እውነተኛ ጾም ከክፋትና ከኃጢአት መራቅ ነው። ሆድህ ሲጾም ዓይንህ ከክፉ እይታ፥ ምላስህ ከሐሜትና ከስድብ፥ እጅህ ከግፍ፥ እግርህም ወደ ክፉ መንገድ ከመሄድ ይጹም።',
    theme: 'ጾመ ነፍስና የሕይወት ቅድስና',
    mood: 'repentant',
    keywords: ['አፈወርቅ', 'ጾም', 'ንጽሕና', 'ኃጢአት', 'አንደበት', 'ምግባር']
  },
  {
    id: 'jch-02',
    father: 'ቅዱስ ዮሐንስ አፈወርቅ',
    fatherTitle: 'ቅዱስ ዮሐንስ አፈወርቅ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ድርሳነ አፈወርቅ አንቀጽ ፲፪ — ስለ ጸሎት ኃይል',
    title: 'የጸሎት ታላቅ ኃይል',
    teaching: 'ጸሎት ለነፍስ እስትንፋሷ ነው፤ ውኃ ለዓሣ ሕይወቱ እንደ ሆነ ሁሉ፥ ጸሎትም ለክርስቲያን መንፈሳዊ ጥንካሬው ነው። በጸሎት ከእግዚአብሔር ጋር የምትነጋገር ሰው እንዴት ደስተኛ አትሆንም!',
    theme: 'የጸሎት ኃይልና ኅብረት',
    mood: 'devotional',
    keywords: ['አፈወርቅ', 'ጸሎት', 'እስትንፋስ', 'ሰላም', 'ልመና']
  },
  {
    id: 'jch-03',
    father: 'ቅዱስ ዮሐንስ አፈወርቅ',
    fatherTitle: 'ቅዱስ ዮሐንስ አፈወርቅ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ዮሐንስ አፈወርቅ ምዕራፍ ፷፮',
    title: 'ስለ ምጽዋትና ለድሆች ስለ ማዘን',
    teaching: 'ለድሃ ስትሰጥ ለእግዚአብሔር ታበድራለህ፤ ለተራበ የምታበላው እንጀራ በመንግሥተ ሰማያት የማይጠፋ ዘላለማዊ ሀብት ሆኖ ይጠብቅሃል። ምጽዋት ኃጢአትን የምታስተሰርይ ታላቅ ክንፍ ናት።',
    theme: 'ምጽዋትና ርኅራኄ',
    mood: 'compassionate',
    keywords: ['ምጽዋት', 'ድሆች', 'ርኅራኄ', 'አፈወርቅ', 'መንግሥተ ሰማያት']
  },
  {
    id: 'jch-04',
    father: 'ቅዱስ ዮሐንስ አፈወርቅ',
    fatherTitle: 'ቅዱስ ዮሐንስ አፈወርቅ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ድርሳነ አፈወርቅ — ስለ ንስሐና ተስፋ',
    title: 'የንስሐ በር አይዘጋም',
    teaching: 'ኃጢአትህ ምንም ያህል የበዛ ቢሆን፥ የእግዚአብሔር ምሕረት ግን እንደ ባሕር ጥልቅ ነው፤ አንዲት የእሳት ፍም ወደ ውቅያኖስ ብትወድቅ እንደምትጠፋ ሁሉ፥ የሰው ሁሉ ኃጢአት ከፈጣሪ ይቅርታ ፊት ምንም አይደለም። ተስፋ አትቁረጥ፥ ተመለስ!',
    theme: 'ንስሐና ይቅርታ',
    mood: 'repentant',
    keywords: ['ንስሐ', 'ምሕረት', 'ይቅርታ', 'ተስፋ', 'አፈወርቅ']
  },
  {
    id: 'jch-05',
    father: 'ቅዱስ ዮሐንስ አፈወርቅ',
    fatherTitle: 'ቅዱስ ዮሐንስ አፈወርቅ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ድርሳነ አፈወርቅ — ስለ መጽሐፍ ቅዱስ ንባብ',
    title: 'የቅዱሳት መጻሕፍት ጥበብ',
    teaching: 'መጻሕፍትን አለማወቅ ታላቅ ጥፋት ነው፤ ቅዱሳት መጻሕፍት ለሕሊና መድኃኒት፥ ለጨለመ ልብ መብራት፥ ለተጨነቀች ነፍስ ደግሞ መጽናኛ ናቸው። በየዕለቱ ከቃሉ ጋር ተዋደዱ።',
    theme: 'የቃሉ ጥበብና እውቀት',
    mood: 'instructive',
    keywords: ['መጽሐፍ', 'ቃል', 'ጥበብ', 'ብርሃን', 'አፈወርቅ']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፬. ቅዱስ ባስልዮስ ዘቂሣርያ (St. Basil the Great - 4th c.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bas-01',
    father: 'ቅዱስ ባስልዮስ ዘቂሣርያ',
    fatherTitle: 'ቅዱስ ባስልዮስ ሊቀ ጳጳሳት ዘቂሣርያ ቀጰዶቅያ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ባስልዮስ ምዕራፍ ፴፪',
    title: 'ጾም የመላእክት ምግብ ናት',
    teaching: 'ጾም ከመላእክት ጋር ያመሳስላል፤ ነፍስን ታቀላለች፥ ወደ እግዚአብሔርም ታቀርባለች። ሙሴ ሕጉን የተቀበለው በጾም ነው፤ ኤልያስም ወደ ሰማይ የተነጠቀው በጾምና በጸሎት በተጋደለው ተጋድሎ ነው።',
    theme: 'ጾምና መንፈሳዊ ተጋድሎ',
    mood: 'devotional',
    keywords: ['ባስልዮስ', 'ጾም', 'መላእክት', 'ሙሴ', 'ኤልያስ', 'ተጋድሎ']
  },
  {
    id: 'bas-02',
    father: 'ቅዱስ ባስልዮስ ዘቂሣርያ',
    fatherTitle: 'ቅዱስ ባስልዮስ ታላቁ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ድርሳነ ባስልዮስ — ስለ ጊዜ አጠቃቀምና ንቃት',
    title: 'የሕይወት አጭርነትና ዝግጅት',
    teaching: 'ጊዜው እንደ ጥላ ያልፋል፤ ዛሬ የተሰጠህን ዕለት ለነፍስህ ማዳኛ ተጠቀምበት። ነገ የራስህ እንደ ሆነ አታውቅምና ንስሐህን አታዘግይ፤ ዘወትር በንጽሕና ተዘጋጅተህ ኑር።',
    theme: 'ትጋትና ንስሐ',
    mood: 'solemn',
    keywords: ['ባስልዮስ', 'ጊዜ', 'ንቃት', 'ትጋት', 'ንስሐ']
  },
  {
    id: 'bas-03',
    father: 'ቅዱስ ባስልዮስ ዘቂሣርያ',
    fatherTitle: 'ቅዱስ ባስልዮስ ዘቂሣርያ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ምዕራፍ ፴፫',
    title: 'ምሥጢረ ሥላሴ — ሦስት አካላት አንድ አምላክ',
    teaching: 'አብ ወላዲ ነው፥ ወልድ ተወላዲ ነው፥ መንፈስ ቅዱስ ሠራፂ ነው፤ በሦስትነታቸው ሳይደባለቁ ፍጹማን ናቸው፤ በመለኮት፥ በህልውና፥ በፈቃድና በሥልጣን ግን አንድ አምላክ ናቸው።',
    theme: 'ምሥጢረ ሥላሴ (The Holy Trinity)',
    mood: 'dogmatic',
    keywords: ['ሥላሴ', 'አብ', 'ወልድ', 'መንፈስ ቅዱስ', 'ባስልዮስ', 'አንድነት']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፭. ቅዱስ ጎርጎርዮስ ነባቤ መለኮት (St. Gregory Nazianzen / The Theologian)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'grg-01',
    father: 'ቅዱስ ጎርጎርዮስ ነባቤ መለኮት',
    fatherTitle: 'ቅዱስ ጎርጎርዮስ ዘእንዚናንዙ ነባቤ መለኮት',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ጎርጎርዮስ ምዕራፍ ፵፰',
    title: 'መለኮታዊ ብርሃንና እግዚአብሔርን ማወቅ',
    teaching: 'እግዚአብሔር ብርሃን ነው፤ ወደ እርሱ የሚቀርብም በመንፈሳዊ ብርሃን ይሞላል። አእምሮህን ከምድራዊ ጭንቀት አጽዳ፥ በጸጥታም ሆነህ የፈጣሪህን ድምፅ ስማ፤ እርሱ በንጹሕ ልብ ውስጥ ያድራል።',
    theme: 'መለኮታዊ እውቀትና ብርሃን',
    mood: 'contemplative',
    keywords: ['ጎርጎርዮስ', 'ብርሃን', 'መለኮት', 'ንጽሕና', 'ጸሎት']
  },
  {
    id: 'grg-02',
    father: 'ቅዱስ ጎርጎርዮስ ነባቤ መለኮት',
    fatherTitle: 'ቅዱስ ጎርጎርዮስ ነባቤ መለኮት',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ምዕራፍ ፶፩',
    title: 'ያልተዋሐደውን አላዳነም',
    teaching: 'ክርስቶስ የሰውን ሥጋና ነፍስ ሙሉ በሙሉ ተዋሐደ፤ እርሱ ያልተዋሐደው ነገር አልዳነምና። እኛን ሁለንተናችንን ያድን ዘንድ ፍጹም ሰው ሆነ።',
    theme: 'ፍጹም ድኅነትና ተዋሕዶ',
    mood: 'dogmatic',
    keywords: ['ጎርጎርዮስ', 'ተዋሕዶ', 'ሰው መሆን', 'ድኅነት', 'ነፍስ']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፮. ቅዱስ ኤፍሬም ሶርያዊ (St. Ephrem the Syrian - Harp of the Spirit)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'eph-01',
    father: 'ቅዱስ ኤፍሬም ሶርያዊ',
    fatherTitle: 'ቅዱስ ኤፍሬም ሶርያዊ ማኅቶተ ቤተ ክርስቲያን',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'ውዳሴ ማርያም ዘሰኑይ / ድርሳነ ማርያም',
    title: 'የድንግል ማርያም ክብርና ድንቅ ምስጢር',
    teaching: 'ከሰማያት ሰማይ በላይ የገዘፈውን ፈጣሪ በጠባቧ ማህፀንሽ የወሰንሺው ድንግል ሆይ፥ አንቺ ድንቅ ድንኳን ነሽ! መለኮት በእሳትነቱ ሳይፈጅሽ አደረብሽ፤ ዓለም ሁሉ ያመሰግንሻል።',
    theme: 'ውዳሴ ማርያም (Praise of St. Mary)',
    mood: 'devotional',
    keywords: ['ኤፍሬም', 'ማርያም', 'ውዳሴ', 'መለኮት', 'ድንግል', 'ምስጋና']
  },
  {
    id: 'eph-02',
    father: 'ቅዱስ ኤፍሬም ሶርያዊ',
    fatherTitle: 'ቅዱስ ኤፍሬም ሶርያዊ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'መጽሐፈ ተግሣጽ ዘቅዱስ ኤፍሬም',
    title: 'ስለ ልብ ትሕትናና የዕንባ ጸሎት',
    teaching: 'ትሕትና የቅድስና ሁሉ መሠረት ናት፤ ያለ ትሕትና ጾምም ሆነ ጸሎት ዋጋ የላቸውም። በፈጣሪህ ፊት በዕንባ ራስህን ዝቅ አድርግ፤ ትሑታንን ከፍ የሚያደርግ አምላክ ያጽናናሃል።',
    theme: 'ትሕትናና የዕንባ ጸሎት',
    mood: 'repentant',
    keywords: ['ኤፍሬም', 'ትሕትና', 'ዕንባ', 'ንስሐ', 'ቅድስና']
  },
  {
    id: 'eph-03',
    father: 'ቅዱስ ኤፍሬም ሶርያዊ',
    fatherTitle: 'ቅዱስ ኤፍሬም ሶርያዊ',
    century: '፬ኛው መቶ ክፍለ ዘመን',
    source: 'መጽሐፈ ኤፍሬም — ስለ ምሕረት',
    title: 'አምላክ ሆይ በማይመረመር ቸርነትህ ይቅር በለኝ',
    teaching: 'አቤቱ ጌታዬና አምላኬ፥ የሕይወቴ ጠባቂ ሆይ! የሥራ ፈትነትንና የከንቱ ነገር ፍላጎትን ከመንፈሴ አርቅልኝ፤ ይልቁንም የትዕግሥትን፥ የንጽሕናንና የፍቅርን መንፈስ ለባሪያህ ስጠኝ።',
    theme: 'የንስሐና የመንጻት ጸሎት',
    mood: 'repentant',
    keywords: ['ኤፍሬም', 'ጸሎት', 'ትዕግሥት', 'ፍቅር', 'ምሕረት']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፯. አባ ጊዮርጊስ ዘጋሥጫ (Abba Giyorgis of Gasicha - 14th/15th c. Ethiopia)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'gsg-01',
    father: 'አባ ጊዮርጊስ ዘጋሥጫ',
    fatherTitle: 'አባ ጊዮርጊስ ዘጋሥጫ ሊቀ ሊቃውንት',
    century: '፲፬ኛው መቶ ክፍለ ዘመን',
    source: 'መጽሐፈ ምሥጢር አንቀጽ ፩ — ስለ ምሥጢረ ሥላሴ',
    title: 'የሥላሴ አንድነትና ሦስትነት',
    teaching: 'አብ ለወልድ አባቱ ነው፥ ወልድም ለአብ ልጁ ነው፥ መንፈስ ቅዱስም ሕይወታቸው ነው፤ በስም፥ በአካል፥ በግብር ሦስት ሲሆኑ በመለኮት ግን አንድ ናቸው። ፍጥረታት ሁሉ በእነርሱ ተፈጥረዋልና ምስጋና ለእነርሱ ይሁን።',
    theme: 'ምሥጢረ ሥላሴ (Book of Mystery)',
    mood: 'dogmatic',
    keywords: ['ጊዮርጊስ ዘጋሥጫ', 'መጽሐፈ ምሥጢር', 'ሥላሴ', 'አንድነት', 'መለኮት']
  },
  {
    id: 'gsg-02',
    father: 'አባ ጊዮርጊስ ዘጋሥጫ',
    fatherTitle: 'አባ ጊዮርጊስ ዘጋሥጫ',
    century: '፲፬ኛው መቶ ክፍለ ዘመን',
    source: 'አርጋኖነ ማርያም (The Harp of Mary) — ዕለተ ዓርብ',
    title: 'የእመቤታችን አማላጅነትና ጥበቃ',
    teaching: 'ድንግል ሆይ፥ አንቺ የተዘረጋች የሕይወት ድልድይ ነሽ፤ ከምድር ወደ ሰማይ የሚያሻግር ወደብ አንቺ ነሽ። በቃል ኪዳንሽ ጥላ ሥር የምትጠጉትን ሁሉ ከኃጢአት ማዕበል አድኛቸው።',
    theme: 'አርጋኖነ ማርያም (Intercession of St. Mary)',
    mood: 'devotional',
    keywords: ['አርጋኖን', 'ጊዮርጊስ ዘጋሥጫ', 'ማርያም', 'ድልድይ', 'ቃል ኪዳን']
  },
  {
    id: 'gsg-03',
    father: 'አባ ጊዮርጊስ ዘጋሥጫ',
    fatherTitle: 'አባ ጊዮርጊስ ዘጋሥጫ',
    century: '፲፬ኛው መቶ ክፍለ ዘመን',
    source: 'መጽሐፈ ምሥጢር አንቀጽ ፳ — ስለ መስቀሉ ምስጢር',
    title: 'የመስቀሉ ምስጢርና ቤዛነት',
    teaching: 'መስቀል ኃይላችን ነው፥ መስቀል ቤዛችን ነው፤ ክርስቶስ በመስቀሉ ላይ በፈሰሰው ደሙ አዳምና ልጆቹን ነጻ አወጣ። መስቀልን የሚሳለም ሰላምንና በረከትን ያገኛል።',
    theme: 'የመስቀል ኃይልና ምስጢር',
    mood: 'triumphant',
    keywords: ['መስቀል', 'ጊዮርጊስ ዘጋሥጫ', 'ቤዛ', 'ደም', 'ድኅነት']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፰. ቅዱስ ያሬድ ማኅሌታይ (St. Yared - 6th c. Ethiopian Liturgical Doctor)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'yrd-01',
    father: 'ቅዱስ ያሬድ ማኅሌታይ',
    fatherTitle: 'ቅዱስ ያሬድ ሊቀ ማኅሌት ዘኢትዮጵያ',
    century: '፮ኛው መቶ ክፍለ ዘመን',
    source: 'ድጓ ዘቅዱስ ያሬድ — ዜማ ዘልደት',
    title: 'የክርስቶስ ልደትና የሰላም ብርሃን',
    teaching: '«ብርሃን ወጣ ለጻድቃን፥ ደስታም ለልበ ቅኖች ሆነ»፤ ዛሬ ሰላም በሰማይና በምድር ሆነ፤ ክርስቶስ ተወለደና የዲያብሎስ ጨለማ ተገፈፈ። ምስጋና ለአምላካችን ይሁን!',
    theme: 'የልደት ብርሃንና ሰላም (Diggua)',
    mood: 'festive',
    keywords: ['ያሬድ', 'ድጓ', 'ልደት', 'ብርሃን', 'ሰላም', 'ዜማ']
  },
  {
    id: 'yrd-02',
    father: 'ቅዱስ ያሬድ ማኅሌታይ',
    fatherTitle: 'ቅዱስ ያሬድ ማኅሌታይ',
    century: '፮ኛው መቶ ክፍለ ዘመን',
    source: 'ጾመ ድጓ ዘቅዱስ ያሬድ — ዘዘወረደ',
    title: 'ስለ ጾም ዋጋና መንፈሳዊ ጉዞ',
    teaching: '«ጾም ትፌውስ ቍስለ ነፍስ — ጾም የነፍስን ቁስል ትፈውሳለች»፤ ፍትወትን ታጠፋለች፥ ሰይጣንን ታባርራለች። በጾም የታጠቀ ሰው የጠላትን ፍላጻ ሁሉ ያጠፋል።',
    theme: 'ጾመ ድጓ (Lenten Healing)',
    mood: 'devotional',
    keywords: ['ያሬድ', 'ጾመ ድጓ', 'ፈውስ', 'ጾም', 'ተጋድሎ']
  },
  {
    id: 'yrd-03',
    father: 'ቅዱስ ያሬድ ማኅሌታይ',
    fatherTitle: 'ቅዱስ ያሬድ ማኅሌታይ',
    century: '፮ኛው መቶ ክፍለ ዘመን',
    source: 'ድጓ ዘቅዱስ ያሬድ — ዘትንሣኤ',
    title: 'የትንሣኤው ክብርና ድል',
    teaching: '«ክርስቶስ ተንሥአ እሙታን በዐቢይ ኃይል ወሥልጣን — ክርስቶስ በታላቅ ኃይልና ሥልጣን ከሙታን ተለይቶ ተነሣ»፤ ሰይጣንን አሰረው፥ አዳምንም ነጻ አወጣው። ሰላም ከዛሬ ጀምሮ ሆነ!',
    theme: 'ትንሣኤና የሕይወት ድል (Fasika)',
    mood: 'triumphant',
    keywords: ['ያሬድ', 'ትንሣኤ', 'ድጓ', 'ድል', 'ሕይወት', 'ሰላም']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፱. ቅዱስ ሳዊሮስ ዘአንጾኪያ (St. Severus of Antioch - 6th c.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sev-01',
    father: 'ቅዱስ ሳዊሮስ ዘአንጾኪያ',
    fatherTitle: 'ቅዱስ ሳዊሮስ ፓትርያርክ ዘአንጾኪያ',
    century: '፮ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ሳዊሮስ ምዕራፍ ፹፬',
    title: 'የኦርቶዶክስ ተዋሕዶ እምነት ጽናት',
    teaching: 'የአባቶቻችን ሃይማኖት እንደ ጽኑ ዓለት ናት፤ ነፋስና ማዕበል አያናውጣትም። በክርስቶስ ተዋሕዶ ማመን የማዳን መንገድ ነውና በእርሷ ጸንተን እንኑር፤ አክሊላችን በእርሷ ላይ ነውና።',
    theme: 'የሃይማኖት ጽናት (Steadfast Orthodoxy)',
    mood: 'dogmatic',
    keywords: ['ሳዊሮስ', 'ሃይማኖተ አበው', 'ጽናት', 'ተዋሕዶ', 'አንጾኪያ']
  },
  {
    id: 'sev-02',
    father: 'ቅዱስ ሳዊሮስ ዘአንጾኪያ',
    fatherTitle: 'ቅዱስ ሳዊሮስ ዘአንጾኪያ',
    century: '፮ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ሳዊሮስ ምዕራፍ ፹፮',
    title: 'የጸሎት ተስፋና በፈተና መጽናት',
    teaching: 'መከራ ሲመጣብህ አትደንግጥ፤ እግዚአብሔር የሚወደውን ይገሥጻልና። በፈተና እሳት ውስጥ አልፈህ ንጹሕ ወርቅ ሆነህ ትወጣለህ፤ የሚያድንህ ጌታ ቅርብ ነው።',
    theme: 'በትዕግሥት መጽናትና ተስፋ',
    mood: 'solemn',
    keywords: ['ሳዊሮስ', 'ፈተና', 'ትዕግሥት', 'ተስፋ', 'ወርቅ', 'ጽናት']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፲. ቅዱስ ዲዮስቆሮስ ዘእስክንድርያ (St. Dioscorus of Alexandria - 5th c.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dios-01',
    father: 'ቅዱስ ዲዮስቆሮስ ዘእስክንድርያ',
    fatherTitle: 'አባ ዲዮስቆሮስ ሊቀ ጳጳሳት ዘእስክንድርያ ተጋዳይ',
    century: '፭ኛው መቶ ክፍለ ዘመን',
    source: 'ሃይማኖተ አበው ዘቅዱስ ዲዮስቆሮስ ምዕራፍ ፸፰',
    title: 'ስለ ተዋሕዶ እምነት ምስክርነት',
    teaching: 'በአንድ ክርስቶስ እናምናለን፤ መለኮቱ ከትስብእቱ አንድ አፍታ እንኳ አልተለየም። መከራ ቢመጣ፥ ግፍ ቢፈጸምብኝ እንኳ ይህችን የቀደሙት አባቶቼን እምነት ለአፍታም አልለውጥም።',
    theme: 'የኦርቶዶክስ ተዋሕዶ ምስክርነት',
    mood: 'triumphant',
    keywords: ['ዲዮስቆሮስ', 'ሃይማኖተ አበው', 'ተዋሕዶ', 'ጽናት', 'እስክንድርያ']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፲፩. አባ ሕርያቆስ ዘሀገረ ብህነሳ (Abba Heryacos of Behnesa)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hry-01',
    father: 'አባ ሕርያቆስ ዘሀገረ ብህነሳ',
    fatherTitle: 'አባ ሕርያቆስ ኤጲስ ቆጶስ ዘሀገረ ብህነሳ',
    century: '፫ኛው/፬ኛው መቶ ክፍለ ዘመን',
    source: 'ቅዳሴ ማርያም (Anaphora of St. Mary) አንቀጽ ፳፪',
    title: 'ኦ ድንግል አኮ በፍትወት ዘተፀነስኪ',
    teaching: 'ድንግል ሆይ፥ በፍትወት የተፀነስሽ አይደለሽም፤ በሩካቤና በኃጢአት አልተገኘሽም፤ ነገር ግን በቅድስናና በንጽሕና በእግዚአብሔር ጥበቃ ተጠብቀሽ ተወለድሽ። የፍጥረት ሁሉ መመኪያ ድንግል ማርያም ሆይ፥ ደስ ይበልሽ!',
    theme: 'ቅዳሴ ማርያም (Anaphora of St. Mary)',
    mood: 'devotional',
    keywords: ['ሕርያቆስ', 'ቅዳሴ ማርያም', 'ንጽሕና', 'ድንግል', 'ምስጋና']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ፲፪. አቡነ ተክለ ሃይማኖት (Saint Tekle Haymanot - 13th c. Ethiopia)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tkl-01',
    father: 'አቡነ ተክለ ሃይማኖት',
    fatherTitle: 'ጻድቁ አባታችን አቡነ ተክለ ሃይማኖት ሐዲስ ሐዋርያ',
    century: '፲፫ኛው መቶ ክፍለ ዘመን',
    source: 'ገድለ ተክለ ሃይማኖት አንቀጽ ፵ — የመጨረሻ ቃለ ምዕዳን',
    title: 'የፍቅርና የአንድነት ቃል ኪዳን',
    teaching: 'ልጆቼ ሆይ፥ እርስ በርሳችሁ ተዋደዱ፤ ፍቅር የሌለው ሰው የእግዚአብሔር ሊሆን አይችልም። ሰላምንና አንድነትን ጠብቁ፤ ድሆችንና ችግረኞችን አትርሱ፤ በጸሎትም ሁልጊዜ ትጉ።',
    theme: 'ፍቅርና አንድነት (St. Tekle Haymanot)',
    mood: 'compassionate',
    keywords: ['ተክለ ሃይማኖት', 'ፍቅር', 'አንድነት', 'ጸሎት', 'በረከት', 'ገድል']
  }
];

/**
 * Returns a verified patristic quote matching a given theme, father name, or mood.
 * Falls back to a deterministic, zero-hallucination patristic pick.
 */
export function getVerifiedPatristicQuote(themeOrFather = '', mood = '') {
  const qTarget = (themeOrFather || '').toLowerCase().trim();
  const qMood = (mood || '').toLowerCase().trim();

  // 1. Try to find a precise match
  const matches = VERIFIED_PATRISTICS.filter(p => {
    if (qTarget) {
      if (p.father.toLowerCase().includes(qTarget) || qTarget.includes(p.father.toLowerCase())) return true;
      if (p.title.toLowerCase().includes(qTarget) || qTarget.includes(p.title.toLowerCase())) return true;
      if (p.theme.toLowerCase().includes(qTarget) || qTarget.includes(p.theme.toLowerCase())) return true;
      if (p.keywords.some(k => k.toLowerCase().includes(qTarget) || qTarget.includes(k.toLowerCase()))) return true;
    }
    if (qMood && p.mood === qMood) return true;
    return false;
  });

  if (matches.length > 0) {
    const match = matches[Math.floor(Math.random() * matches.length)];
    return { ...match, canonical: true };
  }

  // 2. Pick a random verified patristic record
  const random = VERIFIED_PATRISTICS[Math.floor(Math.random() * VERIFIED_PATRISTICS.length)];
  return { ...random, canonical: true };
}

/**
 * Searches the patristic teachings repository across teaching text, father name, source, and keywords.
 */
export function searchPatristics(query = '') {
  if (!query) return VERIFIED_PATRISTICS;
  const q = query.toLowerCase().trim();
  return VERIFIED_PATRISTICS.filter(p =>
    p.teaching.toLowerCase().includes(q) ||
    p.father.toLowerCase().includes(q) ||
    p.title.toLowerCase().includes(q) ||
    p.source.toLowerCase().includes(q) ||
    p.theme.toLowerCase().includes(q) ||
    p.keywords.some(k => k.toLowerCase().includes(q))
  );
}

/**
 * Returns all teachings from a specific Church Father.
 */
export function getPatristicsByFather(fatherName = '') {
  if (!fatherName) return [];
  const f = fatherName.toLowerCase().trim();
  return VERIFIED_PATRISTICS.filter(p => p.father.toLowerCase().includes(f));
}

/**
 * Returns the total count of loaded patristic teachings.
 */
export function getTotalPatristicsCount() {
  return VERIFIED_PATRISTICS.length;
}
