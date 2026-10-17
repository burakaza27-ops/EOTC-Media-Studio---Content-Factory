import 'dotenv/config';
import { renderSaintOfDay, renderDailyVerse, renderFastingGuide } from './src/render/puppeteer.js';

const ctx = { mood: 'joyful', ethiopianDate: 'መስከረም ፫ ፳፻፲፯', ethiopianDateFormatted: 'መስከረም ፫ ፳፻፲፯' };

console.log('🎨 Re-rendering all templates to get fresh outputs...\n');

try {
  console.log('1/3 Rendering saint_day...');
  await renderSaintOfDay({
    saint: 'ቅዱስ ጊዮርጊስ',
    story: 'ቅዱስ ጊዮርጊስ የፍልስጤም ተወላጅ ሲሆን፣ ንጉሥ ዲዮቅልጥያኖስ ወቅት ስለ ክርስቶስ ሃይማኖቱ ሲናገር ሰማዕት ሆኗል። ቅዱሱ ሦስት ጊዜ ሰይፈ ቆዳ ሆኖ ሦስት ጊዜ ሕያው ሆነ፣ አፄ ቈስጠንጢኖስም ሕንፃ ሠርቶ ሲያከብረው የኦርቶዶክስ ቤተ ክርስቲያናት ዛሬም ስሙን ዘወትር ያወሳሉ።',
    lesson: 'ሃይማኖት ከሞት አይፈራም — ስለ ጽድቅ መከራ ለሚቀበሉ ሰዎች ያለ ሽልማት ይጠብቃቸዋል።',
    reference: 'ሮሜ ፰፥፲፰',
    feastType: 'የቅዱስ ቀን',
    isLordFeast: false,
    liturgicalContext: ctx
  }, './output/saint_day.png');
  console.log('✅ saint_day.png done\n');
} catch(e) { console.error('❌ saint:', e.message); }

try {
  console.log('2/3 Rendering daily_verse...');
  await renderDailyVerse({
    verse: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው? እግዚአብሔር የሕይወቴ ዕርዳታ ነው፤ የሚያስጨንቀኝ ማን ነው?',
    reference: 'መዝሙረ ዳዊት ፳፯፥፩',
    liturgicalContext: ctx
  }, './output/daily_verse.png');
  console.log('✅ daily_verse.png done\n');
} catch(e) { console.error('❌ verse:', e.message); }

try {
  console.log('3/3 Rendering fasting_guide...');
  await renderFastingGuide({
    name: 'ፍልሰታ',
    dayLabel: 'ቀን ፲ ከ ፲፭',
    encouragement: 'ቅድስት ድንግል ማርያም ሰማዕቶቿን ለምትቀበልባቸው ቀናት ሁሉ ስሟን እያሰቡ ጾሙ።',
    rulesHtml: '<li>ከጠዋቱ ፫ ሰዓት ሁሉን ዓይነት ምግብ ይጾሙ</li><li>ስጋ፣ ወተት እና እንቁላል አይበሉ</li>',
    reference: 'ሉቃስ ፪፥፴፯',
    progressPercent: '67',
    liturgicalContext: { ...ctx, mood: 'penitential' }
  }, './output/fasting_guide.png');
  console.log('✅ fasting_guide.png done\n');
} catch(e) { console.error('❌ fasting:', e.message); }

console.log('\n🎉 Test renders complete! Check the output directory.');
