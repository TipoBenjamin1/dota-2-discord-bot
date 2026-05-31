# Project State

Last updated: 2026-05-31

## Purpose

This file is the handoff note for future Codex chats in this project. Read it first after `PROJECT.md`/`README.md` so the assistant can quickly recover the current context.

## Current Project

Dota 2 Discord bot in Node.js + TypeScript using `discord.js` and OpenDota API.

Main idea from `PROJECT.md`: the bot should show current Dota 2 meta, weak heroes, counterpicks, hero synergy, role/position data, items, and data freshness.

## Important Files

- `PROJECT.md` - original Russian product idea and desired feature set.
- `README.md` - setup guide, currently older than the implemented command set.
- `.specify/spec.md` - expanded requirements/specification for commands and data.
- `.specify/tasks.md` - task list for item data, combo logic, embeds, and verification.
- `src/index.ts` - Discord bot startup and slash command handlers.
- `src/discord/commands.ts` - registered slash commands.
- `src/discord/formatters.ts` - Discord embed formatting.
- `src/services/metaService.ts` - main ranking/counter/item/combo/draft logic.
- `src/services/patchService.ts` - official Dota 2 patch notes fetcher and announcement state.
- `src/data/opendota.ts` - OpenDota API calls.
- `src/data/refresh.ts` - refreshes hero stats and item constants.
- `src/heroNames.ts` - Russian aliases/transliteration for Dota hero names.
- `src/positions.ts` - hero position weights and labels.
- `data/cache.json` - local OpenDota cache.
- `Dockerfile` - production container build for Northflank or other Docker hosts.

## What Is Already Implemented

Slash commands registered in `src/discord/commands.ts`:

- `/meta`
- `/worst`
- `/counter`
- `/synergy`
- `/lane_combo`
- `/game_combo`
- `/items`
- `/bad_items`
- `/hero`
- `/patch`
- `/draft`

The handlers for those commands are connected in `src/index.ts`.

Implemented service logic in `src/services/metaService.ts` includes:

- meta ranking by position
- weak hero ranking
- counterpicks from OpenDota matchups
- synergy/game combo heuristics
- lane combo heuristics
- item recommendations by game stage
- bad item heuristics by position
- hero summary card
- draft suggestions against enemy picks
- latest official Dota 2 patch notes from `dota2.com/datafeed/patchnotes`
- patch announcement state so the bot does not announce the same patch twice

OpenDota item support exists:

- `fetchItemsConstants()` calls `/constants/items`
- `fetchHeroItemPopularity(heroId)` calls `/heroes/{heroId}/itemPopularity`
- cache stores `items` and `itemPopularity`

Patch note support exists:

- `/patch` now shows the latest official Dota 2 patch summary in Russian.
- A `Подробнее..` button opens the full patch note text in Discord.
- The bot can auto-announce new patches to `PATCH_ANNOUNCE_CHANNEL_ID`.
- New patches can mention `@everyone` up to 3 times via `PATCH_MENTION_COUNT`.
- On first start, `PATCH_ANNOUNCE_ON_FIRST_START=false` silently records the current patch instead of pinging an old patch.

## Latest Local Verification

On 2026-05-31, `npm.cmd run build` passed successfully after the patch-note announcement changes.

On 2026-05-31, a real official Dota 2 datafeed request was verified with Node. It returned latest patch `7.41c` from source `dota2` with Russian summary lines.

PowerShell `npm run build` fails because Windows blocks `npm.ps1` via execution policy. Use `npm.cmd run build` instead.

Current `data/cache.json` snapshot observed:

- source: `opendota`
- updatedAt: `2026-05-30T22:16:34.341Z`
- heroes: 127
- items: 501
- cached matchups: 19
- cached itemPopularity entries: 8
- patchNews: `7.41c` from `dota2`

## Known Gaps / Next Useful Tasks

- `README.md` is outdated: it does not mention `/items`, `/bad_items`, `/lane_combo`, `/game_combo`, `/hero`, or `/draft`.
- `README.md` also needs the new patch announcement env vars and updated `/patch` behavior.
- `.specify/tasks.md` checkboxes are still unchecked even though much of the work is implemented.
- Some Russian text in terminal output may look broken if read without UTF-8, but source files themselves read correctly with `-Encoding UTF8`.
- `/draft` is implemented but is not described in `PROJECT.md` or `.specify/spec.md`.
- A local git repository now exists. Initial commit: `6ad771d` (`Initial Dota bot deployment setup`).
- Discloud free bot upload was blocked by free-plan capacity/high-demand errors after an initial attempt.

## User Preference

The user wants Codex to keep a short project handoff note updated after work, so the next chat can immediately understand the project state.

The user also wants this file to keep a running work list/log. During future work, update `Work Log` after meaningful steps, not only at the end of the chat.

At the end of meaningful future sessions, update this file with:

- what changed
- what was verified
- any blockers or Windows-specific command notes
- the next recommended step

## Work Log

### 2026-05-31

- Reviewed `PROJECT.md`, `.specify`, and main `src` files to understand the current bot state.
- Confirmed implemented commands: `/meta`, `/worst`, `/counter`, `/synergy`, `/lane_combo`, `/game_combo`, `/items`, `/bad_items`, `/hero`, `/patch`, `/draft`.
- Verified build with `npm.cmd run build`; it passed.
- Noted that plain `npm run build` is blocked by PowerShell execution policy for `npm.ps1`.
- Created this `PROJECT_STATE.md` handoff file so future chats can quickly recover context.
- Added this `Work Log` section because the user wants a running memory/list of what we do in the project.
- Reworked `/patch` so it shows official Dota 2 patch notes instead of only OpenDota cache freshness.
- Added `src/services/patchService.ts` using `dota2.com/datafeed/patchnoteslist` and `dota2.com/datafeed/patchnotes?language=russian`.
- Added patch summary embeds, a `Подробнее..` Discord button, and full patch details on button click.
- Fixed Discord embed limit for patch details: button responses now send the first detail chunk with `editReply` and the remaining chunks as separate ephemeral `followUp` messages, avoiding the 6000-character total embed limit per message.
- Added optional auto-announcements to a configured channel with `@everyone` pings, controlled by `PATCH_ANNOUNCE_CHANNEL_ID`, `PATCH_MENTION_COUNT`, `PATCH_CHECK_INTERVAL_MINUTES`, and `PATCH_ANNOUNCE_ON_FIRST_START`.
- Preserved patch announcement state in `data/cache.json` across OpenDota refreshes.
- Verified TypeScript build with `npm.cmd run build`.
- Verified the official Dota 2 datafeed fetch returned patch `7.41c` in Russian.
- User confirmed in Discord that the `/patch` flow appears to work after the embed-limit fix.
- Tried deploying to Discloud free plan. Added `discloud.config` and `.discloudignore`; initial upload worked, but the app needed env vars and later free-plan bot uploads were blocked by Discloud capacity/high-demand limits.
- Added `Dockerfile` and `.dockerignore` for a cleaner Northflank deployment.
- Initialized local git repository, ignored `.env`, `dist`, `node_modules`, `data/*.json`, and zip archives.
- Created first local git commit `6ad771d` with the deploy-ready source tree.

Next recommended step:

- Create/push a GitHub repository for this local git repo, connect GitHub in Northflank, deploy the Dockerfile-based service, then add `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, optional `DISCORD_GUILD_ID`, and patch announcement env vars in Northflank.
