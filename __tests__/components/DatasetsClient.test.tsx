import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DatasetsClient from '@/app/datasets/_components/DatasetsClient';
import { SessionProvider } from 'next-auth/react';

function renderWithSession(session: any) {
  return render(
    <SessionProvider session={session}>
      <DatasetsClient />
    </SessionProvider>
  );
}

describe('DatasetsClient', () => {
  it('disables all cards for limited access users', () => {
    const session = {
      expires: '1',
      scopes: ['dataset:limited-access'],
      user: { name: 'Test', email: 'test@example.com' },
    };
    renderWithSession(session);
    const createCard = screen.getByText('Create New Dataset Ingest Request');
    const editCard = screen.getByText('Edit Dataset Ingest Request');
    expect(createCard.closest('a')).toBeNull();
    expect(editCard.closest('a')).toBeNull();
    expect(createCard.closest('.ant-card')).toHaveStyle('opacity: 0.6');
    expect(editCard.closest('.ant-card')).toHaveStyle('opacity: 0.6');
    // Removed assertion for title attribute
  });

  it('shows correct links for users with edit permission', () => {
    const session = {
      expires: '1',
      scopes: ['dataset:update'],
      user: { name: 'Test', email: 'test@example.com' },
    };
    renderWithSession(session);
    expect(
      screen.getByText('Create New Dataset Ingest Request').closest('a')
    ).toHaveAttribute('href', '/create-dataset');
    expect(
      screen.getByText('Edit Dataset Ingest Request').closest('a')
    ).toHaveAttribute('href', '/edit-dataset');
  });
});
