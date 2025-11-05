import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditCollectionView from '@/components/ingestion/EditCollectionView';
import React from 'react';

vi.mock('@/components/ingestion/EditFormManager', () => ({
  default: ({ formType, formData, handleCancel }: any) => (
    <div data-testid="edit-form-manager">
      <div data-testid="form-type">{formType}</div>
      <div data-testid="form-data">{JSON.stringify(formData)}</div>
      <button onClick={handleCancel} data-testid="cancel-button">
        Cancel
      </button>
    </div>
  ),
}));

describe('EditCollectionView', () => {
  const mockOnComplete = vi.fn();
  const mockCollectionData = {
    id: 'test-collection',
    title: 'Test Collection',
    description: 'A test collection',
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should display loading spinner when collectionData is not provided', () => {
    render(
      <EditCollectionView
        collectionData={undefined}
        onComplete={mockOnComplete}
      />
    );

    const spinner = document.querySelector('.ant-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display error alert when collectionData is empty object', async () => {
    render(
      <EditCollectionView collectionData={{}} onComplete={mockOnComplete} />
    );

    await waitFor(() => {
      expect(screen.getByText('No collection data found.')).toBeInTheDocument();
    });
  });

  it('should render EditFormManager with correct props when collectionData is provided', () => {
    render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('edit-form-manager')).toBeInTheDocument();
    expect(screen.getByTestId('form-type')).toHaveTextContent(
      'existingCollection'
    );
    expect(screen.getByTestId('form-data')).toHaveTextContent(
      JSON.stringify(mockCollectionData)
    );
  });

  it('should render Back button with correct aria-label', () => {
    render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    const backButton = screen.getByLabelText('Back to collection list');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveTextContent('Back');
  });

  it('should call onComplete when Back button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    const backButton = screen.getByLabelText('Back to collection list');
    await user.click(backButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete when EditFormManager cancel is triggered', async () => {
    const user = userEvent.setup();

    render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('should update formData when collectionData prop changes', async () => {
    const { rerender } = render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('form-data')).toHaveTextContent(
      JSON.stringify(mockCollectionData)
    );

    const updatedCollectionData = {
      id: 'updated-collection',
      title: 'Updated Collection',
      description: 'An updated collection',
    };

    rerender(
      <EditCollectionView
        collectionData={updatedCollectionData}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('form-data')).toHaveTextContent(
        JSON.stringify(updatedCollectionData)
      );
    });
  });

  it('should show loading state when collectionData changes to undefined', async () => {
    const { rerender } = render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('edit-form-manager')).toBeInTheDocument();

    rerender(
      <EditCollectionView
        collectionData={undefined}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      const spinner = document.querySelector('.ant-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should have proper styling on Back button', () => {
    render(
      <EditCollectionView
        collectionData={mockCollectionData}
        onComplete={mockOnComplete}
      />
    );

    const backButton = screen.getByLabelText('Back to collection list');
    expect(backButton).toHaveStyle({ marginBottom: '16px' });
  });
});
