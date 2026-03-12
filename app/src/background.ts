import browser from 'webextension-polyfill';

export type MessageType =
  | { action: 'scrape' }
  | { action: 'scrapeWithSelectors'; selectors: Record<string, string> }
  | { action: 'activatePicker' }
  | { action: 'scraped'; data: unknown }
  | { action: 'pickerSelector'; selector: string }
  | { action: 'error'; message: string };

/**
 * Injects the content script into the active tab and then sends it a message.
 * Returns the response from the content script.
 */
async function sendToActiveTab(message: MessageType): Promise<unknown> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found');

  // Ensure content script is injected (idempotent for already-injected tabs)
  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  } catch {
    // Already injected or CSP blocked — proceed anyway
  }

  return browser.tabs.sendMessage(tab.id, message);
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(
  (message: unknown, _sender): Promise<unknown> | undefined => {
    const msg = message as MessageType;

    switch (msg.action) {
      case 'scrape':
        return sendToActiveTab({ action: 'scrape' });

      case 'scrapeWithSelectors':
        return sendToActiveTab({
          action: 'scrapeWithSelectors',
          selectors: msg.selectors,
        });

      case 'activatePicker':
        return sendToActiveTab({ action: 'activatePicker' });

      default:
        return undefined;
    }
  }
);
