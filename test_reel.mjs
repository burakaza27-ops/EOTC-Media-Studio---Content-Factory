// Test script: renders a Remotion reel to ./output
import { renderRemotionReel } from './src/render/remotion/render.js';

renderRemotionReel({
  outputDir: './output',
  baseName: 'test_remotion',
  quote: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
  reference: 'መዝሙረ ዳዊት ፳፯፥፩',
  theme: 'የዕለቱ ኃይለ ቃል',
  date: 'መስከረም ፳፩',
  profiles: ['9:16']
}).then(res => {
  console.log('✅ Reel Render Complete:', JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('❌ Render Error:', err.message);
  process.exit(1);
});
