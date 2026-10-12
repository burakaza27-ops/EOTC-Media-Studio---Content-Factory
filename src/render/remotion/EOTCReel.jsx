import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing
} from 'remotion';

// ── Authentic Lalibela Cross SVG ───────────────────────────────────────────
const LalibelaCross = ({ size = 88, opacity = 1, scale = 1 }) => (
  <svg
    width={size * scale}
    height={size * scale}
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      opacity,
      filter: `drop-shadow(0 0 ${size * 0.2}px rgba(212,175,55,0.95))
               drop-shadow(0 0 ${size * 0.08}px rgba(240,216,144,0.7))`,
    }}
  >
    <defs>
      <linearGradient id="cg" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%"   stopColor="#fdf8e8"/>
        <stop offset="40%"  stopColor="#f0d890"/>
        <stop offset="100%" stopColor="#b8962e"/>
      </linearGradient>
    </defs>
    {/* Main vertical arm */}
    <rect x="48" y="5"  width="24" height="110" rx="2.5" fill="url(#cg)"/>
    {/* Main horizontal arm */}
    <rect x="5"  y="48" width="110" height="24" rx="2.5" fill="url(#cg)"/>
    {/* Secondary cross-bars (characteristic Lalibela stepped look) */}
    <rect x="35" y="19" width="50" height="13" rx="2" fill="url(#cg)"/>
    <rect x="35" y="88" width="50" height="13" rx="2" fill="url(#cg)"/>
    <rect x="19" y="35" width="13" height="50" rx="2" fill="url(#cg)"/>
    <rect x="88" y="35" width="13" height="50" rx="2" fill="url(#cg)"/>
    {/* Central medallion with void ring */}
    <circle cx="60" cy="60" r="20" fill="url(#cg)"/>
    <circle cx="60" cy="60" r="12" fill="#07111e" opacity="0.88"/>
    <circle cx="60" cy="60" r="6"  fill="url(#cg)"/>
  </svg>
);

// ── Particle field (24 particles, varying shape & speed) ───────────────────
const PARTICLES = [
  { x: 7,  sp: 1.1, sz: 3.5, dl: 0,  dia: false },
  { x: 16, sp: 1.6, sz: 5.0, dl: 22, dia: false },
  { x: 25, sp: 1.3, sz: 4.0, dl: 8,  dia: false },
  { x: 35, sp: 1.8, sz: 3.0, dl: 40, dia: false },
  { x: 50, sp: 1.2, sz: 6.0, dl: 15, dia: true  },
  { x: 62, sp: 1.5, sz: 4.0, dl: 30, dia: false },
  { x: 72, sp: 1.4, sz: 3.5, dl: 55, dia: false },
  { x: 80, sp: 1.7, sz: 5.0, dl: 5,  dia: false },
  { x: 90, sp: 1.2, sz: 4.0, dl: 35, dia: true  },
  { x: 13, sp: 1.9, sz: 2.5, dl: 48, dia: false },
  { x: 43, sp: 1.1, sz: 3.0, dl: 60, dia: false },
  { x: 56, sp: 1.6, sz: 2.5, dl: 18, dia: false },
  { x: 67, sp: 1.3, sz: 4.0, dl: 72, dia: true  },
  { x: 78, sp: 1.8, sz: 3.0, dl: 28, dia: false },
  { x: 22, sp: 1.4, sz: 5.0, dl: 44, dia: false },
  { x: 54, sp: 1.0, sz: 2.5, dl: 80, dia: false },
  { x: 85, sp: 1.5, sz: 3.0, dl: 12, dia: false },
  { x: 31, sp: 1.7, sz: 2.5, dl: 65, dia: false },
  { x: 94, sp: 1.2, sz: 4.0, dl: 50, dia: true  },
  { x: 5,  sp: 1.6, sz: 3.0, dl: 90, dia: false },
  { x: 41, sp: 1.3, sz: 5.0, dl: 35, dia: false },
  { x: 65, sp: 1.9, sz: 2.5, dl: 20, dia: false },
  { x: 87, sp: 1.1, sz: 3.0, dl: 75, dia: false },
  { x: 52, sp: 1.4, sz: 4.0, dl: 55, dia: true  },
];

// ── Corner L-bracket positions ─────────────────────────────────────────────
const CORNERS = [
  { top: 22, left: 22,  rotation: '0deg'   },
  { top: 22, right: 22, rotation: '90deg'  },
  { bottom: 22, right: 22, rotation: '180deg' },
  { bottom: 22, left: 22,  rotation: '270deg' },
];

// ─────────────────────────────────────────────────────────────────────────────
export const EOTCReel = ({
  title     = 'የዕለቱ ኃይለ ቃል',
  quote     = 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?',
  reference = 'መዝሙረ ዳዊት ፳፯፥፩',
  date      = 'ኢትዮጵያ ኦርቶዶክስ',
  theme     = 'መንፈሳዊ ብርሃን',
  subtitles = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  // ── Global fade in / out ──
  const globalFade = interpolate(
    frame,
    [0, 15, durationInFrames - 18, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── Background bloom (frames 0 → 28) ──
  const bloom = interpolate(frame, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // ── Cross entrance spring (starts frame 8) ──
  const crossSp = spring({ frame: frame - 8, fps, config: { damping: 11, stiffness: 78 } });
  const crossScale  = interpolate(crossSp, [0, 1], [0.15, 1]);
  const crossOpacity = interpolate(crossSp, [0, 1], [0, 1]);

  // ── Header slide-down (starts frame 22) ──
  const headerSp = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 90 } });
  const headerY  = interpolate(headerSp, [0, 1], [-38, 0]);
  const headerOp = interpolate(headerSp, [0, 1], [0, 1]);

  // ── Halo breathing (always running) ──
  const haloScale = interpolate(Math.sin((frame / fps) * 1.2), [-1, 1], [0.87, 1.13]);
  const haloOp    = interpolate(Math.sin((frame / fps) * 1.5), [-1, 1], [0.28, 0.60]);

  // ── Quote segmentation ──
  const segments = React.useMemo(() => {
    if (!quote) return [];
    const clauses = quote.split(/([፤።?!])/).reduce((acc, curr, i, arr) => {
      if (i % 2 === 0) {
        const p = arr[i + 1] || '';
        const t = (curr + p).trim();
        if (t) acc.push(t);
      }
      return acc;
    }, []);
    if (clauses.length >= 2 && clauses.length <= 4) return clauses;
    const words = quote.split(/\s+/).filter(Boolean);
    if (words.length <= 6) return [quote];
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
  }, [quote]);

  const maxLen = Math.max(...segments.map(s => s.length), 0);
  const qSize  = isVertical
    ? (maxLen > 45 ? 64 : maxLen > 26 ? 78 : 94)
    : (maxLen > 45 ? 42 : maxLen > 26 ? 54 : 64);

  // ── Segment timing ──
  const SEG_START   = 52;
  const SEG_STAGGER = 28;

  // ── Reference entrance ──
  const refStart = SEG_START + segments.length * SEG_STAGGER + 20;
  const refSp    = spring({ frame: frame - refStart, fps, config: { damping: 15, stiffness: 85 } });
  const refOp    = interpolate(refSp, [0, 1], [0, 1]);
  const refY     = interpolate(refSp, [0, 1], [28, 0]);

  // ── Divider draw (just before reference) ──
  const divStart = refStart - 14;
  const divProg  = interpolate(frame, [divStart, divStart + 22], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ── Layout padding ──
  const pad = isVertical
    ? { top: 155, right: 65, bottom: 200, left: 65 }
    : { top: 74,  right: 58, bottom: 74,  left: 58  };

  return (
    <div
      style={{
        width, height,
        background: 'radial-gradient(ellipse at 50% 38%, #0e1528 0%, #070b16 45%, #020509 100%)',
        color: '#ffffff',
        fontFamily: "'Noto Sans Ethiopic','Abyssinica SIL',-apple-system,sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: pad.top, paddingRight: pad.right,
        paddingBottom: pad.bottom, paddingLeft: pad.left,
        boxSizing: 'border-box',
        opacity: globalFade,
      }}
    >

      {/* ── Opening bloom ── */}
      <div style={{
        position: 'absolute', top: '42%', left: '50%',
        transform: `translate(-50%,-50%) scale(${0.5 + bloom * 1.0})`,
        width: isVertical ? 980 : 740, height: isVertical ? 980 : 740,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.06) 45%, transparent 70%)',
        opacity: bloom * 0.85, pointerEvents: 'none', filter: 'blur(55px)',
      }}/>

      {/* ── Breathing sacred halo ── */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: `translate(-50%,-50%) scale(${haloScale})`,
        width: isVertical ? 870 : 670, height: isVertical ? 870 : 670,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0.10) 42%, transparent 68%)',
        opacity: haloOp, pointerEvents: 'none', filter: 'blur(62px)',
      }}/>

      {/* ── Blue mid-tone atmospheric haze ── */}
      <div style={{
        position: 'absolute', top: '22%', left: '50%',
        transform: 'translateX(-50%)',
        width: isVertical ? 700 : 520, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(18,40,110,0.28) 0%, transparent 68%)',
        pointerEvents: 'none', filter: 'blur(44px)',
      }}/>

      {/* ── Warm candle glows (corners) ── */}
      <div style={{
        position: 'absolute', bottom: -65, left: -65,
        width: 440, height: 440, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,82,18,0.15) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(42px)',
      }}/>
      <div style={{
        position: 'absolute', bottom: -65, right: -65,
        width: 440, height: 440, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,82,18,0.15) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(42px)',
      }}/>

      {/* ── Cinematic vignette ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 46%, rgba(0,0,0,0.72) 100%)',
        pointerEvents: 'none', zIndex: 1,
      }}/>

      {/* ── Floating sacred particles ── */}
      {PARTICLES.map((p, i) => {
        const cycle = fps * (5 + (i % 3));
        const pos   = (frame + p.dl * 12) % cycle;
        const yPos  = interpolate(pos, [0, cycle], [height + 36, -36]);
        const pOp   = interpolate(pos, [0, cycle * 0.15, cycle * 0.80, cycle], [0, 0.90, 0.90, 0]);
        return (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: yPos,
            width: p.sz * 1.4, height: p.sz * 1.4,
            borderRadius: p.dia ? '0' : '50%',
            transform: p.dia ? 'rotate(45deg)' : 'none',
            backgroundColor: '#f0d890',
            boxShadow: `0 0 ${p.sz * 3}px ${p.sz + 2}px rgba(240,216,144,0.65)`,
            opacity: pOp, pointerEvents: 'none', zIndex: 2,
          }}/>
        );
      })}

      {/* ── Corner L-bracket accents (replaces cheesy progress bar) ── */}
      {CORNERS.map(({ top, right, bottom, left, rotation }, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...(top    !== undefined && { top    }),
          ...(right  !== undefined && { right  }),
          ...(bottom !== undefined && { bottom }),
          ...(left   !== undefined && { left   }),
          width: isVertical ? 42 : 30, height: isVertical ? 42 : 30,
          borderTop: '2px solid rgba(212,175,55,0.45)',
          borderLeft: '2px solid rgba(212,175,55,0.45)',
          transform: `rotate(${rotation})`,
          opacity: headerOp, zIndex: 5,
        }}/>
      ))}

      {/* ════════════════════ TOP ════════════════════ */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isVertical ? 22 : 15,
        zIndex: 10,
        transform: `translateY(${headerY}px)`,
        opacity: headerOp,
      }}>
        {/* Lalibela Cross */}
        <div style={{ transform: `scale(${crossScale})`, opacity: crossOpacity }}>
          <LalibelaCross size={isVertical ? 100 : 70}/>
        </div>

        {/* Theme pill */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.07) 100%)',
          border: '1.5px solid rgba(212,175,55,0.52)',
          borderRadius: 50,
          padding: isVertical ? '13px 44px' : '9px 30px',
          fontSize: isVertical ? 28 : 20,
          fontWeight: 800,
          color: '#f7e7b5',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 30px rgba(212,175,55,0.18)',
          backdropFilter: 'blur(10px)',
        }}>
          {theme}
        </div>

        {date && (
          <div style={{
            fontSize: isVertical ? 22 : 15,
            color: 'rgba(255,255,255,0.58)',
            letterSpacing: '0.09em',
            fontWeight: 500,
          }}>
            {date}
          </div>
        )}
      </div>

      {/* ════════════════════ QUOTE ════════════════════ */}
      <div style={{
        maxWidth: isVertical ? 960 : 910,
        width: '100%', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', margin: 'auto 0',
      }}>
        {/* Opening quote glyph */}
        <div style={{
          fontSize: isVertical ? 80 : 56,
          color: 'rgba(212,175,55,0.45)',
          lineHeight: 1, marginBottom: isVertical ? 30 : 18,
          fontFamily: 'serif',
        }}>❝</div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: isVertical ? 34 : 24,
          alignItems: 'center', width: '100%',
        }}>
          {segments.map((seg, idx) => {
            const start    = SEG_START + idx * SEG_STAGGER;
            const wipeProg = interpolate(frame, [start, start + 24], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            const shimmerX = interpolate(wipeProg, [0, 1], [-18, 118]);
            const visible  = frame >= start;

            return (
              <div key={idx} style={{ position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                {/* Text revealed by golden wipe (clip-path) */}
                <div style={{
                  fontSize: qSize,
                  fontWeight: 800,
                  lineHeight: 1.45,
                  color: '#ffffff',
                  textShadow: '0 4px 30px rgba(0,0,0,0.95), 0 1px 8px rgba(0,0,0,0.8)',
                  opacity: visible ? 1 : 0,
                  clipPath: `inset(0 ${(1 - wipeProg) * 100}% 0 0)`,
                  letterSpacing: '0.022em',
                  wordBreak: 'keep-all',
                }}>
                  {seg}
                </div>

                {/* Golden light sweep */}
                {visible && wipeProg < 0.98 && (
                  <div style={{
                    position: 'absolute', top: 0, left: `${shimmerX}%`,
                    width: '26%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,248,200,0.55), transparent)',
                    pointerEvents: 'none',
                  }}/>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════ REFERENCE ════════════════════ */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isVertical ? 20 : 14, zIndex: 10,
        opacity: refOp,
        transform: `translateY(${refY}px)`,
      }}>
        {/* Animated divider that draws from center */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: isVertical ? 500 : 380 }}>
          <div style={{
            flex: 1, height: 1.5,
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.85))',
            transform: `scaleX(${divProg})`, transformOrigin: 'right',
          }}/>
          <div style={{
            fontSize: isVertical ? 18 : 14, color: '#d4af37', opacity: divProg,
            textShadow: '0 0 14px rgba(212,175,55,0.95)',
          }}>✦</div>
          <div style={{
            flex: 1, height: 1.5,
            background: 'linear-gradient(90deg, rgba(212,175,55,0.85), transparent)',
            transform: `scaleX(${divProg})`, transformOrigin: 'left',
          }}/>
        </div>

        {/* Reference text */}
        <div style={{
          fontSize: isVertical ? 44 : 32, fontWeight: 800,
          color: '#f0d890', letterSpacing: '0.10em',
          textShadow: '0 3px 24px rgba(212,175,55,0.65)',
        }}>
          {reference}
        </div>

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: isVertical ? 10 : 5 }}>
          <div style={{ width: isVertical ? 82 : 58, height: 1, background: 'rgba(212,175,55,0.30)' }}/>
          <div style={{
            fontSize: isVertical ? 18 : 13,
            color: 'rgba(212,175,55,0.65)',
            letterSpacing: '0.22em', fontWeight: 700,
          }}>
            EOTC YOUTH
          </div>
          <div style={{ width: isVertical ? 82 : 58, height: 1, background: 'rgba(212,175,55,0.30)' }}/>
        </div>
      </div>
    </div>
  );
};
