# Gravity Switch: Endless Global Leaderboard

Date: 2026-10-17

## Status and scope

Implemented: a Global Leaderboard entry on the existing main menu; a responsive screen showing the saved, all-time personal Endless record; honest empty/loading/unavailable/error states; background completion-only SDK submission; validation and duplicate-event protection; exact documented HTML5 score encryption; and a nonblocking result status on the existing Endless game-over panel.

**The official leaderboard is NOT live or verified.** Its configuration is deliberately disabled (`approved: false`) with an empty client encryption key and empty real CrazyGames game-page URL. No player list, global score, rank, approval, server acceptance, or completed QA result is fabricated. No server leaderboard endpoint is called.

The existing game architecture, engines, level layouts, physics, controls, scores, gem banking, saves, shop, Career, Tutorial, and Race rules are unchanged. No separate Career/Race/Time Trial official leaderboard was created. Existing personal records stay in the game's existing save data. No replacement game or export was built in this turn.

## Official documentation inspected

- https://docs.crazygames.com/sdk/user/
- https://docs.crazygames.com/sdk/leaderboards/
- https://docs.crazygames.com/sdk/leaderboards-client/
- https://docs.crazygames.com/sdk/leaderboard-api/

The documentation says this feature is invitation-only and supports **one leaderboard per game**. It describes weekly seasons, with rankings reset Monday at 09:00 UTC. The new personal-record card explicitly says **All time**, so it is not confused with an official seasonal rank.

## Required CrazyGames configuration

After CrazyGames invites/approves this game, configure the actual Leaderboard tab to match:

| Setting | Proposed value |
| --- | --- |
| Mode | Endless Mode |
| Metric / scoreLabel | POINTS |
| Sorting / scoreSorting | DESC |
| isIncremental | false |
| minValue | 0 |
| maxValue | 500000, or the actual approved limit |
| cooldownSeconds | 10, or the actual approved cooldown |
| Guide | Endless Mode - Survive as long as possible |

The guide is within the documented 50-character limit. Generate the **client Encryption Key** using the Developer Portal, ensure it decodes from base64 to exactly 32 bytes, and supply that same client key to the integration. This is the deliberately client-visible encryption key from the client-only documentation, NOT the secret server API key. Never put an API key into this module, frontend environment variables, or a browser request.

In `src/game/leaderboard/config.js`, set the real client encryption key, exact approved limits/cooldown, and approval confirmation only once the portal configuration is in place. Optionally set the real, approved CrazyGames game-page URL; no hostname/slug has been guessed. This shared module is used by both the existing hosted app and the existing standalone entry when they are next published/exported.

Configuration gates check approval confirmation, the actual key bytes, POINTS/DESC/nonincremental settings, supported initialized CrazyGames SDK, secure browser crypto, documented account availability, and the presence of documented `getUser`/`submitScore` methods. A signed-out player gets an explanation instead of a forced login popup. The game does not treat a JavaScript user ID as identity proof.

SDK method availability and a manually confirmed configuration cannot themselves prove that a live season is accepting scores. Actual portal configuration and QA remain required.

## Opening and displaying the official leaderboard

The inspected current documentation provides `SDK.user.submitScore(...)`, but **does not document a programmatic SDK method to open the leaderboard drawer or fetch global rows**. No `showLeaderboard`, `openLeaderboard`, unofficial read API, or fabricated score table has been added.

When approval, account access, and an actual CrazyGames game-page URL are configured, **View on CrazyGames** opens that exact HTTPS page in a new tab. The screen tells the player to use the official Leaderboard drawer there. With missing approval/configuration it displays a disabled official-leaderboard action and explains why. A direct SDK drawer-opening action remains unavailable unless CrazyGames supplies a documented method.

The local empty state means there is no completed personal Endless run recorded, not that an unseen global leaderboard is empty. The app cannot truthfully determine whether official global standings are empty using the documented client methods. The Retry/Check again action rechecks account/access only; it never resubmits a score.

## Completed-run validation and deduplication

1. The existing Endless canvas registers its real `EndlessEngine` instance immediately after initial load or Retry, with a zero score and intro/playing state.
2. Only the existing actual `state === 'dead'` game-over branch can capture a completed run through this flow. Pausing, exiting, refreshing, a saved personal best, or an SDK response does not create a completion.
3. A weak registry verifies the engine instance/type, Endless mode, ended state, finite nonnegative numeric raw score, finite nonnegative engine time, and monotonic completion timing.
4. The immutable receipt captures the exact `Math.floor(engine.score)` already used by the normal game result callback. It cannot later change to the next run's score. Genuine zero is valid; no truthiness test drops it.
5. Submission accepts only receipts minted by that registry. It rejects nonnumeric/nonfinite/noninteger and configured out-of-range values instead of clamping them or changing the game result.
6. A second weak set marks a receipt handled **before any asynchronous work**. The existing game-over guard, one-completion-per-engine-run guard, and one-attempt-per-receipt guard cover repeated handlers. A new run resets the run registry without invalidating a prior immutable receipt.
7. Pending, sent, skipped, and failed runs are not replayed from storage or automatically retried after refresh. Merely opening the leaderboard screen never submits a saved high score. Equal scores from two genuinely different runs remain distinct sessions, with nonincremental scoring rather than additive rewards.
8. The configured client cooldown is enforced before SDK dispatch. Runs inside the cooldown are skipped with an honest message; no queued retry can accidentally duplicate them.

This does not turn client code into a trusted environment. Someone modifying the browser can modify engines or invoke the SDK themselves. These are integration-integrity checks, not server-authoritative anti-cheat. Weekly seasons mean each legitimate new run is considered independently rather than suppressing it because it is below a saved lifetime best.

## Encryption and SDK submission

The HTML5 encoder follows the official algorithm exactly:

- `crypto.getRandomValues(new Uint8Array(12))` for a fresh IV;
- base64 decode the configured 32-byte client key;
- import the raw AES-GCM key with `crypto.subtle.importKey`;
- UTF-8 encode `score.toString()`;
- AES-GCM encrypt using that IV, retaining the browser's authentication tag;
- concatenate `IV || encryptedBuffer`;
- base64 encode the combined bytes;
- call the existing initialized official SDK's `user.submitScore({ encryptedScore, score })`.

No alternate encryption, made-up key, numeric score from a network response, user ID payload, leaderboard backend URL, or secret API key is used.

**Important:** CrazyGames explicitly states that client-side score responses always appear successful, with validation applied in its backend. The UI therefore says **Run sent to CrazyGames for validation. Leaderboard placement is not confirmed.** It never turns a return value into an accepted rank or confirmed score. Privacy/season/validation rejection can remain invisible to a client-only integration.

## Failure isolation

Account access, encryption, and submission are asynchronous, with bounded waits and no awaited dependency in the game-over or gem-saving flow. Retry and Main Menu remain usable. A completed run finishes and existing personal progress is saved normally even when the leaderboard is unavailable, times out, or throws. Generation guards prevent a previous run's late response from replacing the new run's result status.

Detected SDK errors produce player-safe text. Known error codes, if surfaced, map to season/account/privacy/validation/internal-error explanations; unknown errors get a generic message. The SDK does not promise that server-side rejection codes will be exposed to the client. A response is never used as proof of a legitimate score.

## Secure-backend boundary

No backend has been added because the current game is a client-only Canvas game and the official documented client-only approach is available. **A secure, server-authoritative score-validation system is not implemented.** If stronger anti-cheat is required, that is separate work requiring trusted run validation, token verification, and server-only credentials; merely adding a server that accepts arbitrary browser scores would not solve it.

A future backend must verify CrazyGames user tokens server-side, not trust `__dangerousUserId`, validate score/timestamp and run integrity, keep the API key server-side, enforce idempotency, and follow the official API's per-score errors. HTTP 429 must respect `Retry-After` with bounded backoff; no-active-season, user-not-found, privacy-disabled, validation, and internal-server-error need appropriate handling. None of those secret-key API calls are made by this client integration.

## Files added

- `src/game/leaderboard/config.js`: disabled approval/key/URL placeholders and proposed approved settings.
- `src/game/leaderboard/encryptScore.js`: documented HTML5 encryption and key decoding.
- `src/game/leaderboard/completedRuns.js`: live engine receipt registry.
- `src/game/leaderboard/access.js`: configuration/platform/account access checks and bounded waits.
- `src/game/leaderboard/submitRun.js`: completion-only validation, one-attempt policy, cooldown, exact SDK dispatch.
- `src/game/leaderboard/errors.js`: player-safe error messages.
- `src/hooks/useEndlessLeaderboard.js`: background per-run submission status and stale-result guard.
- `src/hooks/useLeaderboardAccess.js`: screen access loading/recheck lifecycle.
- `src/components/game/leaderboard/LeaderboardEntry.jsx`: main-menu entry.
- `src/components/game/leaderboard/GlobalLeaderboard.jsx`: personal record and official access screen.
- `src/components/game/leaderboard/LeaderboardAccessState.jsx`: availability/errors/configured official page link.
- `src/components/game/leaderboard/LeaderboardRunStatus.jsx`: game-over status.
- This report.

## Existing files modified

- `src/pages/Home.jsx`: screen wiring and personal-record props only.
- `src/components/game/MainMenu.jsx`: leaderboard entry callback/render.
- `src/components/game/EndlessCanvas.jsx`: begin/end hooks and status prop, without changing its existing result/save callback.
- `src/components/game/EndlessGameOver.jsx`: nonblocking status component.
- `src/index.css`: extend the existing isolated semantic-color scope to leaderboard components.

## QA status and handoff

**Runtime tests NOT RUN.** No account/season, ranking, encrypted-score acceptance, or live leaderboard has been verified. No test score was sent and no real leaderboard configuration is present. No production rebuild or export was performed in this turn.

Use the Testing Agent (test-tube side panel) for the in-app flow. Suggested goal: **“Open Global Leaderboard from my menu, check the personal empty/best states and missing-configuration explanation, finish an Endless run, and confirm Retry, Main Menu, personal records, and gem banking still work.”**

After invitation and real configuration, use the CrazyGames Developer Portal preview/leaderboard QA tool. Suggested goal: **“Check valid, zero, out-of-range, duplicate, failed, signed-out, and inaccessible leaderboard submissions without blocking Endless gameplay.”** The following remain pending:

| Case | Expected behavior | Status |
| --- | --- | --- |
| Valid completed run | One encrypted/plain SDK dispatch; personal save completes; only sent-for-validation status | Pending portal QA |
| Genuine completed zero-score run | Numeric zero passes min=0 validation; not dropped as falsy | Pending |
| Out-of-range / NaN / Infinity / nonnumeric score | No dispatch; no clamp or altered personal score | Pending controlled QA |
| Run not ended / arbitrary receipt / saved lifetime best | No dispatch | Pending controlled QA |
| Repeated game-over handlers | At most one attempt for that run | Pending controlled QA |
| Refresh after completion | No saved-result replay/submission | Pending |
| SDK exception or timeout | Clear status; Retry/Exit and gem saving unaffected | Pending |
| Missing approval/key or malformed key | No dispatch; unavailable explanation | Pending, default configuration |
| Signed-out/unavailable account | No dispatch; personal gameplay remains available | Pending portal QA |
| Privacy-disabled / inactive season | SDK may mask rejection; never show an accepted rank | Pending portal QA |
| Cooldown / rapid retries | No repeated dispatch inside configured interval | Pending |
| Late response after Retry/Exit | No stale status applied to the next run | Pending |
| Global view | Only the configured official game-page link; no fabricated players/ranks | Pending |

The portal's `submitScore` QA message is useful for checking dispatch but, per the docs, is not itself evidence that backend validation accepted a score. Real approved-season verification is necessary before describing this leaderboard as live.