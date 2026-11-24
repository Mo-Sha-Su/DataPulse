import React, { useState, useEffect, useId } from 'react';
import {
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { SUPPORTED_ENCODINGS } from '../../utils/encodingDetector';
import { parseDatasetBuffer, ParsedDatasetResult } from '../../utils/datasetParser';
import { Dataset } from '../../types/dashboard';
import { saveGlobalDataset } from '../../services/globalDatasetService';
import { useLanguage } from '../../i18n/LanguageContext';
import { Modal, Button, FieldLabel, Input, Select } from '../../ui';

export interface DatasetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
  onDatasetImported?: (dataset: Dataset) => Promise<void> | void;
}

export const DatasetImportModal: React.FC<DatasetImportModalProps> = ({
  isOpen,
  onClose,
  initialFile,
  onDatasetImported,
}) => {
  const { t } = useLanguage();
  const fileInputId = useId();

  const [currentFile, setCurrentFile] = useState<File | null>(initialFile || null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);

  // Settings
  const [encoding, setEncoding] = useState<string>('auto');
  const [separator, setSeparator] = useState<string>('auto');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [datasetName, setDatasetName] = useState<string>('');

  // Parsing state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParsedDatasetResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load initial file when modal opens or initialFile changes
  useEffect(() => {
    if (initialFile) {
      setCurrentFile(initialFile);
      setEncoding('auto');
      setSeparator('auto');
      setSelectedSheet('');
      setSaveError(null);
    }
  }, [initialFile]);

  // Read file as bytes whenever currentFile changes
  useEffect(() => {
    if (!currentFile) {
      setFileBytes(null);
      setParseResult(null);
      return;
    }

    let active = true;
    const reader = new FileReader();

    reader.onload = () => {
      if (!active) return;
      if (reader.result instanceof ArrayBuffer) {
        setFileBytes(new Uint8Array(reader.result));
      }
    };

    reader.onerror = () => {
      if (active) setParseError(t('importErrorRead'));
    };

    reader.readAsArrayBuffer(currentFile);

    return () => {
      active = false;
    };
  }, [currentFile, t]);

  // Trigger parse whenever bytes or settings change
  useEffect(() => {
    if (!fileBytes || !currentFile) return;

    let active = true;
    setIsParsing(true);
    setParseError(null);

    parseDatasetBuffer(fileBytes, currentFile.name, {
      encoding,
      separator,
      sheetName: selectedSheet || undefined,
    })
      .then((res) => {
        if (!active) return;
        setParseResult(res);
        if (!datasetName || datasetName === (parseResult?.name || '')) {
          setDatasetName(res.name);
        }
        if (res.sheets && res.sheets.length > 0 && !selectedSheet) {
          setSelectedSheet(res.selectedSheet || res.sheets[0]);
        }
        setIsParsing(false);
      })
      .catch((err: any) => {
        if (!active) return;
        setParseError(err?.message || t('importErrorRead'));
        setIsParsing(false);
      });

    return () => {
      active = false;
    };
  }, [fileBytes, encoding, separator, selectedSheet]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCurrentFile(e.dataTransfer.files[0]);
      setEncoding('auto');
      setSeparator('auto');
      setSelectedSheet('');
      setSaveError(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentFile(e.target.files[0]);
      setEncoding('auto');
      setSeparator('auto');
      setSelectedSheet('');
      setSaveError(null);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) {
      setSaveError(t('importErrorNoRows'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveProgress(t('importProgressPrep'));

    try {
      const now = new Date().toISOString();
      const datasetId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newDataset: Dataset = {
        id: datasetId,
        name: datasetName.trim() || parseResult.name,
        rowCount: parseResult.rowCount,
        columnCount: parseResult.columnCount,
        columns: parseResult.columns,
        data: parseResult.rows,
        cleanedData: parseResult.rows,
        uploadedAt: now.replace('T', ' ').substring(0, 16),
        sourceType: parseResult.fileType === 'excel' ? 'excel' : 'csv',
        tags: ['Neon DB', parseResult.fileType.toUpperCase()],
      };

      setSaveProgress(t('importProgressSaving'));
      const saved = await saveGlobalDataset(newDataset);

      setSaveProgress(t('importProgressDone'));
      if (onDatasetImported) {
        await onDatasetImported(saved);
      }
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || t('importErrorSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} ${t('importUnitB')}`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${t('importUnitKB')}`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} ${t('importUnitMB')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      closeOnBackdrop={!isSaving}
      size="4xl"
      title={t('importTitle')}
      subtitle={t('importSubtitle')}
      closeLabel={t('close')}
      icon={
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 grid place-items-center">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={!parseResult || parseResult.rows.length === 0 || isSaving || isParsing}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          >
            {isSaving ? (
              saveProgress || t('saving')
            ) : (
              <>
                <span>{t('importSubmitBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 min-w-0">
        {/* File Picker or Info Banner */}
        {!currentFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-8 sm:p-10 text-center bg-slate-50/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 text-sm">
                {t('importDropzoneTitle')}
              </span>
              <p dir="ltr" className="text-xs text-slate-500 mt-1">
                CSV, TSV, TXT, XLSX, XLS, ODS, JSON
              </p>
            </div>
            <input
              id={fileInputId}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls,.ods,.json"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4 min-w-0">
            {/* File Info Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="text-sm font-bold text-slate-800 truncate">{currentFile.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    <span dir="ltr">{formatFileSize(currentFile.size)}</span>
                    {' • '}
                    {parseResult
                      ? t('importPreviewMeta', { cols: parseResult.columnCount, rows: parseResult.rowCount })
                      : t('importReading')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('importChangeFile')}
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls,.ods,.json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>

            {/* Detected Encoding Banner */}
            {parseResult && (
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-start gap-3">
                <Sliders className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 flex-1 min-w-0">
                  <span className="font-bold">
                    {t('importDetectedEnc')} <span dir="ltr">{parseResult.detectedEncoding.encoding.toUpperCase()}</span>
                  </span>
                  <span dir="auto" className="text-sky-700 ms-1.5">
                    — {parseResult.detectedEncoding.reason}
                  </span>
                </div>
              </div>
            )}

            {/* U+FFFD Replacement Character Warning */}
            {parseResult?.hasReplacementChar && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 min-w-0">
                  <span className="font-bold">
                    {t('importWarnFffdTitle')}
                  </span>
                  <p className="mt-0.5 text-amber-700">
                    {t('importWarnFffdDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Dataset Name */}
              <div>
                <FieldLabel>{t('importDatasetNameLabel')}</FieldLabel>
                <Input
                  type="text"
                  controlSize="sm"
                  dir="auto"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder={t('importDefaultDatasetPlaceholder')}
                  className="h-9 bg-white"
                />
              </div>

              {/* Encoding Dropdown */}
              <div>
                <FieldLabel>{t('importEncodingLabel')}</FieldLabel>
                <Select
                  controlSize="sm"
                  dir="ltr"
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                  disabled={parseResult?.fileType === 'excel'}
                  className="h-9 bg-white"
                >
                  {SUPPORTED_ENCODINGS.map((enc) => (
                    <option key={enc.value} value={enc.value}>
                      {enc.value === 'auto' ? t('importSepAuto') : enc.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Delimiter or Sheet Picker */}
              <div>
                {parseResult?.fileType === 'excel' && parseResult.sheets && parseResult.sheets.length > 0 ? (
                  <div>
                    <FieldLabel>{t('importExcelSheetLabel')}</FieldLabel>
                    <Select
                      controlSize="sm"
                      dir="auto"
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="h-9 bg-white"
                    >
                      {parseResult.sheets.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div>
                    <FieldLabel>{t('importSeparatorLabel')}</FieldLabel>
                    <Select
                      controlSize="sm"
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      disabled={parseResult?.fileType === 'excel'}
                      className="h-9 bg-white"
                    >
                      <option value="auto">{t('importSepAuto')}</option>
                      <option value=",">{t('importSepComma')}</option>
                      <option value=";">{t('importSepSemi')}</option>
                      <option value="&#9;">{t('importSepTab')}</option>
                      <option value="|">{t('importSepPipe')}</option>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Parsing Loader or Error */}
            {isParsing && (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                {t('importParsingText')}
              </div>
            )}

            {parseError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {parseError}
              </div>
            )}

            {/* Live Preview Table with dir="auto" */}
            {parseResult && parseResult.columns.length > 0 && !isParsing && (
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {t('importPreviewTitle')}
                  </span>
                  <span className="tabular-nums">
                    {t('importPreviewMeta', { cols: parseResult.columns.length, rows: parseResult.rowCount })}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-64 overflow-x-auto overflow-y-auto max-w-full bg-white">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-center text-slate-400 font-normal w-12 border-b border-slate-200">
                          #
                        </th>
                        {parseResult.columns.map((col) => (
                          <th
                            key={col.name}
                            className="px-3 py-2 text-start font-bold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <span dir="auto">{col.name}</span>
                              <span dir="ltr" className="text-[10px] font-normal px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-600">
                                {col.type}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parseResult.rows.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td dir="ltr" className="px-3 py-1.5 text-center text-slate-400 text-[11px] font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          {parseResult.columns.map((col) => (
                            <td
                              key={col.name}
                              dir="auto"
                              className="px-3 py-1.5 text-slate-800 whitespace-nowrap max-w-xs truncate"
                            >
                              {row[col.name] !== undefined && row[col.name] !== null ? String(row[col.name]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline Save Error Banner */}
        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <span className="font-bold">{t('importSaveErrorTitle')}</span>
              <p className="mt-0.5">{saveError}</p>
            </div>
          </div>
        )}

        {/* In-progress status */}
        {isSaving && (
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
            <span className="text-xs font-semibold text-sky-800">{saveProgress}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
