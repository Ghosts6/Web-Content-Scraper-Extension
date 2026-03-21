import React from 'react';

interface CleanModeRowProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function CleanModeRow({ checked, onChange }: CleanModeRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 10,
      background: checked ? 'rgba(99,102,241,0.06)' : 'rgba(241,245,249,0.9)',
      border: `1px solid ${checked ? 'rgba(99,102,241,0.22)' : 'rgba(203,213,225,0.7)'}`,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ color: checked ? '#6366f1' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21l9-9" />
            <path d="M12.22 6.22a4 4 0 015.56 5.56l-9.56 9.56-6-6 9.56-9.56z" />
          </svg>
        </span>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', margin: 0 }}>Clean Content Mode</p>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>Remove ads, navigation and noise</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} label="Clean Content Mode" />
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2,
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        background: checked ? 'linear-gradient(90deg, #6366f1, #818cf8)' : 'rgba(100,116,139,0.25)',
        display: 'flex', alignItems: 'center', flexShrink: 0,
        boxShadow: checked ? '0 0 8px rgba(99,102,241,0.45)' : 'none',
      }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'block',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}