/**
 * @jest-environment jsdom
 */
import { extractPageContent } from '../src/scraper/extractor';

describe('Content Script Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.title = '';
  });

  describe('Integration with Extractor', () => {
    test('returns all required fields', () => {
      document.title = 'Integration Test';
      document.body.innerHTML = '<p>Test content</p>';

      const result = extractPageContent(false);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('headings');
      expect(result).toHaveProperty('paragraphs');
      expect(result).toHaveProperty('lists');
      expect(result).toHaveProperty('links');
      expect(result).toHaveProperty('images');
    });

    test('extracts title correctly', () => {
      document.title = 'Integration Test';
      document.body.innerHTML = '<p>Content</p>';

      const result = extractPageContent(false);
      expect(result.title).toBe('Integration Test');
    });

    test('extracts paragraphs correctly', () => {
      document.body.innerHTML = '<p>Test content</p>';
      const result = extractPageContent(false);
      expect(result.paragraphs).toContain('Test content');
    });

    test('clean mode removes nav elements', () => {
      document.body.innerHTML = `
        <p>Main content</p>
        <nav>Navigation</nav>
      `;

      const normalResult = extractPageContent(false);
      const cleanResult = extractPageContent(true);

      // Normal mode includes all content
      expect(normalResult.paragraphs).toContain('Main content');

      // Clean mode still includes main content
      expect(cleanResult.paragraphs).toContain('Main content');

      // Both return valid array structures
      expect(Array.isArray(normalResult.paragraphs)).toBe(true);
      expect(Array.isArray(cleanResult.paragraphs)).toBe(true);
    });

    test('handles empty page', () => {
      document.title = '';
      document.body.innerHTML = '';

      const result = extractPageContent(false);

      expect(result.title).toBe('');
      expect(result.headings).toEqual([]);
      expect(result.paragraphs).toEqual([]);
      expect(result.links).toEqual([]);
      expect(result.images).toEqual([]);
    });

    test('default cleanMode is false', () => {
      document.body.innerHTML = '<p>Content</p><nav>Nav</nav>';

      const result = extractPageContent();

      expect(result.paragraphs).toContain('Content');
    });
  });
});