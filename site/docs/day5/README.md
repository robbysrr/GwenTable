# Sprint 01 Day 05 release gate

**NO GO for production deployment.** This review was executed on 19 November 2026 (Jakarta date), ahead of the supplied planned sprint date of 27 November. Candidate application v0.22.1 is a narrow preservation patch over v0.22.0. It does not complete the missing Day 3 slice. Zero external beginner sessions occurred. Beginner effectiveness remains UNVALIDATED. Publication is held because core browser, storage recovery, keyboard and final-sheet integration checks remain unverified. This is a release-evidence decision, not proof of an observed production exploit.

## Target and references

Source checkout: `/workspace/sites/gwentable/.sites-checkout`; working branch `sprint-01-day-05-verification`; parent/rollback checkpoint `424446fa156b9ee30c34690c898af4fd68054e40` (unpublished Site version 28, v0.22.0). The final packaging commit identifies the complete Day 5 code and this report; obtain it with `git log -1` or the saved Site version's source SHA. No deployment is part of this packet. Last published checkpoint is source `7d58b77651a701f8c404d61b435fb14b55484415`, v0.21.0, Site version 27. The inherited public URL is https://gwentable.srobbiansyahr.chatgpt.site . Do not use its older behavior as candidate evidence.

| Reference | Status | Evidence and limitation |
| --- | --- | --- |
| Current source and Day4 implementation | VERIFIED | Parent commit above; `docs/BEGINNER_SPRINT_D4.md`, actual completion/app/PDF diff and tests inspected. |
| Day1 standalone audit/backup ledger | NOT AVAILABLE | `docs/BEGINNER_SPRINT_S1.md` is a verifiable earlier source checkpoint, not the missing standalone Day1 ledger. |
| Day2 selected design | VERIFIED | `/workspace/scratch/88e24d54384a/GWENTABLE-S1-Day2/README.md` inspected: A progressive form selected; prototype mechanics explicitly simulated. |
| Day3 actual implementation | NOT AVAILABLE | Day4 records workspace pruning of local `dfd868c`; not in current source. Prompt is not execution evidence. |
| Day4 handoff | VERIFIED | Actual report includes 40 rows, 81-test result, eight copy rows, browser blocker and recovery gap. |
| PRD8 / full five-day sprint-plan document | NOT AVAILABLE | Supplied Day5 execution brief is available; it cannot substitute for missing original documents. |
| Complete design/copy standard and 466-icon manifest | NOT AVAILABLE | Installed `audit/icon-registry.json`, existing tokens and locale source available. No claim of complete atlas integration. |
| SRD 5.2.1 | VERIFIED existing source pin | `/workspace/scratch/88e24d54384a/SRD_CC_v5.2.1_copy.pdf`; SHA-256 `93dda217a8cc63eb71bdcd4881b6c3a488e098063202b42e45967833fcbc412a`. Creation pp19–25, Classes pp28–82, Origins pp83–86 inherited citations; no mechanics changed this packet. |

## Review and environment

Reviewer: Gwen/assistant, one source-based heuristic reviewer. Participants: **0**. Familiarity, participant confidence, consent, times and quotations are not collected. No recruitment messages sent. `tasks.csv` records the same T1–T5 script with blocked actual interaction and separate source/automated observations. It is not five completed sessions.

Local static server command: `python -m http.server 8080 --directory dist` from the checkout. Intended route `http://localhost:8080`. Native Linux desktop Chromium exposed a 1050×1004 window at `chrome://newtab`. Its version was not obtained. An actual `sky.press_key(Control_L+l)` attempt failed with `AT-SPI provider with process ID 17 is unavailable ... registry reported 0 provider connections`. The candidate was not navigated. This is a desktop environment failure, not a demonstrated application keyboard defect. No actual phone, simulated responsive candidate rendering, 200% zoom, contrast measurement or screen-reader pass is claimed. No browser screenshot proves app behavior here.

Only synthetic test fixtures were used; no real user's database was opened or reset. Database name/version, record codec and rules engine are unchanged. Tests are isolated Node runs. `tests/fixtures-day4.json` F1–F10 cover valid/partial, spellcaster, old stage alias, private unknown record, Unicode name, play HP/XP, absent scores, unsupported level and skip metadata. The added pre-model2 fixture includes a private Species ID, nested source provenance and inventory. Exact equality before/after and repeated-read checks pass. A real IndexedDB backup/restore transaction and failure injection are still open.

## Narrow patches and evidence

1. `dist/builder-completion.js`: preserve original pre-model2 raw records before migration can silently remove unknown fields. The previous comparison occurred after migration. `readBuilderDraft` now marks these records unavailable and retains them exactly. This deliberately holds **all legacy pre-model2 records**, including otherwise recognizable ones, for recovery rather than automatically authorizing editing/final output. It is a preservation-first compatibility limitation, not a finished migration UX.
2. `dist/app.js`: an unavailable saved record cannot take the blank/already-saved New draft fast path; replacement snapshots retain raw input; unavailable projection is not treated as the saved draft. Existing Keep/Discard/Cancel behavior is reused. Move dependency snapshots after the no-op check so reselecting the current value does not replace valuable recovery history. Source review supports this patch; actual interaction/storage retest remains OPEN (GT5-02).
3. `tests/day4-completion.test.js`: regression reproduces legacy raw loss, compares original IDs, nested metadata and inventory, verifies repeated reads and rejects Appearance approval while unavailable.
4. `package.json` and `dist/sw.js`: v0.22.1 cache/version marker. No asset, corpus, dependency, database or character format change.

Baseline `npm run build && npm test`: 81 tests passed. Focused `node --test tests/day4-completion.test.js`: 7 passed after patch. Final `npm run build && npm test`: static build/assets/source registry passed, **82 tests passed, 0 failed/0 skipped** (5517.529069 ms test runner duration). Actual final runner output is `test-results.txt`. `git diff --check` passed. These are automated results, not a production readiness or complete SRD compliance claim. The source-only app snapshot changes have no new browser regression evidence.

## Supplemental E1–E10 coverage

| Check | Evidence | Remaining |
| --- | --- | --- |
| E1 valid Fighter | Automated template/derivation and final decision checks pass | Interactive creation not tested. |
| E2 navigation | Single identity stage and legacy aliases tested | Real Back/Next/Review/Edit/history/reload not tested. |
| E3 Level 3→1 | Existing engine tests/revalidation retained; no rules formulas changed | Actual snapshot restore and dependent-choice repair not tested. |
| E4 incomplete refresh | Pure gate rejects unvisited/invalid flow | IndexedDB reload and visible state not tested. |
| E5 Appearance skip | Pure valid decision enables gate | Full final sheet and native A4 download not tested. |
| E6 invalidation | Revision change rejects prior approval; PDF handler checks stale eligibility | All browser routes/exports not tested together. |
| E7 spellcaster | All class templates, Wizard missing spell control, existing spell tests pass | Interactive known/prepared/slots journey not tested. |
| E8 old/custom data | Canonical model2 identity, exact legacy raw, portable/GCX and play HP/XP checks pass | UI import, Keep/Discard/Cancel and reload recovery not tested. |
| E9 device/accessibility | Source semantics and named flag states reviewed; existing interface tests pass | X/Escape/outside/focus/phone IME/360px/zoom/screen reader not tested. |
| E10 bypass | Actual PDF dialog entry/submit/browser-print handlers tested with fake DOM and stale eligibility | Hash-route and full app integration unverified. No server export API in this static source: that API subtest N/A. |

## Editorial, rules and rights

`locale-eight.csv` reviews the exact eight Day4 strings, before and after, context, reviewer and result. All remain unchanged: they already express count, repair, optional Appearance, local save and retry clearly in natural Indonesian. This is editorial source review, not a comprehension study. The locale suite checks identifier/calculation invariance; phone rendering and announcements remain unverified. Existing glossary has Species, Background and Proficiency, with two examples each. Class and Ability Score explanations from the Day2 five-term contract are missing (GT5-04), so D5-38 is FAIL.

No new SRD mechanics or built-in records were added; shared engine tests remain the rules oracle. All twelve level3 templates are checked; unsupported levels are rejected rather than advertised as complete coverage. No advanced-class or universal spell-preparation policy was introduced. Saved records are validated, and current final decisions bind to the draft revision. These guards still require route integration verification. Original downloads cannot be revoked.

Touched diff contains no private Avarra lore, network requests, account operations, executable imported content, new artwork or rights expansion. Existing mandatory Wizards SRD 5.2.1 / CC BY4 attribution remains in `dist/index.html`. No claim is made to having audited unavailable proprietary PDFs, full art archives or all inherited assets. No blank D&D Beyond template integration was attempted. Existing 2014/2024-style layouts do not switch the core rules away from SRD5.2.1. Unsupported custom raw data remains user-controlled recovery content, not public core. Local save language remains truthful. No new cloud/account/live-AI claims. Security review is limited to touched local guards and recovery logic; full application security certification is not claimed.

## Decision, release conditions and rollback

`acceptance.csv` contains all D5-01–D5-48 rows. PASS means the precise cited source/automated/documentation criterion passed; it never implies a browser or user pass. `issues.csv` deduplicates seven findings and separates source patches from verified fixes. `backlog.csv` contains eight dependency-aware tickets for the next two-week window, without implying scheduled work or assigned staff. Effort S/M is a rough sizing, not promised duration.

NO GO is driven by GT5-02 and GT5-03: data recovery and final-sheet/essential keyboard integration remain unverified. GT5-04/05/06 also prevent claiming the agreed beginner slice is complete. Reopen release only after recovery Keep/Discard/Cancel and reload preserve exact raw state, valid Fighter/Wizard journeys reach final sheet/PDF, invalid/stale/deep-link paths deny new final exports, and essential keyboard/touch access is demonstrated. Recover the bounded missing Day3 UX and run real novice sessions before claiming beginner effectiveness. No evidence here authorizes deploying an unverified candidate.

Source persistence handoff: push the exact packaging commit and save a candidate Site version **without deployment**. This report is inside that commit. Record actual returned version/SHA in the final user handoff; do not guess a version number in advance. No access-policy changes.

Rollback of Day5 only: preserve current raw recovery payloads outside any destructive normalization path; checkout parent `424446fa156b9ee30c34690c898af4fd68054e40` in an isolated checkout, run existing checks and package if ever authorized. Do not reset a working tree containing user edits. To remove only this patch in source history, use a reviewed `git revert` of the saved Day5 commit. No database downgrade is required. Older source has the identified legacy normalization flaw, so do not open unsupported records in it without keeping exact raw backups. Production has not changed and needs no deployment rollback. The published v0.21.0 checkpoint is a rollback reference, not a newly verified safe release.

Credit usage: **not measurable**. No paid AI APIs or image generation. Reused current source, engine, fixtures, locale and test runner. Cut mass icons, 3D dice, new backend and broad redesign. Safe first task is GT5-03A: restore the existing browser QA bridge, then run GT5-02R before further UI work.
