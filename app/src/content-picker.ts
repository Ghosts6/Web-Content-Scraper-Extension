/**
 * Element Picker UI injected directly into the page using Shadow DOM for isolation.
 */

import browser from 'webextension-polyfill';
import { buildSelector } from './scraper/selector-builder';

// Unique ID for this script instance to detect re-injections
const INSTANCE_ID = Math.random().toString(36).slice(2);
(window as any).__SCRAPER_PICKER_INSTANCE_ID__ = INSTANCE_ID;

let pickerActive = false;
let highlightOverlay: HTMLDivElement | null = null;
let pickerContainer: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let selectedElement: Element | null = null;
let hoverElement: Element | null = null;

let onClickHandler: ((e: MouseEvent) => void) | null = null;
let onMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let onMouseDownHandler: ((e: MouseEvent) => void) | null = null;
let onMouseUpHandler: ((e: MouseEvent) => void) | null = null;

const TOOLBAR_HEIGHT = 56;

/**
 * Check if this script instance has been orphaned by a newer injection.
 */
function isOrphaned(): boolean {
  return (window as any).__SCRAPER_PICKER_INSTANCE_ID__ !== INSTANCE_ID;
}

function updateStatus(msg: string, isError = false): void {
  console.debug(`[Picker] STATUS: ${msg}`);
  
  // Always try to find the current active status area in the DOM
  const container = document.getElementById('scraper-picker-container');
  const activeStatusArea = container?.shadowRoot?.getElementById('status-area');
  
  if (activeStatusArea) {
    activeStatusArea.textContent = msg;
    activeStatusArea.style.color = isError ? '#fca5a5' : '#bef264';
    activeStatusArea.style.fontWeight = '700';
  } else {
    console.warn('[Picker] Could not find status-area in DOM');
  }
}

function isToolbarEvent(e: Event): boolean {
  // Use composedPath to see through Shadow DOM and check for our container ID
  const path = e.composedPath();
  const isInside = path.some(target => {
    return target instanceof HTMLElement && target.id === 'scraper-picker-container';
  });
  
  if (isInside) {
    console.debug('[Picker] Toolbar event detected');
  }
  return isInside;
}

function createPickerUI(): void {
  console.debug('[Picker] Creating UI...');
  
  // Clean up any existing UI first
  const existing = document.getElementById('scraper-picker-container');
  if (existing) {
    console.debug('[Picker] Removing existing container');
    existing.remove();
  }

  pickerContainer = document.createElement('div');
  pickerContainer.id = 'scraper-picker-container';
  pickerContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: ${TOOLBAR_HEIGHT}px;
    z-index: 2147483647;
    pointer-events: none;
    display: block !important;
  `;

  shadowRoot = pickerContainer.attachShadow({ mode: 'open' });

  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    position: absolute;
    inset: 0;
    background: #1e1b4b;
    border-bottom: 2px solid #4338ca;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    font-family: system-ui, -apple-system, sans-serif;
    color: white;
    pointer-events: auto;
    user-select: none;
  `;

  toolbar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">🎯</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 13px; font-weight: 700;">Element Picker</span>
        <span style="font-size: 11px; color: rgba(255,255,255,0.6);">Click an item on the page to select it</span>
      </div>
    </div>
    <div id="status-area" style="
      font-size: 12px;
      font-weight: 700;
      color: #bef264;
      background: rgba(0, 0, 0, 0.4);
      padding: 6px 16px;
      border-radius: 20px;
      min-width: 220px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    ">Waiting for selection...</div>
    <div style="display: flex; gap: 10px;">
      <button id="cancel-btn" style="
        padding: 8px 16px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">✕ Cancel</button>
      <button id="confirm-btn" style="
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        background: #10b981;
        color: white;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      ">✓ Confirm</button>
    </div>
  `;

  shadowRoot.appendChild(toolbar);
  (document.body || document.documentElement).appendChild(pickerContainer);

  const confirmBtn = shadowRoot.getElementById('confirm-btn');
  const cancelBtn = shadowRoot.getElementById('cancel-btn');

  confirmBtn?.addEventListener('click', (e) => {
    console.debug('[Picker] Toolbar: Confirm button listener');
    e.preventDefault();
    e.stopPropagation();
    confirmSelection();
  });

  cancelBtn?.addEventListener('click', (e) => {
    console.debug('[Picker] Toolbar: Cancel button listener');
    e.preventDefault();
    e.stopPropagation();
    deactivatePicker();
  });

  // Hover effects for shadow buttons
  confirmBtn?.addEventListener('mouseover', () => { confirmBtn.style.background = '#059669'; });
  confirmBtn?.addEventListener('mouseout', () => { confirmBtn.style.background = '#10b981'; });
  cancelBtn?.addEventListener('mouseover', () => { cancelBtn.style.background = 'rgba(255,255,255,0.2)'; });
  cancelBtn?.addEventListener('mouseout', () => { cancelBtn.style.background = 'rgba(255,255,255,0.1)'; });

  document.body.style.paddingTop = `${TOOLBAR_HEIGHT}px`;
}

function createOverlay(): void {
  // Clean up any existing overlay
  document.getElementById('scraper-picker-overlay')?.remove();
  
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'scraper-picker-overlay';
  highlightOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: rgba(99, 102, 241, 0.2);
    border: 2px solid #6366F1;
    border-radius: 4px;
    z-index: 2147483646;
    transition: all 60ms ease;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    display: block !important;
  `;
  (document.body || document.documentElement).appendChild(highlightOverlay);
}

function positionOverlay(el: Element, isSelected = false): void {
  if (!highlightOverlay) return;
  const rect = el.getBoundingClientRect();
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;

  if (isSelected) {
    highlightOverlay.style.border = '3px solid #10b981';
    highlightOverlay.style.background = 'rgba(16, 185, 129, 0.1)';
    highlightOverlay.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.2)';
  } else {
    highlightOverlay.style.border = '2px solid #6366F1';
    highlightOverlay.style.background = 'rgba(99, 102, 241, 0.2)';
    highlightOverlay.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
  }
}

function onMouseMove(e: MouseEvent): void {
  if (isOrphaned()) { deactivatePicker(); return; }
  if (!pickerActive) return;
  if (isToolbarEvent(e)) return;

  const target = e.target as Element;
  if (!target || target === document.documentElement || target === document.body) return;
  if (target.id === 'scraper-picker-overlay') return;

  if (hoverElement === target) return;
  hoverElement = target;

  positionOverlay(target, target === selectedElement);
}

function onClick(e: MouseEvent): void {
  if (isOrphaned()) { deactivatePicker(); return; }
  if (!pickerActive) return;
  
  if (isToolbarEvent(e)) {
    console.debug('[Picker] onClick: Ignoring toolbar event');
    return;
  }

  console.debug('[Picker] Page click detected', e.target);
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  selectedElement = e.target as Element;
  positionOverlay(selectedElement, true);
  updateStatus('Element selected! Click Confirm.');
}

function onMouseDown(e: MouseEvent): void {
  if (isOrphaned()) { deactivatePicker(); return; }
  if (!pickerActive || isToolbarEvent(e)) return;
  e.preventDefault();
  e.stopPropagation();
}

function onMouseUp(e: MouseEvent): void {
  if (isOrphaned()) { deactivatePicker(); return; }
  if (!pickerActive || isToolbarEvent(e)) return;
  e.preventDefault();
  e.stopPropagation();
}

async function confirmSelection(): Promise<void> {
  console.debug('[Picker] confirmSelection starting...', { selectedElement });
  
  if (!selectedElement) {
    console.warn('[Picker] No element selected during confirm');
    updateStatus('❌ No element selected!', true);
    return;
  }

  updateStatus('Saving Selection...');

  try {
    const selector = buildSelector(selectedElement);
    console.debug(`[Picker] Built selector: ${selector}`);

    const stored = await browser.storage.local.get(['pickerTargetIdx']);
    const idx = stored.pickerTargetIdx;
    
    if (typeof idx === 'number') {
      await browser.storage.local.set({ 
        pickedSelector: selector, 
        pickedIdx: idx 
      });
      console.debug(`[Picker] Storage updated: pickedSelector=${selector}, pickedIdx=${idx}`);
    } else {
      console.warn('[Picker] Missing pickerTargetIdx in storage');
    }

    await browser.runtime.sendMessage({
      action: 'pickerSelector',
      selector: selector,
    }).catch(err => console.debug('[Picker] Message error (can ignore):', err.message));

    console.debug('[Picker] Success. Deactivating...');
    deactivatePicker();
  } catch (error) {
    console.error('[Picker] confirmSelection failed:', error);
    updateStatus('❌ Error generating selector', true);
  }
}

export function activatePicker(): void {
  if (pickerActive) {
    console.debug('[Picker] Already active, skipping activatePicker');
    return;
  }
  
  console.debug('[Picker] Activating...');
  pickerActive = true;
  selectedElement = null;
  hoverElement = null;

  createOverlay();
  createPickerUI();

  onClickHandler = onClick;
  onMouseMoveHandler = onMouseMove;
  onMouseDownHandler = onMouseDown;
  onMouseUpHandler = onMouseUp;

  document.addEventListener('click', onClickHandler, true);
  document.addEventListener('mousemove', onMouseMoveHandler, true);
  document.addEventListener('mousedown', onMouseDownHandler, true);
  document.addEventListener('mouseup', onMouseUpHandler, true);

  document.body.style.overflow = 'hidden';
  document.body.style.userSelect = 'none';
  
  console.debug('[Picker] Event listeners attached');
}

export function deactivatePicker(): void {
  if (!pickerActive) return;
  console.debug('[Picker] Deactivating...');

  const orphaned = isOrphaned();
  pickerActive = false;
  selectedElement = null;
  hoverElement = null;

  // Only clean up UI if we are NOT orphaned
  if (!orphaned) {
    if (highlightOverlay) {
      highlightOverlay.remove();
      highlightOverlay = null;
    }

    if (pickerContainer) {
      pickerContainer.remove();
      pickerContainer = null;
      shadowRoot = null;
      document.body.style.paddingTop = '';
    }

    document.body.style.overflow = '';
    document.body.style.userSelect = '';
  }

  // Always detach our listeners
  if (onClickHandler) document.removeEventListener('click', onClickHandler, true);
  if (onMouseMoveHandler) document.removeEventListener('mousemove', onMouseMoveHandler, true);
  if (onMouseDownHandler) document.removeEventListener('mousedown', onMouseDownHandler, true);
  if (onMouseUpHandler) document.removeEventListener('mouseup', onMouseUpHandler, true);

  onClickHandler = null;
  onMouseMoveHandler = null;
  onMouseDownHandler = null;
  onMouseUpHandler = null;

  if (!orphaned) {
    browser.storage.local.remove(['pickerTargetIdx']).catch(() => {});
  }
  console.debug(`[Picker] Deactivation complete (orphaned: ${orphaned})`);
}

export function isPickerActive(): boolean {
  return pickerActive;
}
