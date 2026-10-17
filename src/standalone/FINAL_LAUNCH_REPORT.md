# Gravity Switch / Fall Force: final CrazyGames launch handoff

Date: 2026-10-17
Status: **Built and packaged launch candidate, not a gameplay-certified release or CrazyGames approval.**

## 1. Implemented features

Code inspection covered the principal navigation, run-state, reward, storage and platform connections. The existing game was retained rather than rebuilt:

- Tutorial, 55 Career levels, Easy/Medium/Hard unlocks, checkpoints, deaths, retries and gravity/hazard handling.
- Optional gems, automatic Gem Rush, gem-priced skins and independent Solo/P1/P2 equipment.
- Six one-time no-death/boundary challenges, UTC daily challenges and achievements with claim guards.
- Rolling Endless and Survival, personal scores, Time Trial records and optional visual ghost recordings.
- Local two-player Race, synchronized countdown, independent course state, finish comparison, rematches and optional best-of-three.
- Audio preferences, platform mute support, reduced effects, touch/keyboard controls and error boundaries.
- Official CrazyGames v3 initialization, lifecycle, Data Module, approval-gated leaderboard and advertising preparation.
- Added optional CrazyGames username presentation using availability checks, getUser() and the documented auth listener. No game login, token decoding, user-ID authentication or paid shop was introduced.

These are implementation/inspection findings, NOT claims that every mode or authored level was playtested.

## 2. Bugs and launch blockers fixed in this pass

1. Account changes could leave a guest save on screen and allow old asynchronous work to target the selected account. The game now reloads the SDK-selected save, retires the previous session, rejects stale transactions/score submissions and clears pending ad rewards. Wallets are not merged. CrazyGames documents logout as a platform page refresh; guest data is left to the SDK, never erased by this game.
2. A transient missing SDK record could replace a previously loaded valid save with defaults. It now protects the known save and blocks uncertain writes, with a warning.
3. Malformed nested daily-task data could crash task iteration or lose claim protection. Daily tasks are normalized while preserving already-claimed flags, including malformed truthy claim timestamps.
4. Large optional ghost recordings could prevent unrelated progression/wallet saves. Oldest recordings can now be removed near the 900 KB safety budget while keeping best times, splits, inventory and every reward receipt. Essential records are never pruned just to hide a size error.
5. Gem-placement clearance did not cover a horizontally moving saw's full travel range. That range is now included. Existing course-signature validation continues to prevent attaching a mismatched ghost to a changed course; older stored records are not erased.
6. Endless/Survival and Race focus loss incorrectly emitted gameplay-stop events. Focus-only pauses are now separated from explicit pauses; orientation pauses remain genuine breaks. Race reports gameplay start when racing begins, not during its noninteractive countdown.
7. Tutorial and Career continuation could race their queued save transactions. Continue buttons now wait for the transaction result and failed completion saves can retry the same result without re-running the level or duplicating gems.
8. Standalone metadata still advertised 35 levels. Hosted/standalone descriptions now reflect 55. The packager now works with Python's standard ZIP library when the zip utility is absent, and the standalone build rejects reachable Base44 SDK/auth/API modules.

The previous Endless fix is still present: there is no score-based finish at 3,000, generation advances ahead of the runner, old world items are culled and large coordinates are rebased. **A beyond-3,000 playthrough was not performed in this pass.**

## 3. Checks actually performed

| Check | Result |
| --- | --- |
| Hosted production build | PASS |
| ESLint on changed game/platform/hooks/UI surfaces | PASS |
| Separate standalone production build | PASS |
| Standalone module-graph exclusion of Base44 SDK/auth/API code | PASS, enforced during build |
| Inspection of built entry paths | Relative JS/CSS paths and official v3 SDK script present |
| Inspection of bundled fonts/licenses | Seven local font files and both license notices included |
| Search for hosted Base44 API / Stripe / Xsolla endpoints in candidate JS | No matches in inspected output |
| ZIP creation and CRC/integrity check | PASS using Python standard library |
| Playthroughs, browser-console inspection, device benchmarks and live platform calls | NOT PERFORMED; see regression handoff |

The final submission ZIP contains 12 files, approximately **822 KiB compressed / 2.0 MB unpacked**, with index.html at its root. Nonblocking build warnings remain: an approximately 543 KB minified JS chunk and an older Browserslist dataset. These are not runtime performance test results.

## 4. Saves, limitations and remaining verification

One atomic progress record retains gems, purchased/equipped skins, levels/group progression, challenge claims, tutorial status, achievements, daily history, personal records and settings. SDK Data Module storage is primary whenever the supported SDK is active, including guests; browser storage is the fallback off-platform/unavailable. Valid same-origin legacy browser data migrates only when no SDK save exists. Existing SDK data is authoritative.

Malformed originals/read failures are protected rather than overwritten. Purchases require an accepted persistent write. Gameplay can continue with session-only progress and a visible warning after save failures. An accepted Data Module setItem is NOT proof of completed cross-device cloud backup; SDK cloud saving may debounce for up to 30 seconds. No undocumented flush or acknowledgement is invented.

Important limitations:

- **Cross-origin migration is not possible automatically:** the CrazyGames iframe cannot read the existing base44.app origin's browser storage. This build does not include a cross-origin progress-transfer service.
- The 900 KB guard keeps this game's encoded record below the documented 1 MiB limit with headroom. If essential ledgers alone eventually exceed the budget, the durable original is retained and new gameplay remains session-only with a warning; old receipts are not deleted and made payable again.
- Ghosts are optional, bounded recordings, not authoritative re-simulations. Old recordings may be unavailable after a real course-signature change or save-space compaction; stored best-time data is retained.
- Economy/progress is client-authoritative and is not suitable as payment validation or a trusted competitive backend.
- The current visible game title remains **Fall Force**. Confirm that submission metadata uses this title, or request a deliberate rename to Gravity Switch before submitting; this pass did not silently rebrand the game.
- Full Launch entry-flow/visual requirements, mobile safe-area behavior, hardware performance and all live integrations still require portal/device QA. No assertion of zero remaining gameplay bugs is made.

## 5. Portal settings and approvals

At https://developer.crazygames.com/:

- Choose HTML5 and upload the prepared ZIP, not the regular hosted Base44 app or a ZIP containing a parent output folder.
- Set **Progress Save: Yes, using the Data Module from CrazyGames SDK**. The Data Module is disabled if the required setting is not selected.
- Configure landscape orientation. Enable mobile/browser support only after testing the actual supported devices.
- Keep ads disabled for Basic Launch. This build's approval and individual ad flags remain false; no fake ads or rewards are presented as successful.
- Official leaderboard approval/configuration is still absent: approved=false, client encryption key empty, official game URL empty. Rankings are not live.
- Real-money purchases/Xsolla remain unimplemented and disabled. Gem-priced skins do not depend on payments. No randomized paid loot boxes.
- Race is same-device multiplayer; online rooms, invitations and instant multiplayer are not implemented or advertised as active.
- Profile/Data Module integration is prepared, but real account availability and cross-device synchronization have not been confirmed in the portal.

## 6. Credentials/configuration needed

No private credentials or paid-service keys are needed for this Basic Launch candidate. Portal ownership, submission metadata and genuine cover/gameplay assets must be supplied by the owner.

If CrazyGames approves the optional leaderboard, supply its documented **public client encryption key**, exact official game URL and matching score limits/sort/cooldown settings. A server API secret is NOT that client encryption key and must never be included in browser code. Advertising needs actual portal approval plus the intended format flags, not invented credentials. Future paid inventory or custom server authentication would require separately designed authoritative server validation; neither is part of this launch candidate.

## 7. Standalone HTML5 export

**Yes: the separate game-only configuration compiled successfully.** It is not the ordinary Base44 hosted shell. It excludes Base44 authentication, router/providers, database, backend API calls and the Base44 Vite plugin, while retaining the playable game modules. Fonts/licenses are local, audio is procedural, and packaged asset paths are relative. The official CrazyGames SDK CDN remains the intended external platform dependency; without it the game falls back to browser saves.

Reproduce from exported source with dependencies installed:

`bash standalone/prepare-standalone.sh`

This creates dist-standalone and gravity-switch-crazygames.zip without replacing the hosted application's source. A successful build/ZIP check does not establish iframe gameplay compatibility or portal acceptance. No private credentials or player save files are included in the candidate ZIP.

## 8. Exact next steps / regression handoff

1. Download the candidate ZIP and this report. Do not submit it as already gameplay-certified.
2. Open the **Testing Agent** (test-tube icon), describe the goal and press **Run**. Example: “Complete the tutorial and representative unlocked Easy, Medium and Hard levels; verify saves after refresh.” Another goal: “Check Endless beyond 3,000 points, Survival retry, Time Trial ghosts and two-player Race rematches on desktop and mobile.” Use a legitimately progressed test profile for locked courses, not fabricated production achievements.
3. Complete the following outstanding matrix; all rows below are **NOT PERFORMED in this pass**:
   - Tutorial finish/skip/replay, Career menu returns, checkpoints, death/retry, stopped timers and all hazard classes.
   - Optional pickups and automatic Rush, including entry/recovery space and death/finish during Rush.
   - Skin purchase affordability, one deduction, repeat clicks, independent equipment and rejected saves.
   - Every no-death/boundary reward, daily/achievement claims, duplicate callbacks and UTC rollover.
   - Endless beyond 3,000 and a long run, Survival game over/retry, records after leaving a run.
   - Time Trial success/death, record replacement, no-record regression, ghost playback and full-save-space behavior.
   - Race countdown, simultaneous finishes, rematches, best-of-three and independent touch halves.
   - Refresh/new session, missing/malformed data, write failures, same-origin migration, guest login with/without an existing cloud save, logout and cross-device restoration after SDK debounce.
   - SDK unavailable, optional features disabled, adblock/unfilled/error paths, duplicate ad callbacks and audio state restoration; live ad fills require approval.
   - Desktop keyboard/mouse and real touch devices; suggested viewports 1108×720, 1366×768, 844×390 and 667×375, plus portrait rotation behavior. Inspect browser console, RAF/listener cleanup, memory growth and long-run performance on Chrome/Edge and supported Safari/iOS devices.
4. Register/sign in to the CrazyGames Developer Portal, upload the root-entry HTML5 ZIP and configure Progress Save/orientation/title/controls/covers.
5. Use its official preview/QA tool to check SDK events, guest/account saves, platform mute and actual iframe behavior. Resolve failed rows before submission. Do not enable ads, leaderboard or purchases just to make the feature list longer.
6. Submit for CrazyGames review after the regression matrix passes; acceptance, Full Launch approval and monetization are decisions/configuration outside this build.

Official references reviewed: SDK Data, User, Game and Leaderboards Client documentation; technical, account-integration, advertisement and launch requirements at https://docs.crazygames.com/; submission portal at https://developer.crazygames.com/.