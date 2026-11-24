import React, { useState } from 'react';
import { FactTable, DimensionTable } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Box,
  Layers,
} from 'lucide-react';

interface Props {
  table: FactTable | DimensionTable;
  type: 'FACT' | 'DIM';
  isHighlighted?: boolean;
  searchQuery?: string;
  onMouseDownDrag: (e: React.MouseEvent, tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onStartConnect?: (tableId: string, colName: string) => void;
}

export const TableCard: React.FC<Props> = ({
  table,
  type,
  isHighlighted,
  searchQuery = '',
  onMouseDownDrag,
  onDeleteTable,
  onStartConnect,
}) => {
  const { t, dir } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(table.isExpanded !== false);
  const [showMenu, setShowMenu] = useState(false);

  const isFact = type === 'FACT';
  const fact = isFact ? (table as FactTable) : null;
  const dim = !isFact ? (table as DimensionTable) : null;

  const headerBg = isFact
    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';

  const badgeBg = isFact ? 'bg-amber-700/60 text-white' : 'bg-emerald-800/60 text-white';

  const matchesSearch = (text: string) => {
    if (!searchQuery) return false;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div
      dir={dir}
      style={{
        position: 'absolute',
        left: `${table.position.x}px`,
        top: `${table.position.y}px`,
        width: '260px',
      }}
      className={`rounded-2xl border bg-white shadow-lg transition-shadow select-none group ${
        isHighlighted
          ? 'ring-3 ring-sky-500 shadow-2xl z-20 border-sky-400'
          : 'border-slate-300/80 hover:shadow-xl z-10'
      }`}
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={(e) => onMouseDownDrag(e, table.id)}
        className={`p-3 rounded-t-2xl flex items-center justify-between gap-2 cursor-move ${headerBg}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isFact ? <Layers className="w-4 h-4 shrink-0" /> : <Box className="w-4 h-4 shrink-0" />}
          <span dir="auto" className="font-bold text-xs truncate min-w-0 font-mono tracking-tight" title={table.name}>
            {table.name}
          </span>
          <span dir="ltr" className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 ${badgeBg}`}>
            {type}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-white/20 rounded-md transition-colors text-white/90"
            title={isExpanded ? t('dmCardCollapse') : t('dmCardExpand')}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-white/20 rounded-md transition-colors text-white/90"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute end-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteTable(table.id);
                  }}
                  className="w-full px-3 py-1.5 text-start text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('dmCardRemoveTable')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body / Field List */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto font-mono text-[11px] divide-y divide-slate-100">
          {/* Primary Keys */}
          {((isFact && fact?.primaryKey) || (!isFact && dim?.primaryKey)) && (
            <div className="pt-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block px-1.5 pb-0.5 font-sans">
                {t('dmCardPrimaryKey')}
              </span>
              <div
                onClick={() => onStartConnect && onStartConnect(table.id, (isFact ? fact?.primaryKey : dim?.primaryKey)!)}
                className={`flex items-center justify-between px-2 py-1 rounded-lg transition-colors cursor-pointer group/row ${
                  matchesSearch((isFact ? fact?.primaryKey : dim?.primaryKey)!)
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-500 font-bold">🔑</span>
                  <span dir="auto" className="font-bold truncate">{isFact ? fact?.primaryKey : dim?.primaryKey}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-slate-300 group-hover/row:bg-sky-500 shrink-0" />
              </div>
            </div>
          )}

          {/* Foreign Keys (for Fact tables) */}
          {isFact && fact?.foreignKeys && fact.foreignKeys.length > 0 && (
            <div className="pt-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block px-1.5 pb-0.5 font-sans">
                {t('dmCardForeignKeys')}
              </span>
              {fact.foreignKeys.map((fk) => (
                <div
                  key={fk}
                  onClick={() => onStartConnect && onStartConnect(table.id, fk)}
                  className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-colors cursor-pointer group/row ${
                    matchesSearch(fk) ? 'bg-sky-100 text-sky-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sky-500">🔗</span>
                    <span dir="auto" className="truncate">{fk}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-slate-300 group-hover/row:bg-sky-500 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Measures (for Fact tables) */}
          {isFact && fact?.measures && fact.measures.length > 0 && (
            <div className="pt-1.5">
              <span className="text-[9px] uppercase font-bold text-amber-600 block px-1.5 pb-0.5 font-sans">
                {t('dmCardMeasures')}
              </span>
              {fact.measures.map((m) => (
                <div
                  key={m}
                  className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-colors ${
                    matchesSearch(m) ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-amber-500 font-semibold">📐</span>
                    <span dir="auto" className="truncate font-semibold">{m}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attributes (for Dimension tables) */}
          {!isFact && dim?.attributes && dim.attributes.length > 0 && (
            <div className="pt-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block px-1.5 pb-0.5 font-sans">
                {t('dmCardAttributes')}
              </span>
              {dim.attributes.map((attr) => (
                <div
                  key={attr}
                  className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-colors ${
                    matchesSearch(attr) ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400">🏷️</span>
                    <span dir="auto" className="truncate">{attr}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hierarchies (for Dimension tables) */}
          {!isFact && dim?.hierarchies && dim.hierarchies.length > 0 && (
            <div className="pt-1.5">
              <span className="text-[9px] uppercase font-bold text-teal-600 block px-1.5 pb-0.5 font-sans">
                {t('dmCardHierarchies')}
              </span>
              {dim.hierarchies.map((hier) => (
                <div key={hier.id} className="p-1.5 bg-teal-50/60 border border-teal-200/80 rounded-lg space-y-0.5">
                  <span dir="auto" className="text-[10px] font-bold text-teal-900 block font-sans">{hier.name}</span>
                  <div className="text-[9px] text-teal-700 flex flex-wrap gap-1">
                    {hier.levels.map((lvl, idx) => (
                      <span key={idx} className="flex items-center gap-0.5">
                        <span dir="auto">{lvl}</span>
                        {idx < hier.levels.length - 1 && <span>›</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Status */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between text-[10px] text-slate-400 font-sans">
        <span>
          {isFact
            ? t('dmCardFooterFact', { measures: fact?.measures.length || 0, keys: fact?.foreignKeys.length || 0 })
            : t('dmCardFooterDim', { fields: (dim?.attributes.length || 0) + 1 })}
        </span>
        <span dir="ltr" className="font-mono uppercase font-bold text-slate-500">{type}</span>
      </div>
    </div>
  );
};
