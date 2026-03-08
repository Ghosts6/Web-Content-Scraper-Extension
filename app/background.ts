// Background script for the extension
import browser from 'webextension-polyfill';

// Handle messages from content scripts or popup
browser.runtime.onMessage.addListener((message: any, _sender: any) => {
  // Handle scraping requests, etc.
  console.log('Message received:', message);
});