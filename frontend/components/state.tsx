import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-700"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="self-start">
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
