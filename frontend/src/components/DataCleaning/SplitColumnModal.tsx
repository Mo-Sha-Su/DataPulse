import React, { useId, useState } from 'react';
import { Columns, Check, Eye } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, FieldLabel, Input, Modal, Select } from '../../ui';

interface Props {
  isOpen: boolean;
  column: string;
  sampleRows: Record<string, any>[];
  onClose: () => void;
  onApply: (params: {
    column: string;
    mode: 'delimiter' | 'characters' | 'positions';
    delimiter: string;
    at: 'leftmost' | 'rightmost' | 'every';
    numberOfColumns?: number;
    charCount?: number;
    positions?: string;
  }) => void;
}

export const SplitColumnModal: React.FC<Props> = ({
  isOpen,
  column,
  sampleRows,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const formId = useId();
  const [mode, setMode] = useState<'delimiter' | 'characters' | 'positions'>('delimiter');
  const [delimiterType, setDelimiterType] = useState<'space' | 'comma' | 'semicolon' | 'colon' | 'tab' | 'custom'>('space');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [splitAt, setSplitAt] = useState<'every' | 'leftmost' | 'rightmost'>('every');
  const [charCount, setCharCount] = useState(5);
  const [positions, setPositions] = useState('0, 5, 10');

  if (!isOpen) return null;

  const getEffectiveDelimiter = () => {
    switch (delimiterType) {
      case 'space': return ' ';
      case 'comma': return ',';
      case 'semicolon': return ';';
      case 'colon': return ':';
      case 'tab': return '\t';
      case 'custom': return customDelimiter || ' ';
    }
  };

  const delim = getEffectiveDelimiter();

  // Compute live preview of split
  const previewRows = sampleRows.slice(0, 5).map((row) => {
    const raw = String(row[column] ?? '');
    if (mode === 'characters') {
      return [raw.slice(0, charCount), raw.slice(charCount)];
    }
    if (mode === 'positions') {
      const posList = positions.split(',').map((p) => parseInt(p.trim(), 10)).filter((p) => !isNaN(p));
      const parts: string[] = [];
      let last = 0;
      for (const p of posList) {
        if (p > last) {
          parts.push(raw.slice(last, p));
          last = p;
        }
      }
      parts.push(raw.slice(last));
      return parts;
    }
    // Delimiter
    if (!raw.includes(delim)) return [raw];
    if (splitAt === 'leftmost') {
      const idx = raw.indexOf(delim);
      return [raw.slice(0, idx), raw.slice(idx + delim.length)];
    }
    if (splitAt === 'rightmost') {
      const idx = raw.lastIndexOf(delim);
      return [raw.slice(0, idx), raw.slice(idx + delim.length)];
    }
    return raw.split(delim);
  });

  const maxCols = Math.max(...previewRows.map((r) => r.length), 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      column,
      mode,
      delimiter: delim,
      at: splitAt,
      charCount,
      positions,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeLabel={t('close')}
      icon={<Columns className="w-4 h-4 text-sky-600" />}
      title={
        <span>
          {t('splitColTitle')} <span className="text-sky-700" dir="auto">{column}</span>
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
            {t('splitSubmitBtn')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        {/* Split Mode Selector */}
        <div>
          <FieldLabel>{t('splitByLabel')}</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('delimiter')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                mode === 'delimiter'
                  ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('splitModeDelimiter')}
            </button>
            <button
              type="button"
              onClick={() => setMode('characters')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                mode === 'characters'
                  ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('splitModeChars')}
            </button>
            <button
              type="button"
              onClick={() => setMode('positions')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                mode === 'positions'
                  ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('splitModePositions')}
            </button>
          </div>
        </div>

        {/* Delimiter Mode Controls */}
        {mode === 'delimiter' && (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 min-w-0">
            <div>
              <FieldLabel>{t('splitSelectDelimiter')}</FieldLabel>
              <Select
                controlSize="sm"
                value={delimiterType}
                onChange={(e) => setDelimiterType(e.target.value as any)}
                className="bg-white"
              >
                <option value="space">{t('splitDelimSpace')}</option>
                <option value="comma">{t('splitDelimComma')}</option>
                <option value="semicolon">{t('splitDelimSemicolon')}</option>
                <option value="colon">{t('splitDelimColon')}</option>
                <option value="tab">{t('splitDelimTab')}</option>
                <option value="custom">{t('splitDelimCustom')}</option>
              </Select>
            </div>

            {delimiterType === 'custom' && (
              <div>
                <FieldLabel>{t('splitCustomDelimLabel')}</FieldLabel>
                <Input
                  controlSize="sm"
                  type="text"
                  dir="ltr"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="e.g. - or _ or @"
                  className="bg-white font-mono"
                />
              </div>
            )}

            <div>
              <FieldLabel>{t('splitAtLabel')}</FieldLabel>
              <div className="space-y-1.5">
                {[
                  { id: 'leftmost', label: t('splitAtLeftmost') },
                  { id: 'rightmost', label: t('splitAtRightmost') },
                  { id: 'every', label: t('splitAtEvery') },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer text-slate-700 min-w-0">
                    <input
                      type="radio"
                      name="splitAt"
                      value={opt.id}
                      checked={splitAt === opt.id}
                      onChange={() => setSplitAt(opt.id as any)}
                      className="text-sky-600 focus:ring-sky-500 shrink-0"
                    />
                    <span className="min-w-0">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Characters Mode Controls */}
        {mode === 'characters' && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 min-w-0">
            <FieldLabel>{t('splitCharCountLabel')}</FieldLabel>
            <Input
              controlSize="sm"
              type="number"
              min={1}
              max={500}
              value={charCount}
              onChange={(e) => setCharCount(parseInt(e.target.value, 10) || 1)}
              className="bg-white font-mono"
            />
          </div>
        )}

        {/* Positions Mode Controls */}
        {mode === 'positions' && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 min-w-0">
            <FieldLabel>{t('splitPositionsLabel')}</FieldLabel>
            <Input
              controlSize="sm"
              type="text"
              dir="ltr"
              value={positions}
              onChange={(e) => setPositions(e.target.value)}
              placeholder="0, 5, 10"
              className="bg-white font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1.5 block">{t('splitPositionsHint')}</span>
          </div>
        )}

        {/* Live Result Preview */}
        <div className="border border-slate-200 rounded-xl overflow-hidden min-w-0">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 min-w-0">
              <Eye className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">{t('splitPreviewTitle')}</span>
            </span>
            <span className="shrink-0">{t('splitGeneratesCols', { count: maxCols })}</span>
          </div>
          <div className="p-2 max-w-full overflow-x-auto max-h-36 bg-white">
            <table className="w-full text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  {Array.from({ length: maxCols }).map((_, i) => (
                    <th key={i} dir="auto" className="text-start py-1 px-2 font-semibold whitespace-nowrap">
                      {column}.{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((parts, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {Array.from({ length: maxCols }).map((_, cIdx) => (
                      <td key={cIdx} dir="auto" className="py-1 px-2 truncate max-w-[140px] text-slate-700">
                        {parts[cIdx] || <span className="text-slate-300 italic">{t('mergeEmptyCell')}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
};
