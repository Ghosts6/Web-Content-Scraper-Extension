import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { ExtractedContent, CustomSelectors } from '../scraper/extractor';
import { Preview } from './components/Preview';
import { ExportButtons } from './components/ExportButtons';
import { CleanModeToggle } from './components/CleanModeToggle';
import { saveRule, getRuleForDomain } from '../storage/rules';

type View = 'main' | 'preview' | 'export' | 'selectors' | 'batch' | 'batch-results';
type Status = 'idle' | 'loading' | 'success' | 'error';


function IconBolt() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconBroom() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l9-9" />
      <path d="M12.22 6.22a4 4 0 015.56 5.56l-9.56 9.56-6-6 9.56-9.56z" />
    </svg>
  );
}


interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        padding: 2,
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        background: checked
          ? 'linear-gradient(90deg, #6366f1, #818cf8)'
          : 'rgba(100,116,139,0.25)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        boxShadow: checked ? '0 0 8px rgba(99,102,241,0.45)' : 'none',
      }}
    >
      <span style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        display: 'block',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}


function PulseDot({ status }: { status: Status }) {
  const color = {
    idle:    '#94a3b8',
    loading: '#f59e0b',
    success: '#22c55e',
    error:   '#ef4444',
  }[status];

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      {(status === 'loading' || status === 'success') && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: color, opacity: 0.4,
          animation: 'status-ping 1.2s ease-out infinite',
        }} />
      )}
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', position: 'relative' }} />
    </span>
  );
}


export default function App() {
  const [view, setView]             = useState<View>('main');
  const [data, setData]             = useState<ExtractedContent | null>(null);
  const [status, setStatus]         = useState<Status>('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [cleanMode, setCleanMode]   = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);

  const [selectorRows, setSelectorRows] = useState<{ field: string; selector: string }[]>([
    { field: 'title', selector: '' },
  ]);
  const [batchUrls, setBatchUrls]       = useState('');
  const [batchResults, setBatchResults] = useState<ExtractedContent[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => { loadDomainRules(); }, []);

  async function loadDomainRules() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        const rule = await getRuleForDomain(url.hostname);
        if (rule) {
          const rows = Object.entries(rule.selectors).map(([field, selector]) => ({ field, selector }));
          if (rows.length > 0) setSelectorRows(rows);
        }
      }
    } catch (e) { console.warn('Failed to load domain rules:', e); }
  }

  async function saveCurrentRule() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return;
      const url = new URL(tab.url);
      const selectors: CustomSelectors = {};
      for (const row of selectorRows) {
        if (row.field && row.selector) selectors[row.field] = row.selector;
      }
      if (Object.keys(selectors).length === 0) return;
      await saveRule({ domain: url.hostname, selectors });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setErrorMsg('Failed to save rule');
    }
  }

  async function handleScrape() {
    setStatus('loading'); setErrorMsg('');
    try {
      const response = await browser.runtime.sendMessage({ action: 'scrape', cleanMode }) as
        | { success: true; data: ExtractedContent }
        | { success: false; error: string };
      if (!response.success) throw new Error(response.error);
      setData(response.data); setStatus('success'); setView('preview');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Scrape failed');
    }
  }

  async function handleCustomScrape() {
    const selectors: CustomSelectors = {};
    for (const row of selectorRows) {
      if (row.field && row.selector) selectors[row.field] = row.selector;
    }
    if (Object.keys(selectors).length === 0) return;
    setStatus('loading');
    try {
      const response = await browser.runtime.sendMessage({
        action: 'scrapeWithSelectors', selectors, cleanMode,
      }) as { success: true; data: ExtractedContent } | { success: false; error: string };
      if (!response.success) throw new Error(response.error);
      setData(response.data); setStatus('success'); setView('preview');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Scrape failed');
    }
  }

  async function handleBatchScrape() {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return;
    setStatus('loading'); setBatchResults([]); setBatchProgress({ current: 0, total: urls.length });
    const results: ExtractedContent[] = [];
    try {
      for (let i = 0; i < urls.length; i++) {
        setBatchProgress({ current: i + 1, total: urls.length });
        try {
          const tab = await browser.tabs.create({ url: urls[i], active: false });
          await new Promise<void>((resolve) => {
            function listener(tabId: number, info: { status?: string }) {
              if (tabId === tab.id && info.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener); resolve();
              }
            }
            browser.tabs.onUpdated.addListener(listener);
          });
          const response = await browser.tabs.sendMessage(tab.id!, { action: 'scrape', cleanMode }) as
            { success: true; data: ExtractedContent } | { success: false; error: string };
          if (response.success) results.push(response.data);
          await browser.tabs.remove(tab.id!);
        } catch (e) { console.warn(`Failed to scrape ${urls[i]}:`, e); }
      }
      setBatchResults(results); setStatus('success'); setView('batch-results');
    } catch {
      setStatus('error'); setErrorMsg('Batch scraping failed');
    } finally { setBatchProgress(null); }
  }

  async function handleActivatePicker(idx: number) {
    setPickerTargetIdx(idx);
    await browser.runtime.sendMessage({ action: 'activatePicker' });
    const handler = (msg: unknown) => {
      const m = msg as { action: string; selector?: string };
      if (m.action === 'pickerSelector' && m.selector) {
        setSelectorRows(prev => prev.map((row, i) => i === idx ? { ...row, selector: m.selector! } : row));
        setPickerTargetIdx(null);
        browser.runtime.onMessage.removeListener(handler);
      }
    };
    browser.runtime.onMessage.addListener(handler);
  }

  const statusLabel = {
    idle:    'Ready to scrape',
    loading: 'Scanning page…',
    success: data?.title
      ? `✓ ${data.title.slice(0, 26)}${data.title.length > 26 ? '…' : ''}`
      : '✓ Done',
    error: 'Error — try again',
  }[status];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&display=swap');

    @keyframes status-ping {
      0%   { transform: scale(1);   opacity: 0.4; }
      100% { transform: scale(2.6); opacity: 0;   }
    }
    @keyframes spin-loading {
      to { transform: rotate(360deg); }
    }
    @keyframes app-fade-in {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0);   }
    }

    .app-root {
      animation: app-fade-in 0.28s ease both;
    }

    /* Gradient border card */
    .gb-card {
      position: relative;
      border-radius: 12px;
      background: #fff;
    }
    .gb-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      padding: 1.5px;
      background: linear-gradient(135deg, #6366f1 0%, #818cf8 45%, #f59e0b 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Lift on hover for action buttons */
    .lift-btn {
      transition: transform 0.14s ease, box-shadow 0.14s ease;
    }
    .lift-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .lift-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Shimmer sweep on primary scrape button */
    .shimmer-btn { position: relative; overflow: hidden; }
    .shimmer-btn::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.2) 50%, transparent 62%);
      transform: translateX(-100%);
      transition: transform 0.4s ease;
    }
    .shimmer-btn:hover:not(:disabled)::after { transform: translateX(100%); }
  `;

  return (
    <>
      <style>{css}</style>

      <div
        className="app-root"
        style={{ minWidth: 360, maxWidth: 420, background: '#f8faff', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{
          position: 'absolute', width: 280, height: 200, top: -70, left: -70,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 220, height: 200, bottom: -50, right: -50,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.028) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Content wrapper  */}
        <div style={{ position: 'relative', padding: '16px 16px 20px' }}>

          {/* HEADER */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            {/* Left: logo ring + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              {/* Mini logo with conic ring */}
              <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, #4f46e5, #818cf8, #f59e0b, #4f46e5)',
                  padding: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    <img src="icons/icon48x48.png" alt="" style={{ width: 19, height: 19, objectFit: 'contain' }} />
                  </div>
                </div>
                {/* Gold status dot */}
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#f59e0b', border: '2px solid #f8faff',
                  boxShadow: '0 0 5px rgba(245,158,11,0.65)',
                }} />
              </div>

              {/* Title + subtitle */}
              <div>
                <h1 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em',
                  margin: 0, lineHeight: 1.25,
                  background: 'linear-gradient(90deg, #3730a3 0%, #6366f1 55%, #d97706 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Web Content Scraper
                </h1>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0', letterSpacing: '0.01em' }}>
                  Extract structured content from any page
                </p>
              </div>
            </div>

            {/* Preview badge */}
            {data && view !== 'preview' && (
              <button
                className="lift-btn"
                onClick={() => setView('preview')}
                style={{
                  fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                  border: '1px solid rgba(99,102,241,0.28)', background: 'rgba(99,102,241,0.07)',
                  color: '#6366f1', cursor: 'pointer', letterSpacing: '0.01em', whiteSpace: 'nowrap',
                }}
              >
                Preview →
              </button>
            )}
          </div>

          {/* Gradient divider */}
          <div style={{
            height: 1, marginBottom: 14,
            background: 'linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(245,158,11,0.2) 55%, transparent 100%)',
          }} />

          {/* Error bar */}
          {status === 'error' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              marginBottom: 12, fontSize: 11, color: '#dc2626',
            }}>
              <span>⚠</span> {errorMsg}
            </div>
          )}

          {/* MAIN VIEW */}
          {view === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Clean Mode toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: cleanMode ? 'rgba(99,102,241,0.06)' : 'rgba(241,245,249,0.9)',
                border: `1px solid ${cleanMode ? 'rgba(99,102,241,0.22)' : 'rgba(203,213,225,0.7)'}`,
                transition: 'background 0.2s, border-color 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: cleanMode ? '#6366f1' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
                    <IconBroom />
                  </span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      Clean Content Mode
                    </p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>
                      Remove ads, navigation and noise
                    </p>
                  </div>
                </div>
                <ToggleSwitch checked={cleanMode} onChange={setCleanMode} label="Clean Content Mode" />
              </div>

              {/* Quick Scrape card with gradient border */}
              <div className="gb-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{ color: '#6366f1', display: 'flex' }}><IconBolt /></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', letterSpacing: '0.01em' }}>
                    Quick Scrape
                  </span>
                </div>
                <p style={{ fontSize: 10.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.55 }}>
                  Automatically extract titles, headings, paragraphs,&nbsp;links, images and metadata.
                </p>
                <button
                  className="shimmer-btn lift-btn"
                  onClick={handleScrape}
                  disabled={status === 'loading'}
                  style={{
                    width: '100%', padding: '9px 16px', borderRadius: 8, border: 'none',
                    background: status === 'loading'
                      ? 'rgba(99,102,241,0.45)'
                      : 'linear-gradient(90deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)',
                    color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '0.025em',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: status === 'loading' ? 'none' : '0 3px 12px rgba(99,102,241,0.38)',
                  }}
                >
                  {status === 'loading' ? (
                    <>
                      <span style={{
                        width: 11, height: 11,
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                        animation: 'spin-loading 0.65s linear infinite',
                      }} />
                      Scanning…
                    </>
                  ) : (
                    <><IconBolt /> Scrape This Page</>
                  )}
                </button>
              </div>

              {/* 2-column action grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  className="lift-btn"
                  onClick={() => setView('selectors')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 10px', borderRadius: 8,
                    border: '1px solid rgba(99,102,241,0.22)', background: 'rgba(99,102,241,0.05)',
                    color: '#4f46e5', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em',
                  }}
                >
                  <IconTarget /> Selectors
                </button>
                <button
                  className="lift-btn"
                  onClick={() => setView('batch')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 10px', borderRadius: 8,
                    border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(241,245,249,0.9)',
                    color: '#475569', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em',
                  }}
                >
                  <IconLayers /> Batch Scrape
                </button>
              </div>

              {/* Export — only when data exists */}
              {data && (
                <button
                  className="lift-btn"
                  onClick={() => setView('export')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8,
                    border: '1px solid rgba(245,158,11,0.28)',
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.07) 0%, rgba(251,191,36,0.07) 100%)',
                    color: '#92400e', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em',
                    boxShadow: '0 1px 4px rgba(245,158,11,0.1)',
                  }}
                >
                  <IconDownload /> Export Results
                </button>
              )}

              {/* Status readout */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(248,250,255,0.95)', border: '1px solid rgba(203,213,225,0.55)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PulseDot status={status} />
                  <span style={{
                    fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: '0.02em',
                    color: status === 'error' ? '#dc2626' : status === 'success' ? '#15803d' : '#64748b',
                  }}>
                    {statusLabel}
                  </span>
                </div>
                <span style={{
                  fontSize: 9, color: '#cbd5e1',
                  fontFamily: "'Courier New', monospace", letterSpacing: '0.04em',
                }}>
                  v1.0
                </span>
              </div>

            </div>
          )}

          {/* PREVIEW VIEW */}
          {view === 'preview' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4">
                <Preview data={data} onChange={setData} />
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setView('main')}>← Back</button>
                <button className="btn-accent flex-1 text-sm" onClick={() => setView('export')}>Export ↓</button>
              </div>
            </div>
          )}

          {/* EXPORT VIEW */}
          {view === 'export' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4">
                <ExportButtons data={data} />
              </div>
              <button className="btn-secondary w-full text-sm" onClick={() => setView('preview')}>
                ← Back to Preview
              </button>
            </div>
          )}

          {/* SELECTORS VIEW */}
          {view === 'selectors' && (
            <div className="space-y-4">
              <CleanModeToggle checked={cleanMode} onChange={setCleanMode} />
              <div className="card-luxe p-4 space-y-3">
                <h2 className="text-sm font-semibold text-secondary-700">Custom CSS Selectors</h2>
                <p className="text-xs text-secondary-500">
                  Define field names and CSS selectors, or use the element picker.
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectorRows.map((row, idx) => (
                    <div key={idx} className="flex gap-1 items-center">
                      <input
                        className="input-base text-xs py-1.5 w-24 shrink-0"
                        placeholder="field"
                        value={row.field}
                        onChange={e => setSelectorRows(p => p.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
                      />
                      <input
                        className="input-base text-xs py-1.5 flex-1 min-w-0"
                        placeholder="selector"
                        value={row.selector}
                        onChange={e => setSelectorRows(p => p.map((r, i) => i === idx ? { ...r, selector: e.target.value } : r))}
                      />
                      <button
                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                          pickerTargetIdx === idx ? 'bg-accent-500 text-accent-950' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                        title="Pick element"
                        onClick={() => handleActivatePicker(idx)}
                      >🎯</button>
                      <button
                        className="text-danger-400 hover:text-danger-600 text-xs px-1 shrink-0"
                        onClick={() => setSelectorRows(p => p.filter((_, i) => i !== idx))}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary w-full text-xs"
                  onClick={() => setSelectorRows(p => [...p, { field: '', selector: '' }])}>
                  + Add Field
                </button>
                <button className="btn-primary w-full text-sm" onClick={handleCustomScrape}
                  disabled={status === 'loading'}>
                  {status === 'loading' ? 'Scraping…' : '⚡ Scrape with Selectors'}
                </button>
                <button className="btn-accent w-full text-sm" onClick={saveCurrentRule}
                  disabled={status === 'loading'}>
                  💾 Save Rule for Domain
                </button>
              </div>
              <button className="btn-secondary w-full text-sm" onClick={() => setView('main')}>← Back</button>
            </div>
          )}

          {/* BATCH VIEW */}
          {view === 'batch' && (
            <div className="space-y-4">
              <CleanModeToggle checked={cleanMode} onChange={setCleanMode} />
              <div className="card-luxe p-4 space-y-3">
                <h2 className="text-sm font-semibold text-secondary-700">Batch URL Scraper</h2>
                <p className="text-xs text-secondary-500">Enter one URL per line to scrape multiple pages.</p>
                <textarea
                  className="input-base text-xs py-2 h-32 resize-none"
                  placeholder={"https://example.com/page1\nhttps://example.com/page2"}
                  value={batchUrls}
                  onChange={e => setBatchUrls(e.target.value)}
                />
                {batchProgress && (
                  <div className="text-center py-2">
                    <p className="text-xs text-secondary-600">
                      Processing {batchProgress.current} of {batchProgress.total} URLs…
                    </p>
                    <div className="w-full bg-secondary-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <button className="btn-primary w-full text-sm" onClick={handleBatchScrape}
                  disabled={status === 'loading' || !batchUrls.trim()}>
                  {status === 'loading' ? 'Scraping…' : '🚀 Start Batch Scrape'}
                </button>
              </div>
              <button className="btn-secondary w-full text-sm" onClick={() => setView('main')}>← Back</button>
            </div>
          )}

          {/* BATCH RESULTS VIEW */}
          {view === 'batch-results' && (
            <div className="space-y-4">
              <div className="card-luxe p-4">
                <h2 className="text-sm font-semibold text-secondary-700 mb-1">Batch Results</h2>
                <p className="text-xs text-secondary-500 mb-3">
                  Scraped {batchResults.length} page{batchResults.length !== 1 ? 's' : ''} successfully.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {batchResults.map((result, idx) => (
                    <div key={idx} className="card p-3">
                      <p className="text-xs font-medium text-secondary-800 truncate">
                        {result.title || `Page ${idx + 1}`}
                      </p>
                      <p className="text-xs text-secondary-500 truncate">{result.url}</p>
                      <div className="flex gap-2 mt-1 text-xs text-secondary-400">
                        <span>{result.headings.length} headings</span>
                        <span>{result.paragraphs.length} paragraphs</span>
                        <span>{result.links.length} links</span>
                      </div>
                    </div>
                  ))}
                </div>
                {batchResults.length > 0 && (
                  <button
                    className="btn-accent w-full text-sm mt-3"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(batchResults, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = 'batch-scrape-results.json';
                      a.click();
                    }}
                  >
                    ↓ Export All (JSON)
                  </button>
                )}
              </div>
              <button className="btn-secondary w-full text-sm" onClick={() => setView('batch')}>
                ← Back to Batch
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}