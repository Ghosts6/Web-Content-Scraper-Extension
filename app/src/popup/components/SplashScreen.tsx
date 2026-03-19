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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

        /* ── Background aurora blobs ── */
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0px,   0px)  scale(1);   }
          33%       { transform: translate(40px, -30px) scale(1.15); }
          66%       { transform: translate(-25px, 35px) scale(0.88); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0px,   0px)  scale(1);   }
          33%       { transform: translate(-35px, 25px) scale(0.9);  }
          66%       { transform: translate(30px, -40px) scale(1.2);  }
        }
        @keyframes blob-drift-3 {
          0%, 100% { transform: translate(0px,   0px)  scale(1);   }
          50%       { transform: translate(20px,  20px) scale(1.1);  }
        }

        /* ── Outer conic-gradient ring spinning CW ── */
        @keyframes spin-cw {
          to { transform: rotate(360deg); }
        }

        /* ── Middle dashed ring spinning CCW ── */
        @keyframes spin-ccw {
          to { transform: rotate(-360deg); }
        }

        /* ── Inner circle pulse glow ── */
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0px  4px  rgba(99,102,241,0.15),
                                 0 0 30px 10px rgba(99,102,241,0.08); }
          50%       { box-shadow: 0 0 0px  6px  rgba(99,102,241,0.30),
                                 0 0 50px 20px rgba(99,102,241,0.18); }
        }

        /* ── Logo scale-in ── */
        @keyframes logo-in {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── Per-character reveal (tough-earwig-63 style) ── */
        @keyframes char-rise {
          0%   { opacity: 0; transform: translateY(18px) scaleY(0.7); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0)    scaleY(1);   filter: blur(0px); }
        }

        /* ── Shimmer sweep across text after reveal ── */
        @keyframes shimmer-sweep {
          0%   { background-position: -300% center; }
          100% { background-position:  300% center; }
        }

        /* ── Sub-tagline fade in ── */
        @keyframes tagline-in {
          0%   { opacity: 0; letter-spacing: 0.6em; }
          100% { opacity: 0.45; letter-spacing: 0.25em; }
        }

        /* ── Whole splash fade out ── */
        @keyframes splash-exit {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Scanning line sweep on circle ── */
        @keyframes scan-line {
          0%   { top: 8%;  opacity: 0;   }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { top: 92%; opacity: 0;   }
        }

        .splash-exit {
          animation: splash-exit 0.4s ease forwards;
        }

        .char-reveal {
          display: inline-block;
          opacity: 0;
          animation: char-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .title-shimmer {
          background: linear-gradient(
            90deg,
            #818cf8 0%,
            #f59e0b 30%,
            #c4b5fd 50%,
            #f59e0b 70%,
            #818cf8 100%
          );
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-sweep 2.5s linear 1.2s infinite;
        }

        .ring-outer {
          animation: spin-cw 2.4s linear infinite;
        }

        .ring-middle {
          animation: spin-ccw 3.6s linear infinite;
        }

        .inner-circle {
          animation: pulse-ring 2.8s ease-in-out infinite;
        }

        .logo-img {
          animation: logo-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }

        .tagline {
          animation: tagline-in 0.8s ease-out 2.0s both;
        }

        .scan {
          animation: scan-line 1.8s ease-in-out 0.6s infinite;
        }
      `}</style>

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