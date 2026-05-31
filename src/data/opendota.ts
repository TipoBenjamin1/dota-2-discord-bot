import type { DotaItem, HeroItemPopularity, HeroMatchup, OpenDotaHero } from "../types.js";

const baseUrl = "https://api.opendota.com/api";
const defaultTimeoutMs = 10000;
const defaultMaxAttempts = 2;

export type OpenDotaRequestOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson<T>(path: string, options: OpenDotaRequestOptions = {}): Promise<T> {
  let lastError: unknown;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const maxAttempts = options.maxAttempts ?? defaultMaxAttempts;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { "User-Agent": "dota-2-discord-bot/0.1" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenDota request failed: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxAttempts) {
        await sleep(750 * attempt);
        continue;
      }

      if (err.name === "AbortError") {
        throw new Error(`OpenDota timeout after ${maxAttempts} attempts: ${path}`);
      }

      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

export async function fetchHeroStats(): Promise<OpenDotaHero[]> {
  return getJson<OpenDotaHero[]>("/heroStats", { timeoutMs: 15000, maxAttempts: 3 });
}

export async function fetchHeroMatchups(
  heroId: number,
  options?: OpenDotaRequestOptions,
): Promise<HeroMatchup[]> {
  return getJson<HeroMatchup[]>(`/heroes/${heroId}/matchups`, options);
}

export async function fetchItemsConstants(): Promise<Record<string, DotaItem>> {
  return getJson<Record<string, DotaItem>>("/constants/items", { timeoutMs: 15000, maxAttempts: 3 });
}

export async function fetchHeroItemPopularity(
  heroId: number,
  options?: OpenDotaRequestOptions,
): Promise<HeroItemPopularity> {
  return getJson<HeroItemPopularity>(`/heroes/${heroId}/itemPopularity`, options);
}
