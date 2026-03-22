import '@testing-library/jest-dom';

// Mock URL constructor
global.URL = class URL {
  constructor(url: string) {
    this.href = url;
    this.hostname = url.includes('://') ? url.split('://')[1].split('/')[0] : url;
  }
  href: string;
  hostname: string;
};

// Mock fetch
global.fetch = jest.fn().mockImplementation((url: string) => {
  return Promise.resolve({
    ok: true,
    url: url,
    text: () => Promise.resolve(`
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Test Heading</h1>
          <p>Test paragraph</p>
          <a href="https://example.com">Test Link</a>
        </body>
      </html>
    `),
  });
});

// Mock DOMParser
global.DOMParser = class DOMParser {
  parseFromString(html: string) {
    // Simple mock implementation
    return {
      title: html.includes('<title>') ? html.split('<title>')[1].split('</title>')[0] : '',
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      cloneNode: jest.fn(() => ({ querySelectorAll: jest.fn(() => []) })),
    };
  }
};

// Define a basic global browser mock
(global as any).browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn(),
    },
  },
  permissions: {
    contains: jest.fn(),
    request: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Use Jest's virtual mock feature to ensure 'webextension-polyfill' resolves to our global mock
jest.mock('webextension-polyfill', () => (global as any).browser, { virtual: true });
