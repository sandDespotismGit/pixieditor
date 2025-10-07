import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  { ignores: ["dist"] },

  // Базовые рекомендации
  js.configs.recommended,
  prettier,

  // Для фронтового кода (PixiJS)
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        fetch: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Image: "readonly",
      },
    },
    rules: {
      // если консоль нужна для дебага — отключи это правило
      "no-console": "off",
      // дубли методов в классах → ошибка
      "no-dupe-class-members": "error",
    },
  },

  // Для webpack.config.mjs (Node)
  {
    files: ["webpack.config.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
  },
];
