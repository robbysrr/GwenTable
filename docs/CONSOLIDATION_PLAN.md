# Source identification and branch consolidation plan

27 November 2026. Status: **baseline not identified, blocked on missing archives.**

## 1. What this session actually has

| Input | Bytes | Integrity | Fresh test result |
|---|---:|---|---|
| Claude Context v3 ZIP | 143,904 | ZIP CRC OK; `verify.mjs` 38/38 hashes | Hazards v3 170/170 pass |
| Character Sheet Kit v0.3 | 1,096,561 (matches register) | ZIP CRC OK | `test_field_sheet.py`: 12/12 variants + layout checks PASS |
| Spell Localization v1.46 | 146,572 (matches register) | ZIP CRC OK; 25/25 SHA256SUMS OK | 124/124 unittest (v1.42 22, v1.43 24, v1.44 26, v1.45 26, v1.46 26) |
| Localization Source Fidelity v0.82 | 9,089,759 (matches register) | ZIP CRC OK; manifest 26/26 OK | `test_v082.py` PASS incl. 4 Chromium checks |
| Claude Context v2 ZIP | 108,544 | ZIP CRC OK | superseded by v3 |
| Official SRD 5.2.1 PDF | 6,031,375 | SHA-256 `8974902d…5e3d87` | pinned |

Secret-pattern scan of all extracted packages: no matches.

**Missing (19 of the 22 registered archives):** every full-site candidate and every gameplay/class branch. A search of the connected Google Drive found none of them. It only found a "Books" folder with two `DnD-20261117…zip` files (1.6 GB and 2.1 GB). Those look like book exports, not GwenTable source, so they were not downloaded.

## 2. Archives required to identify the baseline (P0, send these first)

1. `GwenTable_Node26_Local_UX9_Player_Workspace_Windows_x64.zip` (2,177,019 bytes)
2. `GwenTable_Player_Convergence_08_Private_Source.zip` (1,932,350)
3. `GwenTable_dev15_Unified_Player_Console_PRIVATE_Source.zip` (1,994,115)
4. `GwenTable_MVP_dev16_SRD_Warlock_Source.zip` (2,048,170)
5. `GwenTable_Codex_Source_Recovery_Kit.zip` (7,001)
6. QA zips for UX9, Convergence08 and Dev15 (507,779 / 144,827 / 450,884)

Then P1: `GwenTable_Rules_Dev22_Integration.zip`, `GwenTable_Wizard_Dev19_Offline_Source.zip`, `GwenTable_Codex_Dev14_Merge_Input_2026-11-22.zip`, `GwenTable_MVP_dev16_Codex_Upload_Kit.zip`, localization v1.41 / v1.43 / v1.44 / v1.45 and the bilingual master. The art-withheld previews and the animals source pack can wait (P2).

## 3. Baseline selection procedure (once the four site ZIPs are here)

1. Extract each into `/scratch/<name>/` separately. Record size, ZIP CRC, file count and a SHA-256 tree manifest. Never overwrite an original.
2. Scan for secrets, real player saves and uncleared art before running anything. Do not run bundled binaries (the UX9 Windows build includes a Node runtime). Use only source plus the system Node.
3. For each tree, record: `.git` metadata if present (HEAD, branches), `package.json` name and version, lockfile hash, framework, build/test scripts, storage layer (IndexedDB/localStorage schema names), localization system, export formats (JSON/GCX/PDF).
4. Ancestry: compare file-level hashes pairwise (UX9↔Conv08↔Dev15↔MVP16). Shared-identical ratio and diffs of key modules tell which tree descends from which. Also check the historical commit lead `89ad5dc2…` (Sites v33, package 0.22.5) against any `.git` present.
5. Run each tree's own install, build and tests offline. Record pass/fail/skip counts and failures exactly. These are baselines, not merged results.
6. **Pick the baseline by evidence, not version label:** the tree that (a) holds the player-facing site the owner uses, (b) has the newest real persistence schema with old-save migration, and (c) builds and passes its own suite. Ask the owner only if two trees tie on (a).
7. Create branch `baseline/<tree>` holding that tree unchanged, then work branches from it. The rollback is that branch plus the original ZIP.

## 4. Consolidation order (after the baseline)

Each step ports through a seam into the baseline's existing owner module. No wholesale tree copies, no second database, no replaying patches onto non-matching bases.

| Step | From | Into baseline owner | Backlog domains |
|---|---|---|---|
| 1 | Baseline's own engine | Build a code map and mark actual status | BASE, REG, DERIVE, STATE |
| 2 | MVP16 class progression (Warlock), Wizard Dev19 | class/level data + builder | CLASS, LEVEL, MULTI, SPELL |
| 3 | Dev15/Dev14 party conditions, Dev22 rules bridge | gameplay: D20, turn, vitals, effects, concentration | D20, TURN, WEAPON, VITAL, EFFECT, SAVE, CONC, REST |
| 4 | Hazards v3 (+ this repo's preview tests as behaviour spec) | inventory + clock + save resolver | SURV, INV |
| 5 | Sheet kit v0.3 | existing PDF export mapping | EXPORT |
| 6 | Localization v1.46 + v0.82 (after master recovery) | i18n catalogue, keyed by stable IDs | LOCALE |

Every step needs: source-traceable rules, unit tests, a browser test (keyboard, 320px, EN/ID), a persistence/reload test, and a full regression run before the next step.

## 5. Register status (docs/SRD_INTEGRATION_BACKLOG.json, 315 items)

| Status | Count |
|---|---:|
| RECONCILE_NOT_VERIFIED (no site source to check) | 293 |
| BLOCKED (needs missing archive) | 6 |
| PARTIAL | 2 |
| CANDIDATE_ONLY | 1 |
| CANDIDATE_VERIFIED (standalone candidate only) | 8 |
| VERIFIED | 3 |
| COMPLIANT (process rules) | 2 |

Verified site integration: **0 of 315.** Localization counts are kept separate: 60 source-reference records verified locally (#145–204), 144 master records reported but not reverified, 0 independent editorial approvals, 0 site-integrated, out of 339 spells.
