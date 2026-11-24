import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  theme?: 'light' | 'dark';
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  panelClassName?: string;
  children: React.ReactNode;
}

/** Accessible, viewport-safe modal primitive with consistent header/body/footer containment. */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  theme = 'light',
  closeLabel = 'Close',
  closeOnBackdrop = true,
  headerExtra,
  footer,
  bodyClassName,
  panelClassName,
  children,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={closeOnBackdrop ? onClose : undefined}
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'w-full max-h-[90dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border lab-pop',
          SIZE_CLASS[size],
          isDark
            ? 'bg-lab-panel border-lab-line-strong text-lab-text'
            : 'bg-white border-slate-200 text-slate-900',
          panelClassName
        )}
      >
        {(title || icon || headerExtra) && (
          <div
            className={cx(
              'px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0',
              isDark ? 'border-lab-line bg-lab-raised/60' : 'border-slate-100 bg-slate-50/70'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && <span className="shrink-0">{icon}</span>}
              <div className="min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className={cx(
                      'text-sm sm:text-base font-bold truncate',
                      isDark ? 'text-lab-text' : 'text-slate-900'
                    )}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    className={cx(
                      'text-[11px] sm:text-xs truncate mt-0.5',
                      isDark ? 'text-lab-dim' : 'text-slate-500'
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className={cx(
                  'w-8 h-8 rounded-lg grid place-items-center transition-colors cursor-pointer shrink-0',
                  isDark
                    ? 'text-lab-dim hover:text-lab-text hover:bg-lab-hover'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className={cx('flex-1 min-h-0 overflow-y-auto p-4 sm:p-5', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div
            className={cx(
              'px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-end gap-2 shrink-0',
              isDark ? 'border-lab-line bg-lab-raised/50' : 'border-slate-100 bg-slate-50/70'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
