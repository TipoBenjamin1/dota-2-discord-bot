import type { DotaItem, HeroItemPopularity, HeroMatchup, OpenDotaHero } from "../types.js";

const baseUrl = "https://api.opendota.com/api";

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

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
    if (err.name === "AbortError") {
      throw new Error(`OpenDota timeout: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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

