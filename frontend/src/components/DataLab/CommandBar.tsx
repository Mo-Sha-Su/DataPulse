import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, MousePointerClick } from 'lucide-react';
import { ColumnDataType } from '../../types/dataCleaning';
import { getGroups, LabAction, LabGroup, OperationScope, disabledReason } from './labActions';
import { useLanguage } from '../../i18n/LanguageContext';
import { localizeDataType } from '../../utils/columnProfile';
import { GridSelection, formatActingOnTarget } from '../../utils/gridSelection';

interface Props {
  actions: LabAction[];
  selectedColumn: string | null;
  selectedType?: ColumnDataType;
  selection?: GridSelection;
  operationScope?: OperationScope;
  onChangeOperationScope?: (scope: OperationScope) => void;
  hasSelectedCell?: boolean;
  onOpenPalette: () => void;
}

export const CommandBar: React.FC<Props> = ({
  actions,
  selectedColumn,
  selectedType,
  selection,
  operationScope = 'column',
  onChangeOperationScope,
  hasSelectedCell,
  onOpenPalette,
}) => {
  const { t, isRtl } = useLanguage();
  const [open, setOpen] = useState<LabGroup | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 96, left: 8, width: 440 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const groups = getGroups(t);
  const actingTarget = selection ? formatActingOnTarget(selection, t) : null;
  const isCellSelected = hasSelectedCell ?? selection?.kind === 'cell';
  const effectiveScope: OperationScope = isCellSelected && operationScope === 'cell' ? 'cell' : 'column';
  const reasonOpts = { scope: effectiveScope, hasSelectedCell: isCellSelected };

  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      const btn = btnRefs.current[open];
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      const width = Math.min(460, Math.max(260, vw - 16));
      if (!btn) {
        setMenuPos({ top: 96, left: 8, width });
        return;
      }
      const rect = btn.getBoundingClientRect();
      const rawLeft = isRtl ? rect.right - width : rect.left;
      const left = Math.max(8, Math.min(rawLeft, vw - width - 8));
      const top = Math.min(rect.bottom + 6, vh - 180);
      setMenuPos({ top, left, width });
    };
    updatePos();
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('resize', updatePos);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open, isRtl]);

  const activeGroup = open ? groups.find((g) => g.id === open) || null : null;
  const activeItems = activeGroup ? actions.filter((a) => a.group === activeGroup.id) : [];

  return (
    <div ref={ref} className="h-12 shrink-0 px-2.5 sm:px-4 flex items-center gap-2 bg-lab-panel border-b border-lab-line relative z-30 min-w-0">
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
        {groups.map((g) => {
          const items = actions.filter((a) => a.group === g.id);
          const usable = items.filter((a) => !disabledReason(a, selectedColumn, selectedType, t, reasonOpts)).length;
          const isOpen = open === g.id;
          return (
            <button
              key={g.id}
              ref={(el) => { btnRefs.current[g.id] = el; }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.id)}
              className={`h-8 ps-2.5 pe-2 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isOpen ? 'bg-lab-hover border-lab-line-strong text-lab-text' : 'border-transparent text-lab-dim hover:text-lab-text hover:bg-lab-raised'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
              <span>{g.label}</span>
              <span className="font-mono text-[10px] text-lab-faint">{usable}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-lab-faint transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
      </div>

      {isCellSelected && onChangeOperationScope && (
        <div
          role="group"
          aria-label={t('labScopeCellOnly')}
          className="hidden sm:flex items-center p-0.5 rounded-lg border border-lab-line-strong bg-lab-bg text-[11px] shrink-0"
        >
          <button
            type="button"
            aria-pressed={effectiveScope === 'column'}
            onClick={() => onChangeOperationScope('column')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              effectiveScope === 'column'
                ? 'bg-lab-hover text-lab-text shadow-xs'
                : 'text-lab-dim hover:text-lab-text'
            }`}
          >
            {t('labScopeColumn')}
          </button>
          <button
            type="button"
            aria-pressed={effectiveScope === 'cell'}
            onClick={() => onChangeOperationScope('cell')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              effectiveScope === 'cell'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-xs'
                : 'text-lab-dim hover:text-lab-text'
            }`}
          >
            {t('labScopeCellOnly')}
          </button>
        </div>
      )}

      <div
        className={`hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[12px] shrink-0 max-w-[280px] min-w-0 ${
          effectiveScope === 'cell'
            ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
            : actingTarget || selectedColumn
            ? 'border-pulse-400/40 bg-pulse-400/10 text-pulse-200'
            : 'border-lab-line text-lab-faint'
        }`}
      >
        <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
        {actingTarget ? (
          <span className="truncate">
            {t('labActingOn')} <b className="font-semibold text-lab-text" dir="auto">{actingTarget.primary}</b>
            {actingTarget.secondary && (
              <span className="ms-1.5 font-mono text-[10px] text-lab-dim">{actingTarget.secondary}</span>
            )}
            {effectiveScope === 'cell' && (
              <span className="ms-1.5 font-mono text-[10px] font-bold text-amber-300">
                · {t('labScopeCellTag')}
              </span>
            )}
            {effectiveScope !== 'cell' && selectedColumn && selectedType && actingTarget.primary === selectedColumn && (
              <span className="ms-1.5 font-mono text-[10px] text-lab-dim">{localizeDataType(selectedType, t)}</span>
            )}
          </span>
        ) : selectedColumn ? (
          <span className="truncate">
            {t('labActingOn')} <b className="font-semibold text-lab-text" dir="auto">{selectedColumn}</b>
            {selectedType && <span className="ms-1.5 font-mono text-[10px] text-lab-dim">{localizeDataType(selectedType, t)}</span>}
          </span>
        ) : (
          <span className="truncate">{t('labClickColHint')}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="h-8 px-2 sm:ps-2.5 sm:pe-1.5 rounded-lg flex items-center gap-2 text-[12px] text-lab-dim border border-lab-line-strong bg-lab-bg hover:text-lab-text hover:border-pulse-400/50 transition-colors shrink-0 cursor-pointer"
        aria-label={t('labSearchAllActions')}
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden md:inline">{t('labFindAction')}</span>
        <kbd dir="ltr" className="hidden md:inline font-mono text-[10px] px-1.5 py-0.5 rounded bg-lab-raised border border-lab-line-strong text-lab-dim">Ctrl K</kbd>
      </button>

      {activeGroup && (
        <div
          role="menu"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          className="lab-pop fixed z-50 rounded-2xl border border-lab-line-strong bg-lab-panel shadow-2xl shadow-black/50 p-2"
        >
          <div className="px-2.5 pt-1.5 pb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: activeGroup.color }}>{activeGroup.label}</p>
              <p className="text-[11px] text-lab-dim">{activeGroup.blurb}</p>
            </div>
            {effectiveScope === 'cell' && selection?.kind === 'cell' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/35 shrink-0">
                {t('labRowOnlyTag', { row: selection.rowIndex + 1 })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[min(360px,calc(100dvh-10rem))] overflow-y-auto lab-scroll pe-1">
            {activeItems.map((a) => {
              const why = disabledReason(a, selectedColumn, selectedType, t, reasonOpts);
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="menuitem"
                  disabled={!!why}
                  title={why || a.hint}
                  onClick={() => { setOpen(null); a.run(); }}
                  className={`text-start rounded-xl px-2.5 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                    why ? 'opacity-35 cursor-not-allowed' : a.danger ? 'hover:bg-rose-400/10' : 'hover:bg-lab-hover'
                  }`}
                >
                  <span className="mt-0.5 w-6 h-6 rounded-md grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${activeGroup.color} 14%, transparent)`, color: activeGroup.color }}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[12.5px] font-semibold leading-tight ${a.danger ? 'text-rose-300' : 'text-lab-text'}`}>{a.label}</span>
                    <span className="block text-[11px] text-lab-dim leading-snug mt-0.5">{why || a.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
