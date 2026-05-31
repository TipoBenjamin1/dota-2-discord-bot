import { fetchHeroMatchups, fetchHeroItemPopularity } from "../data/opendota.js";
import { readCache, writeCache } from "../data/cache.js";
import { refreshData } from "../data/refresh.js";
import { heroCanPlayPosition, positionFit } from "../positions.js";
import { positions, type DotaCache, type DotaItem, type HeroItemPopularity, type HeroRating, type OpenDotaHero, type Position } from "../types.js";
import { resolveHeroName } from "../heroNames.js";

const minimumMatches = 250;

function bracketMatches(hero: OpenDotaHero): number {
  return (hero["7_pick"] ?? 0) + (hero["8_pick"] ?? 0);
}

function bracketWins(hero: OpenDotaHero): number {
  return (hero["7_win"] ?? 0) + (hero["8_win"] ?? 0);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function getHeroWinrate(hero: OpenDotaHero): number {
  const matches = bracketMatches(hero);
  return matches > 0 ? bracketWins(hero) / matches : 0;
}

function getHeroPickrate(hero: OpenDotaHero, totalMatches: number): number {
  if (totalMatches === 0) {
    return 0;
  }

  return bracketMatches(hero) / totalMatches;
}

function confidence(matches: number): number {
  return Math.min(1, Math.log10(Math.max(matches, 1)) / 4);
}

function buildRating(
  hero: OpenDotaHero,
  position: Position,
  totalMatches: number,
): HeroRating {
  const matches = bracketMatches(hero);
  const winrate = getHeroWinrate(hero);
  const pickrate = getHeroPickrate(hero, totalMatches);
  const fit = positionFit(hero, position);
  const dataConfidence = confidence(matches);
  const score =
    winrate * 0.55 + Math.min(pickrate * 12, 1) * 0.2 + fit * 0.15 + dataConfidence * 0.1;

  return {
    heroId: hero.id,
    name: hero.localized_name,
    position,
    winrate: round(winrate * 100),
    pickrate: round(pickrate * 100),
    matches,
    score,
    confidence: round(dataConfidence * 100),
    reasons: hero.roles.slice(0, 3),
  };
}

function totalMatches(heroes: OpenDotaHero[]): number {
  return heroes.reduce((sum, hero) => sum + bracketMatches(hero), 0);
}

async function requireCache(): Promise<DotaCache> {
  let cache = await readCache();
  if (cache && cache.items && Object.keys(cache.items).length > 0) {
    return cache;
  }

  await refreshData();
  const refreshed = await readCache();

  if (!refreshed) {
    throw new Error("Data cache was not created");
  }

  return refreshed;
}

async function requireHeroItems(heroId: number, cache: DotaCache): Promise<HeroItemPopularity> {
  if (!cache.itemPopularity) {
    cache.itemPopularity = {};
  }
  let popularity = cache.itemPopularity[String(heroId)];
  if (!popularity) {
    popularity = await fetchHeroItemPopularity(heroId);
    cache.itemPopularity[String(heroId)] = popularity;
    await writeCache(cache);
  }
  return popularity;
}

export async function getMeta(position?: Position): Promise<HeroRating[]> {
  const cache = await requireCache();
  const total = totalMatches(cache.heroes);
  const positions = position ? [position] : (["carry", "mid", "offlane", "support4", "support5"] as const);

  return positions.flatMap((pos) =>
    cache.heroes
      .filter((hero) => heroCanPlayPosition(hero, pos) && bracketMatches(hero) >= minimumMatches)
      .map((hero) => buildRating(hero, pos, total))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );
}

export async function getWorst(position?: Position): Promise<HeroRating[]> {
  const cache = await requireCache();
  const total = totalMatches(cache.heroes);
  const positions = position ? [position] : (["carry", "mid", "offlane", "support4", "support5"] as const);

  return positions.flatMap((pos) =>
    cache.heroes
      .filter((hero) => heroCanPlayPosition(hero, pos) && bracketMatches(hero) >= minimumMatches)
      .map((hero) => buildRating(hero, pos, total))
      .sort((a, b) => a.winrate - b.winrate || b.matches - a.matches)
      .slice(0, 5),
  );
}

export async function getCounters(heroName: string, position?: Position): Promise<HeroRating[]> {
  const cache = await requireCache();
  const selectedHero = findHero(cache.heroes, heroName);

  if (!selectedHero) {
    throw new Error(`Hero not found: ${heroName}`);
  }

  let matchups = cache.matchups[String(selectedHero.id)];

  if (!matchups) {
    matchups = await fetchHeroMatchups(selectedHero.id);
    cache.matchups[String(selectedHero.id)] = matchups;
    await writeCache(cache);
  }

  const heroesById = new Map(cache.heroes.map((hero) => [hero.id, hero]));
  const total = totalMatches(cache.heroes);
  const positions = position ? [position] : (["carry", "mid", "offlane", "support4", "support5"] as const);

  return positions.flatMap((pos) =>
    matchups
      .filter((matchup) => matchup.games_played >= 50)
      .map((matchup) => {
        const hero = heroesById.get(matchup.hero_id);
        if (!hero || !heroCanPlayPosition(hero, pos)) {
          return null;
        }

        const selectedWinrate = matchup.wins / matchup.games_played;
        const rating = buildRating(hero, pos, total);
        return {
          ...rating,
          score:
            (1 - selectedWinrate) * 0.6 +
            rating.score * 0.25 +
            confidence(matchup.games_played) * 0.15,
          reasons: [`${round((1 - selectedWinrate) * 100)}% vs ${selectedHero.localized_name}`, ...rating.reasons],
        };
      })
      .filter((rating): rating is HeroRating => rating !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
  );
}

export async function getSynergy(heroName: string): Promise<HeroRating[]> {
  const cache = await requireCache();
  const selectedHero = findHero(cache.heroes, heroName);

  if (!selectedHero) {
    throw new Error(`Hero not found: ${heroName}`);
  }

  const total = totalMatches(cache.heroes);
  const wantedPositions = selectedHero.roles.includes("Carry")
    ? (["support5", "support4"] as const)
    : selectedHero.roles.includes("Support")
      ? (["carry", "offlane", "mid"] as const)
      : (["support4", "support5", "offlane"] as const);

  return wantedPositions.flatMap((position) =>
    cache.heroes
      .filter((hero) => hero.id !== selectedHero.id && heroCanPlayPosition(hero, position))
      .map((hero) => {
        const rating = buildRating(hero, position, total);
        const sharedControl = selectedHero.roles.includes("Disabler") && hero.roles.includes("Nuker");
        const laneBalance = selectedHero.attack_type !== hero.attack_type;

        return {
          ...rating,
          score: rating.score + (sharedControl ? 0.08 : 0) + (laneBalance ? 0.04 : 0),
          reasons: [
            laneBalance ? "другой тип атаки" : "похожий темп",
            sharedControl ? "контроль + урон" : "дополняет роль",
            ...rating.reasons.slice(0, 2),
          ],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
  );
}

export async function getPatchInfo(): Promise<{ updatedAt: string; heroCount: number }> {
  const cache = await requireCache();

  return {
    updatedAt: cache.updatedAt,
    heroCount: cache.heroes.length,
  };
}

function findHero(heroes: OpenDotaHero[], query: string): OpenDotaHero | undefined {
  // Пробуем через словарь русских имён
  const resolved = resolveHeroName(query);
  if (resolved) {
    const found = heroes.find((hero) => hero.localized_name === resolved);
    if (found) return found;
  }

  // Фоллбэк — нормализованный поиск по английскому имени
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return undefined;
  }

  return heroes.find((hero) => normalize(hero.localized_name) === normalizedQuery)
    ?? heroes.find((hero) => normalize(hero.localized_name).includes(normalizedQuery));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type DraftResult = {
  hero: HeroRating;
  countersFound: string[];
  synergiesFound: string[];
};

export async function getDraft(
  enemyNames: string[],
  position: Position,
  allyNames: string[] = [],
): Promise<{ picks: DraftResult[]; enemyNotFound: string[]; allyNotFound: string[] }> {
  const cache = await requireCache();
  const total = totalMatches(cache.heroes);

  // Резолвим врагов
  const enemyNotFound: string[] = [];
  const enemyHeroes: OpenDotaHero[] = [];

  for (const name of enemyNames) {
    const hero = findHero(cache.heroes, name);
    if (hero) {
      enemyHeroes.push(hero);
    } else {
      enemyNotFound.push(name);
    }
  }

  const allyNotFound: string[] = [];
  const allyHeroes: OpenDotaHero[] = [];

  for (const name of allyNames) {
    const hero = findHero(cache.heroes, name);
    if (hero) {
      allyHeroes.push(hero);
    } else {
      allyNotFound.push(name);
    }
  }

  // Собираем матчапы для всех вражеских героев параллельно
  const matchupsByEnemy = new Map<number, Map<number, number>>();

  await Promise.all(enemyHeroes.map(async (enemy) => {
    let matchups = cache.matchups[String(enemy.id)];
    if (!matchups) {
      matchups = await fetchHeroMatchups(enemy.id);
      cache.matchups[String(enemy.id)] = matchups;
    }

    const winrateMap = new Map<number, number>();
    for (const m of matchups) {
      if (m.games_played >= 30) {
        winrateMap.set(m.hero_id, (1 - m.wins / m.games_played));
      }
    }
    matchupsByEnemy.set(enemy.id, winrateMap);
  }));

  // Сохраняем кэш один раз после всех запросов
  await writeCache(cache);

  // Считаем скор для каждого кандидата на нужной позиции
  const candidates = cache.heroes
    .filter((hero) =>
      heroCanPlayPosition(hero, position)
      && bracketMatches(hero) >= minimumMatches
      && !enemyHeroes.some((enemy) => enemy.id === hero.id)
      && !allyHeroes.some((ally) => ally.id === hero.id)
    )
    .map((hero) => {
      const baseRating = buildRating(hero, position, total);

      // Считаем сколько врагов этот герой контрит
      let counterScore = 0;
      const countersFound: string[] = [];

      for (const enemy of enemyHeroes) {
        const winrateVsEnemy = matchupsByEnemy.get(enemy.id)?.get(hero.id);
        if (winrateVsEnemy !== undefined && winrateVsEnemy > 0.52) {
          counterScore += winrateVsEnemy;
          const wr = Math.round(winrateVsEnemy * 100);
          countersFound.push(`${enemy.localized_name} (${wr}% WR)`);
        }
      }

      const avgCounterBonus = enemyHeroes.length > 0 ? counterScore / enemyHeroes.length : 0;
      let synergyScore = 0;
      const synergiesFound: string[] = [];

      for (const ally of allyHeroes) {
        const synergy = evaluateHeroSynergy(hero, ally);
        synergyScore += synergy.score;
        const strongestReason = synergy.reasons[0];
        if (strongestReason) {
          synergiesFound.push(strongestReason);
        }
      }

      const avgSynergyBonus = allyHeroes.length > 0 ? synergyScore / allyHeroes.length : 0;
      const lowWinratePenalty = Math.max(0, 49 - baseRating.winrate) * 0.025;
      const finalScore =
        baseRating.score * 0.55
        + avgCounterBonus * 0.3
        + avgSynergyBonus * 0.15
        - lowWinratePenalty;

      return {
        hero: { ...baseRating, score: finalScore },
        countersFound,
        synergiesFound: [...new Set(synergiesFound)].slice(0, 4),
      };
    })
    .sort((a, b) => b.hero.score - a.hero.score)
    .slice(0, 5);

  return { picks: candidates, enemyNotFound, allyNotFound };
}

function evaluateHeroSynergy(candidate: OpenDotaHero, ally: OpenDotaHero): { score: number; reasons: string[] } {
  const candidateRoles = new Set(candidate.roles);
  const allyRoles = new Set(ally.roles);
  const reasons: string[] = [];
  let score = 0;

  const disableNuke =
    (candidateRoles.has("Disabler") && allyRoles.has("Nuker"))
    || (candidateRoles.has("Nuker") && allyRoles.has("Disabler"));
  if (disableNuke) {
    score += 0.32;
    reasons.push(`${ally.localized_name}: контроль + взрывной урон`);
  }

  const candidateSavesCarry =
    allyRoles.has("Carry")
    && candidateRoles.has("Support")
    && ["Dazzle", "Oracle", "Omniknight", "Abaddon", "Shadow Demon", "Winter Wyvern", "Io"].includes(candidate.localized_name);
  if (candidateSavesCarry) {
    score += 0.3;
    reasons.push(`${ally.localized_name}: сейв/поддержка керри`);
  }

  const candidateUsesSetup =
    candidateRoles.has("Carry")
    && (allyRoles.has("Disabler") || allyRoles.has("Initiator"));
  if (candidateUsesSetup) {
    score += 0.22;
    reasons.push(`${ally.localized_name}: хорошо реализует контроль`);
  }

  const teamfightChain =
    candidateRoles.has("Initiator")
    && (allyRoles.has("Disabler") || allyRoles.has("Initiator"));
  if (teamfightChain) {
    score += 0.18;
    reasons.push(`${ally.localized_name}: продолжает инициацию`);
  }

  const supportCarryPair =
    candidateRoles.has("Support")
    && allyRoles.has("Carry");
  if (supportCarryPair) {
    score += 0.16;
    reasons.push(`${ally.localized_name}: полезен для кор-героя`);
  }

  if (candidate.attack_type !== ally.attack_type) {
    score += 0.08;
    reasons.push(`${ally.localized_name}: другой тип атаки`);
  }

  return {
    score: Math.min(score, 0.75),
    reasons,
  };
}

// ==========================================
// ИНФОРМАЦИЯ О ПРЕДМЕТАХ И ЭВРИСТИКИ ПО РОЛЯМ
// ==========================================

export type PositionItemDetail = {
  name: string;
  cost: number;
  count: number;
};

export type PositionItemsResult = {
  position: Position;
  start: PositionItemDetail[];
  early: PositionItemDetail[];
  mid: PositionItemDetail[];
  late: PositionItemDetail[];
};

export type BadItemDetail = {
  name: string;
  cost: number;
  reason: string;
};

const badItemsHeuristics: Record<Position, { name: string; reason: string }[]> = {
  carry: [
    { name: "Glimmer Cape", reason: "Чисто защитный предмет для саппортов, не дает урона керри." },
    { name: "Force Staff", reason: "Саппортский сейв-предмет. Керри предпочитают Hurricane Pike." },
    { name: "Mekansm", reason: "Тратит ману, которой у керри мало, и не дает атакующих характеристик." },
    { name: "Pipe of Insight", reason: "Защитная аура для оффлейнеров, сильно замедляет темп фарма керри." },
  ],
  mid: [
    { name: "Glimmer Cape", reason: "Замедляет темп мидера и тратит слот на саппортский сейв." },
    { name: "Mekansm", reason: "Требует много маны для активации, снижая боевой потенциал активного мидера." },
    { name: "Observer Ward", reason: "Покупка вардов — задача саппортов, мидер должен фармить и гангать." },
  ],
  offlane: [
    { name: "Battle Fury", reason: "Слишком медленный предмет для фарма, оффлейнер должен создавать пространство, а не фармить лес." },
    { name: "Daedalus", reason: "Чистый урон без выживаемости. Оффлейнерам нужны ауры и инициация." },
    { name: "Desolator", reason: "Редко подходит третьей позиции, так как не дает брони или здоровья." },
  ],
  support4: [
    { name: "Battle Fury", reason: "Предмет ближнего боя для фарма керри. Полностью бесполезен для саппорта." },
    { name: "Radiance", reason: "Слишком дорогой предмет, который саппорт не сможет собрать вовремя." },
    { name: "Hand of Midas", reason: "Жадный предмет. Замедляет покупку полезных командных артефактов." },
    { name: "Daedalus", reason: "Чистый физический урон. Саппорты наносят урон способностями." },
  ],
  support5: [
    { name: "Battle Fury", reason: "Абсолютно бесполезен для саппорта 5-й позиции, лишает команду вардов и сейва." },
    { name: "Radiance", reason: "Слишком дорогая аура, саппорту 5-й позиции не хватит золота." },
    { name: "Hand of Midas", reason: "Крайне жадный предмет, руинит раннюю игру команды." },
    { name: "Butterfly", reason: "Дает ловкость и уклонение, бесполезные для позиционки саппорта." },
  ],
};

export async function getItems(position: Position): Promise<PositionItemsResult> {
  const cache = await requireCache();
  const topHeroes = await getMeta(position);
  
  // Берем топ-3 лучших героев на роли для сбора статистики предметов
  const heroesToProcess = topHeroes.slice(0, 3);
  
  const startCounts: Record<string, number> = {};
  const earlyCounts: Record<string, number> = {};
  const midCounts: Record<string, number> = {};
  const lateCounts: Record<string, number> = {};
  
  for (const rating of heroesToProcess) {
    try {
      const popularity = await requireHeroItems(rating.heroId, cache);
      
      const aggregate = (source: Record<string, number> | undefined, target: Record<string, number>) => {
        if (!source) return;
        for (const [key, val] of Object.entries(source)) {
          target[key] = (target[key] ?? 0) + val;
        }
      };
      
      aggregate(popularity.start_game_items, startCounts);
      aggregate(popularity.early_game_items, earlyCounts);
      aggregate(popularity.mid_game_items, midCounts);
      aggregate(popularity.late_game_items, lateCounts);
    } catch (err) {
      console.error(`Failed to load items for hero ${rating.name}:`, err);
    }
  }
  
  const processStage = (counts: Record<string, number>, isLater: boolean) => {
    const list: PositionItemDetail[] = [];
    const ignored = new Set(["tango", "flask", "clarity", "ward_observer", "ward_sentry", "tpscroll", "smoke_of_deceit", "dust", "faerie_fire", "enchanted_mango"]);
    
    for (const [key, count] of Object.entries(counts)) {
      const item = findItem(key, cache.items);
      if (!item) continue;
      
      const itemName = item.name ?? "";
      const isRecipe = itemName.includes("recipe") || item.dname?.includes("Recipe") || item.cost === 0;
      if (isRecipe) {
        continue;
      }
      
      const normalizedName = itemName.replace("item_", "");
      if (isLater && ignored.has(normalizedName)) {
        continue;
      }
      
      list.push({
        name: item.dname ?? itemName ?? key,
        cost: item.cost,
        count,
      });
    }
    
    return list.sort((a, b) => b.count - a.count).slice(0, 4);
  };
  
  return {
    position,
    start: processStage(startCounts, false),
    early: processStage(earlyCounts, true),
    mid: processStage(midCounts, true),
    late: processStage(lateCounts, true),
  };
}

export async function getBadItems(position: Position): Promise<BadItemDetail[]> {
  const cache = await requireCache();
  const list = badItemsHeuristics[position] ?? [];
  
  return list.map(h => {
    const item = findItem(h.name, cache.items) 
      ?? Object.values(cache.items).find(i => i.dname?.toLowerCase() === h.name.toLowerCase());
    
    return {
      name: item?.dname ?? h.name,
      cost: item?.cost ?? 0,
      reason: h.reason,
    };
  });
}

function findItem(key: string, items: Record<string, DotaItem>): DotaItem | undefined {
  if (!items) return undefined;
  
  // Поиск по ID (так как в itemPopularity ключи - это ID в виде строк)
  const idNum = parseInt(key, 10);
  if (!isNaN(idNum)) {
    const foundById = Object.entries(items).find(([_, item]) => item.id === idNum);
    if (foundById) {
      foundById[1].name = foundById[0];
      return foundById[1];
    }
  }
  
  const normalizedKey = key.startsWith("item_") ? key.substring(5) : key;
  if (items[key]) {
    items[key].name = key;
    return items[key];
  }
  if (items[normalizedKey]) {
    items[normalizedKey].name = normalizedKey;
    return items[normalizedKey];
  }
  
  const found = Object.entries(items).find(([itemKey, _]) => itemKey === key || itemKey === normalizedKey);
  if (found) {
    found[1].name = found[0];
    return found[1];
  }
  
  return undefined;
}

export async function getLaneCombo(heroName: string): Promise<HeroRating[]> {
  const cache = await requireCache();
  const selectedHero = findHero(cache.heroes, heroName);

  if (!selectedHero) {
    throw new Error(`Hero not found: ${heroName}`);
  }

  // Определяем позицию выбранного героя (берем лучшую)
  const posFit = (pos: Position) => positionFit(selectedHero, pos);
  const bestPos = [...positions].sort((a, b) => posFit(b) - posFit(a))[0];

  // Определяем позицию напарника по линии
  let companionPos: Position = "support5";
  if (bestPos === "carry") {
    companionPos = "support5";
  } else if (bestPos === "support5") {
    companionPos = "carry";
  } else if (bestPos === "offlane") {
    companionPos = "support4";
  } else if (bestPos === "support4") {
    companionPos = "offlane";
  } else if (bestPos === "mid") {
    companionPos = "support4"; // для роумящего саппорта
  }

  const total = totalMatches(cache.heroes);

  return cache.heroes
    .filter((hero) => hero.id !== selectedHero.id && heroCanPlayPosition(hero, companionPos) && bracketMatches(hero) >= minimumMatches)
    .map((hero) => {
      const rating = buildRating(hero, companionPos, total);
      const isComplementaryAttack = selectedHero.attack_type !== hero.attack_type;
      const bothDisableNuke = (selectedHero.roles.includes("Disabler") && hero.roles.includes("Nuker")) || (selectedHero.roles.includes("Nuker") && hero.roles.includes("Disabler"));

      let score = rating.score + (isComplementaryAttack ? 0.08 : 0) + (bothDisableNuke ? 0.06 : 0);
      const reasons: string[] = [];

      if (isComplementaryAttack) {
        reasons.push(selectedHero.attack_type === "Melee" ? "дальний бой + ваш ближний" : "ближний бой + ваш дальний");
      }
      if (bothDisableNuke) {
        reasons.push("контроль + взрывной урон");
      }
      
      reasons.push(...rating.reasons.slice(0, 2));

      return {
        ...rating,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export async function getGameCombo(heroName: string): Promise<HeroRating[]> {
  const cache = await requireCache();
  const selectedHero = findHero(cache.heroes, heroName);

  if (!selectedHero) {
    throw new Error(`Hero not found: ${heroName}`);
  }

  const total = totalMatches(cache.heroes);
  const savers = ["Dazzle", "Oracle", "Omniknight", "Abaddon", "Shadow Demon", "Winter Wyvern"];

  return cache.heroes
    .filter((hero) => hero.id !== selectedHero.id && bracketMatches(hero) >= minimumMatches)
    .map((hero) => {
      const bestPos = [...positions].sort((a, b) => positionFit(hero, b) - positionFit(hero, a))[0];
        
      const rating = buildRating(hero, bestPos, total);
      
      const teamfightAOE = selectedHero.roles.includes("Initiator") && hero.roles.includes("Initiator");
      const isSaver = selectedHero.roles.includes("Carry") && savers.includes(hero.localized_name);
      const disableNuke = (selectedHero.roles.includes("Disabler") && hero.roles.includes("Nuker")) || (selectedHero.roles.includes("Nuker") && hero.roles.includes("Disabler"));

      let score = rating.score + (teamfightAOE ? 0.12 : 0) + (isSaver ? 0.1 : 0) + (disableNuke ? 0.05 : 0);
      const reasons: string[] = [];

      if (teamfightAOE) {
        reasons.push("командный бой (АОЕ инициация)");
      }
      if (isSaver) {
        reasons.push("сейв для вашего керри");
      }
      if (disableNuke) {
        reasons.push("контроль + урон по игре");
      }
      
      reasons.push(...rating.reasons.slice(0, 2));

      return {
        ...rating,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export type HeroSummaryResult = {
  hero: OpenDotaHero;
  bestPosition: Position;
  winrate: number;
  pickrate: number;
  matches: number;
  items: {
    start: string[];
    early: string[];
    mid: string[];
    late: string[];
  };
  counters: { name: string; winrateVs: number }[];
};

export async function getHeroSummary(heroName: string): Promise<HeroSummaryResult> {
  const cache = await requireCache();
  const hero = findHero(cache.heroes, heroName);
  if (!hero) {
    throw new Error(`Hero not found: ${heroName}`);
  }

  const total = totalMatches(cache.heroes);
  const winrate = round(getHeroWinrate(hero) * 100);
  const pickrate = round(getHeroPickrate(hero, total) * 100);
  const matches = bracketMatches(hero);

  const posFit = (pos: Position) => positionFit(hero, pos);
  const bestPosition = [...positions].sort((a, b) => posFit(b) - posFit(a))[0];

  let startItems: string[] = [];
  let earlyItems: string[] = [];
  let midItems: string[] = [];
  let lateItems: string[] = [];

  try {
    const popularity = await requireHeroItems(hero.id, cache);
    
    const getTopItemsForStage = (stageCounts: Record<string, number> | undefined, isLater: boolean) => {
      if (!stageCounts) return [];
      const list: { name: string; count: number }[] = [];
      const ignored = new Set(["tango", "flask", "clarity", "ward_observer", "ward_sentry", "tpscroll", "smoke_of_deceit", "dust", "faerie_fire", "enchanted_mango"]);
      
      for (const [key, count] of Object.entries(stageCounts)) {
        const item = findItem(key, cache.items);
        if (!item) continue;
        
        const isRecipe = item.name?.includes("recipe") || item.dname?.includes("Recipe") || item.cost === 0;
        if (isRecipe) continue;
        
        const normalizedName = (item.name ?? "").replace("item_", "");
        if (isLater && ignored.has(normalizedName)) continue;
        
        list.push({ name: item.dname ?? item.name ?? key, count });
      }
      return list.sort((a, b) => b.count - a.count).slice(0, 3).map(i => i.name);
    };

    startItems = getTopItemsForStage(popularity.start_game_items, false);
    earlyItems = getTopItemsForStage(popularity.early_game_items, true);
    midItems = getTopItemsForStage(popularity.mid_game_items, true);
    lateItems = getTopItemsForStage(popularity.late_game_items, true);
  } catch (err) {
    console.error(`Failed to load items for hero summary of ${hero.localized_name}:`, err);
  }

  let countersList: { name: string; winrateVs: number }[] = [];
  try {
    const matchups = await getCounters(hero.localized_name);
    const seen = new Set<string>();
    for (const c of matchups) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      
      let winrateVs = 50;
      if (c.reasons[0] && c.reasons[0].includes("% vs")) {
        const match = c.reasons[0].match(/(\d+(\.\d+)?)%/);
        if (match) winrateVs = parseFloat(match[1]);
      }
      
      countersList.push({ name: c.name, winrateVs });
      if (countersList.length >= 3) break;
    }
  } catch (err) {
    console.error(`Failed to load counters for hero summary of ${hero.localized_name}:`, err);
  }

  return {
    hero,
    bestPosition,
    winrate,
    pickrate,
    matches,
    items: {
      start: startItems,
      early: earlyItems,
      mid: midItems,
      late: lateItems,
    },
    counters: countersList,
  };
}
