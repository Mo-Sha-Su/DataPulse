import React from 'react';
import { LanguageContext } from '../i18n/LanguageContext';

interface Props {
  children: React.ReactNode;
  /** 'page' shows a full-screen recovery card, 'inline' a compact message (used inside widgets). */
  variant?: 'page' | 'inline';
  resetKey?: unknown;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  static contextType = LanguageContext;
  declare context: React.ContextType<typeof LanguageContext>;

  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = this.context.t;
    if (this.props.variant === 'inline') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-3 text-center text-xs text-slate-500 bg-slate-50 rounded">
          <span className="font-semibold text-slate-600">{t('errorBoundaryWidgetMsg')}</span>
          <button className="underline text-blue-600 cursor-pointer" onClick={() => this.setState({ error: null })}>
            {t('retry')}
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900">{t('errorBoundaryPageTitle')}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('errorBoundaryPageDesc')}
          </p>
          <button
            className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium cursor-pointer"
            onClick={() => window.location.reload()}
          >
            {t('reloadPage')}
          </button>
        </div>
      </div>
    );
  }
}
