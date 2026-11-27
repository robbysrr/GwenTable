# GwenTable dev.4 -> dev.5

## Added
- `dist/lib/inventory-activation-backup.js`: create/validate importable private character backup and revision-bound activation acknowledgement.
- `tests/inventory-activation-backup.test.js`: six targeted tests.
- `docs/MVP_RELEASE_SCOPE_v0.25.7-dev.5.md`: bounded MVP acceptance.
- `README_MVP.md`: working instructions.
- `CODEX_MVP_ACCEPTANCE_PROMPT.txt`: repository-backed acceptance handoff.
- `CHANGED_FILES_MVP.md`: changed-file summary.

## Modified
- `dist/inventory-panel.js`: prepare/download/acknowledge backup before enabling activation.
- `dist/play-sheet.js`: backup preparation, current-revision check, stale/write protection, locale-rerender preservation.
- `dist/locale-copy.js`: bilingual safety copy; game terms remain in English.
- `dist/sw.js`: caches the helper and increments service-worker revision.
- `package.json`: development version bump.
- `tests/day05-backup-import-hardening.test.js`: expect updated cache revision.
- `PROJECT_STATE.md`: verified baseline, change history, open gates.
- `SOURCE_SHA256.json`: regenerated after final verification.

No changes to the inventory engine, character storage schema, SRD calculation engine or existing saved character data.
