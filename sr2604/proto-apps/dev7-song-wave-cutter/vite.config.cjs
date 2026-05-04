const tailwindcss = require("@tailwindcss/vite").default;
const solid = require("vite-plugin-solid");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 3000,
  },
});