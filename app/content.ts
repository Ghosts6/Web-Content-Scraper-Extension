// Content script injected into web pages
import browser from 'webextension-polyfill';

// Listen for messages to start scraping
browser.runtime.onMessage.addListener((message: any) => {
  if (message.action === 'scrape') {
    // Perform scraping logic
    const data = extractContent();
    browser.runtime.sendMessage({ action: 'scraped', data });
  }
});

function extractContent() {
  // Basic extraction
  const title = document.title;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent);
  const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent);
  return { title, headings, paragraphs };
}