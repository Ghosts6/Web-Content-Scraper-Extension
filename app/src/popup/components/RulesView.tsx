import React from 'react';
import { SiteRule } from '../../storage/rules';
import { SubHeader } from './SubHeader';

interface RulesViewProps {
  savedRules: SiteRule[];
  onDeleteRule: (domain: string) => void;
  onBack: () => void;
}

export function RulesView({ savedRules, onDeleteRule, onBack }: RulesViewProps) {
  const ACCENT_STRIPS = [
    'linear-gradient(180deg, #6366f1, #818cf8)',
    'linear-gradient(180deg, #0891b2, #06b6d4)',
    'linear-gradient(180deg, #d97706, #f59e0b)',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeader
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>}
        title="Saved Rules"
        subtitle={`${savedRules.length} domain profile${savedRules.length !== 1 ? 's' : ''} saved`}
        titleGradient="linear-gradient(90deg, #3730a3 0%, #6366f1 60%, #d97706 100%)"
        dividerColor="linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(245,158,11,0.2) 55%, transparent 100%)"
        onBack={onBack}
      />

      {savedRules.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#a5b4fc', transform: 'scale(1.5)', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
            </span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: '0 0 4px' }}>No saved rules yet</p>
          <p style={{ fontSize: 10.5, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Go to Selectors, define your fields,<br />then hit "Save Rule for Domain".
          </p>
          <button className="lift-btn" onClick={() => {}} style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 8, border: '1px solid rgba(99,102,241,0.22)', background: 'rgba(99,102,241,0.05)',
            color: '#4f46e5', fontSize: 11, fontWeight: 600, cursor: 'pointer'
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> Open Selectors
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 340, overflowY: 'auto', paddingRight: 2 }}>
          {savedRules.map((rule, idx) => {
            const fieldNames = Object.keys(rule.selectors);
            return (
              <div key={rule.domain} className="rule-card"
                style={{
                  animationDelay: `${idx * 0.05}s`,
                  display: 'flex',
                  alignItems: 'stretch',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid rgba(203,213,225,0.6)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                <div style={{ width: 3, flexShrink: 0, background: ACCENT_STRIPS[idx % 3] }} />
                <div style={{ padding: '9px 11px', flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: '0 0 4px',
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {rule.domain}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {fieldNames.slice(0, 4).map(f => (
                      <span key={f} style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(241,245,249,0.9)',
                        border: '1px solid rgba(203,213,225,0.6)',
                        color: '#64748b',
                        fontFamily: "'Courier New', monospace"
                      }}>{f}</span>
                    ))}
                    {fieldNames.length > 4 && (
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.18)',
                        color: '#6366f1',
                        fontFamily: "'Courier New', monospace"
                      }}>+{fieldNames.length - 4}</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 9,
                    color: '#cbd5e1',
                    margin: 0,
                    fontFamily: "'Courier New', monospace"
                  }}>
                    {fieldNames.length} selector{fieldNames.length !== 1 ? 's' : ''} · {new Date(rule.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="lift-btn"
                  onClick={() => onDeleteRule(rule.domain)}
                  title={`Delete rule for ${rule.domain}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 13px',
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p style={{
        fontSize: 9.5,
        color: '#94a3b8',
        textAlign: 'center',
        margin: 0,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '0.03em'
      }}>
        Rules sync across devices via storage.sync
      </p>
    </div>
  );
}