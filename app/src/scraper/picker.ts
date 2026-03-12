let pickerCallback: ((selector: string) => void) | null = null;
let isPickerActive = false;
const overlay = document.createElement('div');
overlay.id = 'scraper-picker-overlay';
overlay.style.position = 'fixed';
overlay.style.zIndex = '99999999';
overlay.style.border = '2px dashed #007bff';
overlay.style.backgroundColor = 'rgba(0, 123, 255, 0.2)';
overlay.style.pointerEvents = 'none';
overlay.style.display = 'none';
document.body.appendChild(overlay);

function handleMouseMove(e: MouseEvent) {
  if (!isPickerActive) return;
  const target = e.target as HTMLElement;
  if (target.id === 'scraper-picker-overlay') return;
  const rect = target.getBoundingClientRect();
  overlay.style.top = `${window.scrollY + rect.top}px`;
  overlay.style.left = `${window.scrollX + rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function handleMouseClick(e: MouseEvent) {
  if (!isPickerActive) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (target.id === 'scraper-picker-overlay') return;

  const selector = getCssSelector(target);
  if (pickerCallback) {
    pickerCallback(selector);
  }
  deactivatePicker();
}

export function activatePicker(callback: (selector: string) => void) {
  if (isPickerActive) return;
  isPickerActive = true;
  pickerCallback = callback;
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleMouseClick, true);
  overlay.style.display = 'block';
}

export function deactivatePicker() {
  if (!isPickerActive) return;
  isPickerActive = false;
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleMouseClick, true);
  overlay.style.display = 'none';
  pickerCallback = null;
}

// A simple function to generate a CSS selector for an element.
function getCssSelector(el: HTMLElement): string {
  if (!(el instanceof Element)) return '';
  const path: string[] = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += `#${el.id}`;
      path.unshift(selector);
      break;
    } else {
      let sib = el as Element;
      let nth = 1;
      while ((sib = sib.previousElementSibling!)) {
        if (sib.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth !== 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    if (el.parentElement) {
      el = el.parentElement;
    } else {
      break;
    }
  }
  return path.join(' > ');
}
