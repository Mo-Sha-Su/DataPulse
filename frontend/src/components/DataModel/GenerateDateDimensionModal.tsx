import React, { useState } from 'react';
import { Dataset } from '../../types/dashboard';
import { DimensionTable } from '../../types/dataModel';
import { generateDateDimension } from '../../utils/dataModelingEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { Calendar, Clock } from 'lucide-react';
import { Modal, FieldLabel, Select, Button } from '../../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: { dataset: Dataset; dimension: DimensionTable }) => void;
}

export const GenerateDateDimensionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const { t } = useLanguage();
  const [startYear, setStartYear] = useState<number>(2024);
  const [endYear, setEndYear] = useState<number>(2028);

  const estimatedDays = (endYear - startYear + 1) * 365;

  const handleApply = () => {
    const res = generateDateDimension(startYear, endYear);
    onGenerate(res);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeLabel={t('close')}
      title={t('dmDateModalTitle')}
      subtitle={t('dmDateModalDesc')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Calendar className="w-4 h-4" />
        </div>
      }
      bodyClassName="space-y-4 text-xs text-slate-700 select-none"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            icon={<Calendar className="w-3.5 h-3.5" />}
          >
            {t('dmDateGenerateBtn')}
          </Button>
        </div>
      }
    >
      {/* Year Range Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <FieldLabel>{t('dmDateStartYear')}</FieldLabel>
          <Select
            controlSize="sm"
            dir="ltr"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          >
            {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y} (01-01)
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-0">
          <FieldLabel>{t('dmDateEndYear')}</FieldLabel>
          <Select
            controlSize="sm"
            dir="ltr"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
          >
            {[2026, 2027, 2028, 2029, 2030, 2032, 2035].map((y) => (
              <option key={y} value={y} disabled={y < startYear}>
                {y} (12-31)
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Generated Schema Preview */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">{t('dmDateSchemaPreview')}</span>
        <div dir="ltr" className="flex flex-wrap gap-1.5">
          {[
            'Date_ID (PK)',
            'Date (YYYY-MM-DD)',
            'Day (1-31)',
            'Day_Name',
            'Week (1-53)',
            'Month (1-12)',
            'Month_Name',
            'Quarter (Q1-Q4)',
            'Year',
          ].map((col, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-700"
            >
              {col}
            </span>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 font-medium">
          <span>{t('dmDateEstimatedRows', { days: estimatedDays })}</span>
          <span className="text-emerald-700 font-bold">{t('dmDateUniqueKeys')}</span>
        </div>
      </div>

      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-indigo-900">
        <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] min-w-0 break-words">
          {t('dmDateBestPractice')}
        </p>
      </div>
    </Modal>
  );
};
