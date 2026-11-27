'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { ErrorState, LoadingState } from '@/components/state';
import { useI18n } from '@/lib/i18n';

export function ProspectDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { t, formatDate, localizeApiMessage } = useI18n();
  const { data, error, loading, reload } = useResource(
    () => api.prospect(id),
    `prospect:${id}`,
    () => router.replace('/login'),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (kind: 'analysis' | 'draft') => {
    setBusy(kind);
    setNotice(null);
    setActionError(null);
    try {
      if (kind === 'analysis') {
        const result = await api.qualify(id);
        setNotice(`${localizeApiMessage(result.message)} (${result.correlationId.slice(0, 8)})`);
      } else {
        const result = await api.generateDraft(id);
        setNotice(`${localizeApiMessage(result.message)} (${result.correlationId.slice(0, 8)})`);
      }
      setTimeout(() => reload(), 3000);
      setTimeout(() => reload(), 8000);
    } catch (cause) {
      setActionError(localizeApiMessage(cause instanceof Error ? cause.message : t('actionFailed')));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingState label={t('loadingProspect')} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const latest = data.analyses[0];

  return (
    <div className="space-y-6">
      <Link href="/prospects" className="text-sm text-slate-500 hover:text-slate-900">
        {t('backToProspects')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {data.companyName}
            </h1>
            <StatusBadge value={data.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {data.industry || t('industryNotProvided')} · {t('source')} {data.source}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runAction('analysis')} disabled={busy !== null}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {busy === 'analysis' ? t('analyzing') : t('analyzeWithAi')}
          </Button>
          <Button
            variant="outline"
            onClick={() => runAction('draft')}
            disabled={busy !== null || !latest}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {busy === 'draft' ? t('generating') : t('generateDraft')}
          </Button>
        </div>
      </header>

      {notice ? (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
      {actionError ? <ErrorState message={actionError} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">{t('information')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label={t('contact')} value={data.contactName} />
            <Detail label={t('email')} value={data.email} />
            <Detail label={t('website')} value={data.website} />
            <Detail label={t('description')} value={data.companyDescription} />
            <Detail label={t('createdAt')} value={formatDate(data.createdAt)} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">{t('lastQualification')}</h2>
          {!latest ? (
            <p className="mt-4 text-sm text-slate-500">{t('noAnalysisHint')}</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">{latest.score}</span>
                <span className="text-sm text-slate-500">{t('outOf100')}</span>
                <StatusBadge value={latest.category} />
                <span className="text-xs text-slate-500">
                  {t('confidence')} {latest.confidence.toLowerCase()}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{latest.summary}</p>
              <List title={t('strengths')} items={latest.strengths} />
              <List title={t('weaknesses')} items={latest.weaknesses} />
              <List title={t('missingInformation')} items={latest.missingInformation} />
              <List title={t('recommendations')} items={latest.recommendations} />
              <p className="text-xs text-slate-500">
                {t('model')} : {latest.modelName || t('notProvided')} · {t('prompt')}{' '}
                {latest.promptVersion || '—'} · {formatDate(latest.createdAt)}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">{t('analysisHistory')}</h2>
        </div>
        {data.analyses.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">{t('noAnalysisRecorded')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.analyses.map((analysis) => (
              <li key={analysis.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="font-medium tabular-nums text-slate-900">{analysis.score}/100</span>
                <StatusBadge value={analysis.category} />
                <span className="min-w-0 flex-1 truncate text-slate-600">{analysis.summary}</span>
                <time className="text-xs text-slate-500" dateTime={analysis.createdAt}>
                  {formatDate(analysis.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">{t('draftsSection')}</h2>
        </div>
        {data.drafts.length === 0 ? (
          <p data-draft-ready className="px-5 py-6 text-sm text-slate-500">
            {t('noDraftHint')}
          </p>
        ) : (
          <ul data-draft-ready className="divide-y divide-slate-100">
            {data.drafts.map((draft) => (
              <li key={draft.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{draft.subject}</span>
                <StatusBadge value={draft.status} />
                <Link
                  href={`/email-drafts/${draft.id}`}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {t('open')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value || '—'}</dd>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
