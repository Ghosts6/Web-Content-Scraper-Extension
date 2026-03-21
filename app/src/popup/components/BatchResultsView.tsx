import React from 'react';
import { ExtractedContent } from '../../scraper/extractor';
import { ExportFormat } from '../../scraper/formatter';
import { SubHeader } from './SubHeader';

interface BatchResultsViewProps {
  batchResults: ExtractedContent[];
  batchExportFormat: ExportFormat;
  onBatchExportFormatChange: (format: ExportFormat) => void;
  onDownloadBatchResults: () => void;
  onBack: () => void;
}

const EXPORT_FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'MD', value: 'markdown' },
  { label: 'TXT', value: 'text' },
];

const ACCENT_STRIPS = [
  'linear-gradient(180deg, #6366f1, #818cf8)',
  'linear-gradient(180deg, #0891b2, #06b6d4)',
  'linear-gradient(180deg, #d97706, #f59e0b)',
];

export function BatchResultsView({
  batchResults,
  batchExportFormat,
  onBatchExportFormatChange,
  onDownloadBatchResults,
  onBack,
}: BatchResultsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeader
        icon={
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))',
            border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        }
        title="Batch Complete"
        subtitle={`${batchResults.length} page${batchResults.length !== 1 ? 's' : ''} scraped successfully`}
        titleGradient="linear-gradient(90deg, #15803d 0%, #16a34a 55%, #4f46e5 100%)"
        dividerColor="linear-gradient(90deg, rgba(34,197,94,0.3) 0%, rgba(99,102,241,0.2) 55%, transparent 100%)"
        onBack={onBack}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          {
            label: 'Pages',
            value: batchResults.length,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.06)',
            border: 'rgba(99,102,241,0.18)'
          },
          {
            label: 'Headings',
            value: batchResults.reduce((s, r) => s + r.headings.length, 0),
            color: '#0891b2',
            bg: 'rgba(8,145,178,0.06)',
            border: 'rgba(8,145,178,0.18)'
          },
          {
            label: 'Links',
            value: batchResults.reduce((s, r) => s + r.links.length, 0),
            color: '#d97706',
            bg: 'rgba(217,119,6,0.06)',
            border: 'rgba(217,119,6,0.18)'
          },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: bg,
            border: `1px solid ${border}`,
            textAlign: 'center'
          }}>
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 16,
              fontWeight: 700,
              color,
              margin: 0,
              lineHeight: 1.2
            }}>{value}</p>
            <p style={{
              fontSize: 9,
              color: '#94a3b8',
              margin: '2px 0 0',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Results list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 180,
        overflowY: 'auto',
        paddingRight: 2
      }}>
        {batchResults.map((result, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'stretch',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
            border: '1px solid rgba(203,213,225,0.6)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ width: 3, flexShrink: 0, background: ACCENT_STRIPS[idx % 3] }} />
            <div style={{ padding: '7px 10px', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {result.title || `Page ${idx + 1}`}
              </p>
              <p style={{
                fontSize: 9.5,
                color: '#94a3b8',
                margin: '2px 0 4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'Courier New', monospace"
              }}>
                {result.url}
              </p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  { n: result.headings.length, l: 'h' },
                  { n: result.paragraphs.length, l: 'p' },
                  { n: result.links.length, l: '↗' },
                  { n: result.images.length, l: '⬜' }
                ].map(({ n, l }) => (
                  <span key={l} style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: 'rgba(241,245,249,0.9)',
                    border: '1px solid rgba(203,213,225,0.6)',
                    color: '#64748b',
                    fontFamily: "'Courier New', monospace"
                  }}>
                    {n} {l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 10px',
              flexShrink: 0
            }}>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: '#cbd5e1',
                letterSpacing: '0.04em'
              }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Format selector + export */}
      {batchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              fontSize: 10,
              color: '#94a3b8',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap'
            }}>Format:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {EXPORT_FORMATS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => onBatchExportFormatChange(value)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    border: `1px solid ${batchExportFormat === value ? 'rgba(99,102,241,0.4)' : 'rgba(203,213,225,0.6)'}`,
                    background: batchExportFormat === value ? 'rgba(99,102,241,0.1)' : 'rgba(241,245,249,0.9)',
                    color: batchExportFormat === value ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="shimmer-btn lift-btn"
            onClick={onDownloadBatchResults}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(90deg, #92400e 0%, #b45309 55%, #d97706 100%)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.025em',
              boxShadow: '0 3px 12px rgba(180,83,9,0.3)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg> Export All as {batchExportFormat.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}