export interface ExtractedLink {
  text: string;
  url: string;
}

export interface ExtractedImage {
  src: string;
  alt: string;
}

export interface ExtractedContent {
  url: string;
  title: string;
  metadata: {
    author?: string;
    description?: string;
    keywords?: string;
  };
  headings: string[];
  paragraphs: string[];
  lists: string[][];
  links: ExtractedLink[];
  images: ExtractedImage[];
}

export interface CustomSelectors {
  [fieldName: string]: string;
}

export interface CustomExtractedContent {
  [fieldName: string]: string | string[];
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

/**
 * Returns trimmed text content from an element.
 * Falls back from innerText (real browsers) to textContent (jsdom/SSR).
 */
function getText(el: Element): string {
  return ((el as HTMLElement).innerText ?? el.textContent ?? '').trim();
}

/**
 * Extracts structured content from the current document using default selectors.
 */
export function extractPageContent(cleanMode = false): ExtractedContent {
  const doc = cleanMode ? cloneClean() : document;
  const title = document.title ?? '';

  const metadata: ExtractedContent['metadata'] = {};
  const metaAuthor = doc.querySelector<HTMLMetaElement>('meta[name="author"]');
  const metaDesc = doc.querySelector<HTMLMetaElement>('meta[name="description"]');
  const metaKeywords = doc.querySelector<HTMLMetaElement>('meta[name="keywords"]');
  if (metaAuthor?.content) metadata.author = metaAuthor.content;
  if (metaDesc?.content) metadata.description = metaDesc.content;
  if (metaKeywords?.content) metadata.keywords = metaKeywords.content;

  const headings = Array.from(
    doc.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4,h5,h6')
  )
    .map(getText)
    .filter(Boolean);

  const paragraphs = Array.from(
    doc.querySelectorAll<HTMLParagraphElement>('p')
  )
    .map(getText)
    .filter(Boolean);

  const lists: string[][] = Array.from(
    doc.querySelectorAll<HTMLUListElement | HTMLOListElement>('ul,ol')
  ).map((list) =>
    Array.from(list.querySelectorAll<HTMLLIElement>('li'))
      .map(getText)
      .filter(Boolean)
  );

  const links: ExtractedLink[] = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href]')
  )
    .map((a) => ({
      text: getText(a) || a.getAttribute('aria-label') || '',
      url: a.href,
    }))
    .filter((l) => l.text && l.url);

  const images: ExtractedImage[] = Array.from(
    doc.querySelectorAll<HTMLImageElement>('img[src]')
  )
    .map((img) => ({
      src: img.src,
      alt: (img.alt ?? '').trim(),
    }))
    .filter((img) => img.src);

  return {
    url: window.location.href,
    title,
    metadata,
    headings,
    paragraphs,
    lists,
    links,
    images,
  };
}

/**
 * Extracts content using user-defined CSS selectors.
 * Each selector key maps to one or more matching elements' text.
 */
export function extractWithSelectors(
  selectors: CustomSelectors,
  cleanMode = false
): CustomExtractedContent {
  const doc = cleanMode ? cloneClean() : document;
  const result: CustomExtractedContent = {};

  for (const [fieldName, selector] of Object.entries(selectors)) {
    if (!isValidSelector(selector)) {
      console.warn(`[Scraper] Invalid selector skipped: "${selector}"`);
      continue;
    }

    try {
      const elements = Array.from(doc.querySelectorAll(selector));
      const texts = elements.map(getText).filter(Boolean);
      result[fieldName] = texts.length === 1 ? texts[0] : texts;
    } catch (e) {
      console.warn(`[Scraper] Selector error for "${selector}":`, e);
    }
  }

  return result;
}

/**
 * Validates a CSS selector string to guard against injection.
 */
function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}