import type { DotaItem, HeroItemPopularity, HeroMatchup, OpenDotaHero } from "../types.js";

const baseUrl = "https://api.opendota.com/api";
const defaultTimeoutMs = 15000;
const maxAttempts = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson<T>(path: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), defaultTimeoutMs);

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
  return getJson<OpenDotaHero[]>("/heroStats");
}

export async function fetchHeroMatchups(heroId: number): Promise<HeroMatchup[]> {
  return getJson<HeroMatchup[]>(`/heroes/${heroId}/matchups`);
}

export async function fetchItemsConstants(): Promise<Record<string, DotaItem>> {
  return getJson<Record<string, DotaItem>>("/constants/items");
}

export async function fetchHeroItemPopularity(heroId: number): Promise<HeroItemPopularity> {
  return getJson<HeroItemPopularity>(`/heroes/${heroId}/itemPopularity`);
}
