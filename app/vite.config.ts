import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

// Function to generate the manifest
const generateManifest = (browser: string) => {
  const baseManifest = {
    manifest_version: 3,
    name: 'Web Content Scraper',
    version: '1.0',
    description: 'Extract structured content from any webpage',
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    action: {
      default_popup: 'popup.html',
    },
    content_scripts: [
      {
        js: ['src/content.ts'],
        matches: ['<all_urls>'],
      },
    ],
    icons: {
      '16': 'icons/icon16x16.png',
      '32': 'icons/icon32x32.png',
      '48': 'icons/icon48x48.png',
      '128': 'icons/icon128x128.png',
    },
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    optional_permissions: ['<all_urls>'],
  };

  if (browser === 'firefox') {
    return {
      ...baseManifest,
      background: {
        scripts: ['src/background.ts'],
      },
      browser_specific_settings: {
        gecko: {
          id: 'kiarash82.42@gmail.com',   // AMO account email
          strict_min_version: '109.0',
        },
      },
    };
  }

  // Default to Chrome
  return {
    ...baseManifest,
    background: {
      service_worker: 'src/background.ts',
    },
  };
};

export default defineConfig(({ mode }) => {
  const browser = process.env.TARGET_BROWSER || 'chrome'; // Default to chrome

  return {
    plugins: [
      react(),
      webExtension({
        manifest: () => generateManifest(browser),
        browser: browser,
        rollupInputOptions: {
          input: {
            popup: path.resolve(__dirname, 'popup.html'),
            content: path.resolve(__dirname, 'src/content.ts'),
            background: path.resolve(__dirname, 'src/background.ts'),
          },
        },
      }),
    ],
    publicDir: 'src/public',
    build: {
      outDir: path.resolve(__dirname, 'dist', browser),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});