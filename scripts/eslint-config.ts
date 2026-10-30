import { defineEslintConfigs } from '@mnaoumov/typescript-dev-toolkit/linters/eslint-config';
import { noRestrictedSyntaxRuleEntries } from '@mnaoumov/typescript-dev-toolkit/linters/eslint-no-restricted-syntax';
import { defineConfig } from 'eslint/config';

export const configs = defineEslintConfigs({
  customConfigs: (context) =>
    defineConfig([
      {
        files: context.allFiles(),
        rules: {
          // Stricter than the shared config, which leaves these off.
          '@stylistic/no-extra-semi': 'error',
          '@stylistic/object-curly-newline': [
            'error',
            {
              ExportDeclaration: {
                minProperties: 2,
                multiline: true
              },
              ImportDeclaration: {
                minProperties: 2,
                multiline: true
              }
            }
          ],
          '@stylistic/operator-linebreak': [
            'error',
            'before',
            {
              overrides: {
                '=': 'after'
              }
            }
          ],
          'no-negated-condition': 'error',
          'no-nested-ternary': 'error',
          'no-restricted-syntax': [
            'error',
            ...noRestrictedSyntaxRuleEntries,
            {
              message: 'Do not use definite assignment assertions (!) on abstract fields.',
              selector: 'TSAbstractPropertyDefinition[definite=true]'
            },
            {
              message: 'Avoid dynamic import(). Use static imports instead. Only use dynamic imports for lazy/conditional loading.',
              selector: 'ImportExpression'
            }
          ]
        }
      },
      {
        files: context.scriptFiles,
        rules: {
          // The scripts are CLI entry points whose output is their interface.
          'no-console': 'off'
        }
      },
      {
        files: ['scripts/eslint-config.ts'],
        rules: {
          'no-magic-numbers': 'off'
        }
      }
    ])
});
