# Daily Challenges and Achievements

## Implemented

Two new main-menu screens reuse the existing wallet, GemCounter, save transaction queue, CrazyGames Data Module adapter, and browser fallback. No existing save was reset or replaced. Existing special challenges are untouched: Easy no-death 100, Medium no-death 350, Hard no-death 1,000 gems; existing Stay in the Middle rewards are also unchanged.

### Daily goals

Each device uses the date `YYYY-MM-DD` in UTC, with a midnight timer and focus/visibility refresh. The first generation of a day's set is persisted and never regenerated as content unlocks. Date-seeded level selection and targets use available content at that first generation. Time-zone travel does not change the UTC date. The device clock is not server-trusted.

Five tasks are provided:

| Task | Normal objective | Reward |
| --- | --- | --- |
| Clean Flight | Finish an unlocked Career level without dying | 25 gems |
| Gem Run | Collect 20 pickups in one Career/Endless run today | 35 gems |
| Beat the Clock | Finish a selected unlocked early Career level without deaths within a traversal-based target | 30 gems |
| Rush Collector | Collect every gem in a full row of at least four gems in Career/Tutorial/Endless | 40 gems |
| Endless Ascent | End an Endless run meeting a modest date-/progress-based point target | 50 gems |

For players whose tutorial gate still blocks Career, Clean Flight becomes actual tutorial completion, and Beat the Clock becomes five tutorial pickups in one run. Tutorial and Endless are already accessible from the existing menu. The selected Career level comes only from unlocked early levels. The speed target is derived from its actual length and speed with a generous margin; a death invalidates that speed attempt, so a checkpoint's reset timer cannot earn it.

Endless has no finite levels. Its task therefore means finishing a run at the target score, not inventing a level completion. Row progress is recorded only when the actual row's gems are all collected, not when Rush merely activates. Single-run gem progress takes a maximum between runs, not a sum of different runs. A run lasts from a full restart until completion/end; Career checkpoint respawns do not create a new full run. Actual repeated pickups count as pickups. A cross-midnight run's pickups are assigned to their actual UTC day; finishing objectives use the finish date.

Failed attempts show Try again without erasing previously completed objectives. Date rollover creates a separate day record; it does not clear old gems, flags, or earned rewards. The date selector lets players view prior days and claim already-completed rewards. Unfinished old goals are expired and cannot gain progress from new-day events.

### Achievements and rewards

| Achievement | Objective | One-time reward |
| --- | --- | --- |
| First Flight | Actually complete the tutorial; skipping is not completion | 50 gems |
| Survivor | Complete 10 Career runs without dying; successful replays count | 150 gems |
| Gem Collector | Collect 1,000 lifetime pickup gems | 200 gems |
| Endless Runner | End an Endless run at 5,000 points | 250 gems |
| Gravity Master | Complete every level in the existing Hard group, indexes 23–34 | 1,000 gems |

Achievements have saved progress/unlock dates, an in-game badge, reduced-motion-aware unlock notifications, and manual one-time claims. Notification acknowledgement is saved independently from reward claims, so a repeated animation cannot grant money. No CrazyGames profile badge/title API or unsupported external reward is claimed.

## Lifetime collection and existing saves

`lifetimeGemsCollected` counts actual observed pickups across Career, Tutorial, and Endless, including unsuccessful runs. It is not the spendable wallet. Skin purchases and bonus rewards do not change it. The existing gem banking/economy is unchanged.

Old saves did not record lifetime pickups or every clean attempt. Migration starts from a conservative recoverable lower bound: the sum of saved per-level best gem counts plus nine gems if tutorial gems were already banked, and one guaranteed clean completion for each completed three-star Career record. Existing recorded lifetime/counter values are retained when larger. Endless lifetime pickups and repeated historical attempts cannot be reconstructed and are not invented. Existing actual tutorial, Endless best, and Hard completion records can unlock their corresponding achievements after migration. These unlocks do not auto-credit a wallet; their new achievement reward must be claimed once.

## Persistence and duplicate prevention

Engine observers publish pickup batches and real completion/death events, not UI-button outcomes. Every document session has a unique ID and monotonically increasing event sequence. Its last processed sequence is saved with the same progress record. Replaying an event cannot increase lifetime collection, clean-run counts, or daily progress twice. Frame batching coalesces pickups without adding a separate delayed reward queue.

The shared transaction queue reconciles achievement progress after existing saves change, including the actual tutorial/Career/Endless completion callbacks. It writes progress, gem balance, and claimed timestamp in one record. Daily keys include the UTC date; achievement IDs are permanent. Old daily claim history is retained instead of discarded at rollover.

Manual reward claims explicitly disable volatile commits. The UI marks a reward claimed only after the primary storage write succeeds; a rejected write leaves the accepted wallet/claim state unchanged and shows a retry error. Existing gameplay can still use the original adapter's warned session-only recovery. Claiming after recovery must persist the whole record, including all claim flags. Reloading cannot combine a durable bonus balance with an unclaimed flag because they share the same record.

This is client-side idempotence, not server-authoritative anti-cheat or a cross-device distributed transaction. The existing SDK's cloud-save debounce and guest/account sync behavior remain owned by CrazyGames; actual cloud durability requires portal QA. No backend was required or added for these local game features.

## Integration points

- `src/game/meta/`: actual engine observation, achievement catalog/reconciliation, UTC daily generation/progress, migration fields, and atomic reward reducers.
- `src/hooks/useMetaProgress.js`, `src/hooks/useUtcDay.js`: application subscription, day rollover, preparing goals, strict claims, and notification acknowledgement.
- `src/components/game/meta/`: focused menu/header/card/progress/claim/screen/notification components.
- `src/game/engine.js`, `src/game/endlessEngine.js`: observation calls only; no physics, hazards, levels, scores, or control changes.
- `GameCanvas`, `EndlessCanvas`, `useTutorialGame`: flush observed pickups each frame; existing result/save callbacks remain intact.
- `progress.js`: new save defaults and normalization fields, without wiping unknown/existing data.
- `progressTransaction.js`: reconcile metadata when an existing save changes.
- `useGameProgress.js`: optional strict-persistence mode for rewards, leaving existing gameplay's default unchanged.
- `Home`, `MainMenu`: screen and notification wiring.
- `src/index.css`: extend existing scoped semantic colors to the new screens.

## QA handoff: pending, not claimed complete

Runtime/browser tests were NOT run. Use the Testing Agent (test-tube side panel), then the CrazyGames Developer Portal for actual SDK persistence. Suggested goals:

1. **“Complete and fail daily goals, claim each reward twice, refresh, and confirm each reward increases my wallet exactly once.”**
2. **“Unlock achievements, buy a skin, reload, and confirm lifetime collection never decreases; cross UTC midnight and confirm old rewards remain claimed.”**

Required scenarios:

- Fresh player with no Career access gets tutorial alternatives and usable Play actions.
- Existing progress, purchased skins, special challenge flags, settings, and wallet remain intact after migration.
- A clean Career replay counts once, a death does not count as a clean finish, and ten genuine clean finishes unlock Survivor.
- Tutorial Skip never unlocks First Flight; actual completion does, and replaying cannot re-award its achievement.
- Actual pickup batches reach 1,000 lifetime; spending/rewards do not change collection progress.
- Partial/missed Rush rows fail; a wholly collected qualifying row succeeds.
- An Endless run reaching a target but not ending does not complete the score task; the actual end does.
- Speed failure after death or exceeding time cannot satisfy the clock task.
- Duplicate event packets, repeated claim clicks, refreshes, and reopened screens do not repay rewards.
- A rejected primary save shows a claim error and no accepted credit; a later successful claim persists both wallet and claimed flag.
- UTC midnight, return after multiple days, history claims, and time-zone travel preserve date-scoped flags and prior gems.
- Notifications queue once and respect reduced effects; all badges stay within this game.

No live account/cloud persistence, simulated date rollover, failure-injection, or duplicate-event test is represented as verified by this implementation report.