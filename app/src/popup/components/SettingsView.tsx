import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { SubHeader } from './SubHeader';
import { CleanModeRow } from './CleanModeRow';
import type { UserPreferences } from '../storage/rules';

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await browser.runtime.sendMessage({ action: 'get-preferences' });
      if (response.success) {
        setPreferences(response.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPrefs: Partial<UserPreferences>) => {
    setSaving(true);
    try {
      const response = await browser.runtime.sendMessage({
        action: 'save-preferences',
        preferences: newPrefs
      });
      if (response.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    savePreferences({ [key]: value });
  };

  const addNoiseSelector = () => {
    if (!preferences) return;
    const newSelector = prompt('Enter a CSS selector to exclude:');
    if (newSelector && newSelector.trim()) {
      const updatedSelectors = [...preferences.noiseSelectors, newSelector.trim()];
      updatePreference('noiseSelectors', updatedSelectors);
    }
  };

  const removeNoiseSelector = (index: number) => {
    if (!preferences) return;
    const updatedSelectors = preferences.noiseSelectors.filter((_, i) => i !== index);
    updatePreference('noiseSelectors', updatedSelectors);
  };

  const resetNoiseSelectors = () => {
    const defaultSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'nav',
      'header',
      'footer',
      'aside',
      '[role="banner"]',
      '[role="navigation"]',
      '[role="complementary"]',
      '[role="contentinfo"]',
      '.ad',
      '.ads',
      '.advertisement',
      '.sidebar',
      '.cookie-banner',
    ];
    updatePreference('noiseSelectors', defaultSelectors);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          Failed to load preferences
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <SubHeader title="Settings" onBack={onBack} />

      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Default Export Format */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Default Export Format
        </label>
        <select
          value={preferences.defaultFormat}
          onChange={(e) => updatePreference('defaultFormat', e.target.value as UserPreferences['defaultFormat'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="markdown">Markdown</option>
          <option value="text">Plain Text</option>
        </select>
      </div>

      {/* Clean Mode Default */}
      <CleanModeRow
        checked={preferences.cleanMode}
        onChange={(checked) => updatePreference('cleanMode', checked)}
        label="Enable clean mode by default"
      />

      {/* Batch Scraping Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Batch Scraping</h3>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Request Timeout (ms)
          </label>
          <input
            type="number"
            value={preferences.batchTimeout}
            onChange={(e) => updatePreference('batchTimeout', parseInt(e.target.value) || 30000)}
            min="5000"
            max="120000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Max Retries
          </label>
          <input
            type="number"
            value={preferences.batchMaxRetries}
            onChange={(e) => updatePreference('batchMaxRetries', parseInt(e.target.value) || 3)}
            min="0"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Concurrency Limit
          </label>
          <input
            type="number"
            value={preferences.batchConcurrency}
            onChange={(e) => updatePreference('batchConcurrency', parseInt(e.target.value) || 5)}
            min="1"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-sm text-gray-500">
            Number of URLs to process simultaneously
          </p>
        </div>
      </div>

      {/* Noise Selectors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Noise Selectors</h3>
          <div className="space-x-2">
            <button
              onClick={addNoiseSelector}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add
            </button>
            <button
              onClick={resetNoiseSelectors}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          CSS selectors for elements to exclude during clean mode scraping
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {preferences.noiseSelectors.map((selector, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={selector}
                onChange={(e) => {
                  const updatedSelectors = [...preferences.noiseSelectors];
                  updatedSelectors[index] = e.target.value;
                  updatePreference('noiseSelectors', updatedSelectors);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={() => removeNoiseSelector(index)}
                className="px-2 py-2 text-red-600 hover:text-red-800 focus:outline-none"
                title="Remove selector"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {saving && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">Saving...</span>
        </div>
      )}
    </div>
  );
}