import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DotaCache } from "../types.js";

const cachePath = resolve("data", "cache.json");

export async function readCache(): Promise<DotaCache | null> {
  try {
    const raw = await readFile(cachePath, "utf8");
    return JSON.parse(raw) as DotaCache;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeCache(cache: DotaCache): Promise<void> {
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}
