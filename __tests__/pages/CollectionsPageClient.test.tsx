import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CollectionsClient from '@/app/(pages)/collections/_components/CollectionsClient';

import { TenantContext } from '@/app/contexts/TenantContext';
import { SessionProvider } from 'next-auth/react';

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

const createMockSession = (scopes: string[] = []) => ({
  expires: '1',
  scopes,
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
});

const AllProviders = ({
  children,
  session,
}: {
  children: ReactNode;
  session?: any;
}) => {
  const mockTenantContext = {
    allowedTenants: ['test-tenant-1', 'test-tenant-2'],
    isLoading: false,
  };

  return (
    <SessionProvider session={session}>
      <TenantContext.Provider value={mockTenantContext}>
        {children}
      </TenantContext.Provider>
    </SessionProvider>
  );
};

describe('CollectionsClient Component', () => {
  it('renders the app layout', () => {
    const mockSession = createMockSession();
    render(<CollectionsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the "Ingestion Requests" header', () => {
    const mockSession = createMockSession();
    render(<CollectionsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(
      screen.getByRole('heading', { name: /ingestion requests/i })
    ).toBeInTheDocument();
  });

  it('renders the "Existing STAC Collections" header', () => {
    const mockSession = createMockSession();
    render(<CollectionsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(
      screen.getByRole('heading', { name: /existing stac collections/i })
    ).toBeInTheDocument();
  });

  describe('with dataset:limited-access scope', () => {
    it('shows all cards as disabled with tooltips', () => {
      const mockSession = createMockSession(['dataset:limited-access']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      // All cards should be present but not clickable
      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      expect(createCard).toBeInTheDocument();
      expect(editCard).toBeInTheDocument();
      expect(editExistingCard).toBeInTheDocument();

      // Cards should not be wrapped in links
      expect(createCard.closest('a')).toBeNull();
      expect(editCard.closest('a')).toBeNull();
      expect(editExistingCard.closest('a')).toBeNull();

      // Cards should have disabled styling
      expect(createCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
      expect(editExistingCard.closest('.ant-card')).toHaveStyle({
        opacity: '0.6',
      });
    });

    it('shows cards with tooltip configuration for limited access users', () => {
      const mockSession = createMockSession(['dataset:limited-access']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      // Check that all cards exist and have disabled styling
      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      expect(createCard).toBeInTheDocument();
      expect(editCard).toBeInTheDocument();
      expect(editExistingCard).toBeInTheDocument();

      // Check that cards have aria-describedby attributes (indicates tooltip is configured)
      const createCardElement = createCard.closest('.ant-card');
      const editCardElement = editCard.closest('.ant-card');
      const editExistingCardElement = editExistingCard.closest('.ant-card');

      expect(createCardElement).toHaveAttribute('aria-describedby');
      expect(editCardElement).toHaveAttribute('aria-describedby');
      expect(editExistingCardElement).toHaveAttribute('aria-describedby');

      // Verify disabled styling
      expect(createCardElement).toHaveStyle({ opacity: '0.6' });
      expect(editCardElement).toHaveStyle({ opacity: '0.6' });
      expect(editExistingCardElement).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('without dataset:limited-access scope', () => {
    it('shows create card as clickable, edit cards disabled when no permissions', () => {
      const mockSession = createMockSession(['dataset:create']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      // Create card should be clickable
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-collection'
      );

      // Edit cards should be disabled
      expect(editCard.closest('a')).toBeNull();
      expect(editExistingCard.closest('a')).toBeNull();
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
      expect(editExistingCard.closest('.ant-card')).toHaveStyle({
        opacity: '0.6',
      });
    });

    it('shows create and edit ingest cards as clickable with dataset:update permission', () => {
      const mockSession = createMockSession(['dataset:update']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      // Create and edit ingest cards should be clickable
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-collection'
      );
      expect(editCard.closest('a')).toHaveAttribute('href', '/edit-collection');

      // Edit existing should still be disabled (needs stac:collection:update)
      expect(editExistingCard.closest('a')).toBeNull();
      expect(editExistingCard.closest('.ant-card')).toHaveStyle({
        opacity: '0.6',
      });
    });

    it('shows create and edit existing cards as clickable with stac:collection:update permission', () => {
      const mockSession = createMockSession(['stac:collection:update']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      // Create and edit existing cards should be clickable
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-collection'
      );
      expect(editExistingCard.closest('a')).toHaveAttribute(
        'href',
        '/edit-existing-collection'
      );

      // Edit ingest should be disabled (needs dataset:update)
      expect(editCard.closest('a')).toBeNull();
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });

    it('shows all cards as clickable with both dataset:update and stac:collection:update permissions', () => {
      const mockSession = createMockSession([
        'dataset:update',
        'stac:collection:update',
      ]);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText(
        'Create New Collection Ingest Request'
      );
      const editCard = screen.getByText('Edit Collection Ingest Request');
      const editExistingCard = screen.getByText('Edit Existing Collection');

      // All cards should be clickable
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-collection'
      );
      expect(editCard.closest('a')).toHaveAttribute('href', '/edit-collection');
      expect(editExistingCard.closest('a')).toHaveAttribute(
        'href',
        '/edit-existing-collection'
      );
    });
  });
});
