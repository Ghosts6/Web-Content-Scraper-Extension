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
