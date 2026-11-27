import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LanguageProvider, useI18n } from '@/lib/i18n';

function DashboardLabel() {
  const { t } = useI18n();
  return <span>{t('navDashboard')}</span>;
}

describe('LanguageProvider', () => {
  it('defaults to French and switches to English', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageSwitcher />
        <DashboardLabel />
      </LanguageProvider>,
    );

    expect(screen.getByText('Vue d’ensemble')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Langue de l’interface'), 'en');
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
