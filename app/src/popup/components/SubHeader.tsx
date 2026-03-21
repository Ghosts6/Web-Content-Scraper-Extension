import React from 'react';

interface SubHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleGradient: string;
  dividerColor: string;
  onBack: () => void;
}

export function SubHeader({ icon, title, subtitle, titleGradient, dividerColor, onBack }: SubHeaderProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6366f1', display: 'flex' }}>{icon}</span>
          <div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em', margin: 0,
              background: titleGradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{title}</h2>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>{subtitle}</p>
          </div>
        </div>
        <button className="lift-btn" onClick={onBack} style={{
          fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
          border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(241,245,249,0.9)',
          color: '#64748b', cursor: 'pointer', letterSpacing: '0.01em',
        }}>← Back</button>
      </div>
      <div style={{ height: 1, background: dividerColor, marginBottom: 2 }} />
    </>
  );
}