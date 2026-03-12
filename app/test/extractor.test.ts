/**
 * @jest-environment jsdom
 */
import { extractPageContent, extractWithSelectors } from '../src/scraper/extractor';

beforeEach(() => {
  document.title = 'Test Page';
  document.body.innerHTML = `
    <meta name="author" content="Jane Doe" />
    <meta name="description" content="A test description." />
    <h1>Main Heading</h1>
    <h2>Sub Heading</h2>
    <p>First paragraph.</p>
    <p>Second paragraph.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <a href="https://example.com">Example Link</a>
    <img src="https://example.com/img.png" alt="Example image" />
    <article class="content">
      <h1 class="article-title">Article Title</h1>
    </article>
  `;
});

describe('extractPageContent', () => {
  test('extracts title', () => {
    const result = extractPageContent();
    expect(result.title).toBe('Test Page');
  });

  test('extracts headings', () => {
    const result = extractPageContent();
    expect(result.headings).toContain('Main Heading');
    expect(result.headings).toContain('Sub Heading');
  });

  test('extracts paragraphs', () => {
    const result = extractPageContent();
    expect(result.paragraphs).toContain('First paragraph.');
    expect(result.paragraphs).toContain('Second paragraph.');
  });

  test('extracts lists', () => {
    const result = extractPageContent();
    expect(result.lists).toHaveLength(1);
    expect(result.lists[0]).toContain('Item 1');
    expect(result.lists[0]).toContain('Item 2');
  });

  test('extracts links', () => {
    const result = extractPageContent();
    expect(result.links).toContainEqual({
      text: 'Example Link',
      url: 'https://example.com/',
    });
  });

  test('extracts images', () => {
    const result = extractPageContent();
    expect(result.images[0].alt).toBe('Example image');
  });

  test('extracts metadata', () => {
    const result = extractPageContent();
    expect(result.metadata.author).toBe('Jane Doe');
    expect(result.metadata.description).toBe('A test description.');
  });
});

describe('extractWithSelectors', () => {
  test('extracts content using CSS selectors', () => {
    const result = extractWithSelectors({
      title: '.article-title',
    });
    expect(result.title).toBe('Article Title');
  });

  test('returns empty for non-matching selectors', () => {
    const result = extractWithSelectors({ nothing: '.does-not-exist' });
    expect(result.nothing).toEqual([]);
  });

  test('skips invalid selectors without throwing', () => {
    // console.warn is expected here — suppress it to keep test output clean
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      extractWithSelectors({ bad: '###invalid!!!' })
    ).not.toThrow();
    warnSpy.mockRestore();
  });
});