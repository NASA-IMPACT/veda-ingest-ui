import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import SuccessModal from '@/components/SuccessModal';


// Mock StyledModal
vi.mock('@/components/StyledModal', () => ({
  __esModule: true,
  default: vi.fn(({ children, okText, onOk }) => (
    <div data-testid="styled-modal">
      {children}
      <button onClick={onOk}>{okText}</button>
    </div>
  )),
}));

describe('SuccessModal Component', () => {

  afterEach(() => {
    cleanup();
  });
  
  it('renders correctly for "create" type', () => {
    const mockSetStatus = vi.fn();
    const props = {
      type: 'create' as const,
      collectionName: 'Test Collection',
      pullRequestUrl: 'https://github.com/test/pr',
      setStatus: mockSetStatus,
    };

    render(<SuccessModal {...props} />);

    // Verify modal content
    expect(screen.getByTestId('styled-modal')).toBeInTheDocument();
    expect(
      screen.getByText(/collection has been submitted\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Github/i })).toHaveAttribute(
      'href',
      'https://github.com/test/pr'
    );
  });

  it('renders correctly for "edit" type', () => {
    const mockSetStatus = vi.fn();
    const props = {
      type: 'edit' as const,
      collectionName: 'Edited Collection',
      setStatus: mockSetStatus,
    };

    render(<SuccessModal {...props} />);

    // Verify modal content
    expect(screen.getByTestId('styled-modal')).toBeInTheDocument();
    expect(
      screen.getByText(/The update to/i)
    ).toBeInTheDocument();
  });

  it('calls setStatus with "idle" when OK is clicked', () => {
    const mockSetStatus = vi.fn();
    const props = {
      type: 'edit' as const,
      collectionName: 'Edited Collection',
      setStatus: mockSetStatus,
    };

    render(<SuccessModal {...props} />);

    // Simulate clicking the OK button
    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    // Verify setStatus is called
    expect(mockSetStatus).toHaveBeenCalledWith('idle');
  });
});
