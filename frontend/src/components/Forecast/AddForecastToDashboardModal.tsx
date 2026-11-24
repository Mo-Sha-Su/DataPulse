import React from 'react';
import { DashboardState } from '../../types/dashboard';
import { Button, FieldLabel, Modal, Select } from '../../ui';
import { useLanguage } from '../../i18n/LanguageContext';

export interface AddForecastToDashboardModalProps {
  savedDashboards: DashboardState[];
  selectedTargetDashboardId: string;
  isAddingToDashboard: boolean;
  onChangeTargetDashboardId: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Modal dialog allowing the user to pin the active Forecast Studio result
 * as a forecast widget on an existing dashboard/report or a brand-new dashboard.
 */
export const AddForecastToDashboardModal: React.FC<AddForecastToDashboardModalProps> = ({
  savedDashboards,
  selectedTargetDashboardId,
  isAddingToDashboard,
  onChangeTargetDashboardId,
  onConfirm,
  onClose,
}) => {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('fcAddToDashboardTitle')}
      size="md"
      closeLabel={t('close')}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('dataHubCancelBtn')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isAddingToDashboard}
            onClick={onConfirm}
          >
            {isAddingToDashboard ? t('savingChanges') : t('fcAddWidgetConfirmBtn')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">{t('fcAddToDashboardDesc')}</p>

        <div>
          <FieldLabel htmlFor="forecast-target-dashboard">{t('fcTargetDashboardLabel')}</FieldLabel>
          <Select
            id="forecast-target-dashboard"
            value={selectedTargetDashboardId}
            onChange={(e) => onChangeTargetDashboardId(e.target.value)}
            className="text-xs font-semibold"
          >
            <option value="__new__">{t('fcCreateNewDashboardOption')}</option>
            {savedDashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.type === 'report' ? t('reportBadge') : t('dashboardBadge')})
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
};
