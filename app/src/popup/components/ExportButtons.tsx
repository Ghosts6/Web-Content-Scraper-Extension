import type { ExportFormat } from '../../scraper/formatter';
import { format, getMimeType, getFileExtension } from '../../scraper/formatter';
import type { ExtractedContent } from '../../scraper/extractor';

interface ExportButtonsProps {
  data: ExtractedContent | null;
}

const FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Text', value: 'text' },
];

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(content: string): Promise<void> {
  await navigator.clipboard.writeText(content);
}

export function ExportButtons({ data }: ExportButtonsProps) {
  if (!data) return null;

  const slugTitle = (data.title || 'page')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">
        Export As
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FORMATS.map(({ label, value }) => (
          <button
            key={value}
            className="btn-primary text-sm py-1.5"
            onClick={() => {
              const content = format(data, value);
              const ext = getFileExtension(value);
              const mime = getMimeType(value);
              downloadFile(content, `${slugTitle}.${ext}`, mime);
            }}
          >
            ↓ {label}
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mt-2">
        Copy To Clipboard
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FORMATS.map(({ label, value }) => (
          <button
            key={value}
            className="btn-secondary text-sm py-1.5"
            onClick={async () => {
              const content = format(data, value);
              await copyToClipboard(content);
            }}
          >
            ⎘ {label}
          </button>
        ))}
      </div>
    </div>
  );
}
