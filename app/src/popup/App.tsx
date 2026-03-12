import { useState } from 'react';
import browser from 'webextension-polyfill';
import type { ExtractedContent, CustomSelectors } from '../scraper/extractor';
import { Preview } from './components/Preview';
import { ExportButtons } from './components/ExportButtons';

type View = 'main' | 'preview' | 'export' | 'selectors';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [view, setView] = useState<View>('main');
  const [data, setData] = useState<ExtractedContent | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Custom selector state
  const [selectorRows, setSelectorRows] = useState<{ field: string; selector: string }[]>([
    { field: 'title', selector: '' },
  ]);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);

  async function handleScrape() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const response = await browser.runtime.sendMessage({ action: 'scrape' }) as
        | { success: true; data: ExtractedContent }
        | { success: false; error: string };

      if (!response.success) throw new Error((response as { success: false; error: string }).error);

      setData(response.data);
      setStatus('success');
      setView('preview');
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
        action: 'scrapeWithSelectors',
        selectors,
      }) as { success: true; data: ExtractedContent } | { success: false; error: string };

      if (!response.success) throw new Error((response as { success: false; error: string }).error);

      setData(response.data);
      setStatus('success');
      setView('preview');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Scrape failed');
    }
  }

  async function handleActivatePicker(idx: number) {
    setPickerTargetIdx(idx);
    await browser.runtime.sendMessage({ action: 'activatePicker' });
    // Listen for selector returned by picker
    const handler = (msg: unknown) => {
      const m = msg as { action: string; selector?: string };
      if (m.action === 'pickerSelector' && m.selector) {
        setSelectorRows((prev) =>
          prev.map((row, i) => (i === idx ? { ...row, selector: m.selector! } : row))
        );
        setPickerTargetIdx(null);
        browser.runtime.onMessage.removeListener(handler);
      }
    };
    browser.runtime.onMessage.addListener(handler);
  }

  function addSelectorRow() {
    setSelectorRows((prev) => [...prev, { field: '', selector: '' }]);
  }

  function removeSelectorRow(idx: number) {
    setSelectorRows((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="gradient-primary-subtle min-h-screen p-4" style={{ minWidth: 360, maxWidth: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-primary-600 leading-tight">
            Web Content Scraper
          </h1>
          <p className="text-xs text-secondary-400">Extract structured content from any page</p>
        </div>
        {data && (
          <button
            onClick={() => setView(view === 'preview' ? 'main' : 'preview')}
            className="badge-primary text-xs cursor-pointer"
          >
            Preview
          </button>
        )}
      </div>

      {/* Status bar */}
      {status === 'error' && (
        <div className="card p-3 mb-4 border-danger-200 bg-danger-50">
          <p className="text-xs text-danger-600">⚠ {errorMsg}</p>
        </div>
      )}

      {/* ── Main View ── */}
      {view === 'main' && (
        <div className="space-y-4">
          <div className="card-luxe p-5 space-y-3">
            <h2 className="text-sm font-semibold text-secondary-700">Quick Scrape</h2>
            <p className="text-xs text-secondary-500">
              Automatically extract titles, headings, paragraphs, links, images and metadata.
            </p>
            <button
              className="btn-primary w-full"
              onClick={handleScrape}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Scraping…' : '⚡ Scrape Page'}
            </button>
          </div>

          <div className="card p-4">
            <button
              className="btn-secondary w-full text-sm"
              onClick={() => setView('selectors')}
            >
              🎯 Custom Selectors
            </button>
          </div>

          {data && (
            <div className="card p-4 space-y-2">
              <button className="btn-accent w-full text-sm" onClick={() => setView('export')}>
                ↓ Export Results
              </button>
            </div>
          )}

          {/* Status indicator */}
          <div className="card p-3">
            <div className={`status-${status === 'success' ? 'success' : status === 'error' ? 'danger' : 'warning'}`}>
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'success'
                    ? 'bg-success-500'
                    : status === 'error'
                    ? 'bg-danger-500'
                    : 'bg-warning-400'
                }`}
              />
              <span className="text-xs font-medium">
                {status === 'idle' && 'Ready to scrape'}
                {status === 'loading' && 'Scraping…'}
                {status === 'success' && `Scraped: ${data?.title || 'page'}`}
                {status === 'error' && 'Error — try again'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview View ── */}
      {view === 'preview' && data && (
        <div className="space-y-4">
          <div className="card-luxe p-4">
            <Preview data={data} onChange={setData} />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-sm" onClick={() => setView('main')}>
              ← Back
            </button>
            <button className="btn-accent flex-1 text-sm" onClick={() => setView('export')}>
              Export ↓
            </button>
          </div>
        </div>
      )}

      {/* ── Export View ── */}
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

      {/* ── Custom Selectors View ── */}
      {view === 'selectors' && (
        <div className="space-y-4">
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
                    onChange={(e) =>
                      setSelectorRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, field: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    className="input-base text-xs py-1.5 flex-1 min-w-0"
                    placeholder="selector"
                    value={row.selector}
                    onChange={(e) =>
                      setSelectorRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, selector: e.target.value } : r))
                      )
                    }
                  />
                  <button
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                      pickerTargetIdx === idx
                        ? 'bg-accent-500 text-accent-950'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                    title="Pick element"
                    onClick={() => handleActivatePicker(idx)}
                  >
                    🎯
                  </button>
                  <button
                    className="text-danger-400 hover:text-danger-600 text-xs px-1 shrink-0"
                    onClick={() => removeSelectorRow(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-secondary w-full text-xs" onClick={addSelectorRow}>
              + Add Field
            </button>
            <button
              className="btn-primary w-full text-sm"
              onClick={handleCustomScrape}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Scraping…' : '⚡ Scrape with Selectors'}
            </button>
          </div>

          <button className="btn-secondary w-full text-sm" onClick={() => setView('main')}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}