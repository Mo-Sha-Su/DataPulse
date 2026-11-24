import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchNeonStatus, NeonStatus } from '../services/neonService';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  compact?: boolean;
}

export const NeonStatusBadge: React.FC<Props> = ({ compact = false }) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<NeonStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    setIsRefreshing(true);
    const res = await fetchNeonStatus();
    setStatus(res);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status?.connected ?? true;

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium select-none ${
          isConnected
            ? 'bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200/80 shadow-2xs'
            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 shadow-2xs'
        }`}
        title={t('dbConnectionTitle')}
        aria-label={t('dbConnectionTitle')}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>
        <Database className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold text-[11px] tracking-tight">
          {compact ? t('dbCompactLabel') : t('dbLabel')}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute end-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-50 p-3.5 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">{t('dbLabel')}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  checkStatus();
                }}
                disabled={isRefreshing}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                title={t('dbRefreshStatus')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="py-2.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('dbStatusLabel')}</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t('dbConnected')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                    <AlertCircle className="w-3 h-3 text-rose-600" /> {t('dbDisconnected')}
                  </span>
                )}
              </div>
              {status?.latencyMs !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t('dbLatency')}</span>
                  <span dir="ltr" className="font-mono text-emerald-600 font-semibold">
                    {t('dbLatencyMs', { ms: status.latencyMs })}
                  </span>
                </div>
              )}
              {status?.stats && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 text-xs">{status.stats.tables}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-medium">{t('dbTables')}</div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 text-xs">{status.stats.datasets}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-medium">{t('dbDatasets')}</div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 text-xs">{status.stats.dashboards}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-medium">{t('dbDashboards')}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>{t('dbServerless')}</span>
              <span className="text-emerald-600 font-medium">{t('dbLivePooler')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
