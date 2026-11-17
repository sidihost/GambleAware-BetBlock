import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'app/**/*',
      'node_modules/**/*',
      '.playwright-cli/**/*',
      'public/**/*',
      'src/**/*',
    ],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
