import React, { useState } from 'react';
import { Dataset } from '../../types/dashboard';
import { FactTable } from '../../types/dataModel';
import { isKeyColumn, isMeasureColumn, createFactTableFromDataset } from '../../utils/dataModelingEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { Check, Layers } from 'lucide-react';
import { Modal, Button, FieldLabel, Input, Select } from '../../ui';

interface Props {
  isOpen: boolean;
  datasets: Dataset[];
  onClose: () => void;
  onSave: (factTable: FactTable) => void;
}

export const CreateFactModal: React.FC<Props> = ({
  isOpen,
  datasets,
  onClose,
  onSave,
}) => {
  const { t, tPlural } = useLanguage();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(() => datasets[0]?.id || '');
  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const [factName, setFactName] = useState<string>(() => {
    if (!selectedDataset) return 'FACT_TABLE';
    const clean = (selectedDataset.name || 'TABLE').toUpperCase().replace(/\s+/g, '_');
    return clean.startsWith('FACT_') ? clean : `FACT_${clean}`;
  });

  const [foreignKeys, setForeignKeys] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string>('');

  React.useEffect(() => {
    if (selectedDataset) {
      const clean = (selectedDataset.name || 'TABLE').toUpperCase().replace(/\s+/g, '_');
      setFactName(clean.startsWith('FACT_') ? clean : `FACT_${clean}`);

      const detectedKeys = selectedDataset.columns.filter((c) => isKeyColumn(c.name)).map((c) => c.name);
      const detectedMeasures = selectedDataset.columns.filter((c) => isMeasureColumn(c.name, c.type, c.sampleValue)).map((c) => c.name);

      setPrimaryKey(detectedKeys[0] || '');
      setForeignKeys(detectedKeys.slice(1));
      setMeasures(detectedMeasures.length > 0 ? detectedMeasures : selectedDataset.columns.filter((c) => c.type === 'number').map((c) => c.name));
    }
  }, [selectedDatasetId]);

  const toggleForeignKey = (col: string) => {
    if (foreignKeys.includes(col)) {
      setForeignKeys(foreignKeys.filter((k) => k !== col));
    } else {
      setForeignKeys([...foreignKeys, col]);
      setMeasures(measures.filter((m) => m !== col));
    }
  };

  const toggleMeasure = (col: string) => {
    if (measures.includes(col)) {
      setMeasures(measures.filter((m) => m !== col));
    } else {
      setMeasures([...measures, col]);
      setForeignKeys(foreignKeys.filter((k) => k !== col));
      if (primaryKey === col) setPrimaryKey('');
    }
  };

  const handleApply = () => {
    if (!selectedDataset) return;
    const fact = createFactTableFromDataset(
      selectedDataset,
      factName,
      foreignKeys,
      measures,
      primaryKey || undefined
    );
    onSave(fact);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(selectedDataset)}
      onClose={onClose}
      size="xl"
      title={t('dmFactModalTitle')}
      subtitle={t('dmFactModalDesc')}
      closeLabel={t('close')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
          <Layers className="w-4 h-4" />
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
            disabled={!factName.trim() || measures.length === 0}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {t('dmCreateFactBtn')}
          </Button>
        </div>
      }
    >
      {selectedDataset && (
        <div className="space-y-4 text-xs text-slate-700">
          {/* Dataset Selector */}
          <div>
            <FieldLabel>{t('dmSourceDataset')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="h-9 font-semibold"
            >
              {datasets.map((d) => {
                const rc = d.rowCount ?? (d as any).row_count ?? (d.data?.length || 0);
                const cc = d.columnCount ?? (d as any).column_count ?? (d.columns?.length || 0);
                return (
                  <option key={d.id} value={d.id}>
                    {d.name} ({t('importPreviewMeta', { cols: cc, rows: rc })})
                  </option>
                );
              })}
            </Select>
          </div>

          {/* Fact Table Name */}
          <div>
            <FieldLabel>{t('dmFactTableName')}</FieldLabel>
            <Input
              type="text"
              controlSize="sm"
              dir="ltr"
              value={factName}
              onChange={(e) => setFactName(e.target.value)}
              placeholder="FACT_SALES"
              className="h-9 font-mono font-bold"
            />
          </div>

          {/* Primary Key (Optional) */}
          <div>
            <FieldLabel>{t('dmOptionalPrimaryKey')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={primaryKey}
              onChange={(e) => setPrimaryKey(e.target.value)}
              className="h-9 font-semibold"
            >
              <option value="">{t('dmNoCompositeKey')}</option>
              {selectedDataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Foreign Keys Selection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-slate-700">{t('dmForeignKeysLabel')}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{tPlural('selected', foreignKeys.length)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
              {selectedDataset.columns.map((col) => {
                const isSelected = foreignKeys.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleForeignKey(col.name)}
                    className={`min-w-0 px-2.5 py-1.5 rounded-lg border text-start text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span dir="auto" className="truncate min-w-0">🔗 {col.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ms-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Measures Selection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-slate-700">{t('dmMeasuresLabel')}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{tPlural('selected', measures.length)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
              {selectedDataset.columns.map((col) => {
                const isSelected = measures.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleMeasure(col.name)}
                    className={`min-w-0 px-2.5 py-1.5 rounded-lg border text-start text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span dir="auto" className="truncate min-w-0">📐 {col.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ms-1" />}
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
