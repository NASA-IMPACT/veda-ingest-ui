const quote = (file) => `'${file.replace(/'/g, "'\\''")}'`;

module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    const quoted = files.map(quote).join(' ');
    return [
      `yarn lint:fix -- ${quoted}`,
      `prettier --write ${quoted}`,
    ];
  },
  '*.{json,md,css,scss,html}': (files) => {
    const quoted = files.map(quote).join(' ');
    return `prettier --write ${quoted}`;
  },
};
