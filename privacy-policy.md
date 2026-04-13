# Privacy Policy - Web Content Scraper

Effective date: 2026-04-13

This Privacy Policy explains how the **Web Content Scraper** browser extension ("extension", "we", "our") handles data.

## Overview

Web Content Scraper helps users extract structured content from webpages they intentionally choose.  
We design the extension to process data locally and keep permission usage limited to core scraping features.

## Chrome Web Store Privacy Disclosure

For Chrome Web Store disclosure categories, this extension may process:

- **Website content** (content from pages the user chooses to scrape)

The extension does **not** collect or process the following categories as part of its intended behavior:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- Web history (outside user-triggered scraping actions)
- User activity monitoring (such as keylogging or continuous tracking)

## Data We Process

1. **Website content selected by the user**
   - Text, links, images, headings, metadata, and similar page content.
   - Processed to generate extraction results and export files.

2. **Extension preferences and rules**
   - User settings (for example clean mode and batch preferences).
   - Domain-specific selector rules saved by the user.

## How Data Is Used

We use data only to provide extension functionality:

- Scrape and structure page content requested by the user
- Show preview and export results (JSON, XML, Markdown, Text)
- Save user preferences and reusable selector rules

We do not use data for advertising, profiling, credit scoring, or lending decisions.

## Data Sharing and Selling

We do **not** sell user data.  
We do **not** transfer user data to third parties except as required by law.

## Storage and Retention

- Data is stored in browser extension storage for user settings/rules.
- Extracted content is handled for user-requested operations.
- Users control their data by removing saved rules/settings or uninstalling the extension.

## Permissions and Why They Are Needed

- `activeTab`: Access the active tab when the user triggers scraping.
- `scripting`: Inject packaged content scripts for scraping and element picker features.
- `storage`: Save preferences and domain rules.
- `tabs`: Support active-tab context and user-initiated batch workflows.
- Optional host permission (`<all_urls>`): Requested at runtime only when user enables broader/batch scraping.

## Remote Code

The extension does **not** execute remote code.  
All executable code is bundled with the extension package.

## Security

We aim to follow least-privilege and secure development practices, including minimizing permissions and limiting data use to the extension's single purpose.

## Children's Privacy

This extension is not directed to children under 13, and we do not knowingly collect personal information from children.

## Changes to This Policy

We may update this policy when product behavior or legal requirements change.  
The "Effective date" will be updated when revisions are made.

## Contact

If you have privacy questions, contact:

- Email: `kiarash@kiarashbashokian.com`
- Website: `https://kiarashbashokian.com/`
