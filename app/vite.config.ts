import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

// Function to generate the manifest
const generateManifest = () => {
  return {
    manifest_version: 3,
    name: 'Web Content Scraper',
    version: '1.0.2',
    description: 'Extract structured content from any webpage',
    author: 'kiarash@kiarashbashokian.com',
    homepage_url: 'https://kiarashbashokian.com/',
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    action: {
      default_popup: 'popup.html',
    },
    icons: {
      '16': 'icons/icon16x16.png',
      '32': 'icons/icon32x32.png',
      '48': 'icons/icon48x48.png',
      '128': 'icons/icon128x128.png',
    },
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    optional_host_permissions: ['<all_urls>'],
    background: {
      scripts: ['src/background.ts'],
    },
    browser_specific_settings: {
      gecko: {
        id: 'web-content-scraper@kiarashbashokian.com',
        strict_min_version: '109.0',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  };
};

export default defineConfig(({ mode }) => {
  const browser = 'firefox';

  return {
    plugins: [
      react(),
      webExtension({
        manifest: () => generateManifest(),
        browser: browser,
        additionalInputs: [
          'src/content.ts',
          'src/content-picker.ts',
        ],
        rollupInputOptions: {
          input: {
            popup: path.resolve(__dirname, 'popup.html'),
            content: path.resolve(__dirname, 'src/content.ts'),
            background: path.resolve(__dirname, 'src/background.ts'),
            'content-picker': path.resolve(__dirname, 'src/content-picker.ts'),
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