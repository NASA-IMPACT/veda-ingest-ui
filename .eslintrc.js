module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/triple-slash-reference': 'warn',
  },
  overrides: [
    {
      files: ['__tests__/playwright/**'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        'playwright/no-nested-step': 'off',
      },
    },
  ],
};
