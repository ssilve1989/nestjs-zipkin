module.exports = {
  env: {
    node: true,
    "jest/globals": true,
  },

  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    "project": "./tsconfig.json"
  },

  plugins: ['jest', 'prettier', "@typescript-eslint"],

  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/class-name-casing": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-object-literal-type-assertion": "off",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
    "@typescript-eslint/prefer-interface": "off",
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      },
    ],

    "consistent-return": "off",
    "class-methods-use-this" : "off",
    "default-case": "warn",
    "dot-notation": "warn",
    'import/prefer-default-export': 'off',
    "lines-between-class-members": "off",

    // Useful for Dependency Injection
    "no-empty-function": "warn",
    
    "prefer-destructuring": "warn",
    "prefer-promise-reject-errors": "warn",

    'prettier/prettier': 'error',
    
    "no-dupe-class-members": "warn",
    'no-underscore-dangle': 'off',
    "no-param-reassign": "warn",
    "no-shadow": "warn",
    "no-use-before-define": ["error", "nofunc"],
    "no-useless-constructor": "off",
  },

  overrides: [
    {
      "files": ["*.spec.ts", "**e2e**.ts"],
      "rules": {
        "dot-notation": "off",
        "import/no-extraneous-dependencies": "off"
      },
    },
    {
      "files": "pm2.config.js",
      "rules": {
        "@typescript-eslint/camelcase": "off",
      },
    },
    {
      "files": ["jest.config.js", "jest-e2e.js"],
      "rules": {
        "import/no-extraneous-dependencies": "off",
        "@typescript-eslint/no-var-requires": "off",
      }
    }
  ],

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
