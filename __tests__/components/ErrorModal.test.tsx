import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ErrorModal from '@/components/ui/ErrorModal';
import { ModalProps } from 'antd';

// Mock Ant Design's Modal
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  // The mock renders children and buttons that trigger the callback props
  const MockModal = ({
    children,
    open,
    title,
    onOk,
    onCancel,
    okText,
  }: ModalProps) => {
    if (!open) return null;
    return (
      <div data-testid="mock-modal">
        <h1>{title}</h1>
        <div>{children}</div>
        <button onClick={onOk} data-testid="ok-button">
          {okText || 'OK'}
        </button>
        <button onClick={onCancel} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    );
  };
  return {
    ...antd,
    Modal: MockModal,
  };
});

describe('ErrorModal Component', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders "Collection Name Exists" modal when API error contains "Reference already exists"', () => {
    const props = {
      collectionName: 'Test Collection',
      apiErrorMessage: 'Reference already exists',
    };

    render(<ErrorModal {...props} />);

    // Check modal content
    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Collection Name Exists')).toBeInTheDocument();
    expect(
      screen.getByText(/A branch with the collection name/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Test Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/already exists\./i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please try another collection name or delete the feature branch\./i
      )
    ).toBeInTheDocument();
  });

  it('renders "Invalid JSON File" modal when API error matches GitHub file format error', () => {
    const props = {
      collectionName: 'Test Collection',
      apiErrorMessage: 'Invalid JSON format in GitHub file: test-config.json',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Invalid JSON File')).toBeInTheDocument();
    expect(screen.getByText(/The GitHub file/i)).toBeInTheDocument();
    expect(screen.getByText(/test-config\.json/i)).toBeInTheDocument();
    expect(screen.getByText(/appears to be invalid\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please check that the file is a valid JSON/i)
    ).toBeInTheDocument();
    expect(screen.getByText('collection')).toBeInTheDocument();
    expect(screen.getByText(/key as a string\./i)).toBeInTheDocument();
  });

  it('renders generic error modal when API error message does not include "Reference already exists"', () => {
    const props = {
      collectionName: 'Test Collection',
      apiErrorMessage: 'Unexpected error',
    };

    render(<ErrorModal {...props} />);

    // Check modal content
    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Something went wrong with updating Test Collection\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();
  });

  it('renders generic error modal when no API error message is provided', () => {
    const props = {
      collectionName: 'Test Collection',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Something went wrong with updating Test Collection\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();
  });

  it('renders generic error modal with fallback message when collectionName is empty', () => {
    const props = {
      collectionName: '',
      apiErrorMessage: 'Some other error',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();

    expect(screen.queryByText(/with updating/i)).not.toBeInTheDocument();
  });

  it('renders contextual error modal for collections fetch', () => {
    const props = {
      context: 'collections-fetch' as const,
      apiErrorMessage: 'Network error',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Failed to Load Collections')).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to fetch the list of collections/i)
    ).toBeInTheDocument();
  });

  it('renders contextual error modal for ingests fetch', () => {
    const props = {
      context: 'ingests-fetch' as const,
      apiErrorMessage: 'Network error',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(
      screen.getByText('Failed to Load Pending Ingests')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to fetch pending ingest requests/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();
  });

  it('renders contextual error modal for collection selection', () => {
    const props = {
      context: 'collection-select' as const,
      apiErrorMessage: 'Access denied',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Collection Access Error')).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to access the selected collection/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();
  });

  it('closes modal when OK button is clicked', () => {
    const props = {
      collectionName: 'Test Collection',
      apiErrorMessage: 'Some error',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();

    const okButton = screen.getByTestId('ok-button');
    fireEvent.click(okButton);

    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('closes modal when Cancel button is clicked', () => {
    const props = {
      collectionName: 'Test Collection',
      apiErrorMessage: 'Some error',
    };

    render(<ErrorModal {...props} />);

    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });
});
