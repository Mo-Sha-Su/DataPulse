import React, { useState } from 'react';
import { DataModelState, ModelVersion } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { History, Save, RotateCcw, Clock } from 'lucide-react';
import { Modal, FieldLabel, Input, Button } from '../../ui';

interface Props {
  isOpen: boolean;
  currentModel: DataModelState;
  onClose: () => void;
  onSaveNewVersion: (versionName: string, description: string) => void;
  onRevertToVersion: (version: ModelVersion) => void;
}

export const ModelVersionsModal: React.FC<Props> = ({
  isOpen,
  currentModel,
  onClose,
  onSaveNewVersion,
  onRevertToVersion,
}) => {
  const { t } = useLanguage();
  const [versionName, setVersionName] = useState(() => `Model v${(currentModel.versions?.length || 0) + 1}`);
  const [description, setDescription] = useState('');
  const [confirmRevertId, setConfirmRevertId] = useState<string | null>(null);

  const handleSave = () => {
    if (!versionName.trim()) return;
    onSaveNewVersion(versionName.trim(), description.trim());
    setVersionName(`Model v${(currentModel.versions?.length || 0) + 2}`);
    setDescription('');
  };

  const versions = currentModel.versions || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closeLabel={t('close')}
      title={t('dmVersionsModalTitle')}
      subtitle={t('dmVersionsModalDesc')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
          <History className="w-4 h-4" />
        </div>
      }
      bodyClassName="space-y-4 text-xs text-slate-700 select-none"
      footer={
        <Button variant="navy" size="sm" onClick={onClose}>
          {t('close')}
        </Button>
      }
    >
      {/* Create Version Form */}
      <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
        <span className="font-bold text-slate-900 block">{t('dmVersionsSnapshotTitle')}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <FieldLabel>{t('dmVersionsNameLabel')}</FieldLabel>
            <Input
              controlSize="sm"
              type="text"
              dir="auto"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Model v2"
              className="bg-white font-bold"
            />
          </div>

          <div className="min-w-0">
            <FieldLabel>{t('dmVersionsNotesLabel')}</FieldLabel>
            <Input
              controlSize="sm"
              type="text"
              dir="auto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!versionName.trim()}
          icon={<Save className="w-3.5 h-3.5" />}
        >
          {t('dmVersionsSaveBtn')}
        </Button>
      </div>

      {/* Version History List */}
      <div>
        <span className="text-[11px] font-bold text-slate-700 mb-2 block">
          {t('dmVersionsHistoryTitle', { count: versions.length })}
        </span>
        {versions.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
            {t('dmVersionsNone')}
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((ver) => {
              const isConfirming = confirmRevertId === ver.id;
              return (
                <div
                  key={ver.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-purple-300 transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span dir="auto" className="font-bold text-slate-900 break-words">{ver.versionName}</span>
                      <span dir="ltr" className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {ver.createdAt}
                      </span>
                    </div>
                    {ver.description && (
                      <p dir="auto" className="text-[11px] text-slate-500 mt-0.5 break-words">{ver.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600 font-medium flex-wrap">
                      <span>{t('dmVersionsFacts', { count: ver.snapshot.factTables?.length || 0 })}</span>
                      <span>•</span>
                      <span>{t('dmVersionsDims', { count: ver.snapshot.dimensionTables?.length || 0 })}</span>
                      <span>•</span>
                      <span>{t('dmVersionsRels', { count: ver.snapshot.relationships?.length || 0 })}</span>
                      <span>•</span>
                      <span>{t('dmVersionsMeasures', { count: ver.snapshot.measures?.length || 0 })}</span>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end sm:self-auto">
                      <span className="text-[10px] font-semibold text-purple-800 hidden sm:inline">
                        {t('dmVersionsConfirmRevert', { name: ver.versionName })}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onRevertToVersion(ver);
                          setConfirmRevertId(null);
                          onClose();
                        }}
                      >
                        {t('dmVersionsConfirmYes')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmRevertId(null)}
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmRevertId(ver.id)}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      className="self-end sm:self-auto"
                    >
                      {t('dmVersionsRevertBtn')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
