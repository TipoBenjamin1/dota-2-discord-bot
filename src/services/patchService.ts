import { readCache, writeCache } from "../data/cache.js";
import type { DotaCache, PatchNewsItem } from "../types.js";

const steamNewsUrl = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/";
const dotaPatchListUrl = "https://www.dota2.com/datafeed/patchnoteslist";
const dotaPatchNotesUrl = "https://www.dota2.com/datafeed/patchnotes";
const dotaAppId = 570;

type DotaPatchListResponse = {
  patches?: DotaPatchListItem[];
};

type DotaPatchListItem = {
  patch_number: string;
  patch_name: string;
  patch_timestamp: number;
};

type DotaPatchNotesResponse = DotaPatchListItem & {
  success?: boolean;
  general_notes?: DotaPatchGeneralSection[];
  items?: DotaPatchAbilityChange[];
  neutral_items?: DotaPatchAbilityChange[];
  heroes?: DotaPatchHeroChange[];
};

type DotaPatchGeneralSection = {
  title?: string;
  generic?: DotaPatchNote[];
};

type DotaPatchAbilityChange = {
  ability_id: number;
  ability_notes?: DotaPatchNote[];
};

type DotaPatchHeroChange = {
  hero_id: number;
  hero_notes?: DotaPatchNote[];
  talent_notes?: DotaPatchNote[];
  abilities?: DotaPatchAbilityChange[];
};

type DotaPatchNote = {
  indent_level?: number;
  note: string;
};

type SteamNewsResponse = {
  appnews?: {
    newsitems?: SteamNewsItem[];
  };
};

type SteamNewsItem = {
  gid: string;
  title: string;
  url?: string;
  contents?: string;
  date: number;
  feedname?: string;
};

export async function getLatestPatchNews(): Promise<PatchNewsItem> {
  try {
    const patch = await fetchLatestOfficialPatch();
    await savePatchNews(patch);
    return patch;
  } catch (officialError) {
    try {
      const patch = await fetchLatestSteamPatchNews();
      await savePatchNews(patch);
      return patch;
    } catch {
      const cached = await getCachedPatchNews();
      if (cached) {
        return cached;
      }

      throw officialError;
    }
  }
}

export async function getCachedPatchNews(gid?: string): Promise<PatchNewsItem | undefined> {
  const cache = await readCache();
  if (!cache?.patchNews) {
    return undefined;
  }

  if (gid && cache.patchNews.gid !== gid) {
    return undefined;
  }

  return cache.patchNews;
}

export async function markPatchAnnounced(gid: string): Promise<void> {
  const cache = await readCache();
  if (!cache) {
    return;
  }

  cache.announcedPatchGid = gid;
  await writeCache(cache);
}

export async function isPatchAlreadyAnnounced(gid: string): Promise<boolean> {
  const cache = await readCache();
  return cache?.announcedPatchGid === gid;
}

export async function getAnnouncedPatchGid(): Promise<string | undefined> {
  const cache = await readCache();
  return cache?.announcedPatchGid;
}

async function savePatchNews(patch: PatchNewsItem): Promise<void> {
  const cache = await readCache();
  if (!cache) {
    return;
  }

  cache.patchNews = patch;
  await writeCache(cache);
}

async function fetchLatestOfficialPatch(): Promise<PatchNewsItem> {
  const cache = await readCache();
  const list = await getJson<DotaPatchListResponse>(dotaPatchListUrl);
  const latest = [...(list.patches ?? [])].sort((a, b) => a.patch_timestamp - b.patch_timestamp).at(-1);

  if (!latest) {
    throw new Error("Dota 2 patch list is empty.");
  }

  const url = new URL(dotaPatchNotesUrl);
  url.searchParams.set("version", latest.patch_number);
  url.searchParams.set("language", "russian");

  const notes = await getJson<DotaPatchNotesResponse>(url);
  const details = formatOfficialPatchDetails(notes, cache);
  const fallbackDetails = details || "Официальный datafeed Dota 2 пока не вернул текст патча.";

  return {
    gid: latest.patch_number,
    title: latest.patch_name || latest.patch_number,
    url: `https://www.dota2.com/patches/${latest.patch_number}`,
    publishedAt: new Date(latest.patch_timestamp * 1000).toISOString(),
    summary: buildSummary(fallbackDetails),
    details: fallbackDetails,
    source: "dota2",
  };
}

async function fetchLatestSteamPatchNews(): Promise<PatchNewsItem> {
  const url = new URL(steamNewsUrl);
  url.searchParams.set("appid", String(dotaAppId));
  url.searchParams.set("count", "30");
  url.searchParams.set("maxlength", "18000");
  url.searchParams.set("format", "json");
  url.searchParams.set("l", "russian");

  const data = await getJson<SteamNewsResponse>(url);
  const items = data.appnews?.newsitems ?? [];
  const patch = items.find(isOfficialSteamPatchNews);

  if (!patch) {
    throw new Error("Steam news did not return an official Dota 2 patch item.");
  }

  const details = cleanNewsContents(patch.contents ?? "");
  const fallbackDetails = details || "Steam пока не вернул текст обновления. Открой источник, чтобы посмотреть патчноут целиком.";

  return {
    gid: patch.gid,
    title: patch.title,
    url: patch.url || `https://store.steampowered.com/news/app/${dotaAppId}/view/${patch.gid}`,
    publishedAt: new Date(patch.date * 1000).toISOString(),
    summary: buildSummary(fallbackDetails),
    details: fallbackDetails,
    source: "steam",
  };
}

async function getJson<T>(url: string | URL): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "dota-2-discord-bot/0.1" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Patch request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Patch request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function formatOfficialPatchDetails(notes: DotaPatchNotesResponse, cache: DotaCache | null): string {
  const lines: string[] = [`Патч ${notes.patch_name || notes.patch_number}`];

  for (const section of notes.general_notes ?? []) {
    if (section.title) {
      lines.push("", section.title);
    }
    appendNotes(lines, section.generic ?? []);
  }

  appendAbilityChanges(lines, "Предметы", notes.items ?? [], cache);
  appendAbilityChanges(lines, "Нейтральные предметы", notes.neutral_items ?? [], cache);
  appendHeroChanges(lines, notes.heroes ?? [], cache);

  return lines.join("\n").trim();
}

function appendAbilityChanges(
  lines: string[],
  title: string,
  changes: DotaPatchAbilityChange[],
  cache: DotaCache | null,
): void {
  if (changes.length === 0) {
    return;
  }

  lines.push("", title);
  for (const change of changes) {
    lines.push(`• ${findItemName(cache, change.ability_id) ?? `ID ${change.ability_id}`}`);
    appendNotes(lines, change.ability_notes ?? [], 1);
  }
}

function appendHeroChanges(
  lines: string[],
  heroes: DotaPatchHeroChange[],
  cache: DotaCache | null,
): void {
  if (heroes.length === 0) {
    return;
  }

  lines.push("", "Герои");
  for (const hero of heroes) {
    lines.push(`• ${findHeroName(cache, hero.hero_id) ?? `Герой ID ${hero.hero_id}`}`);
    appendNotes(lines, hero.hero_notes ?? [], 1);

    if ((hero.talent_notes ?? []).length > 0) {
      lines.push("  Таланты");
      appendNotes(lines, hero.talent_notes ?? [], 2);
    }

    for (const ability of hero.abilities ?? []) {
      appendNotes(lines, ability.ability_notes ?? [], 1);
    }
  }
}

function appendNotes(lines: string[], notes: DotaPatchNote[], baseIndent = 0): void {
  for (const note of notes) {
    const indent = "  ".repeat(baseIndent + Math.max((note.indent_level ?? 1) - 1, 0));
    lines.push(`${indent}- ${note.note}`);
  }
}

function findHeroName(cache: DotaCache | null, heroId: number): string | undefined {
  return cache?.heroes.find((hero) => hero.id === heroId)?.localized_name;
}

function findItemName(cache: DotaCache | null, abilityId: number): string | undefined {
  const item = Object.values(cache?.items ?? {}).find((value) => value.id === abilityId);
  return item?.dname ?? item?.name;
}

function isOfficialSteamPatchNews(item: SteamNewsItem): boolean {
  if (item.feedname !== "steam_community_announcements") {
    return false;
  }

  const title = item.title.toLowerCase();
  return /\d+\.\d+[a-z]?\s+gameplay patch/.test(title)
    || title.includes("dota 2 update")
    || title.includes("patch notes")
    || title.includes("патч")
    || title.includes("обновление");
}

function buildSummary(details: string): string[] {
  const lines = splitMeaningfulLines(details);
  const preferred = lines.filter((line) =>
    /геро|предмет|исправ|измен|обнов|баланс|способност|увелич|уменьш|добав/i.test(line),
  );
  const selected = (preferred.length > 0 ? preferred : lines).slice(0, 5);

  return selected.map((line) => truncate(line, 220));
}

function cleanNewsContents(contents: string): string {
  return decodeHtmlEntities(contents)
    .replace(/\[img\].*?\[\/img\]/gis, "")
    .replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/gis, "$2 ($1)")
    .replace(/\[\/?(?:b|i|u|h1|h2|h3|list|olist|\*|quote|code|table|tr|th|td)[^\]]*\]/gis, "")
    .replace(/\[\/?url[^\]]*\]/gis, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function splitMeaningfulLines(details: string): string[] {
  return details
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter((line) => line.length >= 12 && !line.startsWith("http"))
    .slice(0, 120);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
