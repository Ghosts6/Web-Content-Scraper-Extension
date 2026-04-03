import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

// Extension name split into characters for per-letter animation
const TITLE_CHARS = 'Web Content Scraper'.split('');

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Start exit animation at 2.6s, unmount at 3s (0.4s fade-out)
    const exitTimer = setTimeout(() => setExiting(true), 2600);
    const doneTimer = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <>
      <div
        className={exiting ? 'splash-exit' : ''}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          backgroundColor: '#080812',
          overflow: 'hidden',
          zIndex: 9999,
        }}
      >

        {/* Blob 1 — indigo, top-left */}
        <div style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          top: '-60px',
          left: '-80px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
          animation: 'blob-drift-1 9s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Blob 2 — violet, bottom-right */}
        <div style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          bottom: '-80px',
          right: '-80px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          animation: 'blob-drift-2 11s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Blob 3 — gold accent, centre-right */}
        <div style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          top: '30%',
          right: '-20px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)',
          animation: 'blob-drift-3 7s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Subtle grid overlay for depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/*  Logo circle + rings */}
        <div style={{ position: 'relative', width: 144, height: 144 }}>

          {/* Outer ring — conic gradient, spins clockwise */}
          <div
            className="ring-outer"
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              padding: '3px',
              background: 'conic-gradient(from 0deg, #6366f1, #818cf8, #f59e0b, #6366f1 60%, transparent 60%, transparent 80%, #6366f1 80%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))',
            }}
          />

          {/* Middle ring — dashed, spins counter-clockwise */}
          <div
            className="ring-middle"
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              border: '2px dashed rgba(245,158,11,0.50)',
            }}
          />

          {/* Inner circle — logo container with glow pulse */}
          <div
            className="inner-circle"
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #13132b 0%, #1a1a3e 100%)',
              border: '1px solid rgba(99,102,241,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Scanning line inside circle */}
            <div
              className="scan"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
                pointerEvents: 'none',
              }}
            />
            {/* Logo image */}
            <img
              className="logo-img"
              src="icons/icon128x128.png"
              alt="Web Content Scraper logo"
              style={{
                width: '60%',
                height: '60%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </div>

          {/* Corner accent dots */}
          {[
            { top: -2, left: '50%', transform: 'translateX(-50%)' },
            { bottom: -2, left: '50%', transform: 'translateX(-50%)' },
            { left: -2, top: '50%', transform: 'translateY(-50%)' },
            { right: -2, top: '50%', transform: 'translateY(-50%)' },
          ].map((style, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 6px rgba(245,158,11,0.8)',
                ...style,
              }}
            />
          ))}
        </div>

        {/* Title + tagline */}
        <div style={{ textAlign: 'center', userSelect: 'none' }}>

          {/* Per-character animated title */}
          <div
            className="title-shimmer"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              marginBottom: '10px',
            }}
          >
            {TITLE_CHARS.map((char, i) => (
              <span
                key={i}
                className="char-reveal"
                style={{
                  animationDelay: `${0.55 + i * 0.045}s`,
                  // Preserve spaces
                  whiteSpace: char === ' ' ? 'pre' : undefined,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <p
            className="tagline"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '9px',
              fontWeight: 400,
              color: '#818cf8',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Extract · Structure · Export
          </p>
        </div>

        {/* Bottom status bar */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 1 ? 20 : 6,
                height: 3,
                borderRadius: 2,
                background: i === 1
                  ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                  : 'rgba(99,102,241,0.25)',
                transition: 'width 0.3s',
              }}
            />
          ))}
        </div>

      </div>
    </>
  );
}