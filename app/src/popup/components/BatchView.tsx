import React from 'react';
import { Status } from '../App';
import { CleanModeRow } from './CleanModeRow';
import { SubHeader } from './SubHeader';

interface BatchViewProps {
  cleanMode: boolean;
  onCleanModeChange: (value: boolean) => void;
  batchUrls: string;
  onBatchUrlsChange: (urls: string) => void;
  batchProgress: { current: number; total: number } | null;
  onBatchScrape: () => void;
  onBack: () => void;
  status: Status;
  hasPermission: boolean;
  onRequestPermission: () => void;
}

export function BatchView({
  cleanMode,
  onCleanModeChange,
  batchUrls,
  onBatchUrlsChange,
  batchProgress,
  onBatchScrape,
  onBack,
  status,
  hasPermission,
  onRequestPermission,
}: BatchViewProps) {
  const urlCount = batchUrls.split('\n').filter(u => u.trim().startsWith('http')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeader
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
        title="Batch Scraper"
        subtitle="Scrape multiple pages in one run"
        titleGradient="linear-gradient(90deg, #3730a3 0%, #6366f1 60%, #d97706 100%)"
        dividerColor="linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(245,158,11,0.2) 55%, transparent 100%)"
        onBack={onBack}
      />

      <CleanModeRow checked={cleanMode} onChange={onCleanModeChange} />

      {!hasPermission && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10,
          marginBottom: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>🛡️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>Website Access Required</span>
          </div>
          <p style={{ fontSize: 10, color: '#b45309', margin: '0 0 10px 0', lineHeight: 1.5 }}>
            Batch scraping requires permission to access the websites you list. This is processed 100% locally.
          </p>
          <button
            onClick={onRequestPermission}
            style={{
              width: '100%',
              padding: '6px 0',
              borderRadius: 6,
              border: 'none',
              background: '#f59e0b',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Grant Access Permissions
          </button>
        </div>
      )}

      <div className="gb-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', letterSpacing: '0.01em' }}>URL List</span>
          {batchUrls.trim() && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 10,
              background: 'rgba(99,102,241,0.1)',
              color: '#6366f1',
              fontFamily: "'Courier New', monospace"
            }}>
              {urlCount} URLs
            </span>
          )}
        </div>

        <textarea
          value={batchUrls}
          onChange={e => onBatchUrlsChange(e.target.value)}
          placeholder={"https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"}
          style={{
            width: '100%',
            height: 112,
            resize: 'none',
            boxSizing: 'border-box',
            padding: '9px 11px',
            borderRadius: 8,
            fontSize: 10.5,
            lineHeight: 1.65,
            fontFamily: "'Courier New', monospace",
            color: '#334155',
            background: 'rgba(248,250,255,0.9)',
            border: '1px solid rgba(203,213,225,0.7)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            marginBottom: 12
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(99,102,241,0.5)';
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(203,213,225,0.7)';
            e.target.style.boxShadow = 'none';
          }}
        />

        {batchProgress && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'inline-block',
                  animation: 'status-ping 1.2s ease-out infinite',
                  boxShadow: '0 0 4px rgba(245,158,11,0.5)'
                }} />
                <span style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  color: '#64748b',
                  letterSpacing: '0.02em'
                }}>Scanning page…</span>
              </div>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                color: '#94a3b8'
              }}>
                {batchProgress.current}/{batchProgress.total}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 4,
              borderRadius: 4,
              background: 'rgba(203,213,225,0.5)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
                borderRadius: 4,
                transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 6px rgba(99,102,241,0.45)'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 60,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'progress-shimmer 1.2s linear infinite'
              }} />
            </div>
          </div>
        )}

        <button
          className="shimmer-btn lift-btn"
          onClick={onBatchScrape}
          disabled={status === 'loading' || !batchUrls.trim()}
          style={{
            width: '100%',
            padding: '9px 16px',
            borderRadius: 8,
            border: 'none',
            background: (status === 'loading' || !batchUrls.trim()) ? 'rgba(99,102,241,0.35)' : 'linear-gradient(90deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.025em',
            cursor: (status === 'loading' || !batchUrls.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            boxShadow: (status === 'loading' || !batchUrls.trim()) ? 'none' : '0 3px 12px rgba(99,102,241,0.35)'
          }}
        >
          {status === 'loading' ? (
            <><span style={{
              width: 11,
              height: 11,
              border: '2px solid rgba(255,255,255,0.35)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin-loading 0.65s linear infinite'
            }} /> Scraping…</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> Start Batch Scrape</>
          )}
        </button>
      </div>

      <p style={{
        fontSize: 9.5,
        color: '#94a3b8',
        textAlign: 'center',
        margin: 0,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '0.03em'
      }}>
        One URL per line · http:// and https:// only
      </p>
    </div>
  );
}