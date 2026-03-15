import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/popup/App';
import browser from 'webextension-polyfill';

// Mock browser APIs
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

const mockBrowser = browser as jest.Mocked<typeof browser>;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockBrowser.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);
    mockBrowser.storage.sync.get.mockResolvedValue({});
    mockBrowser.runtime.sendMessage.mockResolvedValue({
      success: true,
      data: {
        url: 'https://example.com',
        title: 'Test Page',
        metadata: {},
        headings: ['Test Heading'],
        paragraphs: ['Test paragraph'],
        lists: [],
        links: [],
        images: [],
      },
    });
  });

  test('renders header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Web Content Scraper/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders main view by default', () => {
    render(<App />);
    expect(screen.getByText('Quick Scrape')).toBeInTheDocument();
    expect(screen.getByText('🎯 Custom Selectors')).toBeInTheDocument();
  });

  test('toggles clean mode', async () => {
    render(<App />);
    const cleanModeCheckbox = screen.getByRole('checkbox', { name: /clean content mode/i });

    expect(cleanModeCheckbox).not.toBeChecked();

    await userEvent.click(cleanModeCheckbox);
    expect(cleanModeCheckbox).toBeChecked();
  });

  test('navigates to selectors view', async () => {
    render(<App />);
    const selectorsButton = screen.getByText('🎯 Custom Selectors');

    await userEvent.click(selectorsButton);
    expect(screen.getByText('Custom CSS Selectors')).toBeInTheDocument();
  });

  test('navigates to batch view', async () => {
    render(<App />);
    const batchButton = screen.getByText('📄 Batch Scrape');

    await userEvent.click(batchButton);
    expect(screen.getByText('Batch URL Scraper')).toBeInTheDocument();
  });

  test('handles scrape success', async () => {
    render(<App />);
    const scrapeButton = screen.getByText('⚡ Scrape Page');

    await userEvent.click(scrapeButton);

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'scrape',
        cleanMode: false,
      });
    });
  });

  test('handles scrape with clean mode enabled', async () => {
    render(<App />);
    const cleanModeCheckbox = screen.getByRole('checkbox', { name: /clean content mode/i });
    const scrapeButton = screen.getByText('⚡ Scrape Page');

    await userEvent.click(cleanModeCheckbox);
    await userEvent.click(scrapeButton);

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'scrape',
        cleanMode: true,
      });
    });
  });

  test('handles scrape error', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      success: false,
      error: 'Scrape failed',
    });

    render(<App />);
    const scrapeButton = screen.getByText('⚡ Scrape Page');

    await userEvent.click(scrapeButton);

    await waitFor(() => {
      expect(screen.getByText('⚠ Scrape failed')).toBeInTheDocument();
    });
  });

  test('loads domain rules on mount', async () => {
    mockBrowser.storage.sync.get.mockResolvedValue({
      'rule:example.com': {
        domain: 'example.com',
        selectors: { title: 'h1' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(mockBrowser.tabs.query).toHaveBeenCalled();
      expect(mockBrowser.storage.sync.get).toHaveBeenCalled();
    });
  });

  test('handles domain rules loading error gracefully', async () => {
    mockBrowser.tabs.query.mockRejectedValueOnce(new Error('Browser API error'));
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(<App />);

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load domain rules:',
        expect.any(Error)
      );
    });

    consoleWarnSpy.mockRestore();
  });

  describe('Custom Selectors View', () => {
    test('adds and removes selector rows', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const addButton = screen.getByText('+ Add Field');
      await userEvent.click(addButton);

      expect(screen.getAllByPlaceholderText('field')).toHaveLength(2);

      const removeButtons = screen.getAllByText('✕');
      await userEvent.click(removeButtons[1]);

      expect(screen.getAllByPlaceholderText('field')).toHaveLength(1);
    });

    test('handles custom scrape with selectors', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      const scrapeButton = screen.getByText('⚡ Scrape with Selectors');

      // Clear the existing 'title' value first
      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(scrapeButton);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
          action: 'scrapeWithSelectors',
          selectors: { title: 'h1' },
          cleanMode: false,
        });
      });
    });

    test('skips custom scrape with empty selectors', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const scrapeButton = screen.getByText('⚡ Scrape with Selectors');
      await userEvent.click(scrapeButton);

      expect(mockBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('saves rule for domain', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      const saveButton = screen.getByText('💾 Save Rule for Domain');

      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockBrowser.storage.sync.set).toHaveBeenCalled();
      });
    });

    test('handles rule save error', async () => {
      mockBrowser.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));

      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      const saveButton = screen.getByText('💾 Save Rule for Domain');

      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save rule/)).toBeInTheDocument();
      });
    });
  });

  describe('Batch Scraping', () => {
    test('renders batch input form', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('📄 Batch Scrape'));

      expect(screen.getByText('Batch URL Scraper')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/https:\/\/example\.com\/page1/)).toBeInTheDocument();
    });

    test('validates empty batch URLs', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('📄 Batch Scrape'));

      const startButton = screen.getByText('🚀 Start Batch Scrape');
      expect(startButton).toBeDisabled();
    });

    test('handles batch URL input', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('📄 Batch Scrape'));

      const textarea = screen.getByPlaceholderText(/https:\/\/example\.com\/page1/);
      await userEvent.type(textarea, 'https://example.com/page1\nhttps://example.com/page2');

      const startButton = screen.getByText('🚀 Start Batch Scrape');
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    test('handles network errors gracefully', async () => {
      mockBrowser.runtime.sendMessage.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);
      const scrapeButton = screen.getByText('⚡ Scrape Page');

      await userEvent.click(scrapeButton);

      await waitFor(() => {
        expect(screen.getByText('⚠ Network error')).toBeInTheDocument();
      });
    });

    test('handles malformed URLs in batch input', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('📄 Batch Scrape'));

      const textarea = screen.getByPlaceholderText(/https:\/\/example\.com\/page1/);
      await userEvent.type(textarea, 'not-a-url\nhttps://valid.com');

      // Should still allow processing (validation happens on backend)
      const startButton = screen.getByText('🚀 Start Batch Scrape');
      expect(startButton).not.toBeDisabled();
    });

    test('handles very long selector strings', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const selectorInput = screen.getByPlaceholderText('selector');
      const longSelector =
        'body > div.container > main > article.post > header > h1.title.class1.class2.class3[data-attribute="value"]';

      fireEvent.change(selectorInput, { target: { value: longSelector } });

      expect(selectorInput).toHaveValue(longSelector);
    });

    test('handles special characters in field names', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('🎯 Custom Selectors'));

      const fieldInput = screen.getByPlaceholderText('field');

      // Clear the existing 'title' value first
      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'field_with_underscores-and-dashes');

      expect(fieldInput).toHaveValue('field_with_underscores-and-dashes');
    });
  });
});
