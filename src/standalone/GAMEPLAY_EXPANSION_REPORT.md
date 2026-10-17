# Gameplay Expansion: Stage 1

## Delivered

- Twenty authored Career levels appended as **36–55**, from Afterburn to Beyond Gravity. Each has a distinct explicit section order, mixed encounters, recovery space, checkpoints, and an authored optional five-gem Rush room. No random obstacle placement is used.
- Original level numbering and saved Career completion/stars/times remain keyed to the same indices. Easy stays 1–12, Medium stays 13–23, Hard extends from 24 through 55; moving old levels between groups would change existing progression, so it was avoided. Sequential progression and completion of every level in preceding groups still gate access. Gems are never completion requirements. A save that completed the old Level 35 can reach Level 36 through the existing progress normalizer.
- The post-Level-15 reset was structural: the second campaign started new one-obstacle teaching stages after an expert campaign. Its spacing multiplier only shortened distances; it did not restore encounter variety. Levels 16–35 now combine familiar hazards at selected existing section anchors, preserving section order and checkpoint structure rather than restarting basic lessons. New mastery courses retain the existing maximum speed and use varied route combinations and longer switch sequences rather than runaway speed increases. Subjective continuity still needs playtesting.

## Physics and collision repairs

A focused shared surface solver now handles both platform faces, side contact, and relative moving-platform motion instead of deciding contact solely from gravity direction. Horizontal and vertical platform displacement carry supported players. Walking off or losing a disappearing platform releases support. Both the normal engine and Race use this solver; Race rewards, winners, respawn rules, and controls are not redesigned.

Existing spikes, timed retracting spikes, saws, falling blocks, disappearing platforms, rotating blades, laser gates, crushing walls, bouncing hazards, alternating spike-gap sequences, and static forced-gravity tunnels are reused, not duplicated as decorative new types. Concrete fixes include:

- Falling blocks now collide while falling, not only after landing.
- Rotating blades use continuous segment intersection instead of spaced point samples.
- Solid disappearing platforms display a red depletion bar and remaining seconds before disappearance; the existing return warning remains.
- Gravity-tunnel arrows now point and drift in the actual gravity direction. Opposing manual flips are rejected inside the field instead of flashing a flip that is immediately undone.
- Pause and automatic Rush reject conflicting flip inputs. Desktop keyboard/mouse and mobile taps remain; canvas handlers ignore interface controls. Existing menu/tutorial control guides remain.

## Gem Rush and checkpoints

Rush starts at the actual player position and follows remaining gem waypoints continuously. It no longer jumps to the first uncollected gem. The oversized trigger remains automatic, with no hold requirement. Normal lethal collision remains active; solid collision ends Rush at the resolved safe face rather than leaving the player embedded. Normal control resumes after the last waypoint. Pickup flags prevent collection of an individual gem twice.

Authored rows are validated after all obstacles are emitted. Generated and authored rows check the player's width across the path, conservative moving-platform/hazard sweep bounds, recovery space after Rush, and checkpoint crossings. Invalid rows are omitted rather than forcing a dangerous automatic route. Groups of one to three stay ordinary; a row of N now has N gems including its trigger, not N plus an extra trigger. New courses supply purpose-built optional row rooms and the existing lane enrichment adds ordinary alternate-route gems.

Full restart re-arms checkpoints. Checkpoint snapshots now retain matching gem counts and collected flags, preventing gems near a checkpoint from being lost or counted twice after respawn. These flags are runtime level state, not changes to saved Career records.

The Time Trial physics signature is updated to avoid replaying/comparing incompatible old physics traces. Existing stored records are not proactively deleted, but incompatible entries are not current-course bests; a successful new-course result can replace that level's old entry.

## Not implemented in this stage

- Scheduled gravity pulses.
- Timed gravity-lock objects distinct from the existing forced-gravity tunnels.
- Moving gravity fields.
- True paired transport portals and their safe arrival routes. Existing portal objects still reorient gravity and boost speed; they do **not** transport the player and are not presented as the requested new transport mechanic.
- Dedicated safe introductory lessons for those new gravity objects. Those belong with the mechanics in the next stage, not placeholder graphics in this one.
- Literal floor pits are not added; multi-gap sequences use the existing alternating spike-cluster architecture.

## Runtime QA: pending, not certified

No end-to-end playthrough, desktop/mobile interaction test, impossibility proof, or cross-mode regression test was executed. The new levels and difficulty curve are **not claimed fully verified or guaranteed finishable**. Use the Testing Agent (test-tube side panel), enter a goal, and press Run:

1. “Play Career Levels 36–55 from start to finish. Check every hazard type, gravity tunnel, checkpoint respawn, completion, optional gem route, and automatic Gem Rush. Report any unavoidable death or impossible sequence.”
2. “Verify Level 15 to 16 difficulty continuity, old-save restoration, every-level group unlocking, and desktop/mobile controls. Check platform flipping/carrying, checkpoint gem accounting, Race, Endless, Tutorial, and Time Trial for regressions.”

Testing the deferred new gravity mechanics must wait until their actual implementation. No official leaderboards, payments, account integrations, or platform save storage were replaced.