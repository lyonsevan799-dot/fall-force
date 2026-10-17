# Gravity Switch / Fall Force: stability and publishing report

> Historical stability report. The subsequent SDK v3 and save integration is described in `CRAZYGAMES_INTEGRATION_REPORT.md`; its status supersedes the SDK/cloud-save notes below.

Date: 2026-10-16

## Status

A code-level stability pass and a real standalone production build have been completed. This is a **Basic Launch candidate**, not a completed gameplay QA pass or a claim that CrazyGames will accept the game. No browser gameplay, device session, portal upload or account action was performed in this pass. Do not submit as fully verified until the checks below have been completed.

The existing game, all 35 Career level specifications, Easy/Medium/Hard groups, Endless chunks, six Race tracks, original modes, local save key, mechanics and challenge reward amounts have been retained. No existing player save was cleared. The in-game name remains **Fall Force**, as in the existing project; the project is referred to here as Gravity Switch. Choose consistent portal metadata and cover branding before submission.

## Confirmed problems fixed in source

| Area | Underlying issue | Fix |
|---|---|---|
| Death and finish | A collision could set the player to dying, then the same simulation step could call the finish handler and overwrite death. | Finish requires an active playing state and cannot fire twice. |
| End-of-level economy | Physics, triggers, pickups and hazards kept updating after completion; the remaining substeps of a frame also ran after death. | Freeze world simulation at completion and stop the current substep loop on death/finish. Particle, death and victory effects continue appropriately. |
| Physics timing | Hazard clock advanced a full frame before all physics substeps were processed. | Advance simulation time with each substep in solo and Race modes. Gravity constants, collision sizes and obstacle layouts were not replaced. |
| Playable bounds | Boundary resolution only clamped the surface matching the current gravity direction. | Clamp actual top/bottom bounds in either direction while retaining normal directional landing behavior. Middle-challenge observation still happens before correction. |
| Moving blades | Fractional-spin blades wrapped their angle at every whole second, causing discontinuous jumps. | Use continuous rotation time in the shared collision/render geometry. |
| Endless difficulty | Pre-generating future chunks immediately changed the current player's speed/theme to the future difficulty. | Separate future chunk spacing from player-position-driven current speed, score difficulty and theme. |
| Endless generation | Generation relied on a virtual level end rather than the actual generated frontier; consecutive random chunks could repeat. | Maintain a real 2,200-unit generated buffer, avoid immediate identical chunk names, and reduce expensive behind-player culling to spaced intervals. Long runs still require gameplay QA. |
| Gem Rush rows | Authored four-or-more gem rows had group metadata but no trigger gem. Separate placement helpers also reused the same numeric group IDs. | Give authored rows a trigger, and namespace group IDs so unrelated rows cannot be merged into one rush. |
| Pickup safety | Direct repeat calls to collection methods could increment an already collected gem. | Ignore collected gems and inactive states. |
| Race fairness | Moving-platform history was stored on the shared platform, so one racer could consume the movement delta before the other. | Track carried-platform height per racer. |
| Race shared hazards | The trailing racer could reset a drop/trap already triggered by the leading racer. | Use one shared leading-racer trigger position for these world hazards. |
| Race focus loss | A finished-race grace period could be paused on tab switching, but Resume refused the finished state. | Allow the grace period to resume without restarting or paying a reward early. |
| Focus and controls | Solo keyboard handlers could intercept Space/Enter on settings controls and buttons; right-click could flip gravity. | Ignore focused controls in game handlers and reject non-primary mouse presses. A shared lifecycle hook pauses active modes on tab/focus loss. |
| Audio lifetime | Music scheduling could catch up thousands of missed notes after a suspended tab, and audio resources were not disposed when the game unmounted. | Skip missed scheduler backlog, clean up listeners/timers/context, suspend hidden-tab audio, and retry interrupted iOS audio on a user gesture. |
| Gem HUD | Live run gems were added again to the displayed total after being banked on Career completion or Endless death. | Pass zero unbanked gems after the save is credited. The underlying currency balance is unchanged by this display correction. |
| Saved data | Partially invalid fields could break menus; a wholly unreadable save was replaced without a recovery copy. | Normalize fields independently, keep unknown fields and valid progress, clamp invalid/negative currency and volumes, restore sequential unlock index from completion records, and back up unreadable JSON before fallback. |
| Challenge amounts | The claim helper accepted an arbitrary reward value from its caller. | Resolve the exact reward from the canonical challenge definition and retain the already-completed guard and failure history. This is local validation, not server security. |
| Group navigation | Next Level could enter a later difficulty group without checking its unlock condition. | Recheck normal level/group access at the transition and return to the current level picker if blocked. |
| Small-screen overlays | Result, pause and reward panels could extend beyond short landscape viewports with no scroll access. | Make these overlays scrollable and prevent panel shrinkage. Actual device legibility remains unverified. |
| Reward animation | The reward amount used a toast animation whose final frame made it invisible. | Keep the amount visible after its entrance while retaining confetti and celebration effects. |
| Development surfaces | Production game code exposed a writable warp/debug handle and logged placement traces as console errors. | Remove the debug handle and placement logs. |
| Runtime failures | A render failure could leave only a blank game. | Add a player-readable reload screen that does not clear saved progress. This is a fallback, not a replacement for fixing underlying errors. |
| Standalone export | The old preparation script deleted all hooks, including the game's tap control, and overwrote the hosted project's entry/config files. Asset URLs were absolute. | Replace it with an isolated, non-destructive build configuration, preserve all game hooks, and emit relative bundle paths. |
| External asset dependency | The export required Google-hosted fonts at runtime. | Bundle the existing Inter/Orbitron faces and their SIL Open Font License notices locally. |
| Portal fullscreen | The mobile rotate-dismiss action could request custom fullscreen, prohibited by current CrazyGames gameplay requirements. | Disable this custom request in the CrazyGames build only. Hosted behavior is preserved. |

## Rules retained from the existing implementations

- No-death rewards: Easy 100, Medium 350, Hard 1,000 gems.
- Stay in the Middle rewards: Easy 1,000, Medium 2,500, Hard 4,000 gems.
- One-time challenge claims stay recorded under the original save key. Previous failures are retained. New Middle attempts start in mid-air from the full level's start; checkpoint respawn or an in-run restart cannot turn a failed attempt into a successful one.
- Medium access requires every Easy completion; Hard access requires every Medium completion. Normal sequential level unlocks are retained.
- Race has no collectible gems, row rendering or Gem Rush implementation. Finish crossing times are compared independently of P1/P2 update order, including simultaneous ties.
- A Race credit is possible only for an official race-over result with a valid winner. The actual winner is recorded and receives 100 gems in the existing shared local wallet, once per saved race ID. Losses/ties/unfinished results pay zero. Restarting creates a new race, not another credit for the previous race.

These are source-level findings, not statements that the associated gameplay scenarios passed.

## What was actually verified

| Check | Result |
|---|---|
| Existing hosted production build, `npm run build` | Exit code 0. |
| Independent game-only build, `npx vite build --config standalone/vite.config.js` | Exit code 0, Vite 8.2.0. |
| Actual standalone output | 12 files, 1,809,127 bytes total (about 1.81 MB decimal), before ZIP compression. |
| Entry and asset layout | Actual `index.html` at output root; all 9 referenced JS/CSS/font file paths are relative and exist. |
| Base44 runtime markers in emitted HTML/CSS/JS | No Base44 SDK/auth API/debug-handle/placement-log markers found by static text inspection. The reachable game entry excludes the Base44 Vite plugin and auth shell. |
| Remote font dependency in emitted output | No Google Fonts or fonts.gstatic.com requests. Seven font files and two license notices are included. |
| Application service/network dependency | Static inspection found only Vite's local module-preload fetch helper, not game service calls. React documentation links and SVG namespace strings are not runtime service requests. This is not a browser network capture. |
| Gameplay, browser console/network, mobile, iframe and portal session | **Not performed / unverified.** |

The build emitted an outdated Browserslist-data advisory, not a compile failure. It does not establish browser compatibility; browser/device checks remain necessary.

## Actual deliverables and local use

1. **Built-game ZIP**: the actual contents of `dist-standalone`, with index.html at the ZIP root, ready to open in a local HTTP server or upload into the CrazyGames portal's preview for QA. This is not the full Base44 application and includes no account screens.
2. **Standalone source kit**: current game source, controls/lifecycle hooks, fonts, licenses, the isolated build configuration, instructions and this report, with the slim standalone package manifest at the archive root. No credentials or player save data are included.
3. **This report**: findings and unverified checks are deliberately distinguished.

For the source kit, use Node.js 22.12+ and npm, then `npm install` and `npm run build`. The output is `dist-standalone`. Run `npm run preview -- --host 127.0.0.1` and open the HTTP URL printed in the terminal. The source kit's scripts use the standalone configuration; the regular hosted project keeps its existing build scripts.

For a regular Base44 source export, run `npm install` and `npx vite build --config standalone/vite.config.js`, or use `bash standalone/prepare-standalone.sh` after dependencies are installed. The latter packages the output if a ZIP utility is installed. Do not run the old destructive export procedure. Do not double-click index.html: ES-module games need HTTP/HTTPS.

## Remaining limitations / not fixed by this pass

- **All-level reachability and fair timing are unverified.** No obstacle sequence was removed or rebuilt. In particular the original Career specification has a small speed dip from level 14 to 15 and mixed spacing changes afterward; a consistently increasing experiential difficulty curve cannot be certified from specification numbers alone. No speculative rebalance was applied without playthrough evidence.
- **Long-run Endless behavior above 3,000 and beyond is unverified.** Generation/difficulty defects were fixed in source, but procedural combinations, repeated portal speed boosts and very long-session behavior still need soak testing.
- **The economy is entirely client-side.** There is no account-specific wallet or authoritative reward server in the existing game logic. The hosted Base44 app shell has authentication, but game progress itself is localStorage. Local saves are editable by their owner; these gems are not suitable for cash/competitive rewards without a trusted service.
- **Persistence has normal browser limits.** Private browsing, blocked storage, browser data clearing and quotas can prevent persistence. Field normalization and recovery backups do not create cloud backup. In-progress unbanked run earnings can still be lost on exit, restart or refresh; the existing finish/death banking rules were not replaced with a new economy.
- **Progress does not cross origins automatically.** Existing Base44 saves stay untouched on that origin. A new CrazyGames origin cannot read them. Keep the same portal game/origin for later releases; a user-facing transfer/cloud-save flow would be separate work.
- **Portal acceptance, covers, videos and rights review are pending.** The existing game title/branding should be reconciled with the submission name before creating final promotional assets.
- **SDK integration is not present.** This candidate deliberately targets Basic Launch, where it is currently optional. No fake SDK, advertisements, accounts or unapproved tracking were added. Full Launch requires further official integration work.

## Gameplay QA handoff: do not mark these passed yet

Use Testing Agent (test-tube icon in the side panel), describe the goal, and press Run. Two suggested goal batches:

1. "Verify Career progression, every level's start/finish, checkpoints, deaths/restarts, all six challenge success/failure rules and one-time gem rewards, and save persistence after refreshing, without clearing existing progress."
2. "Verify Endless beyond score 3,000 and several milestones, Race P1/P2 wins and exact ties, duplicate finish protection, abandoned/restarted races, every menu, focused settings controls, keyboard/touch, pause/resume, resize and tab switching."

Use a separate browser profile for destructive new-save and corrupted-save scenarios. Never erase the existing player's primary save to run QA. For controlled race ties or corruption tests unavailable through normal input, use a dedicated development/test harness outside the release build; there is no production warp button.

Manual/browser acceptance matrix, all currently unverified:

- New profile: complete an Easy level, die and respawn at each checkpoint, restart, complete again; check time, stars, pickups and finish behavior.
- Complete all Easy levels and confirm Medium opens only then; complete all Medium levels and confirm Hard opens only then. Confirm blocked Next Level cannot bypass a group gate. Load/start/finish all 35 levels.
- All three no-death challenges: win without death, fail by dying, retry, replay after reward; expected rewards 100 / 350 / 1,000 exactly once.
- All three Middle challenges: touch top, touch bottom, switch away at contact, collide at the finish, die, pause, restart and retry; failure must latch within an attempt. Clear each valid full run for 1,000 / 2,500 / 4,000 exactly once.
- Check gem balance before/during/after Career completion and Endless death; collect each gem once; repeat finish events; refresh and reopen after banked rewards. Verify recovery of an outdated/partially invalid save in a separate profile.
- Endless: run above 3,000, cross multiple distance milestones, trigger Gem Rush, deliberately die, retry repeatedly, verify generation ahead and no unkillable/post-death movement. Soak-test higher portal counts and memory use.
- Race: controlled P1 win, P2 win, simultaneous tie, loser DNF, pause/resume in the finish grace period, rapid rematches, R spam, abandoned race, reload before the official result and replayed completion notification. Only one valid winner should credit the shared wallet by 100.
- Desktop Chrome/Edge, Safari, Chromebook/4 GB class device, Android Chrome and iOS Safari: Space/W/arrows/Enter, touch halves for Race, right-click, focused sliders/buttons, audio gesture unlock, tab/focus loss, mobile app interruptions, resizing, orientation and repeated navigation.
- Portal/iframe sizes: 821x462, 907x510, 1077x606, 1216x684; fullscreen 1366x768 and 1920x1080; mobile landscape 800x450 and tablet 1080x607. Check legibility, safe areas, scrolling overlays and taps.
- Test 60/120/144/165 Hz where available; compare movement and collision timing. Keep browser console and network inspector open during the release-candidate session and record any real failures. No console/network pass is claimed here.

## Current CrazyGames requirements and exact next steps

Official pages reviewed, 2026-10-16:

- https://developer.crazygames.com/
- https://docs.crazygames.com/requirements/intro/
- https://docs.crazygames.com/requirements/technical/
- https://docs.crazygames.com/requirements/gameplay/
- https://docs.crazygames.com/requirements/game-covers/

1. Finish the QA matrix above and resolve any newly observed issues. The current candidate is below the Basic Launch no-SDK total-size limit of 50 MB, mobile-homepage 20 MB threshold, 250 MB maximum total and 1,500-file limit, but size is only one requirement.
2. Run the built ZIP through a local HTTP preview, then upload it into the official Developer Portal's game preview/QA tool. Use the HTML5 upload flow and select the root index.html when prompted. Verify actual portal behavior before submitting for review.
3. Configure the supported orientation as landscape. Let CrazyGames provide fullscreen. Check mouse/keyboard and touch support against the devices actually tested, not presumed support.
4. Supply accurate English game description and controls, a consistent title, and rights-cleared promotional material. Current mandatory cover sizes are landscape 1920x1080, portrait 800x1200 and square 800x800. The current cover page also requires landscape and portrait preview videos, 15–20 seconds, silent, maximum 50 MB; follow the portal's current upload specifications.
5. Submit as **Basic Launch**, with no external ads and no external login options. SDK integration is optional at this stage under the reviewed requirements. This build does not request ad permissions or pretend to send SDK lifecycle events.
6. If selected for **Full Launch**, implement the official supported SDK with real gameplay start/stop events and applicable CrazyGames account/progress integrations; recheck requirements and test in their QA tool. Do not monetize this Basic candidate or add ad interruptions as a workaround.
7. Review and address the portal's actual feedback. No upload, submission, approval, payment or acceptance is performed or promised by this report.