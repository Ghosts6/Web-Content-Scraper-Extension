import browser from 'webextension-polyfill';

/**
 * Opens a URL in a background tab and resolves when the page is fully loaded.
 * Uses tabs.onUpdated instead of a fixed timeout.
 */
export function openAndWaitForLoad(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let tabId: number | null = null;

    const timeout = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(listener);
      reject(new Error(`Timed out loading: ${url}`));
    }, 30_000);

    function listener(
      updatedTabId: number,
      changeInfo: browser.Tabs.OnUpdatedChangeInfoType
    ) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        browser.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve(tabId!);
      }
    }

    browser.tabs.onUpdated.addListener(listener);

    browser.tabs.create({ url, active: false }).then((tab) => {
      if (!tab.id) {
        browser.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        reject(new Error('Failed to create tab'));
        return;
      }
      tabId = tab.id;
    });
  });
}
