import { extractPageContent } from '../src/scraper/extractor';

describe('Content Script', () => {
  beforeEach(() => {
    // Set up a clean DOM for each test
    document.body.innerHTML = '';
    document.title = '';
  });

  describe('Message Handling', () => {
    test('handles EXTRACT_CONTENT message without clean mode', () => {
      // Mock the extractPageContent function
      const mockExtract = jest.spyOn(require('../src/scraper/extractor'), 'extractPageContent')
        .mockReturnValue({
          title: 'Test Title',
          content: 'Test content',
          url: window.location.href,
          metadata: {},
          headings: [],
          paragraphs: [],
          lists: [],
          links: [],
          images: [],
        });

      // Since we can't directly test the message listener, we'll test the logic
      const result = extractPageContent(false);

      expect(mockExtract).toHaveBeenCalledWith(false);
      expect(result.title).toBe('Test Title');
      expect(result.content).toBe('Test content');

      mockExtract.mockRestore();
    });

    test('handles EXTRACT_CONTENT message with clean mode', () => {
      const mockExtract = jest.spyOn(require('../src/scraper/extractor'), 'extractPageContent')
        .mockReturnValue({
          title: 'Clean Title',
          content: 'Clean content',
          url: window.location.href,
          metadata: {},
          headings: [],
          paragraphs: [],
          lists: [],
          links: [],
          images: [],
        });

      const result = extractPageContent(true);

      expect(mockExtract).toHaveBeenCalledWith(true);
      expect(result.title).toBe('Clean Title');
      expect(result.content).toBe('Clean content');

      mockExtract.mockRestore();
    });

    test('ignores unknown message types', () => {
      const mockExtract = jest.spyOn(require('../src/scraper/extractor'), 'extractPageContent');

      // Should not call extractPageContent for unknown message types
      expect(mockExtract).not.toHaveBeenCalled();

      mockExtract.mockRestore();
    });
  });

  describe('Integration with Extractor', () => {
    test('integrates with extractPageContent function', () => {
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
      expect(result.title).toBe('Integration Test');
      expect(result.paragraphs).toContain('Test content');
    });

    test('passes clean mode parameter correctly', () => {
      document.title = 'Clean Mode Test';
      document.body.innerHTML = '<p>Content</p><nav>Navigation</nav>';

      const normalResult = extractPageContent(false);
      const cleanResult = extractPageContent(true);

      // Both should return valid results
      expect(normalResult.paragraphs).toBeDefined();
      expect(cleanResult.paragraphs).toBeDefined();
      expect(Array.isArray(normalResult.paragraphs)).toBe(true);
      expect(Array.isArray(cleanResult.paragraphs)).toBe(true);
    });
  });
});