import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing
} from 'remotion';

export const EOTCReel = ({
  title = 'የዕለቱ ኃይለ ቃል',
  quote = 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
  reference = 'መዝሙረ ዳዊት ፳፯፥፩',
  date = 'ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
  theme = 'መንፈሳዊ ብርሃን',
  subtitles = []
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const isVertical = height > width;

  // 1. Entrance spring animations
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 }
  });

  // 2. Halo breathing & pulse
  const haloScale = interpolate(
    Math.sin((frame / fps) * 1.5),
    [-1, 1],
    [0.92, 1.08]
  );
  const haloOpacity = interpolate(
    Math.sin((frame / fps) * 2),
    [-1, 1],
    [0.18, 0.32]
  );

  // 3. Floating sacred particles (deterministic based on frame)
  const particles = [
    { x: 15, speed: 1.1, size: 4, delay: 0 },
    { x: 32, speed: 1.6, size: 5, delay: 20 },
    { x: 50, speed: 1.3, size: 6, delay: 10 },
    { x: 68, speed: 1.8, size: 4, delay: 35 },
    { x: 82, speed: 1.2, size: 5, delay: 15 },
    { x: 25, speed: 1.5, size: 3, delay: 45 },
    { x: 75, speed: 1.4, size: 4, delay: 30 }
  ];

  // Smart, balanced clause segmentation (splits at Ethiopian punctuation ፤ or ። or creates balanced phrases)
  const segments = React.useMemo(() => {
    if (!quote) return [];
    const clauses = quote
      .split(/([፤።?!])/)
      .reduce((acc, curr, i, arr) => {
        if (i % 2 === 0) {
          const punct = arr[i + 1] || '';
          const trimmed = (curr + punct).trim();
          if (trimmed) acc.push(trimmed);
        }
        return acc;
      }, []);

    if (clauses.length >= 2 && clauses.length <= 4) {
      return clauses;
    }

    const allWords = quote.split(/\s+/).filter(Boolean);
    if (allWords.length <= 6) return [quote];
    const half = Math.ceil(allWords.length / 2);
    return [
      allWords.slice(0, half).join(' '),
      allWords.slice(half).join(' ')
    ];
  }, [quote]);

  // Adaptive, large typography: fills 1080x1920 mobile screen with bold presence
  const maxSegmentLength = Math.max(...segments.map(s => s.length), 0);
  const quoteFontSize = isVertical
    ? (maxSegmentLength > 45 ? 68 : maxSegmentLength > 26 ? 82 : 92)
    : (maxSegmentLength > 45 ? 48 : maxSegmentLength > 26 ? 56 : 64);

  // 5. Reference citation entrance
  const refEntrance = interpolate(frame, [30, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // 6. Cross pulse & scale
  const crossScale = interpolate(introSpring, [0, 1], [0.85, 1]);
  const crossOpacity = interpolate(introSpring, [0, 1], [0, 1]);

  // 7. Reel progress bar (0% -> 100% over the duration)
  const progressPercent = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        width,
        height,
        background: 'radial-gradient(ellipse at 50% 35%, #0d1322 0%, #060911 55%, #020306 100%)',
        color: '#ffffff',
        fontFamily: "'Noto Sans Ethiopic', 'Abyssinica SIL', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isVertical ? '160px 60px 220px' : '75px 50px 75px',
        boxSizing: 'border-box'
      }}
    >
      {/* ── Sacred Ambient Glow ── */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${haloScale})`,
          width: isVertical ? 1000 : 750,
          height: isVertical ? 1000 : 750,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.10) 42%, transparent 70%)',
          opacity: haloOpacity,
          pointerEvents: 'none',
          filter: 'blur(50px)'
        }}
      />

      {/* ── Secondary Deep Blue Atmospheric Halo ── */}
      <div
        style={{
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isVertical ? 800 : 540,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(30, 58, 138, 0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(35px)'
        }}
      />

      {/* ── Sacred Floating Light Particles ── */}
      {particles.map((p, idx) => {
        const yPos = interpolate(
          (frame + p.delay * 10) % (fps * 6),
          [0, fps * 6],
          [height + 50, -50]
        );
        const pOpacity = interpolate(
          (frame + p.delay * 10) % (fps * 6),
          [0, fps * 1.5, fps * 4.5, fps * 6],
          [0, 0.8, 0.8, 0]
        );
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: yPos,
              width: p.size + 1,
              height: p.size + 1,
              borderRadius: '50%',
              backgroundColor: '#f0d890',
              boxShadow: '0 0 14px 4px rgba(240, 216, 144, 0.70)',
              opacity: pOpacity,
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* ── TOP SECTION: Header & Date Badge ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isVertical ? 20 : 14,
          zIndex: 10,
          transform: `translateY(${interpolate(introSpring, [0, 1], [-30, 0])}px)`,
          opacity: interpolate(introSpring, [0, 1], [0, 1])
        }}
      >
        {/* Sacred Cross Icon */}
        <div
          style={{
            fontSize: isVertical ? 86 : 60,
            color: '#d4af37',
            transform: `scale(${crossScale})`,
            opacity: crossOpacity,
            textShadow: '0 0 40px rgba(212, 175, 55, 0.90)',
            lineHeight: 1
          }}
        >
          ✝
        </div>

        {/* Theme pill with prominent gold glow */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.14)',
            border: '2px solid rgba(212, 175, 55, 0.45)',
            borderRadius: 40,
            padding: isVertical ? '14px 42px' : '9px 28px',
            fontSize: isVertical ? 32 : 24,
            fontWeight: 800,
            color: '#f7e7b5',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            boxShadow: '0 6px 26px rgba(0, 0, 0, 0.5), 0 0 22px rgba(212, 175, 55, 0.25)'
          }}
        >
          {theme}
        </div>

        {date && (
          <div
            style={{
              fontSize: isVertical ? 26 : 20,
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: '0.08em',
              fontWeight: 500
            }}
          >
            {date}
          </div>
        )}
      </div>

      {/* ── CENTER SECTION: Sacred Kinetic Quote (Prominent & Cinematic) ── */}
      <div
        style={{
          maxWidth: isVertical ? 980 : 920,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 10,
          margin: 'auto 0'
        }}
      >
        {/* Subtle decorative quotation mark */}
        <div
          style={{
            fontSize: isVertical ? 76 : 52,
            color: 'rgba(212, 175, 55, 0.60)',
            marginBottom: isVertical ? 26 : 14,
            lineHeight: 1
          }}
        >
          ❝
        </div>

        {/* Kinetic Text Segments */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isVertical ? 28 : 18,
            alignItems: 'center',
            width: '100%'
          }}
        >
          {segments.map((seg, idx) => {
            const startFrame = 10 + idx * 20;
            const segProgress = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 14, stiffness: 95 }
            });
            const segOpacity = interpolate(segProgress, [0, 1], [0, 1]);
            const segY = interpolate(segProgress, [0, 1], [32, 0]);

            return (
              <div
                key={idx}
                style={{
                  fontSize: quoteFontSize,
                  fontWeight: 800,
                  lineHeight: 1.42,
                  color: '#ffffff',
                  textShadow: '0 4px 32px rgba(0, 0, 0, 0.90), 0 2px 10px rgba(0, 0, 0, 0.95)',
                  opacity: frame >= startFrame ? segOpacity : 0,
                  transform: `translateY(${segY}px)`,
                  letterSpacing: '0.025em',
                  wordBreak: 'keep-all'
                }}
              >
                {seg}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM SECTION: Canonical Scripture Reference ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isVertical ? 20 : 14,
          zIndex: 10,
          opacity: refEntrance,
          transform: `translateY(${interpolate(refEntrance, [0, 1], [20, 0])}px)`
        }}
      >
        {/* Elegant Golden Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            width: isVertical ? 500 : 380
          }}
        >
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.70))'
            }}
          />
          <div
            style={{
              fontSize: isVertical ? 20 : 16,
              color: '#d4af37',
              textShadow: '0 0 14px rgba(212, 175, 55, 0.9)'
            }}
          >
            ✦
          </div>
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.70), transparent)'
            }}
          />
        </div>

        {/* Reference text */}
        <div
          style={{
            fontSize: isVertical ? 44 : 32,
            fontWeight: 800,
            color: '#f7e7b5',
            letterSpacing: '0.08em',
            textShadow: '0 3px 20px rgba(212, 175, 55, 0.55)'
          }}
        >
          {reference}
        </div>
      </div>

      {/* ── DURATION PROGRESS BAR (Bottom Edge) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 5,
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #d4af37, #f7ecbf)',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.8)'
          }}
        />
      </div>
    </div>
  );
};
