module.exports = {
  extends: ['next', 'prettier'],
  plugins: ['react', '@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['__tests__/playwright/**'],
      extends: ['plugin:playwright/recommended'],
    },
  ],
};
