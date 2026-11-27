# GwenTable v0.24.3 | Day 05 G1 release gate and code evidence

Date: 2026-11-19. Entry: archived `GwenTable_Source_v0.24.2_Local_Development.zip`, not a remote git checkout. No authorized deployment/production data changes. The v0.24.2 baseline passed 265/265 Node tests and the static build.

## Scope and verified changes

- `dist/index.html`: replace separate EN/ID flag buttons with one native button bearing `role="switch"`, `aria-checked`, English/Indonesia flag positions and translated accessible label.
- `dist/locale.js`: same `gwentable-language` key and `gwentable-languagechange` event; update `html.lang`, visible strings, toggle checked state, thumb direction, label and title as a single operation. Storage read/write failures remain non-fatal.
- `dist/style.css`: a 44px touch target, gold moving thumb, focus ring, accessible flag contrast and reduced-motion support. No new image binary or external dependency.
- `dist/sw.js`, `scripts/build-artwork-withheld-preview.mjs`: distinct standard and artwork-withheld cache identifiers `v0.24.3`.
- `tests/interface-language.test.js`: old two-button test replaced by tests of real switch contract, both directions, restored preferences, malformed values and blocked storage; version-specific service worker assertions updated elsewhere.
- `package.json`, README, test/source metadata and local QA notes updated. Character rules, saved schemas, GCX, PDFs and data grants untouched.

## Verification

- `npm test`: **268 pass / 0 fail / 0 skip**. Baseline 265; net +3 tests.
- `npm run build`: PASS.
- `npm run build:artwork-withheld-preview`: PASS (12 binaries withheld).
- `npm run audit:artwork-withheld-preview`: PASS (0 image binaries).
- `npm run audit:public-art`: expected FAIL/NO GO (12 unapproved artwork variants).
- Real browser, native keyboard, screen reader and mobile: **NOT VERIFIED** (Node test and static checks do not substitute).
- Existing data migration: **not needed**. No character schema changed. Previous language preference key stays compatible.

## Current gate

**Sprint 02 G1: REPAIR. Public release: NO GO.** Run manual checklist in `docs/LOCAL_QA_v0.24.3.md` on an unrestricted browser; retest IndexedDB conflicts, completion-gated PDF/GCX, recovery, and real accessibility. G2 rights remain separately blocked for normal source, and the artwork-withheld QA preview cannot clear the other release criteria. Unknown source-license/asset permissions have not been granted.

**Rollback:** restore the archived v0.24.2 source. Settings share the existing string key (`en`/`id`), so no migration is needed. If switching versions, export a private character backup first. The fallback preview retains its own cache namespace.
