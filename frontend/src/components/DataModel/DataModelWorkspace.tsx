import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dataset } from '../../types/dashboard';
import {
  DataModelState,
  FactTable,
  DimensionTable,
  Relationship,
  ModelMeasure,
  ModelVersion,
} from '../../types/dataModel';
import {
  suggestStarSchema,
  validateDataModel,
  syncModelWithUsedDatasets,
} from '../../utils/dataModelingEngine';
import { TableCard } from './TableCard';
import { CreateRelationshipModal } from './CreateRelationshipModal';
import { CreateFactModal } from './CreateFactModal';
import { CreateDimensionModal } from './CreateDimensionModal';
import { GenerateDateDimensionModal } from './GenerateDateDimensionModal';
import { ModelMeasuresModal } from './ModelMeasuresModal';
import { ModelVersionsModal } from './ModelVersionsModal';
import { SuggestedStarSchemaModal } from './SuggestedStarSchemaModal';
import { ModelValidationDrawer } from './ModelValidationDrawer';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Network,
  Database,
  Plus,
  Layers,
  Box,
  Calendar,
  Calculator,
  History,
  ShieldCheck,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  Trash2,
  Edit2,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  dataModel?: DataModelState;
  datasets: Dataset[];
  dashboardName: string;
  onUpdateModel: (model: DataModelState) => void;
  onAddDatasetToContext: (dataset: Dataset) => void;
  onBackToCanvas: () => void;
  onOpenDataCleaning?: (datasetId?: string) => void;
}

export const DataModelWorkspace: React.FC<Props> = ({
  dataModel,
  datasets,
  dashboardName,
  onUpdateModel,
  onAddDatasetToContext,
  onBackToCanvas,
  onOpenDataCleaning,
}) => {
  const { t } = useLanguage();
  // Initialize model ensuring ALL used datasets are included
  const [model, setModel] = useState<DataModelState>(() => {
    return syncModelWithUsedDatasets(dataModel, datasets, dashboardName);
  });

  // Ensure initial model is saved up to parent if parent had no model yet
  const initialSyncReportedRef = useRef(false);
  useEffect(() => {
    if (!dataModel && !initialSyncReportedRef.current && model) {
      initialSyncReportedRef.current = true;
      onUpdateModel(model);
    }
  }, [dataModel, model, onUpdateModel]);

  // Keep data model synchronized with all datasets used in dashboard/report
  useEffect(() => {
    setModel((prev) => {
      const synced = syncModelWithUsedDatasets(prev, datasets, dashboardName);
      if (synced !== prev) {
        onUpdateModel(synced);
        return synced;
      }
      return prev;
    });
  }, [datasets, dashboardName, onUpdateModel]);

  // Sync if external dataModel changes
  useEffect(() => {
    if (dataModel) {
      setModel((prev) => {
        const synced = syncModelWithUsedDatasets(dataModel, datasets, dashboardName);
        return synced;
      });
    }
  }, [dataModel, datasets, dashboardName]);

  // Sync state upward when model changes
  const updateModel = (updater: (prev: DataModelState) => DataModelState) => {
    setModel((prev) => {
      const next = updater(prev);
      const updated = { ...next, updatedAt: new Date().toISOString() };
      onUpdateModel(updated);
      return updated;
    });
  };

  // Canvas Viewport Controls (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging table card state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Relationship for highlight / details
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);

  // Modals state
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);
  const [isDimensionModalOpen, setIsDimensionModalOpen] = useState(false);
  const [isDateDimModalOpen, setIsDateDimModalOpen] = useState(false);
  const [isMeasuresModalOpen, setIsMeasuresModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isValidationDrawerOpen, setIsValidationDrawerOpen] = useState(false);

  // Current suggested star schema
  const currentSuggestion = useMemo(() => suggestStarSchema(datasets), [datasets]);

  // Model Validation calculation
  const validationResult = useMemo(() => validateDataModel(model, datasets), [model, datasets]);

  // Handle Dragging Table Cards
  const handleMouseDownTable = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    const table = [...model.factTables, ...model.dimensionTables].find((t) => t.id === tableId);
    if (!table) return;

    setDraggingTableId(tableId);
    dragOffsetRef.current = {
      x: e.clientX / zoom - table.position.x,
      y: e.clientY / zoom - table.position.y,
    };
  };

  // Canvas Pan handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingTableId) {
        const newX = Math.round(e.clientX / zoom - dragOffsetRef.current.x);
        const newY = Math.round(e.clientY / zoom - dragOffsetRef.current.y);

        updateModel((prev) => ({
          ...prev,
          factTables: prev.factTables.map((f) => (f.id === draggingTableId ? { ...f, position: { x: newX, y: newY } } : f)),
          dimensionTables: prev.dimensionTables.map((d) => (d.id === draggingTableId ? { ...d, position: { x: newX, y: newY } } : d)),
        }));
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingTableId(null);
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTableId, isPanning, zoom]);

  // Table Deletion
  const handleDeleteTable = (tableId: string) => {
    updateModel((prev) => ({
      ...prev,
      factTables: prev.factTables.filter((f) => f.id !== tableId),
      dimensionTables: prev.dimensionTables.filter((d) => d.id !== tableId),
      relationships: prev.relationships.filter((r) => r.fromTableId !== tableId && r.toTableId !== tableId),
    }));
  };

  // Relationship creation / update
  const handleSaveRelationship = (rel: Relationship) => {
    updateModel((prev) => {
      const idx = prev.relationships.findIndex((r) => r.id === rel.id);
      let updatedRels: Relationship[];
      if (idx >= 0) {
        updatedRels = [...prev.relationships];
        updatedRels[idx] = rel;
      } else {
        updatedRels = [...prev.relationships, rel];
      }
      return { ...prev, relationships: updatedRels };
    });
  };

  const handleDeleteRelationship = (relId: string) => {
    updateModel((prev) => ({
      ...prev,
      relationships: prev.relationships.filter((r) => r.id !== relId),
    }));
    setSelectedRelId(null);
  };

  // Add Fact Table
  const handleSaveFact = (fact: FactTable) => {
    updateModel((prev) => ({
      ...prev,
      factTables: [...prev.factTables.filter((f) => f.id !== fact.id), fact],
    }));
  };

  // Add Dimension Table
  const handleSaveDimension = (res: { dataset: Dataset; dimension: DimensionTable }) => {
    onAddDatasetToContext(res.dataset);
    updateModel((prev) => ({
      ...prev,
      dimensionTables: [...prev.dimensionTables.filter((d) => d.id !== res.dimension.id), res.dimension],
    }));
  };

  // Add Generated Date Dimension
  const handleSaveDateDimension = (res: { dataset: Dataset; dimension: DimensionTable }) => {
    onAddDatasetToContext(res.dataset);
    updateModel((prev) => ({
      ...prev,
      dimensionTables: [...prev.dimensionTables.filter((d) => d.name !== 'DIM_DATE'), res.dimension],
    }));
  };

  // Versioning
  const handleSaveVersion = (versionName: string, description: string) => {
    const newVersion: ModelVersion = {
      id: `v_${Date.now()}`,
      versionName,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description,
      snapshot: {
        factTables: model.factTables,
        dimensionTables: model.dimensionTables,
        relationships: model.relationships,
        measures: model.measures,
        hierarchies: model.hierarchies,
      },
    };

    updateModel((prev) => ({
      ...prev,
      versions: [newVersion, ...(prev.versions || [])],
    }));
  };

  const handleRevertVersion = (version: ModelVersion) => {
    updateModel((prev) => ({
      ...prev,
      factTables: version.snapshot.factTables,
      dimensionTables: version.snapshot.dimensionTables,
      relationships: version.snapshot.relationships,
      measures: version.snapshot.measures,
      hierarchies: version.snapshot.hierarchies,
    }));
  };

  // Apply full suggested star schema
  const handleApplySuggestion = () => {
    updateModel((prev) => ({
      ...prev,
      factTables: currentSuggestion.factTables,
      dimensionTables: currentSuggestion.dimensionTables,
      relationships: currentSuggestion.relationships,
    }));
  };

  // Table positions for SVG relationship line drawing
  const tablePosMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    [...model.factTables, ...model.dimensionTables].forEach((t) => {
      map.set(t.id, {
        x: t.position.x,
        y: t.position.y,
        width: 260,
        height: 240,
      });
    });
    return map;
  }, [model.factTables, model.dimensionTables]);

  return (
    <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col overflow-hidden select-none font-sans relative">
      {/* Top Ribbon & Control Header */}
      <header className="min-h-14 bg-slate-800 border-b border-slate-700 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 shadow-md z-30 min-w-0">
        {/* Left Actions: Back to Canvas & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBackToCanvas}
            className="h-8 px-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title={t('backToCanvas')}
            aria-label={t('backToCanvas')}
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
            <span className="hidden sm:inline">{t('backToCanvas')}</span>
          </button>

          <div className="h-4 w-px bg-slate-700 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Network className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate max-w-[110px] sm:max-w-[200px]" dir="auto">{model.name}</span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {t('dmStatsSummary', {
                  facts: model.factTables.length,
                  dims: model.dimensionTables.length,
                  rels: model.relationships.length,
                  datasets: datasets.length,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Center Actions: Star Schema Modeling Tools */}
        <div className="hidden lg:flex items-center gap-1.5">
          {/* Sync All Datasets */}
          <button
            type="button"
            onClick={() => {
              const resynced = syncModelWithUsedDatasets(undefined, datasets, dashboardName);
              updateModel(() => resynced);
            }}
            className="h-8 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('syncAllDatasets')}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('syncAllDatasets')}</span>
          </button>

          {/* Auto Detect Star Schema */}
          <button
            type="button"
            onClick={() => setIsSuggestModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title={t('autoDetectSchema')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('autoDetectSchema')}</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Add Fact Table */}
          <button
            type="button"
            onClick={() => setIsFactModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('addFactTable')}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('factTableBtn')}</span>
          </button>

          {/* Add Dimension Table */}
          <button
            type="button"
            onClick={() => setIsDimensionModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('addDimensionTable')}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{t('dimensionTableBtn')}</span>
          </button>

          {/* Generate DIM_DATE */}
          <button
            type="button"
            onClick={() => setIsDateDimModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('dmDimDateTitle')}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span dir="ltr">DIM_DATE</span>
          </button>

          {/* Create Relationship */}
          <button
            type="button"
            onClick={() => {
              setEditingRelationship(null);
              setIsRelationshipModalOpen(true);
            }}
            className="h-8 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('createRelationship')}
          >
            <Network className="w-3.5 h-3.5" />
            <span>{t('relationshipBtn')}</span>
          </button>

          {/* Measures */}
          <button
            type="button"
            onClick={() => setIsMeasuresModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('dmMeasuresTitle')}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t('measuresBtn')} ({model.measures.length})</span>
          </button>
        </div>

        {/* Right Tools: Validation Score, Versions, Zoom & Search */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Model Quality Score Badge */}
          <button
            type="button"
            onClick={() => setIsValidationDrawerOpen(true)}
            className={`h-8 px-2 sm:px-3 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              validationResult.score >= 85
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : validationResult.score >= 65
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
            }`}
            title={t('dmValidationTitle')}
            aria-label={t('dmValidationTitle')}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">{t('score')}: </span>
              <span dir="ltr" className="tabular-nums">{validationResult.score}/100</span>
            </span>
          </button>

          {/* Versions */}
          <button
            type="button"
            onClick={() => setIsVersionsModalOpen(true)}
            className="h-8 px-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title={t('dmVersionsTitle')}
            aria-label={t('dmVersionsTitle')}
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* Search Tables Input */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchFieldsPlaceholder')}
              className="w-36 lg:w-44 h-8 ps-8 pe-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-sky-500"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-700/80 rounded-lg p-0.5 border border-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1 hover:bg-slate-600 rounded text-slate-300 cursor-pointer"
              title={t('dmZoomOut')}
              aria-label={t('dmZoomOut')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span dir="ltr" className="text-[10px] font-mono px-1.5 text-slate-300 min-w-[34px] text-center hidden sm:inline tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
              className="p-1 hover:bg-slate-600 rounded text-slate-300 cursor-pointer"
              title={t('dmZoomIn')}
              aria-label={t('dmZoomIn')}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(0.9);
                setPan({ x: 40, y: 30 });
              }}
              className="p-1 hover:bg-slate-600 rounded text-slate-300 border-s border-slate-600/80 ms-0.5 cursor-pointer"
              title={t('dmResetView')}
              aria-label={t('dmResetView')}
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Modeling Tools Strip (<lg) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 bg-slate-800/95 border-b border-slate-700 shrink-0 [&>*]:shrink-0 z-20">
        <div className="relative md:hidden">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            dir="auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchFieldsPlaceholder')}
            className="w-36 h-7 ps-8 pe-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-sky-500"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const resynced = syncModelWithUsedDatasets(undefined, datasets, dashboardName);
            updateModel(() => resynced);
          }}
          className="h-7 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('syncAllDatasets')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsSuggestModalOpen(true)}
          className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('autoDetectSchema')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsFactModalOpen(true)}
          className="h-7 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('factTableBtn')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsDimensionModalOpen(true)}
          className="h-7 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Box className="w-3.5 h-3.5" />
          <span>{t('dimensionTableBtn')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsDateDimModalOpen(true)}
          className="h-7 px-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span dir="ltr">DIM_DATE</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingRelationship(null);
            setIsRelationshipModalOpen(true);
          }}
          className="h-7 px-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Network className="w-3.5 h-3.5" />
          <span>{t('relationshipBtn')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsMeasuresModalOpen(true)}
          className="h-7 px-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{t('measuresBtn')} ({model.measures.length})</span>
        </button>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        onMouseDown={handleMouseDownCanvas}
        className="flex-1 relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Transform Layer for Pan & Zoom (always LTR coordinate space) */}
        <div
          dir="ltr"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '4000px',
            height: '3000px',
          }}
        >
          {/* SVG Relationship Connector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <defs>
              <linearGradient id="relGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {model.relationships.map((rel) => {
              const fromPos = tablePosMap.get(rel.fromTableId);
              const toPos = tablePosMap.get(rel.toTableId);
              if (!fromPos || !toPos) return null;

              // Compute center connector points
              const x1 = fromPos.x + fromPos.width / 2;
              const y1 = fromPos.y + fromPos.height / 2;
              const x2 = toPos.x + toPos.width / 2;
              const y2 = toPos.y + toPos.height / 2;

              const isSelected = selectedRelId === rel.id;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              // Cubic bezier control points
              const cx1 = x1 + dx * 0.5;
              const cy1 = y1;
              const cx2 = x2 - dx * 0.5;
              const cy2 = y2;
              const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

              return (
                <g key={rel.id} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedRelId(rel.id)}>
                  {/* Thick Invisible Hover Hit Area */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />

                  {/* Main Visual Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#38BDF8' : 'url(#relGradient)'}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    strokeDasharray={rel.isActive ? undefined : '5,5'}
                    className="transition-all hover:stroke-sky-400"
                  />

                  {/* Cardinality Badge at Midpoint */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-22"
                      y="-11"
                      width="44"
                      height="22"
                      rx="11"
                      fill={isSelected ? '#0284C7' : '#1E293B'}
                      stroke={isSelected ? '#38BDF8' : '#475569'}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {rel.cardinality}
                    </text>
                  </g>

                  {/* Dimension Side Marker (1) */}
                  <circle cx={x1} cy={y1} r="5" fill="#10B981" stroke="#064E3B" strokeWidth="1.5" />
                  {/* Fact Side Marker (*) */}
                  <circle cx={x2} cy={y2} r="5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          {/* Render Fact Table Cards */}
          {model.factTables.map((fact) => (
            <TableCard
              key={fact.id}
              table={fact}
              type="FACT"
              isHighlighted={model.relationships.some(
                (r) => selectedRelId === r.id && (r.fromTableId === fact.id || r.toTableId === fact.id)
              )}
              searchQuery={searchQuery}
              onMouseDownDrag={handleMouseDownTable}
              onDeleteTable={handleDeleteTable}
            />
          ))}

          {/* Render Dimension Table Cards */}
          {model.dimensionTables.map((dim) => (
            <TableCard
              key={dim.id}
              table={dim}
              type="DIM"
              isHighlighted={model.relationships.some(
                (r) => selectedRelId === r.id && (r.fromTableId === dim.id || r.toTableId === dim.id)
              )}
              searchQuery={searchQuery}
              onMouseDownDrag={handleMouseDownTable}
              onDeleteTable={handleDeleteTable}
            />
          ))}
        </div>

        {/* Selected Relationship Floating Action Bar */}
        {selectedRelId && (() => {
          const rel = model.relationships.find((r) => r.id === selectedRelId);
          if (!rel) return null;
          const fromT = [...model.dimensionTables, ...model.factTables].find((t) => t.id === rel.fromTableId);
          const toT = [...model.factTables, ...model.dimensionTables].find((t) => t.id === rel.toTableId);

          return (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100%-1.5rem)] bg-slate-900 border border-slate-700 px-3 sm:px-4 py-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
              <div dir="ltr" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 font-mono min-w-0">
                <span className="font-bold text-emerald-400 truncate max-w-[140px] sm:max-w-none">{fromT?.name}.{rel.fromColumn}</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold shrink-0">
                  {rel.cardinality}
                </span>
                <span className="font-bold text-amber-400 truncate max-w-[140px] sm:max-w-none">{toT?.name}.{rel.toColumn}</span>
              </div>

              <div className="hidden sm:block h-4 w-px bg-slate-700" />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRelationship(rel);
                    setIsRelationshipModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRelationship(rel.id)}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Floating Minimap / Legend Badge */}
        <div className="absolute bottom-4 end-4 z-20 bg-slate-900/90 backdrop-blur-xs border border-slate-800 p-3 rounded-2xl shadow-xl text-[11px] text-slate-400 space-y-2 hidden md:block">
          <span className="font-bold text-slate-200 block text-xs">{t('dmLegendTitle')}</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
            <span className="text-slate-300 font-semibold">{t('dmLegendFact')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
            <span className="text-slate-300 font-semibold">{t('dmLegendDim')}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span dir="ltr" className="inline-flex items-center gap-1">
              <span className="text-emerald-400">1</span>
              <span className="text-slate-500">───</span>
              <span className="text-amber-400">*</span>
            </span>
            <span className="font-sans text-slate-400">{t('dmLegendJoin')}</span>
          </div>
        </div>

        {/* Empty Model Prompt when zero tables exist */}
        {model.factTables.length === 0 && model.dimensionTables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-30">
            <div className="p-8 bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl backdrop-blur max-w-md pointer-events-auto">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold">
                <Network className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('dmEmptyTitle')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {datasets.length === 0 ? t('dmEmptyNoDatasetsDesc') : t('dmEmptyReadyDesc')}
              </p>
              {datasets.length === 0 ? (
                <button
                  type="button"
                  onClick={onBackToCanvas}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('dmBackToSelectDatasets')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSuggestModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md"
                >
                  {t('autoDetectSchema')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals & Validation Drawer */}
      <CreateRelationshipModal
        isOpen={isRelationshipModalOpen}
        factTables={model.factTables}
        dimensionTables={model.dimensionTables}
        datasets={datasets}
        existingRelationships={model.relationships}
        initialRelationship={editingRelationship}
        onClose={() => {
          setIsRelationshipModalOpen(false);
          setEditingRelationship(null);
        }}
        onSave={handleSaveRelationship}
      />

      <CreateFactModal
        isOpen={isFactModalOpen}
        datasets={datasets}
        onClose={() => setIsFactModalOpen(false)}
        onSave={handleSaveFact}
      />

      <CreateDimensionModal
        isOpen={isDimensionModalOpen}
        datasets={datasets}
        onClose={() => setIsDimensionModalOpen(false)}
        onSave={handleSaveDimension}
      />

      <GenerateDateDimensionModal
        isOpen={isDateDimModalOpen}
        onClose={() => setIsDateDimModalOpen(false)}
        onGenerate={handleSaveDateDimension}
      />

      <ModelMeasuresModal
        isOpen={isMeasuresModalOpen}
        factTables={model.factTables}
        dimensionTables={model.dimensionTables}
        existingMeasures={model.measures}
        onClose={() => setIsMeasuresModalOpen(false)}
        onSaveMeasure={(meas) => updateModel((prev) => ({ ...prev, measures: [...prev.measures, meas] }))}
        onDeleteMeasure={(id) => updateModel((prev) => ({ ...prev, measures: prev.measures.filter((m) => m.id !== id) }))}
      />

      <ModelVersionsModal
        isOpen={isVersionsModalOpen}
        currentModel={model}
        onClose={() => setIsVersionsModalOpen(false)}
        onSaveNewVersion={handleSaveVersion}
        onRevertToVersion={handleRevertVersion}
      />

      <SuggestedStarSchemaModal
        isOpen={isSuggestModalOpen}
        suggestion={currentSuggestion}
        onClose={() => setIsSuggestModalOpen(false)}
        onApply={handleApplySuggestion}
      />

      <ModelValidationDrawer
        isOpen={isValidationDrawerOpen}
        validation={validationResult}
        onClose={() => setIsValidationDrawerOpen(false)}
      />
    </div>
  );
};
