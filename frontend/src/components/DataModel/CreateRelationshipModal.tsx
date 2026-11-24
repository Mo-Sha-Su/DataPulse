import React, { useState, useMemo } from 'react';
import { Dataset } from '../../types/dashboard';
import { FactTable, DimensionTable, Relationship, Cardinality } from '../../types/dataModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { Network, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal, FieldLabel, Select, Button } from '../../ui';

interface Props {
  isOpen: boolean;
  factTables: FactTable[];
  dimensionTables: DimensionTable[];
  datasets: Dataset[];
  existingRelationships: Relationship[];
  initialRelationship?: Relationship | null;
  onClose: () => void;
  onSave: (rel: Relationship) => void;
}

export const CreateRelationshipModal: React.FC<Props> = ({
  isOpen,
  factTables,
  dimensionTables,
  datasets,
  existingRelationships,
  initialRelationship,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();

  const allTables = useMemo(() => {
    return [
      ...dimensionTables.map((d) => ({ id: d.id, name: d.name, type: 'DIM' as const, datasetId: d.datasetId, defaultCol: d.primaryKey })),
      ...factTables.map((f) => ({ id: f.id, name: f.name, type: 'FACT' as const, datasetId: f.datasetId, defaultCol: f.foreignKeys[0] || f.primaryKey || '' })),
    ];
  }, [dimensionTables, factTables]);

  const [fromTableId, setFromTableId] = useState<string>(() => {
    if (initialRelationship) return initialRelationship.fromTableId;
    return dimensionTables[0]?.id || allTables[0]?.id || '';
  });

  const [toTableId, setToTableId] = useState<string>(() => {
    if (initialRelationship) return initialRelationship.toTableId;
    return factTables[0]?.id || allTables[1]?.id || '';
  });

  const datasetMap = useMemo(() => {
    const map = new Map<string, Dataset>();
    datasets.forEach((d) => map.set(d.id, d));
    return map;
  }, [datasets]);

  const fromTable = allTables.find((t) => t.id === fromTableId);
  const toTable = allTables.find((t) => t.id === toTableId);

  const fromDataset = fromTable ? datasetMap.get(fromTable.datasetId) : undefined;
  const toDataset = toTable ? datasetMap.get(toTable.datasetId) : undefined;

  const fromColumns = fromDataset ? fromDataset.columns.map((c) => c.name) : [];
  const toColumns = toDataset ? toDataset.columns.map((c) => c.name) : [];

  const [fromColumn, setFromColumn] = useState<string>(() => {
    if (initialRelationship) return initialRelationship.fromColumn;
    return fromTable?.defaultCol || fromColumns[0] || '';
  });

  const [toColumn, setToColumn] = useState<string>(() => {
    if (initialRelationship) return initialRelationship.toColumn;
    return toColumns.find((c) => c.toLowerCase() === fromColumn.toLowerCase()) || toTable?.defaultCol || toColumns[0] || '';
  });

  const [cardinality, setCardinality] = useState<Cardinality>(() => {
    return initialRelationship?.cardinality || '1:*';
  });

  // Validation
  const validation = useMemo(() => {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!fromTableId || !toTableId) {
      errors.push(t('dmRelErrBothTables'));
      return { isValid: false, warnings, errors, matchPct: 0 };
    }

    if (fromTableId === toTableId) {
      errors.push(t('dmRelErrSelfRel'));
      return { isValid: false, warnings, errors, matchPct: 0 };
    }

    if (!fromColumn || !toColumn) {
      errors.push(t('dmRelErrBothCols'));
      return { isValid: false, warnings, errors, matchPct: 0 };
    }

    // Check duplicate relationship
    const isDup = existingRelationships.some(
      (r) =>
        r.id !== initialRelationship?.id &&
        r.fromTableId === fromTableId &&
        r.fromColumn === fromColumn &&
        r.toTableId === toTableId &&
        r.toColumn === toColumn
    );
    if (isDup) {
      errors.push(t('dmRelErrDuplicate'));
    }

    // Referential Integrity Check
    let matchPct = 100;
    if (fromDataset && toDataset) {
      const fromKeys = new Set(fromDataset.data.map((r) => String(r[fromColumn] ?? '')));
      const toKeys = toDataset.data.map((r) => String(r[toColumn] ?? '')).filter((k) => k !== '');

      // Check unique dimension keys
      if (fromTable?.type === 'DIM') {
        const rawFromKeys = fromDataset.data.map((r) => r[fromColumn]);
        const uniqueFromCount = new Set(rawFromKeys).size;
        if (rawFromKeys.length > uniqueFromCount) {
          warnings.push(
            t('dmRelWarnDupKeys', { col: fromColumn, table: fromTable.name })
          );
        }
      }

      if (toKeys.length > 0) {
        const orphans = toKeys.filter((k) => !fromKeys.has(k));
        if (orphans.length > 0) {
          const orphanPct = Math.round((orphans.length / toKeys.length) * 100);
          matchPct = 100 - orphanPct;
          if (orphanPct > 20) {
            warnings.push(
              t('dmRelWarnOrphansPct', {
                pct: orphanPct,
                toTable: toTable?.name || '',
                toCol: toColumn,
                fromTable: fromTable?.name || '',
              })
            );
          } else {
            warnings.push(t('dmRelWarnOrphansCount', { count: orphans.length, pct: orphanPct }));
          }
        }
      }

      // Check data type compatibility
      const fromColDef = fromDataset.columns.find((c) => c.name === fromColumn);
      const toColDef = toDataset.columns.find((c) => c.name === toColumn);
      if (fromColDef && toColDef && fromColDef.type !== toColDef.type) {
        warnings.push(
          t('dmRelWarnTypeMismatch', {
            fromCol: fromColumn,
            fromType: fromColDef.type,
            toCol: toColumn,
            toType: toColDef.type,
          })
        );
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      matchPct,
    };
  }, [fromTableId, toTableId, fromColumn, toColumn, fromDataset, toDataset, existingRelationships, initialRelationship, fromTable, toTable, t]);

  const handleSave = () => {
    if (!validation.isValid) return;

    const rel: Relationship = {
      id: initialRelationship?.id || `rel_${fromTableId}_${toTableId}_${Date.now()}`,
      name: `${fromTable?.name} (${fromColumn}) ── ${cardinality} ──> ${toTable?.name} (${toColumn})`,
      fromTableId,
      fromColumn,
      toTableId,
      toColumn,
      cardinality,
      isActive: true,
      confidence: 100,
    };
    onSave(rel);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closeLabel={t('close')}
      title={initialRelationship ? t('dmRelModalEditTitle') : t('dmRelModalCreateTitle')}
      subtitle={t('dmRelModalDesc')}
      icon={
        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
          <Network className="w-4 h-4" />
        </div>
      }
      bodyClassName="space-y-4 text-xs text-slate-700 select-none"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!validation.isValid}
          >
            {initialRelationship ? t('dmRelUpdateBtn') : t('dmRelCreateBtn')}
          </Button>
        </div>
      }
    >
      {/* Visual Link Indicator */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="w-full sm:flex-1 min-w-0 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dmRelFromDim')}</span>
          <span dir="auto" className="font-bold text-slate-900 truncate block">{fromTable?.name || t('dmRelSelectTable')}</span>
          <span dir="auto" className="text-[11px] font-mono text-sky-600 font-semibold truncate block">{fromColumn || t('dmRelSelectCol')}</span>
        </div>
        <div className="px-3 flex flex-col items-center shrink-0">
          <span dir="ltr" className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
            {cardinality}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400 my-1 rotate-90 sm:rotate-0 rtl:sm:rotate-180" />
        </div>
        <div className="w-full sm:flex-1 min-w-0 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dmRelToFact')}</span>
          <span dir="auto" className="font-bold text-slate-900 truncate block">{toTable?.name || t('dmRelSelectTable')}</span>
          <span dir="auto" className="text-[11px] font-mono text-sky-600 font-semibold truncate block">{toColumn || t('dmRelSelectCol')}</span>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* From Table & Column */}
        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl min-w-0">
          <div>
            <FieldLabel>{t('dmRelFromTableLabel')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={fromTableId}
              onChange={(e) => {
                const newId = e.target.value;
                setFromTableId(newId);
                const tbl = allTables.find((item) => item.id === newId);
                const ds = tbl ? datasetMap.get(tbl.datasetId) : undefined;
                setFromColumn(tbl?.defaultCol || ds?.columns[0]?.name || '');
              }}
            >
              {allTables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  [{tbl.type}] {tbl.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>{t('dmRelFromColLabel')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={fromColumn}
              onChange={(e) => setFromColumn(e.target.value)}
            >
              {fromColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* To Table & Column */}
        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl min-w-0">
          <div>
            <FieldLabel>{t('dmRelToTableLabel')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={toTableId}
              onChange={(e) => {
                const newId = e.target.value;
                setToTableId(newId);
                const tbl = allTables.find((item) => item.id === newId);
                const ds = tbl ? datasetMap.get(tbl.datasetId) : undefined;
                setToColumn(tbl?.defaultCol || ds?.columns[0]?.name || '');
              }}
            >
              {allTables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  [{tbl.type}] {tbl.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel>{t('dmRelToColLabel')}</FieldLabel>
            <Select
              controlSize="sm"
              dir="auto"
              value={toColumn}
              onChange={(e) => setToColumn(e.target.value)}
            >
              {toColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Cardinality Selector */}
      <div>
        <FieldLabel>{t('dmRelCardinalityLabel')}</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setCardinality('1:*')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer text-center ${
              cardinality === '1:*'
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{t('dmRelOneToMany')}</span>
            <span className="text-[10px] font-normal text-slate-500">{t('dmRelOneToManySub')}</span>
          </button>

          <button
            type="button"
            onClick={() => setCardinality('*:1')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer text-center ${
              cardinality === '*:1'
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{t('dmRelManyToOne')}</span>
            <span className="text-[10px] font-normal text-slate-500">{t('dmRelManyToOneSub')}</span>
          </button>

          <button
            type="button"
            onClick={() => setCardinality('1:1')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer text-center ${
              cardinality === '1:1'
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{t('dmRelOneToOne')}</span>
            <span className="text-[10px] font-normal text-slate-500">{t('dmRelOneToOneSub')}</span>
          </button>
        </div>
      </div>

      {/* Validation Feedback */}
      {validation.errors.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-800">
          {validation.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="break-words min-w-0">{err}</span>
            </div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-800">
          {validation.warnings.map((warn, i) => (
            <div key={i} className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="break-words min-w-0">{warn}</span>
            </div>
          ))}
        </div>
      )}

      {validation.isValid && validation.warnings.length === 0 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="break-words min-w-0">{t('dmRelValidVerified')}</span>
        </div>
      )}
    </Modal>
  );
};
