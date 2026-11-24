import React, { useId, useState } from 'react';
import { Merge, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, FieldLabel, Input, Modal, Select } from '../../ui';

interface Props {
  isOpen: boolean;
  availableColumns: string[];
  initialSelectedColumns: string[];
  sampleRows: Record<string, any>[];
  onClose: () => void;
  onApply: (params: {
    columns: string[];
    separator: string;
    customSeparator?: string;
    newColumnName: string;
    removeOriginal: boolean;
  }) => void;
}

export const MergeColumnsModal: React.FC<Props> = ({
  isOpen,
  availableColumns,
  initialSelectedColumns,
  sampleRows,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const formId = useId();
  const [selectedCols, setSelectedCols] = useState<string[]>(
    initialSelectedColumns.length > 0 ? initialSelectedColumns : availableColumns.slice(0, 2)
  );
  const [separatorType, setSeparatorType] = useState<string>(' ');
  const [customSeparator, setCustomSeparator] = useState<string>(' - ');
  const [newColumnName, setNewColumnName] = useState<string>('Merged');
  const [removeOriginal, setRemoveOriginal] = useState<boolean>(true);

  if (!isOpen) return null;

  const toggleColumn = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const getEffectiveSeparator = () => {
    if (separatorType === 'custom') return customSeparator;
    return separatorType;
  };

  const effectiveSep = getEffectiveSeparator();

  // Preview merged values
  const previewRows = sampleRows.slice(0, 5).map((row) =>
    selectedCols
      .map((c) => (row[c] !== null && row[c] !== undefined ? String(row[c]) : ''))
      .filter((v) => v !== '')
      .join(effectiveSep)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCols.length < 2) return;
    onApply({
      columns: selectedCols,
      separator: separatorType,
      customSeparator,
      newColumnName: newColumnName.trim() || 'Merged',
      removeOriginal,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeLabel={t('close')}
      icon={<Merge className="w-4 h-4 text-sky-600" />}
      title={t('mergeModalTitle')}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            disabled={selectedCols.length < 2}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            {t('mergeSubmitBtn')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        {/* Column selector */}
        <div className="min-w-0">
          <FieldLabel>{t('mergeSelectColumns', { count: selectedCols.length })}</FieldLabel>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
            {availableColumns.map((col) => {
              const isSelected = selectedCols.includes(col);
              const orderIdx = selectedCols.indexOf(col);
              return (
                <label
                  key={col}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors min-w-0 ${
                    isSelected ? 'bg-sky-100/70 border border-sky-300 text-sky-900 font-medium' : 'hover:bg-slate-200/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleColumn(col)}
                      className="rounded text-sky-600 focus:ring-sky-500 shrink-0"
                    />
                    <span dir="auto" className="truncate">{col}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-200 text-sky-800 font-bold shrink-0" dir="ltr">
                      #{orderIdx + 1}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {selectedCols.length < 2 && (
            <span className="text-[11px] text-amber-600 mt-1 block">{t('mergeMinTwoWarning')}</span>
          )}
        </div>

        {/* Separator choice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <div className="min-w-0">
            <FieldLabel>{t('mergeSeparatorLabel')}</FieldLabel>
            <Select
              controlSize="sm"
              value={separatorType}
              onChange={(e) => setSeparatorType(e.target.value)}
              className="bg-white"
            >
              <option value=" ">{t('mergeSepSpace')}</option>
              <option value=", ">{t('mergeSepComma')}</option>
              <option value=" - ">{t('mergeSepDash')}</option>
              <option value="; ">{t('mergeSepSemicolon')}</option>
              <option value="">{t('mergeSepNone')}</option>
              <option value="custom">{t('mergeSepCustom')}</option>
            </Select>
          </div>

          <div className="min-w-0">
            <FieldLabel>{t('mergeNewColName')}</FieldLabel>
            <Input
              controlSize="sm"
              type="text"
              dir="auto"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder={t('mergeNewColPlaceholder')}
              className="bg-white"
            />
          </div>
        </div>

        {separatorType === 'custom' && (
          <div className="min-w-0">
            <FieldLabel>{t('mergeCustomSepLabel')}</FieldLabel>
            <Input
              controlSize="sm"
              type="text"
              dir="ltr"
              value={customSeparator}
              onChange={(e) => setCustomSeparator(e.target.value)}
              placeholder={t('mergeCustomSepPlaceholder')}
              className="bg-white font-mono"
            />
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer text-slate-700 min-w-0">
          <input
            type="checkbox"
            checked={removeOriginal}
            onChange={(e) => setRemoveOriginal(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500 shrink-0"
          />
          <span className="min-w-0">{t('mergeDropOriginals')}</span>
        </label>

        {/* Live Preview */}
        <div className="border border-slate-200 rounded-xl overflow-hidden min-w-0">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 font-medium flex items-center justify-between gap-2 min-w-0">
            <span className="truncate min-w-0">
              {t('mergePreviewLabel')}{' '}
              <span className="font-mono font-bold text-slate-800" dir="auto">{newColumnName || 'Merged'}</span>
            </span>
            <span className="text-slate-400 truncate min-w-0" dir="auto">{selectedCols.join(' + ')}</span>
          </div>
          <div className="p-2 bg-white max-h-24 overflow-y-auto space-y-1">
            {previewRows.map((val, idx) => (
              <div key={idx} dir="auto" className="text-[11px] font-mono py-0.5 px-2 bg-slate-50 rounded border border-slate-100 text-slate-800 truncate">
                {val || <span className="text-slate-300 italic">{t('mergeEmptyCell')}</span>}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
