module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: '18.3' } },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react-refresh'],
  ignorePatterns: ['dist'],
  rules: {
    'react/prop-types': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true, allowExportNames: ['useAuth', 'useZone'] },
    ],
  },
};
