# Gem Economy, Skins, and Career Progression

## Changes

- Reused the existing 12 cosmetic canvases, purchase confirmation, shared save queue, gem wallet, rarity filters, group menus, and skin renderer. No player save was reset.
- Catalog matches the requested prices and rarity tiers. Fireball was corrected from Legendary to Epic.
- Classic is permanently available and appears owned without a separate free-claim step. Existing ownership is retained; known purchase receipts also restore ownership.
- Purchases check the latest saved wallet inside the existing serialized transaction, deduct once, persist ownership and wallet together, and leave equipping to the separate free Equip action. Existing repeated-click and failed-save protections remain in use.
- Solo, Race P1, and Race P2 now have independent saved selections. A legacy P1-following-Solo selection is migrated to the skin it was already displaying, rather than losing its appearance. Changing Solo no longer changes either Race selection.
- Career and Endless run payouts now carry a unique full-run ID and a durable receipt saved atomically with the wallet. Repeating the same completion callback cannot credit its gems again, including zero-gem results. A genuine replay gets a new ID; checkpoint respawns keep the same ID. Existing special, daily, achievement, Race, and tutorial reward flags remain separate and unchanged.
- Retained existing banking rules: Career gems bank on completion; Endless gems bank when a run ends; tutorial gems bank on its first completion only. The gameplay HUD now clearly separates the actual saved/spendable balance from the current run's collected gems instead of displaying pending earnings as spendable.
- Removed tutorial gem-count gates and allowed flipping during gem practice. Tutorial and Career can finish with zero gems. The tutorial records the actual first-finish award, including zero, for accurate future migration. No movement constants or collision shapes were changed.
- Group access checks require all preceding groups to be complete, including for inconsistent returning saves. Entry and next-group handlers enforce the same rules as the menus. Existing completed records, stars, times, and unlock counters are retained, not erased. Group completion is announced when the last missing level is cleared, even if it is not the group's highest-numbered level.
- No currency references to coins were found in the current app interface. Gems remain the only collectible currency.

## Catalog

| Skin | Gems | Tier |
| --- | ---: | --- |
| Classic | 0 | Basic |
| Crimson | 100 | Basic |
| Ocean Blue | 150 | Basic |
| Toxic Green | 300 | Rare |
| Neon Purple | 400 | Rare |
| Golden | 750 | Epic |
| Shadow | 900 | Epic |
| Ice Crystal | 1,200 | Epic |
| Fireball | 1,800 | Epic |
| Galaxy | 2,500 | Legendary |
| Rainbow | 3,500 | Legendary |
| Diamond | 5,000 | Legendary |

## Runtime QA handoff — pending

No browser playthrough, save-failure injection, purchase test, or CrazyGames cloud-persistence test was performed. Use the Testing Agent (test-tube side panel) for these goals:

1. “Check every skin's listed price, insufficient funds, exact deductions, repeated confirmation clicks, owned-skin reopens, failed-save recovery, refresh persistence, free equipping, and independent Solo/P1/P2 selections.”
2. “Finish Tutorial and Career with zero gems, verify repeated completion callbacks do not duplicate gems, and check Easy → Medium → Hard unlocks with one missing prerequisite level, including returning saves with later completion records.”

Also verify in the CrazyGames portal that the existing SDK Data Module retains the same whole-save wallet, receipt, inventory, and equipment data between sessions. This client-side ledger prevents accidental duplicate credits; it is not server-authoritative anti-cheat.