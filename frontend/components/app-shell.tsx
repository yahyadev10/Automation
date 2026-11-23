'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Mail,
  Users,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/prospects', label: 'Prospects', icon: Users },
  { href: '/email-drafts', label: 'Brouillons', icon: Mail },
  { href: '/activity', label: 'Activité', icon: Activity },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const logout = async () => {
    await api.logout().catch(() => undefined);
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
              L
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              LeadFlow AI
            </span>
          </Link>
          <p className="hidden text-xs text-slate-500 lg:mt-2 lg:block">
            Qualification assistée par IA
          </p>
        </div>
        <nav aria-label="Navigation principale" className="flex overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3 lg:pb-6">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-slate-200 px-5 py-4 lg:block">
          <p className="truncate text-sm font-medium text-slate-800">
            {user?.fullName || user?.email || 'Compte'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{user?.role ?? '—'}</p>
          <Button variant="ghost" onClick={logout} className="mt-3 w-full justify-start px-0">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Déconnexion
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-900">LeadFlow AI</span>
          {!loading ? (
            <Button variant="ghost" onClick={logout} aria-label="Déconnexion">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
