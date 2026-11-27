# Sprint 02 Days 01–02 foundation checkpoint

**Execution: REPAIR FIRST. Day03 gate: REPAIR. Production: NO deployment.** Candidate v0.22.3; source branch `sprint-02-foundation`; clean parent and rollback `63caa4a3eb2112bca79df1b80c48d65e9cd91b68`, saved candidate30. This is one bounded engineering packet executed 19 November 2026, not a claim that two calendar days or the whole sprint elapsed. No new Class/Background stage implementation or persistence/schema change.

## Evidence ledger

Checked by Gwen/assistant on 19 November 2026. VERIFIED indicates the stated source/automated fact, not end-user effectiveness.

| ID/type/status | Actual reference | Verified fact | Uncertain/missing; consequence/follow-up |
| --- | --- | --- | --- |
| E1 source VERIFIED | Parent63caa4a, package.json, real dist modules/tests | Existing static JS app/model2/IndexedDBv2; scripts build/test; clean before edits | Browser integration pending; preserve NO GO |
| E2 Sprint01 VERIFIED | docs/day5/README.md, issues.csv, acceptance.csv | Actual NO GO,82 tests,0 beginners, missing Day3 and browser checks | Do not treat prompts as delivery |
| E3 design/implementation VERIFIED partial | Actual Day2 README previously inspected; docs/BEGINNER_SPRINT_D4.md and current code | Progressive identity first and Day4 gate exist | Day3 source pruned; Name Apply/Undo/fresh Species confirmation absent |
| E4 current repair VERIFIED | docs/sprint02/README.md and tests/draft-recovery.test.js | Actual backup/raw recovery patch,87-test baseline, version30 saved/unpublished | Download/load/reload and storage transactions not browser-verified |
| E5 briefs VERIFIED | Supplied Sprint02 master and Days01–02 execution txt | Repair-first cutline, component reuse, no automatic production deployment | Not evidence that requested features already work |
| E6 PRDs/plan/design full pack MISSING | PRDs6/7/8, complete five-day plan, design/copy standard and466 manifest unavailable | Current locale, CSS tokens and audit/icon-registry.json available | No full premium atlas integration claim; existing licensed fallbacks only |
| E7 source VERIFIED bounded | /workspace/scratch/88e24d54384a/SRD_CC_v5.2.1_copy.pdf | Original PDF text inspected for ability checks/proficiency/tools, origins, feats, Concentration; 12 Class page headers checked | Complete line-by-line class rules audit outside touched scope |
| E8 user evidence MISSING | No usable video or external testers in packet | Participant count0 | Novice comprehension/mobile usability remain unvalidated |

SRD pin inherited from verified prior handoff: SHA256 `93dda217a8cc63eb71bdcd4881b6c3a488e098063202b42e45967833fcbc412a`. Source trace: abilities/checks pp6–9, tools p10/98–99, creation19–22, class28–82, origins83–86, Origin feats87, Concentration179. Glossary is original explanatory copy, not an extra official corpus. Source map labels retain official English names in both locales. Ability indices0–5 mean Strength/Dexterity/Constitution/Intelligence/Wisdom/Charisma.

## Component map and actual patches

| File | Responsibility/consumer | Change/safe reuse | Evidence |
| --- | --- | --- | --- |
| dist/spell-picker.js | Shared mountChoicePicker used by builder short options/spells and spell details | Guard dirty multi-selection dismissal; once-per-session commit; reject stale previous-session row clicks; disabled reason/state; empty readonly safety; non-search default for non-spell lists | tests/choice-dialog-contract.test.js exercises actual mounted handlers |
| dist/beginner-help.js | Native details help within actual builder stages | Add Class, Skill, Skill Check, Tool Proficiency, Origin Feat, Ability Score, Saving Throw, Advantage; add consequence to existing3; safe unknown term | tests/foundation-help-icons.test.js; glossary.json |
| dist/locale-copy.js | Existing shared locale catalog |New EN/ID entries for new definitions/examples/consequences and discard feedback; preserve existing keys | Translation and locale regression tests |
| dist/ui-icons.js | Existing icon(kind), all icon consumers | Add resolveIcon contract; icon calls it; semantic licensed fallback, never claims unique entity artwork | Registry lookup/safe fallback test; icons.json |
| dist/app.js | #create actual stage consumers | Wire collapsed in-place help to Class/Background/Abilities/Features; no new choice rules | Existing builder/derivation regression |
| dist/builder-stages.js | Stable identity/class/background/etc IDs, legacy aliases and Review navigation | Unchanged; reuse existing helpers | Existing alias/conditional Magic tests |
| dist/draft-recovery.js, lib/storage.js, lib/portable.js, lib/character.js | Draft backup/model/DB/rules/portable formats | Unchanged; existing fixtures/regressions retained | Recovery/roster/play/GCX tests |
| package.json, dist/sw.js | Build/cache marker | v0.22.3; existing assets only | Static build check |

Existing Identity & Species, short-choice routing, Review/Appearance decision gate, separate Play, draft recovery and local-save error messages are present. Missing prior Day3 identity details are still missing. P0 integration checks remain open; no validation or storage safety barrier was disabled. `defects.csv` records before/after repro, severity, test and rollback.

## Shared selector contract and limitations

Reuse `mountChoicePicker(dialog, openOfficial)`; opening accepts label, options, value, onChoose, spells, short, categoryLabel and limit. Each option uses stable value, name, summary/effect, semantic icon, source page/fields and optional disabled/disabledReason. Existing source/detail affordance remains. Short defaults true for non-spell calls, while the builder explicitly sets short from its established small-list key set; large collections explicitly retain search. Close receives initial focus, never search. Native dialog provides modal semantics and browser focus isolation; Arrow keys navigate enabled result controls.

Multi-spell picks remain provisional until Apply. X, cancel/Escape handler and safe outside press+release now call one dirty guard. Dirty sets remain open with actionable notice and a Discard unapplied changes button. Reverting to the initial set closes without warning. Discard closes without onChoose; Apply commits once. Single choices commit once; detached old-session row callbacks cannot commit into a reopened session. Non-destructive ordinary dialogs keep normal close behavior. Short readonly options inspect instead of calling an absent callback. Empty readonly options do not dereference a nonexistent record.

Tests use a minimal event-capable DOM double for the **actual** mount function; they do not reimplement the picker logic. They verify callbacks/state/labels, not native modal focus trapping, actual Escape dispatch, pointer geometry/scroll lock, screen reader announcements, mobile keyboard or rendering. Those remain NOT TESTED. No claim of WCAG conformance.

## Glossary, icons and source map

`glossary.json` is generated from actual runtime entries/catalog translations: 11 canonical term IDs, English definition, two practical examples, consequence, Indonesian counterparts and source trace. Native details can be expanded/collapsed in place; guidance is optional. It is wired into the existing Class/Background/Abilities/Features and Species help locations. Official terms stay in English. A source-reviewed Skill Check is explicitly an ability check involving a skill; Proficiency is not a success guarantee; Advantage is two d20s/higher and cancels Disadvantage; tool+skill proficiency grants Advantage without adding the bonus twice.

`resolveIcon({entityType, canonicalId, subtype?, context?})` returns assetId, fallbackId, provenance and uniqueIllustration:false. Canonical record IDs are intentionally not interpreted as asset paths. Mapped semantic categories cover Class, Background, Species, feats, ability scores, skills/tools, navigation/help/status/close/expand and item/spell. Installed SVG shapes retain their IDs, viewBox/currentColor and decorative aria-hidden wrapper; option text remains accessible separately. Missing or malicious names resolve the existing item glyph. The unavailable466-pack was not regenerated or claimed complete. `icons.json` is actual resolver output.

`source-map.json` records existing12 Class IDs/pages and engine-generated level1 control dependencies, plus four Background grants, tool, Origin feat, allowed Ability indices and starting kit/gold. The original PDF Class headers at mapped pages and four page83 Backgrounds were checked. This is bounded source readiness, not a full class-feature audit. Background boost resolution remains at Abilities; equipment/cash selection remains at Equipment. Unknown custom definitions remain separately retained in raw backups, not core replacements.

## Stage and impact handoff

Authoritative first ID is identity-species. Old identity/setup/species aliases resolve there without changing canonical Species. Existing className/background keys are stable English app canonical IDs. Review/Edit uses existing field/stage targets; final sheet requires valid rules plus current revision Appearance review/skip. No duplicate Species stage, alternate engine or new data layer.

Day03 impact interface should consume raw before-state and a source-engine candidate, returning affected field IDs/old values/new eligibility plus cancel/commit/undo. Do not commit the normalized candidate until an impact preview is accepted; preserve raw custom/envelope metadata and before-state. This preview/cancel adapter is **NOT IMPLEMENTED** here. Existing before-change snapshots/Restore are available, but do not constitute the requested impact preview. Source mutation is intentionally deferred while browser/storage gates remain open.

## Tests, fixtures and data safety

Baseline: exact parent v0.22.2 actual87-test log in docs/sprint02. Focused `node --test tests/choice-dialog-contract.test.js tests/foundation-help-icons.test.js tests/beginner-sprint.test.js`:10 passed. Final `npm run build && npm test`: static assets/pinned source registry/attribution pass; **93 tests passed,0 failed,0 skipped**,6176.034147ms runner time. Actual output in test-results.txt; `git diff --check` passed. No typecheck script is defined. No package install or third-party UI framework.

Existing F01–F08-equivalent synthetic cases are covered by tests/fixtures-day4.json plus draft-recovery/day4/beginner/portable/roster/play fixtures: blank/valid Fighter, Wizard, old Species alias, completed HP/XP/gear, unknown nested imports, locale invariance and incomplete draft. Deep structural equality verifies canonical data/unknown IDs and raw backup retention; no real player data or store was opened. This packet changes no save/migration layer because actual browser transactions cannot yet be verified. Existing code guards invalid final exports; no full route pass is asserted.

Browser remains blocked by the prior supported managed preview connection refusal/security-policy denial documented in docs/sprint02/README.md. No attempt was made to work around that denial. This packet has **no new browser/device observation**, no actual phone, viewport/zoom simulation or screen-reader pass. Participant count0. No quotes, times or comprehension percentages invented. Full F01–F36 evidence/status is in acceptance.csv.

## Day03 gate and rollback

**REPAIR BEFORE CLASS**, production NO GO. One next packet: GT5-03 restore permitted preview access, then execute existing recovery Keep/Discard/Cancel/reload and the now-guarded selector with keyboard/phone-equivalent viewport, followed by incomplete/stale final-export and valid Fighter/Wizard Appearance Skip/PDF checks. Acceptance: no lost raw fields, no false saved state, safe dirty selection dismissal, working focus return and final-route validation. Native/IME/screen-reader checks must remain open if no suitable device is available. Owner unassigned. Missing name candidate editor and fresh Species confirmation remain P1; impact preview remains unimplemented. These do not become solved because glossary checks improved.

Source is saved as a candidate, **without automatic deployment**, as requested by the supplied foundation brief. Exact packaging SHA and saved version are returned in final handoff. Roll back this source packet with reviewed revert of its saved commit or inspect parent63caa4a in a separate clean checkout. Do not reset user work. Persistence/portable schemas unchanged; raw recovery files stay valid. Production unchanged; no live rollback required. Parent itself carries documented release limitations.

Credit usage **NOT MEASURABLE**. No paid APIs, artwork or backend. No new PRD. Deferred Class/Background enhancements, deep catalog work, 3D dice, broad design and Play changes. Reported source changes are implemented in the existing app, not a standalone prototype.
