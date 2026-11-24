import React from 'react';
import { AlertTriangle, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  rows: number;
  columns: number;
  errors: number;
  stepIndex: number;
  stepCount: number;
  stepName: string;
  formula?: string;
  score: number;
  selectionSummaryText?: string | null;
  inspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

export const LabStatusBar: React.FC<Props> = ({ rows, columns, errors, stepIndex, stepCount, stepName, score, selectionSummaryText, inspectorOpen, onToggleInspector }) => {
  const { t } = useLanguage();
  return (
    <div className="shrink-0 bg-lab-panel border-t border-lab-line min-w-0">
      <div className="h-8 px-2.5 sm:px-4 flex items-center gap-2.5 sm:gap-4 text-[11px] text-lab-dim overflow-x-auto no-scrollbar max-w-full">
        <span className="font-mono whitespace-nowrap shrink-0"><b className="text-lab-text">{rows.toLocaleString()}</b> {t('labStatusRows')}</span>
        <span className="font-mono whitespace-nowrap shrink-0"><b className="text-lab-text">{columns}</b> {t('labStatusCols')}</span>
        {errors > 0 && (
          <span className="flex items-center gap-1 text-rose-300 font-semibold whitespace-nowrap shrink-0"><AlertTriangle className="w-3 h-3 shrink-0" /> {errors} {errors === 1 ? t('labStatusError') : t('labStatusErrors')}</span>
        )}
        <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${score >= 95 ? 'bg-emerald-400' : score >= 80 ? 'bg-amber-400' : 'bg-rose-400'}`} />
          <span className="hidden md:inline">{t('labStatusHealth')}</span>
          <b className="font-mono text-lab-text">{score}%</b>
        </span>
        {selectionSummaryText && (
          <span
            data-testid="lab-selection-summary"
            dir="auto"
            className="px-2 py-0.5 rounded bg-pulse-500/15 border border-pulse-400/30 text-pulse-200 font-medium truncate max-w-[160px] sm:max-w-xs shrink-0"
          >
            {selectionSummaryText}
          </span>
        )}
        <span className="flex-1 min-w-2" />
        <span className="truncate max-w-[140px] sm:max-w-xs hidden sm:inline">
          {t('labStatusStepOf')} <b className="font-mono text-lab-text">{stepIndex + 1}/{stepCount}</b> · <span className="text-lab-text" dir="auto">{stepName}</span>
        </span>
        {onToggleInspector && (
          <button
            type="button"
            onClick={onToggleInspector}
            aria-pressed={!!inspectorOpen}
            aria-label={inspectorOpen ? t('labInspectorHide') : t('labInspectorShow')}
            title={inspectorOpen ? t('labInspectorHide') : t('labInspectorShow')}
            className={`h-6 px-2 rounded-md flex items-center gap-1.5 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${inspectorOpen ? 'bg-pulse-400/15 text-pulse-200' : 'hover:bg-lab-raised hover:text-lab-text'}`}
          >
            {inspectorOpen ? <PanelRightClose className="w-3 h-3 rtl:rotate-180" /> : <PanelRightOpen className="w-3 h-3 rtl:rotate-180" />}
            <span className="hidden sm:inline">{t('labInspectorTitle')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
