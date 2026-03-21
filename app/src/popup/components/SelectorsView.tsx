import React from 'react';
import { CustomSelectors } from '../../scraper/extractor';
import { Status } from '../App';
import { CleanModeRow } from './CleanModeRow';
import { SubHeader } from './SubHeader';

interface SelectorsViewProps {
  cleanMode: boolean;
  onCleanModeChange: (value: boolean) => void;
  selectorRows: { field: string; selector: string }[];
  onSelectorRowsChange: (rows: { field: string; selector: string }[]) => void;
  pickerTargetIdx: number | null;
  onActivatePicker: (idx: number) => void;
  onCustomScrape: () => void;
  onSaveRule: () => void;
  onViewRules: () => void;
  onBack: () => void;
  status: Status;
}

export function SelectorsView({
  cleanMode,
  onCleanModeChange,
  selectorRows,
  onSelectorRowsChange,
  pickerTargetIdx,
  onActivatePicker,
  onCustomScrape,
  onSaveRule,
  onViewRules,
  onBack,
  status,
}: SelectorsViewProps) {
  const handleFieldChange = (idx: number, field: string) => {
    onSelectorRowsChange(selectorRows.map((r, i) => i === idx ? { ...r, field } : r));
  };

  const handleSelectorChange = (idx: number, selector: string) => {
    onSelectorRowsChange(selectorRows.map((r, i) => i === idx ? { ...r, selector } : r));
  };

  const handleAddRow = () => {
    onSelectorRowsChange([...selectorRows, { field: '', selector: '' }]);
  };

  const handleRemoveRow = (idx: number) => {
    onSelectorRowsChange(selectorRows.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeader
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}
        title="CSS Selectors"
        subtitle="Target specific elements on any site"
        titleGradient="linear-gradient(90deg, #3730a3 0%, #6366f1 60%, #d97706 100%)"
        dividerColor="linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(245,158,11,0.2) 55%, transparent 100%)"
        onBack={onBack}
      />

      <CleanModeRow checked={cleanMode} onChange={onCleanModeChange} />

      <div className="gb-card" style={{ padding: '14px 16px' }}>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1" style={{ marginBottom: 10 }}>
          {selectorRows.map((row, idx) => (
            <div key={idx} className="flex gap-1 items-center">
              <input
                className="input-base text-xs py-1.5 w-24 shrink-0"
                placeholder="field"
                value={row.field}
                onChange={e => handleFieldChange(idx, e.target.value)}
              />
              <input
                className="input-base text-xs py-1.5 flex-1 min-w-0"
                placeholder="selector"
                value={row.selector}
                onChange={e => handleSelectorChange(idx, e.target.value)}
              />
              <button
                className={`px-2 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${pickerTargetIdx === idx ? 'bg-accent-500 text-accent-950' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'}`}
                title="Pick element"
                onClick={() => onActivatePicker(idx)}
              >
                🎯
              </button>
              <button
                className="text-danger-400 hover:text-danger-600 text-xs px-1 shrink-0"
                onClick={() => handleRemoveRow(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary w-full text-xs"
          style={{ marginBottom: 8 }}
          onClick={handleAddRow}
        >
          + Add Field
        </button>
        <button
          className="btn-primary w-full text-sm"
          style={{ marginBottom: 8 }}
          onClick={onCustomScrape}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Scraping…' : '⚡ Scrape with Selectors'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
          <button
            className="btn-accent text-sm"
            onClick={onSaveRule}
            disabled={status === 'loading'}
          >
            💾 Save Rule for Domain
          </button>
          <button
            className="lift-btn"
            onClick={onViewRules}
            title="Manage saved rules"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.22)',
              background: 'rgba(99,102,241,0.05)',
              color: '#4f46e5',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg> Saved
          </button>
        </div>
      </div>
    </div>
  );
}