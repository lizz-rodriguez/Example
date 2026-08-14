module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "uploads/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        File: "readonly",
        FormData: "readonly",
        URL: "readonly",
        Blob: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
