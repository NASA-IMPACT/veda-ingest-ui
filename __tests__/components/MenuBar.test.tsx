import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MenuBar from '@/components/layout/MenuBar';
import { SessionProvider } from 'next-auth/react';

function renderWithSession(session: any) {
  return render(
    <SessionProvider session={session}>
      <MenuBar />
    </SessionProvider>
  );
}

describe('MenuBar', () => {
  it('disables create/edit menu items for limited access users', () => {
    const session = {
      expires: '1',
      scopes: ['dataset:limited-access'],
      user: { name: 'Test User', email: 'test@example.com' },
    };
    renderWithSession(session);
    // Create Collection and Edit Collection should not be in the DOM
    expect(screen.queryByText('Create Collection')).toBeNull();
    expect(screen.queryByText('Edit Collection')).toBeNull();
    // Create Dataset and Edit Dataset should not be in the DOM
    expect(screen.queryByText('Create Dataset')).toBeNull();
    expect(screen.queryByText('Edit Dataset')).toBeNull();
  });

  it('shows create/edit menu items as links for users with edit permission', () => {
    const session = {
      expires: '1',
      scopes: ['dataset:update'],
      user: { name: 'Test', email: 'test@example.com' },
    };
    renderWithSession(session);
    expect(screen.getByText('Create Collection').closest('a')).toHaveAttribute(
      'href',
      '/create-collection'
    );
    expect(screen.getByText('Edit Collection').closest('a')).toHaveAttribute(
      'href',
      '/edit-collection'
    );
    expect(screen.getByText('Create Dataset').closest('a')).toHaveAttribute(
      'href',
      '/create-dataset'
    );
    expect(screen.getByText('Edit Dataset').closest('a')).toHaveAttribute(
      'href',
      '/edit-dataset'
    );
  });
});
