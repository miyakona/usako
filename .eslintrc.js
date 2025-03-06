module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    Logger: 'readonly',
    SpreadsheetApp: 'readonly',
    PropertiesService: 'readonly',
    UrlFetchApp: 'readonly'
  },
  rules: {
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    'no-console': 'off',
    'no-var': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'prefer-const': 'error'
  }
}; 