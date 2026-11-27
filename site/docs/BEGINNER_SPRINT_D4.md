# Sprint 01 Day 4 checkpoint

Status is PARTIAL, candidate v0.22.0. The public site remains v0.21.0 (saved Site version 27). The local Day 3 commit dfd868c and first Day 4 edits were removed by workspace maintenance. Library search returned no Day 3 source. The source was restored through Sites at 7d58b77651a701f8c404d61b435fb14b55484415. The completed Day 2 handoff and all four supplied execution prompts were available. The standalone Day 1 ledger, PRD 8.0, sprint-plan PDF, full design-system PDF and 466-icon manifest remain unavailable. This checkpoint implements the completion work over the recoverable v0.21.0 source. The unpublished Day 3 name candidate editor and explicit Species-confirmation metadata are still to recover or rebuild.

## Impact map

| Area | Current source | Change and risk |
| --- | --- | --- |
| Flow | builder-stages.js, app.js | Reuse stable stage IDs, add named legacy aliases and skip empty Magic. Browser history stays in the existing hash router. |
| Validation | builder-completion.js | Adapter over the existing canonical build and validator. Distinguishes field issues, flow confirmation and supported saved records. No new rules formulas. |
| Review | app.js | Blocking section priority, count, subtitle, status and field repair target. Incorrect focus is a browser QA risk. |
| Finish | app.js | Explicit Appearance skip or review creates approval bound to the current canonical draft revision. |
| PDF | sheet-export.js | Check eligibility on open, submit, browser print and completion of asynchronous generation. |
| Play and exports | play-sheet.js, app.js | Revalidate saved records and gate current builder JSON/GCX with the same final decision. |
| Persistence | app.js | Preserve input envelope and raw unprojectable draft; keep earlier dependency snapshots for recovery. IndexedDB version and codecs unchanged. |

## Behavior and source contract

Review leads to optional Appearance and an explicit Finish or Skip action. The decision is attached to the canonical draft revision and verified alongside the current engine result. Changing build data revokes approval automatically. A saved existing character is recognized as a previously completed record only after validation, and legitimate edits continue to reconcile HP, XP and resources using the existing Play reducer. Back navigation does not mutate the character. Empty Magic is skipped using actual engine controls, including spells from species or feats.

Mechanical issues identify an owning field when the engine reports a control mismatch. Unsupported fields or metadata remain blocked with a recovery notice. Preview uses the existing renderer, and native PDF retains the original layouts. Unknown fields and unavailable species are preserved as raw input, never accepted as a supported playable record. Their editing and final output are held for a recoverable replacement workflow. New-character creation retains the existing Keep draft / Discard / Cancel behavior.

The engine selects defaults during build normalization. The flow gate therefore continues to require completion of the relevant creation sequence. It does not certify unvisited automatic defaults solely because the normalized model passes validation. There is one SRD subclass per shipped Class, so F3 has an automatically granted eligible subclass instead of an invented mandatory subclass pick.

Rules basis is the supplied SRD 5.2.1, pinned SHA-256 93dda217a8cc63eb71bdcd4881b6c3a488e098063202b42e45967833fcbc412a. Character validation retains the existing corpus and rules. Source citation areas are creation pp. 19–25, Classes pp. 28–82 and origins pp. 83–86. No new official mechanics or third-party assets were added.

## Automated evidence

Baseline `npm test` passed 75 tests. Focused `node --test tests/day4-completion.test.js` passed 6 tests. Final `npm run build` and `npm test` passed, with 81 tests total. These cover actual PDF dialog entry/submit/browser-print handlers with stale eligibility, pure revision invalidation, supported class templates, missing Wizard spell requirements, unsupported high-level Wizard, legacy aliases, raw provenance preservation and legitimate Play reconciliation. `tests/fixtures-day4.json` supplies F1–F10 synthetic records.

Local desktop Chromium launched through the computer interface. Its accessibility/input bridge returned `AT-SPI provider ... unavailable` before the candidate could be exercised. The separate local headless environment had previously failed on process sockets. No candidate browser pass is claimed. Android IME, screen reader, 360px UI, zoom, source-handler route wiring and final PDF download remain manual release checks.

## D4 acceptance matrix

PASS below describes the cited automated or source evidence. Browser-specific rows remain NOT TESTED.

| ID | Status | Evidence |
| --- | --- | --- |
| D4-01 | NOT TESTED | Day 2 and prompts recovered; Day 3 source removed, recovery disclosed. |
| D4-02 | PASS | 7d58b77 restored, unchanged prior public release and source archive available. |
| D4-03 | PASS | Named identity/setup/species alias and numeric v0.20 schema map. |
| D4-04 | PASS | Existing unified stage retained. |
| D4-05 | NOT TESTED | Data derivation is unchanged; browser Back/Next pending. |
| D4-06 | NOT TESTED | Existing hash router preserved; browser history pending. |
| D4-07 | PASS | Conditional Magic tests use actual class/species/feat controls. |
| D4-08 | NOT TESTED | Existing keep/discard dialog retained; real storage workflow pending. |
| D4-09 | PASS | Dwarf and caster repeated reads and named aliases. |
| D4-10 | PASS | Engine data compares equal after supported reads. |
| D4-11 | PASS | Unknown namespaced fields retained in exact raw preservation payload. |
| D4-12 | PASS | Repeated supported reads are idempotent. |
| D4-13 | NOT TESTED | Transaction error handling retained; quota failure needs browser injection. |
| D4-14 | PASS | Saving/saved/failed labels describe local storage only. |
| D4-15 | NOT TESTED | Engine retained; interactive dependency-edit workflow pending. |
| D4-16 | NOT TESTED | Before-change snapshots added. Conflict-by-conflict reselection is deferred. |
| D4-17 | PASS | Unsupported Wizard 20 rejected; established class level caps reused. |
| D4-18 | PASS | Missing Wizard spells resolve to its control and stage. |
| D4-19 | PASS | Existing regression suite passes. |
| D4-20 | NOT TESTED | Envelope storage path present; browser reload not exercised. |
| D4-21 | PASS | Existing accordions extended; no Review search/filter. |
| D4-22 | PASS | Pure issue count and blocking section sort; DOM rendering QA pending. |
| D4-23 | NOT TESTED | Field/step repair handler wired; browser focus check pending. |
| D4-24 | PASS | No required Appearance field; pure gate accepts blank Appearance. |
| D4-25 | PASS | Explicit Skip produces a revision-bound decision. |
| D4-26 | PASS | Pure gate rejects invalid, unreviewed and stale drafts. |
| D4-27 | NOT TESTED | PDF dialog handler test and all entry checks present. Browser route/download verification remains open. |
| D4-28 | NOT TESTED | Valid gate exercised in logic; complete browser journey pending. |
| D4-29 | PASS | Mutation invalidates the previous decision. |
| D4-30 | PASS | Existing HP/XP remain through legitimate reconciliation. |
| D4-31 | PASS | Canonical and derived state stable across EN/ID in tests. |
| D4-32 | PASS | Eight strings below reviewed and paired. |
| D4-33 | PASS | Existing flag-only names, pressed states and locale tests retained. |
| D4-34 | NOT TESTED | Shared dialog needs browser X/Escape/backdrop/focus test. |
| D4-35 | NOT TESTED | Prior implementation focuses close; phone IME unverified. |
| D4-36 | NOT TESTED | No candidate responsive browser observation. |
| D4-37 | NOT TESTED | Text zoom and keyboard journey pending. |
| D4-38 | NOT TESTED | Status region and aria-invalid wired; screen reader announcement untested. |
| D4-39 | PASS | No catalogue, art, paid API or public audience expansion. |
| D4-40 | PASS | Changes, rollback, blockers and tester handoff recorded. |

## Eight copy decisions

| English | Bahasa Indonesia | Context |
| --- | --- | --- |
| {count} required choices need attention. | Masih ada {count} pilihan wajib yang perlu dicek. | Review count. |
| Required choices checked. Continue to Appearance. | Pilihan wajib sudah dicek. Lanjut ke Penampilan. | Next step after checking. |
| Review your {field} choices. | Cek lagi pilihan {field}. | Direct repair. |
| Skip Appearance | Lewati Penampilan | Optional action. |
| Appearance is optional. You can fill it in later. | Detail penampilan boleh dilewati. Kamu bisa mengisinya nanti. | Avoid false requirement. |
| Finish or skip Appearance before exporting. | Selesaikan atau lewati Penampilan sebelum mengekspor. | Explain the export gate. |
| Saved on this device | Tersimpan di perangkat ini | Only after confirmed transaction. |
| Could not save your changes. Try Save draft again. | Perubahan belum tersimpan. Coba Simpan draf lagi. | Failure and repair. |

Existing keys and SRD English names are retained. Error controls remain plain and instructional.

## Day 5 handoff and rollback

Release is held pending D4-27 and D4-34 browser checks. Restore the unpublished Day 3 name/Species-confirmation slice from source or rebuild against this checkpoint before claiming that sprint complete. Then test with 3–5 new players if available. Tasks: create Mira, choose Species, describe Background, toggle flags, dismiss the choice dialog with X/Escape/backdrop, save an incomplete draft and attempt premature printing. Complete a valid Fighter or Wizard, open Review, Edit one ability/spell, return, skip Appearance, generate a native PDF and enter Play. Change the completed build into an invalid state and verify all new final outputs stop. Record actual struggles without coaching or fabricated times. Include Back/Forward, reload, quota-failure and unknown-source cases.

Rollback uses the recovered base 7d58b77 / saved Site version 27. The data model, database and existing portable formats need no downgrade. The new decision and history fields are additive UI metadata. Keep raw recovery snapshots before loading an unsupported record into an older build that normalized unknown fields. Credits are not measurable. This packet reused the engine, renderer, locale catalog, local storage and installed assets.
