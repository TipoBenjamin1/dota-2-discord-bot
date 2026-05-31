import { REST, Routes } from "discord.js";
import { getConfig, assertDiscordConfig } from "./config.js";
import { commandData } from "./discord/commands.js";

const config = getConfig();
assertDiscordConfig(config);

const rest = new REST({ version: "10" }).setToken(config.discordToken);
const route = config.discordGuildId
  ? Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId)
  : Routes.applicationCommands(config.discordClientId);

await rest.put(route, { body: commandData });

console.log(
  config.discordGuildId
    ? `Registered ${commandData.length} guild commands.`
    : `Registered ${commandData.length} global commands.`,
);
