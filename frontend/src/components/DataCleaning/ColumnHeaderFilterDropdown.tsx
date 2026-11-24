import React, { useState, useMemo } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import { ColumnDataType } from '../../types/dataCleaning';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  column: string;
  dataType: ColumnDataType;
  rows: Record<string, any>[];
  isOpen: boolean;
  onClose: () => void;
  onApplySort: (direction: 'asc' | 'desc') => void;
  onApplyFilter: (params: {
    column: string;
    operator: string;
    value?: any;
    value2?: any;
    selectedValues?: any[];
  }) => void;
}

export const ColumnHeaderFilterDropdown: React.FC<Props> = ({
  column,
  dataType,
  rows,
  isOpen,
  onClose,
  onApplySort,
  onApplyFilter,
}) => {
  const { t } = useLanguage();
  const [searchVal, setSearchVal] = useState('');
  const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<'none' | 'specific'>('none');
  const [specificOp, setSpecificOp] = useState<string>('equals');
  const [opValue, setOpValue] = useState<string>('');
  const [opValue2, setOpValue2] = useState<string>('');

  // Extract unique values with counts
  const uniqueValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const val = r[column];
      const key = val === null || val === undefined ? '(null)' : String(val);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows, column]);

  const [checkedValues, setCheckedValues] = useState<Set<string>>(
    () => new Set(uniqueValues.map(([val]) => val))
  );

  if (!isOpen) return null;

  const filteredItems = uniqueValues.filter(([val]) =>
    val.toLowerCase().includes(searchVal.toLowerCase())
  );

  const toggleVal = (v: string) => {
    setCheckedValues((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const handleSelectAll = () => {
    setCheckedValues(new Set(uniqueValues.map(([val]) => val)));
  };

  const handleClearAll = () => {
    setCheckedValues(new Set());
  };

  const handleApplyCheckboxFilter = () => {
    // If all checked, no filter needed
    if (checkedValues.size === uniqueValues.length) {
      onClose();
      return;
    }
    const selectedList = Array.from(checkedValues).map((v) => (v === '(null)' ? null : v));
    onApplyFilter({
      column,
      operator: 'in_list',
      selectedValues: selectedList,
    });
    onClose();
  };

  const handleApplySpecificFilter = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilter({
      column,
      operator: specificOp,
      value: opValue,
      value2: opValue2,
    });
    onClose();
  };

  const isNumeric = ['Whole Number', 'Decimal Number', 'Percentage', 'Currency'].includes(dataType);
  const isDate = ['Date', 'Date/Time', 'Time'].includes(dataType);

  return (
    <div
      className="absolute top-full start-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* SORTING ACTIONS */}
      <div className="space-y-0.5 pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            onApplySort('asc');
            onClose();
          }}
          className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ArrowDownAZ className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{isNumeric ? t('filterSmallToLarge') : t('filterAToZ')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onApplySort('desc');
            onClose();
          }}
          className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ArrowUpAZ className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{isNumeric ? t('filterLargeToSmall') : t('filterZToA')}</span>
        </button>
      </div>

      {/* FILTER OPTIONS: SPECIFIC SUBMENU OR CHECKBOX */}
      {activeFilterSubmenu === 'none' ? (
        <div className="pt-2 space-y-2">
          {/* Quick Submenu Launcher */}
          <button
            type="button"
            onClick={() => setActiveFilterSubmenu('specific')}
            className="w-full text-start px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-sky-50 text-sky-800 font-medium cursor-pointer border border-sky-100"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{isNumeric ? t('filterNumberMenu') : isDate ? t('filterDateMenu') : t('filterTextMenu')}</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 rtl:rotate-180 shrink-0" />
          </button>

          {/* Search values */}
          <div className="relative">
            <Search className="w-3 h-3 absolute start-2.5 top-2 text-slate-400" />
            <input
              type="text"
              dir="auto"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={t('labGridSearchValues')}
              className="w-full ps-7 pe-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Select / Clear All */}
          <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
            <span className="font-semibold">{t('filterDistinctCount', { count: uniqueValues.length })}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sky-600 hover:underline font-medium cursor-pointer"
              >
                {t('removeDupesSelectAll')}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sky-600 hover:underline font-medium cursor-pointer"
              >
                {t('removeDupesClearAll')}
              </button>
            </div>
          </div>

          {/* Value List */}
          <div className="max-h-40 overflow-y-auto space-y-0.5 border border-slate-200 rounded-lg p-1.5 bg-slate-50/50">
            {filteredItems.map(([val, count]) => {
              const isChecked = checkedValues.has(val);
              return (
                <label
                  key={val}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-[11px] ${
                    isChecked ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pe-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleVal(val)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-3 h-3"
                    />
                    <span dir="auto" className={`truncate ${val === '(null)' ? 'italic text-slate-400' : ''}`}>
                      {val}
                    </span>
                  </div>
                  <span className="text-[9px] px-1 bg-slate-100 text-slate-400 rounded-sm font-mono shrink-0">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-xs cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleApplyCheckboxFilter}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
            >
              {t('filterApplyBtn')}
            </button>
          </div>
        </div>
      ) : (
        /* ADVANCED CONDITIONAL FILTER FORM */
        <form onSubmit={handleApplySpecificFilter} className="pt-2 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-semibold text-xs text-slate-900">
              {isNumeric ? t('filterNumberTitle') : isDate ? t('filterDateTitle') : t('filterTextTitle')}
            </span>
            <button
              type="button"
              onClick={() => setActiveFilterSubmenu('none')}
              className="text-[11px] text-sky-600 hover:underline cursor-pointer"
            >
              {t('filterBackToList')}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">{t('filterConditionLabel')}</label>
            <select
              value={specificOp}
              onChange={(e) => setSpecificOp(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            >
              {isNumeric ? (
                <>
                  <option value="equals">{t('filterOpEquals')}</option>
                  <option value="not_equals">{t('filterOpNotEqualsShort')}</option>
                  <option value="greater_than">{t('filterOpGreater')}</option>
                  <option value="greater_equal">{t('filterOpGreaterEqual')}</option>
                  <option value="less_than">{t('filterOpLess')}</option>
                  <option value="less_equal">{t('filterOpLessEqual')}</option>
                  <option value="between">{t('filterOpBetween')}</option>
                </>
              ) : isDate ? (
                <>
                  <option value="equals">{t('filterOpEquals')}</option>
                  <option value="before">{t('filterOpBefore')}</option>
                  <option value="after">{t('filterOpAfter')}</option>
                  <option value="date_between">{t('filterOpBetween')}</option>
                  <option value="this_year">{t('filterOpThisYear')}</option>
                  <option value="this_month">{t('filterOpThisMonth')}</option>
                </>
              ) : (
                <>
                  <option value="equals">{t('filterOpEquals')}</option>
                  <option value="not_equals">{t('filterOpNotEqualsShort')}</option>
                  <option value="contains">{t('filterOpContains')}</option>
                  <option value="not_contains">{t('filterOpNotContains')}</option>
                  <option value="starts_with">{t('filterOpStartsWith')}</option>
                  <option value="ends_with">{t('filterOpEndsWith')}</option>
                </>
              )}
            </select>
          </div>

          {!['this_year', 'this_month'].includes(specificOp) && (
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">{t('filterValueLabel')}</label>
              <input
                type={isDate ? 'date' : isNumeric ? 'number' : 'text'}
                dir="auto"
                step="any"
                value={opValue}
                onChange={(e) => setOpValue(e.target.value)}
                placeholder={t('filterEnterValPlaceholder')}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                autoFocus
              />
            </div>
          )}

          {['between', 'date_between'].includes(specificOp) && (
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">{t('filterValue2Label')}</label>
              <input
                type={isDate ? 'date' : isNumeric ? 'number' : 'text'}
                dir="auto"
                step="any"
                value={opValue2}
                onChange={(e) => setOpValue2(e.target.value)}
                placeholder={t('filterSecondBoundPlaceholder')}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveFilterSubmenu('none')}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-xs cursor-pointer"
            >
              {t('filterBackBtn')}
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
            >
              {t('filterApplyBtn')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
