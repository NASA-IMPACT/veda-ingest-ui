import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import SummariesManager from '@/components/rjsf-components/SummariesManager';

// --- Mocks ---

// Mock the new AddSummaryForm. We just need to know if it's visible
// and provide a way to simulate it calling the `onAdd` prop.
vi.mock('@/components/rjsf-components/AddSummaryForm', () => ({
  AddSummaryForm: vi.fn(({ onAdd }) => (
    <div data-testid="add-summary-form">
      <button onClick={() => onAdd({ key: 'mock-key', value: 'mock-value' })}>
        Simulate Add
      </button>
    </div>
  )),
}));

// Mock the icons used by SummariesManager
vi.mock('@ant-design/icons', () => ({
  PlusCircleOutlined: () => <span />,
  DeleteOutlined: () => <span />,
}));

// A simple mock for the Modal that just renders its children when open
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd,
    Modal: ({ open, title, children }: any) => {
      if (!open) return null;
      return (
        <div role="dialog" aria-label={title}>
          {children}
        </div>
      );
    },
  };
});

describe('SummariesManager', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders correctly with no initial data', () => {
    render(<SummariesManager onChange={mockOnChange} />);
    expect(screen.getByText('Summaries')).toBeVisible();
    expect(screen.getByRole('button', { name: /Add Summary/i })).toBeVisible();
  });

  it('renders initial data correctly', () => {
    const initialData = { 'veda:bands': ['B1'] };
    render(
      <SummariesManager initialData={initialData} onChange={mockOnChange} />
    );
    expect(screen.getByText('veda:bands')).toBeVisible();
    expect(screen.getByText('B1')).toBeVisible();
  });

  it('removes a summary when its delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SummariesManager initialData={{ key1: ['a'] }} onChange={mockOnChange} />
    );

    const removeButton = screen.getByRole('button', {
      name: 'delete summary key1',
    });
    await user.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  it('opens the add summary form when add button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SummariesManager
        initialData={{ original: 'data' }}
        onChange={mockOnChange}
      />
    );

    // The form inside the modal should not be visible initially
    expect(screen.queryByTestId('add-summary-form')).toBeNull();

    // Click the main add button to trigger the modal
    await user.click(screen.getByRole('button', { name: /Add Summary/i }));

    // Wait for the modal to open and render content
    await waitFor(() => {
      expect(screen.getByTestId('add-summary-form')).toBeInTheDocument();
    });

    // Assert that our mocked form is now rendered and visible
    expect(screen.getByTestId('add-summary-form')).toBeVisible();
  });

  it('calls onChange with new data when the child form "adds" a summary', async () => {
    const user = userEvent.setup();
    render(
      <SummariesManager
        initialData={{ original: 'data' }}
        onChange={mockOnChange}
      />
    );

    // Open the modal
    await user.click(screen.getByRole('button', { name: /Add Summary/i }));

    // Find the simulation button inside our mocked form and click it
    const simulateAddButton = await screen.findByRole('button', {
      name: 'Simulate Add',
    });
    await user.click(simulateAddButton);

    // Assert that the onChange prop was called with the original data plus the new mocked data
    expect(mockOnChange).toHaveBeenCalledWith({
      original: 'data',
      'mock-key': 'mock-value',
    });
  });
});
