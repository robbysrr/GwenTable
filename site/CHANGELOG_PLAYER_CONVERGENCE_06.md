# GwenTable Player Convergence 06 | Validated composite PDF and GCX portability

**Date:** 22 November 2026. **Private development; public NO GO.** Baseline: exact Convergence 05 source ZIP SHA-256 `b6b641e34d55d4b51739065f675771bcea23ef1f5ba65eacd0d8c111fe333baa`, with 608 passing tests.

## Completed

- **Active Fighter 1 / Rogue 1 printable PDF** is no longer incorrectly treated as Fighter-only or universally blocked. Native PDF fillable forms show total level 2, both class levels, the distinct Fighter d10 / Rogue d8 pools and their remaining counts, active Sneak Attack/Expertise and correct HP. Supports 2024 and 2014 layouts and A4/US Letter through the existing no-new-dependency PDF renderer. A versioned private synthetic example is generated in external QA evidence. The single-class browser print view is still disabled for composite characters rather than displaying misleading values.
- **GCX 1.0.0 composite export/import**: active local SRD Fighter/Rogue 1+1 writes a two-entry classes ledger, total level, correct maximum HP/ability scores and the explicitly namespaced `gwentable/multiclass` allocation. Build exports do not include live Play. Live exports can include exact mixed Hit Dice and other validated Play resources. GCX document SHA-256 integrity protects the extension. Unrecognized, forged, foreign or mismatched composite records remain GCX-only for review and re-export; they are never silently converted into Fighter-only saved builds. Legacy single-class GCX continues to work.
- **Saved Characters UI** now shows `Level 2 · Fighter 1 / Rogue 1` for an active composite rather than misleading `Fighter 1`, and removes the nonfunctional single-class Builder edit button while preserving Play, Inventory, GCX and PDF access. Linked GCX updates are disabled for these composites; import as a separate copy remains possible.
- **Play Sheet progression UI** shows the correct next total level (3) and does not offer the unsupported single-class advancement action for composite characters. The XP threshold remains the existing total-level XP progression.
- Added English/Bahasa Indonesia copy for composite export/roster guidance; no change to SRD canonical option names.
- New offline cache namespace `open-5e-v0.25.7-inventory-dev.10-player-convergence06` to avoid stale PDF/GCX modules, no database version bump or character-record migration. No artwork generated.

## Evidence and limitations

- Original Convergence 05 608/608 tests pass before changes. New Convergence 06 coverage includes 12 deterministic cases: all PDF editions/papers; mixed spent Hit Dice; GCX build and live round trips; forged data rejection, prior single-class GCX, integrity tampering, private portable JSON chain, player UI/export guards, progression label and bilingual copy.
- All tests, static build, source hashes, preview and patch replay are verified as part of final packaging. Native PDF visual example was rendered with pdf-lib/Poppler and inspected; titles, sections and class levels are readable.
- Only the already-supported **Fighter 1 / Rogue 1** combination can use the new composite exports. Other class pairings or level allocations remain unavailable. GCX-consuming apps may preserve the namespaced extension without implementing its calculations. Cross-app character import/update remains explicitly gated.
- Not verified: live Windows Node26, actual two-tab browser IndexedDB, current/legacy user data migration, physical device accessibility, public artwork/legal rights, full SRD 5.2.1 coverage or authoritative UX9/dev.14 merge. Current repository is dev.6-derived; canonical remote is not provided. No real user data accessed.

## Next action

Expand composite progression beyond Fighter1/Rogue1 **only with class-level feature/resource gates and same-row revision control**, and reconcile the newer authoritative UX9/dev.14 source when available. Stay Chat/local per user instruction. **Public release NO GO.**
