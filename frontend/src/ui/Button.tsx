import React from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'navy' | 'secondary' | 'ghost' | 'danger' | 'lab';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-xs shadow-sky-600/20',
  navy: 'text-white bg-navy-900 hover:bg-navy-800 active:bg-navy-950 shadow-xs shadow-navy-900/20',
  secondary: 'text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  danger: 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100',
  lab: 'text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** render as <label> so a hidden <input type="file"> can live inside */
  asLabel?: boolean;
  icon?: React.ReactNode;
}

/** Shared button primitive using Data Pulse Navy & Sky hierarchy. */
export const Button: React.FC<Props & { children?: React.ReactNode }> = ({
  variant = 'secondary', size = 'md', asLabel, icon, className, children, ...rest
}) => {
  const cls = cx(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 select-none cursor-pointer transition-all duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]',
    VARIANT[variant], SIZE[size], className
  );
  if (asLabel) {
    return (
      <label className={cls}>
        {icon}
        {children}
      </label>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
};
