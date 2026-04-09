import { WidgetProps } from '@rjsf/utils';
import Input from 'antd/lib/input';
import { useState, useEffect } from 'react';

/**
 * A text input widget for regex fields that preserves backslashes exactly as
 * the user types them. Without this widget, RJSF's default text input silently
 * loses backslashes on load (e.g. .*_\\d{6} from the JSON editor appears as
 * .*_\d{6} in the form) and doubles them on save, because it doesn't account
 * for JSON string escaping.
 *
 * This widget ensures what you see in the form input is exactly what appears
 * in the JSON editor, and what you type is exactly what gets saved.
 */

// Convert the form's internal value to the display string the user sees.
// Needed because JSON parsing collapses escape sequences (e.g. \\ → \),
// so we re-escape them so the input shows what the user originally typed.
export const toDisplayValue = (val: unknown): string => {
  if (val === undefined || val === null || val === '') return '';
  return JSON.stringify(String(val)).slice(1, -1);
};

// Convert the display string back to the form's internal value.
// Reverses the escaping so the stored value round-trips correctly through
// JSON.stringify when the form is submitted.
export const fromDisplayValue = (display: string): string => {
  return JSON.parse('"' + display + '"');
};

export const RegexStringWidget = ({
  id,
  value,
  onChange,
  disabled,
  readonly,
}: WidgetProps) => {
  const [localValue, setLocalValue] = useState(() => toDisplayValue(value));

  useEffect(() => {
    setLocalValue(toDisplayValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    try {
      const stored = fromDisplayValue(localValue);
      onChange(stored);
    } catch {
      // If the input can't be parsed (e.g. lone backslash), store as-is
      onChange(localValue);
    }
  };

  return (
    <Input
      id={id}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      readOnly={readonly}
      disabled={disabled}
    />
  );
};
