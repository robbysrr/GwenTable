# GwenTable v0.24.1 | Sprint 02 Gate G1: GCX export freshness repair

**19 November 2026 · local-only implementation · no connected production repository**

## Inputs, baseline and goal

- Source: supplied `GwenTable_Source_v0.24.0_Local_Development.zip`, extracted directly and verified by running its scripts.
- Before: `npm test` 245/245 passed; `npm run build` passed. GCX export from Saved Characters and the active builder captured a potentially stale record, and prepared GCX download links did not check for newer revisions.
- Target: saved-source GCX export must refuse stale tabs and unsaved changes, preserving schema, SRD 5.2.1 mechanics, privacy, completion approval, custom records, and Build/Live Snapshot functionality.

## Code changed

| File | Change |
| --- | --- |
| `dist/gcx-export-freshness.js` | New pure revision/content guard and async pre/post-encode verification; foreign-only records use revision safety without fraudulent completion approval. |
| `dist/app.js` | Saved and active GCX entry points now use the saved record; active editor must match saved revision, draft content, and completion state; guarded download link revalidates when clicked, clears on mode change/close, and revokes stale blob URLs. |
| `dist/locale-copy.js` | English/id-ID save/reopen guidance for stale GCX attempts. |
| `dist/sw.js`, `scripts/build-artwork-withheld-preview.mjs` | Cache revisions `open-5e-v0.24.1` and separate artwork-withheld preview cache; precache new guard. |
| `tests/day05-gcx-export-freshness.test.js` | Ten deterministic tests: stale/missing/legacy tokens; active editor pending changes; storage read failure; pre/post async race; genuine Build/Live GCX; foreign custom; integration and localization. |
| Existing tests | Updated version-pinned service-worker assertions. |

No core SRD rules changed. No IndexedDB schema upgrade, migration, cloud service or licensed artwork was added.

## Verification

- `npm test`: **255 passed, 0 failed, 0 skipped** (10 added).
- `npm run build`: **PASS** (syntax, local references, pinned rules registry).
- `npm run build:artwork-withheld-preview`: **PASS**, 12 assets withheld; `npm run audit:artwork-withheld-preview`: **PASS, 0 image variants**.
- `npm run audit:public-art`: **EXPECTED NO GO, 12 unapproved image/icon assets** in the normal local source.
- Local HTTP: normal/preview app and GCX module **200 OK**, preview removed logo **404**.
- Headless Chromium: launched but did not return usable DOM within 15 seconds (timeout). **No real-browser or mobile acceptance claim.** Actual PDF, keyboard, screen reader and genuine participants **NOT TESTED**.

## Limitations and release gate

- This is a best-effort **read-only** revision guard, not an IndexedDB transaction locking the source record throughout GCX generation and browser download. Races remain theoretically possible after the final read; actual Chromium/Android download activation must be tested.
- A legacy saved record without a revision token is preserved but fails closed for guarded GCX; reopen/review/save it first.
- Only locally saved native characters with valid completion receipts can export official SRD builds. Foreign-only GCX records remain separately identified as imported private content.
- The original source retains 12 development assets without owner public-distribution approval; the artwork-withheld preview is local QA only and does not clear code/IP/publication gates.

**Sprint 02 G1: REPAIR. Public deployment: NO GO.** Next gate: real-browser GCX link freshness, saved-character recovery and cross-tab IndexedDB acceptance, PDF usability, 320px/keyboard/screen-reader checks, and separate owner licensing review.

Rollback to the unmodified v0.24.0 ZIP; no saved data migration or destructive migration is required. Advise the user to download private roster/draft backups before changing a local installation.
