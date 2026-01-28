module.exports = {
  extends: ['next', 'prettier'],
  overrides: [
    {
      files: ['__tests__/playwright/**'],
      extends: ['plugin:playwright/recommended'],
    },
  ],
};
