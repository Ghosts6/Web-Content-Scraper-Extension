import { useState } from 'react';
import type { ExtractedContent } from '../../scraper/extractor';

interface PreviewProps {
  data: ExtractedContent;
  onChange: (updated: ExtractedContent) => void;
}

type Section = 'headings' | 'paragraphs' | 'links' | 'images' | 'lists';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'headings', label: 'Headings' },
  { key: 'paragraphs', label: 'Paragraphs' },
  { key: 'links', label: 'Links' },
  { key: 'images', label: 'Images' },
  { key: 'lists', label: 'Lists' },
];

export function Preview({ data, onChange }: PreviewProps) {
  const [activeSection, setActiveSection] = useState<Section>('headings');

  function removeHeading(idx: number) {
    onChange({ ...data, headings: data.headings.filter((_, i) => i !== idx) });
  }

  function removeParagraph(idx: number) {
    onChange({ ...data, paragraphs: data.paragraphs.filter((_, i) => i !== idx) });
  }

  function removeLink(idx: number) {
    onChange({ ...data, links: data.links.filter((_, i) => i !== idx) });
  }

  function removeImage(idx: number) {
    onChange({ ...data, images: data.images.filter((_, i) => i !== idx) });
  }

  function removeList(idx: number) {
    onChange({ ...data, lists: data.lists.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-3">
      {/* Page title & metadata */}
      <div className="card p-3">
        <p className="text-xs text-secondary-400 uppercase font-semibold mb-1">Page</p>
        <p className="font-semibold text-secondary-900 text-sm truncate">{data.title || '(no title)'}</p>
        <p className="text-xs text-secondary-400 truncate">{data.url}</p>
        {data.metadata.author && (
          <p className="text-xs text-secondary-500 mt-1">By {data.metadata.author}</p>
        )}
        {data.metadata.description && (
          <p className="text-xs text-secondary-400 mt-0.5 line-clamp-2">{data.metadata.description}</p>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap">
        {SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeSection === key
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {activeSection === 'headings' &&
          (data.headings.length === 0 ? (
            <EmptyState label="No headings found" />
          ) : (
            data.headings.map((h, i) => (
              <RemovableItem key={i} onRemove={() => removeHeading(i)}>
                <span className="text-sm text-secondary-800">{h}</span>
              </RemovableItem>
            ))
          ))}

        {activeSection === 'paragraphs' &&
          (data.paragraphs.length === 0 ? (
            <EmptyState label="No paragraphs found" />
          ) : (
            data.paragraphs.map((p, i) => (
              <RemovableItem key={i} onRemove={() => removeParagraph(i)}>
                <span className="text-xs text-secondary-700 line-clamp-2">{p}</span>
              </RemovableItem>
            ))
          ))}

        {activeSection === 'links' &&
          (data.links.length === 0 ? (
            <EmptyState label="No links found" />
          ) : (
            data.links.map((l, i) => (
              <RemovableItem key={i} onRemove={() => removeLink(i)}>
                <div>
                  <p className="text-xs font-medium text-primary-600 truncate">{l.text}</p>
                  <p className="text-xs text-secondary-400 truncate">{l.url}</p>
                </div>
              </RemovableItem>
            ))
          ))}

        {activeSection === 'images' &&
          (data.images.length === 0 ? (
            <EmptyState label="No images found" />
          ) : (
            data.images.map((img, i) => (
              <RemovableItem key={i} onRemove={() => removeImage(i)}>
                <div>
                  <p className="text-xs text-secondary-600 truncate">{img.alt || '(no alt)'}</p>
                  <p className="text-xs text-secondary-400 truncate">{img.src}</p>
                </div>
              </RemovableItem>
            ))
          ))}

        {activeSection === 'lists' &&
          (data.lists.length === 0 ? (
            <EmptyState label="No lists found" />
          ) : (
            data.lists.map((list, i) => (
              <RemovableItem key={i} onRemove={() => removeList(i)}>
                <div>
                  <p className="text-xs font-medium text-secondary-600 mb-0.5">
                    List {i + 1} ({list.length} items)
                  </p>
                  <ul className="list-disc list-inside">
                    {list.slice(0, 3).map((item, j) => (
                      <li key={j} className="text-xs text-secondary-500 truncate">
                        {item}
                      </li>
                    ))}
                    {list.length > 3 && (
                      <li className="text-xs text-secondary-400">
                        +{list.length - 3} more…
                      </li>
                    )}
                  </ul>
                </div>
              </RemovableItem>
            ))
          ))}
      </div>
    </div>
  );
}

function RemovableItem({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-secondary-50 hover:bg-secondary-100 transition-colors group">
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={onRemove}
        className="text-secondary-300 hover:text-danger-500 transition-colors text-xs shrink-0 opacity-0 group-hover:opacity-100"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-6 text-secondary-400 text-xs">{label}</div>
  );
}
