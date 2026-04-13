import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsView } from '../src/popup/components/SettingsView';
import browser from 'webextension-polyfill';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
}));

const mockPreferences = {
  defaultFormat: 'json',
  cleanMode: false,
  batchTimeout: 30000,
  batchMaxRetries: 3,
  batchConcurrency: 5,
  noiseSelectors: ['script', 'style'],
};

describe('SettingsView', () => {
  beforeEach(() => {
    (browser.runtime.sendMessage as jest.Mock).mockClear();
  });

  it('should render loading state initially', () => {
    (browser.runtime.sendMessage as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<SettingsView onBack={() => {}} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render preferences after loading', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValue({ success: true, data: mockPreferences });
    render(<SettingsView onBack={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Default Export Format')).toHaveValue('json');
      expect(screen.getByRole('switch', { name: 'Clean Content Mode' })).not.toBeChecked();
      expect(screen.getByLabelText('Request Timeout (ms)')).toHaveValue(30000);
    });
  });

  it('should handle failed preferences loading', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValue({ success: false });
    render(<SettingsView onBack={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load preferences.')).toBeInTheDocument();
    });
  });

  it('should update default export format', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true, data: mockPreferences });
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true });
    render(<SettingsView onBack={() => {}} />);
    
    await waitFor(() => screen.getByLabelText('Default Export Format'));

    fireEvent.change(screen.getByLabelText('Default Export Format'), { target: { value: 'xml' } });

    await waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'save-preferences',
        preferences: { defaultFormat: 'xml' },
      });
    });
  });

  it('should add a noise selector', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true, data: mockPreferences });
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<SettingsView onBack={() => {}} />);
    
    await waitFor(() => screen.getByText('Noise Selectors'));

    const input = screen.getByPlaceholderText(/Add selector/);
    fireEvent.change(input, { target: { value: 'div.ad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'save-preferences',
        preferences: { noiseSelectors: ['script', 'style', 'div.ad'] },
      });
    });
  });

  it('should remove a noise selector', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true, data: mockPreferences });
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<SettingsView onBack={() => {}} />);
    
    await waitFor(() => screen.getByText('script'));

    const removeButton = screen.getByTitle('Remove script');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'save-preferences',
        preferences: { noiseSelectors: ['style'] },
      });
    });
  });

  it('should reset noise selectors', async () => {
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true, data: mockPreferences });
    (browser.runtime.sendMessage as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<SettingsView onBack={() => {}} />);

    await waitFor(() => screen.getByText('Noise Selectors'));

    fireEvent.click(screen.getByRole('button', { name: 'Reset Defaults' }));

    await waitFor(() => {
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'save-preferences',
        preferences: {
          noiseSelectors: [
            'script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer', 'aside',
            '[role="banner"]', '[role="navigation"]', '[role="complementary"]', '[role="contentinfo"]',
            '.ad', '.ads', '.advertisement', '.sidebar', '.cookie-banner',
          ]
        },
      });
    });
  });
});