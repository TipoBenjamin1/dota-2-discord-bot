import { Client, Events, GatewayIntentBits, type MessageCreateOptions } from "discord.js";
import { getConfig, assertDiscordConfig } from "./config.js";
import { refreshData } from "./data/refresh.js";
import {
  formatRatings,
  formatItemsEmbed,
  formatBadItemsEmbed,
  formatHeroSummaryEmbed,
  formatDraftEmbed,
  formatPatchSummaryEmbed,
  buildPatchDetailsButton,
  formatPatchDetailsEmbeds,
} from "./discord/formatters.js";
import { readPosition } from "./discord/commands.js";
import {
  getCounters,
  getMeta,
  getPatchInfo,
  getWorst,
  getItems,
  getBadItems,
  getLaneCombo,
  getGameCombo,
  getHeroSummary,
  getDraft,
} from "./services/metaService.js";
import {
  getAnnouncedPatchGid,
  getCachedPatchNews,
  getLatestPatchNews,
  isPatchAlreadyAnnounced,
  markPatchAnnounced,
} from "./services/patchService.js";

const config = getConfig();
assertDiscordConfig(config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  await refreshDataWithLog();
  await checkPatchAnnouncementsWithLog();

  const intervalMs = config.refreshIntervalMinutes * 60 * 1000;
  setInterval(refreshDataWithLog, intervalMs).unref();

  const patchIntervalMs = config.patchCheckIntervalMinutes * 60 * 1000;
  setInterval(checkPatchAnnouncementsWithLog, patchIntervalMs).unref();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith("patch_details:")) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const gid = interaction.customId.split(":")[1];
      const patch = (await getCachedPatchNews(gid)) ?? await getLatestPatchNews();
      const detailEmbeds = formatPatchDetailsEmbeds(patch);
      await interaction.editReply({ embeds: detailEmbeds.slice(0, 1) });

      for (const embed of detailEmbeds.slice(1)) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        error instanceof Error ? `Ошибка: ${error.message}` : "Неизвестная ошибка.",
      );
    }

    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  await interaction.deferReply();

  try {
    if (interaction.commandName === "meta") {
      const position = readPosition(interaction.options.getString("position"));
      const ratings = await getMeta(position);
      const embed = formatRatings("Текущая мета героев", ratings, "#2ecc71");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "worst") {
      const position = readPosition(interaction.options.getString("position"));
      const ratings = await getWorst(position);
      const embed = formatRatings("Слабые герои меты", ratings, "#e74c3c");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "counter") {
      const hero = interaction.options.getString("hero", true);
      const position = readPosition(interaction.options.getString("position"));
      const ratings = await getCounters(hero, position);
      const embed = formatRatings(`Контрпики против ${hero}`, ratings, "#e74c3c");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "synergy") {
      const hero = interaction.options.getString("hero", true);
      const ratings = await getGameCombo(hero); // перенаправляем на новые синергии
      const embed = formatRatings(`Связки для ${hero} по игре`, ratings, "#3498db");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "lane_combo") {
      const hero = interaction.options.getString("hero", true);
      const ratings = await getLaneCombo(hero);
      const embed = formatRatings(`Лучшие связки на линии для ${hero}`, ratings, "#2ecc71");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "game_combo") {
      const hero = interaction.options.getString("hero", true);
      const ratings = await getGameCombo(hero);
      const embed = formatRatings(`Синергичные связки по игре для ${hero}`, ratings, "#3498db");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "items") {
      const position = readPosition(interaction.options.getString("position", true));
      if (!position) {
        throw new Error("Неверная позиция.");
      }
      const result = await getItems(position);
      const embed = formatItemsEmbed(result);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "bad_items") {
      const position = readPosition(interaction.options.getString("position", true));
      if (!position) {
        throw new Error("Неверная позиция.");
      }
      const result = await getBadItems(position);
      const embed = formatBadItemsEmbed(position, result);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "hero") {
      const hero = interaction.options.getString("hero", true);
      const summary = await getHeroSummary(hero);
      const embed = formatHeroSummaryEmbed(summary);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "draft") {
      const enemiesRaw = interaction.options.getString("enemies", true);
      const alliesRaw = interaction.options.getString("allies");
      const position = readPosition(interaction.options.getString("position", true));
      if (!position) throw new Error("Неверная позиция.");

      const enemyNames = enemiesRaw.trim().split(/\s+/);
      const allyNames = alliesRaw?.trim() ? alliesRaw.trim().split(/\s+/) : [];
      const { picks, enemyNotFound, allyNotFound } = await getDraft(enemyNames, position, allyNames);
      const embed = formatDraftEmbed(picks, enemyNames, allyNames, position, enemyNotFound, allyNotFound);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "patch") {
      const [patch, info] = await Promise.all([getLatestPatchNews(), getPatchInfo()]);
      const embed = formatPatchSummaryEmbed(patch, info.updatedAt);
      await interaction.editReply({
        embeds: [embed],
        components: [buildPatchDetailsButton(patch)],
      });
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      error instanceof Error ? `Ошибка: ${error.message}` : "Неизвестная ошибка.",
    );
  }
});

await client.login(config.discordToken);

async function refreshDataWithLog(): Promise<void> {
  try {
    await refreshData();
    console.log("Dota data refreshed.");
  } catch (error) {
    console.error("Failed to refresh Dota data:", error);
  }
}

async function checkPatchAnnouncementsWithLog(): Promise<void> {
  try {
    await checkPatchAnnouncements();
  } catch (error) {
    console.error("Failed to check Dota patch announcements:", error);
  }
}

async function checkPatchAnnouncements(): Promise<void> {
  if (!config.patchAnnounceChannelId) {
    return;
  }

  const patch = await getLatestPatchNews();
  if (await isPatchAlreadyAnnounced(patch.gid)) {
    return;
  }

  const announcedPatchGid = await getAnnouncedPatchGid();
  if (!announcedPatchGid && !config.announcePatchOnFirstStart) {
    await markPatchAnnounced(patch.gid);
    console.log(`Patch baseline saved without announcement: ${patch.title}`);
    return;
  }

  const channel = await client.channels.fetch(config.patchAnnounceChannelId);
  if (!channel || !("send" in channel)) {
    throw new Error("Patch announce channel was not found or is not sendable.");
  }

  const sendable = channel as { send(options: MessageCreateOptions): Promise<unknown> };
  const mentionText = "@everyone";
  await sendable.send({
    content: `${mentionText} Новый патч Dota 2: **${patch.title}**`,
    embeds: [formatPatchSummaryEmbed(patch)],
    components: [buildPatchDetailsButton(patch)],
    allowedMentions: { parse: ["everyone"] },
  });

  for (let i = 1; i < config.patchMentionCount; i += 1) {
    await sleep(1200);
    await sendable.send({
      content: `${mentionText} Патч **${patch.title}** вышел. Подробности в сообщении выше.`,
      allowedMentions: { parse: ["everyone"] },
    });
  }

  await markPatchAnnounced(patch.gid);
  console.log(`Patch announced: ${patch.title}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
