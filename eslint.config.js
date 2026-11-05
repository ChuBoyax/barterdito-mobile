// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Stays visible, but does not fail lint: the app resets and loads state in effects on purpose.
      "react-hooks/set-state-in-effect": "warn",
    },
  }
]);
