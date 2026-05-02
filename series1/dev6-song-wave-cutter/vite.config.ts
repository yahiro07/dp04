import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ["lamejs"],
  },
  build: {
    target: "esnext",
  },
});
