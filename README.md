# Dota 2 Discord Bot

Discord bot that shows Dota 2 meta heroes, weak picks, counterpicks, synergy ideas, and data freshness.

## Stack

- Node.js + TypeScript
- discord.js
- OpenDota API as the first data source
- JSON cache in `data/cache.json`

## Setup

1. Install dependencies:

   ```bash
   npm.cmd install
   ```

2. Create `.env` from `.env.example` and fill:

   ```env
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_application_client_id
   DISCORD_GUILD_ID=your_test_server_id
   ```

3. Register slash commands:

   ```bash
   npm.cmd run register
   ```

4. Start the bot:

   ```bash
   npm.cmd run dev
   ```

## Commands

- `/meta` - strongest heroes by position
- `/meta position:carry` - strongest heroes for one position
- `/worst` - weak heroes by position
- `/counter hero:Anti-Mage` - counterpicks by position
- `/counter hero:Anti-Mage position:mid` - counterpicks for one position
- `/synergy hero:Juggernaut` - heroes that fit with the selected hero
- `/patch` - cache status and last data refresh time

## Current MVP Limits

OpenDota does not directly provide perfect position-based meta data in the free endpoint used here. The first MVP estimates positions from hero roles, then ranks heroes using winrate, pickrate, role fit, and data confidence.

That is enough to test the bot flow. Later we can improve accuracy with STRATZ, parsed match data, or a custom position classifier.
