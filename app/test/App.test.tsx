import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/popup/App';
import browser from 'webextension-polyfill';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    onUpdated: { addListener: jest.fn(), removeListener: jest.fn() },
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

const MOCK_DATA = {
  url: 'https://example.com',
  title: 'Test Page',
  metadata: {},
  headings: ['Test Heading'],
  paragraphs: ['Test paragraph'],
  lists: [],
  links: [],
  images: [],
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);
    // storage.sync.get returns empty object by default (no saved prefs/rules)
    mockBrowser.storage.sync.get.mockResolvedValue({});
    mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true, data: MOCK_DATA });
  });

  test('renders header', () => {
    render(<App />);
    expect(screen.getByText(/Web Content Scraper/i)).toBeInTheDocument();
  });

  test('renders main view by default', () => {
    render(<App />);
    expect(screen.getByText('Quick Scrape')).toBeInTheDocument();
    expect(screen.getByText('Selectors')).toBeInTheDocument();
  });

  test('loads stored preferences on mount', async () => {
    // Storage returns cleanMode: true
    mockBrowser.storage.sync.get.mockResolvedValue({ user_prefs: { defaultFormat: 'json', cleanMode: true } });
    render(<App />);
    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: /clean content mode/i });
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  test('toggles clean mode and persists preference', async () => {
    render(<App />);
    const toggle = screen.getByRole('switch', { name: /clean content mode/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => {
      expect(mockBrowser.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ user_prefs: expect.objectContaining({ cleanMode: true }) })
      );
    });
  });

  test('navigates to selectors view', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Selectors'));
    expect(screen.getByText('CSS Selectors')).toBeInTheDocument();
  });

  test('navigates to batch view', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Batch Scrape'));
    expect(screen.getByText('Batch Scraper')).toBeInTheDocument();
  });

  test('handles scrape success and navigates to preview', async () => {
    render(<App />);
    await userEvent.click(screen.getByText(/Scrape This Page/));
    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({ action: 'scrape', cleanMode: false });
    });
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  test('sends cleanMode: true when clean mode is enabled', async () => {
    render(<App />);
    const toggle = screen.getByRole('switch', { name: /clean content mode/i });
    await userEvent.click(toggle);
    await userEvent.click(screen.getByText(/Scrape This Page/));
    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({ action: 'scrape', cleanMode: true });
    });
  });

  test('shows error on scrape failure', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({ success: false, error: 'Scrape failed' });
    render(<App />);
    await userEvent.click(screen.getByText(/Scrape This Page/));
    await waitFor(() => {
      expect(screen.getByText('Scrape failed')).toBeInTheDocument();
    });
  });

  test('shows error on network failure', async () => {
    mockBrowser.runtime.sendMessage.mockRejectedValueOnce(new Error('Network error'));
    render(<App />);
    await userEvent.click(screen.getByText(/Scrape This Page/));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('loads domain rules on mount', async () => {
    render(<App />);
    await waitFor(() => {
      expect(mockBrowser.tabs.query).toHaveBeenCalled();
      expect(mockBrowser.storage.sync.get).toHaveBeenCalled();
    });
  });

  test('handles domain rules loading error gracefully', async () => {
    mockBrowser.tabs.query.mockRejectedValueOnce(new Error('Browser API error'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<App />);
    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith('Failed to load domain rules:', expect.any(Error));
    });
    warnSpy.mockRestore();
  });

  describe('Custom Selectors View', () => {
    test('adds and removes selector rows', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText('+ Add Field'));
      expect(screen.getAllByPlaceholderText('field')).toHaveLength(2);
      const removeButtons = screen.getAllByText('✕');
      await userEvent.click(removeButtons[1]);
      expect(screen.getAllByPlaceholderText('field')).toHaveLength(1);
    });

    test('scrapes with valid selectors', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(screen.getByText('⚡ Scrape with Selectors'));
      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
          action: 'scrapeWithSelectors',
          selectors: { title: 'h1' },
          cleanMode: false,
        });
      });
    });

    test('does not scrape when selectors are empty', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      const fieldInput = screen.getByPlaceholderText('field');
      await userEvent.clear(fieldInput);
      await userEvent.click(screen.getByText('⚡ Scrape with Selectors'));
      expect(mockBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('saves rule for current domain', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(screen.getByText('💾 Save Rule for Domain'));
      await waitFor(() => {
        expect(mockBrowser.storage.sync.set).toHaveBeenCalled();
      });
    });

    test('shows error when rule save fails', async () => {
      mockBrowser.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      const fieldInput = screen.getByPlaceholderText('field');
      const selectorInput = screen.getByPlaceholderText('selector');
      await userEvent.clear(fieldInput);
      await userEvent.type(fieldInput, 'title');
      await userEvent.type(selectorInput, 'h1');
      await userEvent.click(screen.getByText('💾 Save Rule for Domain'));
      await waitFor(() => {
        expect(screen.getByText(/Failed to save rule/)).toBeInTheDocument();
      });
    });

    test('accepts long selector strings', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      const selectorInput = screen.getByPlaceholderText('selector');
      const longSelector = 'body > div.container > main > article > h1.title[data-id="123"]';
      fireEvent.change(selectorInput, { target: { value: longSelector } });
      expect(selectorInput).toHaveValue(longSelector);
    });
  });

  describe('Rules Manager View', () => {
    test('navigates to rules view from selectors', async () => {
      // getAllRules returns empty
      mockBrowser.storage.sync.get.mockResolvedValue({});
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText(/Saved/));
      await waitFor(() => {
        expect(screen.getByText('Saved Rules')).toBeInTheDocument();
      });
    });

    test('shows empty state when no rules exist', async () => {
      mockBrowser.storage.sync.get.mockResolvedValue({});
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText(/Saved/));
      await waitFor(() => {
        expect(screen.getByText('No saved rules yet')).toBeInTheDocument();
      });
    });

    test('displays saved rules', async () => {
      const now = Date.now();
      mockBrowser.storage.sync.get.mockImplementation((keys) => {
        if (keys === null) {
          return Promise.resolve({
            'rule:example.com': { domain: 'example.com', selectors: { title: 'h1' }, createdAt: now, updatedAt: now },
          });
        }
        return Promise.resolve({});
      });
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText(/Saved/));
      await waitFor(() => {
        expect(screen.getByText('example.com')).toBeInTheDocument();
      });
    });

    test('deletes a rule', async () => {
      const now = Date.now();
      mockBrowser.storage.sync.get.mockImplementation((keys) => {
        if (keys === null) {
          return Promise.resolve({
            'rule:example.com': { domain: 'example.com', selectors: { title: 'h1' }, createdAt: now, updatedAt: now },
          });
        }
        return Promise.resolve({});
      });
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText(/Saved/));
      await waitFor(() => { expect(screen.getByText('example.com')).toBeInTheDocument(); });
      await userEvent.click(screen.getByTitle('Delete rule for example.com'));
      await waitFor(() => {
        expect(mockBrowser.storage.sync.remove).toHaveBeenCalledWith('rule:example.com');
      });
    });

    test('back button from rules returns to selectors', async () => {
      mockBrowser.storage.sync.get.mockResolvedValue({});
      render(<App />);
      await userEvent.click(screen.getByText('Selectors'));
      await userEvent.click(screen.getByText(/Saved/));
      await waitFor(() => { expect(screen.getByText('Saved Rules')).toBeInTheDocument(); });
      await userEvent.click(screen.getByText('← Back'));
      expect(screen.getByText('CSS Selectors')).toBeInTheDocument();
    });
  });

  describe('Batch Scraping', () => {
    test('renders batch input form', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Batch Scrape'));
      expect(screen.getByText('Batch Scraper')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/https:\/\/example\.com\/page1/)).toBeInTheDocument();
    });

    test('start button is disabled when URLs textarea is empty', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Batch Scrape'));
      expect(screen.getByText('Start Batch Scrape')).toBeDisabled();
    });

    test('start button enables after typing URLs', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Batch Scrape'));
      const textarea = screen.getByPlaceholderText(/https:\/\/example\.com\/page1/);
      await userEvent.type(textarea, 'https://example.com/page1');
      expect(screen.getByText('Start Batch Scrape')).not.toBeDisabled();
    });

    test('back button returns to main view', async () => {
      render(<App />);
      await userEvent.click(screen.getByText('Batch Scrape'));
      await userEvent.click(screen.getByText('← Back'));
      expect(screen.getByText('Quick Scrape')).toBeInTheDocument();
    });
  });
});