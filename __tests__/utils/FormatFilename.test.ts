import { describe, it, expect } from 'vitest';
import { formatFilename } from '@/utils/FormatFilename';

describe('formatFilename', () => {
  it('removes non-alphanumeric characters except dash and underscore', () => {
    expect(formatFilename('valid-file_name-123')).toBe('valid-file_name-123');
    expect(formatFilename('invalid@file#name!')).toBe('invalidfilename');
  });

  it('handles strings with only invalid characters', () => {
    expect(formatFilename('@#$%^&*()')).toBe('');
    expect(formatFilename('!@#$')).toBe('');
  });

  it('handles empty strings', () => {
    expect(formatFilename('')).toBe('');
  });

  it('does not modify strings that are already valid', () => {
    expect(formatFilename('filename-123_456')).toBe('filename-123_456');
    expect(formatFilename('another_valid-filename')).toBe(
      'another_valid-filename'
    );
  });

  it('preserves case sensitivity', () => {
    expect(formatFilename('TestFile-Name')).toBe('TestFile-Name');
    expect(formatFilename('Upper_and_Lower123')).toBe('Upper_and_Lower123');
  });
});
