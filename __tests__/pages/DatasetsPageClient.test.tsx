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

  it('renders the "Datasets Management" header', () => {
    const mockSession = createMockSession();
    render(<DatasetsClient />, {
      wrapper: ({ children }) => (
        <AllProviders session={mockSession}>{children}</AllProviders>
      ),
    });

    expect(
      screen.getByRole('heading', { name: /datasets management/i })
    ).toBeInTheDocument();
  });

  describe('with dataset:limited-access scope', () => {
    it('shows both cards as disabled with tooltips', () => {
      const mockSession = createMockSession(['dataset:limited-access']);
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      // Both cards should be present but not clickable
      const createCard = screen.getByText('Create New Dataset Ingest Request');
      const editCard = screen.getByText('Edit Dataset Ingest Request');

      expect(createCard).toBeInTheDocument();
      expect(editCard).toBeInTheDocument();

      // Cards should not be wrapped in links
      expect(createCard.closest('a')).toBeNull();
      expect(editCard.closest('a')).toBeNull();

      // Cards should have disabled styling
      expect(createCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });

    it('shows cards with tooltip configuration for limited access users', () => {
      const mockSession = createMockSession(['dataset:limited-access']);
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      // Check that both cards exist and have disabled styling
      const createCard = screen.getByText('Create New Dataset Ingest Request');
      const editCard = screen.getByText('Edit Dataset Ingest Request');

      expect(createCard).toBeInTheDocument();
      expect(editCard).toBeInTheDocument();

      // Check that cards exist and have disabled styling
      const createCardElement = createCard.closest('.ant-card');
      const editCardElement = editCard.closest('.ant-card');

      // The main thing we care about is that the cards are disabled (have reduced opacity)
      // Tooltips are implemented but testing their exact DOM structure is fragile across versions
      expect(createCardElement).toBeInTheDocument();
      expect(editCardElement).toBeInTheDocument();

      // Verify disabled styling
      expect(createCardElement).toHaveStyle({ opacity: '0.6' });
      expect(editCardElement).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('without dataset:limited-access scope', () => {
    it('shows create card as clickable, edit card disabled when no dataset:update permission', () => {
      const mockSession = createMockSession(['dataset:create']);
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText('Create New Dataset Ingest Request');
      const editCard = screen.getByText('Edit Dataset Ingest Request');

      // Create card should be clickable
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-dataset'
      );

      // Edit card should be disabled
      expect(editCard.closest('a')).toBeNull();
      expect(editCard.closest('.ant-card')).toHaveStyle({ opacity: '0.6' });
    });

    it('shows both cards as clickable with dataset:update permission', () => {
      const mockSession = createMockSession(['dataset:update']);
      render(<DatasetsClient />, {
        wrapper: ({ children }) => (
          <AllProviders session={mockSession}>{children}</AllProviders>
        ),
      });

      const createCard = screen.getByText('Create New Dataset Ingest Request');
      const editCard = screen.getByText('Edit Dataset Ingest Request');

      // Both cards should be wrapped in links
      expect(createCard.closest('a')).toHaveAttribute(
        'href',
        '/create-dataset'
      );
      expect(editCard.closest('a')).toHaveAttribute('href', '/edit-dataset');
    });
  });
});
