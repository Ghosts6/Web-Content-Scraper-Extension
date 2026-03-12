import { toJSON, toXML, toMarkdown, toPlainText } from '../src/scraper/formatter';
import type { ExtractedContent } from '../src/scraper/extractor';

const MOCK_DATA: ExtractedContent = {
  url: 'https://example.com/article',
  title: 'Test Article',
  metadata: { author: 'John Smith', description: 'A description.' },
  headings: ['Intro', 'Details'],
  paragraphs: ['Para one.', 'Para two.'],
  lists: [['Item A', 'Item B']],
  links: [{ text: 'Click here', url: 'https://example.com' }],
  images: [{ src: 'https://example.com/img.png', alt: 'An image' }],
};

describe('toJSON', () => {
  test('produces valid JSON with title', () => {
    const output = toJSON(MOCK_DATA);
    const parsed = JSON.parse(output);
    expect(parsed.title).toBe('Test Article');
    expect(parsed.headings).toContain('Intro');
  });
});

describe('toXML', () => {
  test('wraps output in <page> tags', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('<page>');
    expect(output).toContain('</page>');
  });

  test('includes title', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('<title>Test Article</title>');
  });

  test('escapes special characters', () => {
    const data: ExtractedContent = {
      ...MOCK_DATA,
      title: '<Test & "Article">',
    };
    const output = toXML(data);
    expect(output).toContain('&lt;Test &amp; &quot;Article&quot;&gt;');
  });

  test('includes links', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('url="https://example.com"');
  });
});

describe('toMarkdown', () => {
  test('uses title as H1', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('# Test Article');
  });

  test('includes paragraph content', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('Para one.');
  });

  test('formats links correctly', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('[Click here](https://example.com)');
  });

  test('formats images correctly', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('![An image](https://example.com/img.png)');
  });
});

describe('toPlainText', () => {
  test('uppercases title', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('TEST ARTICLE');
  });

  test('includes author', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('Author: John Smith');
  });

  test('includes bullet list items', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('• Item A');
  });
});