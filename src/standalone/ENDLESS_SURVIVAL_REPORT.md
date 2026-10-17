# Endless / Survival overhaul

## Inspection and diagnosis

Inspected the existing procedural chunk DSL and emitter, Endless engine, shared engine and surface solver, hazard geometry and drawing, gem placement/Rush waypoints, score receipts, wallet receipts, menu, HUD, save normalization, focus lifecycle, and input/restart handling.

There was **no 3,000-point score limit** in the inspected source. The specific reported freeze was not reproduced in a browser this turn, so an exact score-threshold root cause is not claimed. Concrete unsafe paths were removed rather than changing a score cap:

- A generation `while` loop had no work budget or output/progress validation.
- Finite-course finish checks and camera-end clamping still applied to a no-finish course.
- Repeated expert portal chunks could accumulate speed multipliers indefinitely, while future obstacle spacing assumed only the bounded base speed.
- Culling was conditional on a minimum item count and could retain ever-growing speed objects; group tails could be retired separately from their trigger.
- Authored chunk gems were emitted without the post-emission safety validation used by Career.
- The canvas scheduled its next animation frame before checking completion, kept running after game over, and also installed a second lifecycle observation frame chain.

## Implemented

Both procedural modes now use a rolling generator, independent of Career level count. Each generated encounter confines all lethal objects to one wall's region and leaves the opposite wall safe at every phase. Alternating encounters have an unobstructed full-height crossing/reaction gap sized for their future speed. Same-wall combinations increase variety without closing the escape route. The old expert full-corridor random combinations and accumulating boost portals are not used in these modes. Career and Race retain their own hazards and layouts.

Difficulty follows `1 - exp(-distance / 18000)` continuously, with a bounded speed increase, more encounter types/combinations, and gradually reduced but conservative crossing gaps. It never resets at a score threshold. Generation runs ahead of movement, validates finite output and forward progress, and has a fixed work budget with a valid spike encounter fallback. A look-ahead window adapts to the viewport. Retired objects/rows are culled, and large world coordinates are periodically rebased without resetting distance, score, difficulty, timers, or collected flags.

Endless retains its distance/difficulty/streak scoring structure and gem bonuses. Its planned official CrazyGames leaderboard configuration, access checks, encryption, receipt/submission flow, range, and approval status are untouched. Survival does not instantiate the leaderboard hook or submit a score.

Survival has its own menu entry, rule/start screen, active-simulation timer, 100 points per survival second, optional gems, current and personal-best score/time, game-over screen, Retry, and Main Menu. Its normalized records are stored separately as `survivalRecords`. Existing Career, Endless, Race, shop, and Time Trial records are retained.

## Collision, gems, and lifecycle

- Individual static and retracting spike triangles match the drawn teeth. Other generated hazards use the shared circle/segment/laser geometry with forgiving player bounds.
- Fine physics steps and bounded slow-frame catch-up prevent high-speed single-frame jumps through hazards. Touching a lethal shape changes the engine to dying immediately; score/movement then stop and dead is terminal until an explicit retry.
- Long frame stalls are bounded to 250ms of catch-up; the timer measures active simulated survival, not time spent paused or in a background tab.
- Single/three-gem clusters stay ordinary. Four-to-six-gem rows use a larger automatic trigger and the existing continuous waypoint motion. Reserved full-width entry/recovery rooms prevent a future chunk from invading a Rush route. No hold input, teleport, or immunity is added.
- Saved wallet balance and this-run pickups are shown separately. Gems are banked once when a run dies, is restarted, or is ended through the menu. Saving status and a failed-save retry action are provided. Run-ID wallet receipts prevent duplicate awards, including zero-gem runs; Survival record counts use the same guard.
- One frame chain drives each canvas. Restart invalidates/cancels the previous chain; game over stops it. Unmount removes frame, resize observer, focus/visibility/orientation, and keyboard listeners. Flip inputs are ignored during death/game over; explicit retry shortcuts remain available. Blur/hidden tabs pause active runs.

## Verification status

The build command completed without a reported build error. **No runtime playthrough or long-session test was executed in this turn.** Neither a reproduced 3,000-point freeze nor a verified high-score fix is claimed; those require runtime QA.

Open the Testing Agent (test-tube side panel), enter either goal, and press Run:

1. “Play Endless below 3,000, across 3,000, beyond 30,000 and 100,000 points. Check continuous generation, increasing score/difficulty, every generated hazard, safe gaps, ordinary gems, automatic Rush, game over, banking, repeated retries, and stable responsiveness.”
2. “Check Survival start rules, timer and 100-points-per-second score, increasing hazards, pause/background/resume, gems/Rush, death, failed-save retry, repeated restarts and return to menu. Confirm separate persistent personal records and no official leaderboard submission; also check desktop/mobile controls and low frame rates.”

Further targeted QA should cover coordinate rebasing after one million world units, whole-row retirement, rapid restart/exit while a save is pending, double game-over callbacks, and unchanged Career/Race/Time Trial behavior.