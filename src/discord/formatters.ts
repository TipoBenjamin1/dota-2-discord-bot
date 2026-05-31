import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { positionLabels } from "../positions.js";
import { positions, type HeroRating, type PatchNewsItem, type Position } from "../types.js";
import type { BadItemDetail, DraftResult, HeroSummaryResult, PositionItemsResult } from "../services/metaService.js";

export function formatRatings(title: string, ratings: HeroRating[], color = "#2ecc71"): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color as any)
    .setTimestamp();

  if (ratings.length === 0) {
    embed.setDescription("Нет достаточно надежных данных.");
    return embed;
  }

  const grouped = new Map<Position, HeroRating[]>();
  for (const position of positions) {
    const items = ratings.filter((rating) => rating.position === position);
    if (items.length > 0) {
      grouped.set(position, items);
    }
  }

  for (const [position, items] of grouped.entries()) {
    const lines = items.map((rating, index) => {
      const reasons = rating.reasons.length > 0 ? `\n└ *${rating.reasons.join(", ")}*` : "";
      return `${index + 1}. **${rating.name}** — WR: **${rating.winrate}%** (Pick: ${rating.pickrate}%, ${rating.matches} игр)${reasons}`;
    });

    embed.addFields({
      name: `📍 ${positionLabels[position]}`,
      value: lines.join("\n"),
      inline: false,
    });
  }

  return embed;
}

export function formatItemsEmbed(itemsResult: PositionItemsResult): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`📦 Рекомендуемые предметы: ${positionLabels[itemsResult.position]}`)
    .setColor("#3498db")
    .setTimestamp();

  const formatStage = (items: { name: string; cost: number }[]) => {
    if (items.length === 0) return "Нет данных";
    return items.map(item => `• **${item.name}** (${item.cost}💰)`).join("\n");
  };

  embed.addFields(
    { name: "🎬 Стартовый закуп", value: formatStage(itemsResult.start), inline: true },
    { name: "⏱️ Ранняя игра", value: formatStage(itemsResult.early), inline: true },
    { name: "\u200b", value: "\u200b", inline: false }, // разделитель линий
    { name: "⚔️ Средняя игра", value: formatStage(itemsResult.mid), inline: true },
    { name: "🏆 Поздняя игра", value: formatStage(itemsResult.late), inline: true }
  );

  return embed;
}

export function formatBadItemsEmbed(position: Position, badItems: BadItemDetail[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`⚠️ Неэффективные предметы: ${positionLabels[position]}`)
    .setDescription("Эти предметы не рекомендуется покупать на выбранной позиции — они замедляют ваш темп или не подходят под роль.")
    .setColor("#e74c3c")
    .setTimestamp();

  if (badItems.length === 0) {
    embed.addFields({ name: "Статус", value: "Все предметы хороши!" });
    return embed;
  }

  for (const item of badItems) {
    embed.addFields({
      name: `❌ ${item.name} (${item.cost}💰)`,
      value: `*${item.reason}*`,
      inline: false,
    });
  }

  return embed;
}

export function formatHeroSummaryEmbed(summary: HeroSummaryResult): EmbedBuilder {
  const attackEmoji = summary.hero.attack_type === "Melee" ? " Melee (Ближний бой)" : " Ranged (Дальний бой)";
  const embed = new EmbedBuilder()
    .setTitle(`⭐ Сводка по герою: ${summary.hero.localized_name}`)
    .setDescription(`**Основная роль:** ${positionLabels[summary.bestPosition]}\n**Тип атаки:** ${attackEmoji}\n**Роли:** ${summary.hero.roles.join(", ")}`)
    .setColor("#f1c40f")
    .setTimestamp();

  embed.addFields(
    {
      name: "📊 Статистика (High Bracket)",
      value: `• Винрейт: **${summary.winrate}%**\n• Пикрейт: **${summary.pickrate}%**\n• Сыграно матчей: **${summary.matches}**`,
      inline: false,
    },
    {
      name: "📦 Популярные предметы",
      value: `• **Старт:** ${summary.items.start.join(", ") || "—"}\n• **Ранние:** ${summary.items.early.join(", ") || "—"}\n• **Мидгейм:** ${summary.items.mid.join(", ") || "—"}\n• **Лейтгейм:** ${summary.items.late.join(", ") || "—"}`,
      inline: false,
    }
  );

  if (summary.counters.length > 0) {
    const counterLines = summary.counters.map((c, idx) => `${idx + 1}. **${c.name}** (Винрейт против вас: **${c.winrateVs}%**)`);
    embed.addFields({
      name: "🔨 Главные угрозы (Контрпики)",
      value: counterLines.join("\n"),
      inline: false,
    });
  }

  return embed;
}

export function formatDraftEmbed(
  picks: DraftResult[],
  enemyNames: string[],
  allyNames: string[],
  position: Position,
  enemyNotFound: string[],
  allyNotFound: string[],
): EmbedBuilder {
  const posLabel = positionLabels[position];
  const enemyList = enemyNames.join(", ");
  const allyList = allyNames.length > 0 ? allyNames.join(", ") : "не указаны";

  const embed = new EmbedBuilder()
    .setTitle(`🎯 Драфт — ${posLabel}`)
    .setDescription(`Враги: **${enemyList}**\nСоюзники: **${allyList}**`)
    .setColor("#9b59b6")
    .setTimestamp();

  if (picks.length === 0) {
    embed.addFields({ name: "Результат", value: "Не удалось подобрать героев. Попробуй другую позицию." });
    return embed;
  }

  for (const [i, pick] of picks.entries()) {
    const counters = pick.countersFound.length > 0
      ? `✅ Контрит: *${formatCompactList(pick.countersFound, 3)}*`
      : "*Нет явных контр-матчапов, но хорош на позиции*";
    const synergies = pick.synergiesFound.length > 0
      ? `🤝 Сочетается: *${formatCompactList(pick.synergiesFound, 3)}*`
      : allyNames.length > 0
        ? "*Без яркой синергии, но не ломает драфт*"
        : "";
    const roles = pick.hero.reasons.length > 0
      ? `🎭 Роли: *${formatCompactList(pick.hero.reasons, 3)}*`
      : "";

    embed.addFields({
      name: `${i + 1}. ${pick.hero.name} — WR: ${pick.hero.winrate}% (${pick.hero.matches} игр)`,
      value: truncateEmbedField([counters, synergies, roles].filter(Boolean).join("\n")),
      inline: false,
    });
  }

  const notFound = [
    ...enemyNotFound.map((name) => `враг: \`${name}\``),
    ...allyNotFound.map((name) => `союзник: \`${name}\``),
  ];

  if (notFound.length > 0) {
    embed.addFields({
      name: "⚠️ Не распознано",
      value: notFound.join(", "),
      inline: false,
    });
  }

  return embed;
}

function formatCompactList(items: string[], maxItems: number): string {
  const visible = items.slice(0, maxItems);
  const hiddenCount = items.length - visible.length;
  return hiddenCount > 0
    ? `${visible.join(", ")} +${hiddenCount}`
    : visible.join(", ");
}

function truncateEmbedField(value: string, maxLength = 900): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function formatUpdatedAt(updatedAt: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));
}

export function formatPatchSummaryEmbed(
  patch: PatchNewsItem,
  dataUpdatedAt?: string,
): EmbedBuilder {
  const summary = patch.summary.length > 0
    ? patch.summary.map((line) => `• ${line}`).join("\n")
    : "Steam пока не отдал краткое описание. Нажми `Подробнее..`, чтобы открыть текст обновления.";

  const embed = new EmbedBuilder()
    .setTitle(`Патч Dota 2: ${patch.title}`)
    .setURL(patch.url)
    .setColor("#e67e22")
    .setDescription(`**Краткое обновление:**\n${truncateEmbedText(summary, 2400)}`)
    .addFields({
      name: "Дата публикации",
      value: formatUpdatedAt(patch.publishedAt),
      inline: true,
    })
    .setTimestamp(new Date(patch.publishedAt));

  if (dataUpdatedAt) {
    embed.addFields({
      name: "Данные OpenDota",
      value: `обновлены ${formatUpdatedAt(dataUpdatedAt)}`,
      inline: true,
    });
  }

  return embed;
}

export function buildPatchDetailsButton(
  patch: PatchNewsItem,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`patch_details:${patch.gid}`)
      .setLabel("Подробнее..")
      .setStyle(ButtonStyle.Primary),
  );
}

export function formatPatchDetailsEmbeds(patch: PatchNewsItem): EmbedBuilder[] {
  const chunks = chunkText(patch.details, 3800).slice(0, 8);
  const embeds = chunks.map((chunk, index) => {
    const embed = new EmbedBuilder()
      .setColor("#e67e22")
      .setDescription(chunk)
      .setURL(patch.url);

    if (index === 0) {
      embed
        .setTitle(`Полный список обновления: ${patch.title}`)
        .setTimestamp(new Date(patch.publishedAt));
    }

    return embed;
  });

  if (patch.details.length > chunks.join("").length) {
    embeds.push(
      new EmbedBuilder()
        .setColor("#e67e22")
        .setDescription(`Discord не вместил весь текст. Полная версия: ${patch.url}`),
    );
  }

  return embeds.length > 0
    ? embeds
    : [
        new EmbedBuilder()
          .setTitle(`Полный список обновления: ${patch.title}`)
          .setColor("#e67e22")
          .setDescription(`Steam пока не вернул текст обновления. Полная версия: ${patch.url}`),
      ];
}

function chunkText(value: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let rest = value.trim();

  while (rest.length > 0) {
    if (rest.length <= maxLength) {
      chunks.push(rest);
      break;
    }

    const slice = rest.slice(0, maxLength);
    const splitAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"), slice.lastIndexOf(". "));
    const end = splitAt > maxLength * 0.45 ? splitAt + 1 : maxLength;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }

  return chunks;
}

function truncateEmbedText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
