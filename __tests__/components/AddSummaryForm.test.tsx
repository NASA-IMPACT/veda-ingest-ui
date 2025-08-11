import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AddSummaryForm } from '@/components/rjsf-components/AddSummaryForm';

// --- Mocks ---

vi.mock('@/components/ui/CodeEditorWidget', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="code-editor-widget"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@ant-design/icons', () => ({
  PlusCircleOutlined: () => <span>+</span>,
  DeleteOutlined: () => <span>x</span>,
}));

// Mock AntD's Select component to be a simple native select for reliable testing
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();

  const MockSelect = ({ children, value, onChange, ...props }: any) => (
    <select {...props} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );

  const MockOption = ({ children, value, ...props }: any) => (
    <option {...props} value={value}>
      {children}
    </option>
  );
  MockOption.displayName = 'MockOption';
  MockSelect.Option = MockOption;

  return {
    ...antd,
    Select: MockSelect,
  };
});

describe('AddSummaryForm', () => {
  let mockOnAdd: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let defaultProps: any;

  beforeEach(() => {
    mockOnAdd = vi.fn();
    mockOnCancel = vi.fn();
    defaultProps = {
      initialKey: 'new-summary',
      onAdd: mockOnAdd,
      onCancel: mockOnCancel,
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders with initial key and defaults to "Range" type', () => {
    render(<AddSummaryForm {...defaultProps} />);

    expect(screen.getByLabelText('Summary Key')).toHaveValue('new-summary');
    expect(screen.getByLabelText('Summary Type')).toHaveValue('Range');

    // Check that Range inputs are visible
    expect(screen.getByLabelText('Minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum')).toBeInTheDocument();
  });

  it('switches to and displays inputs for "Set" type', async () => {
    const user = userEvent.setup();
    render(<AddSummaryForm {...defaultProps} />);

    // The "Values" label for the Set type should not be visible initially
    expect(screen.queryByText('Values')).toBeNull();

    // Change the select value
    await user.selectOptions(
      screen.getByLabelText('Summary Type'),
      'Set of values'
    );

    // Now the "Values" label should be visible, and Range inputs should be gone
    expect(screen.getByText('Values')).toBeInTheDocument();
    expect(screen.queryByText('Minimum')).toBeNull();
  });

  it('calls onAdd with correct "JSON Schema" data on submit', async () => {
    const user = userEvent.setup();
    render(<AddSummaryForm {...defaultProps} />);

    // --- ARRANGE ---
    // Give the summary a unique key
    const keyInput = screen.getByLabelText('Summary Key');
    await user.clear(keyInput);
    await user.type(keyInput, 'test-schema');

    // Change the type to JSON Schema
    await user.selectOptions(
      screen.getByLabelText('Summary Type'),
      'JSON Schema'
    );

    const schemaEditor = screen.getByTestId('code-editor-widget');
    const newSchemaValue = { type: 'string', enum: ['a', 'b'] };

    fireEvent.change(schemaEditor, {
      target: { value: JSON.stringify(newSchemaValue) },
    });

    await user.click(screen.getByRole('button', { name: 'Add' }));

    // --- ASSERT ---
    // Check that onAdd was called with the key and the *parsed* JSON object
    expect(mockOnAdd).toHaveBeenCalledWith({
      key: 'test-schema',
      value: newSchemaValue,
    });
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddSummaryForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onAdd with correct "Range" data on submit', async () => {
    const user = userEvent.setup();
    render(<AddSummaryForm {...defaultProps} />);

    const keyInput = screen.getByLabelText('Summary Key');
    await user.clear(keyInput);
    await user.type(keyInput, 'test-range');

    const minInput = screen.getByLabelText('Minimum');
    await user.clear(minInput);
    await user.type(minInput, '10');

    const maxInput = screen.getByLabelText('Maximum');
    await user.clear(maxInput);
    await user.type(maxInput, '50');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockOnAdd).toHaveBeenCalledWith({
      key: 'test-range',
      value: { minimum: 10, maximum: 50 },
    });
  });

  it('calls onAdd with correct "Set" data on submit', async () => {
    const user = userEvent.setup();
    render(<AddSummaryForm {...defaultProps} />);

    await user.clear(screen.getByLabelText('Summary Key'));
    await user.type(screen.getByLabelText('Summary Key'), 'test-set');

    await user.selectOptions(
      screen.getByLabelText('Summary Type'),
      'Set of values'
    );

    const valueInput = await screen.findByPlaceholderText('Enter value');
    await user.type(valueInput, 'value-a');

    await user.click(screen.getByRole('button', { name: /Add Value/i }));

    const allInputs = screen.getAllByPlaceholderText('Enter value');
    await user.type(allInputs[1], 'value-b');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockOnAdd).toHaveBeenCalledWith({
      key: 'test-set',
      value: ['value-a', 'value-b'],
    });
  });
});
