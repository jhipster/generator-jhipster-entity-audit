import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier/recommended';
import jhipster from 'generator-jhipster/eslint';
import globals from 'globals';
import ts from 'typescript-eslint';
// jhipster-needle-eslint-add-import - JHipster will add additional import here

export default defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    ...ts.configs.recommended[0],
    ...ts.configs.stylistic[0],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  { ignores: ['coverage/**'] },
  jhipster.recommended,
  // jhipster-needle-eslint-add-config - JHipster will add additional config here
  prettier,
]);
