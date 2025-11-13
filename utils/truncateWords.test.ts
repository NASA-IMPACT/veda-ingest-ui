import { describe, it, expect } from 'vitest';
import { truncateWords } from './truncateWords';

describe('truncateWords', () => {
  it('returns the original string if under maxWords', () => {
    expect(truncateWords('hello world', 5)).toBe('hello world');
  });

  it('truncates to the specified number of words', () => {
    expect(truncateWords('one two three four five', 3)).toBe('one two three…');
  });

  it('handles empty string', () => {
    expect(truncateWords('', 3)).toBe('');
  });

  it('handles string with exactly maxWords', () => {
    expect(truncateWords('a b c', 3)).toBe('a b c');
  });

  it('handles multiple spaces', () => {
    expect(truncateWords('a   b    c   d', 2)).toBe('a b…');
  });

  it('handles undefined input', () => {
    expect(truncateWords(undefined as any, 2)).toBe('');
  });
});
