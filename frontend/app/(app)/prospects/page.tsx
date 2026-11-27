'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Search } from 'lucide-react';
import { api, type ProspectCreatePayload } from '@/lib/api';
import { useResource } from '@/hooks/use-resource';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/state';
import { useI18n } from '@/lib/i18n';
import type { ProspectStatus } from '@/lib/types';

const statusFilters = [
  { value: '', key: 'all' },
  { value: 'NEW', key: 'statusNew' },
  { value: 'ANALYZING', key: 'statusAnalyzing' },
  { value: 'QUALIFIED', key: 'statusQualified' },
  { value: 'NOT_QUALIFIED', key: 'statusNotQualified' },
  { value: 'ERROR', key: 'statusError' },
] as const;

const emptyForm: ProspectCreatePayload = {
  companyName: '',
  contactName: '',
  email: '',
  website: '',
  industry: '',
  companyDescription: '',
  source: 'MANUAL',
};

export default function ProspectsPage() {
  const router = useRouter();
  const { t, formatDate, localizeApiMessage } = useI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProspectStatus | ''>('');
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProspectCreatePayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error, loading, reload } = useResource(
    () => api.prospects({ page, size: 10, search, status }),
    `prospects:${page}:${search}:${status}`,
    () => router.replace('/login'),
  );

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.createProspect(form);
      setForm(emptyForm);
      setShowForm(false);
      setPage(0);
      reload();
    } catch (cause) {
      setFormError(localizeApiMessage(cause instanceof Error ? cause.message : t('createFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('prospectsTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('prospectsSubtitle')}</p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showForm ? t('closeForm') : t('newProspect')}
        </Button>
      </header>

      {showForm ? (
        <form onSubmit={create} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2">
          <Field label={t('company')} required>
            <Input
              required
              value={form.companyName}
              onChange={(event) => setForm({ ...form, companyName: event.target.value })}
            />
          </Field>
          <Field label={t('contact')}>
            <Input
              value={form.contactName ?? ''}
              onChange={(event) => setForm({ ...form, contactName: event.target.value })}
            />
          </Field>
          <Field label={t('email')}>
            <Input
              type="email"
              value={form.email ?? ''}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label={t('industry')}>
            <Input
              value={form.industry ?? ''}
              onChange={(event) => setForm({ ...form, industry: event.target.value })}
            />
          </Field>
          <Field label={t('website')} className="md:col-span-2">
            <Input
              value={form.website ?? ''}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </Field>
          <Field label={t('description')} required className="md:col-span-2">
            <Textarea
              required
              rows={3}
              value={form.companyDescription}
              onChange={(event) => setForm({ ...form, companyDescription: event.target.value })}
            />
          </Field>
          {formError ? (
            <p role="alert" className="text-sm text-red-600 md:col-span-2">
              {formError}
            </p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? t('creating') : t('createProspect')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            aria-label={t('searchProspect')}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterByStatus')}>
          {statusFilters.map((filter) => (
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
              {t(filter.key)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState label={t('loadingProspects')} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && data.content.length === 0 ? (
        <EmptyState
          title={t('noProspect')}
          description={t('noProspectDescription')}
        />
      ) : null}
      {data && data.content.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">{t('tableCompany')}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t('tableContact')}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t('tableStatus')}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t('tableCreatedAt')}</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">{t('tableAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.content.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{prospect.companyName}</p>
                    <p className="text-xs text-slate-500">{prospect.industry || t('industryNotProvided')}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{prospect.contactName || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge value={prospect.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(prospect.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      {t('open')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span>
              {t(data.totalElements === 1 ? 'resultOne' : 'resultMany', {
                count: data.totalElements,
                page: data.page + 1,
                pages: Math.max(1, data.totalPages),
              })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" /> {t('previous')}
              </Button>
              <Button
                variant="outline"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('next')} <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-1.5 ${className ?? ''}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
