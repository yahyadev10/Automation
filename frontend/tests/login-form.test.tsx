import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '@/components/login-form';

describe('LoginForm', () => {
  it('submits the entered credentials', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.clear(screen.getByLabelText('Mot de passe'));
    await user.type(screen.getByLabelText('Mot de passe'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'secret');
  });

  it('shows the error message returned by the caller', () => {
    render(<LoginForm onSubmit={vi.fn()} error="Identifiants invalides" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Identifiants invalides');
  });
});
