'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileSpreadsheet, Mail, Target, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { ErrorState, LoadingState } from '@/components/state';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';

const statusEntries = [
  ['NEW', 'Nouveaux'],
  ['ANALYZING', 'En analyse'],
  ['QUALIFIED', 'Qualifiés'],
  ['NOT_QUALIFIED', 'Non qualifiés'],
  ['ERROR', 'Erreurs'],
] as const;

const categoryEntries = [
  ['HIGH', 'Score élevé'],
  ['MEDIUM', 'Score moyen'],
  ['LOW', 'Score faible'],
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useResource(
    () => api.dashboard(),
    'dashboard',
    () => router.replace('/login'),
  );

  if (loading) return <LoadingState label="Chargement du tableau de bord…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const stats = [
    { label: 'Prospects', value: data.totalProspects, icon: Users, hint: 'Total enregistré' },
    { label: 'Qualifiés', value: data.qualifiedProspects, icon: Target, hint: 'Statut QUALIFIED' },
    { label: 'Analyses', value: data.analysesCount, icon: FileSpreadsheet, hint: 'Résultats IA' },
    { label: 'À relire', value: data.pendingDrafts, icon: Mail, hint: 'Brouillons en attente' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Vue d’ensemble</h1>
          <p className="mt-1 text-sm text-slate-500">
            Indicateurs calculés depuis PostgreSQL et activités récentes.
          </p>
        </div>
        {data.demoMode ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Données de démonstration
          </span>
        ) : null}
      </header>

      <section aria-label="Indicateurs principaux" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Répartition des prospects</h2>
          <BarList
            entries={statusEntries.map(([key, label]) => [label, data.prospectsByStatus[key] ?? 0])}
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Catégories d’analyse</h2>
          <BarList
            entries={categoryEntries.map(([key, label]) => [label, data.analysesByCategory[key] ?? 0])}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Dernières activités</h2>
          <Link
            href="/activity"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Voir tout <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">Aucune activité pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentActivity.slice(0, 8).map((activity) => (
              <li key={activity.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <StatusBadge value={activity.eventType} />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {activity.description}
                </span>
                <time className="text-xs text-slate-500" dateTime={activity.createdAt}>
                  {formatDate(activity.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BarList({ entries }: { entries: Array<[string, number]> }) {
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <ul className="mt-5 space-y-3">
      {entries.map(([label, value]) => (
        <li key={label} className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>{label}</span>
            <span className="font-medium tabular-nums text-slate-800">{value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800"
              style={{ width: `${Math.round((value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
