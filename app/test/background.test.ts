import browser from 'webextension-polyfill';
import { handleMessage } from '../src/background';

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    test('handles EXTRACT_CONTENT message', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      // Mock browser.tabs.sendMessage
      browser.tabs.sendMessage.mockResolvedValueOnce({
        title: 'Test Title',
        content: 'Test content',
        url: 'https://example.com',
      });
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      const message = {
        action: 'scrape',
        cleanMode: false,
      };

      const result = await handleMessage(message);

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

    test('handles EXTRACT_CONTENT with clean mode', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockResolvedValueOnce({
        title: 'Clean Title',
        content: 'Clean content',
        url: 'https://example.com',
      });
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      const message = {
        action: 'scrape',
        cleanMode: true,
      };

      const result = await handleMessage(message);

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

    test('handles GET_CURRENT_TAB message', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Example Page',
      };

      browser.tabs.query.mockResolvedValueOnce([mockTab]);

      const message = { action: 'get-current-tab' };
      const result = await handleMessage(message);

      expect(browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(result).toEqual(mockTab);
    });

    test('handles GET_ALL_TABS message', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', title: 'Tab 1' },
        { id: 2, url: 'https://test.com', title: 'Tab 2' },
      ];

      browser.tabs.query.mockResolvedValueOnce(mockTabs);

      const message = { action: 'get-all-tabs' };
      const result = await handleMessage(message);

      expect(browser.tabs.query).toHaveBeenCalledWith({});
      expect(result).toEqual(mockTabs);
    });

    test('handles unknown message type', async () => {
      const mockSendResponse = jest.fn();

      const message = { action: 'unknown-type' };
      const result = await handleMessage(message);

      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('handles tab extraction errors', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockRejectedValueOnce(new Error('Tab not found'));
      browser.tabs.query.mockResolvedValueOnce([mockTab]);

      const message = {
        action: 'scrape',
        data: { tabId: 999, cleanMode: false },
      };

      await expect(handleMessage(message)).rejects.toThrow('Tab not found');
    });

    test('handles tab query errors', async () => {
      browser.tabs.query.mockRejectedValueOnce(new Error('Query failed'));

      const message = { action: 'get-current-tab' };

      await expect(handleMessage(message)).rejects.toThrow('Query failed');
    });

    test('handles invalid tab data', async () => {
      browser.tabs.query.mockResolvedValueOnce([]); // No active tab

      const message = { action: 'get-current-tab' };

      await expect(handleMessage(message)).rejects.toThrow('Tab not found');
    });

    test('handles malformed message data', async () => {
      browser.tabs.query.mockResolvedValueOnce([{ id: 1 }]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);
      browser.tabs.sendMessage.mockResolvedValueOnce({});

      const message = {
        action: 'scrape',
        data: { tabId: 'invalid', cleanMode: 'not-boolean' },
      };

      // Should handle it gracefully since it only uses action and cleanMode
      const result = await handleMessage(message);
      expect(result).toBeDefined();
    });
    });

    test('handles missing message data', async () => {
      browser.tabs.query.mockResolvedValueOnce([{ id: 1 }]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);
      browser.tabs.sendMessage.mockResolvedValueOnce({});

      const message = { action: 'scrape' }; // Missing cleanMode, should default to false

      const result = await handleMessage(message);
      expect(result).toBeDefined();
    });
  });

  describe('Message Validation', () => {
    test('validates EXTRACT_CONTENT message structure', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      // Valid message
      const validMessage = {
        action: 'scrape',
        cleanMode: false,
      };

      browser.tabs.sendMessage.mockResolvedValue({
        title: 'Test',
        content: 'Content',
        url: 'https://example.com',
      });
      browser.tabs.query.mockResolvedValueOnce([mockTab]);

      const result = await handleMessage(validMessage);
      expect(result).toBeDefined();
    });

    test('handles messages without type', async () => {
      const mockSendResponse = jest.fn();

      const message = { data: { tabId: 1 } };
      const result = await handleMessage(message);

      expect(result).toBeUndefined();
    });

    test('handles null/undefined messages', async () => {
      const result1 = await handleMessage(null);
      const result2 = await handleMessage(undefined);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
});