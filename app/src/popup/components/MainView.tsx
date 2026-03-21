import React from 'react';
import { ExtractedContent } from '../../scraper/extractor';
import { Status } from '../App';
import { CleanModeRow } from './CleanModeRow';
import { PulseDot } from './PulseDot';

interface MainViewProps {
  data: ExtractedContent | null;
  status: Status;
  cleanMode: boolean;
  onCleanModeChange: (value: boolean) => void;
  onScrape: () => void;
  onViewSelectors: () => void;
  onViewBatch: () => void;
  onViewPreview: () => void;
  onViewExport: () => void;
}

export function MainView({
  data,
  status,
  cleanMode,
  onCleanModeChange,
  onScrape,
  onViewSelectors,
  onViewBatch,
  onViewPreview,
  onViewExport,
}: MainViewProps) {
  const statusLabel = {
    idle: 'Ready to scrape',
    loading: 'Scanning page…',
    success: data?.title ? `✓ ${data.title.slice(0, 26)}${data.title.length > 26 ? '…' : ''}` : '✓ Done',
    error: 'Error — try again',
  }[status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CleanModeRow checked={cleanMode} onChange={onCleanModeChange} />

      <div className="gb-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ color: '#6366f1', display: 'flex' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', letterSpacing: '0.01em' }}>Quick Scrape</span>
        </div>
        <p style={{ fontSize: 10.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.55 }}>
          Automatically extract titles, headings, paragraphs,&nbsp;links, images and metadata.
        </p>
        <button className="shimmer-btn lift-btn" onClick={onScrape} disabled={status === 'loading'}
          style={{ width: '100%', padding: '9px 16px', borderRadius: 8, border: 'none', background: status === 'loading' ? 'rgba(99,102,241,0.45)' : 'linear-gradient(90deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)', color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '0.025em', cursor: status === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: status === 'loading' ? 'none' : '0 3px 12px rgba(99,102,241,0.38)' }}>
          {status === 'loading' ? (
            <><span style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin-loading 0.65s linear infinite' }} /> Scanning…</>
          ) : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Scrape This Page</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="lift-btn" onClick={onViewSelectors} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.22)', background: 'rgba(99,102,241,0.05)', color: '#4f46e5', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> Selectors
        </button>
        <button className="lift-btn" onClick={onViewBatch} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(241,245,249,0.9)', color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> Batch Scrape
        </button>
      </div>

      {data && (
        <button className="lift-btn" onClick={onViewExport} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.28)', background: 'linear-gradient(90deg, rgba(245,158,11,0.07) 0%, rgba(251,191,36,0.07) 100%)', color: '#92400e', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em', boxShadow: '0 1px 4px rgba(245,158,11,0.1)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Export Results
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(248,250,255,0.95)', border: '1px solid rgba(203,213,225,0.55)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PulseDot status={status} />
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: '0.02em', color: status === 'error' ? '#dc2626' : status === 'success' ? '#15803d' : '#64748b' }}>
            {statusLabel}
          </span>
        </div>
        <span style={{ fontSize: 9, color: '#cbd5e1', fontFamily: "'Courier New', monospace", letterSpacing: '0.04em' }}>v1.0</span>
      </div>
    </div>
  );
}