/**
 * Remove any non-Alphanumeric characters other than dash or underscore for naming files
 */
export const formatFilename = (input: string): string => {
  return input.replace(/[^0-9a-zA-Z_-]/g, '');
};
