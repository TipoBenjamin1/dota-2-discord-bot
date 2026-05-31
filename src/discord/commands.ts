import {
  SlashCommandBuilder,
  type APIApplicationCommandOptionChoice,
} from "discord.js";
import { positions, type Position } from "../types.js";

export const positionChoices: APIApplicationCommandOptionChoice<string>[] = [
  { name: "Carry", value: "carry" },
  { name: "Mid", value: "mid" },
  { name: "Offlane", value: "offlane" },
  { name: "Soft Support", value: "support4" },
  { name: "Hard Support", value: "support5" },
];

export const commandData = [
  new SlashCommandBuilder()
    .setName("meta")
    .setDescription("Show the strongest Dota 2 heroes by position.")
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Limit results to one position.")
        .setRequired(false)
        .addChoices(...positionChoices),
    ),
  new SlashCommandBuilder()
    .setName("worst")
    .setDescription("Show weak heroes in the current Dota 2 meta.")
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Limit results to one position.")
        .setRequired(false)
        .addChoices(...positionChoices),
    ),
  new SlashCommandBuilder()
    .setName("counter")
    .setDescription("Show counterpicks against a hero.")
    .addStringOption((option) =>
      option.setName("hero").setDescription("Hero name, for example Anti-Mage.").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Limit counters to one position.")
        .setRequired(false)
        .addChoices(...positionChoices),
    ),
  new SlashCommandBuilder()
    .setName("synergy")
    .setDescription("Show heroes that fit well with a selected hero.")
    .addStringOption((option) =>
      option.setName("hero").setDescription("Hero name, for example Juggernaut.").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("lane_combo")
    .setDescription("Show best lane combinations for a hero.")
    .addStringOption((option) =>
      option.setName("hero").setDescription("Hero name, for example Juggernaut.").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("game_combo")
    .setDescription("Show best game synergies and teamfight combos for a hero.")
    .addStringOption((option) =>
      option.setName("hero").setDescription("Hero name, for example Juggernaut.").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("items")
    .setDescription("Show top items by game stages for a position.")
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Select position.")
        .setRequired(true)
        .addChoices(...positionChoices),
    ),
  new SlashCommandBuilder()
    .setName("bad_items")
    .setDescription("Show inefficient items for a position.")
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Select position.")
        .setRequired(true)
        .addChoices(...positionChoices),
    ),
  new SlashCommandBuilder()
    .setName("hero")
    .setDescription("Show summary card for a hero (stats, items, counters).")
    .addStringOption((option) =>
      option.setName("hero").setDescription("Hero name, for example Anti-Mage.").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("patch")
    .setDescription("Show the latest Dota 2 patch notes with a details button."),
  new SlashCommandBuilder()
    .setName("draft")
    .setDescription("Подбери героя под союзников и против вражеского пика. Имена можно писать по-русски.")
    .addStringOption((option) =>
      option
        .setName("enemies")
        .setDescription("Вражеские герои через пробел. Пример: пудж акс лина")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Твоя позиция")
        .setRequired(true)
        .addChoices(...positionChoices),
    )
    .addStringOption((option) =>
      option
        .setName("allies")
        .setDescription("Союзные герои через пробел. Пример: джаг цм магнус")
        .setRequired(false),
    ),
].map((command) => command.toJSON());

export function readPosition(value: string | null): Position | undefined {
  if (!value) {
    return undefined;
  }

  return positions.includes(value as Position) ? (value as Position) : undefined;
}
