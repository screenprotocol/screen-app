module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:jsx-a11y/recommended',
    ],
    plugins: ['jsx-a11y'],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            { ignoreRestSiblings: true },
        ],
    },
}
