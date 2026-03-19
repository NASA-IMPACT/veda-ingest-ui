import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExistingCollectionsList from '@/components/ingestion/ExistingCollectionsList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUserTenants } from '@/app/contexts/TenantContext';

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('next/navigation');
vi.mock('@/app/contexts/TenantContext');
vi.mock('@/utils/truncateWords', () => ({
  truncateWords: (text: string | undefined, maxWords: number) =>
    text ? text.split(' ').slice(0, maxWords).join(' ') : '',
}));
vi.mock('@/components/ui/ErrorModal', () => ({
  default: ({ collectionName, apiErrorMessage }: any) => (
    <div data-testid="error-modal">
      <div data-testid="error-collection-name">{collectionName}</div>
      <div data-testid="error-message">{apiErrorMessage}</div>
    </div>
  ),
}));

describe('ExistingCollectionsList', () => {
  const mockOnCollectionSelect = vi.fn();
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const PAGE_SIZE = 10;

  const mockCollections = [
    {
      id: 'collection-1',
      title: 'Test Collection 1',
      description: 'This is a test collection with a description',
      tenant: 'nasa',
    },
    {
      id: 'collection-2',
      title: 'Test Collection 2',
      description: 'Another test collection',
      tenant: 'noaa',
    },
    {
      id: 'collection-3',
      title: 'Public Collection',
      description: 'A public collection without tenant',
    },
  ];

  const createCollections = (count: number, startIndex = 1) =>
    Array.from({ length: count }, (_, index) => ({
      id: `collection-${startIndex + index}`,
      title: `Test Collection ${startIndex + index}`,
      description: `Description ${startIndex + index}`,
      tenant: 'nasa',
    }));

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    global.fetch = vi.fn();

    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useUserTenants).mockReturnValue({
      tenants: ['nasa', 'noaa'],
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
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
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
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    expect(
      screen.getByText('Loading existing collections from database...')
    ).toBeInTheDocument();
  });

  it('should fetch and display collections when authenticated', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Existing Collection')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
      expect(screen.getByText('Test Collection 2')).toBeInTheDocument();
      expect(screen.getByText('Public Collection')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/existing-collection?limit=10&offset=0'
    );
  });

  it('should display tenant information in cards', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Tenant: nasa')).toBeInTheDocument();
      expect(screen.getByText('Tenant: noaa')).toBeInTheDocument();
    });
  });

  it('should display error modal when API fetch fails', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const errorMessage = 'something went wrong';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      text: async () => errorMessage,
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      expect(screen.getByTestId('error-collection-name')).toHaveTextContent('');
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        errorMessage
      );
    });
  });

  it('should filter collections by tenant when tenant is selected', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    // Initial fetch without tenant filter
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Tenant')).toBeInTheDocument();
    });

    // Mock second fetch with tenant filter
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        collections: [mockCollections[0]], // Only nasa collection
      }),
    } as Response);

    // Select nasa tenant - find by closest Select to "Select Tenant" heading
    const tenantSection = screen.getByText('Select Tenant').closest('div');
    const tenantSelect = tenantSection!.querySelector('.ant-select-selector');
    await user.click(tenantSelect!);

    // Find nasa option in the dropdown (not in cards)
    const dropdownOptions = document.querySelectorAll(
      '.ant-select-item-option-content'
    );
    const nasaOption = Array.from(dropdownOptions).find(
      (el) => el.textContent === 'nasa'
    );
    await user.click(nasaOption!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection?limit=10&offset=0&tenant=nasa'
      );
    });
  });

  it('should call onCollectionSelect when a card is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    });

    // Mock fetch for collection details
    const collectionDetails = { ...mockCollections[0], extended: 'data' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => collectionDetails,
    } as Response);

    // Click on the first card
    const card = screen.getByText('Test Collection 1').closest('.ant-card');
    await user.click(card!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection/collection-1'
      );
      expect(mockOnCollectionSelect).toHaveBeenCalledWith(collectionDetails);
    });
  });

  it('should search collections when entering a query', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Search Collections')).toBeInTheDocument();
    });

    // Mock search fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [mockCollections[2]] }),
    } as Response);

    const searchInput = screen.getByPlaceholderText(
      'Free-text queries against STAC metadata'
    );
    await user.type(searchInput, 'Public');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection?limit=10&offset=0&q=Public'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Public Collection')).toBeInTheDocument();
    });
  });

  it('should paginate collections with limit and offset', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const firstPageCollections = createCollections(PAGE_SIZE, 1);
    const secondPageCollections = createCollections(PAGE_SIZE, 11);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: firstPageCollections }),
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: secondPageCollections }),
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: firstPageCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection?limit=10&offset=10'
      );
      expect(screen.getByText('Test Collection 11')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection?limit=10&offset=0'
      );
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    });
  });

  it('should show empty state when no collections are found', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('No collections found')).toBeInTheDocument();
    });
  });

  it('should display all tenant options including Public', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Tenant')).toBeInTheDocument();
    });

    const tenantSection = screen.getByText('Select Tenant').closest('div');
    const tenantSelect = tenantSection!.querySelector('.ant-select-selector');
    await user.click(tenantSelect!);

    await waitFor(() => {
      expect(screen.getByText('All Tenants')).toBeInTheDocument();
      // Find Public in the dropdown options
      const publicOption = screen
        .getAllByText('Public')
        .find((el) => el.classList.contains('ant-select-item-option-content'));
      expect(publicOption).toBeInTheDocument();
    });
  });

  it('should render only one Public option when user tenants include public variants', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(useUserTenants).mockReturnValue({
      tenants: ['nasa', 'public', 'Public'],
      isLoading: false,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Tenant')).toBeInTheDocument();
    });

    const tenantSection = screen.getByText('Select Tenant').closest('div');
    const tenantSelect = tenantSection!.querySelector('.ant-select-selector');
    await user.click(tenantSelect!);

    await waitFor(() => {
      const publicOptions = Array.from(
        document.querySelectorAll('.ant-select-item-option-content')
      ).filter((el) => el.textContent === 'Public');
      expect(publicOptions).toHaveLength(1);
    });
  });

  it('should truncate long descriptions in cards', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const longDescriptionCollection = {
      id: 'long-desc',
      title: 'Long Description Collection',
      description:
        'This is a very long description that should be truncated to only show the first twenty words and not show the rest of the content',
      tenant: 'nasa',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [longDescriptionCollection] }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      // The mock truncates to 20 words
      const truncatedText = screen.getByText(
        /This is a very long description that should be truncated to only show the first twenty words and not show/
      );
      expect(truncatedText).toBeInTheDocument();
    });
  });

  it('should handle collection selection error gracefully', async () => {
    const user = userEvent.setup();

    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    // Initial fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: mockCollections }),
    } as Response);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
    });

    // Mock fetch failure for collection details
    const errorMessage = 'Collection not found';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      text: async () => errorMessage,
    } as Response);

    // Click on the first card
    const card = screen.getByText('Test Collection 1').closest('.ant-card');
    await user.click(card!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/existing-collection/collection-1'
      );
    });

    // Should not call onCollectionSelect on error
    expect(mockOnCollectionSelect).not.toHaveBeenCalled();

    // Should display error in ErrorModal
    await waitFor(() => {
      expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        errorMessage
      );
    });
  });
});
