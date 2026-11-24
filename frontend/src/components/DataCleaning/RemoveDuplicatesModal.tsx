import React, { useId, useState } from 'react';
import { CopyX, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, Modal } from '../../ui';

interface Props {
  isOpen: boolean;
  columns: string[];
  initialSelectedColumns?: string[];
  onClose: () => void;
  onApply: (selectedColumns: string[]) => void;
}

export const RemoveDuplicatesModal: React.FC<Props> = ({
  isOpen,
  columns,
  initialSelectedColumns,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const formId = useId();
  const [selectedCols, setSelectedCols] = useState<string[]>(
    initialSelectedColumns && initialSelectedColumns.length > 0 ? initialSelectedColumns : columns
  );

  if (!isOpen) return null;

  const toggleCol = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleSelectAll = () => setSelectedCols([...columns]);
  const handleClearAll = () => setSelectedCols([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCols.length === 0) return;
    onApply(selectedCols);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeLabel={t('close')}
      icon={<CopyX className="w-4 h-4 text-rose-600" />}
      title={t('removeDupesTitle')}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="danger"
            size="sm"
            disabled={selectedCols.length === 0}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            {t('removeDupesSubmitBtn')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        <p className="text-slate-600 leading-relaxed">{t('removeDupesDesc')}</p>

        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <span className="font-medium text-slate-700 truncate min-w-0">
            {t('removeDupesSelectedOf', { selected: selectedCols.length, total: columns.length })}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sky-600 hover:underline font-medium text-[11px] cursor-pointer"
            >
              {t('removeDupesSelectAll')}
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sky-600 hover:underline font-medium text-[11px] cursor-pointer"
            >
              {t('removeDupesClearAll')}
            </button>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50 min-w-0">
          {columns.map((col) => {
            const isChecked = selectedCols.includes(col);
            return (
              <label
                key={col}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors min-w-0 ${
                  isChecked ? 'bg-sky-50 text-sky-900 font-medium' : 'hover:bg-slate-200/50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCol(col)}
                  className="rounded text-sky-600 focus:ring-sky-500 shrink-0"
                />
                <span dir="auto" className="truncate min-w-0">{col}</span>
              </label>
            );
          })}
        </div>
      </form>
    </Modal>
  );
};
