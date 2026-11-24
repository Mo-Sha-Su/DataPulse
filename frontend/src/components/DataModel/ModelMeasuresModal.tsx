import React, { useState } from 'react';
import { FactTable, DimensionTable, ModelMeasure, MeasureAggregation } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { Modal, FieldLabel, Input, Select, Button } from '../../ui';

interface Props {
  isOpen: boolean;
  factTables: FactTable[];
  dimensionTables: DimensionTable[];
  existingMeasures: ModelMeasure[];
  onClose: () => void;
  onSaveMeasure: (measure: ModelMeasure) => void;
  onDeleteMeasure: (id: string) => void;
}

export const ModelMeasuresModal: React.FC<Props> = ({
  isOpen,
  factTables,
  dimensionTables,
  existingMeasures,
  onClose,
  onSaveMeasure,
  onDeleteMeasure,
}) => {
  const { t } = useLanguage();
  const [measureName, setMeasureName] = useState('Total Sales');
  const [aggregation, setAggregation] = useState<MeasureAggregation>('sum');
  const [targetTable, setTargetTable] = useState<string>(() => factTables[0]?.name || '');
  const [targetColumn, setTargetColumn] = useState<string>(() => factTables[0]?.measures[0] || '');
  const [secondaryMeasure, setSecondaryMeasure] = useState<string>('');
  const [format, setFormat] = useState<'number' | 'currency' | 'percentage' | 'compact'>('currency');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const selectedFact = factTables.find((f) => f.name === targetTable) || factTables[0];
  const availableColumns = selectedFact ? [...selectedFact.measures, ...selectedFact.foreignKeys] : [];

  // Generate internal query expression and plain-language visual summary
  let expressionPreview = '';
  let readableSummary = '';
  if (aggregation === 'divide') {
    expressionPreview = `DIVIDE([${measureName || 'Numerator'}], [${secondaryMeasure || 'Denominator'}])`;
    readableSummary = `${targetColumn || measureName || 'Numerator'} ÷ ${secondaryMeasure || 'Denominator'}`;
  } else {
    expressionPreview = `${(aggregation || 'SUM').toUpperCase()}(${targetTable}[${targetColumn}])`;
    readableSummary = `${(aggregation || 'sum').replace('_', ' ').toUpperCase()} · ${targetTable} → ${targetColumn}`;
  }

  const formatReadableExpression = (m: ModelMeasure): string => {
    if (m.aggregation === 'divide') {
      return `${m.targetColumn} ÷ ${m.secondaryMeasure || ''}`.trim();
    }
    return `${m.aggregation.replace('_', ' ').toUpperCase()} · ${m.targetTable} → ${m.targetColumn}`;
  };

  const handleSave = () => {
    if (!measureName.trim() || !targetTable) return;

    const newMeasure: ModelMeasure = {
      id: `meas_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: measureName.trim(),
      expression: expressionPreview,
      aggregation,
      targetTable,
      targetColumn: aggregation === 'divide' ? (selectedFact?.measures[0] || 'Sales') : targetColumn,
      secondaryMeasure: aggregation === 'divide' ? secondaryMeasure : undefined,
      format,
      currencySymbol,
    };

    onSaveMeasure(newMeasure);
    // Reset form
    setMeasureName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      closeLabel={t('close')}
      title={t('dmMeasuresModalTitle')}
      subtitle={t('dmMeasuresModalDesc')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
          <Calculator className="w-4 h-4" />
        </div>
      }
      bodyClassName="space-y-4 text-xs text-slate-700 select-none"
      footer={
        <Button variant="navy" size="sm" onClick={onClose}>
          {t('dmMeasuresDoneBtn')}
        </Button>
      }
    >
      {/* Existing Measures List */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold text-slate-700">
            {t('dmMeasuresExisting', { count: existingMeasures.length })}
          </span>
        </div>
        {existingMeasures.length === 0 ? (
          <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
            {t('dmMeasuresNone')}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pe-1">
            {existingMeasures.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-sky-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span dir="auto" className="font-bold text-slate-900 block truncate">{m.name}</span>
                  <span dir="auto" className="text-[11px] text-sky-700 font-semibold block truncate">{formatReadableExpression(m)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span dir="ltr" className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold uppercase">
                    {m.format}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteMeasure(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title={t('dmMeasuresDeleteTip')}
                    aria-label={t('dmMeasuresDeleteTip')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200">
        <h3 className="font-bold text-slate-900 mb-2">{t('dmMeasuresCreateNew')}</h3>

        {/* Visual Calculation Builder */}
        <div className="space-y-3 p-3 bg-sky-50/50 border border-sky-200 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <FieldLabel>{t('dmMeasuresNameLabel')}</FieldLabel>
              <Input
                controlSize="sm"
                type="text"
                dir="auto"
                value={measureName}
                onChange={(e) => setMeasureName(e.target.value)}
                placeholder={t('dmMeasuresNamePlaceholder')}
                className="bg-white font-bold"
              />
            </div>

            <div className="min-w-0">
              <FieldLabel>{t('dmMeasuresAggLabel')}</FieldLabel>
              <Select
                controlSize="sm"
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as MeasureAggregation)}
                className="bg-white font-semibold"
              >
                <option value="sum">{t('dmAggSumDesc')}</option>
                <option value="avg">{t('dmAggAvgDesc')}</option>
                <option value="count">{t('dmAggCountDesc')}</option>
                <option value="distinct_count">{t('dmAggDistinctDesc')}</option>
                <option value="min">{t('dmAggMinDesc')}</option>
                <option value="max">{t('dmAggMaxDesc')}</option>
                <option value="divide">{t('dmAggDivideDesc')}</option>
              </Select>
            </div>
          </div>

          {aggregation !== 'divide' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <FieldLabel>{t('dmMeasuresTargetTable')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="auto"
                  value={targetTable}
                  onChange={(e) => {
                    setTargetTable(e.target.value);
                    const f = factTables.find((tbl) => tbl.name === e.target.value);
                    setTargetColumn(f?.measures[0] || '');
                  }}
                  className="bg-white font-semibold"
                >
                  {factTables.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} (FACT)
                    </option>
                  ))}
                  {dimensionTables.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} (DIM)
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0">
                <FieldLabel>{t('dmMeasuresTargetCol')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="auto"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="bg-white font-semibold"
                >
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <FieldLabel>{t('dmMeasuresNumerator')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="auto"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="bg-white font-semibold"
                >
                  {selectedFact?.measures.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="min-w-0">
                <FieldLabel>{t('dmMeasuresDenominator')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="auto"
                  value={secondaryMeasure}
                  onChange={(e) => setSecondaryMeasure(e.target.value)}
                  className="bg-white font-semibold"
                >
                  <option value="">{t('dmMeasuresSelectDenom')}</option>
                  {existingMeasures.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  {selectedFact?.measures.map((m) => (
                    <option key={m} value={m}>
                      {selectedFact.name} → {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Number Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <FieldLabel>{t('dmMeasuresFormatLabel')}</FieldLabel>
              <Select
                controlSize="sm"
                value={format}
                onChange={(e) => setFormat(e.target.value as 'number' | 'currency' | 'percentage' | 'compact')}
                className="bg-white font-semibold"
              >
                <option value="currency">{t('dmFmtCurrencyOpt')}</option>
                <option value="percentage">{t('dmFmtPercentOpt')}</option>
                <option value="compact">{t('dmFmtCompactOpt')}</option>
                <option value="number">{t('dmFmtNumberOpt')}</option>
              </Select>
            </div>

            <div className="min-w-0">
              <FieldLabel>{t('dmMeasuresCurrencyLabel')}</FieldLabel>
              <Input
                controlSize="sm"
                type="text"
                dir="ltr"
                value={currencySymbol}
                disabled={format !== 'currency' && format !== 'compact'}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="bg-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Plain-Language Calculation Summary */}
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dmMeasuresGeneratedFormula')}</span>
              <span dir="auto" className="text-xs font-bold text-sky-700 block truncate">{readableSummary}</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!measureName.trim()}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {t('dmMeasuresAddBtn')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
