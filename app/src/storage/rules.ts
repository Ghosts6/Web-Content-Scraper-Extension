import browser from 'webextension-polyfill';
import type { CustomSelectors } from '../scraper/extractor';

export interface SiteRule {
  domain: string;
  selectors: CustomSelectors;
  createdAt: number;
  updatedAt: number;
}

// Type guard to validate if an object is a SiteRule
function isSiteRule(obj: any): obj is SiteRule {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.domain === 'string' &&
    typeof obj.selectors === 'object' &&
    obj.selectors !== null &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number'
  );
}

const RULES_PREFIX = 'rule:';
const PREFS_KEY = 'user_prefs';

export interface UserPreferences {
  defaultFormat: 'json' | 'xml' | 'markdown' | 'text';
  cleanMode: boolean;
  noiseSelectors: string[];
  batchTimeout: number;
  batchMaxRetries: number;
  batchConcurrency: number;
}

const DEFAULT_PREFS: UserPreferences = {
  defaultFormat: 'json',
  cleanMode: false,
  noiseSelectors: [
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
  ],
  batchTimeout: 30000,
  batchMaxRetries: 3,
  batchConcurrency: 5,
};

// Site Rules 

export async function saveRule(rule: Omit<SiteRule, 'createdAt' | 'updatedAt'>): Promise<void> {
  const key = RULES_PREFIX + rule.domain;
  const existing = await getRule(rule.domain);
  const now = Date.now();
  const entry: SiteRule = {
    ...rule,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing ? Math.max(existing.updatedAt + 1, now) : now,
  };
  await browser.storage.sync.set({ [key]: entry });
}

export async function getRule(domain: string): Promise<SiteRule | null> {
  const key = RULES_PREFIX + domain;
  const result = await browser.storage.sync.get(key);
  const rule = result[key];
  if (isSiteRule(rule)) {
    return rule;
  }
  return null;
}

export async function getAllRules(): Promise<SiteRule[]> {
  const all = await browser.storage.sync.get(null);
  return Object.entries(all)
    .filter(([k]) => k.startsWith(RULES_PREFIX))
    .map(([, v]) => v as SiteRule)
    .filter(isSiteRule); // Filter out any malformed rules
}

export async function deleteRule(domain: string): Promise<void> {
  await browser.storage.sync.remove(RULES_PREFIX + domain);
}

/**
 * Returns the rule for the given domain if one exists.
 * Falls back to checking for a wildcard parent domain rule.
 */
export async function getRuleForDomain(hostname: string): Promise<SiteRule | null> {
  let rule = await getRule(hostname);
  if (rule) return rule;

  // Try parent domain (e.g. sub.example.com → example.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const parent = parts.slice(1).join('.');
    rule = await getRule(parent);
  }

  return rule;
}

// User Preferences 

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await browser.storage.sync.set({ [PREFS_KEY]: { ...current, ...prefs } });
}

export async function getPreferences(): Promise<UserPreferences> {
  const result = await browser.storage.sync.get(PREFS_KEY);
  return { ...DEFAULT_PREFS, ...(result[PREFS_KEY] as Partial<UserPreferences>) };
}

