export const positions = ["carry", "mid", "offlane", "support4", "support5"] as const;

export type Position = (typeof positions)[number];

export type OpenDotaHero = {
  id: number;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  pro_pick: number | null;
  pro_ban: number | null;
  pro_win: number | null;
  "7_pick": number;
  "7_win": number;
  "8_pick": number;
  "8_win": number;
};

export type HeroMatchup = {
  hero_id: number;
  games_played: number;
  wins: number;
};

export type DotaItem = {
  id: number;
  name?: string;
  dname?: string;
  cost: number;
  recipe?: number;
  secret_shop?: number;
};

export type HeroItemPopularity = {
  start_game_items: Record<string, number>;
  early_game_items: Record<string, number>;
  mid_game_items: Record<string, number>;
  late_game_items: Record<string, number>;
};

export type HeroRating = {
  heroId: number;
  name: string;
  position: Position;
  winrate: number;
  pickrate: number;
  matches: number;
  score: number;
  confidence: number;
  reasons: string[];
};

export type PatchNewsItem = {
  gid: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string[];
  details: string;
  source: "dota2" | "steam";
};

export type DotaCache = {
  source: "opendota";
  updatedAt: string;
  heroes: OpenDotaHero[];
  matchups: Record<string, HeroMatchup[]>;
  items: Record<string, DotaItem>;
  itemPopularity: Record<string, HeroItemPopularity>;
  patchNews?: PatchNewsItem;
  announcedPatchGid?: string;
};
