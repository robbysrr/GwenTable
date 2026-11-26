# GwenTable | Localization QA v0.82

## Verified baseline

- Based on the **actual v0.81 archive** `GwenTable_SRD521_Localization_Semantic_Contradictions_v0_81_Kit.zip` and its pinned PDF/source inputs, not on an assumed current website repository.
- SRD source PDF: 364 pages; Indonesian draft: 595 pages. Input checksums are stored in `GwenTable_v082_Static_QA.json`.
- The 68 metadata translation candidates and editorial attestation inherited from v0.81 remain untouched and unsigned.

## What changed

- Compared four high-risk spells (Arcane Lock, Astral Projection, Augury, Awaken) through **62 explicitly anchored rule clauses**, verifying each anchor exists inside the correct spell section of the original SRD and the Indonesian draft.
- **One provisional source-fidelity issue in Arcane Lock, local page 219 / SRD printed page 110**: translated sentence appears to prohibit all nonmagical ways of opening the *object*, whereas SRD prohibits nonmagical *unlocking of the magic lock*. This can affect DM adjudication.
- Created **one new, independently tracked PROPOSED prose correction**, not counted as one of the existing 68 metadata changes. No approval, no direct PDF write.
- Delivered separate four-spell decision template, normalized clause CSV, English/Indonesian evidence excerpts, HTML workbench, proposed patch, and source-based report PDF.

## Actual verification

- 62/62 English and 62/62 local source anchors matched inside their respective spell sections. 61 clauses **appear aligned in provisional AI review**, one was flagged. An anchor match is not a human proof of equivalence.
- Patch source and candidate SHA-256 verified; exact one-for-one replacement in extracted *text copy* and reversal tested.
- Eight deliberately invalid patch variants rejected, including source drift, changed replacement and fake approval status.
- Chromium tests in 320, 375, 768, and 1280 px passed with simulated 200% text, enhanced letter spacing, issue highlight, editing review notes, and exporting JSON.
- v0.81's previous automated test suite was separately rerun and passed.
- PDF report and separate editorial proof rendered, visually inspected and bounding-box checked.

## Unresolved

- **All 68 earlier metadata candidates and the one new prose candidate remain unapproved**. No claim of editorial signoff, legal clearance, PDF/UA, NVDA/TalkBack accessibility, or real website integration.
- The provisional alignment of 61 clauses does not certify full translations of those spell entries. Other spells are outside this focused sprint.
- No edits to the production GwenTable app, source repository, data, or the 595-page draft PDF.
- **Publication: NO-GO.**

## Reproduce from an extracted ZIP

1. Extract retaining the `source_v081/inputs/` subfolder; it contains the exact relevant SRD/local PDFs and baseline unsigned candidate/attestation records.
2. `python build_v082.py`
3. `python test_v082.py` (requires PyMuPDF, Playwright and Chromium at `/usr/bin/chromium`)
4. `python prose_patch_preview_v082.py`
5. `python report_v082.py` (requires ReportLab and DejaVu font)
6. Compare the CSV/JSON and report content with this release. PDFs may include generator metadata which can differ between runs; structured data are stable.

## Recommended next action and environment

**STAY** in Chat/local for editorial review. Obtain an independent bilingual editor's decision on the new Arcane Lock prose issue and four P0 material components before patch promotion. **PREPARE** source-bound records for the actual GwenTable repository. **SWITCH to Codex only once an approved patch and repository are available**, then test i18n, UI, rules regression and CI. Work mode is not needed merely to view these offline files.

## Required SRD attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
