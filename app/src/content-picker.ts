/**
 * Element Picker UI injected directly into the page
 * Allows users to continue picking elements even after popup closes
 */

import browser from 'webextension-polyfill';
import { buildSelector } from './scraper/selector-builder';

let pickerActive = false;
let highlightOverlay: HTMLDivElement | null = null;
let pickerToolbar: HTMLDivElement | null = null;
let selectedElement: Element | null = null;

const TOOLBAR_HEIGHT = 50;

function createPickerToolbar(): HTMLDivElement {
  const toolbar = document.createElement('div');
  toolbar.id = 'scraper-picker-toolbar';
  toolbar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: ${TOOLBAR_HEIGHT}px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    border-bottom: 2px solid #4f46e5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 2147483646;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    gap: 15px;
  `;

  // Left section: Instructions
  const left = document.createElement('div');
  left.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 13px;
    font-weight: 500;
  `;
  left.innerHTML = `
    <span style="color: rgba(255,255,255,0.7);">🎯 Click element to select • Hover to preview</span>
  `;

  // Right section: Buttons
  const right = document.createElement('div');
  right.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '✓ Confirm';
  confirmBtn.style.cssText = `
    padding: 7px 14px;
    border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255,255,255,0.3);
  `;
  confirmBtn.onmouseover = () => {
    confirmBtn.style.background = 'rgba(255,255,255,0.3)';
  };
  confirmBtn.onmouseout = () => {
    confirmBtn.style.background = 'rgba(255,255,255,0.2)';
  };
  confirmBtn.onclick = confirmSelection;

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕ Cancel';
  cancelBtn.style.cssText = `
    padding: 7px 14px;
    border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.1);
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255,255,255,0.2);
  `;
  cancelBtn.onmouseover = () => {
    cancelBtn.style.background = 'rgba(255,255,255,0.2)';
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.background = 'rgba(255,255,255,0.1)';
  };
  cancelBtn.onclick = deactivatePicker;

  right.appendChild(confirmBtn);
  right.appendChild(cancelBtn);

  toolbar.appendChild(left);
  toolbar.appendChild(right);
  document.body.appendChild(toolbar);

  // Add padding to body to accommodate toolbar
  const originalPadding = document.body.style.paddingTop;
  document.body.style.paddingTop = `${TOOLBAR_HEIGHT}px`;

  return toolbar;
}

function createOverlay(): HTMLDivElement {
  const div = document.createElement('div');
  div.id = 'scraper-picker-overlay';
  div.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: rgba(99, 102, 241, 0.2);
    border: 2px solid #6366F1;
    border-radius: 4px;
    z-index: 2147483645;
    transition: all 80ms ease;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  if (!pickerActive) return;
  const target = e.target as Element;
  if (!highlightOverlay || target === highlightOverlay || target === pickerToolbar) return;
  selectedElement = target;
  positionOverlay(target);
}

function onClick(e: MouseEvent): void {
  if (!pickerActive) return;
  e.preventDefault();
  e.stopPropagation();
  const target = e.target as Element;
  selectedElement = target;
  positionOverlay(target);
}

function confirmSelection(): void {
  if (!selectedElement) {
    deactivatePicker();
    return;
  }

  const selector = buildSelector(selectedElement);
  
  // Send selector back to popup via background script
  browser.runtime.sendMessage({
    action: 'pickerSelector',
    selector: selector,
  }).catch(() => {
    // Popup might be closed, store in lastPickedSelector
    sessionStorage.setItem('lastPickedSelector', selector);
  });

  deactivatePicker();
}

export function activatePicker(): void {
  if (pickerActive) return;

  pickerActive = true;
  highlightOverlay = createOverlay();
  pickerToolbar = createPickerToolbar();

  // Prevent interaction with page elements
  document.addEventListener('click', onClick, true);
  document.addEventListener('mousemove', onMouseMove, true);

  // Prevent contextmenu
  document.addEventListener('contextmenu', (e) => {
    if (pickerActive) e.preventDefault();
  }, true);
}

export function deactivatePicker(): void {
  if (!pickerActive) return;

  pickerActive = false;
  selectedElement = null;

  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }

  if (pickerToolbar) {
    document.body.style.paddingTop = '';
    pickerToolbar.remove();
    pickerToolbar = null;
  }

  document.removeEventListener('click', onClick, true);
  document.removeEventListener('mousemove', onMouseMove, true);
}

export function isPickerActive(): boolean {
  return pickerActive;
}
