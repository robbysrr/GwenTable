# LATEST PROJECT_STATE — Integration 12 | 27 November 2026

**BASELINE:** Integration 11 (811/811 Node, 12/12 browser).

**COMPLETED:** Settings menu (theme, palette, layout) behind a gear button in the top-right corner; fillable GwenTable Character Sheet v0.3 PDF generated from the character (Quick Reference, Compact, Complete; A4/Letter; approved kit templates); compendium opens each subject on its own SRD 5.2.1 text instead of whole pages; builder start options open for new players and Next confirms-and-continues when only a confirmation is pending; removed full-page focus frame. Details: `docs/INTEGRATION12_SETTINGS_SHEET_COMPENDIUM_UX.md`.

**VERIFIED:** 821/821 Node tests (10 new), static build, artwork-withheld build and art audit; browser 16/16 (all earlier UAT plus Settings at 320/390/1280 px, v0.3 PDF downloaded and its fields read back, compendium text and full-page toggle, Next-only builder flow). Compendium text 99.3% verbatim against the official SRD.

**OUTSTANDING:** Sheet fields not mapped: player, campaign, pronouns, appearance, resistances, item weights, non-GP coins, Heroic Inspiration. Compendium: Classes and chapter topics still page view; 1 spell, 1 magic item, 2 subclasses unmatched. Real-device, screen-reader, zoom and Windows launcher checks still open. PUBLIC NO GO.

**NEXT:** Owner UAT on phone via GitHub Pages; then remaining UAT scenarios and donor reconciliation.

**ENVIRONMENT:** Claude Code cloud, headless Chromium. No deployment beyond the owner-approved UAT Pages copy.

---

# LATEST PROJECT_STATE — Integration 11 | 27 November 2026

**BASELINE:** Integration 10 handover (bundle 515/515 files verified), source SHA-256 `059f095f…bfe95b`; fresh 400/400 manifest, 796/796 Node tests, static build, artwork-withheld build and 0-variant art audit, Node 22.23.5. Local Git snapshot `integration10-baseline` (no remote).

**COMPLETED:** First real-browser acceptance (headless Chromium) with a repeatable suite, `browser-acceptance/uat.e2e.mjs`. Fixed two builder defects it found: Magic Initiate backgrounds could not finish the build (required confirm button never rendered), and generated/template Standard Array scores were stored but shown blank. Bless (+1d4, p.113) and Bane (−1d4, p.112) join the incoming-effect ledger. One shared resolver asks for the physical d4 on the quick save preview, the pending Concentration save and pending condition saves. Same-spell overlap (p.106), Bless+Bane both apply, ability checks excluded, malformed dice rejected. EN/ID panel, rest expiry, export round-trip, offline revision `integration11`. See `docs/INTEGRATION11_BLESS_BANE_AND_UAT.md`.

**VERIFIED:** 811/811 Node tests (15 new; 5 existing pins updated for the new cache revision and check-panel call, no mechanics weakened). Static build, artwork-withheld build, art audit 0 variants. Browser 12/12: Fighter/Wizard 5 build-save-reload, template scores, damage/Undo/reload, two-tab stale write refused with no lost update, offline reload, play backup export, tampered import refused, malicious name rendered as text, EN/ID, no overflow at 360/390/768/1280 px, Bless/Bane panel and save d4. Results per scenario: `docs/INTEGRATION11_UAT_RESULTS.md`. Traceability: `audit/integration11-traceability.json`.

**OUTSTANDING:** Browser scenarios UAT-03 to UAT-10 and UAT-16 not run; no headed Windows Chrome/Edge, real mobile, keyboard/focus, zoom or screen-reader checks. Bless/Bane on attack rolls is a reminder (no attack resolver exists); death-save buttons do not take the d4; caster Concentration and duration table-managed. Donor reconciliation (UX9, Dev15, MVP16, Dev22, Wizard Dev19, Hazards v3) not started. PDF live-state parity, equipment AC, broader casting sources open. PUBLIC NO GO.

**NEXT:** Run UAT-03 to UAT-10 and UAT-16 in the browser suite; then donor reconciliation map (class/spell coverage gaps against MVP16 and Wizard Dev19) and equipment AC.

**ENVIRONMENT:** Claude Code cloud container (Linux, headless Chromium). STAY for bounded slices; Windows launcher and real-device acceptance need the owner's machine. No deployment.

---

# LATEST PROJECT_STATE — Integration 10 | 27 November 2026

**BASELINE:** Integration 09 ZIP SHA-256 `5613ce0d9ad9ac3968961a53e352f811e1fa89cb770b99bd96be37816e31b3f2`; fresh 395/395 manifest and 781/781 Node tests. Private candidate, not authoritative consolidated website.

**COMPLETED:** Source-linked incoming Shield of Faith (+2 AC, SRD p.162), fixed profile/unique local sources/non-stacking, shared live AC with legacy Shield (+5), Shield hit preview uses combined live AC, source removal and rest cleanup, EN/ID, existing revision/Undo and JSON/roster/GCX. No real player data changes or database migration.

**VERIFIED:** 15 new tests, 796/796 full suite, static build, artwork-withheld preview and zero-variant art audit, HTTP 10/10. Node 22.16.0. Browser not repeated: historical timeouts, actual UAT remains open.

**OUTSTANDING:** Incoming Shield of Faith only, caster labels not authenticated; manual concentration and duration outside rest. No self-cast, cross-character effects, generic D20 modifiers, transformed or inventory-derived AC reconciliation, PDF live-state parity or complete source consolidation. 24-source cap; downgrade unsupported. Browser/mobile/cross-tab acceptance outstanding. PUBLIC NO GO.

**NEXT:** Switch to supported browser for acceptance and broader source reconciliation; shared Bless/Bane D20 dice modifier slice after that, including effect lifetime and confirmed roll input.

**ENVIRONMENT:** PREPARE SWITCH to Claude Code or local browser; bounded code work in Chat remains possible, but avoid more unverified UI expansion. No public deployment.

---

# LATEST PROJECT_STATE — Integration 09 | 27 November 2026

**BASELINE:** Integration 08 ZIP SHA-256 `877165c9aac95ebd5c063af7b3e1dafad70739e4b222ace79009dd82e152c59f`; fresh 390/390 manifest, 767/767 Node tests. Private candidate, not definitive branch consolidation.

**COMPLETED:** Prepared single-class Wizard/Sorcerer Shield using available ordinary spell slot and Reaction during tracked combat (SRD 5.2.1 p.161); optional saved shieldEffect, +5 live health-panel AC, source breakdown, optional triggering-hit comparison with automatic hit exception, Magic Missile reminder, expiry at start of next own turn, explicit early end, EN/ID, existing Undo and JSON/roster/GCX. No actual player data modified; no DB migration.

**VERIFIED:** 14 focused tests; first full run 778/781 passed, three obsolete exact cache revision assertions corrected (no mechanic assertions weakened); final 781/781 passed; static build, artwork-withheld preview, asset audit zero variants, HTTP 10/10. Node 22.16.0. Browser not rerun due to historical timeouts; real browser acceptance not verified.

**OUTSTANDING:** Only class-prepared ordinary slot cast supported; other casting grants and one-slot-per-turn, V/S, actual AC and trigger legality require DM confirmation. Magic Missile protection is a reminder only, no automated incoming damage changes. Live health-panel AC only, base sheet/PDF unchanged. General modifier ledger, cross-character combat, source consolidation and browser/mobile/cross-tab acceptance remain open. Marker/closure guards are engineering safeguards; downgrade unsupported.

**NEXT:** Reconcile shared temporary modifier and incoming damage event architecture, prioritize real browser acceptance before expanding spell profiles.

**ENVIRONMENT:** STAY for bounded source work; SWITCH to Claude Code or supported local browser for broader reconciliation and genuine acceptance. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 08 | 27 November 2026

**BASELINE:** Integration 07 ZIP SHA-256 `0700ffeda6a0e2a25561e411033e8d1d5b7ed3039a634c02a7aa4fdf18ce7a0e`; 385/385 integrity and 751/751 fresh Node tests passed. Convergence 08-derived private candidate, not definitive consolidated website.

**COMPLETED:** SRD Dodge (p. 181) personal combat Action, optional saved `dodge` record with turn and source flags, start-next-own-turn expiry, automatic Advantage in shared Dexterity save preview/resolver, early loss for recorded Incapacitation/HP 0/Speed 0 (Grappled, Restrained, Steady Aim, derived Speed minus Exhaustion). Empowered Monk Patient Defense (pp. 50–51, heightened p. 52) reuses mechanism without consuming Action; preserves existing temporary HP and Focus logic. EN/ID UI, existing revision transaction, Undo, JSON/roster/GCX. No migration or real player data changes.

**VERIFIED:** 16 focused tests; 767/767 full suite, static build, artwork-withheld preview, asset audit zero variants, 10/10 HTTP. No fresh Chromium execution (prior environment blocked); real browser acceptance remains unverified. See QA receipt.

**OUTSTANDING:** Dodge incoming attack disadvantage is a visibility-dependent reminder only. External Speed changes and timing need table confirmation. No transformed-character support; leaving automatic support clears Dodge and requires table management. Tracking is restricted to personal encounter; free Patient Defense is Disengage only; other movement effects remain manual. Encounter closure and marker correction guards are engineering safeguards, not SRD restrictions. Explicit Dodge at known Speed 0 uses table adjudication rather than recording an effect. Older builds reject active Dodge records. Broader source consolidation, complete SRD coverage, actual browser/mobile/cross-tab acceptance and release gates open.

**NEXT:** Integrate Shield with verified Reaction and eligible casting resource plus source-based temporary AC modifier and expiry at start of next own turn; reconcile spell eligibility and damage timing before applying mechanics. Browser UAT in supported environment.

**ENVIRONMENT:** STAY for bounded source work; SWITCH to Claude Code/local browser for genuine acceptance and larger reconciliation. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 07 | 27 November 2026

**BASELINE:** Exact Integration 06 ZIP SHA-256 `d832adbebb6a641c81a2ba193807b5c35840700e4a45afda13cc107e0ecd589e`; fresh 381/381 integrity and 737/737 Node tests passed. Convergence 08-derived candidate, not full authoritative branch consolidation.

**COMPLETED:** Ranger Nature’s Veil (SRD 5.2.1 p. 59) now integrates existing Bonus Action and resource with an independent Invisible source during a tracked own turn. Optional `expiresOwnTurn` validated against the combat tracker, end-next-own-turn expiry, overlapping source preservation, EN/ID source display, encounter closure guard, existing Undo and portability. Outside combat remains DM-managed. No schema migration or real player data touched. No full Invisible combat automation.

**VERIFIED:** Node 22.16.0; 14 focused tests, 751/751 full regression; static build; artwork-withheld preview (12 binaries withheld); asset audit (0 variants); HTTP 10/10. Historical Chromium timeout repeated in prior sprints; no new browser execution this sprint. Real browser/mobile/cross-tab acceptance not verified. See QA receipt and docs/INTEGRATION07_TURN_BOUNDARY.md.

**OUTSTANDING:** Only Nature’s Veil end-of-next-own-turn profile, no Shield/Dodge or global turn ownership; visibility and situational attack modifiers remain table-confirmed. Living encounter closure blocked while tracked boundary effects remain (engineering safeguard); dead closure retains source under DM control, not presumed expiry. No supported downgrade of new timed saves. Source/attempt caps, revision guard, broader branch consolidation, complete SRD and release gates remain open.

**NEXT:** Implement source-verified Dodge and start-of-own-turn expiration, including early loss conditions, then other boundary types and caster-linked effects. Real browser UAT in supported environment.

**ENVIRONMENT:** STAY for bounded deterministic source changes; SWITCH to Claude Code/local browser for actual acceptance and wider consolidation. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 06 | 27 November 2026

**BASELINE:** Exact Integration 05 source ZIP SHA-256 `9f621ae99d6cf3681b7fe4d936ecdae8d6bfc9f06b606499eae674a08b5d8703`; fresh 377/377 manifest and 724/724 Node tests passed. Convergence 08-derived private candidate; broader authoritative consolidation remains open.

**COMPLETED:** Optional 1–60 remaining game seconds on registered Hold Person/Hold Monster sources only; explicit DM-confirmed elapsed-time batch with countdown snapshot and existing revision CAS; atomic decrement/expiry and cancellation of obsolete pending saves, preserving other/manual sources. Block if any pending condition save survives the interval. Own-turn save triggers unchanged; elapsed time never inferred from own turns or real-world time. EN/ID forms, existing Play Sheet/Undo, export and offline cache revision. No DB schema migration or actual player data touched.

**VERIFIED:** Node 22.16.0; 13 new focused tests, 737/737 full suite, static build, artwork-withheld preview (12 binaries withheld), artwork-only audit (0 variants), HTTP smoke 10/10. Initial focused test syntax typo corrected; final tests passed. Chromium timed out exit 124 with zero DOM bytes. Real browser/mobile/two-tab acceptance not verified. See QA receipt and docs/INTEGRATION06_EFFECT_DURATION.md.

**OUTSTANDING:** Bounded opt-in countdown, not a global clock or exact start/end-of-turn expiry; player must confirm ordering and elapsed time. Prior due saves must be adjudicated, only obsolete prompts may be canceled. No automatic duration advancement during rest/travel/turns, cross-character Concentration, other spells, generic timers, or global event receipts. Existing 24-source and 9,999-attempt caps remain. Undo can restore old snapshots, host CAS essential. Older builds reject timed records, no supported downgrade. No public deployment. Broader source consolidation and full SRD completeness remain open.

**NEXT:** Source-verified own-turn-boundary expiration and consolidated timing/event identity, then broader spell profiles and caster linkage; use supported browser for genuine acceptance.

**ENVIRONMENT:** STAY Chat/local for bounded deterministic work; SWITCH to Claude Code or supported Windows/browser environment for genuine UAT and wider consolidation. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 05 | 27 November 2026

**BASELINE:** Exact Integration 04 archive SHA-256 `2416a68283e41a969bc7fe7dd50ee31da8635811b1412d8b08c62681f65ac5b1`; fresh 373/373 manifest and 710/710 Node tests passed. Convergence 08-derived private candidate; wider consolidation remains outstanding.

**COMPLETED:** Explicit SRD Hold Person/Hold Monster profile registration after DM-confirmed initial failed save, target and DC. Fixed Paralyzed and Wisdom save; `turnTarget: 'own-end'` is opt-in on valid save-ended ledger records only. Actual personal combat End my turn transition atomically queues each registered source, with attempt counters and existing revision-checked Play Sheet transaction/Undo. Start turn never queues; next own turn is blocked until pending automatic saves resolve or ended sources are confirmed removed. Manual same-name sources never auto-promote; manual fallback available outside the encounter tracker. Success removes only the selected source, failure retains it. Combat end cannot skip an active own turn with these effects while alive. Bilingual forms and reminder, cache revision, JSON/roster/GCX snapshot parity. No DB version change or live player records touched.

**VERIFIED:** Node 22.16.0; 14 focused tests and 724/724 full suite; static build, artwork-withheld preview (12 binaries withheld), artwork-only audit (0 variants), HTTP smoke 10/10. Chromium timed out exit 124; zero DOM bytes. See QA receipt and logs. Real browser/mobile/two-tab acceptance not verified.

**OUTSTANDING:** This is a reminder for two explicitly registered spells, not a complete spell-effect engine. Player still records each own-turn boundary; no global encounter ID, cross-character caster link, automatic 1-minute duration/expiry, initial spell save/cast automation, or event-wide receipts. DM must confirm removal when duration or Concentration ends. During an active tracker manual queue for automatic profiles is disabled; correct missed timing using existing Undo where possible, or DM-adjudicated workflow outside tracker (no global deduplication of manually confirmed events). Undo restores prior attempt counter; host revision CAS essential. Existing 24-source/9,999-attempt limits remain. Pending automatic saves are blocking before next own turn, a proposed safety design rather than an SRD requirement. No downgrade to older builds for automatic-profile saves. Full release NO GO.

**NEXT:** Add explicit confirmed game-time/turn expiry model and source-specific cancellation/correction before broader automatic spell triggers. Investigate real browser acceptance through Claude Code on Windows or another supported browser environment; do not count source/static tests as browser UAT. Reconcile existing branches without discarding active multiclass work.

**ENVIRONMENT:** STAY local for bounded deterministic integration; SWITCH to Claude Code/local supported browser for genuine UAT and larger source merge. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 04 | 27 November 2026

**BASELINE:** Exact Integration 03 source ZIP SHA-256 `c53d10eae29036aea2459bec9be3d03cdf34eb037e5169e6510dacb3ea25c8c8`; manifest 369/369 and fresh 693/693 tests passed. Private Convergence 08-derived candidate; authoritative branch consolidation remains open.

**COMPLETED:** Existing Play Sheet condition ledger now supports table-confirmed save-ended effects (stored ability and DC), separately confirmed due triggers, persistent pending attempts, calculated physical dice outcomes using the existing derived D20 resolver, and source-specific success removal or failure retention. Attempt counters prevent forward-state duplicate resolutions. Recorded automatic STR/DEX save failures support blank dice. Independent manual and tracked conditions, current resource states, and existing Concentration lifecycle are preserved. Existing revision-checked character transaction and Undo path reused. JSON, roster backups and GCX live snapshots tested. EN/ID UI and offline cache revision updated. No database version change or player data touched.

**VERIFIED:** Node 22.16.0, 17 new focused tests and 710/710 full tests. Static build, artwork-withheld preview (12 inherited images withheld), artwork-only audit (0 variants), HTTP 10/10. Initial revision assertion and a rest fixture using an Incapacitated character were corrected; final tests passed. Chromium timed out (124), zero DOM bytes. Real browser persistence/interaction not verified.

**OUTSTANDING:** Manual confirmation required for timing, source eligibility and situational modifiers. Only success-ends-one-source effects supported; no automatic turn triggers, expiry, partial/multi-effect outcomes, repeat-save DC changes, transformed-character calculation, universal effect ledger, global receipts or cross-character Concentration. The same existing 24-source/9,999-ID limits apply; maximum 9,999 attempts per source. Undo can restore earlier attempt numbers; host revision CAS remains essential. Older builds reject new save-ended records; upgrade compatibility tested, downgrade not supported. No automatic linkage from names to spell rules. Actual browser/mobile/two-tab IndexedDB and full source reconciliation remain open. Artwork and public release gates unchanged.

**NEXT:** Integrate a source-verified own-turn boundary workflow for specific effects, e.g. Hold Person/Hold Monster end-of-own-turn saves, preserving manual adjudication and explicit event identity. First reconcile clock/turn semantics and pending-save expiry/Undo, do not guess trigger timing.

**ENVIRONMENT:** STAY local for bounded deterministic integration; PREPARE Claude Code for actual browser UAT and broader consolidation. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 03 | 27 November 2026

**BASELINE:** Exact Integration 02 archive SHA-256 `716fae3954df90e3799478806cd5069959f0175708c1d8049c72effa53a0adb1`; fresh 363-file integrity check and 674/674 inherited Node 22.16.0 tests. Convergence 08-derived private candidate, not canonical consolidation. Donor Dev.15 `srd-condition-lifecycle.mjs` inspected locally; ported its source ledger with reserved timing fields deliberately restricted to manual-only.

**COMPLETED:** Real Play Sheet supports DM-confirmed condition source application and exact-ID removal; optional backward-compatible `manualConditions`, `conditionEffects`, `nextConditionId` added only when source tracking begins. Existing `conditions` becomes the derived unique effective set. Manual toggle remains independent; duplicates by condition do not stack. Incapacitating sources end Concentration and block existing action paths. Lay On Hands and Restoring Touch remove a single unambiguous recorded application, spending existing points atomically; multiple source applications of a selected condition reject before resource expenditure until source-specific adjudication is supported. EN/ID controls, existing revision-checked `characters.update` and Undo path, JSON/roster/GCX native live snapshot parity, explicit offline precache. Legacy saves remain unchanged before first tracked application. No IndexedDB schema migration, production changes or actual player data used.

**VERIFIED:** 19 focused tests + 674 inherited = 693/693 full Node tests, static build, artwork-withheld preview and audit (12 inherited unapproved binaries withheld, 0 variants), HTTP smoke 10/10. Initial inherited cache-revision assertion failed after planned revision bump and was updated; final suite passes. Chromium exit 124, zero DOM bytes; real browser interaction, IndexedDB two-tab behavior and mobile acceptance not verified. See QA receipt.

**OUTSTANDING:** Manual only: no automatic turn/world-time expiry, condition-specific repeated saves, cross-character links, immunities or universal effect ledger. Source labels are descriptive and IDs local to one character/ledger history; not global event receipts, and Undo can restore an earlier counter. No automated ability removal from ambiguous multi-source conditions; DM adjudication required. Product limit 24 simultaneous tracked sources and 9,999 allocated IDs before fail-closed exhaustion; no counter reset/recycling in forward state. Native PDF condition-source detail not implemented. No automatic linking of names to spell rules. Canonical source merge and full SRD coverage remain outstanding.

**NEXT:** Add explicit source-specific save-ended effects with validated DC/ability and confirmed trigger, resolve a single source through shared D20 checks, reject stale/duplicate outcomes with revision guard, and retain manual/other sources. Reconcile timing/ability-removal exceptions before automating turn expiry or cross-character Concentration.

**ENVIRONMENT:** STAY Chat/local for bounded integration. PREPARE Claude Code for broader reconciliation and actual browser UAT. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 02 | 27 November 2026

**BASELINE:** Exact Integration 01 archive SHA-256 `5e434d9277ffdb89b143722f3bbbd30911b0c595966883a18eb8d3b1e981aa01`; 359/359 manifested files and 661/661 inherited Node 22 tests verified before changes. Convergence 08-derived private candidate, not a verified canonical repository.

**COMPLETED:** Existing persisted Concentration damage/save FIFO now accepts physical-dice calculated saves through the actual Play Sheet, using current derived Constitution save modifier, confirmed situational modifiers, Advantage/Disadvantage, recorded Exhaustion and the stored DC. The reducer recalculates within the existing revision-checked saved-character transaction, preserves one-step Undo, and applies one successful queue removal or failure-driven Concentration termination. Snapshot matches focus, damage, DC and queue length. Legacy manual outcomes and existing schemas preserved. EN/ID UI and new offline cache revision. No player data touched.

**VERIFIED:** 13 focused + 661 inherited = 674/674 Node tests; static build, artwork-withheld preview (12 inherited binaries withheld), artwork-only audit (0 variants), HTTP 10/10. Chromium timeout exit 124 with zero DOM bytes; actual browser interactions, IndexedDB two-tab transactions, Windows Node26 and mobile UAT remain unverified. See QA_RECEIPT_INTEGRATION02.json.

**OUTSTANDING:** Universal effect/save engine, individual source and event identities, automatic condition duration/removal and cross-character Concentration links remain unimplemented in this candidate. Existing FIFO snapshot is not a globally unique event receipt; host revision CAS protects concurrent changes. Existing manual outcomes still available. Full branch consolidation, all-class/spell coverage, real persistence and publication gates remain open.

**NEXT:** Integrate donor Dev.15 condition ledger in a small backwards-compatible slice: manual vs source-owned conditions, independent removal, validation, existing feature removal semantics (Lay on Hands/Restoring Touch), explicit confirmed source expiry, export round-trip and regression. Do not silently migrate saves or blindly replace play.js. Add repeated saves only after source identity/lifecycle is established.

**ENVIRONMENT:** STAY Chat/local for bounded verified slices. PREPARE broader Claude Code merge and real browser UAT. PUBLIC NO GO.

---

# LATEST PROJECT_STATE — Integration 01 | 27 November 2026

**COMPLETED:** Recovered and physically inspected four source branches. Selected Convergence 08 as private merge candidate. Ported the read-only D20 skill/save preview into actual Play Sheet using existing derived character and gameplay state, not a fixture. EN/ID copy and offline cache entries included. No production changes or schema migrations.

**VERIFIED:** Four independent baseline suites (651, 709, 191, 796 passed respectively), integrity checks 4/4, static builds 3/3 where provided. Candidate 661/661 tests (651 inherited + 10 new), static build, artwork-withheld build/audit and HTTP 10/10 pass. Browser timed out without DOM; no real browser, actual player saves or Windows Node26 certification. See QA_RECEIPT_INTEGRATION01.json and docs/INTEGRATION01.md.

**OUTSTANDING:** Canonical checkout not identified; full UX9/MVP16/Console/Dev22/Hazards integration, unified engine, full SRD content, active save workflow, browser/persistence and release gates remain open. Preview is read-only and has bounded condition support; other effects require confirmation.

**NEXT:** Compare character/profile and persistence contracts across the candidate branches and integrate one source-linked condition/save lifecycle slice under existing revision-checked state changes.

**ENVIRONMENT:** STAY Chat/local for bounded tested merges; PREPARE Claude Code for broad branch reconciliation and browser verification. PUBLIC NO GO.

---

# LATEST PROJECT_STATE: GwenTable Convergence 08 (23 Nov 2026)

**Verified baseline:** Exact SHA-256 matched Convergence 07 source (`eba0fb91d752640dd80ee20e322148b54e3b7fcb46a8cc3c013cd4cbd288e304`); 637 tests and static build pass before modifications. This is dev.6-derived, not canonical UX9/dev.14.

**Changes:** Fighter 1 / Rogue 3 (Thief) validated active progression (total 4), source-only subclass gates, 2d6 Sneak Attack, recorded Steady Aim pending advantage and turn-bound speed lock, confirmed Fast Hands bonus-action options, Climb Speed/Dexterity jumping, HP and independent d8 pools, export/PDF support, EN/ID Play controls, offline preload. No new object store or schema migration; additive strictly validated composite schema.

**Verification:** Full regression, source manifest, clean extraction, browser/public asset checks and patch replay recorded in QA_RECEIPT_CONVERGENCE08.json. Actual Windows Node26 / true two-tab browser and authentic user migration not certified.

**Outstanding:** General multiclass, SRD beyond current bounded classes, caster/target integration, real IndexedDB/browser acceptance, UX9/dev.14 canonical merge, artwork licensing/privacy/security/accessibility. No public release.

**NEXT:** Expand only source-backed, fully integrated class levels while preserving these existing verified saved characters. **ENVIRONMENT: STAY Chat/local; user declines Codex.**

---

# LATEST — Player Convergence 07 (23 November 2026)

**BASELINE:** SHA-verified Convergence 06 ZIP `e73ce069cf1727f23846c7e252e847997c4e62324207a6673e27f3a41b1ef28f`, 620 inherited tests. Recovered dev.6-derived workspace, not the authoritative UX9/dev.14 branch.

**COMPLETED:** Functional and revision-checked Fighter 1 / Rogue 2 advancement; exact source-bound fixed/rolled d8 HP and 900 XP or explicitly approved GM milestone; second Rogue d8 and unchanged Fighter d10 pool; Cunning Action Dash/Disengage/Hide Bonus Action with combat resource tracking; 2024 PDF, GCX and private JSON class-level portability; EN/ID UI and corrected roster label, Hit Die selection, offline revision.

**VERIFIED:** 637/637 Node tests, local static build, artwork-withheld preview/audit and synthetic PDF. See `CHANGELOG_PLAYER_CONVERGENCE_07.md` and `QA_RECEIPT_CONVERGENCE07.json` for details and clean-archive receipt.

**OUTSTANDING:** All other multiclass class pairs, Rogue3+ and remaining feature progressions, full SRD automation, UX9/dev.14 merge, real browser two-tab IndexedDB, Node26 Windows, authentic save migrations and publication rights.

**NEXT:** Complete another bounded class-level vertical slice, then reconcile with confirmed authoritative source when accessible. **ENVIRONMENT: STAY Chat/local.** **RELEASE: NO GO.**

---

# LATEST — Player Convergence 06 (22 November 2026)

**BASELINE:** Exact Convergence 05 ZIP (`b6b641e34d55d4b51739065f675771bcea23ef1f5ba65eacd0d8c111fe333baa`), 608 inherited tests. Dev.6-derived source, not a canonical UX9/dev.14 merge.

**COMPLETED:** Supported active Fighter1/Rogue1 native fillable PDF exports with two class levels and separate Hit Dice; build/live GCX exports and import with namespaced `gwentable/multiclass` metadata and SHA256 integrity; fail-closed unsupported/foreign/corrupt composite import; saved roster correctly shows level 2 and locks Builder; next XP label uses total level and unsupported advancement is hidden; English/Bahasa Indonesia guidance; offline cache revision.

**VERIFIED:** New deterministic PDF/GCX/security/UI/export regression suite, full source tests, static build, artwork-withheld preview, PDF rendering and clean ZIP/patch replay as documented in the QA receipt. Real browser IndexedDB cross-tab and Windows Node26 remain unverified.

**OUTSTANDING:** All other class pairs, levels 3–20 mixed progression, class/subclass feats/spells and resources, the UX9/dev.14 canonical merge, full SRD coverage, real-save migrations, actual browser UAT, accessibility, code/artwork release rights. **NOT all user-requested features complete.**

**NEXT:** Progress mixed-class class-level engine beyond Fighter1/Rogue1, then complete canonical integration after obtaining verified source. **ENVIRONMENT: STAY Chat/local**, per owner. **PUBLIC RELEASE: NO GO.**

---

# CURRENT LOCAL DEVELOPMENT — Player Convergence 05 (22 November 2026)

**Verified baseline:** Exact SHA-matched Convergence 04 source ZIP (`8e1d40e074c6c3b807cd08c63daa050c206fb6b27967e521bcc315f8c73c395d`), 594 inherited tests. Branch is dev.6-derived, NOT integrated with separate UX9/dev.14 canonical source.

**COMPLETED:** First *active* supported composite class Fighter level 1 + Rogue level 1. Validated original multiclass planning/checkpoint/Rogue entry choice records, explicit consent, same-row revision-checked update, max/current HP and XP progression, source-based Rogue1 skill/Expertise/tool/language/masteries, independent Fighter d10/Rogue d8 spending and Long Rest reset, Rogue1 Sneak Attack through existing attack resolver, preserved Fighter1 Second Wind, individual/roster export-import, Play UI and safe fail-closed single-class PDF/GCX/Builder paths.

**VERIFIED:** Node 22 full regressions 608/608; static source build; 6/6 local HTTP route checks; private artwork-withheld preview with 0 image binaries. Clean-source manifest/patch replay to be completed by final packaging. Browser IndexedDB not tested live (Chromium blocked), Windows Node 26 not verified.

**OUTSTANDING:** All other class pairs/levels, mixed caster slots, later subclass/feat/ASI features, composite PDF/GCX, UX9/dev.14 integration, authentic legacy migration, browser IndexedDB two-tab, accessibility and public rights. No claim all requested GwenTable features are complete.

**NEXT:** Continue true composite level/class engine and safe export/rendering, or reconcile with current canonical source when available. **ENVIRONMENT: STAY in Chat/local** as directed. **RELEASE: NO GO**.

---

# CURRENT PRIVATE DEVELOPMENT — Player Convergence 04 (2026-11-22)

Baseline: exact checked Convergence 03 ZIP, SHA256 500f0f259417cb3a635e700b64bf9853e0688655333575059f89cdc40c23a855, 576/576 inherited tests. dev.6-derived; NOT UX9/dev.14 canonical source.

COMPLETED: source-backed Fighter (level 1–19) → Rogue1 class-entry prerequisites and selections, composite class-level/Hit Dice/HP preview, strong source-checkpoint binding, opt-in saved character form, revision-checked update/clear, automatic invalidation when plan/checkpoint replaced, portable backup compatibility. Explicitly inactive; no new gameplay features, money, spells, or equipment are granted.

VERIFIED: 594/594 Node22 tests, static build, artwork-withheld preview and asset audit; deterministic mock IndexedDB tests. Clean-archive replay and packaging recorded in external QA receipt. Real two-tab browser tests and Windows/Node26 unverified.

OUTSTANDING: active composite Play/profile for Fighter/Rogue, mixed die spends/recovery, attack assist Sneak Attack/proficiencies, actual XP level-up transaction, UX9/dev.14 convergence, complete SRD 5.2.1 coverage, artwork approval, accessibility, full cross-tab browser persistence.

NEXT: integrate one fully playable multiclass combination with exact mixed Hit Dice and reversible saved-character activation. STAY Chat/local development; do not declare code ready for public release or switch to Codex without user request. PUBLIC RELEASE NO GO.

---

# CURRENT LOCAL STATE: PLAYER CONVERGENCE 02 (22 Nov 2026)

**BASELINE:** exact Convergence 01 source SHA `dd577c800dbc370e3510b8872f969b11cbb5ae2ce7bb9148fa42e86a0d61b59c`, itself dev.6-derived; original baseline 538 passing tests. No UX9/dev.14 canonical merge verified or attempted.

**COMPLETED:** future-class planning stored in the same saved-character IndexedDB row under `multiclassPlan`, revision-guarded, optional and non-active. SRD prerequisite checks of primary and target classes; UI explains ineligible options; future plan may be saved/removed and is flagged stale if current class, level or scores change. Existing Play/Undo/XP/inventory and active rules untouched; verified portable extensions preserve the plan on individual and roster imports/exports. New cache revision with explicit module precache, no database migration.

**VERIFIED:** Node source tests, static build, integrity manifest, private image-withheld preview and clean package replay to be recorded in final QA receipt. No real saved players or production URLs touched.

**OUTSTANDING:** real active multiclass level-up engine, all-class level 1–20 progression, unified UX9 + dev.14 source, spell/feature automation, player cockpit integration, verified Windows Node 26, real browser IndexedDB migration/concurrency, accessibility and artwork rights. No false claim that planning grants class features. Public NO GO.

**NEXT:** implement a coherent supported active multiclass level allocation with validated class-specific progression and full HP/resource/spell/proficiency recalculation; build automated fixtures before enabling it on live saved characters. Stay in Chat/local per user instruction, credit-efficient.

---

# CURRENT LOCAL PLAYER CONVERGENCE | 22 Nov 2026

**BASELINE VERIFIED:** User-provided `GwenTable-MVP-dev6-Source.zip` SHA-256 `e54cdb3fee84e31f2a1aa86070c77d0145be1ed73dd3739da9cdac560ef58b97`. Actual UX9/dev.14 authoritative source remains inaccessible in this active workspace; no remote edits made.

**COMPLETED:** Two persistent canonical palettes (Scholar Plum default, Moonlit Sapphire), System color mode default, meaningful Comfortable/Compact density, player-facing Party Session navigation and old DM/NPC route isolation, alignment/language examples, HP prominence, prepared-spell-first ordering, read-only 12-class multiclass prerequisites/slots/Hit Dice/proficiency calculations. Existing character/encounter schemas unchanged. No artwork generated.

**VERIFIED:** 538/538 Node tests; static build; source SHA-256 manifest; artwork-withheld preview, zero served image variants; 16 static Chromium CSS states at desktop/mobile with no horizontal overflow. Real app navigation, real IndexedDB, Windows Node26 and saved legacy records NOT verified. Public release NO GO.

**OUTSTANDING:** Canonical source merge, fully executable multiclassing/class progression through level20, full SRD gameplay, integrated equipment/spells/cockpit, live browser persistence, a11y and actual rights clearances.

**NEXT:** Obtain current source assets for truthful consolidation, complete next transactional vertical slice locally; do not claim UX9/dev.14 merged from this dev.6-derived file. **ENVIRONMENT: STAY Chat/local for ongoing development.** No forced Codex switch, unless the owner later authorizes it.

---

# GwenTable MVP acceptance candidate | v0.25.7-inventory-dev.6

**Scope.** This local sprint used the verified dev.5 source as the MVP base. The workspace has no authoritative checkout or authentic saved-character fixtures. The sprint exercised the guest-player flow and left public publishing gated.

**Runtime changes.** Inventory activation checks the confirmed backup against the row read by the same IndexedDB transaction that writes inventory. A stale tab gets a visible conflict and a focused reload button. Reopening or refreshing the saved character requires a fresh confirmation. Language-only rerenders retain the current confirmation. The Builder displays each class's supported level cap. The existing schema, stable IDs and portable file formats are used.

**Rollback.** The pre-activation JSON is an importable private roster backup for one character. Import creates a separate character and preserves the original record. A download click and user confirmation are application steps. The browser cannot guarantee that a user's file remains on disk. Keep the original dev.5 archive for source rollback. In a staging rollout, keep sanitized exports outside the project and verify the restored copies before relying on a rollback. Preserve IndexedDB during rollback and verify the service worker on the staging origin.

**Validate locally.** From the source directory, run `npm test`, `npm run build`, `npm run verify:source`, `npm run build:artwork-withheld-preview`, and `npm run audit:artwork-withheld-preview`. With Python Playwright and installed engines, run `python3 scripts/browser-inventory-qa.py --baseline /path/to/previous/source --site .artwork-withheld-preview --output /path/to/evidence`. The suite uses synthetic data, a free loopback port, and a fresh disposable profile. The separate QA receipt reports actual engine outcomes.

**Release decision.** GO for isolated review of this candidate. STOP before migration of real saves, authoritative merge, or public release. Actual branch identity, authentic backups, HTTPS staging, physical devices, full screen-reader acceptance, code and artwork rights, security/privacy review, and owner approval still require evidence. The artwork-withheld preview is for private QA.

**Next task.** Run the staged migration and rollback sprint with the authoritative checkout and sanitized current and legacy JSON/GCX exports.

---

# GwenTable v0.25.7-inventory-dev.5 | MVP data-safety slice

**Baseline:** user-supplied dev.4 source ZIP with verified SHA-256 `0655d4daca7c9b12342efb7e1d4faf90b449ca8afe40542dfaed23a54c64fef4`, 520 tests and static build. Recovered development snapshot; canonical production branch unverified.

**Changes:** Added a single-character *importable* private backup preparation/readback, revision-bound explicit download acknowledgement before inventory activation, prevention of stale activation, bilingual labels, and offline cache registration. No changes to SRD calculations, IndexedDB schema, inventory transaction engine, data fields, character identifiers or storage values. The acknowledgement cannot prove physical download persistence.

**MVP scope:** Existing verified character creation → save/reopen → Play Sheet → inventory/coins/encumbrance → JSON/GCX/PDF. Artwork bulk imports and full advanced automation remain deferred. See `docs/MVP_RELEASE_SCOPE_v0.25.7-dev.5.md`.

**Local QA (this candidate):** 526/526 Node tests PASS (including six backup-gate tests), static build PASS, preview creation PASS with 12 source image binaries withheld, preview art audit PASS with zero image variants. Original public art audit FAILED by design on 12 uncleared files. Local Chromium launched but navigation to localhost failed `ERR_BLOCKED_BY_ADMINISTRATOR`; no new full-browser acceptance is claimed. Source and clean-archive checks are recorded in the QA receipt. Earlier dev.4 Chromium/WebKit evidence does not establish this feature's UI acceptance.

**Gates:** Canonical source identity, genuine legacy/current exports, physical browser/assistive-technology QA, all applicable code/artwork rights, accessibility and SRD attribution review, and explicit owner signoff remain unresolved. **PUBLIC NO GO.**

**NEXT:** One repository-backed Codex MVP acceptance sprint with authentic sanitized character exports and real browser testing of the backup-first UI, migration rollback and integrated gameplay flow.

---

# GwenTable v0.25.7-inventory-dev.4

**Development base.** The attached dev.3 source and patch matched their SHA-256 receipts. The dev.3 baseline reproduced 520 Node tests, 302 source hashes, and a static build. Chromium passed the existing dev.3 real-origin suite. Dev.3 remains the verified local development base for this change. The authoritative remote, branch, and commit are unverified.

**Changes.** The Builder localizes starting kit descriptions and custom field labels while preserving canonical item and rule names in the choices. The Play sheet keeps rule-valued filter labels canonical. Language switches retain in-progress inventory form values and the custom item consent checkbox. Generated character names use the locale at generation time. Generated and typed names remain as entered on language switches. Saved character values, export formats, rules, and persistence schema retain their existing behavior.

**Browser QA.** The test harness upgrades the supplied previous release's service worker on a local origin. It uses synthetic fixtures to check two-tab IndexedDB, retry, rollback, Play and Undo, equipment and carrying load, JSON and GCX, PDF generation, EN/ID, keyboard focus, offline reload, and restart. The localization checks compare saved rows, roster payloads, and GCX extensions across language switches and exercise the Compendium and Builder. The quota case injects the browser exception. See the external QA logs for engine outcomes.

**Release.** GO for isolated development review. STOP before authoritative merge or real-save migration. Authentic current/legacy JSON and GCX fixtures and an authoritative checkout remain outstanding. Physical devices, a screen-reader walkthrough, and manual print preview remain unverified. The artwork audit reports 12 uncleared assets. Full SRD coverage, licensing, privacy, and owner approval remain release gates. **Public release NO GO.** This work used synthetic saves and a temporary local browser profile.

Run `npm test`, `npm run build`, and `npm run verify:source` in the extracted source. Run `python3 scripts/browser-inventory-qa.py --baseline /path/to/dev.3 --output /path/to/qa` for Chromium, or pass `--engine` for another installed Playwright engine. Keep the original dev.3 ZIP as the source rollback point. Next, repeat read-only backup preflight and private staging QA against the authoritative checkout with genuine sanitized exports.

---

# GwenTable v0.25.7-inventory-dev.3 | official English name consistency

**Baseline:** Verified local v0.25.7-inventory-dev.2 source, 515 inherited Node tests. This workspace does not contain the authoritative Git remote/branch or real saved-character exports.

**Completed:** English-only canonical official item/spell/option names in Indonesian UI; 180 item catalogue entries display the English name, compendium names avoid accidental interface translation, new explicit HTML-safe canonical-name rendering, cache revision bumped. All original SRD mechanics, inventory transactions, IndexedDB schema, IDs and saves remain unchanged. The legacy `nameId` property remains available as an English alias.

**Verified locally:** 520/520 Node tests (5 new), static build PASS. Separate Chromium localhost suite attempted but **BLOCKED by administrator policy**. Source integrity and clean-extraction results in package QA receipt. This is not a new end-to-end browser PASS.

**Outstanding:** Authoritative checkout not identified; real historical/current character exports unavailable. Real browser cache upgrade, multi-tab migration with actual saves, Firefox/mobile, screen reader, legal/public artwork, full SRD coverage and owner release approval remain unresolved. Public release **NO GO**.

**Next:** Continue with Codex using authoritative checkout and sanitized actual backup fixtures; run real Chromium/WebKit/Firefox, IndexedDB/GCX/PDF/print and bilingual behavior, review remaining UI labels for English names. Do not migrate existing data silently.

---

# GwenTable v0.25.7-inventory-dev.2 | local continuation

**Baseline verified this turn:** Uploaded v0.25.7-inventory-dev.1 Source/QA ZIPs match provided SHA-256 manifest and pass ZIP integrity. Clean extraction passed **506/506 Node tests**, static build, **296/296** source integrity checks. Prior Codex Chromium/WebKit evidence was reviewed, not independently rerun in this continuation.

**Actual local changes:** Added `dist/lib/inventory-backup-preflight.js`, `scripts/preflight-inventory-export.mjs`, `tests/inventory-backup-preflight.test.js`, and `docs/INVENTORY_EXPORT_PREFLIGHT.md`; registered `npm run preflight:inventory` and updated package version. This is a read-only export validation tool; canonical character save logic, database schema, SRD mechanics, UI and inventory transactions are **unchanged**.

**Local verification:** 515/515 Node tests (9 new preflight checks) and static build pass. Tests include unmodified synthetic fixture, checksum-tamper rejection, ambiguous money schema, current/legacy previews, roster mixed outcomes, redaction and confidential output-file permissions. The source manifest and clean archive verification are recorded in the external QA receipt. No genuine user saves were provided or accessed.

**Outstanding blockers:** Authoritative Git repository/branch still unknown; this is a recovered development snapshot, not a verified production checkout. Authentic historical/current character backups, Firefox, actual hardware mobile, screen readers, real power loss/quota exhaustion and publication rights remain unverified. No deployment or production data changes.

**Next:** Run the read-only preflight on properly authorized genuine private exports in Codex/private staging, then reconcile any issues with the authoritative branch and retest migrations/rollback. The preflight's exit code 0 **never** means migration accepted. **Release: NO GO.**

---

# GwenTable v0.25.7-inventory-dev.1

## Gates

- **GO for review and isolated development against the verified v0.25.6 snapshot.**
- **STOP before merging into the current authoritative branch.** The upload contains a recovered development snapshot and omits Git history, remote identity and production lineage. This workspace had no authoritative checkout.
- **BLOCKED for migration acceptance with real saves.** The browser suite uses synthetic v0.25.6-shaped and legacy-shaped records.
- **PUBLIC RELEASE NO GO.** Public artwork, the full SRD coverage register, accessibility, privacy/security, code licensing and owner approval remain release gates.

## Provenance

The upload verifier confirmed the preserved original ZIPs. The v0.25.6 website archive SHA-256 is `bc69e9559cc66044bca3e19e09422261b8fd46d561f5e5f6b40716329cf03ae6`. The independent v0.25.18 reference SHA-256 is `320d94e861e2a77f624beb5cc9454cd4a3ec079b2b900a72146e47bef12be1a5`. Baseline verification reproduced 498 website tests and 286 hashes, a static build, and 439 reference tests, 5 Python checks and 118 reference hashes. The two SRD weight modules were copied from the reference. The site keeps its existing NOTICE and attribution.

## Implementation

- Saved Characters links to an Inventory section in the Play Sheet. Both use the current saved-character row. The view distinguishes carried, worn, equipped, stored, dropped and contained gear. It lists each denomination and treats unknown carried weights as a lower bound.
- The existing IndexedDB database and `characters.update()` transaction control freshness. Item and wallet changes, their receipt and the opaque `_characterRevision` share one write. Receipt replay returns the current row without writing. The latest 128 operation IDs are retained locally. An older replay with an outdated revision fails.
- Inventory activation previews the legacy gear list and gold. A supported list and balance seed an extension on explicit activation. Unmapped item names keep unknown weight. Competing money or equipment schemas require manual review. The old values, saved draft, Play/Undo, GCX and foreign fields remain in place. Untouched activation can be reversed. Keep private pre-activation backups before trials with real characters.
- The validated build determines Strength, species and base size. Goliath Powerful Build uses the SRD size rule. Temporary size effects remain table-managed. Armor Class and attack references follow the build. Inventory moves describe where gear is held.
- The 180-entry catalogue supplies weights and source pages. Trade uses 11 independently verified list prices, SRD half-price sales and exact payment in the selected denomination. Purchases and sales use one owned wallet. Transfers are within one saved character between wallets, containers or locations.
- Private roster and character JSON retain inventory and extensions with fresh local IDs on import. Local revisions and retry receipts stay in browser storage. GCX copies can carry a recognized namespaced inventory extension. A linked GCX update preserves the local inventory. PDF and browser print use the saved gear and wallet balances. Existing size and integrity limits still apply to portable files.
- This app is a browser-local guest tool. The local review gate and revision checks apply to the Play and inventory write paths. There is no account or payment service involved. No live user records were accessed, and no deployment or live migration was performed.

## Verification

- **PASS** Upload integrity, baseline and reference checks, all 506 integrated Node tests (498 inherited and 8 new), and the static build.
- **PASS** Native Chromium and WebKit at a real localhost origin, each with a fresh persistent profile. Service-worker update, explicit activation, two-tab concurrency with visible conflict/reload, duplicate replay, failed purchase, controlled native transaction abort, injected quota error, build advancement against a stale tab, synthetic legacy/current JSON and GCX, Play damage and Undo, PDF download, EN/ID, keyboard focus, three responsive widths, network-disconnected reload and browser restart. The quota case injected the browser exception instead of exhausting disk.
- **BLOCKED** Firefox launch timed out in this workspace with a headless compositor error. The suite requires a working Firefox host.
- **NOT RUN** Genuine legacy/current exports, hardware mobile devices, full screen-reader walkthrough, real quota exhaustion and uncontrolled power loss, manual browser printing.
- **FAIL by design** Public artwork audit reports 12 inherited uncleared variants. The separate artwork-withheld preview has zero image variants. The reference SRD audit reports 17 domains and all 12 classes still unapproved for release. The Bard level 13–20 candidate was absent and the secondary class work was deferred.

## Reproduce and roll back

Run `npm test`, `npm run build`, and `npm run verify:source` from this package. For Chromium QA, run `python3 scripts/browser-inventory-qa.py --baseline /path/to/GwenTable-v0.25.6 --output /path/to/qa` with Python Playwright and Chromium installed. The browser harness starts a local server on a free loopback port and cleans up its synthetic profile. The package includes historical baseline provenance files. The integrated version is in `package.json` and this document.

For source rollback, reopen the untouched v0.25.6 ZIP in a separate directory. For data rollback, first export the tracked record when readable, then restore the private pre-activation backup as a separate copy. A browser-origin rollback must account for its installed service worker and open tabs. Preserve browser storage during rollback.

## Next task

Use an authoritative checkout and sanitized authentic old and current exports to repeat the migration and rollback workflow in private staging, including the remaining browser and assistive-technology checks.

---

# Player Convergence 03 | Verified local development | 22 Nov 2026

**BASELINE:** Exact verified Convergence 02 private source, SHA-256 `74010e11b4cec5a4ee5aaa88015540fbd7aac55c875961d54d59f8572989815b`, 559 tests. This branch is dev.6-derived, NOT UX9 or dev.14.

**COMPLETED:** Source-backed, opt-in multiclass level-up **checkpoint** with fixed/rolled second-class HP, minimum 1, XP/GM authorization, class Hit Die/mixed HD/slots/proficiency preview, strict shape/source revision validation, Play Sheet UI and saved-row atomic CAS. Plan changes clear checkpoints. Active character stats, Play and inventory remain unchanged; exports carry the checkpoint as a private extension.

**VERIFIED:** 576/576 automated Node22 tests and static build; artwork-withheld preview audit zero binaries. Clean extraction, source SHA registry and patch replay in the external QA receipt.

**OUTSTANDING:** Active composite class-level implementation remains blocked until per-class features, proficiencies, spell preparation, mixed Hit Die spending, class resources and attack calculations are reconciled in one vertical slice. Also unmerged UX9/dev.14, actual Windows Node26, browser IndexedDB two-tab and legacy saves, accessibility, legal/public artwork. Public NO GO.

**NEXT:** Implement a complete *playable* composite class ledger and integrate precisely one eligible class combination end-to-end with Play, inventory/attacks and export/import, then expand to all classes. Avoid prematurely promoting the inert checkpoint into active state. **ENVIRONMENT: STAY Chat/local**; do not switch to Codex without user direction.
