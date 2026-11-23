'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/state';
import { formatDate } from '@/lib/utils';
import type { DraftStatus } from '@/lib/types';

const filters: Array<{ value: DraftStatus | ''; label: string }> = [
  { value: '', label: 'Tous' },
  { value: 'PENDING_REVIEW', label: 'À relire' },
  { value: 'APPROVED', label: 'Approuvés' },
  { value: 'SENT', label: 'Envoyés' },
  { value: 'REJECTED', label: 'Rejetés' },
  { value: 'FAILED', label: 'Échecs' },
];

export default function EmailDraftsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DraftStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, error, loading, reload } = useResource(
    () => api.drafts(status, page, 10),
    `drafts:${status}:${page}`,
    () => router.replace('/login'),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Brouillons email</h1>
        <p className="mt-1 text-sm text-slate-500">
          Chaque envoi nécessite une approbation explicite depuis la fiche du brouillon.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(0);
            }}
            className={
              status === filter.value
                ? 'rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white'
                : 'rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Chargement des brouillons…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && data.content.length === 0 ? (
        <EmptyState
          title="Aucun brouillon"
          description="Générez un brouillon depuis la fiche d’un prospect qualifié."
        />
      ) : null}

      {data && data.content.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {data.content.map((draft) => (
              <li key={draft.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{draft.subject}</p>
                  <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate-500">{draft.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(draft.createdAt)}</p>
                </div>
                <StatusBadge value={draft.status} />
                <Link
                  href={`/email-drafts/${draft.id}`}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span>{data.totalElements} brouillon(s)</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                Précédent
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
