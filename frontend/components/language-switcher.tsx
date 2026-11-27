'use client';

import { Globe } from 'lucide-react';
import { useI18n, type Language } from '@/lib/i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-slate-400" aria-hidden="true" />
      <select
        aria-label={t('languageLabel')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
      >
        <option value="fr">{t('languageFr')}</option>
        <option value="en">{t('languageEn')}</option>
      </select>
    </div>
  );
}
