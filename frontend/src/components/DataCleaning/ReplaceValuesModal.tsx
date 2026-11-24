import React, { useState, useEffect, useId } from 'react';
import { Replace, Check, AlertCircle } from 'lucide-react';
import { isCellError } from '../../utils/transformationEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, FieldLabel, Input, Modal } from '../../ui';

interface Props {
  isOpen: boolean;
  column: string;
  initialFindValue?: string;
  targetRowIndex?: number;
  initialCellOnly?: boolean;
  sampleRows: Record<string, any>[];
  onClose: () => void;
  onApply: (params: {
    column: string;
    findValue: string;
    replaceValue: string;
    matchEntire: boolean;
    targetRowIndex?: number;
  }) => void;
}

export const ReplaceValuesModal: React.FC<Props> = ({
  isOpen,
  column,
  initialFindValue = '',
  targetRowIndex,
  initialCellOnly = false,
  sampleRows,
  onClose,
  onApply,
}) => {
  const { t, tPlural } = useLanguage();
  const formId = useId();
  const [findValue, setFindValue] = useState(initialFindValue);
  const [replaceValue, setReplaceValue] = useState('');
  const [matchEntire, setMatchEntire] = useState(true);
  const hasTargetCell = typeof targetRowIndex === 'number' && targetRowIndex >= 0 && targetRowIndex < sampleRows.length;
  const [cellOnly, setCellOnly] = useState(Boolean(hasTargetCell && initialCellOnly));

  useEffect(() => {
    if (isOpen) {
      setFindValue(initialFindValue);
      setReplaceValue('');
      setCellOnly(Boolean(hasTargetCell && initialCellOnly));
    }
  }, [isOpen, initialFindValue, column, hasTargetCell, initialCellOnly]);

  if (!isOpen) return null;

  const candidateRows = cellOnly && hasTargetCell ? [sampleRows[targetRowIndex!]] : sampleRows;

  // Calculate affected count dynamically across sample (or single targeted row)
  const affectedCount = candidateRows.filter((r) => {
    const raw = r[column];
    if (isCellError(raw)) return false;
    if (raw === null || raw === undefined) {
      return findValue === '' || findValue.toLowerCase() === 'null';
    }
    const str = String(raw);
    if (matchEntire) {
      return str === findValue;
    }
    return findValue !== '' && str.includes(findValue);
  }).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      column,
      findValue,
      replaceValue,
      matchEntire,
      ...(cellOnly && hasTargetCell ? { targetRowIndex } : {}),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeLabel={t('close')}
      icon={<Replace className="w-4 h-4 text-sky-600" />}
      title={
        <span>
          {t('replaceValuesTitle')} <span className="text-sky-700" dir="auto">{column}</span>
        </span>
      }
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
            icon={<Check className="w-3.5 h-3.5" />}
          >
            {t('replaceValuesSubmitBtn')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        {hasTargetCell && (
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 cursor-pointer min-w-0">
            <input
              type="checkbox"
              checked={cellOnly}
              onChange={(e) => setCellOnly(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 shrink-0"
            />
            <span className="font-medium leading-snug min-w-0">
              {t('labModalCellOnlyToggle', { row: (targetRowIndex ?? 0) + 1 })}
            </span>
          </label>
        )}

        <div className="min-w-0">
          <FieldLabel>{t('replaceValuesFindLabel')}</FieldLabel>
          <Input
            controlSize="sm"
            type="text"
            dir="auto"
            value={findValue}
            onChange={(e) => setFindValue(e.target.value)}
            placeholder={t('replaceValuesFindPlaceholder')}
            className="bg-white font-mono"
            autoFocus
          />
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            {t('replaceValuesNullHint')}
          </span>
        </div>

        <div className="min-w-0">
          <FieldLabel>{t('replaceValuesWithLabel')}</FieldLabel>
          <Input
            controlSize="sm"
            type="text"
            dir="auto"
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            placeholder={t('replaceValuesWithPlaceholder')}
            className="bg-white font-mono"
          />
        </div>

        <div className="space-y-2 pt-1 min-w-0">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 min-w-0">
            <input
              type="radio"
              name="matchRule"
              checked={matchEntire}
              onChange={() => setMatchEntire(true)}
              className="text-sky-600 focus:ring-sky-500 shrink-0"
            />
            <span className="min-w-0">{t('replaceValuesMatchEntire')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 min-w-0">
            <input
              type="radio"
              name="matchRule"
              checked={!matchEntire}
              onChange={() => setMatchEntire(false)}
              className="text-sky-600 focus:ring-sky-500 shrink-0"
            />
            <span className="min-w-0">{t('replaceValuesMatchSubstring')}</span>
          </label>
        </div>

        {/* Dynamic Impact Status Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs min-w-0">
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">{t('replaceValuesAffectedLabel')}</span>
          </div>
          <span className={`font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
            affectedCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            {tPlural('rows', affectedCount)}
          </span>
        </div>
      </form>
    </Modal>
  );
};
