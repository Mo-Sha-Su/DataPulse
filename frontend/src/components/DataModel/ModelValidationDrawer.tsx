import React, { useEffect } from 'react';
import { ModelValidationResult } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { X, ShieldCheck, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui';

interface Props {
  isOpen: boolean;
  validation: ModelValidationResult;
  onClose: () => void;
}

export const ModelValidationDrawer: React.FC<Props> = ({
  isOpen,
  validation,
  onClose,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scoreColor =
    validation.score >= 85
      ? 'text-emerald-600 bg-emerald-50 border-emerald-300'
      : validation.score >= 65
      ? 'text-amber-600 bg-amber-50 border-amber-300'
      : 'text-rose-600 bg-rose-50 border-rose-300';

  const progressBg =
    validation.score >= 85
      ? 'bg-emerald-500'
      : validation.score >= 65
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(28rem,100vw)] h-full bg-white border-s border-slate-200 shadow-2xl flex flex-col text-slate-800"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">{t('dmValidationDrawerTitle')}</h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {t('dmValidationDrawerDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer shrink-0"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Card */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-b from-slate-50/50 to-white space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dmValidationScoreLabel')}</span>
            <span dir="ltr" className={`text-xl font-black font-mono px-3 py-1 rounded-xl border tabular-nums shrink-0 ${scoreColor}`}>
              {validation.score}/100
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressBg} transition-all duration-500`}
              style={{ width: `${validation.score}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium pt-1">
            <span>{t('dmValidationChecksPassed', { passed: validation.passedChecks, total: validation.totalChecks })}</span>
            <span>{t('dmValidationObservations', { count: validation.issues.length })}</span>
          </div>
        </div>

        {/* Issues & Checks List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 text-xs">
          {/* Passed Highlights */}
          {validation.score >= 80 && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('dmValidationCorePassed')}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                {t('dmValidationCorePassedDesc')}
              </p>
            </div>
          )}

          {/* Issues List */}
          {validation.issues.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800">{t('dmValidationPerfectTitle')}</p>
              <p className="text-[11px]">{t('dmValidationPerfectDesc')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('dmValidationObsHeading')}
              </span>

              {validation.issues.map((iss) => {
                const Icon =
                  iss.severity === 'error'
                    ? AlertCircle
                    : iss.severity === 'warning'
                    ? AlertTriangle
                    : Info;

                const border =
                  iss.severity === 'error'
                    ? 'border-rose-200 bg-rose-50/50'
                    : iss.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-sky-200 bg-sky-50/50';

                const iconColor =
                  iss.severity === 'error'
                    ? 'text-rose-600'
                    : iss.severity === 'warning'
                    ? 'text-amber-600'
                    : 'text-sky-600';

                return (
                  <div key={iss.id} className={`p-3 rounded-xl border ${border} space-y-1.5 min-w-0`}>
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                      <div className="min-w-0 flex-1">
                        <h4 dir="auto" className="font-bold text-slate-900 leading-tight break-words">{iss.title}</h4>
                        <p dir="auto" className="text-[11px] text-slate-600 mt-0.5 break-words">{iss.message}</p>
                      </div>
                    </div>

                    {iss.suggestedAction && (
                      <div className="ps-6 pt-1 text-[10px] text-slate-500 font-medium break-words">
                        <strong className="text-slate-700">{t('dmValidationRecommendation')}</strong>{' '}
                        <span dir="auto">{iss.suggestedAction}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
          <Button type="button" variant="navy" size="sm" onClick={onClose}>
            {t('dmValidationCloseBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
};
