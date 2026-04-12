import type { ExtractedContent, CustomExtractedContent, CustomSelectors } from './extractor';

/**
 * HTMLParser handles parsing HTML strings into structured data.
 * In environments like Chrome Service Workers (MV3) where DOMParser is not available,
 * it uses a lightweight fallback parsing strategy.
 */
export class HTMLParser {
  private html: string;
  private baseUrl: string;
  private doc: Document | null = null;

  constructor(html: string, url: string) {
    this.html = html;
    this.baseUrl = url;

    try {
      // Check if DOMParser is available (Firefox background or Popup)
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        this.doc = parser.parseFromString(html, 'text/html');
      } else {
        console.debug('[HTMLParser] DOMParser not available, using fallback parser');
      }
    } catch (error) {
      console.error('[HTMLParser] Error initializing DOMParser:', error);
    }
  }

  /**
   * Extracts content using available parsing strategy
   */
  extractPageContent(cleanMode = false, noiseSelectors: string[] = []): ExtractedContent {
    if (this.doc) {
      return this.extractFromDOM(this.doc, cleanMode, noiseSelectors);
    }
    return this.extractFromFallback(this.html, cleanMode, noiseSelectors);
  }

  /**
   * Extracts custom selectors using available parsing strategy
   */
  extractWithSelectors(
    selectors: CustomSelectors,
    cleanMode = false,
    noiseSelectors: string[] = []
  ): CustomExtractedContent {
    if (this.doc) {
      return this.extractSelectorsFromDOM(this.doc, selectors, cleanMode, noiseSelectors);
    }
    console.warn('[HTMLParser] Custom selectors are not supported in fallback mode (No DOMParser)');
    return {};
  }

  // --- DOM Extraction (Standard) ---

  private extractFromDOM(doc: Document, cleanMode: boolean, noiseSelectors: string[]): ExtractedContent {
    const targetDoc = cleanMode ? this.cloneClean(doc, noiseSelectors) : doc;
    
    return {
      url: this.baseUrl,
      title: targetDoc.title || '',
      metadata: this.getMetadataFromDOM(targetDoc),
      headings: this.getHeadingsFromDOM(targetDoc),
      paragraphs: this.getParagraphsFromDOM(targetDoc),
      lists: this.getListsFromDOM(targetDoc),
      links: this.getLinksFromDOM(targetDoc),
      images: this.getImagesFromDOM(targetDoc),
    };
  }

  private extractSelectorsFromDOM(
    doc: Document,
    selectors: CustomSelectors,
    cleanMode: boolean,
    noiseSelectors: string[]
  ): CustomExtractedContent {
    const targetDoc = cleanMode ? this.cloneClean(doc, noiseSelectors) : doc;
    const result: CustomExtractedContent = {};

    for (const [fieldName, selector] of Object.entries(selectors)) {
      try {
        const elements = Array.from(targetDoc.querySelectorAll(selector));
        const texts = elements.map(el => (el as HTMLElement).innerText || el.textContent || '').map(s => s.trim()).filter(Boolean);
        result[fieldName] = texts.length === 1 ? texts[0] : texts;
      } catch (e) {
        console.warn(`[HTMLParser] Selector error: ${selector}`, e);
      }
    }
    return result;
  }

  // --- Fallback Extraction (Regex-based) ---

  private extractFromFallback(html: string, _cleanMode: boolean, _noiseSelectors: string[]): ExtractedContent {
    // Basic regex-based extraction for environments without DOM
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? this.decodeEntities(titleMatch[1].trim()) : '';

    const metaAuthor = html.match(/<meta[^>]*name=["']author["'][^>]*content=["'](.*?)["']/i);
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    
    // Extract Headings
    const headings: string[] = [];
    const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    let hMatch;
    while ((hMatch = hRegex.exec(html)) !== null) {
      headings.push(this.cleanText(hMatch[1]));
    }

    // Extract Paragraphs
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const pText = this.cleanText(pMatch[1]);
      if (pText.length > 20) paragraphs.push(pText);
    }

    // Extract Links
    const links: ExtractedContent['links'] = [];
    const aRegex = /<a[^>]*href=["'](.*?)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let aMatch;
    while ((aMatch = aRegex.exec(html)) !== null) {
      const href = aMatch[1];
      const text = this.cleanText(aMatch[2]);
      if (text && !href.startsWith('javascript:')) {
        links.push({
          text,
          url: this.resolveUrl(href, this.baseUrl)
        });
      }
    }

    return {
      url: this.baseUrl,
      title,
      metadata: {
        author: metaAuthor ? this.decodeEntities(metaAuthor[1]) : undefined,
        description: metaDesc ? this.decodeEntities(metaDesc[1]) : undefined,
      },
      headings: headings.filter(Boolean).slice(0, 50),
      paragraphs: paragraphs.filter(Boolean).slice(0, 50),
      lists: [],
      links: links.slice(0, 100),
      images: [],
    };
  }

  // --- Utilities ---

  private cleanText(html: string): string {
    return this.decodeEntities(html.replace(/<[^>]*>/g, '').trim());
  }

  private decodeEntities(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  private cloneClean(doc: Document, noiseSelectors: string[]): Document {
    const clone = doc.cloneNode(true) as Document;
    noiseSelectors.forEach(sel => {
      try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch {}
    });
    return clone;
  }

  // DOM Helpers
  private getMetadataFromDOM(doc: Document) {
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content');
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content');
    return { author: author || undefined, description: description || undefined };
  }

  private getHeadingsFromDOM(doc: Document) {
    return Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
      .map(el => (el as HTMLElement).innerText || el.textContent || '').map(s => s.trim()).filter(Boolean);
  }

  private getParagraphsFromDOM(doc: Document) {
    return Array.from(doc.querySelectorAll('p'))
      .map(el => (el as HTMLElement).innerText || el.textContent || '').map(s => s.trim()).filter(Boolean);
  }

  private getListsFromDOM(doc: Document) {
    return Array.from(doc.querySelectorAll('ul,ol')).map(list => 
      Array.from(list.querySelectorAll('li')).map(el => (el as HTMLElement).innerText || el.textContent || '').map(s => s.trim()).filter(Boolean)
    );
  }

  private getLinksFromDOM(doc: Document) {
    return Array.from(doc.querySelectorAll('a[href]'))
      .map(a => ({
        text: ((a as HTMLElement).innerText || a.textContent || '').trim(),
        url: this.resolveUrl(a.getAttribute('href') || '', this.baseUrl)
      }))
      .filter(l => l.text && l.url);
  }

  private getImagesFromDOM(doc: Document) {
    return Array.from(doc.querySelectorAll('img[src]'))
      .map(img => ({
        src: this.resolveUrl(img.getAttribute('src') || '', this.baseUrl),
        alt: img.getAttribute('alt') || ''
      }))
      .filter(i => i.src);
  }
}
