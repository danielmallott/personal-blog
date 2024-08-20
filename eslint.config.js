const { neostandard } = require('neostandard/lib/main');
const react = require.resolve('eslint-plugin-react');
const stylistic = require.resolve('@stylistic/eslint-plugin');
const next = require.resolve('@next/eslint-plugin-next');
const html = require.resolve('eslint-plugin-html');
const node = require.resolve('eslint-plugin-node');
const globals = require.resolve('globals');
const prettier = require.resolve('prettier');

module.exports = [
  ...neostandard({
    env: ['node'],
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '**/*.md',
      '**/*.json',
      'public/**/*',
      '**/*.scss',
      'node_modules/**/*',
      'node_modules/*',
      '.next/**/*',
      '.github/**/*',
      '**/node_modules',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: {
      react,
      '@stylistic': stylistic,
      next,
      html,
      node,
      globals,
      prettier,
    },
    rules: {
      '@stylistic/semi': ['always', { omitLastInOneLineBlock: true }],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }]
    },
    semi: true,
    ts: true
  })
];
