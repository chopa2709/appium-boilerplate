import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const wdioPlugin = require('eslint-plugin-wdio');

export default [
    js.configs.recommended,
    wdioPlugin.configs['flat/recommended'],
    {
        files: ['config/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2017,
            sourceType: 'module',
            globals: {
                browser: 'readonly',
                driver: 'readonly',
                $: 'readonly',
                $$: 'readonly',
                expect: 'readonly',
                document: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            semi: ['error', 'always'],
            indent: [2, 4],
            'no-multiple-empty-lines': [2, { max: 1, maxEOF: 1 }],
            'array-bracket-spacing': ['error', 'never'],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            camelcase: ['error', { properties: 'never' }],
            'comma-spacing': ['error', { before: false, after: true }],
            'no-lonely-if': 'error',
            'no-else-return': 'error',
            'no-tabs': 'error',
            'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
            quotes: ['error', 'single', { avoidEscape: true }],
            'unicode-bom': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'keyword-spacing': ['error'],
            'require-atomic-updates': 0,
            'no-unexpected-multiline': 0,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            'no-undef': 'off',
            'no-redeclare': 'off',
        },
    },
];
