import type { ExtractedContent, CustomExtractedContent } from './scraper/extractor';
import { HTMLParser } from './html-parser';
import { getRuleForDomain, type UserPreferences } from '../storage/rules';

export interface BatchScrapeRequest {
  urls: string[];
  cleanMode?: boolean;
  customSelectors?: Record<string, string>;
  noiseSelectors?: string[];
  timeout?: number;
  maxRetries?: number;
  concurrency?: number;
}

export interface BatchScrapeResult {
  url: string;
  success: boolean;
  data?: ExtractedContent;
  error?: string;
  retryCount?: number;
}

export interface BatchScrapeProgress {
  completed: number;
  total: number;
  currentUrl?: string;
  results: BatchScrapeResult[];
}

/**
 * Fetches HTML content from a URL with retry logic and timeout
 */
async function fetchWithRetry(
  url: string,
  timeout = 30000,
  maxRetries = 3
): Promise<{ html: string; finalUrl: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return { html, finalUrl: response.url };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

/**
 * Scrapes a single URL using fetch and HTML parsing
 */
async function scrapeUrl(
  url: string,
  options: {
    cleanMode?: boolean;
    customSelectors?: Record<string, string>;
    noiseSelectors?: string[];
    timeout?: number;
    maxRetries?: number;
  }
): Promise<BatchScrapeResult> {
  const { cleanMode, customSelectors, noiseSelectors, timeout, maxRetries } = options;

  try {
    const { html, finalUrl } = await fetchWithRetry(url, timeout, maxRetries);

    // Validate HTML content
    if (!html || html.trim().length === 0) {
      throw new Error('Empty HTML response');
    }

    const parser = new HTMLParser(html, finalUrl);

    // Always extract standard content first
    const standardData = parser.extractPageContent(cleanMode, noiseSelectors);
    
    // Validate that we got some basic data
    if (!standardData || typeof standardData !== 'object') {
      throw new Error('Failed to parse HTML content');
    }

    let data: ExtractedContent = standardData;

    // If custom selectors are provided, extract custom data and merge it
    if (customSelectors && Object.keys(customSelectors).length > 0) {
      const customData = parser.extractWithSelectors(customSelectors, cleanMode, noiseSelectors);
      
      // Merge custom data into the standard ExtractedContent
      // Add custom fields to the metadata or create a customData property
      (data as any).customData = customData;
    }

    return {
      url: finalUrl,
      success: true,
      data,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Batch scraping failed for ${url}:`, errorMsg);
    return {
      url,
      success: false,
      error: errorMsg,
      retryCount: maxRetries,
    };
  }
}

/**
 * Performs batch scraping of multiple URLs
 */
export async function batchScrape(request: BatchScrapeRequest): Promise<BatchScrapeResult[]> {
  const {
    urls,
    cleanMode = false,
    customSelectors,
    noiseSelectors,
    timeout = 30000,
    maxRetries = 3,
    concurrency = 5,
  } = request;

  const results: BatchScrapeResult[] = [];

  // Process URLs in parallel with concurrency limit to avoid overwhelming servers
  const chunks = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(url => scrapeUrl(url, {
      cleanMode,
      customSelectors,
      noiseSelectors,
      timeout,
      maxRetries,
    }));

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Enhanced batch scraping that uses site-specific rules when available
 */
export async function smartBatchScrape(request: BatchScrapeRequest): Promise<BatchScrapeResult[]> {
  const {
    urls,
    cleanMode = false,
    noiseSelectors,
    timeout = 30000,
    maxRetries = 3,
    concurrency = 5,
  } = request;

  const results: BatchScrapeResult[] = [];
  const chunks = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (url) => {
      try {
        const urlObj = new URL(url);
        const rule = await getRuleForDomain(urlObj.hostname);

        let customSelectors = request.customSelectors;
        if (rule && !customSelectors) {
          customSelectors = rule.selectors;
        }

        return await scrapeUrl(url, {
          cleanMode,
          customSelectors,
          noiseSelectors,
          timeout,
          maxRetries,
        });
      } catch (error) {
        return {
          url,
          success: false,
          error: `Invalid URL or Rule error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  return results;
}