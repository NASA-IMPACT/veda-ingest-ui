import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SuccessModal from '@/components/ui/SuccessModal';
import { ModalProps } from 'antd';

// Mock Ant Design's Modal
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  // The mock will render its children and buttons that trigger the callback props
  const MockModal = ({
    children,
    onOk,
    onCancel,
    okText,
    open,
  }: ModalProps) => {
    if (!open) {
      return null;
    }
    return (
      <div data-testid="mock-modal">
        {children}
        <button onClick={onOk}>{okText || 'OK'}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
  return {
    ...antd,
    Modal: MockModal,
  };
});

describe('SuccessModal Component', () => {
  afterEach(() => {
    cleanup();
  });
  describe('when type is "create"', () => {
    const mockOnOk = vi.fn();
    const mockOnCancel = vi.fn();
    const props = {
      type: 'create' as const,
      collectionName: 'Test Collection',
      pullRequestUrl: 'https://github.com/test/pr',
      open: true,
      onOk: mockOnOk,
      onCancel: mockOnCancel,
    };

    it('renders correctly for "create" type', () => {
      render(<SuccessModal {...props} />);

      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      expect(
        screen.getByText(/collection has been submitted/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Github/i })).toHaveAttribute(
        'href',
        'https://github.com/test/pr'
      );
    });

    it('calls the onOk handler when OK is clicked', async () => {
      render(<SuccessModal {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'OK' }));
      expect(mockOnOk).toHaveBeenCalledTimes(1);
    });
  });

  describe('when type is "edit"', () => {
    const mockOnOk = vi.fn();
    const mockOnCancel = vi.fn();
    const props = {
      type: 'edit' as const,
      collectionName: 'Edited Collection',
      open: true,
      onOk: mockOnOk,
      onCancel: mockOnCancel,
    };

    it('renders correctly for "edit" type', () => {
      render(<SuccessModal {...props} />);

      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      expect(screen.getByText(/The update to/i)).toBeInTheDocument();
    });

    it('calls the onOk handler when OK is clicked', async () => {
      render(<SuccessModal {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'OK' }));
      expect(mockOnOk).toHaveBeenCalledTimes(1);
    });

    it('calls the onCancel handler when Cancel is clicked', async () => {
      render(<SuccessModal {...props} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
