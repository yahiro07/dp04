import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
});
