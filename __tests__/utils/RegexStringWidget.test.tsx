import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  RegexStringWidget,
  toDisplayValue,
  fromDisplayValue,
} from '@/components/rjsf-components/RegexStringWidget';
import { WidgetProps } from '@rjsf/utils';

describe('toDisplayValue', () => {
  it('returns empty string for undefined, null, and empty string', () => {
    expect(toDisplayValue(undefined)).toBe('');
    expect(toDisplayValue(null)).toBe('');
    expect(toDisplayValue('')).toBe('');
  });

  it('returns the value unchanged when no backslashes', () => {
    expect(toDisplayValue('hello')).toBe('hello');
  });

  it('preserves backslashes so the user sees what they originally typed', () => {
    // Internal value has one backslash; display shows two so user sees \\d
    expect(toDisplayValue('.*_\\d{6}.tif$')).toBe('.*_\\\\d{6}.tif$');
  });

  it('preserves multiple backslashes', () => {
    expect(toDisplayValue('.*_\\\\d{6}.tif$')).toBe('.*_\\\\\\\\d{6}.tif$');
  });

  it('preserves other special characters', () => {
    expect(toDisplayValue('a"b')).toBe('a\\"b');
    expect(toDisplayValue('a\tb')).toBe('a\\tb');
    expect(toDisplayValue('a\nb')).toBe('a\\nb');
  });
});

describe('fromDisplayValue', () => {
  it('passes through a plain string', () => {
    expect(fromDisplayValue('hello')).toBe('hello');
  });

  it('converts displayed backslashes back to the stored form', () => {
    // User sees .*_\\d{6}.tif$ in the input → stored as .*_\d{6}.tif$
    expect(fromDisplayValue('.*_\\\\d{6}.tif$')).toBe('.*_\\d{6}.tif$');
  });

  it('converts displayed quotes back to the stored form', () => {
    expect(fromDisplayValue('a\\"b')).toBe('a"b');
  });

  it('throws on invalid escape sequences', () => {
    expect(() => fromDisplayValue('bad\\xvalue')).toThrow();
  });
});

describe('RegexStringWidget', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockOnFocus = vi.fn();

  const baseProps: WidgetProps = {
    id: 'test-regex-widget',
    name: 'filename_regex',
    label: 'Filename Regex',
    value: '',
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    onFocus: mockOnFocus,
    disabled: false,
    readonly: false,
    schema: {},
    options: {},
    registry: {} as WidgetProps['registry'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty input when value is empty', () => {
    render(<RegexStringWidget {...baseProps} value="" />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('displays backslashes as the user originally typed them', () => {
    // Form stores .*_\d{6}.tif$ internally; input should show .*_\\d{6}.tif$
    render(<RegexStringWidget {...baseProps} value={'.*_\\d{6}.tif$'} />);
    expect(screen.getByRole('textbox')).toHaveValue('.*_\\\\d{6}.tif$');
  });

  it('displays value unchanged when no backslashes', () => {
    render(<RegexStringWidget {...baseProps} value="(.*)Test_(.*).tif$" />);
    expect(screen.getByRole('textbox')).toHaveValue('(.*)Test_(.*).tif$');
  });

  it('stores typed value without adding extra backslashes on blur', async () => {
    render(<RegexStringWidget {...baseProps} value="" />);
    const input = screen.getByRole('textbox');

    // User types .*_\\d{6}.tif$ in the input
    fireEvent.change(input, { target: { value: '.*_\\\\d{6}.tif$' } });
    fireEvent.blur(input);

    // Stored value should be .*_\d{6}.tif$ — no extra escaping added
    expect(mockOnChange).toHaveBeenCalledWith('.*_\\d{6}.tif$');
  });

  it('stores raw input as-is when it contains unparseable escapes', async () => {
    render(<RegexStringWidget {...baseProps} value="" />);
    const input = screen.getByRole('textbox');

    // Type an invalid JSON escape (lone backslash + invalid char)
    await userEvent.clear(input);
    await userEvent.type(input, 'bad\\xvalue');
    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith('bad\\xvalue');
  });

  it('round-trips without mutation: paste JSON → display in form → save back', () => {
    // Simulate: user pastes JSON with "filename_regex": ".*_\\d{6}.tif$"
    // JSON.parse gives the internal value .*_\d{6}.tif$ (one backslash)
    const pastedJsonString = '".*_\\\\d{6}.tif$"';
    const parsedValue = JSON.parse(pastedJsonString);

    const { rerender } = render(
      <RegexStringWidget {...baseProps} value={parsedValue} />
    );

    // Form input shows what the user originally had in the JSON: .*_\\d{6}.tif$
    expect(screen.getByRole('textbox')).toHaveValue('.*_\\\\d{6}.tif$');

    // When saved, JSON.stringify produces the same string as the original paste
    expect(JSON.stringify(parsedValue)).toBe('".*_\\\\d{6}.tif$"');

    // Re-rendering with the same value stays stable (no drift)
    rerender(<RegexStringWidget {...baseProps} value={parsedValue} />);
    expect(screen.getByRole('textbox')).toHaveValue('.*_\\\\d{6}.tif$');
  });

  it('updates display when the value changes externally', () => {
    const { rerender } = render(
      <RegexStringWidget {...baseProps} value="initial" />
    );
    expect(screen.getByRole('textbox')).toHaveValue('initial');

    rerender(<RegexStringWidget {...baseProps} value={'new_\\d{4}'} />);
    expect(screen.getByRole('textbox')).toHaveValue('new_\\\\d{4}');
  });

  it('respects disabled prop', () => {
    render(<RegexStringWidget {...baseProps} disabled={true} value="test" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
