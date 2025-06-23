import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import CreationFormManager from '@/components/CreationFormManager';
import React from 'react';

// Mock child components to isolate the manager's logic
vi.mock('@/components/DatasetIngestionForm', () => ({
  default: ({ onSubmit, children }: any) => (
    <form
      data-testid="dataset-ingestion-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ collection: 'Test Dataset' });
      }}
    >
      <button onClick={() => onSubmit(undefined)}>Submit No Data</button>
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
        onSubmit({ collection: 'Test Collection', id: 'test-collection-id' });
      }}
    >
      {children}
    </form>
  ),
}));

// Mock global fetch
global.fetch = vi.fn();

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
  });

  afterEach(() => {
    cleanup();
  });

  it('renders DatasetIngestionForm when formType is "dataset"', () => {
    render(<CreationFormManager {...defaultProps} formType="dataset" />);
    expect(screen.getByTestId('dataset-ingestion-form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('collection-ingestion-form')
    ).not.toBeInTheDocument();
  });

  it('renders CollectionIngestionForm when formType is "collection"', () => {
    render(<CreationFormManager {...defaultProps} formType="collection" />);
    expect(screen.getByTestId('collection-ingestion-form')).toBeInTheDocument();
    expect(
      screen.queryByTestId('dataset-ingestion-form')
    ).not.toBeInTheDocument();
  });

  it('handles successful dataset form submission', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ githubURL: 'http://github.com/pr/1' }),
    });

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
      expect(mockSetCollectionName).toHaveBeenCalledWith('Test Dataset');
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('api/create-dataset', {
        method: 'POST',
        body: JSON.stringify({
          data: { collection: 'Test Dataset' },
          ingestionType: 'dataset',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetPullRequestUrl).toHaveBeenCalledWith(
        'http://github.com/pr/1'
      );
      expect(mockSetStatus).toHaveBeenCalledWith('success');
    });
  });

  it('handles successful collection form submission', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ githubURL: 'http://github.com/pr/2' }),
    });

    render(<CreationFormManager {...defaultProps} formType="collection" />);
    const form = screen.getByTestId('collection-ingestion-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
      expect(mockSetCollectionName).toHaveBeenCalledWith('Test Collection');
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('api/create-dataset', {
        method: 'POST',
        body: JSON.stringify({
          data: { collection: 'Test Collection', id: 'test-collection-id' },
          ingestionType: 'collection',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockSetPullRequestUrl).toHaveBeenCalledWith(
        'http://github.com/pr/2'
      );
      expect(mockSetStatus).toHaveBeenCalledWith('success');
    });
  });

  it('handles failed form submission', async () => {
    (fetch as Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('API Error'),
    });

    render(<CreationFormManager {...defaultProps} formType="dataset" />);

    const form = screen.getByTestId('dataset-ingestion-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSetStatus).toHaveBeenCalledWith('loadingGithub');
    });

    await waitFor(() => {
      expect(mockSetApiErrorMessage).toHaveBeenCalledWith('API Error');
      expect(mockSetStatus).toHaveBeenCalledWith('error');
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
});
