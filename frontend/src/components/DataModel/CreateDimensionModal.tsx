import React, { useState } from 'react';
import { Dataset } from '../../types/dashboard';
import { DimensionTable } from '../../types/dataModel';
import { isKeyColumn, createDimensionFromDataset } from '../../utils/dataModelingEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { Check, Box } from 'lucide-react';
import { Modal, Button, FieldLabel, Input, Select } from '../../ui';

interface Props {
  isOpen: boolean;
  datasets: Dataset[];
  onClose: () => void;
  onSave: (result: { dataset: Dataset; dimension: DimensionTable }) => void;
}

export const CreateDimensionModal: React.FC<Props> = ({
  isOpen,
  datasets,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(() => datasets[0]?.id || '');
  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const [dimName, setDimName] = useState<string>(() => {
    if (!selectedDataset) return 'DIM_ENTITY';
    const clean = (selectedDataset.name || 'ENTITY').toUpperCase().replace(/\s+/g, '_');
    return clean.startsWith('DIM_') ? clean : `DIM_${clean}`;
  });

  const [primaryKey, setPrimaryKey] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  React.useEffect(() => {
    if (selectedDataset) {
      const clean = (selectedDataset.name || 'ENTITY').toUpperCase().replace(/\s+/g, '_');
      setDimName(clean.startsWith('DIM_') ? clean : `DIM_${clean}`);

      const detectedKeys = selectedDataset.columns.filter((c) => isKeyColumn(c.name)).map((c) => c.name);
      const pk = detectedKeys[0] || selectedDataset.columns[0]?.name || '';
      setPrimaryKey(pk);
      setSelectedColumns(selectedDataset.columns.map((c) => c.name));
    }
  }, [selectedDatasetId]);

  const toggleColumn = (col: string) => {
    if (col === primaryKey) return;
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleApply = () => {
    if (!selectedDataset || !primaryKey || selectedColumns.length === 0) return;
    const res = createDimensionFromDataset(
      selectedDataset,
      selectedColumns,
      primaryKey,
      dimName
    );
    onSave(res);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(selectedDataset)}
      onClose={onClose}
      size="xl"
      title={t('dmDimModalTitle')}
      subtitle={t('dmDimModalDesc')}
      closeLabel={t('close')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <Box className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={!dimName.trim() || !primaryKey || selectedColumns.length === 0}
          >
            {t('dmCreateDimBtn')}
          </Button>
        </div>
      }
    >
      {selectedDataset && (
        <div className="space-y-4 text-xs text-slate-700">
          {/* Source Dataset */}
          <div>
            <FieldLabel>{t('dmSourceDataset')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="h-9 font-semibold"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount ?? (d as any).row_count ?? (d.data?.length || 0)} {t('dmRowsSuffix')})
                </option>
              ))}
            </Select>
          </div>

          {/* Dimension Name */}
          <div>
            <FieldLabel>{t('dmDimTableName')}</FieldLabel>
            <Input
              type="text"
              controlSize="sm"
              dir="ltr"
              value={dimName}
              onChange={(e) => setDimName(e.target.value)}
              placeholder="DIM_CUSTOMER"
              className="h-9 font-mono font-bold"
            />
          </div>

          {/* Primary Key Selection */}
          <div>
            <FieldLabel>{t('dmUniquePrimaryKey')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={primaryKey}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryKey(val);
                if (!selectedColumns.includes(val)) {
                  setSelectedColumns([...selectedColumns, val]);
                }
              }}
              className="h-9 font-semibold"
            >
              {selectedDataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  🔑 {c.name} ({c.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Columns Selection */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-700">{t('dmIncludedAttributes')}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColumns(selectedDataset.columns.map((c) => c.name))}
                  className="text-[11px] text-sky-600 hover:underline font-semibold cursor-pointer"
                >
                  {t('dmSelectAll')}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedColumns([primaryKey])}
                  className="text-[11px] text-slate-500 hover:underline font-semibold cursor-pointer"
                >
                  {t('dmClearOptional')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-44 overflow-y-auto">
              {selectedDataset.columns.map((col) => {
                const isSelected = selectedColumns.includes(col.name);
                const isPk = col.name === primaryKey;

                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleColumn(col.name)}
                    className={`min-w-0 px-2.5 py-1.5 rounded-lg border text-start text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isPk
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span dir="auto" className="truncate min-w-0">
                      {isPk ? '🔑 ' : '🏷️ '}
                      {col.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ms-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
