module.exports = {
    env: {
      browser: true,
      es2021: true,
      jquery: true,
    },
    extends: "eslint:recommended",
    parserOptions: {
      ecmaVersion: 12,
      sourceType: "script",
    },
    rules: {
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "no-unused-vars": "warn",
    },
    globals: {
      $: "readonly",
      jQuery: "readonly",
    },
  };