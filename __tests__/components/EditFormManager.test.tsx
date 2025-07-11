import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditFormManager from '@/components/EditFormManager';
import React from 'react';

// Mock child components to isolate the manager's logic
vi.mock('@/components/DatasetIngestionForm', () => ({
  default: ({ onSubmit, children, setDisabled }: any) => (
    <form
      data-testid="dataset-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ mockData: 'dataset' });
      }}
    >
      <button onClick={() => setDisabled(false)}>Enable Submit</button>
      {children}
    </form>
  ),
}));

vi.mock('@/components/CollectionIngestionForm', () => ({
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

  beforeEach(() => {
    vi.clearAllMocks();
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
          formData: { mockData: 'dataset' },
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

  it('renders an error message for an invalid formType', () => {
    // @ts-expect-error - Intentionally passing invalid prop for testing
    render(<EditFormManager {...defaultProps} formType="invalid-type" />);

    expect(
      screen.getByText(
        'Invalid formType specified. Please use dataset or collection.'
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
