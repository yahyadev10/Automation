'use client';

import { useRouter } from 'next/navigation';
import { Activity as ActivityIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/state';
import { formatDate } from '@/lib/utils';

export default function ActivityPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useResource(
    () => api.activity(0, 50),
    'activity',
    () => router.replace('/login'),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Activité</h1>
        <p className="mt-1 text-sm text-slate-500">
          Journal chronologique des événements enregistrés par le backend.
        </p>
      </header>

      {loading ? <LoadingState label="Chargement de l’historique…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && data.content.length === 0 ? (
        <EmptyState title="Aucun événement" description="Les actions apparaîtront ici au fur et à mesure." />
      ) : null}

      {data && data.content.length > 0 ? (
        <ol className="relative space-y-0 border-l border-slate-200 pl-6">
          {data.content.map((event) => (
            <li key={event.id} className="relative pb-7 last:pb-0">
              <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
                <ActivityIcon className="h-3 w-3 text-slate-500" aria-hidden="true" />
              </span>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge value={event.eventType} />
                  <time className="text-xs text-slate-500" dateTime={event.createdAt}>
                    {formatDate(event.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-slate-800">{event.description}</p>
                {Object.keys(event.metadata).length > 0 ? (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
