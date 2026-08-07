const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**', 'android/**', 'ios/**', 'coverage/**', 'dist/**'],
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**',
                '@/application/**',
                '@/composition/**',
                '@/features/**',
                '@/infrastructure/**',
              ],
              message: 'Domain katmanı dış katmanlara bağımlı olamaz.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/composition/**', '@/features/**', '@/infrastructure/**'],
              message: 'Application katmanı infrastructure veya presentation katmanına bağlanamaz.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'UI içinden doğrudan HTTP çağrısı yapılamaz; use-case/repository kullanın.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/infrastructure/**'],
              message: 'UI, infrastructure yerine application use-case katmanına bağlanmalıdır.',
            },
          ],
        },
      ],
    },
  },
  prettierRecommended,
]);
