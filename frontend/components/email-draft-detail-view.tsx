'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, Check, Send, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { ErrorState, LoadingState } from '@/components/state';
import { useI18n } from '@/lib/i18n';
import type { DraftUpdatePayload } from '@/lib/api';

export function EmailDraftDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { t, formatDate, localizeApiMessage } = useI18n();
  const { data, error, loading, reload, setData } = useResource(
    () => api.draft(id),
    `draft:${id}`,
    () => router.replace('/login'),
  );
  const [form, setForm] = useState<DraftUpdatePayload | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setNotice(null);
    setActionError(null);
    try {
      await action();
      setNotice(message);
      reload();
    } catch (cause) {
      setActionError(localizeApiMessage(cause instanceof Error ? cause.message : t('actionFailed')));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label={t('loadingDraft')} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const editable = data.status === 'PENDING_REVIEW';
  const values = form ?? { subject: data.subject, body: data.body };

  const save = () =>
    run(
      async () => {
        const updated = await api.updateDraft(id, values);
        setData(updated);
        setForm(null);
      },
      t('draftSaved'),
    );

  const send = () => {
    if (!window.confirm(t('confirmSend'))) return;
    void run(
      async () => {
        await api.sendDraft(id);
        setTimeout(() => reload(), 3000);
        setTimeout(() => reload(), 8000);
      },
      t('sendRequested'),
    );
  };

  return (
    <div className="space-y-6">
      <Link href="/email-drafts" className="text-sm text-slate-500 hover:text-slate-900">
        {t('backToDrafts')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('draftTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('createdUpdated', {
              created: formatDate(data.createdAt),
              updated: formatDate(data.updatedAt),
            })}
          </p>
        </div>
        <StatusBadge value={data.status} />
      </header>

      {notice ? (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
      {actionError ? <ErrorState message={actionError} /> : null}

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">{t('subject')}</span>
          <Input
            value={values.subject}
            disabled={!editable}
            onChange={(event) => setForm({ ...values, subject: event.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">{t('content')}</span>
          <Textarea
            rows={14}
            value={values.body}
            disabled={!editable}
            onChange={(event) => setForm({ ...values, body: event.target.value })}
          />
        </label>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={save} disabled={busy || !form}>
              {t('save')}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                run(
                  async () => {
                    if (form) await api.updateDraft(id, form);
                    setData(await api.approveDraft(id));
                    setForm(null);
                  },
                  t('approvedNotice'),
                )
              }
              disabled={busy}
            >
              <Check className="h-4 w-4" aria-hidden="true" /> {t('approve')}
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                run(
                  async () => setData(await api.rejectDraft(id)),
                  t('rejectedNotice'),
                )
              }
              disabled={busy}
            >
              <X className="h-4 w-4" aria-hidden="true" /> {t('reject')}
            </Button>
          </div>
        ) : null}
        {data.status === 'APPROVED' ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <p className="text-sm text-slate-600">{t('sendSimulationNotice')}</p>
            <Button onClick={send} disabled={busy} className="ml-auto">
              <Send className="h-4 w-4" aria-hidden="true" /> {t('send')}
            </Button>
          </div>
        ) : null}
        {data.status === 'SENT' && data.sentAt ? (
          <p className="border-t border-slate-200 pt-4 text-sm text-emerald-700">
            {t('sentSimulationOn', { date: formatDate(data.sentAt) })}
          </p>
        ) : null}
      </section>
    </div>
  );
}
