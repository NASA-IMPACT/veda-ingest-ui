import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CollectionsClient from '@/app/collections/_components/CollectionsClient';

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

  it('always shows the create collection card as clickable', () => {
    const mockSession = createMockSession();
    render(<CollectionsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    const createCard = screen.getByText('Create New Collection Ingest Request');
    expect(createCard).toBeInTheDocument();
    expect(createCard.closest('a')).toHaveAttribute(
      'href',
      '/create-collection'
    );
  });

  describe('with dataset:update permission', () => {
    it('shows edit collection ingest card as clickable link', () => {
      const mockSession = createMockSession(['dataset:update']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Collection Ingest Request');
      expect(editCard).toBeInTheDocument();
      expect(editCard.closest('a')).toHaveAttribute('href', '/edit-collection');
    });

    it('shows edit existing collection card as disabled', () => {
      const mockSession = createMockSession(['dataset:update']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editExistingCard = screen.getByText('Edit Existing Collection');
      expect(editExistingCard).toBeInTheDocument();
      expect(editExistingCard.closest('a')).toBeNull();
      expect(editExistingCard.closest('.ant-card')).toHaveStyle({
        opacity: '0.6',
      });
    });
  });

  describe('without dataset:update permission', () => {
    it('shows edit collection ingest card as disabled with tooltip', () => {
      const mockSession = createMockSession();
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Collection Ingest Request');
      expect(editCard).toBeInTheDocument();
      expect(editCard.closest('a')).toBeNull();
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });

    it('shows edit existing collection card as disabled with tooltip', () => {
      const mockSession = createMockSession();
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editExistingCard = screen.getByText('Edit Existing Collection');
      expect(editExistingCard).toBeInTheDocument();
      expect(editExistingCard.closest('a')).toBeNull();
      expect(editExistingCard.closest('.ant-card')).toHaveStyle({
        opacity: '0.6',
      });
    });
  });

  describe('with stac:collection:update permission', () => {
    it('shows edit collection ingest card as disabled', () => {
      const mockSession = createMockSession(['stac:collection:update']);
      render(<CollectionsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Collection Ingest Request');
      expect(editCard).toBeInTheDocument();
      //Should not be wrapped in a link
      expect(editCard.closest('a')).toBeNull();
      // Should have disabled styling
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });
  });

  it('shows edit existing collection card as clickable link', () => {
    const mockSession = createMockSession(['stac:collection:update']);
    render(<CollectionsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    const editExistingCard = screen.getByText('Edit Existing Collection');
    expect(editExistingCard).toBeInTheDocument();
    expect(editExistingCard.closest('a')).toHaveAttribute(
      'href',
      '/edit-existing-collection'
    );
  });
});
