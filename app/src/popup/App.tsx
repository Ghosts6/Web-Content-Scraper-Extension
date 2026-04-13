import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { ExtractedContent, CustomSelectors } from '../scraper/extractor';
import { Preview } from './components/Preview';
import { ExportButtons } from './components/ExportButtons';
import { MainView } from './components/MainView';
import { SelectorsView } from './components/SelectorsView';
import { RulesView } from './components/RulesView';
import { BatchView } from './components/BatchView';
import { BatchResultsView } from './components/BatchResultsView';
import { SettingsView } from './components/SettingsView';
import { SplashScreen } from './components/SplashScreen';
import {
  saveRule, getRuleForDomain, getAllRules, deleteRule,
  getPreferences, savePreferences,
} from '../storage/rules';
import type { SiteRule } from '../storage/rules';
import { toXML, toMarkdown, toPlainText, getMimeType, getFileExtension } from '../scraper/formatter';
import type { ExportFormat } from '../scraper/formatter';
import type { BatchScrapeResult } from '../scraper/batch-scraper';

type View = 'main' | 'preview' | 'export' | 'selectors' | 'rules' | 'batch' | 'batch-results' | 'settings';
type Status = 'idle' | 'loading' | 'success' | 'error';

// Batch export helpers

const INDIGO_GRAD = 'linear-gradient(90deg, #3730a3 0%, #6366f1 60%, #d97706 100%)';
const MAIN_DIVIDER = 'linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(245,158,11,0.2) 55%, transparent 100%)';

function formatBatchResults(results: ExtractedContent[], fmt: ExportFormat): string {
  if (fmt === 'json') return JSON.stringify(results, null, 2);
  if (fmt === 'xml') {
    const pages = results.map(r => toXML(r)).join('\n\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<pages count="${results.length}">\n${pages}\n</pages>`;
  }
  if (fmt === 'markdown') {
    return results.map((r, i) => `<!-- Page ${i + 1} -->\n\n${toMarkdown(r)}`).join('\n\n---\n\n');
  }
  return results.map((r, i) =>
    `${'='.repeat(60)}\nPAGE ${i + 1}\n${'='.repeat(60)}\n\n${toPlainText(r)}`
  ).join('\n\n');
}

const EXPORT_FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'MD', value: 'markdown' },
  { label: 'TXT', value: 'text' },
];

const ACCENT_STRIPS = [
  'linear-gradient(180deg, #6366f1, #818cf8)',
  'linear-gradient(180deg, #0891b2, #06b6d4)',
  'linear-gradient(180deg, #d97706, #f59e0b)',
];

// App

export default function App() {
  const [view, setView]           = useState<View>('main');
  const [data, setData]           = useState<ExtractedContent | null>(null);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [cleanMode, setCleanMode] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(false);

  const [selectorRows, setSelectorRows] = useState<{ field: string; selector: string }[]>([
    { field: 'title', selector: '' },
  ]);

  const [batchUrls, setBatchUrls]         = useState('');
  const [batchResults, setBatchResults]   = useState<ExtractedContent[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchExportFormat, setBatchExportFormat] = useState<ExportFormat>('json');
  const [hasBatchPermission, setHasBatchPermission] = useState(false);

  const [savedRules, setSavedRules] = useState<SiteRule[]>([]);

  useEffect(() => {
    const init = async () => {
      console.debug('[App] Initializing popup...');
      
      // Check for batch permissions
      try {
        const hasPerm = await browser.permissions.contains({ origins: ['<all_urls>'] });
        setHasBatchPermission(hasPerm);
      } catch (e) { console.warn('Permission check failed:', e); }

      // Fast check for splash screen (use sessionStorage for immediate access)
      const splashShown = sessionStorage.getItem('wcs_splash_shown') === 'true';
      if (!splashShown) {
        setShowSplash(true);
      }

      try {
        await loadStoredPreferences();
        const hasRule = await loadDomainRules();
        
        // Try to restore draft rows and picker target (use localStorage for immediate access)
        const draftRowsStr = localStorage.getItem('draftRows');
        const pickerTargetIdxStr = localStorage.getItem('pickerTargetIdx');
        const stored = {
          draftRows: draftRowsStr ? JSON.parse(draftRowsStr) : null,
          pickerTargetIdx: pickerTargetIdxStr ? parseInt(pickerTargetIdxStr) : null,
        };
        console.debug('[App] Stored state:', stored);

        if (stored.draftRows && (stored.pickerTargetIdx !== null || !hasRule)) {
          setSelectorRows(stored.draftRows);
        }

        if (typeof stored.pickerTargetIdx === 'number') {
          setPickerTargetIdx(stored.pickerTargetIdx);
        }

        await checkPickedSelector();
      } catch (e) {
        console.error('[App] Init error:', e);
        // Continue anyway to avoid popup crash
      }
    };
    init();

    const handleStorageChange = (changes: Record<string, any>, areaName: string) => {
      if (areaName === 'local') {
        if (changes.pickedSelector || changes.pickedIdx || changes.pickerTargetIdx) {
          checkPickedSelector();
        }
      }
    };
    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleRequestPermission = async () => {
    try {
      const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
      setHasBatchPermission(granted);
      if (granted) {
        setStatus('success');
        setErrorMsg('Permission granted! You can now start batch scraping.');
        setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 2000);
      }
    } catch (e) {
      console.error('Permission request error:', e);
      setStatus('error');
      setErrorMsg('Failed to request permission');
    }
  };

  const handleSplashComplete = async () => {
    sessionStorage.setItem('wcs_splash_shown', 'true');
    setShowSplash(false);
  };

  // Check for picked selector from background storage
  async function checkPickedSelector() {
    try {
      const stored = await browser.storage.local.get(['pickedSelector', 'pickedIdx', 'pickerTargetIdx']);
      console.debug('[App] checkPickedSelector', stored);

      if (stored.pickedSelector && typeof stored.pickedIdx === 'number') {
        const idx = stored.pickedIdx;
        const selector = stored.pickedSelector;
        
        console.debug(`[App] Applying picked selector "${selector}" to index ${idx}`);
        
        setSelectorRows(prev => {
          const newRows = [...prev];
          if (newRows[idx]) {
            newRows[idx] = { ...newRows[idx], selector: selector };
          }
          localStorage.setItem('draftRows', JSON.stringify(newRows));
          return newRows;
        });

        setPickerTargetIdx(null);
        
        // Clear storage only after we've applied it to state
        await browser.storage.local.remove(['pickedSelector', 'pickedIdx']);
        
        // Provide visual feedback
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      } else if (stored.pickerTargetIdx === undefined && pickerTargetIdx !== null) {
        console.debug('[App] Picker was deactivated remotely');
        setPickerTargetIdx(null);
      }
    } catch (e) { 
      console.warn('Failed to check picked selector:', e); 
    }
  }

  // Preferences

  async function loadStoredPreferences() {
    try {
      const prefs = await getPreferences();
      setCleanMode(prefs.cleanMode);
    } catch (e) { console.warn('Failed to load preferences:', e); }
  }

  async function handleCleanModeChange(value: boolean) {
    setCleanMode(value);
    try { await savePreferences({ cleanMode: value }); } catch { /* non-critical */ }
  }

  // Domain rules

  async function loadDomainRules(): Promise<boolean> {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        const rule = await getRuleForDomain(url.hostname);
        if (rule) {
          const rows = Object.entries(rule.selectors).map(([field, selector]) => ({ field, selector }));
          if (rows.length > 0) {
            setSelectorRows(rows);
            return true;
          }
        }
      }
    } catch (e) { console.warn('Failed to load domain rules:', e); }
    return false;
  }

  async function loadSavedRules() {
    try {
      const rules = await getAllRules();
      setSavedRules(rules);
    } catch (e) { console.warn('Failed to load saved rules:', e); }
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
      if (Object.keys(selectors).length === 0) {
        setStatus('error');
        setErrorMsg('Please select at least one element before saving');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }
      await saveRule({ domain: url.hostname, selectors });
      // Clear draft since we've saved a real rule
      localStorage.removeItem('draftRows');
      setStatus('success');
      setErrorMsg('Rule saved! You can reuse these selectors for this domain');
      
      // Force status update to show success message clearly
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setErrorMsg('Failed to save rule');
    }
  }

  async function handleDeleteRule(domain: string) {
    try {
      await deleteRule(domain);
      setSavedRules(prev => prev.filter(r => r.domain !== domain));
    } catch {
      setStatus('error');
      setErrorMsg('Failed to delete rule');
    }
  }

  async function handleViewRules() {
    await loadSavedRules();
    setView('rules');
  }

  // Scraping 

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
    if (Object.keys(selectors).length === 0) {
      setStatus('error');
      setErrorMsg('Please select at least one element using the selector tool');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const response = await browser.runtime.sendMessage({
        action: 'scrapeWithSelectors', selectors, cleanMode,
      }) as { success: true; data: any } | { success: false; error: string };
      
      if (!response.success) throw new Error(response.error);
      
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      
      // Wrap custom result into ExtractedContent structure
      const wrappedData: ExtractedContent = {
        url: tab?.url || '',
        title: tab?.title || 'Custom Scrape',
        metadata: {},
        headings: [],
        paragraphs: [],
        lists: [],
        links: [],
        images: [],
        custom: response.data
      };
      
      setData(wrappedData); 
      setStatus('success'); 
      setView('preview');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Scrape failed');
    }
  }

  // Batch: onUpdated with 30s timeout per URL
  async function handleBatchScrape() {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return;

    if (!hasBatchPermission) {
      try {
        const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
        setHasBatchPermission(granted);
        if (!granted) {
          setStatus('error');
          setErrorMsg('Batch scraping requires website access permissions.');
          return;
        }
      } catch (e) {
        setStatus('error');
        setErrorMsg('Failed to request permission');
        return;
      }
    }

    setStatus('loading');
    setBatchResults([]);
    setBatchProgress({ current: 0, total: urls.length });

    try {
      // Get user preferences for batch settings
      const prefsResponse = await browser.runtime.sendMessage({ action: 'get-preferences' });
      if (!prefsResponse.success) {
        throw new Error('Failed to load preferences');
      }

      const prefs = prefsResponse.data;

      // Use smart batch scrape which applies site-specific rules
      const response = await browser.runtime.sendMessage({
        action: 'smart-batch-scrape',
        request: {
          urls,
          cleanMode,
          noiseSelectors: prefs.noiseSelectors,
          timeout: prefs.batchTimeout,
          maxRetries: prefs.batchMaxRetries,
          concurrency: prefs.batchConcurrency,
        }
      });

      if (response.success) {
        // Filter successful results
        const rawResults = response.data as BatchScrapeResult[];
        const successfulResults: ExtractedContent[] = rawResults
          .filter(result => result.success && result.data)
          .map(result => result.data as ExtractedContent);

        setBatchResults(successfulResults);
        setStatus('success');
        setView('batch-results');
      } else {
        throw new Error(response.error || 'Batch scraping failed');
      }
    } catch (error) {
      console.error('Batch scraping error:', error);
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : 'Batch scraping failed');
    } finally {
      setBatchProgress(null);
    }
  }

  async function handleActivatePicker(idx: number) {
    console.debug(`[App] Activating picker for index ${idx}`);
    setPickerTargetIdx(idx);
    
    // Ensure state is clean before starting
    await browser.storage.local.remove(['pickedSelector', 'pickedIdx']);
    await browser.storage.local.set({ 
      pickerTargetIdx: idx,
    });
    localStorage.setItem('draftRows', JSON.stringify(selectorRows));
    
    await browser.runtime.sendMessage({ action: 'activatePicker' });
  }

  function downloadBatchResults() {
    const content = formatBatchResults(batchResults, batchExportFormat);
    const ext  = getFileExtension(batchExportFormat);
    const mime = getMimeType(batchExportFormat);
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `batch-scrape-results.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const statusLabel = {
    idle:    'Ready to scrape',
    loading: 'Scanning page…',
    success: data?.title ? `✓ ${data.title.slice(0, 26)}${data.title.length > 26 ? '…' : ''}` : '✓ Done',
    error:   'Error — try again',
  }[status];

  return (
    <>
      <div className="app-root"
        style={{
          width: '420px',
          minWidth: '360px',
          maxWidth: '420px',
          height: '387px',
          minHeight: '387px',
          maxHeight: '387px',
          background: 'rgb(248, 250, 255)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>

        {/* Background atmosphere */}
        <div style={{ position: 'absolute', width: 280, height: 200, top: -70, left: -70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 220, height: 200, bottom: -50, right: -50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.028) 1px, transparent 1px)`, backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '14px 14px 16px', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>

          {/*  HEADER  */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'conic-gradient(from 0deg, #4f46e5, #818cf8, #f59e0b, #4f46e5)', padding: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src="icons/icon48x48.png" alt="" style={{ width: 19, height: 19, objectFit: 'contain' }} />
                  </div>
                </div>
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', border: '2px solid #f8faff', boxShadow: '0 0 5px rgba(245,158,11,0.65)' }} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em', margin: 0, lineHeight: 1.25, background: 'linear-gradient(90deg, #3730a3 0%, #6366f1 55%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Web Content Scraper
                </h1>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0', letterSpacing: '0.01em' }}>
                  Extract structured content from any page
                </p>
              </div>
            </div>
            {data && view !== 'preview' && (
              <button className="lift-btn" onClick={() => setView('preview')} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.28)', background: 'rgba(99,102,241,0.07)', color: '#6366f1', cursor: 'pointer', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                Preview →
              </button>
            )}
          </div>
          <div style={{ height: 1, marginBottom: 14, background: MAIN_DIVIDER }} />

          {/* Error bar */}
          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 12, fontSize: 11, color: '#dc2626' }}>
              <span>⚠</span> {errorMsg}
            </div>
          )}

          {/* Success bar */}
          {status === 'success' && errorMsg && view !== 'preview' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(190,242,100,0.1)', border: '1px solid rgba(132,204,22,0.3)', marginBottom: 12, fontSize: 11, color: '#4d7c0f' }}>
              <span style={{ fontSize: 14 }}>✓</span> {errorMsg}
            </div>
          )}

          {/*  MAIN  */}
          {view === 'main' && (
            <MainView
              data={data}
              status={status}
              cleanMode={cleanMode}
              onCleanModeChange={handleCleanModeChange}
              onScrape={handleScrape}
              onViewSelectors={() => setView('selectors')}
              onViewBatch={() => setView('batch')}
              onViewSettings={() => setView('settings')}
              onViewPreview={() => setView('preview')}
              onViewExport={() => setView('export')}
            />
          )}

          {/*  PREVIEW  */}
          {view === 'preview' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4"><Preview data={data} onChange={setData} /></div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setView('main')}>← Back</button>
                <button className="btn-accent flex-1 text-sm" onClick={() => setView('export')}>Export ↓</button>
              </div>
            </div>
          )}

          {/*  EXPORT  */}
          {view === 'export' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4"><ExportButtons data={data} /></div>
              <button className="btn-secondary w-full text-sm" onClick={() => setView('preview')}>← Back to Preview</button>
            </div>
          )}

          {/*  SELECTORS  */}
          {view === 'selectors' && (
            <SelectorsView
              cleanMode={cleanMode}
              onCleanModeChange={handleCleanModeChange}
              selectorRows={selectorRows}
              onSelectorRowsChange={(rows) => {
                setSelectorRows(rows);
                browser.storage.local.set({ draftRows: rows });
              }}
              pickerTargetIdx={pickerTargetIdx}
              onActivatePicker={handleActivatePicker}
              onCustomScrape={handleCustomScrape}
              onSaveRule={saveCurrentRule}
              onViewRules={() => { loadSavedRules(); setView('rules'); }}
              onBack={() => setView('main')}
              status={status}
            />
          )}

          {/*  RULES  */}
          {view === 'rules' && (
            <RulesView
              savedRules={savedRules}
              onDeleteRule={handleDeleteRule}
              onOpenSelectors={() => setView('selectors')}
              onBack={() => setView('selectors')}
            />
          )}

          {/*  BATCH  */}
          {view === 'batch' && (
            <BatchView
              cleanMode={cleanMode}
              onCleanModeChange={handleCleanModeChange}
              batchUrls={batchUrls}
              onBatchUrlsChange={setBatchUrls}
              batchProgress={batchProgress}
              onBatchScrape={handleBatchScrape}
              onBack={() => setView('main')}
              status={status}
              hasPermission={hasBatchPermission}
              onRequestPermission={handleRequestPermission}
            />
          )}

          {/*  BATCH RESULTS  */}
          {view === 'batch-results' && (
            <BatchResultsView
              batchResults={batchResults}
              batchExportFormat={batchExportFormat}
              onBatchExportFormatChange={setBatchExportFormat}
              onDownloadBatchResults={downloadBatchResults}
              onBack={() => setView('batch')}
            />
          )}

          {/*  SETTINGS  */}
          {view === 'settings' && (
            <SettingsView onBack={() => setView('main')} />
          )}

        </div>
      </div>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}