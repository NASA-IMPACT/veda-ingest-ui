import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  Mock,
  afterAll,
  beforeAll,
} from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditFormManager from '@/components/ingestion/EditFormManager';
import React from 'react';

// Mock child components to isolate the manager's logic
vi.mock('@/components/ingestion/DatasetIngestionForm', () => ({
  default: ({ onSubmit, children, setDisabled }: any) => (
    <form
      data-testid="dataset-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          mockData: 'dataset',
          sample_files: 'http://example.com/file.tif',
        });
      }}
    >
      <button onClick={() => setDisabled(false)}>Enable Submit</button>
      {children}
    </form>
  ),
}));

vi.mock('@/components/ingestion/CollectionIngestionForm', () => ({
  default: ({ onSubmit, children }: any) => (
    <form
      data-testid="collection-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ mockData: 'collection' });
      }}
    >
      {children}
    </form>
  ),
}));

// Mock global fetch
global.fetch = vi.fn();

// Create shared mock functions for the useCogValidation hook
const mockShowCogValidationModal = vi.fn();
const mockHideCogValidationModal = vi.fn();
const mockValidateFormDataCog = vi.fn();

// Mock the useCogValidation hook
vi.mock('@/hooks/useCogValidation', () => ({
  useCogValidation: () => ({
    isCogValidationModalVisible: false,
    isValidatingCog: false,
    showCogValidationModal: mockShowCogValidationModal,
    hideCogValidationModal: mockHideCogValidationModal,
    validateFormDataCog: mockValidateFormDataCog,
  }),
}));

describe('EditFormManager', () => {
  const mockSetStatus = vi.fn();
  const mockSetApiErrorMessage = vi.fn();
  const mockSetFormData = vi.fn();
  const mockHandleCancel = vi.fn();

  const defaultProps = {
    gitRef: 'main',
    filePath: 'path/to/file.json',
    fileSha: '12345abcdef',
    formData: { initial: 'data' },
    setFormData: mockSetFormData,
    setStatus: mockSetStatus,
    setApiErrorMessage: mockSetApiErrorMessage,
    handleCancel: mockHandleCancel,
  };

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateFormDataCog.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders DatasetIngestionForm when formType is "dataset"', () => {
    render(<EditFormManager {...defaultProps} formType="dataset" />);
    expect(screen.getByTestId('dataset-ingestion-form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('collection-ingestion-form')
    ).not.toBeInTheDocument();
  });

  it('renders CollectionIngestionForm when formType is "collection"', () => {
    render(<EditFormManager {...defaultProps} formType="collection" />);
    expect(screen.getByTestId('collection-ingestion-form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('dataset-ingestion-form')
    ).not.toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    const form = screen.getByTestId('dataset-ingestion-form');

    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('api/create-ingest', {
        method: 'PUT',
        body: JSON.stringify({
          gitRef: defaultProps.gitRef,
          fileSha: defaultProps.fileSha,
          filePath: defaultProps.filePath,
          formData: {
            mockData: 'dataset',
            sample_files: 'http://example.com/file.tif',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetStatus).toHaveBeenCalledWith('success');
      expect(mockSetFormData).toHaveBeenCalledWith({});
    });
  });

  it('handles failed form submission', async () => {
    const errorResponse = 'API Error: Something went wrong';
    (fetch as Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(errorResponse),
    });

    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
    });

    await waitFor(() => {
      expect(mockSetApiErrorMessage).toHaveBeenCalledWith(errorResponse);
      expect(mockSetStatus).toHaveBeenCalledWith('error');
    });
  });

  it('handles fetch catch block error', async () => {
    const catchError = new Error('Network failure');
    (fetch as Mock).mockRejectedValue(catchError);

    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
    });

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('error');
    });
  });

  it('calls handleCancel when cancel button is clicked', async () => {
    render(<EditFormManager {...defaultProps} formType="dataset" />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  it('enables the submit button when the child form calls setDisabled(false)', async () => {
    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();

    const enableButton = screen.getByRole('button', { name: 'Enable Submit' });
    await userEvent.click(enableButton);

    expect(submitButton).not.toBeDisabled();
  });

  it('shows COG validation modal when validation fails for datasets', async () => {
    // Set up mock to fail validation
    mockValidateFormDataCog.mockResolvedValue(false);

    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockValidateFormDataCog).toHaveBeenCalledWith(
        { mockData: 'dataset', sample_files: 'http://example.com/file.tif' },
        'dataset'
      );
      expect(mockShowCogValidationModal).toHaveBeenCalled();
    });

    // Should NOT proceed with API submission when COG validation fails
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetStatus).not.toHaveBeenCalledWith('loadingGithub');
  });

  it('proceeds with submission when COG validation passes', async () => {
    // Set up mock to pass validation
    mockValidateFormDataCog.mockResolvedValue(true);

    (fetch as Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockValidateFormDataCog).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('api/create-ingest', {
        method: 'PUT',
        body: JSON.stringify({
          gitRef: defaultProps.gitRef,
          fileSha: defaultProps.fileSha,
          filePath: defaultProps.filePath,
          formData: {
            mockData: 'dataset',
            sample_files: 'http://example.com/file.tif',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetStatus).toHaveBeenCalledWith('success');
    });
  });

  it('cancels submission when diff modal is cancelled', async () => {
    render(<EditFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Cancel the diff modal
    const cancelButton = screen.getAllByRole('button', { name: 'Cancel' })[0];
    await userEvent.click(cancelButton);

    // Should not proceed with validation or submission
    expect(mockValidateFormDataCog).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetStatus).not.toHaveBeenCalledWith('loadingGithub');
  });

  it('renders CollectionIngestionForm when formType is "existingCollection"', () => {
    render(<EditFormManager {...defaultProps} formType="existingCollection" />);
    expect(screen.getByTestId('collection-ingestion-form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('dataset-ingestion-form')
    ).not.toBeInTheDocument();
  });

  it('uses correct API endpoint for existingCollection formType', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    render(<EditFormManager {...defaultProps} formType="existingCollection" />);

    const form = screen.getByTestId('collection-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
    });

    await waitFor(() => {
      // Should use /api/existing-collection endpoint instead of api/create-ingest
      expect(fetch).toHaveBeenCalledWith('/api/existing-collection', {
        method: 'PUT',
        body: JSON.stringify({
          formData: { mockData: 'collection' },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetStatus).toHaveBeenCalledWith('success');
      expect(mockSetFormData).toHaveBeenCalledWith({});
    });
  });

  it('does not include gitRef, fileSha, or filePath for existingCollection', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    render(<EditFormManager {...defaultProps} formType="existingCollection" />);

    const form = screen.getByTestId('collection-ingestion-form');
    fireEvent.submit(form);

    // Should show diff modal first
    await waitFor(() => {
      expect(screen.getByText('Review Changes')).toBeInTheDocument();
    });

    // Confirm the changes in the diff modal
    const confirmButton = screen.getByRole('button', {
      name: 'Confirm Changes',
    });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Verify the request body does NOT include gitRef, fileSha, or filePath
    const fetchCall = (fetch as Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody).not.toHaveProperty('gitRef');
    expect(requestBody).not.toHaveProperty('fileSha');
    expect(requestBody).not.toHaveProperty('filePath');
    expect(requestBody).toHaveProperty('formData');
  });

  it('renders an error message for an invalid formType', () => {
    // @ts-expect-error - Intentionally passing invalid prop for testing
    render(<EditFormManager {...defaultProps} formType="invalid-type" />);

    expect(
      screen.getByText(
        'Invalid formType specified. Please use dataset, collection, or existingCollection.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('dataset-ingestion-form')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('collection-ingestion-form')
    ).not.toBeInTheDocument();
  });
});
