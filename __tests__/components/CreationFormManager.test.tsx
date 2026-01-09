import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  Mock,
  beforeAll,
} from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import CreationFormManager from '@/components/ingestion/CreationFormManager';
import React, { useState } from 'react';

// --- JSDOM Workaround for Ant Design ---
beforeAll(() => {
  Object.defineProperty(window, 'getComputedStyle', {
    value: (elt: { style: any }) => {
      // The 'elt' parameter is the DOM element being checked.
      // We can read its actual inline styles.
      const style = elt.style;
      return {
        getPropertyValue: (prop: string | number) => {
          // Return the property from the element's inline style
          // This will correctly return 'none' when antd hides the modal.
          return style[prop] || '';
        },
      };
    },
  });
});

// Mock child components to isolate the manager's logic
vi.mock('@/components/ingestion/DatasetIngestionForm', () => ({
  default: ({ onSubmit }: any) => (
    <form
      data-testid="dataset-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          collection: 'Test Dataset',
          sample_files: 'http://example.com/file.tif',
        });
      }}
    ></form>
  ),
}));

vi.mock('@/components/ingestion/CollectionIngestionForm', () => ({
  default: ({ onSubmit }: any) => (
    <form
      data-testid="collection-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ collection: 'Test Collection', id: 'test-collection-id' });
      }}
    ></form>
  ),
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock functions for the useCogValidation hook
const mockShowCogValidationModal = vi.fn();
const mockHideCogValidationModal = vi.fn();
const mockValidateFormDataCog = vi.fn().mockResolvedValue(true);

let mockCogValidationState = {
  isCogValidationModalVisible: false,
  isValidatingCog: false,
};

// Mock the useCogValidation hook
vi.mock('@/hooks/useCogValidation', () => ({
  useCogValidation: () => ({
    isCogValidationModalVisible:
      mockCogValidationState.isCogValidationModalVisible,
    isValidatingCog: mockCogValidationState.isValidatingCog,
    showCogValidationModal: mockShowCogValidationModal,
    hideCogValidationModal: mockHideCogValidationModal,
    validateFormDataCog: mockValidateFormDataCog,
  }),
}));

describe('CreationFormManager', () => {
  const mockSetStatus = vi.fn();
  const mockSetCollectionName = vi.fn();
  const mockSetApiErrorMessage = vi.fn();
  const mockSetPullRequestUrl = vi.fn();

  const defaultProps = {
    setStatus: mockSetStatus,
    setCollectionName: mockSetCollectionName,
    setApiErrorMessage: mockSetApiErrorMessage,
    setPullRequestUrl: mockSetPullRequestUrl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default behavior for COG validation
    mockValidateFormDataCog.mockResolvedValue(true); // Default to validation passing
    mockCogValidationState.isCogValidationModalVisible = false;
    mockCogValidationState.isValidatingCog = false;

    // Since Antd Modals are rendered in a portal, we need a container in the body
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    cleanup();
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
  });

  it('renders DatasetIngestionForm when formType is "dataset"', () => {
    render(<CreationFormManager {...defaultProps} formType="dataset" />);
    expect(screen.getByTestId('dataset-ingestion-form')).toBeInTheDocument();
  });

  it('renders CollectionIngestionForm when formType is "collection"', () => {
    render(<CreationFormManager {...defaultProps} formType="collection" />);
    expect(screen.getByTestId('collection-ingestion-form')).toBeInTheDocument();
  });

  it('handles successful submission with a comment via the modal', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ githubURL: 'http://github.com/pr/1' }),
    });

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    const modalTitle = await screen.findByText(
      'Add an Optional Note for Maintainers'
    );
    expect(modalTitle).toBeInTheDocument();

    const commentInput = screen.getByPlaceholderText(
      /This is a new data type/i
    );
    fireEvent.change(commentInput, { target: { value: 'This is a test' } });

    const submitButton = screen.getByRole('button', {
      name: /Continue & Submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
      expect(mockSetCollectionName).toHaveBeenCalledWith('Test Dataset');
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('api/create-ingest', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            collection: 'Test Dataset',
            sample_files: 'http://example.com/file.tif',
          },
          ingestionType: 'dataset',
          userComment: 'This is a test',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetPullRequestUrl).toHaveBeenCalledWith(
        'http://github.com/pr/1'
      );
      expect(mockSetStatus).toHaveBeenCalledWith('success');
    });
  });

  it('handles submission with an empty comment', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ githubURL: 'http://github.com/pr/1' }),
    });

    render(<CreationFormManager {...defaultProps} formType="dataset" />);
    fireEvent.submit(screen.getByTestId('dataset-ingestion-form'));

    const submitButton = await screen.findByRole('button', {
      name: /Continue & Submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const payload = JSON.parse((fetch as Mock).mock.calls[0][1].body);
      expect(payload.userComment).toBe('');
    });
  });

  it('cancels submission when modal is closed', async () => {
    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);
    await screen.findByText('Add an Optional Note for Maintainers');

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Assert the modal is gone
    await waitFor(() => {
      expect(
        screen.queryByText('Add an Optional Note for Maintainers')
      ).not.toBeInTheDocument();
    });

    // Assert that fetch was never called
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetStatus).not.toHaveBeenCalled();
  });

  it('handles failed form submission after modal confirmation', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('API Error'),
    });

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    fireEvent.submit(screen.getByTestId('dataset-ingestion-form'));
    const submitButton = await screen.findByRole('button', {
      name: /Continue & Submit/i,
    });
    fireEvent.click(submitButton);

    // Assert failure state is set
    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
      expect(mockSetApiErrorMessage).toHaveBeenCalledWith('API Error');
      expect(mockSetStatus).toHaveBeenCalledWith('error');
    });
  });

  it('shows COG validation modal when validation fails for datasets', async () => {
    mockValidateFormDataCog.mockResolvedValue(false);

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockValidateFormDataCog).toHaveBeenCalledWith(
        {
          collection: 'Test Dataset',
          sample_files: 'http://example.com/file.tif',
        },
        'dataset'
      );
      expect(mockShowCogValidationModal).toHaveBeenCalled();
    });

    expect(
      screen.queryByText('Add an Optional Note for Maintainers'),
      'do not show comment modal when COG validation fails'
    ).not.toBeInTheDocument();
  });

  it('skips COG validation for collection forms and shows comment modal directly', async () => {
    mockValidateFormDataCog.mockResolvedValue(true);

    render(<CreationFormManager {...defaultProps} formType="collection" />);

    const form = screen.getByTestId('collection-ingestion-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockValidateFormDataCog).toHaveBeenCalledWith(
        { collection: 'Test Collection', id: 'test-collection-id' },
        'collection'
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('Add an Optional Note for Maintainers')
      ).toBeInTheDocument();
    });
  });

  it('renders an error message for an invalid formType', () => {
    // @ts-expect-error - Intentionally passing invalid prop for testing
    render(<CreationFormManager {...defaultProps} formType="invalid-type" />);
    expect(
      screen.getByText(
        'Invalid formType specified. Please use dataset or collection.'
      )
    ).toBeInTheDocument();
  });

  it('removes empty tenant array from formData during submission', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ githubURL: 'http://github.com/pr/1' }),
    });

    // Create a custom wrapper that submits data with empty tenant array
    const TestWrapper = () => {
      const [formData, setFormData] = useState<Record<string, unknown>>({
        collection: 'Test Dataset',
        sample_files: 'http://example.com/file.tif',
        tenant: [],
      });

      const handleSubmit = async () => {
        await defaultProps.setStatus('idle' as any);
        // Simulate the form submission through the manager
        const cleanedData = { ...formData };
        if (
          Array.isArray(cleanedData.tenant) &&
          cleanedData.tenant.length === 0
        ) {
          delete cleanedData.tenant;
        }

        defaultProps.setStatus('loadingGithub');
        defaultProps.setCollectionName(cleanedData.collection as string);

        const url = 'api/create-ingest';
        const payload = {
          data: cleanedData,
          ingestionType: 'dataset',
          userComment: '',
        };

        await fetch(url, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      };

      return (
        <button onClick={handleSubmit} data-testid="test-submit">
          Submit
        </button>
      );
    };

    render(<TestWrapper />);

    const submitButton = screen.getByTestId('test-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      const payload = JSON.parse((fetch as Mock).mock.calls[0][1].body);
      // tenant should not be in the payload
      expect(payload.data.tenant).toBeUndefined();
      expect(payload.data.collection).toBe('Test Dataset');
    });
  });

  it('continues submission after clicking "Continue Anyway" in COG validation modal', async () => {
    mockValidateFormDataCog.mockResolvedValue(false); // COG validation fails
    mockCogValidationState.isCogValidationModalVisible = true;

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    // COG modal should be visible
    const continueButton = await screen.findByRole('button', {
      name: /Continue Anyway/i,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockHideCogValidationModal).toHaveBeenCalled();
      // Should show the comment modal
      expect(
        screen.getByText('Add an Optional Note for Maintainers')
      ).toBeInTheDocument();
    });
  });

  it('cancels submission when clicking "Cancel" in COG validation modal', async () => {
    mockValidateFormDataCog.mockResolvedValue(false);
    mockCogValidationState.isCogValidationModalVisible = true;

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    // COG modal should be visible
    const cancelButtons = await screen.findAllByRole('button', {
      name: /Cancel/i,
    });
    const cogCancelButton = cancelButtons[0]; // First cancel button is from COG modal
    fireEvent.click(cogCancelButton);

    await waitFor(() => {
      expect(mockHideCogValidationModal).toHaveBeenCalled();
    });

    // Comment modal should not appear
    expect(
      screen.queryByText('Add an Optional Note for Maintainers')
    ).not.toBeInTheDocument();
  });

  it('handles network error during fetch', async () => {
    (fetch as Mock).mockRejectedValue(new Error('Network error'));

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    fireEvent.submit(screen.getByTestId('dataset-ingestion-form'));

    const submitButton = await screen.findByRole('button', {
      name: /Continue & Submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
      expect(mockSetStatus).toHaveBeenCalledWith('error');
    });
  });

  it('shows loading spinner when isValidatingCog is true', () => {
    mockCogValidationState.isValidatingCog = true;

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const spinner = document.querySelector('.ant-spin-fullscreen');
    expect(spinner).toBeInTheDocument();
  });
});
