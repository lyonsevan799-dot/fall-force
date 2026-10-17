# CrazyGames v3 advertising preparation

## Approval status

All advertising formats remain OFF. The presence of the SDK, a published Base44 game, or a successful local SDK initialization does not establish CrazyGames approval. No placeholder ads, third-party advertisements, synthetic successful callbacks, or rewarded currency are served when advertising is disabled.

Only enable `approved` and individual format flags in `src/game/platform/ads/config.js` after confirming the current game's portal launch status and permitted formats. Runtime also requires the already-initialized official SDK in its `crazygames` environment. Basic Launch errors disable the affected format. Local SDK test ads are deliberately not enabled in this build.

## Placements and policy

- Rewarded: an optional Shop offer for exactly 50 bonus gems after ONE successfully completed advertisement. Existing levels, skins, modes, and progression are not gated by ads. Normal gameplay remains the alternative way to earn gems. The unavailable button is disabled with an explanation.
- Midgame: only the career level-completion Next / Next Group transition. Never on menu, settings, shop navigation, an active run, race, or active Gem Rush. Completion during a remaining Rush flag bypasses the ad and still continues correctly. A run ID deduplicates a break. Ad errors/unavailability continue normally.
- Video frequency: conservatively wait at least three minutes after entering the session and between video requests, in addition to SDK-enforced cooldowns. No ad chaining or automatic retries.
- Banner: one real 320×50 container in the Shop, not during gameplay or a skin detail overlay. Its container must be fully inside the game viewport and visible for five seconds before a request. It is removed when hidden, occluded by app overlays, unmounted, or a video is being requested. A minimum global 30-second request interval and at most 120 total banner requests per session are enforced; there is no automatic refresh loop. A failed request never displays substitute artwork.

## State and reward guarantees

Video requests have a single global lock and per-request terminal guard. Gameplay is held during the request and SDK callbacks; audio is muted only on `adStarted`. Duplicate/late callbacks cannot award twice or release another request's state. A resolved request promise is NOT successful ad completion. Only the official `adFinished` callback produces a completed rewarded receipt. On `adError` no reward is authorized.

Audio uses a dedicated ad-mute layer, separate from CrazyGames `muteAudio` and player music/SFX preferences. The context/music state is captured before requesting and restored only as appropriate. Previously paused engines stay paused; a hidden page stays paused pending explicit player resumption. Engine identity and run IDs prevent restoring a different run. Focus-loss handlers ignore ad-owned focus changes.

Reward receipts and wallet credits persist together using the existing atomic save system. Duplicate credit attempts reuse the same receipt ID and do not increment gems again. A failed save can retry the confirmed receipt without a second ad, including after navigating away and returning to the Shop in the same session. An unsaved receipt is in memory only if storage itself is unavailable; a reload cannot preserve data that could not be written.

Video errors handled: adsDisabledBasicLaunch, unfilled, adblock, adCooldown, other. Adblock is checked using hasAdblock(); the detection has a bounded five-second wait. Detected blocking disables the optional offer for the session without blocking gameplay.

Banner errors handled: bannersDisabledBasicLaunch, unfilled, missingId, notVisible, noAvailableSizes, notCreated, videoAdPlaying, invalidSize, bannerCooldown, maxRefreshReached, bannersDisabledMobileApp, other. Terminal capability/refresh-limit errors disable future banner requests; other errors remove the placement without retrying automatically.

## Game-feel scope

Core gravity, movement, collision, level layouts, score timing, and race respawn timing are unchanged. The existing death impact pause now holds the actual visual frame; Race uses a per-player visual hold without freezing the opponent. Rush receives a distinct dual-color ribbon. Reduced mode emits fewer gem particles, omits pickup rings and full-screen flashes, and disables menu/new-record movement. Existing flip springs, completion bursts, checkpoint feedback, and responsive controls remain. Turning off screen shake clears ongoing shake on the next simulation update. Operating-system reduced-motion preferences disable UI animation too.

## Runtime verification handoff (not claimed as completed)

Use Testing Agent for playable UI scenarios. Successful live ad and real banner verification additionally requires an approved/configured CrazyGames game page; disabled preview behavior cannot certify an ad fill.

Suggested goals:
1. With ads disabled, open Shop, inspect the explanation, play and complete career, Endless, Survival and Race, and confirm all progression remains available.
2. In an approved SDK test environment, exercise adblock, unfilled, adCooldown, adsDisabledBasicLaunch and other. No failed request may award any gems.
3. Complete one rewarded ad. Confirm exactly 50 gems are credited once. Repeat adStarted/adFinished and trigger a late adError; balance must not increment again.
4. Attempt simultaneous requests and rapid repeated clicks. Confirm only one SDK request occurs and all inputs stay blocked until the terminal callback.
5. Start from paused gameplay, muted music/SFX, a running audio context, a suspended context and platform muteAudio=true. After success/error, confirm previous states/preferences remain correct. Change platform muteAudio during the ad and confirm the latest setting wins.
6. Advance after a completed career level. Confirm no midgame call during active physics or Gem Rush; repeat Next for the same break and verify no repeated request. Ad errors must still lead to the next level.
7. When banners are approved, inspect desktop and mobile, narrow windows, scroll-out, tab hiding, video start, Shop exit and skin details. Verify full containment, cleanup, no fake fallback, no requests within 30 seconds and no requests after the session cap.
8. Check new-record, checkpoint, death, completion, Rush, reduced effects and shake-off feedback on desktop and mobile. Verify no animation changes physics or allows movement after death/completion.

Official references inspected:
- https://docs.crazygames.com/sdk/video-ads/
- https://docs.crazygames.com/sdk/banners/
- https://docs.crazygames.com/requirements/ads/