import { Badge } from '@/components/ui/badge';
import { statusLabel } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<string, Tone> = {
  NEW: 'neutral',
  ANALYZING: 'info',
  QUALIFIED: 'success',
  NOT_QUALIFIED: 'danger',
  ERROR: 'danger',
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'neutral',
  PENDING_REVIEW: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  SENT: 'success',
  FAILED: 'danger',
  SUCCESS: 'success',
  FAILURE: 'danger',
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={tones[value] ?? 'neutral'}>{statusLabel(value)}</Badge>;
}
