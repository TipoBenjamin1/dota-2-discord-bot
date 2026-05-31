import "dotenv/config";

export type AppConfig = {
  discordToken: string;
  discordClientId: string;
  discordGuildId?: string;
  refreshIntervalMinutes: number;
  patchAnnounceChannelId?: string;
  patchCheckIntervalMinutes: number;
  patchMentionCount: number;
  announcePatchOnFirstStart: boolean;
};

export function getConfig(): AppConfig {
  const refreshIntervalMinutes = Number.parseInt(
    process.env.DATA_REFRESH_INTERVAL_MINUTES ?? "60",
    10,
  );
  const patchCheckIntervalMinutes = Number.parseInt(
    process.env.PATCH_CHECK_INTERVAL_MINUTES ?? "30",
    10,
  );
  const patchMentionCount = Number.parseInt(
    process.env.PATCH_MENTION_COUNT ?? "3",
    10,
  );

  return {
    discordToken: process.env.DISCORD_TOKEN ?? "",
    discordClientId: process.env.DISCORD_CLIENT_ID ?? "",
    discordGuildId: process.env.DISCORD_GUILD_ID || undefined,
    refreshIntervalMinutes: Number.isFinite(refreshIntervalMinutes)
      ? refreshIntervalMinutes
      : 60,
    patchAnnounceChannelId: process.env.PATCH_ANNOUNCE_CHANNEL_ID || undefined,
    patchCheckIntervalMinutes: Number.isFinite(patchCheckIntervalMinutes)
      ? patchCheckIntervalMinutes
      : 30,
    patchMentionCount: Number.isFinite(patchMentionCount)
      ? Math.min(Math.max(patchMentionCount, 1), 3)
      : 3,
    announcePatchOnFirstStart: process.env.PATCH_ANNOUNCE_ON_FIRST_START === "true",
  };
}

export function assertDiscordConfig(config: AppConfig): void {
  const missing = [
    ["DISCORD_TOKEN", config.discordToken],
    ["DISCORD_CLIENT_ID", config.discordClientId],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.map(([name]) => name).join(", ")}`,
    );
  }
}
