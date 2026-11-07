import { mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Model Vite's emitted gallery filenames with real bytes, without running a build. */
export function seedSeoAssets(temp: string) {
  const dir = join(temp, "dist/assets");
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(resolve("src/assets/optimized"))) {
    if (!name.startsWith("gallery-")) continue;
    const emitted = name.replace(/\.(avif|webp)$/, "-fixture.$1");
    copyFileSync(resolve("src/assets/optimized", name), join(dir, emitted));
  }
}