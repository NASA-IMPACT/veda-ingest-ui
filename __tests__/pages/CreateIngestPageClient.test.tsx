import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateIngestClient from '@/app/create-dataset/_components/CreateIngestClient';

import { TenantContext } from '@/app/contexts/TenantContext';
import { SessionProvider } from 'next-auth/react';

vi.mock('@/components/layout/AppLayout', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

const AllProviders = ({ children }: { children: ReactNode }) => {
  const mockSession = {
    expires: '1',
  };

  const mockTenantContext = {
    allowedTenants: ['test-tenant-1', 'test-tenant-2'],
    isLoading: false,
  };

  return (
    <SessionProvider session={mockSession}>
      <TenantContext.Provider value={mockTenantContext}>
        {children}
      </TenantContext.Provider>
    </SessionProvider>
  );
};

describe('CreateIngestClient Component', () => {
  it('renders the app layout', () => {
    render(<CreateIngestClient />, { wrapper: AllProviders });

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the label "Collection Name"', async () => {
    render(<CreateIngestClient />, { wrapper: AllProviders });

    const collectionLabel = await screen.findByLabelText(
      /collection/i,
      {},
      { timeout: 5000 }
    );
    expect(collectionLabel).toBeInTheDocument();
  });
});
