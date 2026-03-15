/**
 * @jest-environment jsdom
 */
import { extractPageContent, extractWithSelectors } from '../src/scraper/extractor';

beforeEach(() => {
  document.title = 'Test Page';
  document.body.innerHTML = `
    <meta name="author" content="Jane Doe" />
    <meta name="description" content="A test description." />
    <meta name="keywords" content="test, example" />
    <h1>Main Heading</h1>
    <h2>Sub Heading</h2>
    <p>First paragraph.</p>
    <p>Second paragraph.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <ol>
      <li>Ordered Item 1</li>
      <li>Ordered Item 2</li>
    </ol>
    <a href="https://example.com">Example Link</a>
    <a href="#anchor">Anchor Link</a>
    <a href="mailto:test@example.com">Email Link</a>
    <img src="https://example.com/img.png" alt="Example image" />
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="" />
    <article class="content">
      <h1 class="article-title">Article Title</h1>
    </article>
    <!-- Noise elements for clean mode testing -->
    <nav>Navigation</nav>
    <header>Header</header>
    <footer>Footer</footer>
    <aside>Sidebar</aside>
    <div class="ad">Advertisement</div>
    <div class="cookie-banner">Cookie Banner</div>
    <script>console.log('script');</script>
    <style>.test { color: red; }</style>
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
    expect(result.headings).toContain('Article Title');
    expect(result.headings).toHaveLength(3);
  });

  test('extracts paragraphs', () => {
    const result = extractPageContent();
    expect(result.paragraphs).toContain('First paragraph.');
    expect(result.paragraphs).toContain('Second paragraph.');
    expect(result.paragraphs).toHaveLength(2);
  });

  test('extracts multiple lists', () => {
    const result = extractPageContent();
    expect(result.lists).toHaveLength(2);
    expect(result.lists[0]).toContain('Item 1');
    expect(result.lists[1]).toContain('Ordered Item 1');
  });

  test('extracts links with different protocols', () => {
    const result = extractPageContent();
    expect(result.links).toHaveLength(3);
    expect(result.links).toContainEqual({
      text: 'Example Link',
      url: 'https://example.com/',
    });
    expect(result.links).toContainEqual({
      text: 'Anchor Link',
      url: 'http://localhost/#anchor',
    });
    expect(result.links).toContainEqual({
      text: 'Email Link',
      url: 'mailto:test@example.com',
    });
  });

  test('extracts images with and without alt text', () => {
    const result = extractPageContent();
    expect(result.images).toHaveLength(2);
    expect(result.images[0].alt).toBe('Example image');
    expect(result.images[1].alt).toBe('');
  });

  test('extracts all metadata', () => {
    const result = extractPageContent();
    expect(result.metadata.author).toBe('Jane Doe');
    expect(result.metadata.description).toBe('A test description.');
    expect(result.metadata.keywords).toBe('test, example');
  });

  test('handles missing title', () => {
    document.title = '';
    const result = extractPageContent();
    expect(result.title).toBe('');
  });

  test('handles missing metadata', () => {
    document.body.innerHTML = '<h1>Test</h1>';
    const result = extractPageContent();
    expect(result.metadata.author).toBeUndefined();
    expect(result.metadata.description).toBeUndefined();
    expect(result.metadata.keywords).toBeUndefined();
  });

  test('handles empty elements', () => {
    document.body.innerHTML = `
      <h1></h1>
      <p></p>
      <ul><li></li></ul>
      <a href="https://example.com"></a>
      <img src="https://example.com/img.png" alt="" />
    `;
    const result = extractPageContent();
    expect(result.headings).toHaveLength(0);
    expect(result.paragraphs).toHaveLength(0);
    expect(result.lists[0]).toHaveLength(0);
    expect(result.links).toHaveLength(0); // Empty links are filtered out
  });

  test('handles malformed HTML', () => {
    document.body.innerHTML = `
      <h1>Unclosed heading
      <p>Paragraph</p>
      <ul><li>Item</ul>
      <a href="https://example.com">Link</a>
    `;
    const result = extractPageContent();
    // DOM parser fixes malformed HTML, so content may be concatenated
    expect(result.headings.length).toBeGreaterThan(0);
    expect(result.paragraphs).toContain('Paragraph');
    expect(result.links).toHaveLength(1);
  });

  test('handles very long content', () => {
    const longText = 'A'.repeat(10000);
    document.body.innerHTML = `<p>${longText}</p>`;
    const result = extractPageContent();
    expect(result.paragraphs[0]).toBe(longText);
  });

  test('handles special characters in text', () => {
    document.body.innerHTML = `
      <h1>Title with & < > " ' éñ</h1>
      <p>Paragraph with & < > " ' éñ</p>
    `;
    const result = extractPageContent();
    expect(result.headings[0]).toBe('Title with & < > " \' éñ');
    expect(result.paragraphs[0]).toBe('Paragraph with & < > " \' éñ');
  });

  describe('Clean Mode', () => {
    test('removes noise elements when cleanMode is true', () => {
      const result = extractPageContent(true);
      // Should not contain content from nav, header, footer, aside, etc.
      expect(result.paragraphs).not.toContain('Navigation');
      expect(result.paragraphs).not.toContain('Header');
      expect(result.paragraphs).not.toContain('Footer');
      expect(result.paragraphs).not.toContain('Sidebar');
      expect(result.paragraphs).not.toContain('Advertisement');
      expect(result.paragraphs).not.toContain('Cookie Banner');
    });

    test('preserves content elements in clean mode', () => {
      const result = extractPageContent(true);
      expect(result.headings).toContain('Main Heading');
      expect(result.paragraphs).toContain('First paragraph.');
      expect(result.links).toHaveLength(3);
      expect(result.images).toHaveLength(2);
    });

    test('works with default cleanMode false', () => {
      const result = extractPageContent(false);
      expect(result.paragraphs).toContain('First paragraph.');
      expect(result.paragraphs).toContain('Second paragraph.');
    });

    test('works with undefined cleanMode', () => {
      const result = extractPageContent(undefined);
      expect(result.paragraphs).toContain('First paragraph.');
      expect(result.paragraphs).toContain('Second paragraph.');
    });
  });
});

describe('extractWithSelectors', () => {
  test('extracts content using CSS selectors', () => {
    const result = extractWithSelectors({
      title: '.article-title',
    });
    expect(result.title).toBe('Article Title');
  });

  test('extracts multiple elements with same selector', () => {
    document.body.innerHTML += '<p class="content">Second paragraph</p>';
    const result = extractWithSelectors({
      paragraphs: 'p',
    });
    expect(result.paragraphs).toHaveLength(3); // First, Second, and the added one
  });

  test('returns single string for single match', () => {
    const result = extractWithSelectors({
      title: 'h1.article-title',
    });
    expect(result.title).toBe('Article Title');
    expect(typeof result.title).toBe('string');
  });

  test('returns array for multiple matches', () => {
    document.body.innerHTML += '<h2 class="heading">Heading 2</h2>';
    const result = extractWithSelectors({
      headings: 'h1, h2',
    });
    expect(Array.isArray(result.headings)).toBe(true);
    expect(result.headings).toContain('Main Heading');
    expect(result.headings).toContain('Heading 2');
  });

  test('returns empty for non-matching selectors', () => {
    const result = extractWithSelectors({ nothing: '.does-not-exist' });
    expect(result.nothing).toEqual([]);
  });

  test('skips invalid selectors without throwing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      extractWithSelectors({ bad: '###invalid!!!' })
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      '[Scraper] Invalid selector skipped: "###invalid!!!"'
    );
    warnSpy.mockRestore();
  });

  test('handles complex selectors', () => {
    const result = extractWithSelectors({
      content: 'article.content h1.article-title',
    });
    expect(result.content).toBe('Article Title');
  });

  test('handles attribute selectors', () => {
    document.body.innerHTML += '<div data-custom="Custom Value">Some text</div>';
    const result = extractWithSelectors({
      custom: 'div[data-custom="Custom Value"]',
    });
    expect(result.custom).toBe('Some text');
  });

  test('handles :nth-child and :nth-of-type selectors', () => {
    document.body.innerHTML = `
      <ul>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ul>
    `;
    const result = extractWithSelectors({
      secondItem: 'li:nth-child(2)',
    });
    expect(result.secondItem).toBe('Second item');
  });

  test('handles empty selector values', () => {
    const result = extractWithSelectors({
      empty: '',
      valid: 'h1:not(.article-title)', // Exclude the article title h1
    });
    expect(result.empty).toBeUndefined(); // Invalid selectors are skipped
    expect(result.valid).toBe('Main Heading');
  });

  test('handles selectors with special characters', () => {
    document.body.innerHTML += '<div id="special-id">Special Content</div>';
    const result = extractWithSelectors({
      special: '#special-id',
    });
    expect(result.special).toBe('Special Content');
  });

  describe('Clean Mode with Selectors', () => {
    test('applies clean mode when extracting with selectors', () => {
      // Add content inside noise elements
      document.body.innerHTML += '<nav><p>Nav content</p></nav>';
      const result = extractWithSelectors({
        navContent: 'nav p',
      }, true);
      expect(result.navContent).toEqual([]); // Should be removed in clean mode
    });

    test('preserves content outside noise elements in clean mode', () => {
      const result = extractWithSelectors({
        title: 'h1.article-title',
      }, true);
      expect(result.title).toBe('Article Title');
    });
  });

  describe('Error Handling', () => {
    test('handles selectors that throw errors', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a selector that might cause issues
      const result = extractWithSelectors({
        problematic: '[invalid-attribute^=value]',
      });
      expect(result.problematic).toEqual([]);
      warnSpy.mockRestore();
    });

    test('handles null or undefined elements', () => {
      document.body.innerHTML += '<div data-empty></div>';
      const result = extractWithSelectors({
        empty: 'div[data-empty]',
      });
      expect(result.empty).toEqual([]); // Empty elements result in empty array
    });

    test('handles elements with only whitespace', () => {
      document.body.innerHTML += '<p>   </p>';
      const result = extractWithSelectors({
        whitespace: 'p:last-child',
      });
      expect(result.whitespace).toEqual([]); // Whitespace-only elements result in empty array
    });
  });
});