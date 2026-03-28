import type { ExtractedContent, CustomExtractedContent } from './extractor';

export type ExportFormat = 'json' | 'xml' | 'markdown' | 'text';

// ─── JSON ────────────────────────────────────────────────────────────────────

export function toJSON(data: ExtractedContent | CustomExtractedContent): string {
  return JSON.stringify(data, null, 2);
}

// ─── XML ─────────────────────────────────────────────────────────────────────

export function toXML(data: ExtractedContent): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const tag = (name: string, content: string, indent = '') =>
    `${indent}<${name}>${content}</${name}>`;

  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<page>'];

  lines.push(`  ${tag('url', esc(data.url))}`);
  lines.push(`  ${tag('title', esc(data.title))}`);

  // Metadata
  lines.push('  <metadata>');
  if (data.metadata.author !== undefined)
    lines.push(`    ${tag('author', esc(data.metadata.author))}`);
  if (data.metadata.description !== undefined)
    lines.push(`    ${tag('description', esc(data.metadata.description))}`);
  if (data.metadata.keywords !== undefined)
    lines.push(`    ${tag('keywords', esc(data.metadata.keywords))}`);
  lines.push('  </metadata>');

  // Headings
  lines.push('  <headings>');
  data.headings.forEach((h) => lines.push(`    ${tag('heading', esc(h))}`));
  lines.push('  </headings>');

  // Paragraphs
  lines.push('  <paragraphs>');
  data.paragraphs.forEach((p) =>
    lines.push(`    ${tag('paragraph', esc(p))}`)
  );
  lines.push('  </paragraphs>');

  // Lists
  lines.push('  <lists>');
  data.lists.forEach((list, i) => {
    lines.push(`    <list index="${i}">`);
    list.forEach((item) => lines.push(`      ${tag('item', esc(item))}`));
    lines.push('    </list>');
  });
  lines.push('  </lists>');

  // Links
  lines.push('  <links>');
  data.links.forEach((l) =>
    lines.push(
      `    <link url="${esc(l.url)}">${esc(l.text)}</link>`
    )
  );
  lines.push('  </links>');

  // Images
  lines.push('  <images>');
  data.images.forEach((img) =>
    lines.push(
      `    <image src="${esc(img.src)}" alt="${esc(img.alt)}" />`
    )
  );
  lines.push('  </images>');

  // Custom Fields
  if (data.custom && Object.keys(data.custom).length > 0) {
    lines.push('  <custom_fields>');
    Object.entries(data.custom).forEach(([key, val]) => {
      const content = Array.isArray(val) ? val.map(v => tag('item', esc(v))).join('') : esc(val);
      lines.push(`    ${tag(key.replace(/[^a-zA-Z0-9]/g, '_'), content)}`);
    });
    lines.push('  </custom_fields>');
  }

  lines.push('</page>');
  return lines.join('\n');
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

export function toMarkdown(data: ExtractedContent): string {
  const sections: string[] = [];

  sections.push(`# ${data.title}`);
  sections.push(`> URL: ${data.url}`);

  if (
    data.metadata.author ||
    data.metadata.description ||
    data.metadata.keywords
  ) {
    sections.push('## Metadata');
    if (data.metadata.author)
      sections.push(`- **Author:** ${data.metadata.author}`);
    if (data.metadata.description)
      sections.push(`- **Description:** ${data.metadata.description}`);
    if (data.metadata.keywords)
      sections.push(`- **Keywords:** ${data.metadata.keywords}`);
  }

  if (data.headings.length) {
    sections.push('## Headings');
    data.headings.forEach((h) => sections.push(`- ${h}`));
  }

  if (data.paragraphs.length) {
    sections.push('## Content');
    data.paragraphs.forEach((p) => sections.push(p));
  }

  if (data.lists.length) {
    sections.push('## Lists');
    data.lists.forEach((list, i) => {
      sections.push(`### List ${i + 1}`);
      list.forEach((item) => sections.push(`- ${item}`));
    });
  }

  if (data.links.length) {
    sections.push('## Links');
    data.links.forEach((l) => sections.push(`- [${l.text}](${l.url})`));
  }

  if (data.images.length) {
    sections.push('## Images');
    data.images.forEach((img) =>
      sections.push(`- ![${img.alt}](${img.src})`)
    );
  }

  if (data.custom && Object.keys(data.custom).length > 0) {
    sections.push('## Custom Fields');
    Object.entries(data.custom).forEach(([key, val]) => {
      sections.push(`### ${key}`);
      if (Array.isArray(val)) {
        val.forEach(v => sections.push(`- ${v}`));
      } else {
        sections.push(val);
      }
    });
  }

  return sections.join('\n\n');
}

// ─── Plain Text ───────────────────────────────────────────────────────────────

export function toPlainText(data: ExtractedContent): string {
  const lines: string[] = [];

  lines.push(data.title.toUpperCase());
  lines.push(`URL: ${data.url}`);
  lines.push('='.repeat(60));

  if (data.metadata.author) lines.push(`Author: ${data.metadata.author}`);
  if (data.metadata.description)
    lines.push(`Description: ${data.metadata.description}`);
  lines.push('');

  if (data.headings.length) {
    lines.push('HEADINGS');
    lines.push('-'.repeat(30));
    data.headings.forEach((h) => lines.push(`  ${h}`));
    lines.push('');
  }

  if (data.paragraphs.length) {
    lines.push('CONTENT');
    lines.push('-'.repeat(30));
    data.paragraphs.forEach((p) => lines.push(p));
    lines.push('');
  }

  if (data.lists.length) {
    lines.push('LISTS');
    lines.push('-'.repeat(30));
    data.lists.forEach((list, i) => {
      lines.push(`List ${i + 1}:`);
      list.forEach((item) => lines.push(`  • ${item}`));
    });
    lines.push('');
  }

  if (data.links.length) {
    lines.push('LINKS');
    lines.push('-'.repeat(30));
    data.links.forEach((l) => lines.push(`  ${l.text}: ${l.url}`));
    lines.push('');
  }

  if (data.custom && Object.keys(data.custom).length > 0) {
    lines.push('CUSTOM FIELDS');
    lines.push('-'.repeat(30));
    Object.entries(data.custom).forEach(([key, val]) => {
      lines.push(`${key.toUpperCase()}:`);
      if (Array.isArray(val)) {
        val.forEach(v => lines.push(`  • ${v}`));
      } else {
        lines.push(`  ${val}`);
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

export function format(
  data: ExtractedContent,
  exportFormat: ExportFormat
): string {
  switch (exportFormat) {
    case 'json':
      return toJSON(data);
    case 'xml':
      return toXML(data);
    case 'markdown':
      return toMarkdown(data);
    case 'text':
      return toPlainText(data);
  }
}

export function getMimeType(exportFormat: ExportFormat): string {
  switch (exportFormat) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'markdown':
      return 'text/markdown';
    case 'text':
      return 'text/plain';
  }
}

export function getFileExtension(exportFormat: ExportFormat): string {
  switch (exportFormat) {
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'markdown':
      return 'md';
    case 'text':
      return 'txt';
  }
}
