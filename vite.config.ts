import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MoneyUtils",
      fileName: (format) => {
        const suffix = format === "es" ? ".mjs" : ".js";
        const modern = format === "es" ? ".modern" : "";

        return `index${modern}${suffix}`;
      },
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      external: ["decimal.js"],
      output: {
        exports: "named",
        globals: {
          "decimal.js": "Decimal",
        },
      },
    },
    target: ["es2020", "chrome80", "firefox80", "safari14"],
    sourcemap: true,
    minify: "terser",
  },
  plugins: [dts()],
});
