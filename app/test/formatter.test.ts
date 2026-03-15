import { toJSON, toXML, toMarkdown, toPlainText, format, getMimeType, getFileExtension } from '../src/scraper/formatter';
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

const EMPTY_DATA: ExtractedContent = {
  url: 'https://example.com/empty',
  title: '',
  metadata: {},
  headings: [],
  paragraphs: [],
  lists: [],
  links: [],
  images: [],
};

const SPECIAL_CHARS_DATA: ExtractedContent = {
  url: 'https://example.com/special',
  title: 'Title with & < > " \' éñ',
  metadata: {
    author: 'Author & Co',
    description: 'Desc with <tags> and "quotes"',
  },
  headings: ['Heading with & < > " \' éñ'],
  paragraphs: ['Paragraph with & < > " \' éñ'],
  lists: [['Item with & < > " \' éñ']],
  links: [{ text: 'Link with & < > " \' éñ', url: 'https://example.com/link' }],
  images: [{ src: 'https://example.com/img.png', alt: 'Alt with & < > " \' éñ' }],
};

describe('toJSON', () => {
  test('produces valid JSON with title', () => {
    const output = toJSON(MOCK_DATA);
    const parsed = JSON.parse(output);
    expect(parsed.title).toBe('Test Article');
    expect(parsed.headings).toContain('Intro');
  });

  test('handles empty data', () => {
    const output = toJSON(EMPTY_DATA);
    const parsed = JSON.parse(output);
    expect(parsed.title).toBe('');
    expect(parsed.headings).toHaveLength(0);
    expect(parsed.paragraphs).toHaveLength(0);
  });

  test('preserves special characters', () => {
    const output = toJSON(SPECIAL_CHARS_DATA);
    const parsed = JSON.parse(output);
    expect(parsed.title).toBe('Title with & < > " \' éñ');
    expect(parsed.metadata.author).toBe('Author & Co');
  });

  test('includes all data fields', () => {
    const output = toJSON(MOCK_DATA);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('url');
    expect(parsed).toHaveProperty('title');
    expect(parsed).toHaveProperty('metadata');
    expect(parsed).toHaveProperty('headings');
    expect(parsed).toHaveProperty('paragraphs');
    expect(parsed).toHaveProperty('lists');
    expect(parsed).toHaveProperty('links');
    expect(parsed).toHaveProperty('images');
  });

  test('produces pretty-printed JSON', () => {
    const output = toJSON(MOCK_DATA);
    expect(output).toContain('\n');
    expect(output).toContain('  ');
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
    const output = toXML(SPECIAL_CHARS_DATA);
    expect(output).toContain('<title>Title with &amp; &lt; &gt; &quot; &apos; éñ</title>');
    expect(output).toContain('<author>Author &amp; Co</author>');
  });

  test('includes links', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('url="https://example.com"');
  });

  test('includes images', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('src="https://example.com/img.png"');
    expect(output).toContain('alt="An image"');
  });

  test('includes metadata', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('<author>John Smith</author>');
    expect(output).toContain('<description>A description.</description>');
  });

  test('handles empty data', () => {
    const output = toXML(EMPTY_DATA);
    expect(output).toContain('<page>');
    expect(output).toContain('<title></title>');
    expect(output).toContain('<metadata>');
    expect(output).toContain('</metadata>');
    expect(output).toContain('<headings>');
    expect(output).toContain('</headings>');
  });

  test('includes XML declaration', () => {
    const output = toXML(MOCK_DATA);
    expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  test('handles multiple list items', () => {
    const dataWithMultipleLists: ExtractedContent = {
      ...MOCK_DATA,
      lists: [['Item 1', 'Item 2'], ['List 2 Item 1']],
    };
    const output = toXML(dataWithMultipleLists);
    expect(output).toContain('<list index="0">');
    expect(output).toContain('<list index="1">');
    expect(output).toContain('<item>Item 1</item>');
    expect(output).toContain('<item>List 2 Item 1</item>');
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

  test('includes metadata section', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('## Metadata');
    expect(output).toContain('- **Author:** John Smith');
    expect(output).toContain('- **Description:** A description.');
  });

  test('includes headings section', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('## Headings');
    expect(output).toContain('- Intro');
    expect(output).toContain('- Details');
  });

  test('includes lists section', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('## Lists');
    expect(output).toContain('### List 1');
    expect(output).toContain('- Item A');
    expect(output).toContain('- Item B');
  });

  test('includes links section', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('## Links');
    expect(output).toContain('- [Click here](https://example.com)');
  });

  test('includes images section', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('## Images');
    expect(output).toContain('- ![An image](https://example.com/img.png)');
  });

  test('handles empty data', () => {
    const output = toMarkdown(EMPTY_DATA);
    expect(output).toContain('# ');
    expect(output).not.toContain('## Metadata');
    expect(output).not.toContain('## Headings');
  });

  test('escapes special characters in links', () => {
    const output = toMarkdown(SPECIAL_CHARS_DATA);
    expect(output).toContain('[Link with & < > " \' éñ](https://example.com/link)');
  });

  test('includes URL reference', () => {
    const output = toMarkdown(MOCK_DATA);
    expect(output).toContain('> URL: https://example.com/article');
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

  test('includes URL', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('URL: https://example.com/article');
  });

  test('includes headings section', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('HEADINGS');
    expect(output).toContain('  Intro');
    expect(output).toContain('  Details');
  });

  test('includes content section', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('CONTENT');
    expect(output).toContain('Para one.');
    expect(output).toContain('Para two.');
  });

  test('includes links section', () => {
    const output = toPlainText(MOCK_DATA);
    expect(output).toContain('LINKS');
    expect(output).toContain('  Click here: https://example.com');
  });

  test('handles empty data', () => {
    const output = toPlainText(EMPTY_DATA);
    expect(output).toContain('URL: https://example.com/empty');
    expect(output).not.toContain('HEADINGS');
    expect(output).not.toContain('CONTENT');
  });

  test('handles multiple lists', () => {
    const dataWithMultipleLists: ExtractedContent = {
      ...MOCK_DATA,
      lists: [['Item 1', 'Item 2'], ['List 2 Item 1']],
    };
    const output = toPlainText(dataWithMultipleLists);
    expect(output).toContain('List 1:');
    expect(output).toContain('List 2:');
    expect(output).toContain('• Item 1');
    expect(output).toContain('• List 2 Item 1');
  });

  test('preserves special characters', () => {
    const output = toPlainText(SPECIAL_CHARS_DATA);
    expect(output).toContain('TITLE WITH & < > " \' ÉÑ');
    expect(output).toContain('Author & Co');
  });
});

describe('format', () => {
  test('dispatches to correct formatter for json', () => {
    const result = format(MOCK_DATA, 'json');
    expect(JSON.parse(result)).toHaveProperty('title', 'Test Article');
  });

  test('dispatches to correct formatter for xml', () => {
    const result = format(MOCK_DATA, 'xml');
    expect(result).toContain('<page>');
    expect(result).toContain('<title>Test Article</title>');
  });

  test('dispatches to correct formatter for markdown', () => {
    const result = format(MOCK_DATA, 'markdown');
    expect(result).toContain('# Test Article');
  });

  test('dispatches to correct formatter for text', () => {
    const result = format(MOCK_DATA, 'text');
    expect(result).toContain('TEST ARTICLE');
  });
});

describe('getMimeType', () => {
  test('returns correct MIME type for json', () => {
    expect(getMimeType('json')).toBe('application/json');
  });

  test('returns correct MIME type for xml', () => {
    expect(getMimeType('xml')).toBe('application/xml');
  });

  test('returns correct MIME type for markdown', () => {
    expect(getMimeType('markdown')).toBe('text/markdown');
  });

  test('returns correct MIME type for text', () => {
    expect(getMimeType('text')).toBe('text/plain');
  });
});

describe('getFileExtension', () => {
  test('returns correct extension for json', () => {
    expect(getFileExtension('json')).toBe('json');
  });

  test('returns correct extension for xml', () => {
    expect(getFileExtension('xml')).toBe('xml');
  });

  test('returns correct extension for markdown', () => {
    expect(getFileExtension('markdown')).toBe('md');
  });

  test('returns correct extension for text', () => {
    expect(getFileExtension('text')).toBe('txt');
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles very long content in markdown', () => {
    const longData: ExtractedContent = {
      ...MOCK_DATA,
      paragraphs: ['A'.repeat(10000)],
    };
    const output = toMarkdown(longData);
    expect(output.length).toBeGreaterThan(10000);
    expect(output).toContain('A'.repeat(100));
  });

  test('handles data with null/undefined values', () => {
    const dataWithNulls: ExtractedContent = {
      ...MOCK_DATA,
      metadata: { author: null as any, description: undefined as any },
    };
    const output = toJSON(dataWithNulls);
    const parsed = JSON.parse(output);
    expect(parsed.metadata.author).toBeNull();
    expect(parsed.metadata.description).toBeUndefined();
  });

  test('handles empty strings in metadata', () => {
    const dataWithEmpty: ExtractedContent = {
      ...MOCK_DATA,
      metadata: { author: '', description: '' },
    };
    const output = toXML(dataWithEmpty);
    expect(output).toContain('<author></author>');
    expect(output).toContain('<description></description>');
  });

  test('handles URLs with special characters', () => {
    const dataWithSpecialUrl: ExtractedContent = {
      ...MOCK_DATA,
      url: 'https://example.com/path with spaces & special chars?query=value',
      links: [{ text: 'Link', url: 'https://example.com/path with spaces & special chars?query=value' }],
    };
    const output = toMarkdown(dataWithSpecialUrl);
    expect(output).toContain('> URL: https://example.com/path with spaces & special chars?query=value');
    expect(output).toContain('[Link](https://example.com/path with spaces & special chars?query=value)');
  });

  test('handles images without alt text', () => {
    const dataWithEmptyAlt: ExtractedContent = {
      ...MOCK_DATA,
      images: [{ src: 'https://example.com/img.png', alt: '' }],
    };
    const output = toMarkdown(dataWithEmptyAlt);
    expect(output).toContain('![](https://example.com/img.png)');
  });

  test('handles malformed data structures', () => {
    const malformedData: ExtractedContent = {
      ...MOCK_DATA,
      lists: [[]], // Empty list
      links: [{ text: '', url: '' }], // Empty link
    };
    const output = toPlainText(malformedData);
    expect(output).toContain('LIST');
    expect(output).toContain('LINKS');
  });
});