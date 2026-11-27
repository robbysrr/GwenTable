# GwenTable v0.22.9 | Sprint 02 Day 05 repair/integration evidence

**Date:** 19 November 2026 (Asia/Jakarta). **Execution:** IMPLEMENTED LOCALLY; **G1 builder gate:** REPAIR, **production:** NO GO. 

## Source and entry inventory

- Baseline: uploaded `GwenTable_Source_v0.22.8_Local_Development.zip`; prior Day 05 handoff and QA guide inspected. Archive was extracted locally, **not** checked out from a remote Git repository. Historical upstream commit `89ad5dc2d11dbe30cf0b31029d07a45ce97e69a4` is reported by the inherited archive and is **not** this candidate's commit.
- Planning: user's `GwenTable_End_to_End_Development_to_Publication_Master_Prompt_v1_0.txt`, PRD Edition 9.0, and Sprint-to-Publication Plan Edition 2.0. These are product specifications, not evidence of earlier implementation or deployment.
- SRD truth: existing pinned 5.2.1 catalog, four example Backgrounds and 12 Classes retained; Character Origins p.83 (and feat rules p.87) were checked in the preceding v0.22.7 handoff. This slice changes **no gameplay data/rule formula**.
- No connected online repository, deployment credentials, production data or owner artwork publication signoff was accessible. Previous Sprint 01/02 remote handoff branches are not independently verified beyond uploaded archives.

## Actual changes against v0.22.8

1. `dist/builder-choice-review.js`: persisted choice-intent schema **v3**. Distinguishes projected/confirmed Species and dependent traits; Class; two Standard Languages plus class-dependent choices; Class training; Feats; ordinary Class spell choices. Existing Background, Soldier Gaming Set, boost, equipment and Magic Initiate gates remain. All source-sensitive snapshots are deterministic and never grant a second feat, kit or coin.
2. `dist/app.js`: stage-specific visible review cards and confirmation actions for the new stages; suggested picker labels; Class and Species edits invalidate affected decisions. Confirmation is not reported successful until the current revision is actually saved. Magic Initiate continues to have a separate confirmation.
3. `dist/locale-copy.js`: localized EN/id-ID text for new confirmation, pending and error states. Technical rules and canonical IDs are untouched.
4. `tests/day05-safety-gate.test.js`: 11 additional deterministic tests; existing earlier regression tests' expectations were updated to reflect newly required confirmations (tests were not removed or skipped).
5. `scripts/audit-release-assets.mjs`, `audit/GWENTABLE_PUBLIC_ALLOWLIST.json`, `tests/day05-artwork-release.test.js`: artwork-only publication gate with exact filenames, SHA-256, license/owner and approval requirements. New tests cover fail-closed, tampered hashes and a controlled approved fixture. All 12 existing image/icon files are **pending explicit owner signoff**, so this command correctly exits **2**, not 0.
6. `package.json`, `dist/sw.js`, `README.md`: v0.22.9 version/cache isolation, local instructions, audit command. `EXPORT_INFO.json`, SHA-256 manifest, and this handoff are release evidence, not production certificates.

No new public artwork, font binaries, cloud sync, Board integration, runtime AI calls, PHB-only rules, private Avarra lore, or extra dependencies were introduced. `dist/lib/character.js`, `dist/lib/catalog.js` and existing storage/portable mechanics are unmodified.

## Non-destructive compatibility

- v3 intent fields are additive; `restoreChoiceReview` adapts old v1/v2 envelopes by inferring confirmation for **already traversed** new stages only. An untouched new build remains pending. v2's recorded boost/equipment approvals are retained if present; missing approvals are not fabricated.
- Switching Class or Species invalidates the affected source-bound approvals. Background changes invalidate associated feat/boost/equipment reviews but do not erase unrelated character notes or custom fields.
- Backup imports (including nested previous-draft entries) continue to reset approval authority. Legacy unknown-field preservation is unchanged. No destructive IndexedDB/schema migration or remote mutation occurs.
- The underlying calculation engine still projects valid choices for rendering. v3 does **not** introduce a fully nullable canonical character model. Remaining projected ability-score methods/individual assignments, equipped loadouts and advanced feature decisions need a dedicated follow-up review.

## Verified commands and evidence

| Check | Actual result |
|---|---|
| Baseline `npm test` in v0.22.8 | **136 PASS, 0 FAIL, 0 SKIP** |
| Candidate `npm test` | **151 PASS, 0 FAIL, 0 SKIP** |
| `npm run build` | **PASS** (static JS syntax/assets/pinned source registry) |
| `npm run audit:public-art` | **EXIT 2 (EXPECTED NO GO)**; all 12 inherited artwork variants require owner release approval |
| local HTTP `curl -I /` | **200 OK**, no-store, static HTML, on 127.0.0.1:4179 |
| Chromium via Python Playwright | **BLOCKED** `net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost and independent `data:` control page |
| 320px browser/mobile, keyboard, screen reader, real PDF | **NOT TESTED** due environment/browser limitation |
| Genuine beginner participants | **0** |
| source hash verification | See `SOURCE_SHA256.json`, verified after packaging |

The negative artwork audit is a **successful safety check**, not a green artwork-publication gate. `npm run build` is a source validator, not a deployed release or a compiled optimized bundle.

## Open issues and disposition

| ID | Priority | Status | Release implication |
|---|---|---|---|
| GT-05-BROWSER | P0 publication gate | BLOCKED by host policy | Run full real-browser flow, focus/dialog, refresh and completed PDF before public GO |
| GT-05-MOBILE | P0 publication gate | NOT TESTED | Physical/mobile browser and screen-reader acceptance outstanding |
| GT-05-AUTOPROJECT | P1 | PARTIAL | Projected score-generation method, individual equip choices, high-level feature prerequisites need a full explicit intent audit |
| GT-05-LEGACY | P1 | AUTOMATED PASS; browser pending | Verify live old IndexedDB character recovery and no false saved status |
| GT-05-ASSET-RELEASE | P0 publication gate | FAIL CLOSED (12) | Owner approval for exact served asset binaries/license/semantic use and separate code license before any public deployment |
| GT-05-NOVICE | P1 | NOT TESTED | 3–5 uncoached newcomer sessions or owner-accepted limited beta risk |

## Exact next acceptance slice

1. On an unrestricted browser, test an actual fresh Human Fighter/Soldier (320px and desktop), deliberate Species/Class/Languages/Skills/Feats/Boost/Gear confirmations, reload before and after, switch Class to Wizard, then confirm valid Class/Magic Initiate spells. Verify completion cannot be opened by deep link until all choices are genuinely reviewed.
2. Import a v0.22.8 guest draft with partial and fully traversed stages, old custom fields, and backup history; validate non-destructive upgrade and recovery after local storage write denial. Observe multi-tab revision conflict behavior.
3. Verify `data-confirm-choice` focus and status under keyboard, touch, screen reader, 200% zoom and EN/id-ID; validate original character PDF and back/forward routes.
4. Request explicit owner code-artwork licensing/public approval before adding entries to `audit/GWENTABLE_PUBLIC_ALLOWLIST.json`. Re-run `npm run audit:public-art`; scan service-worker list and public-served routes.
5. Only after G1 evidence improves to GO should Sprint 02 Day 06 Languages mechanics or Day 07 score-calculation expansion be treated as eligible for another independent implementation.

**Rollback:** Preserve/export browser IndexedDB and backups first. Restore original uploaded v0.22.8 ZIP and run its tests. This local source does not deploy or touch saved production characters. **No actual remote commit/branch, published URL or owner GO is claimed.**
