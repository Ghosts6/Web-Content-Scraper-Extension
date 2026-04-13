![banner](https://github.com/Ghosts6/Local-website/blob/main/img/Baner.png)

# 🕸️ Web Content Scraper Extension

A browser extension that extracts structured content from any webpage and exports it in multiple formats. Built for developers, researchers, and data collectors who need clean, structured page data without writing custom scraping scripts.

Supports **Firefox**.

---

## 🎬 Demo

https://github.com/user-attachments/assets/746b2c39-91ed-4639-b4a8-edd8dfd877ca

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
| Batch Scraping | Provide a list of URLs and scrape them all in one run with smart rule application |
| Data Sync | Rules and preferences sync across devices via `storage.sync` |
| Advanced Settings | Configure scraping preferences, timeouts, and batch processing options |

---

## 🛠️ Tech Stack

| Area | Tool |
|---|---|
| UI & bundling | Vite + React + TypeScript |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Browser API | WebExtensions API + `webextension-polyfill` |
| Testing | Jest + Testing Library + jsdom |
| CI/CD | GitHub Actions + Docker |
| Target browsers | Firefox |
| Package management | npm |

---

## 📁 Project Structure

```
app/
 ├── src/
 │   ├── background.ts              # Service worker - message routing between popup and content
 │   ├── content.ts                 # Injected into pages - DOM scraping and element picker
 │   ├── content-picker.ts          # Visual element picker UI and interaction handling
 │   ├── scraper/
 │   │   ├── extractor.ts           # Core content extraction logic
 │   │   ├── html-parser.ts         # HTML parsing with URL resolution
 │   │   ├── selector-builder.ts    # CSS selector generation from DOM elements
 │   │   ├── batch-scraper.ts       # Multi-URL batch scraping functionality
 │   │   └── formatter.ts           # JSON / XML / Markdown / plain text formatters
 │   ├── popup/
 │   │   ├── App.tsx                # Main popup UI and view routing
 │   │   └── components/
 │   │       ├── MainView.tsx       # Main interface with scraping options
 │   │       ├── SelectorsView.tsx  # Custom selector configuration
 │   │       ├── Preview.tsx        # Tabbed content preview with per-item removal
 │   │       ├── ExportButtons.tsx  # Download and clipboard export controls
 │   │       ├── BatchView.tsx      # Batch URL input and progress
 │   │       ├── BatchResultsView.tsx # Batch results display and export
 │   │       ├── RulesView.tsx      # Saved site rules management
 │   │       └── SettingsView.tsx   # User preferences and settings
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

# Build
npm run build
```

Built extensions are output to `app/dist/firefox`.

### Run with Docker

```bash
# Build and run Firefox variant
docker compose up
```

### Run Tests

```bash
cd app
npm test
```

---

## 🔌 Loading the Extension in Dev Mode

### Firefox

1. Build: `npm run build`
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** in the left sidebar
4. Click **Load Temporary Add-on**
5. Open the `app/dist/firefox` folder and select `manifest.json`
6. The extension icon appears in your toolbar

> Temporary add-ons in Firefox are removed when the browser closes. Repeat these steps after each restart.

### Using Docker Builds with the Browser

Docker builds write output to `app/dist/firefox` on your host machine via the volume mount. Load that folder exactly the same way as above - Docker only handles the build step, not the browser loading.

---

## 🎯 Goal

Provide a comprehensive browser scraping tool that lets users extract structured content from any webpage without writing custom scripts. Features visual element selection, batch processing, site-specific rule profiles, and flexible export options to handle diverse scraping needs while maintaining ease of use.

---

## 📄 License

MIT - see [LICENSE](./LICENSE) for details.
