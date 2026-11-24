import React, { useId, useState } from 'react';
import { Rows, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button, FieldLabel, Input, Modal } from '../../ui';

export type RowOperationAction =
  | 'remove_top'
  | 'remove_bottom'
  | 'remove_alternate'
  | 'remove_blank'
  | 'keep_top'
  | 'keep_bottom'
  | 'keep_range';

interface Props {
  isOpen: boolean;
  actionType: RowOperationAction;
  totalRows: number;
  onClose: () => void;
  onApply: (params: {
    action: RowOperationAction;
    count?: number;
    startRow?: number;
    numToRemove?: number;
    numToKeep?: number;
  }) => void;
}

export const ManageRowsModal: React.FC<Props> = ({
  isOpen,
  actionType,
  totalRows,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const formId = useId();
  const [count, setCount] = useState<number>(10);
  const [startRow, setStartRow] = useState<number>(1);
  const [numToRemove, setNumToRemove] = useState<number>(1);
  const [numToKeep, setNumToKeep] = useState<number>(1);

  if (!isOpen) return null;

  const getTitleAndDesc = () => {
    switch (actionType) {
      case 'remove_top':
        return {
          title: t('manageRowsRemoveTopTitle'),
          desc: t('manageRowsRemoveTopDesc'),
          label: t('manageRowsCountRemove'),
        };
      case 'remove_bottom':
        return {
          title: t('manageRowsRemoveBottomTitle'),
          desc: t('manageRowsRemoveBottomDesc'),
          label: t('manageRowsCountRemove'),
        };
      case 'remove_blank':
        return {
          title: t('manageRowsRemoveBlankTitle'),
          desc: t('manageRowsRemoveBlankDesc'),
          label: '',
        };
      case 'remove_alternate':
        return {
          title: t('manageRowsRemoveAltTitle'),
          desc: t('manageRowsRemoveAltDesc'),
          label: '',
        };
      case 'keep_top':
        return {
          title: t('manageRowsKeepTopTitle'),
          desc: t('manageRowsKeepTopDesc'),
          label: t('manageRowsCountKeep'),
        };
      case 'keep_bottom':
        return {
          title: t('manageRowsKeepBottomTitle'),
          desc: t('manageRowsKeepBottomDesc'),
          label: t('manageRowsCountKeep'),
        };
      case 'keep_range':
        return {
          title: t('manageRowsKeepRangeTitle'),
          desc: t('manageRowsKeepRangeDesc'),
          label: '',
        };
    }
  };

  const info = getTitleAndDesc();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      action: actionType,
      count,
      startRow,
      numToRemove,
      numToKeep,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeLabel={t('close')}
      icon={<Rows className="w-4 h-4 text-sky-600" />}
      title={info.title}
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
            {t('manageRowsApply')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-800">
        <p className="text-slate-600 leading-relaxed">{info.desc}</p>

        {['remove_top', 'remove_bottom', 'keep_top', 'keep_bottom'].includes(actionType) && (
          <div className="min-w-0">
            <FieldLabel>{info.label}</FieldLabel>
            <Input
              controlSize="sm"
              type="number"
              min={1}
              max={totalRows}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="bg-white font-mono"
              autoFocus
            />
            <span className="text-[11px] text-slate-500 mt-1.5 block">{t('manageRowsCurrentTotal', { total: totalRows })}</span>
          </div>
        )}

        {actionType === 'keep_range' && (
          <div className="space-y-3 min-w-0">
            <div>
              <FieldLabel>{t('manageRowsStartIndex')}</FieldLabel>
              <Input
                controlSize="sm"
                type="number"
                min={1}
                max={totalRows}
                value={startRow}
                onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white font-mono"
                autoFocus
              />
            </div>
            <div>
              <FieldLabel>{t('manageRowsCountKeep')}</FieldLabel>
              <Input
                controlSize="sm"
                type="number"
                min={1}
                max={totalRows}
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white font-mono"
              />
            </div>
          </div>
        )}

        {actionType === 'remove_alternate' && (
          <div className="space-y-3 min-w-0">
            <div>
              <FieldLabel>{t('manageRowsFirstToRemove')}</FieldLabel>
              <Input
                controlSize="sm"
                type="number"
                min={1}
                value={startRow}
                onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white font-mono"
              />
            </div>
            <div>
              <FieldLabel>{t('manageRowsCountRemove')}</FieldLabel>
              <Input
                controlSize="sm"
                type="number"
                min={1}
                value={numToRemove}
                onChange={(e) => setNumToRemove(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white font-mono"
              />
            </div>
            <div>
              <FieldLabel>{t('manageRowsCountKeep')}</FieldLabel>
              <Input
                controlSize="sm"
                type="number"
                min={1}
                value={numToKeep}
                onChange={(e) => setNumToKeep(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white font-mono"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
