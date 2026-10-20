# Gravity Switch quality improvement audit

Date: 2026-10-20

## Scope and honesty

This is a completed source-inspection and targeted implementation pass, NOT a completed gameplay acceptance audit. No before/after browser playthrough, physical-device run, frame-rate benchmark, all-level solver, or CrazyGames Preview QA session was executed. Runtime items below are explicitly pending. Approval is not guaranteed. Broader screen redesigns and authored level rebalancing are deferred until observed playthrough results are available; no levels or modes were removed to claim completion.

## Implemented improvements

- Isolated mutable Career course data per engine instance. Gem, portal, trap and checkpoint state no longer writes back into the shared level catalogue.
- Added fixed 120 Hz Career/shared physics and fixed 240 Hz Race physics accumulators instead of refresh-dependent partial Euler steps. Kept gravity strength, launch speed, course speed and level sequences unchanged.
- Valid gravity input now launches a Career intro immediately rather than leaving the runner stationary for the remaining intro.
- Replaced Career's rectangular spike collisions with the same visible triangular teeth across Career, Endless, Survival and Race. Retained the existing forgiving player inset. Pop-up traps use the same tooth geometry, not invisible rectangle corners.
- Checkpoints are recorded only after collision/hazard resolution, not on a lethal frame. Runtime snapshots restore exact safe position, velocity, gravity, platform support, obstacle phase, speed gates and used portals. A checkpoint is deferred until an active Gem Rush ends, avoiding a half-restored Rush state.
- The active level stopwatch now survives death/respawn and resets on a full restart; paused/dead time is not simulated. Existing saved records were not erased.
- A no-checkpoint respawn restores the initial gem layout/count consistently; checkpoint respawns retain the checkpoint's pickup snapshot.
- Reduced normal death feedback and automatic retry delay from roughly a second to under half a second of scheduled feedback, excluding frame stalls and optional struggle offers. Spawn rendering starts at 80% scale/opacity so the runner is readable immediately.
- Kept the active gameplay camera scale steady and reserved vertical space for the HUD, rather than zooming the corridor under the player or covering top hazards. Compacted the narrow-screen timer/death display into the level card.
- Reduced repeated global flashes during gem rows; kept local particles, rings, pickup sounds, leading-gem automatic Rush and row guides.
- Cached row membership/order outside rendering, reused gem row paths, and culled off-screen hazard/gem drawing. These are implementation optimizations, not measured FPS claims.
- Kept race proximity-triggered hazards advancing during respawn invulnerability so they do not depend on whether the renderer saw them. Both players retain independent collision and control state.
- Reset the Race frame timestamp on resume to avoid advancing paused elapsed time.
- Added a prominent one-click Play/Continue entry. First-time visitors now land directly in the interactive tutorial on its safe runway; returning players retain the full mode menu. The first tap/click/Space immediately flips gravity instead of waiting for the first automatic cue. Tutorial prompts use shorter copy, directional icons and a visible Space keycap, with an immediately accessible Skip Tutorial control; all lesson and reward logic remains available.
- Reserved Escape for browser fullscreen behavior across gameplay modes; P remains the pause control. Race accepts W or Z plus Space for Player 1 and retains Arrow Up/Enter for Player 2, with matching visible instructions.
- Corrected visible menu, loading, completion and rotation branding to Gravity Switch; replaced the hosted favicon with an original geometric gravity mark.
- Improved shared button touch sizes, keyboard-focus treatment and audio-setting accessibility labels.
- Preserved browser modifier shortcuts rather than treating Ctrl/Cmd/Alt combinations as gameplay input.
- Disconnect completed WebAudio oscillator/filter/gain/source nodes and throttle overlapping pickup/landing/switch sounds without throttling gameplay inputs.
- Stop SDK gameplay state during the finish celebration instead of reporting it as active play.
- Hide unconfigured rewarded-ad offers rather than showing a nonfunctional shop promotion. Existing completed reward-save retries remain accessible; ad approval flags stay disabled.

## Preserved systems

55 Career levels and their IDs; Easy/Medium/Hard prerequisite unlocking; Endless, Survival, local two-player Race, Tutorial, Time Trial and existing ghost records; gems as the only currency; automatic Gem Rush; owned/equipped skins; serialized wallet/purchase/claim ledgers; daily tasks and achievements; optional failure-only skips; no-death challenge rewards of 100/350/1,000 gems; CrazyGames initialization, Data Module saves, account presentation and settings priority; disabled/unapproved advertising and leaderboard configuration. No saved balances, purchases or completion records were cleared.

## Structured runtime audit: NOT EXECUTED

| Requested area | Inspection/change in this pass | Required runtime acceptance check |
| --- | --- | --- |
| 1. Loading/main menu | SDK bootstrap inspected; title, primary entry and disabled-ad offer corrected | Fresh and returning save, slow/blocked SDK, first playable frame |
| 2. Tutorial | Direct safe-runway start; interactive lessons retained | All lessons, skip/replay, finish and one-time gem save |
| 3. Play/death/restart | Fixed-step simulation; faster retries; isolated course state | Death before/after checkpoint, repeated full restarts |
| 4. Gravity/all hazards | Exact shared spike/trap geometry; other geometry inspected | Every hazard, both gravity directions, platform sides and fields |
| 5. Checkpoints/finish | Safe post-collision snapshots; guarded finish retained | Airborne/platform checkpoint, Rush crossing, death near finish |
| 6. Timers | Full-run active timer across respawns; fixed Race steps | Pause, focus loss, completion, 60/120/144/165 Hz |
| 7. Gems/Rush | Layout restores and row-render caching; leading gem preserved | Touch leading gem, follow row, obstruction/exit, count/bank once |
| 8. Career unlocking | Existing prerequisite functions inspected and unchanged | Every one of the 55 levels and every group boundary |
| 9. Endless | Rolling generator/rebase/culling inspected; shared fixes inherited | Long runs well beyond 10,000 points, boundaries/rebase, memory |
| 10. Race | Independent players inspected; phase and resume fixes | Simultaneous keyboard/touch, tie, countdown, series/rematch, rewards |
| 11. Shop/save | Existing serialized purchase and ownership guards inspected | Repeated buy clicks, independent equips, reload, blocked storage |
| 12. Challenges | Existing conditions and one-time reward definitions inspected | Fail/restart/retry, genuine win, duplicate claim, exact rewards |
| 13. Pause/menu | Lifecycle inspected; Race resume clock and finish event corrected | Each mode, focus loss, exit while saving, audio resume |
| 14. Desktop/mobile | Modifier guards, focus treatment, touch sizes, camera/HUD spacing | Mouse/keyboard, simultaneous mobile touch, iOS audio interruption |
| 15. Resize/restarts | Existing frame-chain cleanup and observers inspected | Repeated resizes/orientation changes and hundreds of retries |
| 16. SDK | Current official docs reviewed; gated integrations retained | CrazyGames Preview QA, login/logout/cloud save, mute, ad callbacks |

Use the Testing Agent (test-tube icon) for actual app playthroughs. Suggested goals:

1. "Audit Gravity Switch's tutorial and all 55 Career levels on desktop and landscape mobile, including hazards, checkpoints, timers, Gem Rush, group unlocking and repeated restarts; report each observed failure."
2. "Regression-test every Gravity Switch mode, both Race players, shop purchases/equips, challenge rewards, save reload, pause/focus loss and resizing on desktop and mobile; distinguish executed from unverified checks."

CrazyGames-only account/cloud/ad behavior must additionally be checked in its official Developer Portal Preview/QA environment, not inferred from a hosted-browser run. Physical-device performance, browser compatibility, exhaustive level solvability, visual clipping and approval remain unverified.

## Official requirements reviewed

- https://docs.crazygames.com/requirements/intro/
- https://docs.crazygames.com/requirements/gameplay/
- https://docs.crazygames.com/requirements/quality/
- https://docs.crazygames.com/requirements/technical/
- https://docs.crazygames.com/requirements/ads/
- https://docs.crazygames.com/sdk/intro/
- https://docs.crazygames.com/sdk/game/
- https://docs.crazygames.com/sdk/data/

These describe readable responsive iframes, refresh-rate-consistent physics, quick onboarding, valid SDK initialization/gameplay events, SDK-owned saves, mute precedence, relative bundle assets, noninterrupting SDK ads and graceful ad unavailability. Basic Launch disables monetization; existing approval flags were not enabled. The portal's Progress Save setting must be enabled for Data Module saves. No external advertising, payments, tracking dependency or unsupported SDK feature was introduced.

## Compile/static checks

The hosted production build and targeted changed-screen ESLint check completed successfully during this pass. The standalone CrazyGames production build completed successfully and produced approximately 2.0 MiB across 12 files at the package-size check, including local fonts and licenses. The standalone guard rejects hosted-only service/auth imports. These checks are not gameplay tests. Build warnings remain for stale Browserslist data and a main JavaScript chunk above the generic 500 kB warning threshold; no runtime performance measurement was made. Final compile/static results after the last gameplay/UI edits:

| Check executed | Result |
| --- | --- |
| Hosted production build (`npm run build`) | Exit 0 |
| CrazyGames production build (`npx vite build --config standalone/vite.config.js`) | Exit 0; approximately 2.0 MiB, 12 files |
| Targeted ESLint for changed screens | Exit 0 |
| Undefined-symbol static check for changed engine/render/audio/collision modules | Exit 0 |
| Interactive gameplay, full 55-level solvability and device/browser performance | NOT EXECUTED |
| CrazyGames Preview/QA and submission approval | NOT EXECUTED / NOT GUARANTEED |

These results do not close any pending runtime acceptance check above.