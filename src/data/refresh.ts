import { fetchHeroStats, fetchItemsConstants } from "./opendota.js";
import { readCache, writeCache } from "./cache.js";

export async function refreshData(): Promise<void> {
  const heroes = await fetchHeroStats();
  const items = await fetchItemsConstants();
  const existing = await readCache();

  await writeCache({
    source: "opendota",
    updatedAt: new Date().toISOString(),
    heroes,
    matchups: existing?.matchups ?? {},
    items,
    itemPopularity: existing?.itemPopularity ?? {},
    patchNews: existing?.patchNews,
    announcedPatchGid: existing?.announcedPatchGid,
  });
}
