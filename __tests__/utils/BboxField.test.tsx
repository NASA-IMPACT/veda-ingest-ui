import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FieldProps } from '@rjsf/utils';
import BboxField from '@/utils/BboxField';

// Mock the Ant Design InputNumber to simplify testing
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  const MockInputNumber = ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: number | null;
    onChange: (val: number | null) => void;
    placeholder: string;
    disabled: boolean;
  }) => (
    <input
      type="number"
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) =>
        onChange(e.target.value === '' ? null : Number(e.target.value))
      }
    />
  );
  return { ...antd, InputNumber: MockInputNumber };
});

describe('BboxField', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockOnFocus = vi.fn();
  let baseProps: FieldProps;

  beforeEach(() => {
    vi.clearAllMocks();
    baseProps = {
      formData: [-105.0, 40.0, -104.0, 41.0], // xmin, ymin, xmax, ymax
      onChange: mockOnChange,
      onBlur: mockOnBlur,
      onFocus: mockOnFocus,
      fieldPathId: { $id: 'root_bbox', path: ['bbox'] },
      schema: {},
      name: 'bbox',
      uiSchema: {},
      disabled: false,
      readonly: false,
      formContext: {},
      registry: {} as any,
    };
  });

  it('should render the initial values in the correct inputs', () => {
    render(<BboxField {...baseProps} />);

    expect(screen.getByPlaceholderText('xmin')).toHaveValue(-105.0);
    expect(screen.getByPlaceholderText('ymin')).toHaveValue(40.0);
    expect(screen.getByPlaceholderText('xmax')).toHaveValue(-104.0);
    expect(screen.getByPlaceholderText('ymax')).toHaveValue(41.0);
  });

  it('should render empty inputs if formData is undefined', () => {
    render(<BboxField {...baseProps} formData={undefined} />);

    expect(screen.getByPlaceholderText('xmin')).toHaveValue(null);
    expect(screen.getByPlaceholderText('ymin')).toHaveValue(null);
    expect(screen.getByPlaceholderText('xmax')).toHaveValue(null);
    expect(screen.getByPlaceholderText('ymax')).toHaveValue(null);
  });

  it('should call onChange with the updated array when xmin changes', () => {
    render(<BboxField {...baseProps} />);
    const xminInput = screen.getByPlaceholderText('xmin');
    fireEvent.change(xminInput, { target: { value: '-105.5' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      [-105.5, 40.0, -104.0, 41.0],
      ['bbox']
    );
  });

  it('should call onChange with the updated array when ymin changes', () => {
    render(<BboxField {...baseProps} />);
    const yminInput = screen.getByPlaceholderText('ymin');
    fireEvent.change(yminInput, { target: { value: '39.5' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      [-105.0, 39.5, -104.0, 41.0],
      ['bbox']
    );
  });

  it('should call onChange with the updated array when xmax changes', () => {
    render(<BboxField {...baseProps} />);
    const xmaxInput = screen.getByPlaceholderText('xmax');
    fireEvent.change(xmaxInput, { target: { value: '-103.5' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      [-105.0, 40.0, -103.5, 41.0],
      ['bbox']
    );
  });

  it('should call onChange with the updated array when ymax changes', () => {
    render(<BboxField {...baseProps} />);
    const ymaxInput = screen.getByPlaceholderText('ymax');
    fireEvent.change(ymaxInput, { target: { value: '41.5' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      [-105.0, 40.0, -104.0, 41.5],
      ['bbox']
    );
  });

  it('should disable all inputs when the disabled prop is true', () => {
    render(<BboxField {...baseProps} disabled={true} />);

    expect(screen.getByPlaceholderText('xmin')).toBeDisabled();
    expect(screen.getByPlaceholderText('ymin')).toBeDisabled();
    expect(screen.getByPlaceholderText('xmax')).toBeDisabled();
    expect(screen.getByPlaceholderText('ymax')).toBeDisabled();
  });
});
