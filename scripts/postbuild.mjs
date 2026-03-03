import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
cpSync("manifest.json", "dist/manifest.json");
cpSync("src/styles.css", "dist/styles.css");
