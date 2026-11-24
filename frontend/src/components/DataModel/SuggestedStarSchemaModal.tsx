import React from 'react';
import { SuggestedStarSchema } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { Sparkles, Check, CheckCircle2, ArrowRight, ShieldCheck, Layers, Box } from 'lucide-react';
import { Modal, Button } from '../../ui';

interface Props {
  isOpen: boolean;
  suggestion: SuggestedStarSchema;
  onClose: () => void;
  onApply: () => void;
}

export const SuggestedStarSchemaModal: React.FC<Props> = ({
  isOpen,
  suggestion,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();

  const confidenceLabel =
    suggestion.confidence === 'High'
      ? t('dmSuggestConfidenceHigh')
      : suggestion.confidence === 'Medium'
      ? t('dmSuggestConfidenceMedium')
      : t('dmSuggestConfidenceLow');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      closeLabel={t('close')}
      title={t('dmSuggestModalTitle')}
      subtitle={t('dmSuggestModalDesc')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
      }
      headerExtra={
        <span
          className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ${
            suggestion.confidence === 'High'
              ? 'bg-emerald-100 text-emerald-800'
              : suggestion.confidence === 'Medium'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {t('dmSuggestConfidence', { level: confidenceLabel, score: suggestion.confidenceScore })}
        </span>
      }
      bodyClassName="space-y-4 text-xs text-slate-700 select-none"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('dmSuggestRejectBtn')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onApply();
              onClose();
            }}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            {t('dmSuggestApplyBtn')}
          </Button>
        </div>
      }
    >
      {/* Mobile Confidence Badge */}
      <div className="sm:hidden">
        <span
          className={`inline-flex text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
            suggestion.confidence === 'High'
              ? 'bg-emerald-100 text-emerald-800'
              : suggestion.confidence === 'Medium'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {t('dmSuggestConfidence', { level: confidenceLabel, score: suggestion.confidenceScore })}
        </span>
      </div>

      {/* Summary Banner */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <p dir="auto" className="font-semibold text-slate-800 min-w-0 break-words">{suggestion.summary}</p>
      </div>

      {/* Fact & Dimensions Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fact Tables */}
        <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 min-w-0">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Layers className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{t('dmSuggestFactsTitle', { count: suggestion.factTables.length })}</span>
          </div>
          <div className="space-y-1.5">
            {suggestion.factTables.map((f) => (
              <div key={f.id} className="p-2 bg-white border border-amber-200/80 rounded-lg min-w-0">
                <span dir="auto" className="font-bold text-slate-900 block truncate">{f.name}</span>
                <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                  <span>📐 {t('dmSuggestMeasuresCount', { count: f.measures.length })}</span>
                  <span>•</span>
                  <span>🔗 {t('dmSuggestFkCount', { count: f.foreignKeys.length })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension Tables */}
        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 min-w-0">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Box className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{t('dmSuggestDimsTitle', { count: suggestion.dimensionTables.length })}</span>
          </div>
          <div className="space-y-1.5">
            {suggestion.dimensionTables.map((d) => (
              <div key={d.id} className="p-2 bg-white border border-emerald-200/80 rounded-lg min-w-0">
                <span dir="auto" className="font-bold text-slate-900 block truncate">{d.name}</span>
                <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                  <span dir="auto" className="font-mono text-emerald-700 truncate max-w-full">🔑 {d.primaryKey}</span>
                  <span>•</span>
                  <span>🏷️ {t('dmSuggestAttrCount', { count: d.attributes.length })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detected Relationships */}
      <div>
        <span className="text-[11px] font-bold text-slate-700 mb-1.5 block">
          {t('dmSuggestRelsTitle', { count: suggestion.relationships.length })}
        </span>
        <div className="space-y-1.5">
          {suggestion.relationships.map((r) => (
            <div
              key={r.id}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
            >
              <div dir="ltr" className="flex items-center flex-wrap gap-2 text-slate-800 min-w-0">
                <span className="font-bold text-emerald-700 break-all">{r.fromColumn}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold shrink-0">
                  {r.cardinality}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-amber-700 break-all">{r.toColumn}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-sans font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                {t('dmSuggestMatchPct', { pct: r.confidence })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rationale Points */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dmSuggestLogicTitle')}</span>
        {suggestion.reasons.map((r, i) => (
          <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 min-w-0">
            <span className="text-sky-600 font-bold shrink-0">•</span>
            <span dir="auto" className="min-w-0 break-words">{r}</span>
          </p>
        ))}
      </div>
    </Modal>
  );
};
