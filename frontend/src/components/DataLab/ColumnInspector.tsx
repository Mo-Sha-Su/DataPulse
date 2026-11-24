import React, { useMemo } from 'react';
import { Wand2, Sparkles, PanelRightClose, CheckCircle2 } from 'lucide-react';
import { CleaningColumn } from '../../types/dataCleaning';
import { Suggestion, localizeDataType, profileColumn, qualityScore, suggestFixes, tableIssues } from '../../utils/columnProfile';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
  columns: CleaningColumn[];
  rows: Record<string, any>[];
  selectedColumn: string | null;
  onApply: (s: Suggestion) => void;
  onSelectColumn: (name: string) => void;
  onClose?: () => void;
}

const TONE = { clean: 'var(--color-cat-clean)', shape: 'var(--color-cat-shape)', compute: 'var(--color-cat-compute)' } as const;
const fmt = (n: number) => (Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : String(Math.round(n * 100) / 100));

export const ColumnInspector: React.FC<Props> = ({ columns, rows, selectedColumn, onApply, onSelectColumn, onClose }) => {
  const { t } = useLanguage();
  const col = columns.find((c) => c.name === selectedColumn) || null;
  const score = qualityScore(columns);
  const profile = useMemo(() => (col ? profileColumn(rows, col.name) : null), [rows, col?.name]);
  const fixes = useMemo(() => (col ? suggestFixes(col, rows, t) : []), [rows, col, t]);
  const issues = useMemo(() => tableIssues(columns, rows, t), [columns, rows, t]);
  const worst = useMemo(
    () => [...columns].map((c) => ({ c, bad: c.emptyCount + c.errorCount })).filter((x) => x.bad > 0).sort((a, b) => b.bad - a.bad).slice(0, 4),
    [columns]
  );

  return (
    <aside className="w-[min(310px,90vw)] xl:w-[300px] 2xl:w-[320px] shrink-0 h-full bg-lab-panel border-s border-lab-line flex flex-col text-lab-text shadow-2xl xl:shadow-none" aria-label={t('labInspectorTitle')}>
      <div className="px-4 pt-4 pb-3 border-b border-lab-line flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-lab-faint">{t('labInspectorTitle')}</span>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1 -m-1 rounded-md text-lab-faint hover:text-lab-text hover:bg-lab-raised" title={t('labInspectorHide')} aria-label={t('labInspectorHide')}>
            <PanelRightClose className="w-4 h-4 rtl:rotate-180" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto lab-scroll p-4 space-y-5">
        {!col && (
          <>
            <div className="flex items-center gap-4">
              <ScoreRing value={score} ariaLabel={t('labInspectorScoreRingAria', { value: score })} />
              <div>
                <p className="text-[13px] font-semibold">{t('labInspectorHealthTitle')}</p>
                <p className="text-[11px] text-lab-dim leading-snug">{t('labInspectorHealthDesc')}</p>
              </div>
            </div>

            {worst.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-lab-faint mb-2">{t('labInspectorNeedsAttention')}</h3>
                <ul className="space-y-1">
                  {worst.map(({ c, bad }) => (
                    <li key={c.name}>
                      <button type="button" onClick={() => onSelectColumn(c.name)} className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 hover:bg-lab-raised text-start">
                        <span className="text-[12.5px] truncate" dir="auto">{c.name}</span>
                        <span className="font-mono text-[11px] text-rose-300 shrink-0">
                          {bad === 1 ? t('labInspectorIssueSingular', { count: bad }) : t('labInspectorIssuePlural', { count: bad })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Fixes title={t('labInspectorTableFixes')} items={issues} onApply={onApply} empty={t('labInspectorNoTableIssues')} applyLabel={t('labInspectorApply')} applyAffectedTemplate={t('labInspectorApplyAffected')} />
            <p className="text-[11px] text-lab-faint leading-relaxed">{t('labInspectorSelectColHint')}</p>
          </>
        )}

        {col && profile && (
          <>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-lab-faint">{t('labInspectorColumnLabel')}</p>
              <h2 className="text-lg font-bold leading-tight break-words" dir="auto">{col.name}</h2>
              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-lab-raised border border-lab-line-strong text-pulse-300">{localizeDataType(col.dataType, t)}</span>
            </div>

            <div>
              <HealthBar valid={profile.valid} empty={profile.empty} errors={profile.errors} ariaLabel={t('labInspectorHealthBarAria', { valid: profile.valid, empty: profile.empty, errors: profile.errors })} />
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Stat label={t('labInspectorValid')} value={profile.valid.toLocaleString()} tone="text-emerald-300" />
                <Stat label={t('labInspectorEmpty')} value={profile.empty.toLocaleString()} tone={profile.empty ? 'text-amber-300' : 'text-lab-dim'} />
                <Stat label={t('labInspectorErrorsLabel')} value={profile.errors.toLocaleString()} tone={profile.errors ? 'text-rose-300' : 'text-lab-dim'} />
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Tile
                label={t('labInspectorDistinctLabel')}
                value={profile.distinct.toLocaleString()}
                sub={profile.uniqueness >= 0.999 && profile.valid > 1 ? t('labInspectorEveryUnique') : t('labInspectorPctUnique', { pct: Math.round(profile.uniqueness * 100) })}
              />
              {profile.numeric ? (
                <Tile label={t('labInspectorMean')} value={fmt(profile.numeric.mean)} sub={t('labInspectorMedianSub', { val: fmt(profile.numeric.median) })} />
              ) : (
                <Tile label={t('labInspectorLengthLabel')} value={profile.text ? `${profile.text.minLength}–${profile.text.maxLength}` : '–'} sub={t('labInspectorCharsSub')} />
              )}
              {profile.numeric && <Tile label={t('labInspectorMin')} value={fmt(profile.numeric.min)} />}
              {profile.numeric && <Tile label={t('labInspectorMax')} value={fmt(profile.numeric.max)} />}
            </div>

            {profile.top.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-lab-faint mb-2">{t('labInspectorMostCommon')}</h3>
                <ul className="space-y-1.5">
                  {profile.top.map((item) => (
                    <li key={item.value} className="text-[12px]">
                      <div className="flex justify-between gap-2">
                        <span className="truncate" dir="auto" title={item.value}>{item.value === '' ? t('labInspectorBlankValue') : item.value}</span>
                        <span className="font-mono text-lab-dim shrink-0">{item.count.toLocaleString()}</span>
                      </div>
                      <div className="h-1 mt-0.5 rounded-full bg-lab-raised overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pulse-400 to-volt-500" style={{ width: `${Math.max(3, (item.count / Math.max(1, profile.valid)) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Fixes title={t('labInspectorSmartFixes')} items={fixes} onApply={onApply} empty={t('labInspectorNoFixes')} applyLabel={t('labInspectorApply')} applyAffectedTemplate={t('labInspectorApplyAffected')} />
          </>
        )}
      </div>
    </aside>
  );
};

const Fixes: React.FC<{ title: string; items: Suggestion[]; onApply: (s: Suggestion) => void; empty: string; applyLabel: string; applyAffectedTemplate: string }> = ({ title, items, onApply, empty, applyLabel, applyAffectedTemplate }) => (
  <section>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-lab-faint mb-2 flex items-center gap-1.5">
      <Wand2 className="w-3 h-3" /> {title}
    </h3>
    {items.length === 0 ? (
      <p className="flex items-center gap-2 text-[12px] text-lab-dim"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> {empty}</p>
    ) : (
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="rounded-xl border border-lab-line-strong bg-lab-raised p-3">
            <div className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE[s.tone] }} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold leading-snug">{s.title}</p>
                <p className="text-[11px] text-lab-dim leading-snug mt-0.5">{s.detail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApply(s)}
              className="mt-2.5 w-full h-7 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-pulse-500 to-volt-600 text-white hover:brightness-110 active:brightness-95 transition"
            >
              <Sparkles className="w-3 h-3" /> {applyAffectedTemplate.replace('{apply}', applyLabel).replace('{count}', s.affected.toLocaleString())}
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const Stat: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <div>
    <dd className={`font-mono text-sm font-semibold ${tone}`}>{value}</dd>
    <dt className="text-[10px] uppercase tracking-wider text-lab-faint">{label}</dt>
  </div>
);
const Tile: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-xl border border-lab-line bg-lab-bg/60 px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider text-lab-faint">{label}</p>
    <p className="font-mono text-[15px] font-semibold truncate">{value}</p>
    {sub && <p className="text-[10px] text-lab-dim truncate">{sub}</p>}
  </div>
);

export const HealthBar: React.FC<{ valid: number; empty: number; errors: number; ariaLabel?: string }> = ({ valid, empty, errors, ariaLabel }) => {
  const total = Math.max(1, valid + empty + errors);
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-lab-raised" role="img" aria-label={ariaLabel || `${valid} valid, ${empty} empty, ${errors} errors`}>
      <div style={{ width: `${(valid / total) * 100}%` }} className="bg-emerald-400" />
      <div style={{ width: `${(empty / total) * 100}%` }} className="bg-amber-400" />
      <div style={{ width: `${(errors / total) * 100}%` }} className="bg-rose-500" />
    </div>
  );
};

const ScoreRing: React.FC<{ value: number; ariaLabel: string }> = ({ value, ariaLabel }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = value >= 95 ? '#34d399' : value >= 80 ? '#fbbf24' : '#fb7185';
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={ariaLabel}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-lab-raised)" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 34 34)" />
      <text x="34" y="39" textAnchor="middle" className="fill-[var(--color-lab-text)]" style={{ font: '700 15px var(--font-mono)' }}>{value}</text>
    </svg>
  );
};
