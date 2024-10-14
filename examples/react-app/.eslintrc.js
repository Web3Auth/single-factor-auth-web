require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@toruslabs/eslint-config-react"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.config.js", "*.eslintrc.js"],
  rules: {
    "@typescript-eslint/no-throw-literal": 0,
    "no-case-declarations": 0,
    "react/jsx-props-no-spreading": [
      "error",
      {
        html: "ignore",
      },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  env: {
    es2020: true,
    browser: true,
    node: true,
  },
};
