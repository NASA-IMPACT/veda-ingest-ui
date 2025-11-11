import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FieldProps } from '@rjsf/utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import IntervalField from '@/utils/IntervalField';

// Extend dayjs with the utc plugin for consistent ISO string conversion
dayjs.extend(utc);

// Mock the Ant Design DatePicker to simplify testing
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();

  // AntD's DatePicker onChange passes a dayjs object.
  const MockDatePicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    format,
  }: {
    value: dayjs.Dayjs | null;
    onChange: (date: dayjs.Dayjs | null) => void;
    placeholder: string;
    disabled: boolean;
    format: string;
  }) => (
    <input
      type="text"
      // The component passes a dayjs object to 'value', so we format it for the input
      value={value ? value.format(format) : ''}
      placeholder={placeholder}
      disabled={disabled}
      // Simulate a new date selection by creating a dayjs object from the input string
      onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)}
    />
  );
  return { ...antd, DatePicker: MockDatePicker };
});

describe('IntervalField', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockOnFocus = vi.fn();
  let baseProps: FieldProps;

  const initialStartDate = '2025-07-10T12:00:00.000Z';
  const initialEndDate = '2025-07-25T18:30:00.000Z';
  const displayFormat = 'YYYY-MM-DD HH:mm:ss';

  beforeEach(() => {
    vi.clearAllMocks();
    baseProps = {
      formData: [initialStartDate, initialEndDate],
      onChange: mockOnChange,
      onBlur: mockOnBlur,
      onFocus: mockOnFocus,
      idSchema: { $id: 'root_interval' },
      schema: {},
      name: 'interval',
      uiSchema: {},
      disabled: false,
      readonly: false,
      formContext: {},
      registry: {} as any,
    };
  });

  it('should render the initial date values formatted correctly', () => {
    render(<IntervalField {...baseProps} />);

    // Check that the ISO strings from formData are formatted for display
    expect(screen.getByPlaceholderText('Start Date')).toHaveValue(
      dayjs(initialStartDate).format(displayFormat)
    );
    expect(screen.getByPlaceholderText('End Date')).toHaveValue(
      dayjs(initialEndDate).format(displayFormat)
    );
  });

  it('should render empty inputs if formData is undefined', () => {
    render(<IntervalField {...baseProps} formData={undefined} />);

    expect(screen.getByPlaceholderText('Start Date')).toHaveValue('');
    expect(screen.getByPlaceholderText('End Date')).toHaveValue('');
  });

  it('should call onChange with the updated start date in STAC format', () => {
    render(<IntervalField {...baseProps} />);
    const newDate = '2025-08-01T00:00:00.000Z';

    const startDateInput = screen.getByPlaceholderText('Start Date');
    fireEvent.change(startDateInput, { target: { value: newDate } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // The component should convert to STAC-compliant datetime format
    expect(mockOnChange).toHaveBeenCalledWith([
      '2025-08-01 00:00:00+00:00',
      initialEndDate,
    ]);
  });

  it('should call onChange with the updated end date in STAC format', () => {
    render(<IntervalField {...baseProps} />);
    const newDate = '2025-09-15T00:00:00.000Z';

    const endDateInput = screen.getByPlaceholderText('End Date');
    fireEvent.change(endDateInput, { target: { value: newDate } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    // The component should convert to STAC-compliant datetime format
    expect(mockOnChange).toHaveBeenCalledWith([
      initialStartDate,
      '2025-09-15 00:00:00+00:00',
    ]);
  });

  it('should disable both inputs when the disabled prop is true', () => {
    render(<IntervalField {...baseProps} disabled={true} />);

    expect(screen.getByPlaceholderText('Start Date')).toBeDisabled();
    expect(screen.getByPlaceholderText('End Date')).toBeDisabled();
  });
});
