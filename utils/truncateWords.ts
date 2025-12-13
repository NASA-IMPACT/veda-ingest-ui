// utils/truncateWords.ts
/**
 * Truncate a string to a maximum number of words, appending an ellipsis if truncated.
 * @param text The input string to truncate.
 * @param maxWords The maximum number of words to keep.
 * @returns The truncated string with an ellipsis if needed.
 */
export function truncateWords(
  text: string = '',
  maxWords: number = 20
): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}
