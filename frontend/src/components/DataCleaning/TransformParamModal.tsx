import React, { useState, useEffect, useId } from 'react';
import { Sliders, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, FieldLabel, Input, Modal, Select } from '../../ui';

export type TransformModalType =
  | 'text_prefix'
  | 'text_suffix'
  | 'text_extract_first'
  | 'text_extract_last'
  | 'text_extract_range'
  | 'text_extract_before'
  | 'text_extract_after'
  | 'number_math'
  | 'number_round'
  | 'replace_errors'
  | 'replace_nulls'
  | 'rename_step'
  | 'rename_column'
  | 'custom_column';

interface Props {
  isOpen: boolean;
  type: TransformModalType;
  column?: string;
  initialValue?: any;
  initialValue2?: any;
  availableColumns?: string[];
  targetRowIndex?: number;
  initialCellOnly?: boolean;
  onClose: () => void;
  onApply: (params: any) => void;
}

export const TransformParamModal: React.FC<Props> = ({
  isOpen,
  type,
  column = '',
  initialValue,
  initialValue2,
  availableColumns = [],
  targetRowIndex,
  initialCellOnly = false,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const formId = useId();
  const [val1, setVal1] = useState<any>(initialValue ?? '');
  const [val2, setVal2] = useState<any>(initialValue2 ?? '');
  const [selectedAction, setSelectedAction] = useState<string>('replace_zero');
  const [mathOp, setMathOp] = useState<string>('+');
  const [customFormulaType, setCustomFormulaType] = useState<'math' | 'concat'>('math');
  const [customCol1, setCustomCol1] = useState<string>(() => column || availableColumns[0] || '');
  const [customOperandMode, setCustomOperandMode] = useState<'column' | 'constant'>('column');
  const [customCol2, setCustomCol2] = useState<string>(() => availableColumns[1] || availableColumns[0] || '');
  const [customConst, setCustomConst] = useState<string>('0');
  const supportsSingleCell =
    typeof targetRowIndex === 'number' &&
    targetRowIndex >= 0 &&
    type !== 'rename_step' &&
    type !== 'rename_column' &&
    type !== 'custom_column';
  const [cellOnly, setCellOnly] = useState<boolean>(Boolean(supportsSingleCell && initialCellOnly));

  useEffect(() => {
    if (isOpen) {
      setCellOnly(Boolean(supportsSingleCell && initialCellOnly));
      if (type === 'custom_column') {
        const first = column && availableColumns.includes(column) ? column : availableColumns[0] || '';
        const second = availableColumns.find((c) => c !== first) || first;
        setCustomCol1(first);
        setCustomCol2(second);
        setCustomFormulaType('math');
        setCustomOperandMode(availableColumns.length > 1 ? 'column' : 'constant');
        setCustomConst('1');
      }
    }
  }, [isOpen, supportsSingleCell, initialCellOnly, type, column, availableColumns]);

  if (!isOpen) return null;

  const getDetails = () => {
    switch (type) {
      case 'text_prefix':
        return { title: t('transformPrefixTitle'), label: t('transformPrefixLabel'), placeholder: 'ID-' };
      case 'text_suffix':
        return { title: t('transformSuffixTitle'), label: t('transformSuffixLabel'), placeholder: '/year' };
      case 'text_extract_first':
        return { title: t('transformExtractFirstTitle'), label: t('transformExtractFirstLabel'), placeholder: '3' };
      case 'text_extract_last':
        return { title: t('transformExtractLastTitle'), label: t('transformExtractLastLabel'), placeholder: '4' };
      case 'text_extract_range':
        return { title: t('transformExtractRangeTitle'), label: t('transformExtractRangeStart'), placeholder: '1' };
      case 'text_extract_before':
        return { title: t('transformExtractBeforeTitle'), label: t('transformDelimiterLabel'), placeholder: '@ / ,' };
      case 'text_extract_after':
        return { title: t('transformExtractAfterTitle'), label: t('transformDelimiterLabel'), placeholder: '@ / ,' };
      case 'number_math':
        return { title: t('transformMathTitle', { col: column }), label: t('transformMathValLabel'), placeholder: '1000' };
      case 'number_round':
        return { title: t('transformRoundTitle'), label: t('transformRoundLabel'), placeholder: '2' };
      case 'replace_errors':
        return { title: t('transformReplaceErrorsTitle', { col: column }), label: t('transformReplaceErrorsLabel'), placeholder: '0' };
      case 'replace_nulls':
        return { title: t('transformReplaceNullsTitle', { col: column }), label: '', placeholder: '' };
      case 'rename_step':
        return { title: t('transformRenameStepTitle'), label: t('transformRenameStepLabel'), placeholder: t('transformRenameStepLabel') };
      case 'rename_column':
        return { title: t('transformRenameColTitle'), label: t('transformRenameColLabel'), placeholder: column };
      case 'custom_column':
        return { title: t('transformCustomColTitle'), label: t('labCustomColNameLabel'), placeholder: t('labCustomColNamePlaceholder') };
    }
  };

  const details = getDetails();
  const rowScopeParams = cellOnly && supportsSingleCell ? { targetRowIndex } : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switch (type) {
      case 'text_prefix':
        onApply({ column, action: 'prefix', prefix: val1, ...rowScopeParams });
        break;
      case 'text_suffix':
        onApply({ column, action: 'suffix', suffix: val1, ...rowScopeParams });
        break;
      case 'text_extract_first':
        onApply({ column, action: 'extract_first', count: parseInt(val1, 10) || 1, ...rowScopeParams });
        break;
      case 'text_extract_last':
        onApply({ column, action: 'extract_last', count: parseInt(val1, 10) || 1, ...rowScopeParams });
        break;
      case 'text_extract_range':
        onApply({ column, action: 'extract_range', start: parseInt(val1, 10) || 1, length: parseInt(val2, 10) || 1, ...rowScopeParams });
        break;
      case 'text_extract_before':
        onApply({ column, action: 'extract_before_delimiter', delimiter: val1, ...rowScopeParams });
        break;
      case 'text_extract_after':
        onApply({ column, action: 'extract_after_delimiter', delimiter: val1, ...rowScopeParams });
        break;
      case 'number_math':
        onApply({ column, action: mathOp === '+' ? 'add' : mathOp === '-' ? 'subtract' : mathOp === '*' ? 'multiply' : mathOp === '/' ? 'divide' : 'modulo', value: parseFloat(val1) || 0, ...rowScopeParams });
        break;
      case 'number_round':
        onApply({ column, action: 'round', decimals: parseInt(val1, 10) || 0, ...rowScopeParams });
        break;
      case 'replace_errors':
        onApply({ column, replaceValue: val1, ...rowScopeParams });
        break;
      case 'replace_nulls':
        onApply({ column, action: selectedAction, customValue: val1, ...rowScopeParams });
        break;
      case 'rename_step':
        onApply({ newName: val1 });
        break;
      case 'rename_column':
        onApply({ oldName: column, newName: val1 });
        break;
      case 'custom_column':
        onApply({
          newColumnName: String(val1 || '').trim() || 'Custom',
          formulaType: customFormulaType,
          col1: customCol1,
          col2: customFormulaType === 'concat' || customOperandMode === 'column' ? customCol2 : '',
          operator: mathOp,
          constantValue: parseFloat(customConst) || 0,
        });
        break;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeLabel={t('close')}
      icon={<Sliders className="w-4 h-4 text-sky-600" />}
      title={<span dir="auto">{details.title}</span>}
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
            {t('transformOkBtn')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        {supportsSingleCell && (
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

        {type === 'replace_nulls' ? (
          <div className="space-y-3 min-w-0">
            <FieldLabel>{t('transformNullStrategyLabel')}</FieldLabel>
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {[
                { id: 'replace_zero', label: t('transformNullZero') },
                { id: 'replace_value', label: t('transformNullCustom') },
                { id: 'replace_avg', label: t('transformNullAvg') },
                { id: 'replace_median', label: t('transformNullMedian') },
                { id: 'replace_min', label: t('transformNullMin') },
                { id: 'replace_max', label: t('transformNullMax') },
                { id: 'fill_down', label: t('transformNullFillDown') },
                { id: 'fill_up', label: t('transformNullFillUp') },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer text-slate-700 text-xs min-w-0">
                  <input
                    type="radio"
                    name="nullAction"
                    value={item.id}
                    checked={selectedAction === item.id}
                    onChange={() => setSelectedAction(item.id)}
                    className="text-sky-600 focus:ring-sky-500 shrink-0"
                  />
                  <span className="min-w-0">{item.label}</span>
                </label>
              ))}
            </div>

            {selectedAction === 'replace_value' && (
              <div className="min-w-0">
                <FieldLabel>{t('transformCustomValLabel')}</FieldLabel>
                <Input
                  controlSize="sm"
                  type="text"
                  dir="auto"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                  placeholder={t('labReplaceNullsPlaceholder')}
                  className="bg-white font-mono"
                  autoFocus
                />
              </div>
            )}
          </div>
        ) : type === 'number_math' ? (
          <div className="space-y-3 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
              <div className="min-w-0">
                <FieldLabel>{t('transformMathOpLabel')}</FieldLabel>
                <Select
                  controlSize="sm"
                  value={mathOp}
                  onChange={(e) => setMathOp(e.target.value)}
                  className="bg-white"
                >
                  <option value="+">{t('transformOpAdd')}</option>
                  <option value="-">{t('transformOpSub')}</option>
                  <option value="*">{t('transformOpMul')}</option>
                  <option value="/">{t('transformOpDiv')}</option>
                  <option value="%">{t('transformOpMod')}</option>
                </Select>
              </div>
              <div className="min-w-0">
                <FieldLabel>{t('transformMathValLabel')}</FieldLabel>
                <Input
                  controlSize="sm"
                  type="number"
                  step="any"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                  placeholder="1000"
                  className="bg-white font-mono"
                  autoFocus
                />
              </div>
            </div>
          </div>
        ) : type === 'custom_column' ? (
          <div className="space-y-3 min-w-0">
            <div className="min-w-0">
              <FieldLabel>{details.label}</FieldLabel>
              <Input
                controlSize="sm"
                type="text"
                dir="auto"
                value={val1}
                onChange={(e) => setVal1(e.target.value)}
                placeholder={details.placeholder}
                className="bg-white"
                autoFocus
              />
            </div>

            <div className="min-w-0">
              <FieldLabel>{t('labCustomColModeLabel')}</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomFormulaType('math')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    customFormulaType === 'math'
                      ? 'bg-sky-50 border-sky-400 text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('labCustomColModeMath')}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomFormulaType('concat')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    customFormulaType === 'concat'
                      ? 'bg-sky-50 border-sky-400 text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('labCustomColModeConcat')}
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <FieldLabel>{t('labCustomColFirstLabel')}</FieldLabel>
              <Select
                controlSize="sm"
                dir="auto"
                value={customCol1}
                onChange={(e) => setCustomCol1(e.target.value)}
                className="bg-white"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </Select>
            </div>

            {customFormulaType === 'math' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <FieldLabel>{t('transformMathOpLabel')}</FieldLabel>
                    <Select
                      controlSize="sm"
                      value={mathOp}
                      onChange={(e) => setMathOp(e.target.value)}
                      className="bg-white"
                    >
                      <option value="+">{t('transformOpAdd')}</option>
                      <option value="-">{t('transformOpSub')}</option>
                      <option value="*">{t('transformOpMul')}</option>
                      <option value="/">{t('transformOpDiv')}</option>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <FieldLabel>{t('labCustomColSecondLabel')}</FieldLabel>
                    <Select
                      controlSize="sm"
                      value={customOperandMode}
                      onChange={(e) => setCustomOperandMode(e.target.value as 'column' | 'constant')}
                      className="bg-white"
                    >
                      <option value="column">{t('labCustomColSecondModeCol')}</option>
                      <option value="constant">{t('labCustomColSecondModeNum')}</option>
                    </Select>
                  </div>
                </div>

                {customOperandMode === 'column' ? (
                  <div className="min-w-0">
                    <Select
                      controlSize="sm"
                      dir="auto"
                      value={customCol2}
                      onChange={(e) => setCustomCol2(e.target.value)}
                      className="bg-white"
                    >
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <FieldLabel>{t('labCustomColConstLabel')}</FieldLabel>
                    <Input
                      controlSize="sm"
                      type="number"
                      step="any"
                      value={customConst}
                      onChange={(e) => setCustomConst(e.target.value)}
                      className="bg-white font-mono"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="min-w-0">
                <FieldLabel>{t('labCustomColSecondLabel')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="auto"
                  value={customCol2}
                  onChange={(e) => setCustomCol2(e.target.value)}
                  className="bg-white"
                >
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-snug">{t('labCustomColFormulaHint')}</p>
          </div>
        ) : (
          <div className="min-w-0">
            <FieldLabel>{details.label}</FieldLabel>
            <Input
              controlSize="sm"
              type={type === 'text_extract_first' || type === 'text_extract_last' || type === 'number_round' ? 'number' : 'text'}
              dir="auto"
              value={val1}
              onChange={(e) => setVal1(e.target.value)}
              placeholder={details.placeholder}
              className="bg-white font-mono"
              autoFocus
            />

            {type === 'text_extract_range' && (
              <div className="mt-3 min-w-0">
                <FieldLabel>{t('transformExtractRangeLength')}</FieldLabel>
                <Input
                  controlSize="sm"
                  type="number"
                  min={1}
                  value={val2 || '5'}
                  onChange={(e) => setVal2(e.target.value)}
                  placeholder="5"
                  className="bg-white font-mono"
                />
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};
