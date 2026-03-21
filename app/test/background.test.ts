import browser from 'webextension-polyfill';
import { handleMessage } from '../src/background';

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    test('handles scrape message', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockResolvedValueOnce({
        title: 'Test Title',
        content: 'Test content',
        url: 'https://example.com',
      });
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      const result = await handleMessage({ action: 'scrape', cleanMode: false });

      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: 'scrape',
        cleanMode: false,
      });
      expect(result).toEqual({
        title: 'Test Title',
        content: 'Test content',
        url: 'https://example.com',
      });
    });

    test('handles scrape with clean mode', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockResolvedValueOnce({
        title: 'Clean Title',
        content: 'Clean content',
        url: 'https://example.com',
      });
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      const result = await handleMessage({ action: 'scrape', cleanMode: true });

      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: 'scrape',
        cleanMode: true,
      });
      expect(result).toEqual({
        title: 'Clean Title',
        content: 'Clean content',
        url: 'https://example.com',
      });
    });

    test('handles get-current-tab message', async () => {
      const mockTab = { id: 1, url: 'https://example.com', title: 'Example Page' };
      browser.tabs.query.mockResolvedValueOnce([mockTab]);

      const result = await handleMessage({ action: 'get-current-tab' });

      expect(browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(result).toEqual({ success: true, data: mockTab });
    });

    test('handles get-all-tabs message', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', title: 'Tab 1' },
        { id: 2, url: 'https://test.com', title: 'Tab 2' },
      ];
      browser.tabs.query.mockResolvedValueOnce(mockTabs);

      const result = await handleMessage({ action: 'get-all-tabs' });

      expect(browser.tabs.query).toHaveBeenCalledWith({});
      expect(result).toEqual({ success: true, data: mockTabs });
    });

    test('returns error for unknown action', async () => {
      const result = await handleMessage({ action: 'unknown-type' });
      expect(result).toEqual({
        success: false,
        error: 'Unknown action: unknown-type',
        errorCode: 'UNKNOWN_ACTION',
      });
    });
  });

  describe('Error Handling', () => {
    test('handles tab sendMessage errors', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockRejectedValueOnce(new Error('Tab not found'));
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      const result = await handleMessage({ action: 'scrape', cleanMode: false });
      expect(result).toEqual({
        success: false,
        error: 'Failed to scrape: Tab not found',
        errorCode: 'CONTENT_SCRIPT_ERROR',
      });
    });

    test('propagates tab query errors', async () => {
      browser.tabs.query.mockRejectedValueOnce(new Error('Query failed'));

      const result = await handleMessage({ action: 'get-current-tab' });
      expect(result).toEqual({
        success: false,
        error: 'Query failed',
        errorCode: 'INTERNAL_ERROR',
      });
    });

    test('handles missing active tab', async () => {
      browser.tabs.query.mockResolvedValueOnce([]);

      const result = await handleMessage({ action: 'get-current-tab' });
      expect(result).toEqual({
        success: false,
        error: 'No active tab found',
        errorCode: 'NO_ACTIVE_TAB',
      });
    });

    test('handles scrape with missing cleanMode', async () => {
      browser.tabs.query.mockResolvedValueOnce([{ id: 1 }]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);
      browser.tabs.sendMessage.mockResolvedValueOnce({});

      const result = await handleMessage({ action: 'scrape' });
      expect(result).toBeDefined();
    });
  });

  describe('Message Validation', () => {
    test('handles messages without action field', async () => {
      const result = await handleMessage({ data: { tabId: 1 } });
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });

    test('handles null message', async () => {
      const result = await handleMessage(null);
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });

    test('handles undefined message', async () => {
      const result = await handleMessage(undefined);
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });
  });

  describe('Message Validation', () => {
    test('handles messages without action field', async () => {
      const result = await handleMessage({ data: { tabId: 1 } });
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });

    test('handles null message', async () => {
      const result = await handleMessage(null);
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });

    test('handles undefined message', async () => {
      const result = await handleMessage(undefined);
      expect(result).toEqual({
        success: false,
        error: 'Invalid message format',
        errorCode: 'INVALID_MESSAGE',
      });
    });

    test('handles valid scrape message structure', async () => {
      browser.tabs.query.mockResolvedValueOnce([{ id: 1 }]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);
      browser.tabs.sendMessage.mockResolvedValue({ title: 'Test', url: 'https://example.com' });

      const result = await handleMessage({ action: 'scrape', cleanMode: false });
      expect(result).toBeDefined();
    });
  });
});