import React from 'react';
import { Composition } from 'remotion';
import { EOTCReel } from './EOTCReel.jsx';

export const RemotionRoot = () => {
  return (
    <>
      {/* 9:16 Vertical Reel (YouTube Shorts, TikTok, Instagram Reels) */}
      <Composition
        id="EOTCReelVertical"
        component={EOTCReel}
        durationInFrames={300} // 10 seconds @ 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'የዕለቱ ኃይለ ቃል',
          quote: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
          reference: 'መዝሙረ ዳዊት ፳፯፥፩',
          date: 'ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
          theme: 'መንፈሳዊ ብርሃን'
        }}
      />

      {/* 1:1 Square Reel (Telegram / Facebook) */}
      <Composition
        id="EOTCReelSquare"
        component={EOTCReel}
        durationInFrames={300} // 10 seconds @ 30 fps
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          title: 'የዕለቱ ኃይለ ቃል',
          quote: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
          reference: 'መዝሙረ ዳዊት ፳፯፥፩',
          date: 'ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
          theme: 'መንፈሳዊ ብርሃን'
        }}
      />
    </>
  );
};
