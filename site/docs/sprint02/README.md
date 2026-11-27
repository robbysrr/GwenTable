# Sprint 02 repair checkpoint

**Scope: REPAIR ONLY. Release: NO GO.** This is one executed repair packet on 19 November 2026, not ten completed working days. Sprint01 Day5's actual NO GO controls the cutline. Class/Background expansion, Languages/Ability work and Play stretch are deferred until core storage, final-sheet and accessible browser journeys are verified. No new replacement website or detached prototype was created.

## Evidence and baseline

| Reference | File/commit | Observed facts | Open question |
| --- | --- | --- | --- |
| Current source | Parent `834cf7a6dc50c29a80866b15ba1965c935c30359`; branch `sprint-02-recovery`; candidate v0.22.2 | Clean before edits; retained source-backed engine/static app, IndexedDB v2, existing tests | Full route/storage integration unverified |
| Actual Day5 | `docs/day5/README.md`, issues.csv, acceptance.csv, backlog.csv | NO GO; 82 automated passes; no novice sessions; 29/2/17 acceptance; saved version29 without deployment | Browser recovery/final gate still needs execution |
| Actual Day2 | Earlier inspected `/workspace/scratch/88e24d54384a/GWENTABLE-S1-Day2/README.md` | A progressive form selected; prototype mechanics simulated | Missing Day3 identity details |
| Day3/4 | Day3 source unavailable; actual `docs/BEGINNER_SPRINT_D4.md` and current completion/PDF tests available | Day4 rebuilt completion over recoverable source, not missing Day3 code | Name Apply/Undo, fresh Species confirmation and two glossary terms missing |
| PRDs6/7/8, full plan/design/copy/466-icon pack | NOT AVAILABLE as authoritative files | Existing locale catalog/tokens/icon registry reused | Cannot certify full source kit integration |
| Source SRD | Existing pinned PDF/hash recorded in Day5 report; catalog/rules unchanged | 12 Class and four Background records; source-map.csv; mandatory attribution check passes | No new rules or comprehensive source audit claimed |
| Real usability videos/testers | NOT AVAILABLE in this packet | Zero participants; no recordings or quotes | Beginner comprehension remains unvalidated |

Published checkpoint inherited from Day5 is v0.21.0 / Site27; v0.22.1 / Site29 is an unpublished candidate. This packet is saved without deployment; the exact returned new version and packaging SHA belong in the final handoff. No public audience/access change. Current source is under `/workspace/sites/gwentable/.sites-checkout`; the packaging commit includes this report and tests. `git log -1` gives that exact commit.

## Implemented behavior and changed files

In `#create` → More actions, **Download draft backup** is available without completing a character, alongside **Load draft backup**. This is a separate version1 `gwentable-draft-backup` JSON format, not finalized character JSON or GCX. It preserves the raw unsupported/legacy draft, play metadata, source provenance and recovery records rather than exporting the normalized projection. Existing final export/PDF gates remain mandatory.

Loading a backup under 8 MB parks it in the existing recovery list and leaves the active draft open. Restore previous draft opens it through the normal supported/unavailable-record guard. Import removes saved/finished/Appearance approval and generates a new draft identity, preventing a recovered copy from overwriting its original saved character. A storage failure says the backup is available only in the current tab and tells the user to retain the file. No cloud sync is implied. Unsupported legacy content stays held for deliberate recovery; this does not invent a lossless playable migration.

`dist/draft-recovery.js` supplies the shared snapshot/backup/reader/label functions actually used by `dist/app.js` persistence and recovery capture. Snapshots preserve envelope source/HP/XP/GCX metadata; parked snapshots omit nested history containers to avoid recursively duplicating the same history. Active snapshots still retain the separate history list. Invalid names cannot crash recovery labels. Malformed dependency history is treated as empty runtime UI state while the input envelope remains available in backup data.

`dist/builder-completion.js` catches unrenderable raw inputs and retains them unchanged behind a safe display projection. It never authorizes that projection as the original character. `dist/index.html` adds the two draft actions and file input. Seven EN/ID strings in `dist/locale-copy.js` distinguish backup, recovery and local persistence. `dist/sw.js` caches the new module with v0.22.2; `package.json` marks the candidate version. No rules formulas, class/background record, portable character/GCX codec, DB version, artwork, backend or Play feature was changed.

## Verification and limits

Baseline evidence: actual Day5 build and 82-test log from the clean parent. Focused after repair: `node --test tests/draft-recovery.test.js tests/day4-completion.test.js` passed 12 tests. Final `npm run build && npm test`: static build/assets/pinned registry passed; **87 passed, 0 failed, 0 skipped**; 5367.349133 ms runner duration. `test-results.txt` is actual output. `git diff --check` passed. Tests cover exact raw and nested metadata round-trip, snapshot independence, no nested history duplication, imported completion revocation, fresh identity, partial Wizard, malformed raw recovery, input size/version rejection and existing completion/PDF handler regressions. They do not execute the app's file chooser/download/IndexedDB transactions in a browser.

The supported preview was attempted via `sites-preview start /workspace/sites/gwentable/.sites-checkout`; CLI returned `http://127.0.0.1:4173/`. Cloud browser navigation returned `net::ERR_CONNECTION_REFUSED`. Obstacle reporting then returned a browser security-policy refusal; no alternate route or browser-control workaround was attempted after that denial. The previous native AT-SPI failure is distinct. Actual candidate interaction, phone/320px/zoom, keyboard focus/dismissal, screen reader, recovery file download/reload and A4 generation remain **BLOCKED/NOT TESTED**. No screenshot of an app screen is supplied because none was reached.

Participants: **0**, heuristic/source review and isolated automated fixtures only. No self-reported familiarity, consent, task times, confidence, confusion rates or participant quotes were collected. Five novice tasks remain pending: Identity/Species, Class explanation, Background benefits, scores and draft recovery/locked final output. No participant results are inferred from source.

`acceptance.csv` includes S2-01–44. Conditional Languages/Ability rows are NOT TESTED / NOT IN SCOPE THIS BUILD, even where inherited mechanics have tests. Source-only passes explicitly cite that level of evidence. `backlog.csv` contains six evidence-backed tickets with prerequisites, risks, scope and owners (unassigned). `source-map.csv` maps the existing 12 Class/four Background keys to SRD pages; it is not a claim of a newly implemented Class/Background slice. No screen prototype was added.

## Open issues, decision and rollback

P0 GT5-02/03 remain open: source and pure recovery checks improve evidence, but Keep/Discard/Cancel, reload/storage failure, final route bypass and essential keyboard behavior need actual browser execution. Reproduce by opening unsupported saved data, starting a new draft and testing each decision/reload; expect original raw IDs/unknown fields and unrelated HP/XP to survive. For final output, attempt early/stale/deep-linked exports, then finish a valid Fighter/Wizard via Appearance Skip and invalidate it. No owner assigned. NO GO remains; no release blocker was relabeled solved.

P1 GT5-05 now has implemented backup/recovery code with automated checks; its actual file round-trip remains open. GT5-04's missing name candidate editor, fresh Species confirmation and Class/Ability Score glossary are still deferred. GT5-06 has no real novice evidence. P2 GT5-07 missing full icon manifest remains deferred; no new assets or rights assumptions. Public rules stay SRD5.2.1; touched code adds no network/account/script execution or unsafe imported-description HTML. Required attribution is retained. Imported raw content stays local and is never merged into core records.

Rollback checkpoint: `834cf7a6dc50c29a80866b15ba1965c935c30359` / saved Site29. No live rollback needed because this candidate is not deployed. Preserve downloaded raw backup files before trying an older build: older builds do not understand this new backup format. Database schema and finalized character formats have no downgrade. Revert the exact saved packaging commit in a reviewed branch or restore the parent in a separate clean checkout; never reset a tree with user edits. The rollback point itself retains the known NO GO limitations.

Credit usage **not measurable**. Zero paid APIs/art generation, no dependency install or mass asset work. Next bounded packet: restore supported preview access, then execute S2-R1 recovery transactions and S2-R4 final/PDF journey before expanding Class/Background. This checkpoint does not schedule background work.
