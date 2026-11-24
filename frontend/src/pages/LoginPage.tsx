import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { loginUser } from '../services/authService';
import { User } from '../types/auth';
import { BrandHomeLink } from '../components/BrandLogo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useLanguage, LanguageToggle } from '../i18n/LanguageContext';

interface Props {
  onLoginSuccess: (user: User) => void;
  onNavigate: (page: any, dashboardId?: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg(t('enterEmailError'));
      return;
    }
    if (!password) {
      setErrorMsg(t('enterPasswordError'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.detail || res.message || t('authInvalidCredentials'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('authConnectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f7f9fc] flex flex-col relative overflow-x-clip font-sans">
      <AnimatedBackground variant="subtle" />

      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-sky-600 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
          <span>{t('backToHome')}</span>
        </button>
        <LanguageToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8 pt-2 relative z-10">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-lift border border-slate-200/90">
          <div className="flex items-center justify-center mb-6">
            <BrandHomeLink size={40} textSize="text-2xl" onNavigateHome={() => onNavigate('home')} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-1.5">
              {t('welcomeBackTitle')}
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              {t('welcomeBackSubtitle')}
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 text-start">
                {t('emailAddress')}
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 text-start">
                {t('passwordLabel')}
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm shadow-xs transition-all disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('authSigningIn')}</span>
                </>
              ) : (
                <span>{t('signInBtn')}</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-500 font-medium">
            {t('dontHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer ms-1"
            >
              {t('createOneFree')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
