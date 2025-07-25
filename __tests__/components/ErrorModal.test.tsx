import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ErrorModal from '@/components/ErrorModal';
import { ModalProps } from 'antd';

// Mock Ant Design's Modal
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  // The mock renders children and buttons that trigger the callback props
  const MockModal = ({ children, open, title }: ModalProps) => {
    if (!open) return null;
    return (
      <div data-testid="mock-modal">
        <h1>{title}</h1>
        <div>{children}</div>
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

    // Check modal content
    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Something went wrong with updating Test Collection\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Please try again\./i)).toBeInTheDocument();
  });
});
