# Privacy Policy - Web Content Scraper

Effective date: 2026-04-13

This Privacy Policy explains how the **Web Content Scraper** browser extension ("extension", "we", "our") handles data.

## Overview

Web Content Scraper helps users extract structured content from webpages they intentionally choose.  
We design the extension to process data locally and keep permission usage limited to core scraping features.

## Mozilla Add-ons Privacy Disclosure

In accordance with Mozilla's Add-on policies, this extension processes:

- **Website content** (content from pages the user chooses to scrape)

The extension does **not** collect, store, or transmit any personal data, tracking information, or browsing history to any external servers. All data extraction and processing occurs 100% locally within your browser.

## Data We Process

1. **Website content selected by the user**
   - Text, links, images, headings, metadata, and similar page content.
   - Processed locally to generate extraction results and export files.

2. **Extension preferences and rules**
   - User settings (for example clean mode and batch preferences).
   - Domain-specific selector rules saved by the user.
   - These are stored using the browser's `storage.sync` API to allow synchronization across your Firefox instances.

## How Data Is Used

We use data only to provide extension functionality:

- Scrape and structure page content requested by the user.
- Show preview and export results (JSON, XML, Markdown, Text).
- Save user preferences and reusable selector rules for your convenience.

We do not use data for advertising, profiling, analytics, or any other purposes.

## Data Sharing and Selling

We do **not** sell user data.  
We do **not** transfer user data to third parties. There is no backend server involved in the operation of this extension.

## Storage and Retention

- **User Rules & Preferences:** Stored in Firefox's internal extension storage (`storage.sync` and `storage.local`).
- **Extracted Content:** Held in temporary memory during the session and cleared when the popup is closed or the user navigates away.
- **User Control:** Users can delete saved rules at any time via the "Rules" view or by clearing extension data.

## Permissions and Why They Are Needed

- `activeTab`: To access and scrape the content of the page you are currently viewing.
- `scripting`: To inject the extraction logic and the visual element picker into the page.
- `storage`: To save your custom selector rules and scraper preferences.
- `tabs`: To coordinate scraping across multiple tabs during batch workflows.
- `optional_host_permissions` (`<all_urls>`): Requested only when using the **Batch Scraper**. This allows the extension to fetch content from multiple domains you specify in your batch list.

## Remote Code

The extension does **not** execute remote code (no remote scripts, no `eval()`).  
All executable code is bundled locally within the extension package.

## Security

We adhere to the principle of least privilege, only requesting permissions necessary for the extension's core functionality. By using optional permissions for batch scraping, we ensure the extension only has broad website access when you explicitly grant it for that specific task.

## Children's Privacy

This extension does not collect any personal information and is safe for use by all ages.

## Changes to This Policy

We may update this policy if browser requirements or extension features change. The "Effective date" will be updated accordingly.

## Contact

If you have privacy questions, contact:

- Email: `kiarash@kiarashbashokian.com`
- Website: `https://kiarashbashokian.com/`
