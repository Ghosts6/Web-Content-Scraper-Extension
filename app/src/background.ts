import browser from 'webextension-polyfill';
import { saveRule, getRule, getAllRules, deleteRule, savePreferences, getPreferences, SiteRule, UserPreferences } from './storage/rules';

export type MessageType =
  | { action: 'scrape'; cleanMode?: boolean }
  | { action: 'scrapeWithSelectors'; selectors: Record<string, string>; cleanMode?: boolean }
  | { action: 'activatePicker' }
  | { action: 'deactivatePicker' }
  | { action: 'scraped'; data: unknown }
  | { action: 'pickerSelector'; selector: string }
  | { action: 'setPickerTarget'; idx: number }
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
  let tab;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    [tab] = tabs;

    if (!tab?.id) {
      return {
        success: false,
        error: 'No active tab found. Please open a webpage first.',
        errorCode: 'NO_ACTIVE_TAB',
      };
    }

    // Ensure content script is injected (idempotent for already-injected tabs)
    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content.js'],
      });
    } catch (e) {
      // Already injected or CSP blocked — proceed anyway
      console.debug("Content script injection skipped:", e);
    }

    const result = await browser.tabs.sendMessage(tab.id, message);
    return result;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error communicating with content script:', errorMsg);

    return {
      success: false,
      error: `Failed to scrape: ${errorMsg}`,
      errorCode: 'CONTENT_SCRIPT_ERROR',
    };
  }
}

/**
 * Handles messages from the popup (exported for testing)
 */
export async function handleMessage(message: unknown): Promise<unknown> {
  // Initial validation for message structure
  if (!message || typeof (message as MessageType).action !== 'string') {
    console.warn('Received malformed or null message:', message);
    return {
      success: false,
      error: 'Invalid message format',
      errorCode: 'INVALID_MESSAGE',
    };
  }

  const msg = message as MessageType;

  try {
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

      case 'deactivatePicker':
        return sendToActiveTab({ action: 'deactivatePicker' });

      case 'setPickerTarget':
        await browser.storage.local.set({ pickerTargetIdx: msg.idx });
        return { success: true };

      case 'pickerSelector':
        const stored = await browser.storage.local.get(['pickerTargetIdx']);
        const idx = stored.pickerTargetIdx;
        if (typeof idx === 'number') {
          await browser.storage.local.set({ pickedSelector: msg.selector, pickedIdx: idx });
        }
        return { success: true };

      case 'get-current-tab': {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!currentTab) {
          return {
            success: false,
            error: 'No active tab found',
            errorCode: 'NO_ACTIVE_TAB',
          };
        }
        return { success: true, data: currentTab };
      }

      case 'get-all-tabs': {
        const allTabs = await browser.tabs.query({});
        return { success: true, data: allTabs };
      }

      case 'save-rule':
        try {
          await saveRule(msg.rule);
          return { success: true, message: `Rule saved for ${msg.rule.domain}` };
        } catch (error) {
          const err = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to save rule: ${err}` };
        }

      case 'get-rule':
        try {
          const rule = await getRule(msg.domain);
          return { success: true, data: rule };
        } catch (error) {
          const err = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to get rule: ${err}` };
        }

      case 'get-all-rules': {
        const rules = await getAllRules();
        return { success: true, data: rules };
      }

      case 'delete-rule':
        try {
          await deleteRule(msg.domain);
          return { success: true, message: `Rule deleted for ${msg.domain}` };
        } catch (error) {
          const err = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to delete rule: ${err}` };
        }

      case 'save-preferences':
        try {
          await savePreferences(msg.preferences);
          return { success: true, message: 'Preferences saved' };
        } catch (error) {
          const err = error instanceof Error ? error.message : String(error);
          return { success: false, error: `Failed to save preferences: ${err}` };
        }

      case 'get-preferences': {
        const prefs = await getPreferences();
        return { success: true, data: prefs };
      }

      default:
        console.warn('Unknown message action:', msg.action);
        return {
          success: false,
          error: `Unknown action: ${msg.action}`,
          errorCode: 'UNKNOWN_ACTION',
        };
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error handling message:', errorMsg);
    return {
      success: false,
      error: errorMsg,
      errorCode: 'INTERNAL_ERROR',
    };
  }
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(handleMessage);
