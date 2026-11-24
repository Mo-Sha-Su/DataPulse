import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { registerUser, loginUser } from '../services/authService';
import { User } from '../types/auth';
import { BrandHomeLink } from '../components/BrandLogo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useLanguage, LanguageToggle } from '../i18n/LanguageContext';

interface Props {
  onLoginSuccess: (user: User) => void;
  onNavigate: (page: any, dashboardId?: string) => void;
}

export const SignupPage: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg(t('enterFullNameError'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(t('enterValidEmailError'));
      return;
    }
    if (password.length < 8) {
      setErrorMsg(t('passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('passwordsDoNotMatch'));
      return;
    }
    if (!termsAccepted) {
      setErrorMsg(t('agreeTermsError'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser(
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password,
        role
      );

      if (res.success) {
        const loginRes = await loginUser(email.trim(), password);
        if (loginRes.success && loginRes.user) {
          onLoginSuccess(loginRes.user);
        } else {
          onNavigate('login');
        }
      } else {
        setErrorMsg(res.detail || res.message || t('authRegistrationFailed'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('authRegistrationError'));
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

      <main className="flex-1 flex items-center justify-center px-4 pb-10 pt-2 relative z-10">
        <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-lift border border-slate-200/90">
          <div className="flex items-center justify-center mb-6">
            <BrandHomeLink size={40} textSize="text-2xl" onNavigateHome={() => onNavigate('home')} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-1">
              {t('createAccountTitle')}
            </h1>
            <p className="text-slate-500 text-xs font-medium">{t('startFreeTrial')}</p>
          </div>

          {errorMsg && (
            <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 min-w-0">
                <label htmlFor="signup-first-name" className="block text-xs font-semibold text-slate-700 text-start">
                  {t('firstNameLabel')} *
                </label>
                <input
                  id="signup-first-name"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder={t('authFirstNamePlaceholder')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <label htmlFor="signup-last-name" className="block text-xs font-semibold text-slate-700 text-start">
                  {t('lastNameLabel')} *
                </label>
                <input
                  id="signup-last-name"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder={t('authLastNamePlaceholder')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 text-start">
                {t('emailAddress')} *
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 text-start">
                {t('passwordLabel')} *
              </label>
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              />
              {password.length > 0 && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t('passwordStrength')}:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-6 h-1 rounded-full transition-all ${
                          strengthScore >= step
                            ? strengthScore <= 1
                              ? 'bg-rose-500'
                              : strengthScore === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-slate-700 text-start">
                {t('confirmPasswordLabel')} *
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                dir="ltr"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              />
              {confirmPassword.length > 0 && (
                <div className="pt-0.5 flex items-center gap-1 text-[11px]">
                  {passwordsMatch ? (
                    <span className="text-emerald-600 font-semibold">{t('authPasswordsMatch')}</span>
                  ) : (
                    <span className="text-rose-600 font-semibold">{t('passwordsDoNotMatch')}</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-role" className="block text-xs font-semibold text-slate-700 text-start">
                {t('roleLabel')}
              </label>
              <select
                id="signup-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-600 focus:bg-white transition-all text-start"
              >
                <option value="analyst">{t('roleAnalyst')}</option>
                <option value="developer">{t('roleDeveloper')}</option>
                <option value="viewer">{t('roleViewer')}</option>
                <option value="admin">{t('roleAdmin')}</option>
              </select>
            </div>

            <div className="pt-1 flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 font-medium cursor-pointer text-start">
                {t('termsAgreementText')}
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm shadow-xs transition-all disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('authCreatingAccount')}</span>
                </>
              ) : (
                <span>{t('createAccountBtn')}</span>
              )}
            </button>
          </form>

          <div className="text-center mt-5 text-xs text-slate-500 font-medium">
            {t('alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer ms-1"
            >
              {t('signInBtn')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
