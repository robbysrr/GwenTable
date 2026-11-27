# GwenTable v0.24.6: Class-specific Play actions

## Scope

This increment adds **SRD 5.2.1 Monk Uncanny Metabolism** and **Fighter Second Wind** as atomic Play Sheet actions. The application continues to store the *same* Play state schema (`counters`, `hp`, `combat`, `log`) and uses the existing IndexedDB revision-protected update with one-step Undo. No migration and no additional data collection.

### Monk (level 2 or higher)

When recording Initiative, choose **Use Uncanny Metabolism**. For manually entered Initiative, enter the Martial Arts die result; for the in-app Initiative roll, the app rolls the Martial Arts die automatically when the checkbox is checked. The transition spends the one-per-Long-Rest counter, restores expended Focus Points, and heals Monk level plus the die result (up to max HP). Only one choice is accepted for a new encounter; after starting, the action cannot be retroactively applied. If the player declines it, a later encounter can use it until consumed. Rest restores the one-use flag. Martial Arts die is d6 through level 4, d8 at levels 5–10 and d10 at levels 11–16 (builder currently supports Monks to level 12). No Perfect Focus (15+) automation is claimed.

### Fighter (level 1+)

Use **Second Wind** from the Features area. Enter a d10 result or roll automatically. The action expends one Second Wind use and heals d10 + Fighter level, capped at max HP. In an active encounter, this is only allowed on the Fighter's turn when their Bonus Action is free, and it marks that Bonus Action spent. Outside combat, Bonus Action markers are not created or changed. On a Short Rest one spent Second Wind use is restored; Long Rest restores all. Starting Fighter level 5, the log notes Tactical Shift movement remains a table decision; no automatic movement is applied.

Generic `Spend` / `Restore` resource controls intentionally remain for manual corrections and alternate class interactions (such as Tactical Mind). They do **not** apply the combined heal/action mechanics. Players should use the dedicated action when actually using Second Wind.

## Rules trace

System Reference Document 5.2.1, pp. 47–49 (Fighter) and pp. 50–51 (Monk): https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf

## Automated evidence

`npm test` is the automated regression suite; `tests/play-class-resource-actions.test.js` covers action results, invalid input, rest recovery, turn timing, resource exhaustion, high-level die changes, backup round-trips, legacy Play data, reconciliation, and offline/locale registration. `npm run build` checks static files, source syntax and pinned catalogs. `npm run build:artwork-withheld-preview && npm run audit:artwork-withheld-preview` verifies the preview excludes the 12 inherited uncleared image assets.

## Not verified

No genuine browser, device touch, screen reader, pop-up or PDF acceptance. This build is NOT a production release. Published asset clearance remains a separate gate.
