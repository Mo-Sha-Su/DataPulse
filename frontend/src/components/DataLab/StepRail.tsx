import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Settings2, Trash2, FastForward, Check } from 'lucide-react';
import { DataCleaningStep } from '../../types/dataCleaning';
import { StepTraceEntry } from '../../utils/transformationEngine';
import { impactChips, metaFor } from './stepMeta';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  queryName: string;
  sourceType: string;
  steps: DataCleaningStep[];
  trace: StepTraceEntry[];
  selectedStepId: string;
  onSelectStep: (id: string) => void;
  onDeleteStep: (id: string) => void;
  onRenameStep: (id: string) => void;
  onEditStepSettings: (step: DataCleaningStep) => void;
  onMoveStepUp: (id: string) => void;
  onMoveStepDown: (id: string) => void;
  onQueryNameChange: (name: string) => void;
  className?: string;
  onCloseMobile?: () => void;
}

const TONE: Record<string, string> = {
  up: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
  down: 'text-sky-300 bg-sky-400/10 border-sky-400/25',
  bad: 'text-rose-300 bg-rose-400/10 border-rose-400/25',
  good: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
};

export const StepRail: React.FC<Props> = ({
  queryName, sourceType, steps, trace, selectedStepId, onSelectStep, onDeleteStep, onRenameStep,
  onEditStepSettings, onMoveStepUp, onMoveStepDown, onQueryNameChange, className = '', onCloseMobile,
}) => {
  const { t, tPlural } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(queryName);
  const selIdx = Math.max(0, steps.findIndex((s) => s.id === selectedStepId));
  const atLatest = selIdx === steps.length - 1;
  const last = trace[trace.length - 1];

  const commitName = () => {
    setEditingName(false);
    const v = draft.trim();
    if (v && v !== queryName) onQueryNameChange(v);
    else setDraft(queryName);
  };

  return (
    <aside className={`w-[min(18rem,88vw)] lg:w-72 2xl:w-80 shrink-0 h-full bg-lab-panel border-e border-lab-line flex flex-col text-lab-text ${className}`} aria-label={t('labRailPipelineTitle')}>
      {/* header */}
      <div className="px-4 pt-4 pb-3 border-b border-lab-line">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-lab-faint">{t('labRailPipelineTitle')}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-lab-raised text-lab-dim uppercase">{sourceType}</span>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label={t('close')}
                className="lg:hidden px-1.5 py-0.5 rounded text-[11px] font-semibold text-lab-dim hover:text-lab-text hover:bg-lab-raised cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {editingName ? (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setDraft(queryName); setEditingName(false); }
              }}
              className="flex-1 min-w-0 bg-lab-bg border border-pulse-400/60 rounded-md px-2 py-1 text-sm font-semibold outline-none"
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commitName} className="p-1.5 rounded-md bg-pulse-500/20 text-pulse-300 hover:bg-pulse-500/30" aria-label={t('labRailSaveNameAria')}>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(queryName); setEditingName(true); }}
            className="mt-1.5 group flex items-center gap-2 max-w-full text-start"
            title={t('labRailRenameQuery')}
          >
            <h2 className="text-[15px] font-bold truncate" dir="auto">{queryName}</h2>
            <Pencil className="w-3 h-3 text-lab-faint opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
        <p className="mt-1 text-[11px] text-lab-dim">
          {steps.length === 1
            ? `${tPlural('steps', steps.length)} · ${t('labRailStepCount', { count: steps.length }).split('·')[1]?.trim() || ''}`
            : t('labRailStepCount', { count: steps.length })}
        </p>
      </div>

      {/* time travel notice */}
      {!atLatest && (
        <div className="mx-3 mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-amber-200 leading-snug">
            {t('labRailViewingStepOf', { current: selIdx + 1, total: steps.length })}
          </p>
          <button
            type="button"
            onClick={() => onSelectStep(steps[steps.length - 1].id)}
            className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-amber-100 bg-amber-400/20 hover:bg-amber-400/30 rounded-md px-2 py-1"
          >
            <FastForward className="w-3 h-3 rtl:rotate-180" /> {t('labRailJumpLatest')}
          </button>
        </div>
      )}

      {/* the rail */}
      <ol className="flex-1 overflow-y-auto lab-scroll px-3 py-4 relative">
        {steps.map((step, i) => {
          const meta = metaFor(step.type, t);
          const Icon = meta.icon;
          const isSel = step.id === selectedStepId;
          const isFuture = i > selIdx;
          const tr = trace[i];
          const prev = i > 0 ? trace[i - 1] : null;
          const chips = tr ? impactChips(prev, tr, t) : [];
          const isSource = step.type === 'source';
          return (
            <li key={step.id} className="relative ps-9 pb-3 group/step">
              {/* connector */}
              {i < steps.length - 1 && (
                <span className="absolute start-[15px] top-8 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, var(--color-lab-line-strong), var(--color-lab-line))' }} />
              )}
              {/* node */}
              <span
                className={`absolute start-0 top-1.5 w-[31px] h-[31px] rounded-full grid place-items-center border transition-all ${isSel ? 'lab-node-live' : ''} ${isFuture ? 'opacity-40' : ''}`}
                style={{
                  background: isSel ? `color-mix(in srgb, ${meta.color} 22%, var(--color-lab-bg))` : 'var(--color-lab-raised)',
                  borderColor: isSel ? meta.color : 'var(--color-lab-line-strong)',
                  color: meta.color,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>

              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectStep(step.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectStep(step.id); } }}
                className={`rounded-xl border px-3 py-2 cursor-pointer transition-colors ${isFuture ? 'opacity-50' : ''} ${
                  isSel ? 'bg-lab-hover border-lab-line-strong' : 'bg-transparent border-transparent hover:bg-lab-raised hover:border-lab-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {meta.label.toLowerCase() !== step.name.toLowerCase() && (
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</p>
                    )}
                    <p className="text-[13px] font-semibold leading-snug break-words" dir="auto">{step.name}</p>
                  </div>
                  <span className="font-mono text-[10px] text-lab-faint mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                </div>
                {step.description && <p className="mt-0.5 text-[11px] text-lab-dim leading-snug break-words" dir="auto">{step.description}</p>}

                {(chips.length > 0 || (isSource && tr)) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {isSource && tr && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-lab-line-strong text-lab-dim">
                        {t('labRailSourceSize', { rows: tr.rows.toLocaleString(), cols: tr.columns })}
                      </span>
                    )}
                    {chips.map((c) => (
                      <span key={c.key} className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${TONE[c.tone]}`}>{c.text}</span>
                    ))}
                  </div>
                )}

                {!isSource && (
                  <div className="mt-2 flex items-center gap-0.5 sm:opacity-0 sm:group-hover/step:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                    <RailBtn label={t('labRailSettings')} onClick={() => onEditStepSettings(step)}><Settings2 className="w-3 h-3" /></RailBtn>
                    <RailBtn label={t('labRailRename')} onClick={() => onRenameStep(step.id)}><Pencil className="w-3 h-3" /></RailBtn>
                    <RailBtn label={t('labRailMoveUp')} disabled={i <= 1} onClick={() => onMoveStepUp(step.id)}><ArrowUp className="w-3 h-3" /></RailBtn>
                    <RailBtn label={t('labRailMoveDown')} disabled={i >= steps.length - 1} onClick={() => onMoveStepDown(step.id)}><ArrowDown className="w-3 h-3" /></RailBtn>
                    <span className="flex-1" />
                    <RailBtn label={t('labRailDeleteStep')} danger onClick={() => onDeleteStep(step.id)}><Trash2 className="w-3 h-3" /></RailBtn>
                  </div>
                )}
              </div>
            </li>
          );
        })}

        {/* output node */}
        {last && (
          <li className="relative ps-9 pt-1">
            <span className="absolute start-0 top-2 w-[31px] h-[31px] rounded-full grid place-items-center border-2 border-dashed border-pulse-400/50 text-pulse-300">
              <span className="w-2 h-2 rounded-full bg-pulse-400" />
            </span>
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pulse-300">{t('labRailOutputLabel')}</p>
              <p className="text-[13px] font-semibold font-mono">{last.rows.toLocaleString()} × {last.columns}</p>
              <p className="text-[11px] text-lab-dim">{t('labRailOutputHint')}</p>
            </div>
          </li>
        )}
      </ol>
    </aside>
  );
};

const RailBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }> = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`p-1.5 rounded-md transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
      danger ? 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-400/15' : 'text-lab-dim hover:text-lab-text hover:bg-lab-line'
    }`}
  >
    {children}
  </button>
);
