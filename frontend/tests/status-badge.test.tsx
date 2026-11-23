import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '@/components/status-badge';

describe('StatusBadge', () => {
  it('formats underscore status values and exposes a readable label', () => {
    render(<StatusBadge value="PENDING_REVIEW" />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('uses a distinct tone for successful states', () => {
    const { container } = render(<StatusBadge value="SENT" />);
    expect(container.querySelector('.bg-emerald-50')).not.toBeNull();
  });
});
