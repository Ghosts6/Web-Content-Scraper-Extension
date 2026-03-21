import browser from 'webextension-polyfill';

import {
  saveRule, getRule, getAllRules, deleteRule,
  getRuleForDomain, savePreferences, getPreferences,
} from '../src/storage/rules';

const storageData: Record<string, any> = {};

beforeAll(() => {
  browser.storage.sync.get = jest.fn((keys) => {
    if (keys === null) return Promise.resolve({ ...storageData });
    if (typeof keys === 'string') return Promise.resolve({ [keys]: storageData[keys] });
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      keys.forEach(key => { if (storageData[key] !== undefined) result[key] = storageData[key]; });
      return Promise.resolve(result);
    }
    return Promise.resolve({});
  });
  browser.storage.sync.set = jest.fn((data) => {
    Object.assign(storageData, data);
    return Promise.resolve();
  });
  browser.storage.sync.clear = jest.fn(() => {
    Object.keys(storageData).forEach(key => delete storageData[key]);
    return Promise.resolve();
  });
  browser.storage.sync.remove = jest.fn((keys) => {
    if (typeof keys === 'string') delete storageData[keys];
    else if (Array.isArray(keys)) keys.forEach(key => delete storageData[key]);
    return Promise.resolve();
  });
});

describe('Site Rules Storage', () => {
  beforeEach(async () => {
    await browser.storage.sync.clear(); // ← await added (was missing before)
  });

  describe('saveRule and getRule', () => {
    test('saves and retrieves a rule', async () => {
      const rule = { domain: 'example.com', selectors: { title: 'h1', content: '.article' } };
      await saveRule(rule);
      const retrieved = await getRule('example.com');
      expect(retrieved).toBeTruthy();
      expect(retrieved?.domain).toBe('example.com');
      expect(retrieved?.selectors).toEqual(rule.selectors);
      expect(retrieved?.createdAt).toBeDefined();
      expect(retrieved?.updatedAt).toBeDefined();
    });

    test('updates existing rule with new updatedAt', async () => {
      const rule = { domain: 'example.com', selectors: { title: 'h1' } };
      await saveRule(rule);
      const firstSave = await getRule('example.com');
      const firstUpdatedAt = firstSave?.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 1));
      await saveRule({ ...rule, selectors: { title: 'h1', content: '.article' } });
      const secondSave = await getRule('example.com');
      expect(secondSave?.updatedAt).toBeGreaterThan(firstUpdatedAt!);
      expect(secondSave?.selectors).toEqual({ title: 'h1', content: '.article' });
    });

    test('returns null for non-existent rule', async () => {
      expect(await getRule('nonexistent.com')).toBeNull();
    });
  });

  describe('getAllRules', () => {
    test('returns all saved rules', async () => {
      await saveRule({ domain: 'example.com', selectors: { title: 'h1' } });
      await saveRule({ domain: 'test.com', selectors: { content: '.article' } });
      const allRules = await getAllRules();
      expect(allRules).toHaveLength(2);
      expect(allRules.map(r => r.domain)).toContain('example.com');
      expect(allRules.map(r => r.domain)).toContain('test.com');
    });

    test('returns empty array when no rules exist', async () => {
      expect(await getAllRules()).toEqual([]);
    });
  });

  describe('deleteRule', () => {
    test('deletes existing rule', async () => {
      await saveRule({ domain: 'example.com', selectors: { title: 'h1' } });
      expect(await getRule('example.com')).toBeTruthy();
      await deleteRule('example.com');
      expect(await getRule('example.com')).toBeNull();
    });

    test('does nothing when deleting non-existent rule', async () => {
      await deleteRule('nonexistent.com'); // should not throw
    });
  });

  describe('getRuleForDomain', () => {
    test('returns exact domain match', async () => {
      await saveRule({ domain: 'example.com', selectors: { title: 'h1' } });
      expect((await getRuleForDomain('example.com'))?.domain).toBe('example.com');
    });

    test('returns parent domain rule for subdomain', async () => {
      await saveRule({ domain: 'example.com', selectors: { title: 'h1' } });
      expect((await getRuleForDomain('sub.example.com'))?.domain).toBe('example.com');
    });

    test('prefers exact match over parent domain', async () => {
      await saveRule({ domain: 'example.com', selectors: { title: 'h1' } });
      await saveRule({ domain: 'sub.example.com', selectors: { content: '.article' } });
      const result = await getRuleForDomain('sub.example.com');
      expect(result?.domain).toBe('sub.example.com');
      expect(result?.selectors).toEqual({ content: '.article' });
    });

    test('returns null when no matching domain found', async () => {
      expect(await getRuleForDomain('unknown.com')).toBeNull();
    });
  });
});

describe('User Preferences Storage', () => {
  beforeEach(async () => {
    await browser.storage.sync.clear(); // ← await added (was missing before)
  });

  describe('savePreferences and getPreferences', () => {
    test('saves and retrieves preferences', async () => {
      await savePreferences({ defaultFormat: 'markdown', cleanMode: true });
      const retrieved = await getPreferences();
      expect(retrieved.defaultFormat).toBe('markdown');
      expect(retrieved.cleanMode).toBe(true);
    });

    test('merges with existing preferences', async () => {
      await savePreferences({ defaultFormat: 'json', cleanMode: false });
      await savePreferences({ cleanMode: true });
      const retrieved = await getPreferences();
      expect(retrieved.defaultFormat).toBe('json');
      expect(retrieved.cleanMode).toBe(true);
    });

    test('returns default preferences when none saved', async () => {
      const prefs = await getPreferences();
      expect(prefs.defaultFormat).toBe('json');
      expect(prefs.cleanMode).toBe(false);
    });

    test('handles partial preference updates', async () => {
      await savePreferences({ defaultFormat: 'xml' });
      const prefs = await getPreferences();
      expect(prefs.defaultFormat).toBe('xml');
      expect(prefs.cleanMode).toBe(false);
    });
  });
});

describe('Error Handling', () => {
  test('handles storage API errors gracefully', async () => {
    const originalGet = browser.storage.sync.get;
    browser.storage.sync.get = jest.fn().mockRejectedValue(new Error('Storage error'));
    await expect(getRule('example.com')).rejects.toThrow('Storage error');
    browser.storage.sync.get = originalGet;
  });

  test('handles malformed stored data', async () => {
    await browser.storage.sync.set({ 'rule:example.com': 'not-an-object' });
    expect(await getRule('example.com')).toBeNull();
  });

  test('handles empty selectors object', async () => {
    await saveRule({ domain: 'example.com', selectors: {} });
    expect((await getRule('example.com'))?.selectors).toEqual({});
  });

  test('handles very long domain names', async () => {
    const longDomain = 'a'.repeat(200) + '.com';
    await saveRule({ domain: longDomain, selectors: { title: 'h1' } });
    expect((await getRule(longDomain))?.domain).toBe(longDomain);
  });

  test('handles special characters in domain names', async () => {
    await saveRule({ domain: 'test-domain.com', selectors: { title: 'h1' } });
    expect((await getRule('test-domain.com'))?.domain).toBe('test-domain.com');
  });
});