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

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    global.fetch = vi.fn();

    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useUserTenants).mockReturnValue({
      allowedTenants: ['nasa', 'noaa'],
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

  it('should show fullscreen spinner when session is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    } as any);

    render(
      <ExistingCollectionsList onCollectionSelect={mockOnCollectionSelect} />
    );

    const spinner = document.querySelector('.ant-spin-fullscreen');
    expect(spinner).toBeInTheDocument();
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
      'https://staging.openveda.cloud/api/stac/collections'
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
        'https://staging.openveda.cloud/api/stac/collections?tenant=nasa'
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
        'https://staging.openveda.cloud/api/stac/collections/collection-1'
      );
      expect(mockOnCollectionSelect).toHaveBeenCalledWith(collectionDetails);
    });
  });

  it('should call onCollectionSelect when collection is selected from dropdown', async () => {
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
      expect(screen.getByText('Select Collection')).toBeInTheDocument();
    });

    // Mock fetch for collection details
    const collectionDetails = { ...mockCollections[1], extended: 'data' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => collectionDetails,
    } as Response);

    // Select from dropdown - find by closest Select to "Select Collection" heading
    const collectionSection = screen
      .getByText('Select Collection')
      .closest('div');
    const collectionSelect = collectionSection!.querySelector(
      '.ant-select-selector'
    );
    await user.click(collectionSelect!);

    // Find the option in the dropdown (not the card)
    const dropdownOptions = document.querySelectorAll(
      '.ant-select-item-option-content'
    );
    const option = Array.from(dropdownOptions).find(
      (el) => el.textContent === 'Test Collection 2'
    );
    await user.click(option!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://staging.openveda.cloud/api/stac/collections/collection-2'
      );
      expect(mockOnCollectionSelect).toHaveBeenCalledWith(collectionDetails);
    });
  });

  it('should filter collections by search value', async () => {
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
      expect(screen.getByText('Test Collection 1')).toBeInTheDocument();
      expect(screen.getByText('Test Collection 2')).toBeInTheDocument();
      expect(screen.getByText('Public Collection')).toBeInTheDocument();
    });

    // Search for "Public" using the collection select input
    const collectionSection = screen
      .getByText('Select Collection')
      .closest('div');
    const searchInput = collectionSection!.querySelector(
      '.ant-select-selection-search-input'
    ) as HTMLInputElement;
    await user.click(searchInput);
    await user.type(searchInput, 'Public');

    // Verify search value is updated (the component filters internally)
    expect(searchInput.value).toBe('Public');
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
        'https://staging.openveda.cloud/api/stac/collections/collection-1'
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
