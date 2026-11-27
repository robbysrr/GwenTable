# GwenTable v0.25.7-inventory-dev.3 · English SRD names in bilingual UI

**Review candidate, not a deployed release.** Keeps the integrated inventory and read-only export preflight from dev.2 and implements the approved localization rule: official SRD spells, items, classes and other named options retain their canonical English spelling in both English and Indonesian interface modes. UI explanations and controls remain bilingual. The source requires no saved-data migration. See `docs/LOCALIZATION_CANONICAL_NAMES_dev3.md` and `PROJECT_STATE.md`.

Run `npm test`, `npm run build`, and `npm run verify:source`. The full browser upgrade and data acceptance gate remain outstanding.

---

# GwenTable v0.25.7-inventory-dev.2 · local continuation

**Review candidate only.** Preserves the v0.25.7-inventory-dev.1 website integration and its 506 inherited tests. Adds a safe, local-only migration preflight for private JSON character exports. Does not include the authoritative repository identity or genuine saved characters. Public release remains **NO GO**.

Run `npm test`, `npm run build`, `npm run verify:source` and `node scripts/preflight-inventory-export.mjs /private/path/character.open5e-play` after extraction. See `docs/INVENTORY_EXPORT_PREFLIGHT.md` for privacy safeguards and the limitation of successful structural review.

---

# GwenTable v0.25.6 | Ranger/Hunter level 13–20 and combat integration (19 November 2026)

**Local development candidate, production NO GO.** Adds verified SRD 5.2.1 Ranger (Hunter) level 13–20 progression: prepared spells, 4th/5th-level slots, Favored Enemy casting, explicit level-16 feat/ASI and level-19 Epic Boon, Relentless Hunter concentration, Nature’s Veil Bonus Action resources, Superior Hunter’s Defense Reaction damage reduction, Precise Hunter Advantage against an explicitly marked creature, Feral Senses and Foe Slayer d10 Hunter’s Mark damage. Rules engine does not invent target state, enemy HP or DM-controlled durations. The language flag toggle, private backups, revision-protected Play, and source-only artwork restrictions remain intact.

Read `docs/v0.25.6-ranger-high-level.md`, `docs/LOCAL_QA_v0.25.6.md` and `docs/v0.25.6-codex-gate.md`. **498/498 automated tests pass** (476 baseline + 22 Ranger tests, including 800 seeded high-level Rangers); static build and art-withheld preview pass. Six classes now have level-20 paths; six remain capped at level 12. Real-browser/mobile/accessibility tests remain unverified, and original source carries 12 uncleared assets. **G1 REPAIR, public NO GO.** Codex or equivalent is necessary for end-to-end integration and publication acceptance, not for all pure local rules work.

---

# GwenTable v0.25.5 | Paladin/Oath of Devotion level 13–20 and class actions (19 November 2026)

**Local development candidate, PUBLIC NO GO.** Adds SRD 5.2.1 Paladin (Oath of Devotion) progression through level 20, correct 4th/5th-level slots and 1–20 prepared-spell counts, always-prepared Oath spells at levels 13 and 17, 16th-level feat/ASI, 19th-level Epic Boon, and 30-foot Aura Expansion at 18. Play Sheet adds level-14 Restoring Touch (5 Lay On Hands points per condition) and level-20 Holy Nimbus (Bonus Action, manual duration, once per Long Rest or level-5-slot recharge), while Divine Smite at level 15+ mentions the Oath of Devotion Smite of Protection half-cover effect. Target/enemy state and duration remain DM adjudication.

See `docs/v0.25.5-paladin-high-level.md`, `docs/LOCAL_QA_v0.25.5.md`, and `docs/v0.25.5-codex-gate.md`. **476/476 automated tests pass** (459 baseline + 17 focused new tests, including 800 seeded high-level Paladin builds); static build and separate artwork-withheld audit pass. Original local build still contains 12 inherited uncleared image/icon files, and real browser/mobile/screen-reader acceptance remains unverified. **G1 REPAIR, production NO GO.** Codex or an equivalent repo-backed browser-capable environment is needed for the next end-to-end integration and publication gate, but rules modules may still be developed locally.

---

# GwenTable v0.25.4 | Monk/Open Hand level 13–20 and Focus resources (19 November 2026)

**Local development candidate only.** Adds SRD 5.2.1 Monk (Warrior of the Open Hand) progression through level 20, with validated level-16 feat/ASI and level-19 Epic Boon, level-20 Body and Mind (+4 Dexterity and Wisdom, max 25), Disciplined Survivor saving throw proficiency, corrected high-level Unarmored Movement and d12 Martial Arts. Perfect Focus recovers Focus on Initiative and Disciplined Survivor spends Focus for a confirmed failed saving throw reroll. Quivering Palm now has a persistent one-target tracker and deterministic 10d12 resolution; enemy HP/saving throws and duration remain DM-controlled. Superior Defense is a rules reminder, not an automated resistance engine.

See `docs/v0.25.4-monk-high-level.md`, `docs/LOCAL_QA_v0.25.4.md`, and `docs/v0.25.4-codex-gate.md`. **459/459 automated tests pass** (442 baseline + 17 new), including 800 seeded high-level Monk builds. The normal build retains 12 inherited uncleared artworks; a separate artwork-withheld QA preview contains no image binaries. Real browser, mobile and screen-reader acceptance remains unverified. **G1 REPAIR / production NO GO**. Codex or an equivalent browser-capable repository environment is mandatory for a trustworthy integration/publication gate, but isolated Node-tested rules development can still continue here.

---

# GwenTable v0.25.3 | Barbarian/Berserker level 13–20 and class actions (19 November 2026)

**Local development candidate only.** Adds SRD 5.2.1 Barbarian (Path of the Berserker) levels **13–20** with level-16 feat/ASI choices, level-19 Epic Boon selection, level-20 Primal Champion (+4 Strength/Constitution, max 25, retroactive HP), correct Rage-use and damage scaling, high-level features and Play actions for Berserker Intimidating Presence and Persistent Rage Initiative recovery. Fifteen-minute or DM-judged timing, target saving throws and other combat effects are deliberately not auto-resolved. Fighter, Rogue, and Barbarian have builder access through level 20; the other nine classes remain capped at level 12.

See `docs/v0.25.3-barbarian-high-level.md`, `docs/LOCAL_QA_v0.25.3.md`, and `docs/v0.25.3-codex-gate.md`. **442 tests pass** (430 baseline + 12 new), static build and source manifest checks pass. Real-browser and mobile acceptance remains unverified; 12 inherited artwork files lack public distribution clearance. **G1 REPAIR / production NO GO.** For the next end-to-end integration and publication sprint, use Codex or a comparable repository-backed workspace with genuine browser access. Local pure-rules feature development is still technically possible here.

---

# GwenTable v0.25.2 | Rogue/Thief level 13–20 and Devious Strikes (19 November 2026)

**Local development candidate only.** This version extends the SRD 5.2.1 Rogue (Thief) builder to levels 13–20, with genuine feat/ASI and Epic Boon dependencies, Slippery Mind saving throw proficiencies, Sneak Attack scaling, Devious Strikes dice costs and two-effect selection, level-20 Stroke of Luck tracking, and high-level Thief reminders. It fixes Boon of Fate's Play resource availability for eligible non-Fighters. All other unsupported classes remain capped at level 12; Fighter already supports 20. The previous full Wild Shape combat update is retained.

See `docs/v0.25.2-rogue-high-level.md`, `docs/LOCAL_QA_v0.25.2.md`, and `docs/v0.25.2-codex-gate.md`. Automated tests are **430 passing** (baseline 414, 16 new). Browser/mobile acceptance is unverified; 12 source artworks remain without recorded public distribution approval. **G1 REPAIR / production NO GO**. For the next end-to-end integration and publication gate, transfer to Codex or another capable repository-backed environment with genuine browser access; more isolated rules modules may continue locally here.

---

# GwenTable v0.25.1 | Verified Wild Shape combat profiles (19 November 2026)

**Local development candidate, not cleared for public deployment.** This increment adds source-verified SRD 5.2.1 Beast attacks and movement for 11 curated Wild Shape forms. The Play Sheet now calculates Beast attack rolls, typed critical damage, and records outcomes in the existing revision-protected Play history. It also corrects a legacy mistake: Giant Owl is a Celestial in SRD 5.2.1, so it is not an eligible Beast form. Druid HP, enemy HP, conditional effects and DM decisions are not changed automatically. No character-save schema migration was required.

See `docs/v0.25.1-wild-shape-combat.md`, `docs/LOCAL_QA_v0.25.1.md` and `docs/v0.25.1-codex-gate.md`. This phase **does not** complete level 13–20 class progression. Browser/mobile acceptance remains unverified, and 12 inherited artworks remain uncleared. **G1 REPAIR / production NO GO.** The next complete integration sprint should be moved to Codex or a comparable repository-backed development environment before claiming release readiness.

---

# GwenTable v0.25.0 | Rogue combat and learned Weapon Mastery (19 November 2026)

**Local-only development candidate; not cleared for public deployment.** The Play Sheet now has SRD 5.2.1 Rogue Sneak Attack and level-5 Cunning Strike (Poison, Trip, Withdraw) with validated hit/weapon eligibility, dice costs, critical dice and per-turn usage; Rogue Uncanny Dodge Reaction-based damage reduction, temporary HP and Concentration handling; and conditional reminders for the Weapon Mastery properties actually selected in the saved character build. The original attack assistant, native language toggle, revision-checked Play/Undo, and private backup behavior remain in place. The character builder is still not complete through level 20 for non-Fighter classes.

The per-turn Sneak Attack marker resets at the start of your personal turn. Outside your turn, a separate explicit DM-confirmed new-creature-turn control resets that marker, because GwenTable does not know global initiative order. Outside tracked encounters, turn timing remains a DM judgment. Cunning Strike Poison requires the player's confirmation of a Poisoner's Kit on their person; Trip requires a Large-or-smaller target. External enemy saves, HP, status effects, Light-weapon extra attacks, Graze damage application, etc. stay with the DM. No new database migration or network backend. Read `docs/v0.25.0-gameplay.md` and `docs/LOCAL_QA_v0.25.0.md` for coverage and limitations.

**Gate G1 REPAIR / publication NO GO:** browser/mobile assistive-tech verification is not complete, and twelve original artwork files remain uncleared for public distribution. The separate artwork-withheld preview is not a license grant.

---

# GwenTable v0.24.9 | Attack resolution and Wild Shape reference (19 November 2026)

**Local development candidate, NOT approved for public deployment.** This increment replaces the Play Sheet's simple attack-total button with a table-assisted attack workflow: optional target Armor Class, both Advantage and Disadvantage choices (which cancel if both apply), automatic Heavy-property Disadvantage, natural-1 misses, natural-20 and Champion expanded critical hits, the SRD 5.2.1 Exhaustion penalty on attack rolls, and correctly doubled damage **dice** on critical hits. Static bonus and weapon damage are added once. Unknown target AC never becomes a guessed hit; the player can instead ask the DM to confirm one. Results go into the existing revision-protected Play history with one-step Undo and private backup support; no target HP or Action/Bonus Action/Reaction markers are changed automatically. Weapon Mastery, cover, other conditions and external target effects remain table decisions.

The Play Sheet's active Wild Shape form now displays a *read-only* source-linked Beast quick reference when it matches a recognized form in the existing SRD 5.2.1 creature index. It shows AC, HP, CR, and the SRD page and flags obvious level/flight-limit issues without silently substituting Beast stats for the Druid's saved HP. Unrecognized/DM-approved homebrew forms are not invented. This does not constitute complete Beast attack automation. Separately, the character derivation's Monk Martial Arts die now reaches d12 at level 17; full non-Fighter level 13–20 builder support remains unverified and unfinished.

Rules reference: [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf) (attack rules, Critical Hits, Wild Shape, Monk). The existing English/Indonesian flag toggle, offline cache separation, and character record format are preserved. **Sprint 02 Gate G1 REPAIR / publication NO GO:** browser/mobile/assistive-technology acceptance remains unverified; 12 original artwork assets still lack recorded public-use clearance.

Verify with `npm test`, `npm run build`, `npm run verify:source`, `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`. Serve the source via `npm run dev` (localhost:4173), and the preview via `npm run dev:artwork-withheld-preview` (localhost:4174). See `docs/LOCAL_QA_v0.24.9.md` and `docs/sprint02/day05-repair-v0.24.9/00-release-gate.md`.

---

# GwenTable v0.24.8 | Class-action gameplay: Divine Smite, Wild Resurgence and Deflect Attacks (19 November 2026)

**Local development candidate only; not cleared for public deployment.** New Paladin Divine Smite (confirmed melee/Unarmed Strike hit, once-per-Long-Rest free casting or spell slot, Radiant dice and Fiend/Undead modifier, Bonus Action tracking), Druid Wild Resurgence (slot-to-Wild-Shape on empty uses once per own tracked turn; Wild-Shape-to-level-1-slot once per Long Rest) and Monk Deflect Attacks (Reaction; d10+DEX+Monk level reduction, level 13 Deflect Energy, optional 1 Focus Point redirection with DM-resolved target saving throw). Damage after Deflect is recorded only once and feeds the existing Concentration tracker. These operations use the existing revision-protected Play save, Undo and JSON backup systems. No IndexedDB migration.

English/Indonesian controls and flag toggle preserved. Rules scope: official SRD 5.2.1 class features, with attack-hit confirmation and external target outcomes at the table. The UI makes explicit that outside-encounter Druid turn timing requires DM confirmation. High-level classes not yet supported by the character builder are not presented as complete. All code-level results have not been checked in a real browser. **Sprint 02 G1 REPAIR; public NO GO**, with 12 uncleared original artwork binaries in the local development build.

To verify: `npm test`, `npm run build`, `npm run verify:source`. Serve with `npm run dev` (`http://127.0.0.1:4173`). Build the separate art-withheld QA preview with `npm run build:artwork-withheld-preview` and audit with `npm run audit:artwork-withheld-preview`. See `docs/LOCAL_QA_v0.24.8.md`.

---

# GwenTable v0.24.7 | Advanced class-resource gameplay (19 November 2026)

**Local development candidate, not public approval.** The Play Sheet now supports Paladin Lay On Hands (self or other creature, including removal of Poisoned for five healing-pool points), Druid Wild Shape (persistent form name, resource use, Bonus Action handling, nonstacking temporary HP, and automatic reversion on incapacitation), and Monk Focus techniques (Flurry of Blows, Patient Defense, Step of the Wind, including level 10 Heightened Focus). The Monk Martial Arts die now correctly reaches d12 at level 17. Known Beast forms are suggested from the saved build, but eligibility, Beast statistics, duration, attacks and external creature HP stay with the DM.

These pure-engine operations use the existing revision-protected Play save/Undo and private JSON backup. Older Play backups without `shape` are accepted; explicitly invalid shape state is rejected. English/Bahasa Indonesia toggle is unchanged. Run `npm test`, `npm run build`, `npm run verify:source`, then `npm run dev` (http://127.0.0.1:4173). Artwork-withheld local QA preview remains separate. Browser/mobile/assistive-tech acceptance and rights for 12 inherited artwork files remain open. **Sprint 02 G1 REPAIR; public release NO GO.** Read `docs/LOCAL_QA_v0.24.7.md`.

---

# GwenTable v0.24.5 | Personal combat turn tracker (19 November 2026)

**Local gameplay candidate only.** The Play Sheet now includes a persistent personal encounter tracker with manual or rolled Initiative, Start/End Turn, and Action/Bonus Action/Reaction used/available buttons. The player’s turn count is **not the encounter-wide round number**. Reaction can be marked before the first player turn and between turns; it becomes available again at the start of the player's next turn. Actions and Bonus Actions may be marked during the player's turn. The tracker assists the player and does not enforce class features, movement or a DM's rulings.

All combat-tracker mutations use the existing `characters.update()` revision guard, one-step Play Undo, JSON backup and merge pathways. Older saves without `play.combat` are accepted with an inactive tracker; no IndexedDB schema migration is required. The English/Bahasa Indonesia flag language toggle is unchanged. Automated tests: **299/299 PASS**; static build and artwork-withheld local QA preview audit pass. Real browser, mobile, assistive technology, PDF downloads and multi-tab acceptance have **not** been verified here. The 12 original artwork files are still not cleared for publication. **Gate G1 REPAIR / public NO GO**.

Run `npm test`, `npm run build`, `npm run verify:source`, and `npm run dev` (http://127.0.0.1:4173). To build the separate art-withheld preview, run `npm run build:artwork-withheld-preview` and `npm run audit:artwork-withheld-preview`, then serve with `npm run dev:artwork-withheld-preview` (http://127.0.0.1:4174). See `docs/LOCAL_QA_v0.24.5.md`.

---

# GwenTable v0.24.4 | Critical Play: conditions & concentration (19 November 2026)

This local gameplay increment adds 14 toggleable **SRD 5.2.1 Conditions** in the Play Sheet. **Exhaustion** remains a separate numeric control, completing coverage of all 15 condition names. Each hit while Concentrating creates a distinct, pending Constitution saving throw with DC `min(30, max(10, floor(damage/2)))`. Damage to Temporary HP still prompts a save; a failed recorded save ends Concentration. Incapacitated, Paralyzed, Petrified, Stunned and Unconscious immediately end Concentration and prevent the character's action-like Play controls. The user/DM remains responsible for deciding condition duration, bonuses/advantage and save results. No spell effect, outcome or attack result is silently invented.

This increment preserves the existing language flag toggle and uses the same revision-protected `characters.update()` transaction and single-step Undo as other Play changes. Older saved Play records lacking the new fields are accepted without conversion or data deletion; new saves/exported backups contain `conditions` and `concentrationChecks`.

**Validation boundary:** Node automated tests and static build pass; real browser/mobile/assistive technology remain unverified, and the source's 12 inherited artwork files still lack publication approval. **Sprint 02 G1 REPAIR / public NO GO.** See `docs/LOCAL_QA_v0.24.4.md` and `docs/sprint02/day05-repair-v0.24.4/00-release-gate.md`.

---

# GwenTable v0.24.3 | Accessible flag language toggle (19 November 2026)

**Local development candidate only.** Changed the sidebar language preference from two independent flag buttons to one two-state toggle. Both CSS flags remain visible, and the gold thumb marks the selected English/Bahasa Indonesia language. The native `<button role="switch">` exposes `aria-checked` and localized current-language/next-action labels, supports Enter/Space, has a 44px touch target, and respects reduced motion. The existing `gwentable-language` storage key and `gwentable-languagechange` event remain intact. No character records, SRD mechanics, or persistence schema changed.

Run `npm test` (**268 passed**), `npm run build`, and `npm run dev` (http://127.0.0.1:4173). The separate artwork-withheld QA preview can be generated with `npm run build:artwork-withheld-preview`; audit it using `npm run audit:artwork-withheld-preview`. Its local server uses `npm run dev:artwork-withheld-preview` (http://127.0.0.1:4174). The normal local build still contains 12 uncleared assets and is **not approved for publication**.

See `docs/LOCAL_QA_v0.24.3.md` and `docs/sprint02/day05-repair-v0.24.3/00-release-gate.md`. Real browser focus, mobile touch, assistive-technology, IndexedDB, PDF and full release acceptance remain unverified. **G1 REPAIR / public NO GO.** No connected repository or production deployment was changed.

---

# GwenTable v0.24.2 | Prepared PDF late-delivery freshness guard (19 November 2026)

**Local development candidate, not a public release.** Continued from actual v0.24.1 source. Download/Open controls for generated PDFs now re-read the current saved-character revision at the user’s final delivery action. The dialog holds the PDF Blob URL privately instead of placing it in a persistent link. If the record has changed or the database cannot be read, the prepared URL is invalidated rather than delivered. Opening a PDF reserves only a blank tab before the async check and navigates it after approval; denied tabs close. This remains best-effort freshness rather than an atomic export lock.

Run `npm test` (**265/265 passed**), `npm run build`, `npm run dev` (http://127.0.0.1:4173). For the separate artwork-withheld QA preview, run `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`, then `npm run dev:artwork-withheld-preview` (http://127.0.0.1:4174). The normal public-art audit still blocks 12 inherited unapproved assets.

See `docs/LOCAL_QA_v0.24.2.md` and `docs/sprint02/day05-repair-v0.24.2/00-release-gate.md`. Real browser/device PDF delivery, download activation, accessibility, existing-character and SRD acceptance remain open. **G1 REPAIR / public NO GO.** No remote repository or production deployment was changed.

---

# GwenTable v0.24.1 | Saved GCX export freshness (19 November 2026)

**Local development candidate, not an approved public release.** Continued from actual v0.24.0 source. GCX Build/Live Snapshot exports now verify the saved-character revision before and after encoding and when a prepared download link is clicked. The active builder refuses to export unacknowledged edits, stale completion choices, or mismatched saved revisions. Foreign GCX-only characters remain private and exportable when their local revision is current. These read-only checks do not lock a character atomically across tabs or guarantee browser download behavior without a real-browser acceptance test. Existing SRD 5.2.1 calculations, guest storage schema, Play and Undo are unchanged.

Run `npm test` (255/255 passing), `npm run build`, then `npm run dev` (http://127.0.0.1:4173). For a static QA preview that withholds inherited artwork, use `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`, and `npm run dev:artwork-withheld-preview` (http://127.0.0.1:4174). The normal `npm run audit:public-art` remains **NO GO** for 12 local-only assets without recorded public-use approval.

See `docs/LOCAL_QA_v0.24.1.md` and `docs/sprint02/day05-repair-v0.24.1/00-release-gate.md`. G1 remains REPAIR: browser, mobile, PDF and screen-reader verification pending. No production deployment was performed.

---

# GwenTable v0.24.0 | Saved export freshness safeguards (19 November 2026)

**Local development candidate. Not a live or publication-approved release.** This update builds on the verified v0.23.9 archive. Saved-character PDF, browser printing and Play individual JSON export now recheck the latest IndexedDB character revision. PDF runs the check both before generating bytes and before displaying a download. Browser print and Play JSON exports also refuse obsolete saved snapshots. Freshness checks are read-only and fail closed if browser storage is unavailable. Choice review, existing SRD calculations, private extras and stored character schemas are unchanged.

Run `npm test` and `npm run build`; run locally with `npm run dev` (port 4173 or `PORT=4180 npm run dev`). Run the separate artwork-withheld preview with `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`, and `npm run dev:artwork-withheld-preview` (port 4174 or `PORT=4181`). The standard public-art audit intentionally blocks its 12 unapproved inherited files. **Never deploy the original local source or QA preview without the missing rights and release gates.**

Read `docs/LOCAL_QA_v0.24.0.md` and `docs/sprint02/day05-repair-v0.24.0/00-release-gate.md` for precise verification, blockers, and recovery instructions.

---

# GwenTable v0.23.9 | Artwork-withheld QA preview (19 November 2026)

A second, local-only static preview can now be built **without** the 12 external image/icon binaries that have no recorded public GwenTable publication approval. The default `dist/` development site and its existing art are unchanged. The isolated preview uses an accessible text lettermark and CSS decoration, omits the inherited Taverley theme files and offline-cache entries, and keeps the kit MIT notice. Its art-only scan passes because no image binaries ship, **not** because the site has been cleared for production. Existing SRD/gameplay mechanics, character data and storage schema are unchanged. This is **not a public release**.

`npm test`; `npm run build`; `npm run dev` for normal localhost:4173. For the artwork-withheld QA build: `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`, and `npm run dev:artwork-withheld-preview` for localhost:4174. The original `npm run audit:public-art` still rejects 12 unapproved development assets. The preview carries `PUBLICATION_NOT_APPROVED.txt`. See `docs/LOCAL_QA_v0.23.9.md` and `docs/sprint02/day05-repair-v0.23.9/00-release-gate.md`.

---

## Local development v0.23.8 (19 November 2026)

Sprint 02 G1 recovery repair: corrupt Saved Characters are isolated; a full backup is held if records would be omitted; readable-only partial backups and private non-importable per-record recovery copies are explicitly labeled. 232 source/Node tests pass; browser/mobile/PDF not verified. Artwork approval remains blocked for 12 inherited files. **Not a public release.** See `docs/sprint02/day05-repair-v0.23.8/00-release-gate.md`.

# GwenTable v0.23.7 | verified saved-character completion gate

This local-only candidate closes the gap between a mechanically plausible saved character and a character whose player actually confirmed the mandatory builder choices. A new, source-bound `completionApproval` receipt is stored with successfully saved characters. Saved Characters, direct Play routes, final PDF/print and GCX export no longer treat an old record or an imported backup as completed merely because the rules engine projected valid default values. Legacy characters, notes, Play/Undo and custom metadata remain intact and can be re-approved through **Review build**. Individual and roster backups deliberately omit local completion receipts.

**Evidence:** 225/225 automated tests and the static source build pass. The actual browser/device, PDF, screen-reader and 12 inherited artwork-rights approvals remain outstanding. **No production deployment.** See `docs/LOCAL_QA_v0.23.7.md` and `docs/sprint02/day05-repair-v0.23.7/00-release-gate.md`.

Run locally with Node 22+: `npm run dev` (default `http://127.0.0.1:4173`; select another PORT if occupied). Run `npm test`, `npm run build`, `npm run verify:source`, and `npm run audit:public-art` (expected publication NO GO).

---

# GwenTable v0.23.6 | non-destructive linked GCX updates

This local candidate fixes a data-preservation issue when updating an existing saved character from a linked GCX file. Previously, the update could replace the record and discard unrelated owner notes, custom extension fields, and the Play Undo checkpoint. `mergeLinkedGCXUpdate()` now merges inside the existing revision-checked IndexedDB write: a Build-only update reconciles both Play and Undo to the revised build; an explicitly applied Live Snapshot replaces Play and makes the previous Play state the one-step Undo checkpoint. Foreign GCX-only records retain unrelated private metadata. No SRD 5.2.1 rules, database migrations, network dependencies, or publication permissions were changed.

The GCX import preview now explains the Live Snapshot effect in English and Bahasa Indonesia. Eight new regression tests were added. **213/213 automated tests and the static build pass**, but this is not independent browser/mobile acceptance. The 12 inherited image/icon variants remain blocked from public distribution until explicit rights approval; no deployment was performed. See `docs/LOCAL_QA_v0.23.6.md` and `docs/sprint02/day05-repair-v0.23.6/00-release-gate.md`.

Run locally with Node 22+: `npm run dev` from this folder, then open `http://127.0.0.1:4173`. Run `npm test`, `npm run build`, and `npm run verify:source`. The public-artwork check `npm run audit:public-art` is expected to return NO GO.

---

# GwenTable v0.23.5 | lossless JSON-safe individual character backups

This isolated local update closes a v0.23.4 portability gap. Individual **Play character exports** now preserve compatible record extensions, linked GCX data and Undo checkpoints in a *private* file, not only the character build and current resources. Browser-local character IDs and revision metadata do **not** leave the device. Existing v0.23.4 file formats remain readable. Files over 512 KiB are rejected with guidance to use the 8 MiB private roster backup.

Start: `npm run dev`; run tests: `npm test`; static build check: `npm run build`; public artwork gate: `npm run audit:public-art` (expected NO GO until 12 assets are cleared). See `docs/LOCAL_QA_v0.23.5.md` and `docs/sprint02/day05-repair-v0.23.5/00-release-gate.md`.

**Not production ready.** No real browser, mobile, accessibility, or PDF acceptance was established in this run. No cloud deployment or private Avarra data integration. Assets are included for local continuity only and are NOT licensed for public distribution.

---

# GwenTable v0.23.4 | lossless saved-character editing and portable roster extensions

This local source update fixes a P1 data-preservation defect. Build Save formerly
replaced the entire saved-character record envelope, which could erase custom
metadata, future-version extension keys, owner notes and independent fields.
Build/Level-Up now merge the new draft into the most recent record inside the
existing IndexedDB atomic revision check. Play and Undo are reconciled separately
and remain recoverable. **Private roster backups** now include JSON-compatible
unknown top-level fields under a validated `extensions` payload, restoring them
when a roster is imported as new copies. Device-local character IDs, updatedAt,
and revision tokens are deliberately not exported. Non-JSON values, unsafe keys,
and excessively deep data are rejected rather than silently truncated.

Source integrity and **194 automated tests** pass; local HTTP smoke tests return
200. Real browser QA remains blocked by administrator policy, and 12 inherited
artworks lack documented public distribution permission. This is a local-only
candidate, **not a production deployment**. See `docs/LOCAL_QA_v0.23.4.md`.

# GwenTable v0.23.3 | truthful draft Save acknowledgment

This local source update fixes a stale queued-write success result and the misleading manual **Draft saved** message it could cause. A save only acknowledges the **current latest** draft snapshot, not any completed older snapshot. Related conflict buttons remain disabled when conflict is active. Five new automated tests cover delayed commits and English/Bahasa Indonesia copy. See `docs/LOCAL_QA_v0.23.3.md` for unverified real-browser checks. No new production permissions have been granted; the public artwork audit is still **NO GO**.

# v0.23.2 safe draft import and legacy roster resilience

This local increment hardens recovered draft JSON against prototype keys, pathological nesting and oversize exports, while preserving safe custom/unknown fields. Older roster entries without a usable `updatedAt` now render and export in a stable order instead of failing. A new offline-precache dependency is included, and backup failure is reported in English / Bahasa Indonesia. **176+ automated checks are not proof of browser acceptance.** No production assets, SRD rules engine or public approvals changed.

# v0.23.1 saved-character conflict protection

Active guest drafts retain the v0.23.0 atomic revision guard. Saved characters now also carry a per-record local revision checked atomically when saving Build edits, updating linked GCX imports or applying Play actions. A stale editor cannot silently replace newer character data. Local revision tokens never appear in draft/roster backups. This is **local-only** development, not a deployed release; browser/mobile and artwork-publication gates remain open.

# GwenTable — local development source

Version **0.23.7** · local continuation of the supplied v0.23.3 source (upstream source commit `89ad5dc2d11dbe30cf0b31029d07a45ce97e69a4`) · **unpublished local candidate, no production deployment**.

## Start locally

1. Install Node.js22 or newer (npm is included).
2. Extract this ZIP and open a terminal inside `GwenTable-v0.23.7`.
3. Run:

```sh
npm run dev
```

Open **http://127.0.0.1:4173**. Stop with Ctrl+C. No npm install, API key, account or database service is required. Do not open index.html directly: ES modules, storage and service workers require an HTTP origin.

To use another port:

```powershell
# Windows PowerShell
$env:PORT=4174
npm run dev
```

```sh
# macOS/Linux
PORT=4174 npm run dev
```

Alternative with Python3:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

On Windows, use `py -m http.server 4173 --bind 127.0.0.1 --directory dist`.

## Verify changes

```sh
npm run build
npm test
npm run verify:source
```

`build` validates the existing static tree, JavaScript syntax, asset references and pinned source registry; it is not a compilation step. The local candidate passes **177 automated tests**, including ten import-hardening and legacy-roster checks (v0.23.1 baseline: 167). These do not establish browser/mobile/accessibility or release readiness.

## Where to edit

| Path | Purpose |
| --- | --- |
| dist/index.html, dist/style.css | Main HTML and styles |
| dist/app.js | Builder routes, state and screen integration |
| dist/class-choice.js, dist/background-choice.js | Source adapters and change proposals |
| dist/spell-picker.js | Shared choice dialog |
| dist/builder-choice-review.js | v3 source-bound approval for Species, Class, Background, Languages, Class training, Feats, Ability Score boosts, starting equipment, Class spells and Magic Initiate; backwards-compatible v2 adapter |
| dist/beginner-help.js, dist/locale-copy.js | Beginner explanations and EN/ID copy |
| dist/lib | Rules engine, SRD records, storage, portability and Play |
| dist/design, design | Existing design tokens, fonts and icons |
| tests | Automated tests and synthetic fixtures |
| audit | Source coverage and asset provenance |
| docs/sprint02/day05-repair-v0.23.2, docs/LOCAL_QA_v0.23.2.md | Latest import hardening handoff and manual QA checklist |

Routes use hashes: `#create`, `#characters`, and the existing tools in navigation. Edit files in `dist` directly, then refresh. If assets appear stale, clear this localhost origin's service worker/site cache in browser developer tools; export your saved characters first. Keep using the same host and port to retain the same browser storage origin.

## Character data

Characters live in browser IndexedDB, not in this source ZIP. The online site's stored characters do not automatically appear on localhost. Export roster/character files or draft backups from the original browser and import locally through the appropriate UI. Unsupported source records remain recoverable rather than silently normalized. No production databases, browser records or credentials are included.

## Current limitations

The v0.22.9 baseline was an **unpublished development candidate**, not the older live site. Its release gate remains **REPAIR/NO GO**: native browser recovery/focus/PDF integration remains unverified. Fresh builds now require explicit review of projected Species, Class, Background, Languages, Class training, Feats, ability increases, both starting equipment sources, ordinary Class spells and Magic Initiate where relevant. The engine still projects legal defaults for calculations, but a separate versioned intent envelope distinguishes reviewed from pending choices. Canonical SRD fields are not yet truly nullable. Distinct choice icons remain incomplete. See `docs/sprint02/day05-repair-v0.22.9/00-release-gate.md` and `docs/LOCAL_QA_v0.22.9.md`. The available Chromium was tried again on 19 November 2026 and blocked navigation to both localhost and a standalone data page with ERR_BLOCKED_BY_ADMINISTRATOR. No browser success is claimed. Run `npm run audit:public-art` to see the separate artwork-only publication gate. It intentionally fails while publication approvals are missing for the 12 inherited static images/icons. The 8 existing generic icons have an MIT license file in the source tree, but no explicit GwenTable release approval has been recorded. The four branding files also remain pending rights review. The existing core rules are SRD5.2.1; PDF layouts do not switch gameplay editions. No original D&D Beyond blank templates are bundled.

## Export changes and licensing

All tracked source, tests, documentation and existing assets are included. The repository Git history and hosted project identity are omitted. The hosting config retains only the static directory, so this copy is not linked for deployment to the original Site. The prior v0.22.5 export supplied the dependency-free local server and local-only hosting identity. The v0.22.9 baseline extended v0.22.8 selection intent, localized confirmation UI, migration fixtures, tests, and a new fail-closed artwork-only publication audit; it does not change the canonical SRD engine or production services. The original README is preserved as `README-UPSTREAM.md`; its older version/step descriptions are historical, not current status. See `EXPORT_INFO.json` and `SOURCE_SHA256.json` for provenance/integrity.

Existing source/asset license files and NOTICE are retained. SRD material is CC BY4.0. The inherited source README records the original application code's public-release license as undecided; this export does not change it or invent a new license. Paid/private/unavailable art packs and missing source kits are not added.

## Portable typography

This distributable package intentionally omits font binaries. It uses system UI and Georgia fallbacks, so the text remains readable even if the original Lato/EB Garamond font files are unavailable. Font licenses and other asset attribution remain as originally supplied. This cosmetic difference does not affect game rules.

## v0.23.0: multi-tab draft revision guard

- `dist/lib/storage.js`: IndexedDB **readwrite transaction** compares the stored revision token and commits a new token only if the expected version still matches. Legacy active drafts without a token upgrade on a successful write; unrelated fields are preserved.
- `dist/app.js`, `dist/persist-state.js`: same-tab writes are serialized; after a cross-tab conflict, the writer halts instead of retrying blindly. Status never says Saved. A failed initial storage read blocks writes until the app reloads with a verified baseline.
- `dist/index.html`, `dist/locale-copy.js`: visible and bilingual conflict warning, one-click draft-backup action, and a separate explicitly confirmed reload control.
- `dist/draft-recovery.js`: revision tokens are excluded from active and nested backup data. Imported character-build approvals retain the existing review restrictions.
- `tests/day05-multi-tab-drafts.test.js`: dependency-free transactional simulation, simultaneous edits, queued writes, old save migration, backup isolation, and locale/UX wiring.
- This is intentionally limited to the **active guest draft**. Saved-character roster conflicts, genuine browser IndexedDB timing, accessibility, and private-asset rights remain independent blockers.

Validation: `npm test`, `npm run build`, `npm run verify:source`, and `npm run audit:public-art`. The last command must fail until publication approvals are documented. See `docs/sprint02/day05-repair-v0.23.0/00-release-gate.md`.


## v0.23.1: saved-character revision guard (Sprint 02 G1 repair)

- `dist/lib/storage.js`: a local `_characterRevision` UUID on every new/updated saved character. `characters.update()` can compare the caller's expected revision inside its readwrite transaction, and can require an existing record or an absent one. Legacy unversioned records remain readable; the first successful write upgrades them without altering unrelated fields. Direct `put` is now create-only to avoid silent overwrites.
- `dist/app.js`: remembers the saved character revision from the roster or active draft, rejects stale Build saves, and keeps a downloadable draft backup available if a conflict occurs. Level-up and linked GCX updates use the same protection. Draft recovery retains the local revision only inside local storage.
- `dist/play-sheet.js`: Play commands reject stale snapshots instead of quietly applying resource changes against an unexpectedly newer character; reopen from Saved Characters to resynchronize. No automatic resource spending is performed on conflict.
- `dist/draft-recovery.js`: local saved-character revision metadata is excluded from all portable draft backups and their recovery histories. Roster exports already include only permitted portable fields.
- `tests/day05-roster-revisions.test.js`: nine new tests exercise two-tab races, legacy upgrades, build-vs-Play conflicts, missing/deleted targets, failure rollback, import identity and backup isolation. The storage transactions are mocked. A real IndexedDB/Chromium acceptance test is still required.

**Release boundary:** Browser access from this environment still returns `ERR_BLOCKED_BY_ADMINISTRATOR`. The release audit identifies 12 inherited artwork files without explicit GwenTable publication approvals. Production remains **NO GO**. Mixed-version tabs running pre-v0.23.1 JavaScript can bypass the new saved-character protocol; close old local tabs before testing.


## v0.23.2: guarded draft recovery and legacy saved-character roster

- `dist/draft-recovery.js`: blocks dangerous object keys, overly deep/large recovery trees, and backups exceeding the importer's 8 MB limit. Preserves normal custom extensions and older recovery items. No rules engine migration.
- `dist/lib/roster-sort.js`, `dist/app.js`: missing/invalid legacy `updatedAt` values no longer crash Saved Characters or roster backup. Identical timestamps receive stable order. Backup generation errors now flow through the existing UI error handler.
- `dist/locale-copy.js`: natural EN/ID error text for rejected backups.
- `dist/sw.js`: bumps local cache revision and precaches the new script for offline reopening when previously installed.
- `tests/day05-backup-import-hardening.test.js`: security/compatibility UI wiring and source tests. Browser/mobile/native IndexedDB and PDF checks still unverified.

