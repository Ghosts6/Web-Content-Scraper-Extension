![banner](https://github.com/Ghosts6/Local-website/blob/main/img/Baner.png)

# 🕸️ Web Content Scraper Extension

A browser extension that extracts structured content from any webpage and exports it in multiple formats. Built for developers, researchers, and data collectors who need clean, structured page data without writing custom scraping scripts.

Supports **Chrome** and **Firefox**.

---

## 🎬 Demo

Coming soon

---

## ✨ Features

| Feature | Description |
|---|---|
| Page Extraction | Pulls titles, headings (h1–h6), paragraphs, lists, links, images, and metadata from any page |
| Multi-Format Export | Export as JSON, XML, Markdown, or plain text - download to file or copy to clipboard |
| Content Preview & Edit | Review and remove unwanted sections before exporting |
| Custom CSS Selectors | Define your own selectors to target specific elements on any site |
| Visual Element Picker | Click any element on a page and get its CSS selector generated automatically |
| Clean Content Mode | Strips ads, navbars, sidebars, and other noise before extracting |
| Site-Specific Profiles | Save selector rules per domain - applied automatically on revisit |
| Batch Scraping | Provide a list of URLs and scrape them all in one run |
| Data Sync | Rules and preferences sync across devices via `storage.sync` |

---

## 🛠️ Tech Stack

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

## 📁 Project Structure

```
app/
 ├── src/
 │   ├── background.ts              # Service worker - message routing between popup and content
 │   ├── content.ts                 # Injected into pages - DOM scraping and element picker
 │   ├── scraper/
 │   │   ├── extractor.ts           # Core content extraction logic
 │   │   └── formatter.ts           # JSON / XML / Markdown / plain text formatters
 │   ├── popup/
 │   │   ├── App.tsx                # Main popup UI and view routing
 │   │   └── components/
 │   │       ├── Preview.tsx        # Tabbed content preview with per-item removal
 │   │       └── ExportButtons.tsx  # Download and clipboard export controls
 │   ├── storage/
 │   │   └── rules.ts               # Site rule profiles and user preferences
 │   └── styles/
 │       └── tailwind.css           # Tailwind base + custom component classes
 ├── test/
 │   ├── App.test.tsx
 │   ├── background.test.ts
 │   ├── content.test.ts
 │   ├── extractor.test.ts
 │   ├── formatter.test.ts
 │   └── storage.test.ts
 ├── manifest.json
 ├── vite.config.ts
 └── popup.html
```

---

## ⚙️ Setup

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

## 🔌 Loading the Extension in Dev Mode

### Chrome

1. Build: `npm run build:chrome`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** using the toggle in the top right
4. Click **Load unpacked**
5. Select the `app/dist/chrome` folder
6. The extension icon appears in your toolbar

To reload after a code change: rebuild, then click the refresh icon on the extension card.

### Firefox

1. Build: `npm run build:firefox`
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** in the left sidebar
4. Click **Load Temporary Add-on**
5. Open the `app/dist/firefox` folder and select `manifest.json`
6. The extension icon appears in your toolbar

> Temporary add-ons in Firefox are removed when the browser closes. Repeat these steps after each restart.

### Using Docker Builds with the Browser

Docker builds write output to `app/dist/chrome` or `app/dist/firefox` on your host machine via the volume mount. Load that folder exactly the same way as above - Docker only handles the build step, not the browser loading.

---

## 🎯 Goal

Provide a general-purpose browser scraping tool that lets users extract structured content from any webpage without writing scraping scripts, while remaining flexible enough to adapt to different site structures through custom selectors and saved rule profiles.

---

## 📄 License

MIT - see [LICENSE](./LICENSE) for details.