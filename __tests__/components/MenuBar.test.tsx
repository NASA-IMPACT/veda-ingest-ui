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
    // Create Collection and Edit Collection should be present but disabled
    expect(screen.getByText('Create Collection')).toBeInTheDocument();
    expect(screen.getByText('Edit Collection')).toBeInTheDocument();
    // Create Dataset and Edit Dataset should be present but disabled
    expect(screen.getByText('Create Dataset')).toBeInTheDocument();
    expect(screen.getByText('Edit Dataset')).toBeInTheDocument();
    // Check that the menu items have disabled class or aria-disabled
    const createCollectionItem = screen
      .getByText('Create Collection')
      .closest('[role="menuitem"]');
    const editCollectionItem = screen
      .getByText('Edit Collection')
      .closest('[role="menuitem"]');
    const createDatasetItem = screen
      .getByText('Create Dataset')
      .closest('[role="menuitem"]');
    const editDatasetItem = screen
      .getByText('Edit Dataset')
      .closest('[role="menuitem"]');
    expect(createCollectionItem).toHaveClass('ant-menu-item-disabled');
    expect(editCollectionItem).toHaveClass('ant-menu-item-disabled');
    expect(createDatasetItem).toHaveClass('ant-menu-item-disabled');
    expect(editDatasetItem).toHaveClass('ant-menu-item-disabled');
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

  it('disables edit menu items for users without edit permission', () => {
    const session = {
      expires: '1',
      scopes: [], // No scopes, so no edit permission
      user: { name: 'Test', email: 'test@example.com' },
    };
    renderWithSession(session);
    // Create items should be enabled
    const createCollectionItem = screen
      .getByText('Create Collection')
      .closest('[role="menuitem"]');
    const createDatasetItem = screen
      .getByText('Create Dataset')
      .closest('[role="menuitem"]');
    expect(createCollectionItem).not.toHaveClass('ant-menu-item-disabled');
    expect(createDatasetItem).not.toHaveClass('ant-menu-item-disabled');
    // Edit items should be disabled
    const editCollectionItem = screen
      .getByText('Edit Collection')
      .closest('[role="menuitem"]');
    const editDatasetItem = screen
      .getByText('Edit Dataset')
      .closest('[role="menuitem"]');
    expect(editCollectionItem).toHaveClass('ant-menu-item-disabled');
    expect(editDatasetItem).toHaveClass('ant-menu-item-disabled');
  });
});
