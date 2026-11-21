// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs'] },
  js.configs.recommended,
  // Type-aware rules catch what matters most in async NestJS code, such as promises
  // that are never awaited.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['test/*.json'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // CLAUDE.md: no `any` unless justified in a comment next to an explicit disable.
      '@typescript-eslint/no-explicit-any': 'error',
      // `const { currency, ...rest } = x` is the idiomatic way to drop a field.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Jest mocks and asymmetric matchers (expect.any, expect.objectContaining) are typed
    // as `any` by Jest itself; asserting with them is not unsafe.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
