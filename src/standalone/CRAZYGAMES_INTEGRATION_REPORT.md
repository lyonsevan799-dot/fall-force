# Gravity Switch: CrazyGames SDK v3 and saves

Date: 2026-10-17

## Implementation status

The official v3 SDK and Data Module are integrated in the existing game. The hosted and standalone production builds compile. Browser gameplay QA, actual SDK runtime behavior, guest/account saves, refresh recovery, and cross-device sync have NOT been tested in this turn. No cloud-saving success is claimed. Use Testing Agent and the CrazyGames Developer Portal preview for the scenarios below.

## Existing architecture inspected

- React menus are coordinated by `src/pages/Home.jsx`, with no replacement router or game rewrite.
- Career uses `Engine`, Endless extends it with `EndlessEngine`, Tutorial uses `TutorialEngine`, and local multiplayer uses `RaceEngine`.
- Existing canvas components own requestAnimationFrame loops and Canvas rendering; procedural WebAudio remains unchanged apart from a platform mute gate.
- All 35 Career levels, difficulty groups, procedural Endless chunks, Race tracks, controls, prices, gem banking, and reward rules are retained.
- Player progress used the browser key `gravity-switch-save-v1`, normalization helpers, and queued atomic transactions. Those interfaces and the record format remain in use.
- The hosted app has its original Base44 auth/router shell. The standalone Vite configuration swaps in a game-only App and bundles local fonts, without Base44 auth, backend, or analytics dependencies.

## SDK initialization and safety

Both HTML heads include `https://sdk.crazygames.com/crazygames-sdk-v3.js`. The async script avoids blocking the page indefinitely when the request is blocked. A single centralized initializer awaits `window.CrazyGames.SDK.init()` before inspecting the environment or using any module. Startup waits up to five seconds for a missing script and fifteen seconds for an initialization that does not settle, then continues off-platform instead of freezing the game. A late initialization does not switch the running game's save backend.

The SDK's `environment` is authoritative: only `local` and `crazygames` activate its features. `disabled`, failed initialization, and an unavailable script use ordinary browser persistence. The SDK receives the original URL, including the documented `?useLocalSdk=true` option; no environment or response is faked.

## Saves and migration

- SDK preload and save validation finish before React mounts the game, creating the wallet, progression, or skin inventory.
- On supported SDK environments, `SDK.data.getItem`, `setItem`, and scoped `removeItem` operations are used. The game does not mirror player saves into browser storage or combine guest and account wallets. `clear()` is deliberately not used: only this game's progress key should be removed, not unrelated Data Module keys.
- A legacy save is copied only if the SDK progress key is absent and the device has not previously migrated. The complete normalized record is copied together. The browser original is retained for recovery; a browser migration marker contains no player progression.
- If an SDK save already exists, it is authoritative even if a browser wallet is larger. Taking maximum wallet values would resurrect spent gems; merging ledgers could duplicate rewards. Legacy migration preserves every valid best record, completion, unlock, wallet, ownership, and claim ledger rather than adding balances or awarding rewards.
- Guest/account transitions are owned by CrazyGames. Official documentation states Data Module games are reloaded on login and logout; no competing authentication/merge system is added.
- SDK writes are immediate local Data Module operations. The documented SDK debounce handles frequent calls at approximately one second, potentially up to 30 seconds. There is no invented cloud acknowledgement or forced flush.
- The serialized key/value envelope is capped at 900,000 UTF-8 bytes to leave headroom below the SDK's 1,048,576-byte total. No engine, graphics, geometry, or replay frames are serialized. Existing ledgers are not pruned because doing so could allow duplicate claims.
- `dataLimitExcedeed`, `dataModuleDisabled`, and generic/`other` failures produce a visible save warning. Malformed originals are protected against automatic overwriting; browser corruption is backed up when storage allows. A malformed legacy record is never imported as defaults.
- Gameplay can continue with session-only progress after a failure. The latest state, not a repeated reward callback, is retried on later writes. A failed purchase does not update the accepted wallet or ownership. SDK in-memory write mutations are rolled back through the documented scoped methods when a write throws; failures to restore lock further persistent writes for that session.
- SDK read failure never loads a potentially unrelated local/account wallet. Recovery after a blocked initial read requires reloading. Data Module disabled in a supported environment stays session-only rather than silently creating another persistent account save.
- Existing browser cross-tab synchronization and locks are retained only for browser-backed saves. SDK mode leaves account storage and syncing to the SDK.

## Persisted state

The existing single progress record retains spendable gems, owned/equipped skins for solo/P1/P2, purchase receipts, level completion/stars/best times, sequential unlocks, level gem records, challenge completion/award timestamps/failure histories, Race wins/reward IDs, tutorial completion/skip/banked rewards, Endless best score, and audio/effects settings. Easy/Medium/Hard unlocks remain deterministically derived from persisted level completions, not contradictory extra booleans.

Tutorial replay count and Endless best distance/streak are now recorded through the existing callbacks, without extra rewards. Unknown compatible progression/settings fields are retained. Empty record containers support existing/future achievements, daily challenges, and Time Trial records; no achievements, daily challenge gameplay, or Time Trial mode currently exists, and none was invented as part of the integration. Controls and accessibility values stored in settings survive normalization.

## Game events and settings

- `loadingStart()` follows successful SDK initialization, before save preparation. `loadingStop()` fires when the ready Home screen mounts.
- Shared lifecycle observation follows actual engine states across Career, Tutorial, Endless, and Race. It starts for active play, stops on explicit pause, tutorial instruction breaks, death/results, completion, or exiting to menus, and restarts on genuine play/resume/respawn/next-level transitions. Race countdown is not counted as active gameplay; its playable finish grace period is.
- Calls are deduplicated. Existing focus-loss auto-pause remains, but blur/visibility events are explicitly excluded from SDK start/stop reporting. Focus gain does not start gameplay or resume the engine.
- Level context is set on entry (Career/Race are one-based, Tutorial is zero) and cleared on exit. Endless does not invent a level number.
- Completion percentage is based on completed Career levels out of 35. Only completing all 35 reaches 100%; unlocking the final level, buying skins, or skipping the tutorial cannot report 100%.
- The initial `game.settings` and documented add/remove settings listener are connected. `muteAudio` immediately gates the WebAudio master bus, including music, effects, and already scheduled sounds, without overwriting the player's choices. Removing the platform mute restores the player's own toggles and volumes. `disableChat` is retained in platform settings; this game has no chat to disable.
- SDK errors do not escape into canvas loops or stop rendering; failed event methods are suppressed rather than retried every animation frame.

## Changed files

New centralized modules:
- `src/game/platform/crazyGames.js`
- `src/game/platform/gameEvents.js`
- `src/game/platform/saveConstants.js`
- `src/game/platform/saveMigration.js`
- `src/game/platform/saveStore.js`
- `src/game/platform/bootstrapGame.js`

Existing integration points:
- `index.html`, `standalone/index.html`: official SDK script.
- `src/main.jsx`: startup save/SDK barrier, shared by both builds.
- `src/game/progress.js`, `src/game/saveData.js`, `src/game/progressTransaction.js`: validated storage adapter and session-safe transactions.
- `src/hooks/useGameProgress.js`: persistence notices, primary-store reads, and gameplay-only volatile recovery.
- `src/hooks/useGameLifecycle.js`: deduplicated actual-state lifecycle and focus exclusion.
- `src/hooks/useGameAudio.js`, `src/game/audio.js`: platform settings subscription and master mute.
- `src/pages/Home.jsx`: ready/completion events and tutorial/Endless record callbacks.
- `src/components/game/GameCanvas.jsx`, `src/components/game/RaceCanvas.jsx`, `src/hooks/useTutorialGame.js`: level context.
- `src/components/game/EndlessCanvas.jsx`: distance/streak result records.
- `src/components/game/tutorial/TutorialCanvas.jsx`, `src/game/tutorialProgress.js`: replay count.
- `standalone/vite.config.js`: explanatory comment only; build configuration preserved.
- `standalone/README.md`, `src/standalone/PUBLISHING_REPORT.md`: updated guidance and historical-report notice.
- This report.

No level specifications, physics implementations, collision rules, control mappings, skin prices, challenge rewards, or menu layouts were changed.

## Checks actually performed

| Check | Result |
| --- | --- |
| Hosted production compilation, `npm run build` | Passed, exit code 0. |
| Game-only production compilation, `npx vite build --config standalone/vite.config.js` | Passed, Vite 8.2.0. |
| Official method/environment/error signatures | Checked against the current official Introduction, Data, Game, and User documentation. |
| Gameplay/browser/account scenarios | NOT RUN. Compilation and source review are not gameplay or cloud-save tests. |

The compiler warns that the Browserslist data is old; no dependency upgrade was performed as part of this change.

## Required runtime QA (all pending)

Run Testing Agent with goals such as: “Start as a first-time player, skip/replay the tutorial, finish a level, refresh, and verify gems, skins, unlocks, and claimed rewards.” Also use: “Switch between menus, pause/resume, complete and restart levels, and check that CrazyGames lifecycle events are not duplicated or caused by focus changes.”

1. First-time player: no save, zero defaults, no startup writes before retrieval, normal tutorial/skip and progression.
2. Returning browser player: seed the actual legacy key on the SAME game origin, migrate once, preserve best records and exact wallet/receipts, reload, and confirm no second import.
3. Collect gems and complete a level: allow the SDK save delay, refresh, then compare balance, records, skins, and unlocks. Repeat for Endless, Race, and tutorial replay.
4. Unavailable/blocked SDK and `disabled` environment: game loads and uses browser persistence. Supported SDK with Data Module disabled must warn and remain session-only without overwriting local/account saves.
5. Repeated saves/duplicate completions: challenge and Race reward IDs stay claimed, tutorial gems bank once, and purchases remain single-charge. Replaying a level still earns gems according to the unchanged existing economy.
6. Menus/gameplay: start, explicit pause/resume, death/respawn, next level, tutorial prompts, Race countdown/results, context clearing, and all Career completion percentages; focus switches alone must produce no lifecycle events.
7. Malformed/root-array/oversized records and storage/quota errors: original record remains untouched, no fallback purchase charge, warning visible, continued session gameplay. Also verify valid partial records normalize without losing legitimate fields.
8. Guest/account session in the real portal: SDK-managed login/logout reload, returning account save, brand-new account guest transfer, and cross-device recovery after the documented delay. Never compare a device's larger local gem total to overwrite an existing account wallet.
9. Platform settings: `muteAudio` at startup and while playing, changing in-game toggles while forced mute is true, then unmuting; confirm player volumes/toggles are restored. No chat exists to expose when disabled.

## CrazyGames configuration still required

1. Build/export the standalone game, retaining root `index.html`, relative assets, and bundled fonts. The original non-destructive packaging script remains usable.
2. Enable **Progress Save → Yes, using the Data Module from the CrazyGames SDK** in the submission flow. Otherwise `dataModuleDisabled` is expected.
3. Use the Developer Portal preview with the real game ID/origin for guest/account and persistence QA. Run local SDK checks on localhost/127.0.0.1 or `?useLocalSdk=true`; a disabled SDK on the ordinary published app domain is expected.
4. Allow the official SDK script in the hosting/network policy if it is blocked. No API key, secret, custom backend, payment provider, or OAuth connector is required for this integration.
5. Wait for the documented save debounce during QA; no cloud-write receipt is exposed by the localStorage-compatible Data API. Real account/cross-device tests must pass before describing cloud saving as verified.

Official references: https://docs.crazygames.com/sdk/intro/ ; https://docs.crazygames.com/sdk/data/ ; https://docs.crazygames.com/sdk/game/ ; https://docs.crazygames.com/sdk/user/ .