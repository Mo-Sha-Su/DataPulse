import React from 'react';
import { cx } from './cx';

export const FieldLabel: React.FC<
  React.LabelHTMLAttributes<HTMLLabelElement> & { requiredMark?: boolean; hint?: string }
> = ({ children, requiredMark, hint, className, ...rest }) => (
  <div className="flex items-baseline justify-between gap-2 mb-1">
    <label
      className={cx('block text-xs font-semibold text-slate-700 text-start', className)}
      {...rest}
    >
      {children}
      {requiredMark && <span className="text-rose-500 ms-0.5">*</span>}
    </label>
    {hint && <span className="text-[11px] text-slate-400 shrink-0">{hint}</span>}
  </div>
);

const BASE_CONTROL_CLS =
  'w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/15 disabled:opacity-60 disabled:cursor-not-allowed';

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { controlSize?: 'sm' | 'md' }
> = ({ controlSize = 'md', className, ...rest }) => (
  <input
    className={cx(
      BASE_CONTROL_CLS,
      controlSize === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3.5 text-sm',
      className
    )}
    {...rest}
  />
);

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { controlSize?: 'sm' | 'md' }
> = ({ controlSize = 'md', className, children, ...rest }) => (
  <select
    className={cx(
      BASE_CONTROL_CLS,
      controlSize === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm',
      className
    )}
    {...rest}
  >
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...rest
}) => (
  <textarea
    className={cx(BASE_CONTROL_CLS, 'px-3.5 py-2.5 text-sm', className)}
    {...rest}
  />
);
