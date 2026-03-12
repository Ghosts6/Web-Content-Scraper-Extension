import browser from 'webextension-polyfill';
import { extractPageContent, extractWithSelectors } from './scraper/extractor';

// ─── Element Picker ───────────────────────────────────────────────────────────

let pickerActive = false;
let highlightOverlay: HTMLDivElement | null = null;

function buildSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body) {
    let segment = current.tagName.toLowerCase();

    if (current.className) {
      const classes = Array.from(current.classList)
        .filter((c) => !c.startsWith('__')) // ignore injected classes
        .map((c) => `.${CSS.escape(c)}`)
        .join('');
      segment += classes;
    }

    // Add nth-of-type to disambiguate siblings
    const siblings = Array.from(current.parentElement?.children ?? []).filter(
      (s) => s.tagName === current!.tagName
    );
    if (siblings.length > 1) {
      const idx = siblings.indexOf(current) + 1;
      segment += `:nth-of-type(${idx})`;
    }

    parts.unshift(segment);
    current = current.parentElement;

    // Stop at a unique ancestor
    if (current && document.querySelectorAll(parts.join(' > ')).length === 1) break;
  }

  return parts.join(' > ');
}

function createOverlay(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: rgba(99, 102, 241, 0.25);
    border: 2px solid #6366F1;
    border-radius: 3px;
    z-index: 2147483647;
    transition: all 80ms ease;
  `;
  document.body.appendChild(div);
  return div;
}

function positionOverlay(el: Element): void {
  if (!highlightOverlay) return;
  const rect = el.getBoundingClientRect();
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
}

function onMouseMove(e: MouseEvent): void {
  const target = e.target as Element;
  if (!highlightOverlay || target === highlightOverlay) return;
  positionOverlay(target);
}

function onClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  const target = e.target as Element;
  const selector = buildSelector(target);
  deactivatePicker();
  browser.runtime.sendMessage({ action: 'pickerSelector', selector });
}

function activatePicker(): void {
  if (pickerActive) return;
  pickerActive = true;
  highlightOverlay = createOverlay();
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.body.style.cursor = 'crosshair';
}

function deactivatePicker(): void {
  if (!pickerActive) return;
  pickerActive = false;
  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  highlightOverlay?.remove();
  highlightOverlay = null;
  document.body.style.cursor = '';
}

// ─── Clean Mode ───────────────────────────────────────────────────────────────

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[role="contentinfo"]',
  '.ad',
  '.ads',
  '.advertisement',
  '.sidebar',
  '.cookie-banner',
];

function cloneClean(): Document {
  const clone = document.cloneNode(true) as Document;
  NOISE_SELECTORS.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });
  return clone;
}

// ─── Message Handler ─────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((message: unknown): Promise<unknown> => {
  const msg = message as {
    action: string;
    selectors?: Record<string, string>;
    cleanMode?: boolean;
  };

  if (msg.action === 'scrape') {
    const data = extractPageContent();
    return Promise.resolve({ success: true, data });
  }

  if (msg.action === 'scrapeWithSelectors' && msg.selectors) {
    const data = extractWithSelectors(msg.selectors);
    return Promise.resolve({ success: true, data });
  }

  if (msg.action === 'activatePicker') {
    activatePicker();
    return Promise.resolve({ success: true });
  }

  return Promise.resolve({ success: false, error: 'Unknown action' });
});
