# Sprint 02 Gate G1: REPAIR (v0.24.4)

- Scope: Play conditions and Concentration damage-save queue, using SRD 5.2.1.
- Source: `dist/lib/play.js`, `dist/play-sheet.js`, `dist/style.css`, `dist/locale-copy.js`.
- Backwards-compatible Play shape: existing records with no `conditions` or `concentrationChecks` validate and normalize; stored ID/revision not rewritten until a user action.
- Action persistence: existing `characters.update()` transaction compares saved revision; Undo records the previous Play state.
- Tests: `tests/play-conditions-and-concentration.test.js` plus existing suite. 268 baseline + 19 new = 287 expected.
- Open: No actual browser, screen-reader, mobile acceptance evidence; no automated condition-specific PDF printout (Play condition state is in portable JSON, not stateless PDF).
- G2 original-artwork gate: 12 inherited files not approved; rights-withheld preview is QA only. Public production: NO GO.
- Rollback: retain prior v0.24.3 ZIP and local roster JSON backup; do not delete or reinitialize IndexedDB.
