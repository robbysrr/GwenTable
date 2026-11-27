# GwenTable project state • 26 November 2026

**Verified local baseline:** original Hazards v1, v2 and v3 ZIPs are bundled unchanged; clean extraction and all manifest checks passed. Node v22.16.0 retests: v1 76/76, v2 131/131, v3 170/170. These are cumulative independent snapshots; 170 is the latest count, not 377. Current source is `source/hazards-v3`, not a website. No source edits in this handover sprint.

**Completed in candidate:** three initial hazard helpers (falling, burning, suffocation); v2 adds dehydration, malnutrition and size-based food/water, separate Exhaustion provenance and recovery; v3 adds a synthetic ledger, actor/revision/receipt validation, pending DC 10 Constitution save, trusted host resolution, rollback and JSON roundtrip. Five SRD glossary hazard categories represented, not exhaustive adjudication. All candidate UI copy is proposed; no actual UI.

**Prior evidence only:** private Dev.22 bridge (573/573 Node and 42/42 HTTP checks historically reported; browser timeout); separate dev.14 party condition reconciliation (697/697 historically reported; no real persistence acceptance); separate MVP high-level class integration (dev.15 Bard complete level range; remaining Warlock/Wizard then reported incomplete); localization v1.44 ZIP known by filename only, prior conversation reports 180/339 source-reference records, not translation completion, unverified here. Do not equate these branches or treat earlier checks as current.

**Blockers:** canonical Character Studio/Play Sheet source (UX9/dev.14/Convergence08 identity unresolved), backup/commit, exact prior branch ZIPs and localization master not available in this runtime. Earlier GitHub search for GwenTable returned no matching accessible installed repository. Library raw retrieval refused for Dev.22 patch and localization v1.44/v1.41 and older Bard patch during this handover. Only historical excerpts/metadata available. No actual website merge, browser E2E, cross-tab IndexedDB, production data, full rules integration, release readiness, or complete translation verified.

**Decision:** keep current candidates as test-only inputs; consolidate, do not start a new app. Preserve strict SRD scope, EN/ID, licensing, existing UX and portable exports. Do not use synthetic storage in production. No authorization or deployment action taken.

**Next:** recover authoritative full-site source/commit and a sanitized backup; run baseline tests and integrate one survival vertical slice with real persistence. Then reconcile other rule branches and localization. See docs/INTEGRATION_BACKLOG.md.

**Environment:** SWITCH to Claude Code or equivalent repo-aware engineering environment only when actual source is supplied; Claude chat is sufficient for planning/inspection. No credible overall completion % or date until a consolidated backlog and baseline exist. No paid infrastructure needed for first slice.

---

## Update • 26 November 2026 • Claude Code cloud session

**Verified now:** `node verify.mjs` (Node v22.23.5) -> handover file hashes PASS; Hazards v3 170/170 pass, 0 fail, 0 skipped, 0 cancelled, exit 0. No source edits.

**Authoritative checkout search:** GitHub `robbysrr/GwenTable` (public) holds one commit `e7a2832` on `main` (README.md + CC0 LICENSE only); branch `claude/lucid-ritchie-nvja1w` is identical. The other 4 accessible repos (3D-pong, Pong, stopwords_ID, a 2022 coursework repo) are unrelated. No package manifest, lockfile, tests, migrations, UI, inventory, save resolver or persistence exists to integrate with. Status: canonical website MISSING.

**Stopped before P1 survival slice** as FULL_CONTEXT section 8/10 requires: no host code to map v3 onto; building one would be a new isolated implementation.

**SRD pin (verified now):** SRD_CC_v5.2.1.pdf downloaded from the official URL via new personal environment `GwenTable` (allows media.dndbeyond.com): 6,031,375 bytes, 364 pages, ModDate 2025-04-29, SHA-256 `8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87` = matches historical record. PDF kept out of the repo.

**Decision (owner, 26 Nov):** `robbysrr/GwenTable` may remain public; site source may live there. Still no secrets, real saves or uncleared art.

**Next:** owner supplies full site checkout (repo URL/branch/commit or ZIP with lockfile, tests, migrations, sanitized fixtures; no secrets/real saves/node_modules). Then: baseline tests/build, code map vs v3, survival vertical slice.

---

## Milestone • 26 November 2026 • Survival preview (candidate, not website integration)

Owner direction: build a private browser preview of the Hazards v3 candidate (chosen over waiting for the site source). The authoritative website checkout is still MISSING; this does not replace P0 recovery or the P1 integration slice.

**Changes**
- `candidate/hazards-v3/` — Hazards v3 copied unchanged (all 11 SHA256SUMS entries OK).
- `preview/index.html`, `preview/app.js` — single-page EN/ID survival tracker that acts as the local "trusted host" for one example character: consume food/water (inline confirm), end-of-day forecast, pending DC 10 CON prompt (no auto roll; player records Saved/Failed), source-coloured Exhaustion track with locked levels, Long Rest removal from an unlocked source, "other effect" Exhaustion, receipts log, JSON export/import (no effect replay), localStorage persistence with a whole-snapshot compare before each commit (stale tab refused), cross-tab sync via `storage` events, SRD attribution.
- `preview/serve.mjs` — local static server; `preview/test/preview.e2e.mjs` — Playwright browser tests.
- `handover/` — handover docs and evidence (history ZIPs and SRD PDF not committed).

**SRD audit (pinned PDF, hash above):** Dehydration, Malnutrition and Exhaustion [Condition] text checked against `survival.mjs`: water/food needs by size (1/4..64 gal / lb → 128 fl oz per gal, 16 oz per lb), "less than half" thresholds, DC 10 CON for positive intake below half, automatic level at end of day 5 without food and each later day, removal blocked until a full day's amount, Long Rest removes 1 level, death at 6, D20 −2×level, Speed −5×level ft. No discrepancies found in these rules.

**Verified now (Node v22.23.5, Chromium via Playwright)**
- `node --test test/*.test.mjs` in `candidate/hazards-v3`: 170/170 pass, 0 fail.
- `node --test preview/test/preview.e2e.mjs`: 10/10 pass, 0 fail, 0 skipped — load with no script errors; keyboard consume/confirm with exact single deduction; cancel, fractional and over-stock input rejected without changes; pending save survives reload with no early Exhaustion; failure adds 2 locked levels (D20 −4, Speed −10 ft); reload and export→import do not replay effects; full intake unlocks recovery and Long Rest removes one level; two tabs sync and a stale tab writes nothing; ID locale sets `lang="id"` and persists; no horizontal scroll and ≥44px buttons at 320/390/768/1440px in EN and ID.
- Private claude.ai artifact published: https://claude.ai/artifact/9qRjFTKWprELfnsEpQsLwj (owner-only until shared).

**Not verified / limitations:** 200% text zoom, screen reader, real devices; dark theme only spot-checked by design tokens. The page authorizes its own commands (single local user) — not an authorization model. localStorage compare is not a database transaction. Supplies are synthetic ounces, not inventory items; no restock (start a new example). Candidate limitations from INTEGRATION.md still apply (global pending-save lock, no cancellation, no revival, fixed size per day). Indonesian strings are draft, not editorially approved. Hazards falling/burning/suffocation helpers have no UI here.

**Next:** recover the authoritative GwenTable site checkout (P0), then integrate this slice into its real character sheet, inventory, save resolver and storage.

**Environment:** Claude Code cloud session on personal environment `GwenTable` (package registries + media.dndbeyond.com). Release decision unchanged: NO GO.

---

## Milestone • 27 November 2026 • Context v3: source identification (blocked) and verification of supplied kits

**Inputs received:** Context v3, Character Sheet Kit v0.3, Spell Localization v1.46, Localization Source Fidelity v0.82 (+ START_HERE v3). That is 3 of the 22 registered archives, plus the context. Searching the connected Google Drive found none of the 22. The only ZIPs there are two "DnD-20261117…" exports (1.6/2.1 GB) in a "Books" folder; they are not GwenTable source and were not downloaded.

**Authoritative website baseline: NOT IDENTIFIED.** UX9, Convergence08, Dev15 and MVP16 source ZIPs are all missing. No integration was performed. See `project-docs/CONSOLIDATION_PLAN.md` for the exact files required and the selection/merge procedure.

**Verified now**
- ZIP CRC OK for all 5 uploaded ZIPs. Byte sizes of sheet kit, v1.46 and v0.82 match `RECOVERED_ARCHIVES.md`.
- Context v3 `node verify.mjs`: 38/38 hashes, Hazards v3 170/170.
- Sheet kit v0.3 `test_field_sheet.py`: 12/12 variants PASS + layout/attribution checks (ReportLab, pypdf).
- Localization v1.46: 25/25 hashes; 124/124 unittests; combined file holds 60 records (#145–204).
- Localization v0.82: 26/26 manifest hashes; `test_v082.py` PASS (62 clause rows, 8/8 bad patches rejected, 4 Chromium checks). Installed PyMuPDF and Python Playwright 1.63.0; symlinked `/usr/bin/chromium` to the preinstalled browser, container only.
- Finding: the v0.82 kit's `SRD_CC_v5.2.1_copy.pdf` is a re-saved file (SHA-256 22bbbe05…, 6,542,011 bytes) that differs in bytes from the official PDF (8974902d…). The extracted text is identical, so the kit's `srd_sha256` pins a copy, not the official file.
- Secret-pattern scan of all extracted packages: no matches.

**Repository changes:** `docs/` (now `project-docs/`) (v3 register, backlog JSON with status vocabulary and evidence, consolidation plan), `handover/*_v3.md`, `recovered/` (text/source parts of sheet kit v0.3, localization v1.46 and v0.82; PDFs and images not committed).

**Register:** 315 items: 293 not verifiable, 6 blocked, 2 partial, 1 candidate-only, 8 candidate-verified, 3 verified, 2 compliant. Site-integrated: 0/315.

**Next:** owner supplies the four site ZIPs (+ recovery kit and QA ZIPs), then baseline selection per the plan.

**Environment:** Claude Code cloud, GwenTable environment. Release: NO GO.

---

## Milestone • 27 November 2026 • Integration 10 source received; Integration 11 and online UAT build

**Authoritative source:** Integration 10 handover (4 parts, 515/515 files verified). Baseline reproduced fresh: 400/400 source hashes, 796/796 Node tests, static build, artwork-withheld build and art audit. The website now lives in `site/` (Integration 11); full state is in `site/PROJECT_STATE.md` (newest first).

**Integration 11:** two builder blockers found by the first real-browser acceptance run and fixed; Bless/Bane D20 dice on saving throws. 811/811 Node tests, 12/12 Chromium acceptance tests, phone emulation (Pixel 7, iPhone 13, 320 px) passes build → save → damage with no overflow.

**Online UAT (owner-approved, 27 Nov):** `docs/` holds the artwork-withheld build with `noindex`, served by GitHub Pages from branch `claude/lucid-ritchie-nvja1w`, folder `/docs`. Not a public release; release gates still NO GO. The 12 uncleared image binaries and the Taverley design kit are withheld from this repository (`site/WITHHELD_FROM_PUBLIC_REPO.md`). Earlier repo docs moved to `project-docs/`.

## Milestone • 27 November 2026 • Integration 12 (owner requests)
Settings menu in the top-right corner; fillable GwenTable Character Sheet v0.3 PDF generated from each character; compendium opens each subject on its own SRD 5.2.1 text (99.3% of sentences verbatim against the official PDF); builder start options open for new players and Next confirms-and-continues. 821/821 Node tests and 16/16 browser tests on the full private tree; 813/3 in this public copy (3 need the withheld art). Online UAT copy in `docs/` rebuilt. Details: `site/docs/INTEGRATION12_SETTINGS_SHEET_COMPENDIUM_UX.md`.

## Milestone • 27 November 2026 • Integration 13 (Live Gameplay Sprint A)
Attack roller on the Play sheet (#3): typed or generated dice, Finesse choice, Critical Hit doubles dice only, natural 1/20, Champion range, Bless/Bane d4, Exhaustion, SRD property/mastery reference; preview only, nothing saved. Android UAT package (Python loopback server, port 42639) built and tested from a fresh extraction; delivered privately, not committed here. M1 Slice 18 (named in the master prompt) was not reachable from this session; reconciliation open. Full tree 831/831 Node, 17/17 browser; this public copy 823/3 (art-dependent). Registers: `site/docs/LIVE_GAMEPLAY_30_REGISTER.md`, `site/docs/SCOPE_CONFLICTS_AND_RULES_I13.md`.
