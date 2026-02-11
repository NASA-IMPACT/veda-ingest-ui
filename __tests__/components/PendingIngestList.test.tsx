import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingIngestList } from '@/components/ingestion/PendingIngestList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserTenants } from '@/app/contexts/TenantContext';

vi.mock('next-auth/react');
vi.mock('next/navigation');
vi.mock('@/app/contexts/TenantContext');
vi.mock('@/components/ui/ErrorModal', () => ({
  default: ({ context, apiErrorMessage }: any) => (
    <div data-testid="error-modal">
      <div data-testid="error-context">{context}</div>
      <div data-testid="error-message">{apiErrorMessage}</div>
    </div>
  ),
}));

describe('PendingIngestList', () => {
  const mockOnIngestSelect = vi.fn();
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  const mockIngests = [
    {
      pr: {
        title: 'Ingest Request for tenant1 Dataset',
        head: { ref: 'refs/heads/tenant1-dataset' },
      },
      tenant: 'tenant1',
    },
    {
      pr: {
        title: 'Ingest Request for tenant2 Dataset',
        head: { ref: 'refs/heads/tenant2-dataset' },
      },
      tenant: 'tenant2',
    },
    {
      pr: {
        title: 'Ingest Request for Public Dataset',
        head: { ref: 'refs/heads/public-dataset' },
      },
      tenant: undefined,
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    global.fetch = vi.fn();

    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useUserTenants).mockReturnValue({
      allowedTenants: ['tenant1', 'tenant2'],
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redirect to login when session is unauthenticated', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as any);

    render(
      <PendingIngestList
        ingestionType="collection"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should show skeleton loading when session is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    } as any);

    render(
      <PendingIngestList
        ingestionType="collection"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    expect(
      screen.getByText('Checking with GitHub for pending ingests...')
    ).toBeInTheDocument();
  });

  it('should fetch and render tenant and public columns', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ githubResponse: mockIngests }),
    } as Response);

    render(
      <PendingIngestList
        ingestionType="collection"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'api/list-ingests?ingestionType=collection'
      );
    });

    expect(screen.getByTestId('tenant-column-tenant1')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-column-tenant2')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-column-public')).toBeInTheDocument();
    expect(screen.getByText('tenant1 Dataset')).toBeInTheDocument();
    expect(screen.getByText('tenant2 Dataset')).toBeInTheDocument();
    expect(screen.getByText('Public Dataset')).toBeInTheDocument();
  });

  it('should not render public column when no public ingests exist', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        githubResponse: [mockIngests[0], mockIngests[1]],
      }),
    } as Response);

    render(
      <PendingIngestList
        ingestionType="dataset"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'api/list-ingests?ingestionType=dataset'
      );
    });

    expect(
      screen.queryByTestId('tenant-column-public')
    ).not.toBeInTheDocument();
  });

  it('should display error modal when API fetch fails', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const errorMessage = 'Failed to fetch pending ingests';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      text: async () => errorMessage,
    } as Response);

    render(
      <PendingIngestList
        ingestionType="collection"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      expect(screen.getByTestId('error-context')).toHaveTextContent(
        'ingests-fetch'
      );
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        errorMessage
      );
    });
  });

  it('should call onIngestSelect when ingest is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ githubResponse: mockIngests }),
    } as Response);

    render(
      <PendingIngestList
        ingestionType="collection"
        onIngestSelect={mockOnIngestSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('tenant1 Dataset')).toBeInTheDocument();
    });

    await user.click(screen.getByText('tenant1 Dataset'));

    expect(mockOnIngestSelect).toHaveBeenCalledWith(
      'refs/heads/tenant1-dataset',
      'Ingest Request for tenant1 Dataset'
    );
  });
});
