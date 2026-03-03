import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(fileURLToPath(import.meta.url));

function copyExtensionStaticFiles(): { name: string; writeBundle: () => void } {
  return {
    name: "copy-extension-static-files",
    writeBundle() {
      const distDir = resolve(rootDir, "dist");
      mkdirSync(distDir, { recursive: true });
      cpSync(resolve(rootDir, "manifest.json"), resolve(distDir, "manifest.json"), { force: true });
      cpSync(resolve(rootDir, "src/styles.css"), resolve(distDir, "styles.css"), { force: true });

      const injectedSource = readFileSync(resolve(rootDir, "src/injected.tsx"), "utf8");
      const transpiled = ts.transpileModule(injectedSource, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.None,
          jsx: ts.JsxEmit.Preserve,
          removeComments: false
        }
      });
      writeFileSync(resolve(distDir, "injected.js"), transpiled.outputText, "utf8");
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionStaticFiles()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    process: JSON.stringify({ env: { NODE_ENV: "production" } })
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: "src/contentScript.tsx",
      name: "OverleafWordCount",
      formats: ["iife"],
      fileName: () => "contentScript.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
