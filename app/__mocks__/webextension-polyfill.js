let storageData = {};

const mockBrowser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn(),
  },
  tabs: {
    query: jest.fn((queryInfo) => {
      if (queryInfo && queryInfo.active && queryInfo.currentWindow) {
        return Promise.resolve([{ id: 1, url: 'https://mock.com', title: 'Mock Tab' }]);
      }
      if (queryInfo && Object.keys(queryInfo).length === 0) {
        return Promise.resolve([
          { id: 1, url: 'https://mock1.com', title: 'Mock Tab 1' },
          { id: 2, url: 'https://mock2.com', title: 'Mock Tab 2' },
        ]);
      }
      return Promise.resolve([]); // Default to empty array
    }),
    sendMessage: jest.fn().mockResolvedValue({}), // Default resolved value for sendMessage
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn((keys) => {
        if (keys === null) {
          return Promise.resolve({ ...storageData });
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storageData[keys] });
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (storageData[key] !== undefined) {
              result[key] = storageData[key];
            }
          });
          return Promise.resolve(result);
        }
        return Promise.resolve({});
      }),
      set: jest.fn((data) => {
        for (const key in data) {
          storageData[key] = data[key];
        }
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storageData = {}; // Reset storageData for isolation
        return Promise.resolve();
      }),
      remove: jest.fn((keys) => {
        if (typeof keys === 'string') {
          delete storageData[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach(key => delete storageData[key]);
        }
        return Promise.resolve();
      }),
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
    executeScript: jest.fn().mockResolvedValue([]),
  },
};

module.exports = mockBrowser;