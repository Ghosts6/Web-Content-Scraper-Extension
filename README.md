![baner](https://github.com/Ghosts6/Local-website/blob/main/img/Baner.png)

# Web Content Scraper Extension

A browser extension that extracts structured content from any webpage and exports it in multiple formats. Built for developers, researchers, and data collectors who need structured page data without writing custom scraping scripts.

Supports Chrome and Firefox.

---

## Demo

Coming soon

---

## Features

**Page Extraction** — Automatically pulls titles, headings (h1–h6), paragraphs, lists, links, images, and metadata (author, description, keywords) from any page.

**Multi-Format Export** — Export scraped content as JSON, XML, Markdown, or plain text. Download directly to a file or copy to clipboard.

**Content Preview & Edit** — Review extracted content before exporting. Remove unwanted sections from the preview panel.

**Custom CSS Selectors** — Define your own selectors to target specific elements on any page. Useful for structured, repeatable extraction across different sites.

**Visual Element Picker** — Click any element on a page and the extension generates a CSS selector for it automatically.

**Site-Specific Rule Profiles** — Save selector configurations per domain. The extension applies them automatically when you revisit the site.

**Data Sync** — Rules and preferences sync across devices using the browser's built-in `storage.sync` API.

---

## Tech Stack

| Area | Tool |
|---|---|
| UI & bundling | Vite + React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Browser API | WebExtensions API + `webextension-polyfill` |
| Testing | Jest + Testing Library |
| CI/CD | GitHub Actions + Docker |
| Target browsers | Chrome (Manifest V3), Firefox |

---

## Project Structure

```
extension/
 ├ src/
 │  ├ background.ts          # Service worker — message routing
 │  ├ content.ts             # Injected into pages — DOM scraping & element picker
 │  ├ scraper/
 │  │   ├ extractor.ts       # Content extraction logic
 │  │   └ formatter.ts       # JSON / XML / Markdown / text formatters
 │  ├ popup/
 │  │   ├ App.tsx            # Main popup UI
 │  │   └ components/
 │  │       ├ Preview.tsx    # Content preview panel
 │  │       └ ExportButtons.tsx
 │  └ storage/
 │      └ rules.ts           # Site rule profiles + user preferences
 ├ manifest.json
 └ vite.config.ts
```

---

## Setup

### Requirements

- Node.js 18+
- Docker (optional, for containerized builds)

### Install & Build Locally

```bash
cd app
npm install

# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox
```

Built extensions are output to `app/dist/chrome` and `app/dist/firefox`.

### Run with Docker

```bash
# Build and run both browser variants
docker compose up

# Chrome only
docker compose up chrome

# Firefox only
docker compose up firefox
```

### Run Tests

```bash
cd app
npm test
```

---

## Loading the Extension in Dev Mode

### Chrome

1. Build the extension: `npm run build:chrome`
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `app/dist/chrome` folder
6. The extension icon will appear in your toolbar

To reload after code changes: rebuild, then click the refresh icon on the extension card in `chrome://extensions`.

### Firefox

1. Build the extension: `npm run build:firefox`
2. Open Firefox and go to `about:debugging`
3. Click **This Firefox** in the left sidebar
4. Click **Load Temporary Add-on**
5. Open the `app/dist/firefox` folder and select the `manifest.json` file
6. The extension icon will appear in your toolbar

Note: Temporary add-ons in Firefox are removed when the browser closes. Repeat these steps after each restart.

### Using Docker Builds with the Browser

If you built using Docker, the output is written to `app/dist/chrome` or `app/dist/firefox` on your host machine via the volume mount. Load the folder the same way as described above — Docker just handles the build step.

---

## Goal

Provide a general-purpose browser scraping tool that lets users extract structured content from any webpage without writing scraping scripts, while remaining flexible enough to adapt to different site structures through custom selectors and saved rule profiles.

---

## License

MIT License — see [LICENSE](./LICENSE) for details.