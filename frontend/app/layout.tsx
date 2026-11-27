import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadFlow AI',
  description: 'Qualification IA et suivi des brouillons commerciaux',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
