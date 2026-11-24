import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { ColumnDataType } from '../../types/dataCleaning';
import { getGroups, LabAction, OperationScope, disabledReason, searchActions } from './labActions';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  actions: LabAction[];
  selectedColumn: string | null;
  selectedType?: ColumnDataType;
  operationScope?: OperationScope;
  hasSelectedCell?: boolean;
  selectedRowIndex?: number | null;
  onClose: () => void;
}

export const CommandPalette: React.FC<Props> = ({
  actions,
  selectedColumn,
  selectedType,
  operationScope = 'column',
  hasSelectedCell = false,
  selectedRowIndex,
  onClose,
}) => {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => getGroups(t), [t]);
  const effectiveScope: OperationScope = hasSelectedCell && operationScope === 'cell' ? 'cell' : 'column';
  const reasonOpts = useMemo(
    () => ({ scope: effectiveScope, hasSelectedCell }),
    [effectiveScope, hasSelectedCell]
  );

  const results = useMemo(() => {
    const found = searchActions(actions, q);
    return [
      ...found.filter((a) => !disabledReason(a, selectedColumn, selectedType, t, reasonOpts)),
      ...found.filter((a) => disabledReason(a, selectedColumn, selectedType, t, reasonOpts)),
    ];
  }, [actions, q, selectedColumn, selectedType, t, reasonOpts]);

  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  const run = (a?: LabAction) => {
    if (!a || disabledReason(a, selectedColumn, selectedType, t, reasonOpts)) return;
    onClose();
    a.run();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[idx]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-[2px]" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={t('labFindAction')}>
      <div className="lab-pop w-[620px] max-w-[92vw] rounded-2xl border border-lab-line-strong bg-lab-panel shadow-2xl shadow-black/60 overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-lab-line">
          <Search className="w-4 h-4 text-lab-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={
              effectiveScope === 'cell' && selectedColumn && typeof selectedRowIndex === 'number'
                ? `${selectedColumn} · ${t('labRowOnlyTag', { row: selectedRowIndex + 1 })}`
                : selectedColumn
                ? t('labPalettePlaceholderCol', { col: selectedColumn })
                : t('labPalettePlaceholderAll')
            }
            className="flex-1 bg-transparent outline-none text-[15px] text-lab-text placeholder:text-lab-faint"
          />
          {effectiveScope === 'cell' && typeof selectedRowIndex === 'number' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/35 shrink-0">
              {t('labRowOnlyTag', { row: selectedRowIndex + 1 })}
            </span>
          )}
          <kbd dir="ltr" className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-lab-raised border border-lab-line-strong text-lab-dim">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto lab-scroll p-2" role="listbox">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-lab-dim">{t('labPaletteNoMatch', { q })}</p>}
          {results.map((a, i) => {
            const why = disabledReason(a, selectedColumn, selectedType, t, reasonOpts);
            const g = groups.find((x) => x.id === a.group)!;
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                type="button"
                role="option"
                aria-selected={i === idx}
                data-idx={i}
                onMouseMove={() => setIdx(i)}
                onClick={() => run(a)}
                className={`w-full text-start flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${i === idx ? 'bg-lab-hover' : ''} ${why ? 'opacity-40' : ''}`}
              >
                <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${g.color} 14%, transparent)`, color: g.color }}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-lab-text">{a.label}</span>
                  <span className="block text-[11px] text-lab-dim truncate">{why || a.hint}</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: g.color }}>{g.label}</span>
                {i === idx && !why && <CornerDownLeft className="w-3.5 h-3.5 text-lab-faint rtl:scale-x-[-1]" />}
              </button>
            );
          })}
        </div>
        <div className="px-4 h-9 flex items-center gap-4 border-t border-lab-line text-[11px] text-lab-faint">
          <span><kbd dir="ltr" className="font-mono">↑↓</kbd> {t('labPaletteNavigate')}</span>
          <span><kbd dir="ltr" className="font-mono">↵</kbd> {t('labPaletteRun')}</span>
          <span className="flex-1" />
          <span>{t('labPaletteCount', { count: results.length })}</span>
        </div>
      </div>
    </div>
  );
};
