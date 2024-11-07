/**
 * Remove any non-Alphanumeric characters other than dash or underscore for naming files
 *
 * @param {input} string
 * @returns {string}
 */
export const formatFilename = (input: string) => {
  return input.replace(/[^0-9a-zA-Z_-]/g, '')
}

