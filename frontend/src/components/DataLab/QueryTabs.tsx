import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Plus, X, ChevronDown, Upload, FileCode2, Database } from 'lucide-react';
import { QueryModel } from '../../types/dataCleaning';
import { Dataset } from '../../types/dashboard';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  queries: QueryModel[];
  activeId?: string;
  availableDatasets?: Dataset[];
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onAddFile?: () => void;
  onNewEmptyQuery?: () => void;
  onOpenDataset?: (dataset: Dataset) => void;
  onCloseQuery?: (id: string) => void;
}

export const QueryTabs: React.FC<Props> = ({
  queries,
  activeId,
  availableDatasets = [],
  onSelect,
  onAdd,
  onAddFile,
  onNewEmptyQuery,
  onOpenDataset,
  onCloseQuery,
}) => {
  const { t, isRtl } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 120, left: 12 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Datasets available in the hub that are not currently opened as a tab in Data Lab
  const openIds = new Set(queries.map((q) => q.originalDatasetId || q.id));
  const unopenedDatasets = availableDatasets.filter((d) => !openIds.has(d.id));

  const handleUploadClick = () => {
    setMenuOpen(false);
    if (onAddFile) {
      onAddFile();
    } else if (onAdd) {
      onAdd();
    }
  };

  const handleEmptyQueryClick = () => {
    setMenuOpen(false);
    onNewEmptyQuery?.();
  };

  const handleOpenDatasetClick = (ds: Dataset) => {
    setMenuOpen(false);
    onOpenDataset?.(ds);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const updatePos = () => {
      const btn = triggerRef.current;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const menuW = Math.min(224, vw - 16);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const rawLeft = isRtl ? rect.right - menuW : rect.left;
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rawLeft, vw - menuW - 8)),
      });
    };
    updatePos();
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', updatePos);
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, isRtl]);

  return (
    <div className="h-10 shrink-0 flex items-end gap-1 px-2.5 sm:px-3 bg-lab-bg border-b border-lab-line relative min-w-0">
      <div
        className="flex items-end gap-1 overflow-x-auto no-scrollbar min-w-0"
        role="tablist"
        aria-label={t('labTabsQueriesAria')}
      >
        {queries.map((q) => {
          const on = q.id === activeId;
          return (
            <div
              key={q.id}
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(q.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  // Middle-click tab closure
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseQuery?.(q.id);
                }
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                }
              }}
              title={`${q.name} - ${t('closeTabTip')}`}
              className={`group h-9 -mb-px px-3 rounded-t-xl flex items-center gap-2 text-[12.5px] font-semibold border border-b-0 whitespace-nowrap shrink-0 transition-colors cursor-pointer select-none ${
                on
                  ? 'bg-lab-panel text-lab-text border-lab-line-strong'
                  : 'text-lab-dim border-transparent hover:text-lab-text hover:bg-lab-panel/60'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${on ? 'text-pulse-400' : 'text-lab-faint'}`} />
              <span className="max-w-32 sm:max-w-40 truncate" dir="auto">{q.name}</span>
              <span className="font-mono text-[9px] px-1 rounded bg-lab-raised text-lab-dim uppercase shrink-0">
                {q.sourceType}
              </span>

              {onCloseQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseQuery(q.id);
                  }}
                  className="w-4 h-4 rounded-full hover:bg-rose-500/20 hover:text-rose-300 text-lab-faint flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title={`${t('closeDataset')}: ${q.name}`}
                  aria-label={`${t('closeDataset')}: ${q.name}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add dataset menu */}
      <div className="relative mb-0.5 shrink-0" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-[12px] font-medium text-lab-dim hover:text-lab-text hover:bg-lab-panel transition-colors cursor-pointer border border-transparent hover:border-lab-line-strong whitespace-nowrap"
          title={t('addDatasetMenu')}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <Plus className="w-3.5 h-3.5 text-pulse-400 shrink-0" />
          <span className="hidden sm:inline">{t('addDatasetMenu')}</span>
          <ChevronDown className="w-3 h-3 text-lab-faint shrink-0" />
        </button>

        {menuOpen && (
          <div
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed w-56 max-w-[calc(100vw-1rem)] py-1 bg-lab-panel border border-lab-line-strong rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleUploadClick}
              className="w-full px-3 py-2 text-start flex items-center gap-2.5 text-xs text-lab-text hover:bg-lab-raised transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-pulse-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate">{t('uploadFile')}</span>
                <span className="text-[10px] text-lab-dim" dir="ltr">CSV, XLSX, TSV, JSON</span>
              </div>
            </button>

            {onNewEmptyQuery && (
              <button
                type="button"
                role="menuitem"
                onClick={handleEmptyQueryClick}
                className="w-full px-3 py-2 text-start flex items-center gap-2.5 text-xs text-lab-text hover:bg-lab-raised transition cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{t('newEmptyQuery')}</span>
                  <span className="text-[10px] text-lab-dim truncate">{t('labTabsBlankHint')}</span>
                </div>
              </button>
            )}

            {unopenedDatasets.length > 0 && onOpenDataset && (
              <>
                <div className="my-1 border-t border-lab-line px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-lab-faint uppercase tracking-wider">
                  {t('openExistingDataset')}
                </div>
                <div className="max-h-40 overflow-y-auto lab-scroll">
                  {unopenedDatasets.map((ds) => (
                    <button
                      key={ds.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleOpenDatasetClick(ds)}
                      className="w-full px-3 py-1.5 text-start flex items-center gap-2 text-xs text-lab-text hover:bg-lab-raised transition cursor-pointer truncate"
                      title={ds.name}
                    >
                      <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate flex-1" dir="auto">{ds.name}</span>
                      <span className="text-[9px] text-lab-dim font-mono shrink-0">{ds.rowCount}r</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
