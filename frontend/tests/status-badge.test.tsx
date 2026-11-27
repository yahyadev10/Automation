import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '@/components/status-badge';

describe('StatusBadge', () => {
  it('exposes a translated label for known status values', () => {
    render(<StatusBadge value="PENDING_REVIEW" />);
    expect(screen.getByText('À relire')).toBeInTheDocument();
  });

  it('uses a distinct tone for successful states', () => {
    const { container } = render(<StatusBadge value="SENT" />);
    expect(container.querySelector('.bg-emerald-50')).not.toBeNull();
  });
});
