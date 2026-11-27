> **Current v0.22.7 Day04 hardening:** See `../day04-v0.22.7/09-day05-handoff.md` for updated QA and release status. Below is historical v0.22.6 evidence.

# GwenTable local continuation: v0.22.6 (19 November 2026)

**Status: implemented local source candidate, production NO GO.** This packet follows the uploaded v0.22.5 local ZIP, not a live production branch. No deployment, remote database, Git history, installed art pack, actual player data, or app identity was used or modified.

## Goal and baseline

The inherited engine's `build()` fills a legal/default Background and Magic Initiate choices even when a player has never made those choices. A generated or newly started character could therefore display projected choices as if they were intentional. Baseline check on the exact uploaded ZIP: `npm run build` passed and **107/107 Node tests passed**. The prior Day04 handoff identified these as BG-04-01 and BG-04-02, with browser persistence/focus/PDF checks still open.

## Implemented changes

- New `dist/builder-choice-review.js` is a **UI-progress-only** confirmation adapter. It stores `choiceReview.version=1`, the confirmed Background ID, and a fingerprint of the current Magic Initiate selection set. It does **not** add a character schema field, alter SRD values, duplicate feats, or silently change catalog data.
- Fresh manual, generated, and template character builder flows start with confirmations pending. `Background` displays an explicit **Use this Background** button. The Next button refuses to advance until confirmed. Selecting a different Background through the existing impact/presave dialog confirms that chosen ID after a successful commit, not on cancel or failure.
- The `Spells` stage requires a **Confirm Magic Initiate choices** action when the current character has Magic Initiate granted by its Background or Human Origin feat. The fingerprint incorporates relevant spell-list selection when applicable, spellcasting ability, two cantrips, and level-1 spell. Changes cause the review gate to reopen. A Human changing from Soldier to Criminal can automatically switch from Alert to Magic Initiate to avoid duplicate feats: this new gate catches that case.
- `completionIssues`, Review, Appearance completion, sheet-preview eligibility, and PDF/save-export gating see the same pending choices. A rendered/default character is not automatically accepted. English and Bahasa Indonesia have appropriate explanatory copy.
- Previously completed characters and pre-existing drafts that already traversed the relevant stages are grandfathered to maintain editability. This compatibility allowance is **not proof of explicit historical player selection**; it only prevents breaking old records. Existing new-style progress records preserve pending state across same-origin IndexedDB reloads.
- Importing a draft backup now strips approval, saved status, and source-record IDs **including from nested recovery history**, while retaining raw draft and custom provenance. An imported backup cannot smuggle completion authority through Restore Previous Draft.
- `dist/sw.js` now caches `builder-choice-review.js` under revision `open-5e-v0.22.6`. UI style adds a distinguishable confirmation section. No new dependencies.

## Evidence

| Check | Result | Limits |
| --- | --- | --- |
| `npm run build` | PASS | Static tree, references, JS syntax, source registry, credit line |
| `npm test` | **118 passed, 0 failed, 0 skipped** | Includes 11 new pure integration/regression tests: pending states, positive confirmations, stale selections, Human origin, language invariance, legacy compatibility, backup history |
| Local HTTP server | PASS | `GET /` returned 200; no-store headers |
| Chromium/Playwright browser navigation | **BLOCKED** | `net::ERR_BLOCKED_BY_ADMINISTRATOR` at `http://127.0.0.1:4173/#create` in this managed container; no click/keyboard/mobile assertions |
| Live novice participant sessions | NOT RUN | 0 participants, 0 recordings |
| PDF print/mobile/focus/IndexedDB reload end-to-end | NOT VERIFIED | Source/test coverage is not a substitute for browser execution |

## Known limitations and next release gate

- **BG-04-01 / BG-04-02 are mitigated at the builder-progress contract, not at the core character schema**: the normalized character still contains engine-selected defaults. Confirmation records that the player reviewed them, not that the underlying values are null before selection. For a future full unresolved-fields design, preserve pre-existing saved characters, custom source records, portable files, and the 2024 SRD calculations.
- Browser and accessible keyboard validation remain P0 before publishing. Check background dialog cancel/confirm/failed save, Same-origin reload/recovery, Next button focus, native dialog Escape/X, 320-px layout and 200% zoom, Screen Reader, actual PDF export, offline cache upgrades. `docs/LOCAL_QA_v0.22.6.md` is a detailed manual test matrix.
- This package has not implemented the planned Languages, Abilities, Play feature expansion or missing unique species/Background art. Current candidate is for **local development and verification only**.

## Modified and new files

**Modified:** `dist/app.js`, `dist/builder-completion.js`, `dist/draft-recovery.js`, `dist/locale-copy.js`, `dist/style.css`, `dist/sw.js`, `package.json`, local README and export metadata.

**Added:** `dist/builder-choice-review.js`, `tests/choice-review.test.js`, this handoff and manual QA guide.

**Unchanged:** `dist/lib/character.js` rules engine, class/Background catalog, core SRD rules, `dist/lib/storage.js` IndexedDB schema version, native-PDF implementation, existing character/GCX codecs.

## Safe recovery

Back up existing characters from the **original site's origin** before developing on `localhost`. Browser storage is origin-specific, and character files are not bundled in the code ZIP. To roll back code, restore the prior uploaded v0.22.5 local ZIP. No database migration is required. If you reload after v0.22.6, keep the same hostname and port so the browser's original local data remains visible.
