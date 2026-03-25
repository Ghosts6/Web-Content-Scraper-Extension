import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { SubHeader } from './SubHeader';
import { CleanModeRow } from './CleanModeRow';
import type { UserPreferences } from '../../storage/rules';

interface SettingsViewProps {
  onBack: () => void;
}

const SETTINGS_GRAD = 'linear-gradient(90deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)';
const SETTINGS_DIVIDER = 'linear-gradient(90deg, rgba(16,185,129,0.25) 0%, rgba(52,211,153,0.2) 55%, transparent 100%)';

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
        setTimeout(() => setMessage(null), 2000);
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
      'script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer', 'aside',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]', '[role="contentinfo"]',
      '.ad', '.ads', '.advertisement', '.sidebar', '.cookie-banner',
    ];
    updatePreference('noiseSelectors', defaultSelectors);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <div role="progressbar" aria-label="Loading settings" style={{ width: 24, height: 24, border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin-loading 0.65s linear infinite' }} />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div style={{ padding: 16 }}>
        <SubHeader
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
          title="Settings"
          subtitle="Configure default behaviors"
          titleGradient={SETTINGS_GRAD}
          dividerColor={SETTINGS_DIVIDER}
          onBack={onBack}
        />
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#dc2626', fontSize: 12 }}>
          Failed to load preferences.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SubHeader
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
        title="Settings"
        subtitle="Configure default behaviors"
        titleGradient={SETTINGS_GRAD}
        dividerColor={SETTINGS_DIVIDER}
        onBack={onBack}
      />

      {message && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? '#047857' : '#b91c1c', fontSize: 11, fontWeight: 500, margin: '0 4px' }}>
          {message.text}
        </div>
      )}

      {/* General Settings */}
      <div className="gb-card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SettingRow label="Default Export Format">
          <select
            value={preferences.defaultFormat}
            onChange={(e) => updatePreference('defaultFormat', e.target.value as UserPreferences['defaultFormat'])}
            className="form-input"
          >
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="markdown">Markdown</option>
            <option value="text">Plain Text</option>
          </select>
        </SettingRow>
        <CleanModeRow
          checked={preferences.cleanMode}
          onChange={(checked) => updatePreference('cleanMode', checked)}
        />
      </div>

      {/* Batch Scraping Settings */}
      <div className="gb-card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: '0.01em' }}>Batch Scraping</h3>
        <SettingRow label="Request Timeout (ms)">
          <input
            type="number"
            value={preferences.batchTimeout}
            onChange={(e) => updatePreference('batchTimeout', parseInt(e.target.value) || 30000)}
            min="5000" max="120000"
            className="form-input"
          />
        </SettingRow>
        <SettingRow label="Max Retries">
          <input
            type="number"
            value={preferences.batchMaxRetries}
            onChange={(e) => updatePreference('batchMaxRetries', parseInt(e.target.value) || 3)}
            min="0" max="10"
            className="form-input"
          />
        </SettingRow>
        <SettingRow label="Concurrency Limit">
          <input
            type="number"
            value={preferences.batchConcurrency}
            onChange={(e) => updatePreference('batchConcurrency', parseInt(e.target.value) || 5)}
            min="1" max="20"
            className="form-input"
          />
        </SettingRow>
      </div>

      {/* Noise Selectors */}
      <div className="gb-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: '0.01em' }}>Noise Selectors</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addNoiseSelector} className="settings-btn-sm settings-btn-green">Add</button>
            <button onClick={resetNoiseSelectors} className="settings-btn-sm settings-btn-gray">Reset</button>
          </div>
        </div>
        <p style={{ fontSize: 10.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
          CSS selectors to exclude during clean mode.
        </p>
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 8 }}>
          {preferences.noiseSelectors.map((selector, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={selector}
                onChange={(e) => {
                  const updatedSelectors = [...preferences.noiseSelectors];
                  updatedSelectors[index] = e.target.value;
                  updatePreference('noiseSelectors', updatedSelectors);
                }}
                className="form-input flex-1"
              />
              <button onClick={() => removeNoiseSelector(index)} className="noise-remove-btn">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper components for styling

function SettingRow({ label, children }: { label: string, children: React.ReactNode }) {
  const inputId = `setting-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <label htmlFor={inputId} style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>{label}</label>
      <div style={{ width: 120 }}>{React.cloneElement(children as React.ReactElement, { id: inputId })}</div>
    </div>
  );
}
