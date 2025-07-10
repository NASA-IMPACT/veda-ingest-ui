import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestableUrlWidget } from '@/utils/TestableUrlWidget';
import { WidgetProps } from '@rjsf/utils';

// Mock Ant Design components
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd,
    Typography: {
      ...antd.Typography,
      Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    },
  };
});

describe('TestableUrlWidget', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockOnFocus = vi.fn();

  const baseProps: WidgetProps = {
    id: 'test-widget',
    name: 'test-name',
    label: 'Test Label',
    value: '',
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    onFocus: mockOnFocus,
    disabled: false,
    readonly: false,
    schema: {},
    options: {},
    registry: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('API Validation and Rendering', () => {
    it('should render correctly in its initial state', () => {
      render(<TestableUrlWidget {...baseProps} value="http://initial.url" />);
      expect(screen.getByRole('textbox')).toHaveValue('http://initial.url');
      const validateButton = screen.getByRole('button', { name: /validate/i });
      expect(validateButton).toBeVisible();
      expect(validateButton).toBeEnabled();
    });

    it('should show a "validated" state on successful API call', async () => {
      (global.fetch as Mock).mockResolvedValue({ ok: true });
      render(<TestableUrlWidget {...baseProps} value="http://valid.url" />);
      fireEvent.click(screen.getByRole('button', { name: /validate/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /validated/i })
        ).toBeVisible();
      });
      expect(screen.queryByText(/Validation failed/)).not.toBeInTheDocument();
    });

    it('should show an "error" state on failed API call', async () => {
      (global.fetch as Mock).mockResolvedValue({ ok: false });
      render(<TestableUrlWidget {...baseProps} value="http://invalid.url" />);
      fireEvent.click(screen.getByRole('button', { name: /validate/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /invalid/i })).toBeVisible();
      });
      expect(screen.getByText(/Validation failed/)).toBeVisible();
    });

    it('should show an "error" state on network failure', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('Network failure'));
      render(<TestableUrlWidget {...baseProps} value="http://network.error" />);
      fireEvent.click(screen.getByRole('button', { name: /validate/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /invalid/i })).toBeVisible();
      });
      expect(screen.getByText(/Validation failed/)).toBeVisible();
    });

    it('should disable the input and button when disabled prop is true', () => {
      render(<TestableUrlWidget {...baseProps} disabled={true} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(screen.getByRole('button', { name: /validate/i })).toBeDisabled();
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle input changes with debouncing', () => {
      render(<TestableUrlWidget {...baseProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'http://new.url' } });

      expect(input).toHaveValue('http://new.url');
      expect(mockOnChange).not.toHaveBeenCalled();

      // Advance timers to trigger the debounced function
      vi.advanceTimersByTime(400);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('http://new.url');
    });
  });
});
