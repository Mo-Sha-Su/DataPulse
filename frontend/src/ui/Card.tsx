import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cx } from './cx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

/** Clean white surface used across workspace cards and panels. */
export const Card: React.FC<CardProps> = ({ interactive, padded = true, className, children, ...rest }) => (
  <div
    className={cx(
      'min-w-0 bg-white rounded-2xl border border-slate-200/90 shadow-lift',
      padded && 'p-5',
      interactive && 'transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_10px_28px_-14px_rgb(14_165_233/0.28)]',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

type Tone = 'sky' | 'navy' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';
const TONE: Record<Tone, { tile: string; text: string }> = {
  sky: { tile: 'bg-sky-50 text-sky-600', text: 'text-sky-600' },
  navy: { tile: 'bg-navy-900/5 text-navy-900', text: 'text-navy-900' },
  violet: { tile: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-600' },
  emerald: { tile: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
  amber: { tile: 'bg-amber-50 text-amber-600', text: 'text-amber-600' },
  rose: { tile: 'bg-rose-50 text-rose-600', text: 'text-rose-600' },
  slate: { tile: 'bg-slate-100 text-slate-600', text: 'text-slate-600' },
};

export const StatCard: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string; hint?: string; tone?: Tone }> = ({
  icon, value, label, hint, tone = 'sky',
}) => (
  <Card className="flex items-center gap-3.5 sm:gap-4">
    <span className={cx('w-11 h-11 rounded-xl grid place-items-center shrink-0', TONE[tone].tile)}>{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-2xl leading-none font-extrabold tracking-tight text-slate-900 tabular truncate">{value}</p>
      <p className="mt-1.5 text-xs font-semibold text-slate-600 truncate">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{hint}</p>}
    </div>
  </Card>
);

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'slate', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold', TONE[tone].tile, className)}>
    {children}
  </span>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <Card className="py-12 px-5 flex flex-col items-center text-center border-dashed border-slate-300 bg-white/80">
    <span className="w-12 h-12 rounded-2xl grid place-items-center bg-sky-50 text-sky-600 mb-4">{icon}</span>
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md mt-1.5 mb-5 leading-relaxed">{description}</p>
    {action}
  </Card>
);

export const PageHeader: React.FC<{ eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }> = ({
  eyebrow, title, description, actions,
}) => (
  <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 min-w-0">
    <div className="min-w-0">
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-sky-600">
          <span className="w-4 h-px bg-sky-400" />
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-2xl sm:text-3xl leading-tight font-extrabold tracking-tight text-slate-900 break-words">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">{actions}</div>}
  </header>
);

export const Segmented = <T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[] }) => (
  <div role="tablist" className="inline-flex max-w-full overflow-x-auto no-scrollbar p-1 rounded-xl bg-slate-200/70 gap-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="tab"
        aria-selected={value === o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          'h-8 px-3 sm:px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer',
          value === o.value ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/** Plain-language collapsible disclosure used for progressive disclosure in builders & studios. */
export const SectionDisclosure: React.FC<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, defaultOpen = false, children, className }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx('rounded-xl border border-slate-200/90 bg-slate-50/70 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-start hover:bg-slate-100/70 transition-colors cursor-pointer"
      >
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-slate-800">{title}</span>
          {subtitle && <span className="block text-[11px] text-slate-500 truncate">{subtitle}</span>}
        </div>
        <ChevronDown className={cx('w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 bg-white space-y-3">{children}</div>}
    </div>
  );
};

/** Subtle inline plain-language helper tip for non-technical users. */
export const HelpHint: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span
    className={cx('inline-flex items-center text-slate-400 hover:text-sky-600 transition-colors cursor-help', className)}
    title={text}
    aria-label={text}
  >
    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
  </span>
);
