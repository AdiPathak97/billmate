import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier/flat';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/next-env.d.ts',
  ]),

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node.js environment for all config files and API
  {
    files: [
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      'apps/api/**/*.ts',
      'packages/shared/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // CJS files get CommonJS globals
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.commonjs,
      },
    },
  },

  // Browser + Node globals for Next.js app code
  {
    files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  {
    files: ['apps/web/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'apps/web/',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },

  prettierConfig,
]);