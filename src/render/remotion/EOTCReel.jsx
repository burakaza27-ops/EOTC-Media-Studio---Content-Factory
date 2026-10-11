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

  // 4. Kinetic typography timing
  // Split the quote into natural poetic segments (or words)
  const words = (quote || '').split(' ');
  const wordsPerSegment = Math.max(1, Math.ceil(words.length / 4));
  const segments = [];
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    segments.push(words.slice(i, i + wordsPerSegment).join(' '));
  }

  // 5. Reference citation entrance
  const refEntrance = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // 6. Cross pulse & scale
  const crossScale = interpolate(introSpring, [0, 1], [0.8, 1]);
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
        padding: isVertical ? '140px 80px 120px' : '90px 70px 80px',
        boxSizing: 'border-box'
      }}
    >
      {/* ── Sacred Ambient Glow ── */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${haloScale})`,
          width: isVertical ? 900 : 700,
          height: isVertical ? 900 : 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.28) 0%, rgba(212, 175, 55, 0.08) 40%, transparent 70%)',
          opacity: haloOpacity,
          pointerEvents: 'none',
          filter: 'blur(40px)'
        }}
      />

      {/* ── Secondary Deep Blue Atmospheric Halo ── */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isVertical ? 700 : 500,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(30, 58, 138, 0.16) 0%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(30px)'
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
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#f0d890',
              boxShadow: '0 0 12px 3px rgba(240, 216, 144, 0.65)',
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
          gap: 16,
          zIndex: 10,
          transform: `translateY(${interpolate(introSpring, [0, 1], [-30, 0])}px)`,
          opacity: interpolate(introSpring, [0, 1], [0, 1])
        }}
      >
        {/* Sacred Cross Icon */}
        <div
          style={{
            fontSize: isVertical ? 56 : 46,
            color: '#d4af37',
            transform: `scale(${crossScale})`,
            opacity: crossOpacity,
            textShadow: '0 0 25px rgba(212, 175, 55, 0.75)',
            lineHeight: 1
          }}
        >
          ✝
        </div>

        {/* Theme pill with delicate gold shimmer border */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.28)',
            borderRadius: 30,
            padding: '8px 26px',
            fontSize: isVertical ? 20 : 18,
            fontWeight: 600,
            color: '#f0d890',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          {theme}
        </div>

        {date && (
          <div
            style={{
              fontSize: isVertical ? 18 : 16,
              color: 'rgba(255, 255, 255, 0.55)',
              letterSpacing: '0.06em',
              fontWeight: 400
            }}
          >
            {date}
          </div>
        )}
      </div>

      {/* ── CENTER SECTION: Sacred Kinetic Quote ── */}
      <div
        style={{
          maxWidth: isVertical ? 920 : 860,
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
            fontSize: isVertical ? 48 : 38,
            color: 'rgba(212, 175, 55, 0.45)',
            marginBottom: isVertical ? 20 : 12,
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
            gap: isVertical ? 18 : 12,
            alignItems: 'center',
            width: '100%'
          }}
        >
          {segments.map((seg, idx) => {
            const startFrame = 12 + idx * 16;
            const segProgress = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 13, stiffness: 100 }
            });
            const segOpacity = interpolate(segProgress, [0, 1], [0, 1]);
            const segY = interpolate(segProgress, [0, 1], [25, 0]);

            return (
              <div
                key={idx}
                style={{
                  fontSize: isVertical ? 46 : 40,
                  fontWeight: 700,
                  lineHeight: 1.48,
                  color: '#ffffff',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.65)',
                  opacity: frame >= startFrame ? segOpacity : 0,
                  transform: `translateY(${segY}px)`,
                  letterSpacing: '0.015em'
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
          gap: 16,
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
            gap: 14,
            width: isVertical ? 380 : 320
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.55))'
            }}
          />
          <div
            style={{
              fontSize: 14,
              color: '#d4af37'
            }}
          >
            ✦
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.55), transparent)'
            }}
          />
        </div>

        {/* Reference text */}
        <div
          style={{
            fontSize: isVertical ? 26 : 22,
            fontWeight: 600,
            color: '#f0d890',
            letterSpacing: '0.08em',
            textShadow: '0 2px 10px rgba(212, 175, 55, 0.35)'
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
