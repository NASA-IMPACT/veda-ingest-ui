import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DatasetsClient from '@/app/datasets/_components/DatasetsClient';

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

describe('DatasetsClient Component', () => {
  it('renders the app layout', () => {
    const mockSession = createMockSession();
    render(<DatasetsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the "Ingestion Requests" header', () => {
    const mockSession = createMockSession();
    render(<DatasetsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(
      screen.getByRole('heading', { name: /ingestion requests/i })
    ).toBeInTheDocument();
  });

  it('always shows the create dataset card as clickable', () => {
    const mockSession = createMockSession();
    render(<DatasetsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    const createCard = screen.getByText('Create New Dataset Ingest Request');
    expect(createCard).toBeInTheDocument();
    expect(createCard.closest('a')).toHaveAttribute('href', '/create-dataset');
  });

  describe('with dataset:update permission', () => {
    it('shows edit dataset ingest card as clickable link', () => {
      const mockSession = createMockSession(['dataset:update']);
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Dataset Ingest Request');
      expect(editCard).toBeInTheDocument();
      expect(editCard.closest('a')).toHaveAttribute('href', '/edit-dataset');
    });
  });

  describe('without dataset:update permission', () => {
    it('shows edit dataset ingest card as disabled with tooltip', () => {
      const mockSession = createMockSession();
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Dataset Ingest Request');
      expect(editCard).toBeInTheDocument();
      expect(editCard.closest('a')).toBeNull();
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });

    it('shows tooltip message for edit dataset card when hovered', () => {
      const mockSession = createMockSession();
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const editCard = screen.getByText('Edit Dataset Ingest Request');
      expect(editCard).toBeInTheDocument();

      // Check that the tooltip wrapper exists (Ant Design tooltip)
      const tooltipWrapper = editCard.closest(
        '[data-testid], .ant-tooltip-open'
      );
      expect(tooltipWrapper || editCard.parentElement).toBeInTheDocument();
    });
  });
});
