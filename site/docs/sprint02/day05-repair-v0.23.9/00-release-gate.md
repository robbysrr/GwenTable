# GwenTable v0.23.9 | Sprint 02 G1 / G2 artwork-withheld QA slice

**Date:** 19 November 2026. **Execution mode:** IMPLEMENTED in isolated local source ZIP. **Release:** G1 REPAIR, G2 still pending owner/legal source signoffs, production NO GO.

## Verified baseline and implementation

Baseline source: user-uploaded `GwenTable_Source_v0.23.8_Local_Development.zip`, exact project files in `dist/`, `scripts/`, `audit/` and `tests/`. Baseline: **232/232 Node tests PASS**; `npm run build` PASS. No remote Git repo or deployed app was used or changed.

The inherited default static build under `dist/` includes 12 SVG/PNG/WebP/ICO files without an explicit GwenTable public publication approval in `audit/GWENTABLE_PUBLIC_ALLOWLIST.json`. Its artwork audit **continues to fail closed** with 12 unresolved assets. No permission or attribution approval was invented.

Implemented changes:

- `scripts/build-artwork-withheld-preview.mjs` NEW: copies the existing static app into isolated `.artwork-withheld-preview/` (or an explicit output directory); removes all external image/icon binaries; rewrites logo/hero to decorative CSS/text fallbacks; removes private inherited Taverley stylesheet and asset directory; retains the kit's MIT license in `licenses/original-ui-kit-MIT.txt`; rewrites service-worker cache list and uses a unique cache revision; checks every HTML/SW linked asset and scans for forbidden external static paths. Adds `PUBLICATION_NOT_APPROVED.txt` and `robots.txt` to the preview.
- `scripts/dev-local.mjs`: optional `--artwork-withheld` mode serves the generated QA preview, default localhost port **4174**. Regular development server remains on 4173.
- `scripts/audit-release-assets.mjs`: accepts a path argument for audit of **actual output bytes**; omitted argument keeps the original fail-closed `dist/` audit behavior.
- `scripts/verify-source-hashes.mjs` and `.gitignore`: exclude only the generated `.artwork-withheld-preview/` from source integrity versioning.
- `package.json`: adds `build:artwork-withheld-preview`, `dev:artwork-withheld-preview`, `audit:artwork-withheld-preview`; bumps version 0.23.9.
- `tests/artwork-withheld-preview.test.js`: six regression tests for asset removal, accessible fallback labels, separate SW cache identity, audit failure on reintroduced assets, unchanged original build, refusal to overwrite project source.

**Important:** This is a safe *artwork omission* workflow, not a blanket legal clearance. Inline SVG shapes/code, JavaScript, original UI elements, the full SRD source inventory, PDF rendering, privacy, cross-site boundaries, accessibility, actual browser behavior, and other publication obligations require independent review. `robots.txt` is not access control and does not authorize serving the preview publicly.

## Reproducible local commands

```sh
npm test
npm run build
npm run audit:public-art                 # expected exit 2; 12 blocked assets in development dist
npm run build:artwork-withheld-preview  # generated .artwork-withheld-preview/ (local QA only)
npm run audit:artwork-withheld-preview  # artwork-only PASS: zero image binaries
npm run dev:artwork-withheld-preview    # http://127.0.0.1:4174
npm run verify:source                   # after packaging integrity manifest regeneration
```

## Gate and outstanding work

- G1 **REPAIR**: real browser IndexedDB recovery, multi-tab conflict, Play/PDF completion, keyboard/320px/200% zoom/screen-reader not verified; 0 genuine novice participants.
- G2 **PARTIAL/BLOCKED**: artifact-scoped zero-external-image audit passes in an **isolated QA preview only**; normal local development dist remains intentionally blocked with 12 assets. Owner must choose whether to clear assets or ship an independently reviewed fallback in a future public artifact. Code/inline assets and license signoff also remain unapproved.
- G3–G7 **NOT VERIFIED**: full mechanics and completion paths, full SRD compendium, PDF/play, accessibility, deployment and owner signoff.
- No production deployment, no imported private Avarra art, no account/network integration, no real-user data touched.

**Rollback:** Delete generated `.artwork-withheld-preview/` and revert source to v0.23.8. No character data, database version, rules schema, or service worker under the normal localhost origin was changed. Keep source ZIP and private character backups separate.
