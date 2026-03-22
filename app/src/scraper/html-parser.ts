import type { ExtractedContent, CustomExtractedContent, CustomSelectors } from './extractor';

// Server-side HTML parser for batch scraping
export class HTMLParser {
  private doc: Document;
  private baseUrl: string;

  constructor(html: string, url: string) {
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      this.doc = parser.parseFromString(html, 'text/html');
      this.baseUrl = url;

      // Check if parsing was successful
      if (!this.doc || !this.doc.documentElement) {
        throw new Error('Failed to parse HTML');
      }

      // Don't try to set document.location as it's read-only in Firefox
      // We'll handle URL resolution manually when needed

    } catch (error) {
      console.error('Error creating HTMLParser:', error);
      // Create a minimal document as fallback
      const parser = new DOMParser();
      this.doc = parser.parseFromString('<html><head><title>Parse Error</title></head><body></body></html>', 'text/html');
      this.baseUrl = url;
    }
  }

  private getText(el: Element): string {
    return ((el as HTMLElement).innerText ?? el.textContent ?? '').trim();
  }

  private cloneClean(noiseSelectors: string[] = []): Document {
    const clone = this.doc.cloneNode(true) as Document;
    noiseSelectors.forEach((sel) => {
      try {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      } catch (e) {
        // Invalid selector, skip silently
        console.debug(`Invalid noise selector: ${sel}`);
      }
    });
    return clone;
  }

  extractPageContent(cleanMode = false, noiseSelectors?: string[]): ExtractedContent {
    try {
      const doc = cleanMode ? this.cloneClean(noiseSelectors) : this.doc;
      const title = doc.title ?? '';

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
        .map(el => this.getText(el))
        .filter(Boolean);

      const paragraphs = Array.from(
        doc.querySelectorAll<HTMLParagraphElement>('p')
      )
        .map(el => this.getText(el))
        .filter(Boolean);

      const lists: string[][] = Array.from(
        doc.querySelectorAll<HTMLUListElement | HTMLOListElement>('ul,ol')
      ).map((list) =>
        Array.from(list.querySelectorAll<HTMLLIElement>('li'))
          .map(el => this.getText(el))
          .filter(Boolean)
      );

      const links = Array.from(
        doc.querySelectorAll<HTMLAnchorElement>('a[href]')
      )
        .map((a) => ({
          text: this.getText(a) || a.getAttribute('aria-label') || '',
          url: this.resolveUrl(a.href, this.baseUrl),
        }))
        .filter((l) => l.text && l.url);

      const images = Array.from(
        doc.querySelectorAll<HTMLImageElement>('img[src]')
      )
        .map((img) => ({
          src: this.resolveUrl(img.src, this.baseUrl),
          alt: (img.alt ?? '').trim(),
        }))
        .filter((img) => img.src);

      return {
        url: this.baseUrl,
        title,
        metadata,
        headings,
        paragraphs,
        lists,
        links,
        images,
      };
    } catch (error) {
      console.error('Error in extractPageContent:', error);
      // Return a minimal valid ExtractedContent object
      return {
        url: '',
        title: 'Error parsing page',
        metadata: {},
        headings: [],
        paragraphs: [],
        lists: [],
        links: [],
        images: [],
      };
    }
  }

  extractWithSelectors(
    selectors: CustomSelectors,
    cleanMode = false,
    noiseSelectors?: string[]
  ): CustomExtractedContent {
    try {
      const doc = cleanMode ? this.cloneClean(noiseSelectors) : this.doc;
      const result: CustomExtractedContent = {};

      for (const [fieldName, selector] of Object.entries(selectors)) {
        if (!this.isValidSelector(selector)) {
          console.warn(`[BatchScraper] Invalid selector skipped: "${selector}"`);
          continue;
        }

        try {
          const elements = Array.from(doc.querySelectorAll(selector));
          const texts = elements.map(el => this.getText(el)).filter(Boolean);
          result[fieldName] = texts.length === 1 ? texts[0] : texts;
        } catch (e) {
          console.warn(`[BatchScraper] Selector error for "${selector}":`, e);
        }
      }

      return result;
    } catch (error) {
      console.error('Error in extractWithSelectors:', error);
      return {};
    }
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      // If it's already an absolute URL, return as-is
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
      }
      // Try to resolve relative URL
      return new URL(url, baseUrl).href;
    } catch {
      // If URL resolution fails, return the original URL
      return url;
    }
  }
}