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

export type View = 'main' | 'preview' | 'export' | 'selectors' | 'rules' | 'batch' | 'batch-results' | 'settings';
export type Status = 'idle' | 'loading' | 'success' | 'error';

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

export default function App() {
  const [view, setView]           = useState<View>('main');
  const [data, setData]           = useState<ExtractedContent | null>(null);
  const [status, setStatus]       = useState<Status>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [cleanMode, setCleanMode] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [hasBatchPermission, setHasBatchPermission] = useState(false);

  const [selectorRows, setSelectorRows] = useState<{ field: string; selector: string }[]>([
    { field: 'title', selector: '' },
  ]);

  const [batchUrls, setBatchUrls]         = useState('');
  const [batchResults, setBatchResults]   = useState<ExtractedContent[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchExportFormat, setBatchExportFormat] = useState<ExportFormat>('json');

  const [savedRules, setSavedRules] = useState<SiteRule[]>([]);

  useEffect(() => {
    const init = async () => {
      const splashShown = sessionStorage.getItem('wcs_splash_shown') === 'true';
      if (!splashShown) {
        setShowSplash(true);
      }

      try {
        await loadStoredPreferences();
        const hasRule = await loadDomainRules();
        
        try {
          const hasPerm = await browser.permissions.contains({ origins: ['<all_urls>'] });
          setHasBatchPermission(hasPerm);
        } catch (e) { 
          console.warn('Permission check failed:', e); 
        }

        const draftRowsStr = localStorage.getItem('draftRows');
        const pickerTargetIdxStr = localStorage.getItem('pickerTargetIdx');
        const stored = {
          draftRows: draftRowsStr ? JSON.parse(draftRowsStr) : null,
          pickerTargetIdx: pickerTargetIdxStr ? parseInt(pickerTargetIdxStr) : null,
        };

        if (stored.draftRows && (stored.pickerTargetIdx !== null || !hasRule)) {
          setSelectorRows(stored.draftRows);
        }

        if (typeof stored.pickerTargetIdx === 'number') {
          setPickerTargetIdx(stored.pickerTargetIdx);
        }

        await checkPickedSelector();
      } catch (e) {
        console.error('[App] Init error:', e);
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

  const handleSplashComplete = async () => {
    sessionStorage.setItem('wcs_splash_shown', 'true');
    setShowSplash(false);
  };

  async function checkPickedSelector() {
    try {
      const stored = await browser.storage.local.get(['pickedSelector', 'pickedIdx', 'pickerTargetIdx']);
      if (stored.pickedSelector && typeof stored.pickedIdx === 'number') {
        const idx = stored.pickedIdx;
        const selector = stored.pickedSelector;
        setSelectorRows(prev => {
          const newRows = [...prev];
          if (newRows[idx]) {
            newRows[idx] = { ...newRows[idx], selector: selector };
          }
          localStorage.setItem('draftRows', JSON.stringify(newRows));
          return newRows;
        });
        setPickerTargetIdx(null);
        await browser.storage.local.remove(['pickedSelector', 'pickedIdx']);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      } else if (stored.pickerTargetIdx === undefined && pickerTargetIdx !== null) {
        setPickerTargetIdx(null);
      }
    } catch (e) { 
      console.warn('Failed to check picked selector:', e); 
    }
  }

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
      localStorage.removeItem('draftRows');
      setStatus('success');
      setErrorMsg('Rule saved!');
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

  async function handleRequestPermission() {
    try {
      const granted = await browser.permissions.request({
        origins: ['<all_urls>']
      });
      setHasBatchPermission(granted);
      if (granted) {
        setStatus('success');
        setErrorMsg('✓ Website access granted!');
        setTimeout(() => {
          setStatus('idle');
          setErrorMsg('');
        }, 3000);
      }
    } catch (e) {
      console.error('Permission request failed:', e);
      setStatus('error');
      setErrorMsg('Failed to request permission.');
    }
  }

  async function handleScrape() {
    setStatus('loading'); setErrorMsg(''); setErrorCode(null);
    try {
      const response = await browser.runtime.sendMessage({ action: 'scrape', cleanMode }) as
        | { success: true; data: ExtractedContent }
        | { success: false; error: string; errorCode?: string };
      if (!response.success) {
        if (response.errorCode) setErrorCode(response.errorCode);
        throw new Error(response.error);
      }
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
      setErrorMsg('Please select at least one element');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    setErrorCode(null);
    try {
      const response = await browser.runtime.sendMessage({
        action: 'scrapeWithSelectors', selectors, cleanMode,
      }) as { success: true; data: any } | { success: false; error: string; errorCode?: string };
      
      if (!response.success) {
        if (response.errorCode) setErrorCode(response.errorCode);
        throw new Error(response.error);
      }
      
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      
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

  async function handleBatchScrape() {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return;

    if (!hasBatchPermission) {
      try {
        const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
        setHasBatchPermission(granted);
        if (!granted) {
          setStatus('error');
          setErrorMsg('Batch scraping requires permissions.');
          return;
        }
      } catch (e) {
        setStatus('error');
        setErrorMsg('Failed to request permission.');
        return;
      }
    }

    setStatus('loading');
    setBatchResults([]);
    setBatchProgress({ current: 0, total: urls.length });

    try {
      const prefsResponse = await browser.runtime.sendMessage({ action: 'get-preferences' });
      const prefs = prefsResponse.data;

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
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : 'Batch scraping failed');
    } finally {
      setBatchProgress(null);
    }
  }

  async function handleActivatePicker(idx: number) {
    setPickerTargetIdx(idx);
    await browser.storage.local.remove(['pickedSelector', 'pickedIdx']);
    await browser.storage.local.set({ pickerTargetIdx: idx });
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

  return (
    <>
      <div className="app-root" style={{ minWidth: 360, maxWidth: 420, background: '#f8faff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '16px 16px 20px' }}>
          {/*  HEADER  */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'conic-gradient(from 0deg, #4f46e5, #818cf8, #f59e0b, #4f46e5)', padding: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f8faff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="icons/icon48x48.png" alt="" style={{ width: 19, height: 19 }} />
                  </div>
                </div>
              </div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12.5, fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #3730a3 0%, #6366f1 55%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Web Content Scraper
              </h1>
            </div>
          </div>
          <div style={{ height: 1, marginBottom: 14, background: MAIN_DIVIDER }} />

          {status === 'success' && errorMsg && view !== 'preview' && <div className="success-bar">{errorMsg}</div>}

          {view === 'main' && (
            <MainView
              data={data} status={status} cleanMode={cleanMode}
              errorCode={errorCode}
              onCleanModeChange={handleCleanModeChange} onScrape={handleScrape}
              onViewSelectors={() => setView('selectors')} onViewBatch={() => setView('batch')}
              onViewSettings={() => setView('settings')} onViewPreview={() => setView('preview')}
              onViewExport={() => setView('export')}
            />
          )}

          {view === 'preview' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4"><Preview data={data} onChange={setData} /></div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setView('main')}>← Back</button>
                <button className="btn-accent flex-1" onClick={() => setView('export')}>Export ↓</button>
              </div>
            </div>
          )}

          {view === 'export' && data && (
            <div className="space-y-4">
              <div className="card-luxe p-4"><ExportButtons data={data} /></div>
              <button className="btn-secondary w-full" onClick={() => setView('preview')}>← Back</button>
            </div>
          )}

          {view === 'selectors' && (
            <SelectorsView
              cleanMode={cleanMode} onCleanModeChange={handleCleanModeChange}
              selectorRows={selectorRows} onSelectorRowsChange={(rows) => { setSelectorRows(rows); browser.storage.local.set({ draftRows: rows }); }}
              pickerTargetIdx={pickerTargetIdx} onActivatePicker={handleActivatePicker}
              onCustomScrape={handleCustomScrape} onSaveRule={saveCurrentRule}
              onViewRules={() => { loadSavedRules(); setView('rules'); }}
              onBack={() => setView('main')} status={status}
              errorCode={errorCode}
            />
          )}

          {view === 'rules' && <RulesView savedRules={savedRules} onDeleteRule={handleDeleteRule} onOpenSelectors={() => setView('selectors')} onBack={() => setView('selectors')} />}

          {view === 'batch' && (
            <BatchView
              cleanMode={cleanMode} onCleanModeChange={handleCleanModeChange}
              batchUrls={batchUrls} onBatchUrlsChange={setBatchUrls}
              batchProgress={batchProgress} onBatchScrape={handleBatchScrape}
              onBack={() => setView('main')} status={status}
              hasPermission={hasBatchPermission} onRequestPermission={handleRequestPermission}
            />
          )}

          {view === 'batch-results' && (
            <BatchResultsView
              batchResults={batchResults} batchExportFormat={batchExportFormat}
              onBatchExportFormatChange={setBatchExportFormat} onDownloadBatchResults={downloadBatchResults}
              onBack={() => setView('batch')}
            />
          )}

          {view === 'settings' && <SettingsView onBack={() => setView('main')} />}
        </div>
      </div>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}
