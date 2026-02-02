const path = require('path');

const buildEslintCommand = (filenames) => {
  // Filter out flat config files and non-TS/JS files
  const jsFiles = filenames
    .filter((f) => {
      const name = path.basename(f);
      // Exclude the flat config files (unused)
      if (/^eslint\.config\.(js|mjs)$/.test(name)) {
        return false;
      }
      return /\.(js|jsx|ts|tsx)$/.test(f);
    })
    .map((f) => path.relative(process.cwd(), f));

  if (jsFiles.length === 0) {
    return 'echo "No JS/TS files to lint"';
  }

  return `yarn lint:fix -- ${jsFiles.join(' ')}`;
};

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, 'prettier --write'],
  '*.{json,md,css,scss,html}': ['prettier --write'],
};
