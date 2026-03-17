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
      expect(result).toEqual(mockTab);
    });

    test('handles get-all-tabs message', async () => {
      const mockTabs = [
        { id: 1, url: 'https://example.com', title: 'Tab 1' },
        { id: 2, url: 'https://test.com', title: 'Tab 2' },
      ];
      browser.tabs.query.mockResolvedValueOnce(mockTabs);

      const result = await handleMessage({ action: 'get-all-tabs' });

      expect(browser.tabs.query).toHaveBeenCalledWith({});
      expect(result).toEqual(mockTabs);
    });

    test('returns undefined for unknown action', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await handleMessage({ action: 'unknown-type' });
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Unknown message action:', 'unknown-type');
      warnSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('propagates tab sendMessage errors', async () => {
      const mockTab = { id: 1, url: 'https://example.com' };

      browser.tabs.sendMessage.mockRejectedValueOnce(new Error('Tab not found'));
      browser.tabs.query.mockResolvedValueOnce([mockTab]);
      browser.scripting.executeScript.mockResolvedValueOnce([]);

      await expect(handleMessage({ action: 'scrape', cleanMode: false })).rejects.toThrow(
        'Tab not found'
      );
    });

    test('propagates tab query errors', async () => {
      browser.tabs.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(handleMessage({ action: 'get-current-tab' })).rejects.toThrow('Query failed');
    });

    test('throws when no active tab found', async () => {
      browser.tabs.query.mockResolvedValueOnce([]);

      await expect(handleMessage({ action: 'get-current-tab' })).rejects.toThrow('Tab not found');
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
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await handleMessage({ data: { tabId: 1 } });
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        'Received malformed or null message:',
        expect.objectContaining({ data: { tabId: 1 } })
      );
      warnSpy.mockRestore();
    });

    test('handles null message', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await handleMessage(null);
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Received malformed or null message:', null);
      warnSpy.mockRestore();
    });

    test('handles undefined message', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await handleMessage(undefined);
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Received malformed or null message:', undefined);
      warnSpy.mockRestore();
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