# Save and change regression

Run `node --test tests/background-choice.test.js tests/choice-review.test.js tests/day04-hardening.test.js`.

Synthetic coverage: exact source p83 data; Soldier equipment/tool match; change plan non-mutation; repeated switch Soldier→Sage→Soldier without duplicated GP/items; old cross-stage choices preserved; unavailable custom draft guarded; imported backup cannot carry approval in nested histories; Legacy completed progress compatibility; stale Magic Initiate fingerprint; EN/id-ID invariance.

New `tests/day04-hardening.test.js` includes a controllable queued writer: a delayed first write is never allowed to display Saved if a newer acknowledgment is pending; a failed write reports Failed until a successful retry. These are simulated Node tests, **not** real IndexedDB quota/focus/browser proof.

In the actual click handler, confirmation calls `persist()` and reports success only after success; on failure, acknowledgment rolls back. Source code navigation gate refuses Next while confirmation write is pending. No IndexedDB schema/version changed.

Rollback: restore the unmodified uploaded v0.22.6 ZIP or revert this isolated local branch/patch. Preserve browser-origin backups first. No production data affected.
