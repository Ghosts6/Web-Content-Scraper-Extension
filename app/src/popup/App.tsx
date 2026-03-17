import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { ExtractedContent, CustomSelectors } from '../scraper/extractor';
import { Preview } from './components/Preview';
import { ExportButtons } from './components/ExportButtons';
import { CleanModeToggle } from './components/CleanModeToggle';
import { saveRule, getRuleForDomain } from '../storage/rules';

type View = 'main' | 'preview' | 'export' | 'selectors' | 'batch' | 'batch-results';

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

  // Clean mode toggle
  const [cleanMode, setCleanMode] = useState(false);

  // Batch scraping state
  const [batchUrls, setBatchUrls] = useState<string>('');
  const [batchResults, setBatchResults] = useState<ExtractedContent[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Load existing rules for current domain on mount
  useEffect(() => {
    loadDomainRules();
  }, []);

  async function loadDomainRules() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        const rule = await getRuleForDomain(url.hostname);
        if (rule) {
          const rows = Object.entries(rule.selectors).map(([field, selector]) => ({
            field,
            selector,
          }));
          if (rows.length > 0) {
            setSelectorRows(rows);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load domain rules:', e);
    }
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

      await saveRule({
        domain: url.hostname,
        selectors,
      });

      // Show success feedback
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      setStatus('error');
      setErrorMsg('Failed to save rule');
    }
  }

  async function handleBatchScrape() {
    // Request broad host access only when the user explicitly starts batch scraping
    const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
    if (!granted) {
      setStatus('error');
      setErrorMsg('Host permission required for batch scraping');
      return;
    }
    const urls = batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));

    if (urls.length === 0) return;

    setStatus('loading');
    setBatchResults([]);
    setBatchProgress({ current: 0, total: urls.length });

    const results: ExtractedContent[] = [];

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setBatchProgress({ current: i + 1, total: urls.length });

        try {
          // Open the URL in a new tab and wait for it to load
          const tab = await browser.tabs.create({ url: urls[i], active: false });
          await new Promise<void>((resolve) => {
            function listener(tabId: number, info: { status?: string }) {
              if (tabId === tab.id && info.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            }
            browser.tabs.onUpdated.addListener(listener);
          });
          
          // Scrape the content
          const response = await browser.tabs.sendMessage(tab.id!, { 
            action: 'scrape', 
            cleanMode 
          }) as { success: true; data: ExtractedContent } | { success: false; error: string };

          if (response.success) {
            results.push(response.data);
          }

          // Close the tab
          await browser.tabs.remove(tab.id!);
        } catch (e) {
          console.warn(`Failed to scrape ${url}:`, e);
        }
      }

      setBatchResults(results);
      setStatus('success');
      setView('batch-results');
    } catch (e) {
      setStatus('error');
      setErrorMsg('Batch scraping failed');
    } finally {
      setBatchProgress(null);
    }
  }

  async function handleScrape() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const response = await browser.runtime.sendMessage({ action: 'scrape', cleanMode }) as
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
        cleanMode,
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

  const statusColor = status === 'success' ? 'success' : status === 'error' ? 'danger' : 'warning';
  const statusDot   = status === 'success' ? 'bg-success-500' : status === 'error' ? 'bg-danger-500' : 'bg-warning-400';
  const statusText  = {
    idle:    'Ready to scrape',
    loading: 'Scraping…',
    success: `Scraped: ${data?.title || 'page'}`,
    error:   'Error: try again',
  }[status];

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
          {/* Clean Mode Toggle */}
          <CleanModeToggle checked={cleanMode} onChange={setCleanMode} />

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

          <div className="card p-4">
            <button
              className="btn-secondary w-full text-sm"
              onClick={() => setView('batch')}
            >
              📄 Batch Scrape
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
            <div className={`status-${statusColor}`}>
              <div
                className={`w-2.5 h-2.5 rounded-full ${statusDot}`}
              />
              <span className="text-xs font-medium">
                {statusText}
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
          {/* Clean Mode Toggle */}
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
            <button
              className="btn-accent w-full text-sm"
              onClick={saveCurrentRule}
              disabled={status === 'loading'}
            >
              💾 Save Rule for Domain
            </button>
          </div>

          <button className="btn-secondary w-full text-sm" onClick={() => setView('main')}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Batch Scrape View ── */}
      {view === 'batch' && (
        <div className="space-y-4">
          {/* Clean Mode Toggle */}
          <CleanModeToggle checked={cleanMode} onChange={setCleanMode} />

          <div className="card-luxe p-4 space-y-3">
            <h2 className="text-sm font-semibold text-secondary-700">Batch URL Scraper</h2>
            <p className="text-xs text-secondary-500">
              Enter one URL per line to scrape multiple pages automatically.
            </p>

            <textarea
              className="input-base text-xs py-2 h-32 resize-none"
              placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
            />

            {batchProgress && (
              <div className="text-center py-2">
                <p className="text-xs text-secondary-600">
                  Processing {batchProgress.current} of {batchProgress.total} URLs...
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full text-sm"
              onClick={handleBatchScrape}
              disabled={status === 'loading' || !batchUrls.trim()}
            >
              {status === 'loading' ? 'Scraping…' : '🚀 Start Batch Scrape'}
            </button>
          </div>

          <button className="btn-secondary w-full text-sm" onClick={() => setView('main')}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Batch Results View ── */}
      {view === 'batch-results' && (
        <div className="space-y-4">
          <div className="card-luxe p-4">
            <h2 className="text-sm font-semibold text-secondary-700">Batch Results</h2>
            <p className="text-xs text-secondary-500">
              Scraped {batchResults.length} pages successfully.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mt-3">
              {batchResults.map((result, idx) => (
                <div key={idx} className="card p-3">
                  <p className="text-xs font-medium text-secondary-800 truncate">
                    {result.title || `Page ${idx + 1}`}
                  </p>
                  <p className="text-xs text-secondary-500 truncate">{result.url}</p>
                  <div className="flex gap-2 mt-2 text-xs text-secondary-400">
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
                  // Export all results as JSON
                  const content = JSON.stringify(batchResults, null, 2);
                  const blob = new Blob([content], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'batch-scrape-results.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                ↓ Export All Results (JSON)
              </button>
            )}
          </div>

          <button className="btn-secondary w-full text-sm" onClick={() => setView('batch')}>
            ← Back to Batch
          </button>
        </div>
      )}
    </div>
  );
}