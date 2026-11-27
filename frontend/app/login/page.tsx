'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const current = await api.login(email, password);
      setUser(current);
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError(t('loginError'));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              LeadFlow AI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {t('loginTitle')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('loginSubtitle')}</p>
          </div>
          <LanguageSwitcher className="pt-1" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm onSubmit={handleLogin} error={error} />
        </div>
        <p className="text-xs text-slate-500">
          {t('demoAccount')} : demo@leadflow.ai / DemoPass123! — {t('demoOnly')}.
        </p>
      </div>
    </main>
  );
}
