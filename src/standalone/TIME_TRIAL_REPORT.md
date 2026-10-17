# Time Trial and Personal-Best Ghosts

## Implemented

- Main-menu Time Trial entry and level selection for all 35 authored Career courses, respecting existing Career group and sequential unlock rules. Each course shows its personal best. Time Trial does not unlock Career content.
- Dedicated Time Trial engine subclass reusing the real movement, gravity, collisions, hazards, pickups, Gem Rush, sound, and cosmetic skin renderer. Every course is cloned so its mutable gems, platforms, portals, and checkpoints cannot alter Career or Race state.
- Explicit Start; timer stays zero beforehand. Fixed 120 Hz simulation and the active gameplay timer advance together, excluding pauses. Crossing the finish line is interpolated within the final physics step; results are saved/displayed at millisecond precision. A death ends the attempt immediately with no auto-respawn or record. Retry creates a clean attempt.
- Focus loss, hidden documents, page hide, portrait interruption, and frames longer than 250 ms pause active gameplay. Resume is explicit. Start/resume timestamps prevent the preceding ready/paused frame interval from being charged to the run. Terminal frames advance visual effects only, never the timer.
- Current run, best at start, exact final difference, saved best, saving/error state, retry, main-menu return, and a brief reduced-motion-aware new-record animation. Slower/tied runs keep the existing record and ghost.
- Toggleable translucent, dashed-outline personal-best ghost. Its recorded path is drawn underneath hazards; the HUD reserves separate screen space above the playfield. The ghost never becomes an engine player, collider, pickup collector, trigger activator, or camera target.

## Replay and comparison

The authored courses have deterministic placement. Playback uses actual sampled positions rather than re-simulated inputs, avoiding physics replay drift. The visual trace samples every 100 ms, quantizes positions to quarter-world-unit precision, and interpolates between samples. Rotation is cosmetic. The replay is explicitly labeled a visual recording, not a second live simulation.

Ahead/behind times are not guessed from ghost distance. First-crossing times at matching 512-world-unit course markers are interpolated in physics substeps. The HUD labels this comparison **Last split**, not a continuous estimate. It works with the ghost hidden and can remain available if only the visual recording is corrupt. Final differences compare exact saved millisecond times.

A course/physics signature rejects incompatible records for comparison. Missing, malformed, oversized, or out-of-bounds ghost data is ignored without preventing level loading. Saved best time can still be used when its ghost is unavailable. Nothing invokes or adds an official Time Trial leaderboard; the existing official Endless integration is unchanged.

## Save isolation and size

Personal records use only `timeTrialRecords` in the established whole-save transaction system. Each record includes its time, course signature, date, run ID, small split-time array, and compact encoded position/rotation trace. The visibility preference is a separate saved boolean. No full game objects, graphics, level geometry, or input history are saved in a recording.

Only genuine completed, zero-death runs are submitted by the Time Trial scene. A strictly faster time replaces a record; ties and repeated callbacks are naturally idempotent. Strict writes do not report an unsaved record as durable; the result screen offers Retry saving on failure. Existing data-budget checks omit an over-budget new ghost while retaining the exact time and splits if those fit, without deleting Career, skins, wallet, or existing other records.

Time Trial is record-only practice: real pickups still operate Gem Rush, but no wallet, Career result, daily-challenge, achievement, Race win, or Endless-score callback is invoked. Its engine mode is excluded by the existing progression event publisher. Other game modes retain their original update loop and behavior; the shared renderer gained only an optional visual-overlay callback.

## Runtime QA handoff — pending

No browser/runtime test, cloud persistence check, or failure-injection test was run. Use the Testing Agent (test-tube side panel):

1. “Test Time Trial start, pause, focus loss, resume, death, retry, completion, new/slower/tied records, refresh restoration, and failed-save retry. Confirm the clock never advances on a result screen.”
2. “Test ghost visibility, marker comparisons, refresh replay, missing/corrupt recordings, and desktop/mobile controls. Confirm ghost playback changes no collisions, pickups, triggers, movement, wallet, Career unlocks, Race players, or Endless scores.”

Also verify actual CrazyGames Data Module restoration in the portal. This is a personal client-side record feature, not server-authoritative anti-cheat or a global leaderboard.