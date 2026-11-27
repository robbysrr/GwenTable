# GwenTable Sprint 02 | Day 05 integration/repair handoff | local v0.22.8

Date: 2026-11-19 (Asia/Jakarta). **Gate: REPAIR / production NO GO.** This is a local candidate derived from the uploaded `GwenTable_Source_v0.22.7_Local_Development.zip`, not a checkout of a remote repository. No remote commits or deployment were made.

## Baseline and scope

Verified source tree and historical handoff: v0.22.7 package and `GwenTable_v0.22.7_Day05_Release_Gate_Handoff.md`. Initial `node --test`: **126 passing**; initial `npm run build`: PASS. Original SRD 5.2.1 p.83 checked in the prior Day04 run. Unchanged SRD records in `dist/lib/catalog.js` and rules in `dist/lib/character.js`; no rebuilt rules engine, no database schema upgrade. Day03 native branch/acceptance report beyond the previous packaged historical reports is not independently present.

## What changed in real code

- `dist/builder-choice-review.js`: selection intent schema v2, with source-bound Background Ability Score boost fingerprint `[background, boost]`, combined starting equipment fingerprint `[className, kit, background, backgroundKit]`, review restoration from v1 and inferred **completed** historical stages, explicit pending-state query `reviewedSelection`, and source-change invalidation. A projected SRD value is NOT by itself a confirmed selection.
- `dist/app.js`: show pending values as `Suggested, not confirmed`, give localized approval panels in Abilities and Equipment, include new gate issues in Next/Review/final sheet, persist approval before showing success, invalidate source-dependent approvals after Class or Background changes, mark draft identity provisional if required reviews remain.
- `dist/background-choice.js`: distinguish suggested from confirmed boost/equipment data in the read-only source grant projection. Source-tagged grants remain derived; nothing is added to inventory merely by rendering a screen.
- `dist/draft-recovery.js`: imported backup snapshots, including nested recovery history, reset v2 approval authority while retaining source characters and unknown fields.
- `dist/locale-copy.js`: 20 EN/id-ID copy entries for the new pending/confirmed controls. `dist/sw.js`: isolated local service-worker cache revision bumped to v0.22.8. `package.json`, `README.md`: version and instructions updated.
- `tests/day05-intent.test.js`: 10 new deterministic tests for initial pending intent, explicit completion, provenance invalidation, historical v1 restores, nested backup sanitization, bilingual copy, and source changes. `tests/choice-review.test.js`: previous expectations adjusted for the stricter gate, not deleted or skipped.

## Important limitation of current model

**Not a canonical nullable-data migration.** The underlying SRD calculator still projects legal Background/ability/kit/feat defaults to construct previews. The versioned builder intent envelope is authoritative for whether the *player* has approved a choice. When intent is pending, the UI marks it as a suggestion and final character export/print remains blocked. A future slice must reconcile truly missing Species, Class, Class features and ordinary spell selections in a non-destructive source-compatible representation. These remain P1 review items, not silently fixed.

## Automated evidence (on this candidate)

- `npm run build`: PASS, static JavaScript syntax, asset existence, pinned source catalog, no additional dependencies.
- `node --test`: **136 PASS, 0 FAIL, 0 SKIP**; baseline v0.22.7 126 PASS (10 new tests).
- `npm run verify:source`: PASS after preparing manifest, over all bundled tracked files.
- local server: Node.js 22.16, `PORT=4178 node scripts/dev-local.mjs` and `curl -I http://127.0.0.1:4178/`: HTTP 200 with no-store, text/html.
- Chromium 144 / Playwright: `page.goto(http://127.0.0.1:4178/#create)` failed `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Control attempts to `file:///.../index.html` and `data:text/html` failed with the same policy. **No browser journey, touch/emulator, screen reader, actual PDF or novice participant test passed or was claimed.**

## Day 05 gate and priority list

| Risk | Priority | Status | Next evidence to close |
|---|---|---|---|
| GT5-BROWSER | P0 release gate | BLOCKED (environment) | Real browser step navigation, storage, recovery, modal keyboard focus, refresh, print/PDF |
| GT5-MOBILE | P0 release gate | NOT TESTED | 320/375px responsive, 200% zoom, phone IME, screen reader, landscape |
| GT5-DEFAULT-REST | P1 | OPEN | Explicit intent for remaining auto-projected Class/Species/training/language/ordinary-spell decisions; safe old-save adapter |
| GT5-ABILITY-GEAR | P1 | SOURCE-LEVEL REPAIRED | This version blocks unreviewed boost and gear; manual confirmation, reload and switching must be independently tested |
| GT5-ASSET-LICENSE | P2 | DEFERRED | Distinct background art only after a verified distributable license and actual manifest availability |

**Production NO GO** until the first two P0 gates pass and remaining P1 provenance/default behaviors are reconciled with user-testing. Back out without affecting user data by restoring the verified v0.22.7 source ZIP, then run its checks; preserve/export browser IndexedDB separately before visiting a reverted version. The v2 intent envelope is additive to old local storage records and does not require a database migration. Service-worker cache revision changes only on origins where the new source is actually served.

## Source & licensing boundaries

Exactly four SRD 5.2.1 built-in Backgrounds (Acolyte, Criminal, Sage, Soldier); no PHB-only content. Existing CC BY 4.0 attribution and core rule IDs retained. No paid artwork, font binaries, private Avarra lore, cloud sync, or live publication. Older data and the inherited source/asset licensing limitations remain; this is not a rights-cleared open-source release.
