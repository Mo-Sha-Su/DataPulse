import React, { useState } from 'react';
import { DashboardState } from '../../types/dashboard';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  FolderOpen,
  Download,
  Upload,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Modal, Button, EmptyState } from '../../ui';

interface Props {
  currentDashboard: DashboardState;
  savedDashboards: DashboardState[];
  onLoadDashboard: (dashboard: DashboardState) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onImportDashboardJson: (importedState: DashboardState) => void;
  onClose: () => void;
}

export const ManageDashboardsModal: React.FC<Props> = ({
  currentDashboard,
  savedDashboards,
  onLoadDashboard,
  onDeleteDashboard,
  onImportDashboardJson,
  onClose,
}) => {
  const { t } = useLanguage();
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const allDashboards = savedDashboards;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentDashboard, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentDashboard.name.toLowerCase().replace(/\s+/g, '_')}_dashboard.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DashboardState;
      if (parsed && parsed.widgets && parsed.canvas) {
        onImportDashboardJson(parsed);
        setShowImportArea(false);
      } else {
        setImportError(t('invalidJsonError'));
      }
    } catch {
      setImportError(t('invalidJsonError'));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="2xl"
      title={t('dashboardManagerTitle')}
      closeLabel={t('close')}
      icon={
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 grid place-items-center">
          <FolderOpen className="w-4 h-4" />
        </div>
      }
      footer={
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          {t('close')}
        </Button>
      }
    >
      <div className="space-y-4 text-slate-800">
        {/* Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleExportJson}
            icon={<Download className="w-4 h-4 text-emerald-600" />}
            className="w-full"
          >
            {t('exportDashboardJson')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setShowImportArea(!showImportArea);
              setImportError(null);
            }}
            icon={<Upload className="w-4 h-4 text-sky-600" />}
            className="w-full"
          >
            {t('importJson')}
          </Button>
        </div>

        {/* Import Dashboard File Picker */}
        {showImportArea && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">{t('pasteDashboardJson')}</span>
            {importError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 w-full py-4 px-3 bg-white border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer text-center">
              <Upload className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{t('applyImportedDashboard')}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Dashboards List */}
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {t('availableDashboards')} ({allDashboards.length})
          </span>

          {allDashboards.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-5 h-5" />}
              title={t('availableDashboards')}
              description={t('createFirstDashboardDesc')}
            />
          ) : (
            allDashboards.map((dash) => {
              const isActive = dash.id === currentDashboard.id;
              return (
                <div
                  key={dash.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isActive
                      ? 'border-sky-500 bg-sky-50/60 ring-1 ring-sky-500'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span dir="auto" className="font-bold text-sm text-slate-900 truncate max-w-full">
                        {dash.name}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-bold uppercase shrink-0">
                          {t('activeWorkspaceBadge')}
                        </span>
                      )}
                    </div>
                    {dash.description && (
                      <p dir="auto" className="text-xs text-slate-500 font-medium line-clamp-2">
                        {dash.description}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold block truncate">
                      {dash.widgets.length} {t('widgets')} • {dash.canvas.presetName}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {!isActive && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onLoadDashboard(dash);
                          onClose();
                        }}
                      >
                        {t('loadWorkspaceBtn')}
                      </Button>
                    )}
                    {savedDashboards.some((s) => s.id === dash.id) && (
                      <button
                        type="button"
                        onClick={() => onDeleteDashboard(dash.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title={t('delete')}
                        aria-label={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
