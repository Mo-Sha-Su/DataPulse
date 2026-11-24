import React, { useState } from 'react';
import { Dataset } from '../../types/dashboard';
import { useLanguage } from '../../i18n/LanguageContext';
import { Search, Table, Sparkles } from 'lucide-react';
import { Modal, Button, Input } from '../../ui';

interface Props {
  dataset: Dataset | null;
  onClose: () => void;
  onOpenDataCleaning?: (datasetId: string) => void;
}

export const DatasetPreviewModal: React.FC<Props> = ({ dataset, onClose, onOpenDataCleaning }) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const rows = dataset?.data ?? [];
  const columns = dataset?.columns ?? [];
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Modal
      isOpen={Boolean(dataset)}
      onClose={onClose}
      size="4xl"
      title={dataset ? <span dir="auto">{dataset.name}</span> : undefined}
      subtitle={
        dataset ? (
          <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="tabular-nums">
              {(Number(dataset?.rowCount ?? (dataset as any)?.row_count ?? rows.length) || 0).toLocaleString()} {t('rows')}
            </span>
            <span>•</span>
            <span className="tabular-nums">
              {Number(dataset?.columnCount ?? (dataset as any)?.column_count ?? columns.length) || 0} {t('columns')}
            </span>
            <span>•</span>
            <span className="text-sky-700 font-mono uppercase font-bold">{dataset.sourceType}</span>
          </span>
        ) : undefined
      }
      closeLabel={t('close')}
      icon={
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 grid place-items-center">
          <Table className="w-4 h-4" />
        </div>
      }
      footer={
        dataset ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
            <span className="tabular-nums">
              {t('showingMatchingRows', { current: Math.min(100, filteredRows.length), total: filteredRows.length })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenDataCleaning && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const id = dataset.id;
                    onClose();
                    onOpenDataCleaning(id);
                  }}
                  icon={<Sparkles className="w-3.5 h-3.5 text-sky-600" />}
                  className="bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100"
                >
                  {t('openInDataLab')}
                </Button>
              )}
              <Button type="button" variant="navy" size="sm" onClick={onClose}>
                {t('close')}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 text-slate-800 min-w-0">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
          <Input
            type="text"
            controlSize="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchRecordsPlaceholder')}
            className="h-9 ps-9"
          />
        </div>

        {/* Data Table */}
        <div className="max-w-full max-h-[55dvh] overflow-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-start text-xs text-slate-700 border-collapse">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
              <tr>
                <th className="p-2.5 w-12 text-center">#</th>
                {columns.map((col) => (
                  <th key={col.name} className="p-2.5 whitespace-nowrap text-start">
                    <div className="flex items-center gap-1.5">
                      <span dir="auto">{col.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                        {col.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {filteredRows.slice(0, 100).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 text-center text-slate-400 font-sans font-semibold tabular-nums">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.name} dir="auto" className="p-2.5 whitespace-nowrap max-w-[200px] truncate">
                      {String(row[col.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
