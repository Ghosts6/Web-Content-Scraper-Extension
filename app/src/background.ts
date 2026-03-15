import browser from 'webextension-polyfill';
import { saveRule, getRule, getAllRules, deleteRule, savePreferences, getPreferences, SiteRule, UserPreferences } from './storage/rules';

export type MessageType =
  | { action: 'scrape'; cleanMode?: boolean }
  | { action: 'scrapeWithSelectors'; selectors: Record<string, string>; cleanMode?: boolean }
  | { action: 'activatePicker' }
  | { action: 'scraped'; data: unknown }
  | { action: 'pickerSelector'; selector: string }
  | { action: 'error'; message: string }
  | { action: 'get-current-tab' }
  | { action: 'get-all-tabs' }
  | { action: 'save-rule'; rule: Omit<SiteRule, 'createdAt' | 'updatedAt'> }
  | { action: 'get-rule'; domain: string }
  | { action: 'get-all-rules' }
  | { action: 'delete-rule'; domain: string }
  | { action: 'save-preferences'; preferences: Partial<UserPreferences> }
  | { action: 'get-preferences' };

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
  } catch (e) {
    // Already injected or CSP blocked — proceed anyway
    console.warn("Failed to inject content script, likely already injected or CSP issues:", e);
  }

  return browser.tabs.sendMessage(tab.id, message);
}

/**
 * Handles messages from the popup (exported for testing)
 */
export async function handleMessage(message: unknown): Promise<unknown> {
  // Initial validation for message structure
  if (!message || typeof (message as MessageType).action !== 'string') {
    console.warn('Received malformed or null message:', message);
    return undefined;
  }

  const msg = message as MessageType;

  switch (msg.action) {
    case 'scrape':
      return sendToActiveTab({ action: 'scrape', cleanMode: msg.cleanMode });

    case 'scrapeWithSelectors':
      return sendToActiveTab({
        action: 'scrapeWithSelectors',
        selectors: msg.selectors,
        cleanMode: msg.cleanMode,
      });

    case 'activatePicker':
      return sendToActiveTab({ action: 'activatePicker' });

    case 'get-current-tab':
      const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!currentTab) throw new Error('Tab not found');
      return currentTab;

    case 'get-all-tabs':
      const allTabs = await browser.tabs.query({});
      return allTabs;

    case 'save-rule':
      await saveRule(msg.rule);
      return { success: true };

    case 'get-rule':
      return getRule(msg.domain);

    case 'get-all-rules':
      return getAllRules();

    case 'delete-rule':
      await deleteRule(msg.domain);
      return { success: true };

    case 'save-preferences':
      await savePreferences(msg.preferences);
      return { success: true };

    case 'get-preferences':
      return getPreferences();

    default:
      console.warn('Unknown message action:', msg.action);
      return undefined;
  }
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(handleMessage);
