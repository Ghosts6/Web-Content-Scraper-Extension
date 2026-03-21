/**
 * CSS Selector builder from DOM elements
 * Generates robust selectors that are likely to be unique
 */

export function buildSelector(el: Element): string {
  // Prefer ID if it's unique
  if (el.id) {
    const id = el.id.trim();
    if (id && document.querySelectorAll(`#${CSS.escape(id)}`).length === 1) {
      return `#${CSS.escape(id)}`;
    }
  }

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && current !== document.documentElement) {
    const segment = getSegment(current);
    parts.unshift(segment);
    current = current.parentElement;

    // Try to stop at a unique ancestor
    const selector = parts.join(' > ');
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  return parts.join(' > ');
}

function getSegment(el: Element): string {
  let segment = el.tagName.toLowerCase();

  // Try class-based selector first
  if (el.className && typeof el.className === 'string') {
    const classes = Array.from(el.classList)
      .filter((c) => {
        // Filter out auto-generated or framework classes
        return !c.startsWith('__') &&
          !c.startsWith('_') &&
          !c.match(/^(ng-|react-|vue-|svelte-)/i) &&
          c.length > 0;
      })
      .map((c) => `.${CSS.escape(c)}`)
      .join('');

    if (classes) {
      segment += classes;
      return segment;
    }
  }

  // Fall back to nth-of-type
  if (el.parentElement) {
    const siblings = Array.from(el.parentElement.children).filter(
      (s) => s.tagName === el.tagName
    );

    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      segment += `:nth-of-type(${idx})`;
    }
  }

  return segment;
}

/**
 * Generate a human-readable description of a selector for display
 */
export function describeSelectorForDisplay(selector: string): string {
  const parts = selector.split(' > ');
  return parts[parts.length - 1]; // Show the most specific part
}
