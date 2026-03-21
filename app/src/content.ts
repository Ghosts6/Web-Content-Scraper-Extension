import browser from 'webextension-polyfill';
import { extractPageContent, extractWithSelectors } from './scraper/extractor';
import { activatePicker, deactivatePicker } from './content-picker';

// ─── Message Handler ─────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((message: unknown): Promise<unknown> => {
  const msg = message as {
    action: string;
    selectors?: Record<string, string>;
    cleanMode?: boolean;
  };

  if (msg.action === 'scrape') {
    const data = extractPageContent(msg.cleanMode);
    return Promise.resolve({ success: true, data });
  }

  if (msg.action === 'scrapeWithSelectors' && msg.selectors) {
    const data = extractWithSelectors(msg.selectors, msg.cleanMode);
    return Promise.resolve({ success: true, data });
  }

  if (msg.action === 'activatePicker') {
    activatePicker();
    return Promise.resolve({ success: true });
  }

  if (msg.action === 'deactivatePicker') {
    deactivatePicker();
    return Promise.resolve({ success: true });
  }

  return Promise.resolve({ success: false, error: 'Unknown action' });
});
