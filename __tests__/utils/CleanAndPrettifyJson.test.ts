import { describe, test, expect, vi } from 'vitest';
import { CleanAndPrettifyJSON } from '@/utils/CleanAndPrettifyJson';

describe('CleanAndPrettifyJSON', () => {
  test('preserves a valid JSON string in renders dashboard object', () => {
    const input = { name: 'Valid', renders: { dashboard: `{"key": "value"}` } };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify(
        { name: 'Valid', renders: { dashboard: { key: 'value' } } },
        null,
        2
      )
    );
  });

  test('leaves renders dashboard as null if it is null', () => {
    const input = { name: 'Null Case', renders: { dashboard: null } };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify(
        { name: 'Null Case', renders: { dashboard: null } },
        null,
        2
      )
    );
  });

  test('leaves renders dashboard as empty string if it is empty', () => {
    const input = { name: 'Empty String', renders: { dashboard: '' } };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify(
        { name: 'Empty String', renders: { dashboard: '' } },
        null,
        2
      )
    );
  });

  test("does not modify renders dashboard if it's already an object", () => {
    const input = {
      name: 'Already Object',
      renders: { dashboard: { key: 'value' } },
    };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify(
        { name: 'Already Object', renders: { dashboard: { key: 'value' } } },
        null,
        2
      )
    );
  });

  test('keeps renders dashboard as a string if JSON parsing fails', () => {
    const consoleWarnMock = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const input = {
      name: 'Invalid JSON',
      renders: { dashboard: '{invalid: json}' },
    };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify(
        { name: 'Invalid JSON', renders: { dashboard: '{invalid: json}' } },
        null,
        2
      )
    );
    expect(consoleWarnMock).toHaveBeenCalledWith(
      "Invalid JSON in 'renders dashboard' field. Keeping as string."
    );
    consoleWarnMock.mockRestore();
  });

  test("does not add renders key if it's missing", () => {
    const input = { name: 'Missing Renders Key' };
    const output = CleanAndPrettifyJSON(input);
    expect(output).toBe(
      JSON.stringify({ name: 'Missing Renders Key' }, null, 2)
    );
  });
});
