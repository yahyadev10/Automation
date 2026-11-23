'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuth();
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
      setError('Identifiants invalides ou service indisponible.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            LeadFlow AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accédez à l’espace de qualification et de suivi des prospects.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm onSubmit={handleLogin} error={error} />
        </div>
        <p className="text-xs text-slate-500">
          Compte de démonstration : demo@leadflow.ai / DemoPass123! — réservé au développement.
        </p>
      </div>
    </main>
  );
}
