# GwenTable Claude context v3 | 27 November 2026

**IMPORTANT: This edition supersedes availability claims in the v2 documents.** We recovered the exact archived files by direct private Google Drive transfer, although most cannot be materialized into this local runtime. The authoritative current checkout is still not *identified or reconciled*. The folder now contains 22 recovered archive files (source candidates, preview, QA, localization, sheet kit); the context ZIP is a separate supplement. The recovered full-site candidates are UX9 Windows workspace, Convergence 08 private source, Dev15 unified player console and MVP Dev16 Warlock source. Dev22 and Wizard Dev19 are separate rules candidates; Hazards v3 is a standalone integration fixture. Never select a baseline solely by version number. No claim of a newly merged site or fresh full-site test result.

## First instructions
1. Download the entire private Drive folder, extract each candidate into separate directories, do not overwrite originals, verify file sizes and ZIP integrity and scan for secrets/private data/uncleared assets before sharing or executing. Do not execute untrusted binaries; inspect source and run source-based tests.
2. Read `docs/RECOVERED_ARCHIVES.md` and `docs/SRD_INTEGRATION_BACKLOG.md` then `history/v2_FULL_CONTEXT.md` for full established product charter, source authority, engineering standards, historical evidence and UX. The v2 missing-source statements are stale for transferred artifacts; actual ancestry and source completeness remain unknown.
3. Identify current site by source/tree/commit/lockfiles, review QA records, run baseline tests, establish rollback. Ask owner only if consequential uncertainty remains. Compare UX9, Dev15, Convergence08, MVP16. Reconcile class, gameplay, wizard, and hazards modules via compatible seams, not wholesale replacement or duplicate databases.
4. Establish traceability for each feature: source record, builder eligibility, runtime effects, state persistence, UI/export, tests. Use the JSON backlog as a starting audit register, not a statement that all entries are missing. Prioritize foundational engine, creation/progression, multiclass, action/roll, damage/conditions, save triggers, spell effects, items/resources, PDF/export and release gates.
5. Integrate approved sheet kit v0.3 using source field mappings; keep existing visual design and compatibility. Sheet PDF generator is standalone; verify actual filled outputs using sanitized character fixtures. Localization v1.46 is the newest archive identified; compare predecessor audits and master, do not infer coverage or approval from its number.
6. Remain SRD 5.2.1 only, EN/ID, no Avarra-specific mechanics or automatic cross-site integration. Pinned source https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf and attribution https://www.dndbeyond.com/srd ; verify version and license. Do not broaden to commercial 2024 PHB or legacy content. Preserve existing UX, approved original art, data and schema; no production/public deployment, destructive operations or paid services without approval.
7. Report COMPLETED / VERIFIED / OUTSTANDING / NEXT / ENVIRONMENT and progress with real denominators. Do not add historical test totals across branches, claim full automation from spell text, or give an invented overall percentage/ETA. Use Claude Code with local files; run focused tests and full regression at milestone. Keep PROJECT_STATE updated.

## Evidence and limits
- Current context package verifies its own checksums and reruns 170 standalone Hazards v3 tests via `node verify.mjs` (not full site).
- The character sheet kit ZIP was recovered locally and passed ZIP CRC verification; historical QA is inside the kit. Actual live export not verified.
- Recovered website ZIPs were copied to Drive via their exact file references; Drive metadata verifies availability and size, not contents or safety. Local raw materialization denied. Full source ancestry, security, real browser, saves and release approval remain pending.
- Historic reports: synthetic Dev22 573 tests, party conditions Dev14 697 tests, localization v1.44 180/339 source-reference records; separate metrics, not current whole-site verification. Do not extrapolate to v1.46 or public readiness.

**Public release: NO GO.**

---

## Full historical product charter and engineering context (v2; availability superseded above)

# GwenTable | Full development context for Claude AI

**Transfer edition 2.0 | 26 November 2026 | Private engineering handover | Public release HOLD**

## 0. Read this first

GwenTable is an existing website project, not a greenfield request. Continue the actual product; do not substitute a newly generated prototype for it. This document consolidates the available product decisions, historical development records, current executable candidate, integration priorities, and release criteria. It deliberately excludes unrelated projects, private setting lore, credentials, and actual player records. It is not proof that every historical file or feature is present in the current website.

Evidence vocabulary used here:
- **Binding:** explicit user/project requirements or established product decisions.
- **Verified now:** files physically present in the transfer environment and current checks recorded in the accompanying evidence.
- **Historical:** results recorded in earlier project records; not independently rerun for the current website.
- **Candidate:** runnable isolated source, or an explicitly proposed approach; not deployed or approved production architecture.
- **Unknown/blocked:** input or evidence unavailable. Do not replace this status with a guessed percentage.

The principal blocker is an unresolved authoritative website checkout. UX9, dev.14/dev.16, Convergence08 and multiple other development labels recur in historical records. They are not a proven linear Git history. Identify the real latest source and compare code/commits before applying any patch. The bundled Hazards v3 code is runnable, but is NOT the website.

## 1. Product charter (binding)

- Product name: **GwenTable**. Free, setting-neutral Dungeons & Dragons 2024 character creation, character management, character sheets and player gameplay tools. The built-in rules corpus is strictly **System Reference Document 5.2.1** (SRD 5.2.1), not all content from commercial D&D books. No Avarra-specific rules, other official-book-only material or third-party homebrew in the built-in corpus. Do not silently broaden source scope.
- Support natural English and Bahasa Indonesia. Retain mechanical English terms when this is clearer to Indonesian players. Preserve original mechanical meaning, numbers, tables, triggers, constraints and stable IDs. Do not translate a proper name or keyword inconsistently. A source reference is not a completed translation.
- Goals: character builder, level progression, class/subclass, species, background, feats, spells, equipment, inventory, money, attunement, sheet calculations, combat, resources, rests, conditions, saves, export/import, random character templates and ergonomic printable character sheets. Printable 2014/2024/custom layouts are design goals, not authorization to include 2014 proprietary rules. Character sheet should clearly identify itself as a Dungeons & Dragons character sheet, subject to applicable branding review.
- Portable character JSON is a product goal. Preserve established JSON/GCX/PDF contracts where present and avoid destructive schema changes. No assumed shared backend or automatic synchronization with other websites. Existing user data and approved working behavior take precedence over a clean-slate redesign.
- Quality first, minimum justified credits: favor small tested changes, local deterministic scripts, reuse of working code and approved assets, targeted verification, and genuine integration. Avoid repeated whole-repository audits and endless isolated prototypes.

## 2. Boundaries between products

GwenTable is the SRD-only product. Taverley's Archive is the authority for approved setting lore, guild records, mission assignments, played outcomes and confirmed rewards. Penelope's Adventure Board is a separate player-facing product under approved Avarra rules. Gwen's Pocket Table is a separate DM-oriented setting companion. Do not copy their setting rules, prices, records, access privileges, private lore or databases into GwenTable. Compatibility/portable exports do not imply service interoperability. This export authorizes work on GwenTable only.

## 3. Source authority and legal gates

Official SRD page: https://www.dndbeyond.com/srd
Pinned document: https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf
CC BY 4.0 legal code: https://creativecommons.org/licenses/by/4.0/legalcode

The PDF is not bundled. Obtain the official bytes and record the SHA-256, version and printed page/section references before new source-based edits. A historical integration record identified SHA-256 `8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87`; treat it as a historical comparison value, not proof of the newly downloaded file. Do not substitute broader Basic Rules, a different SRD revision or 2014 mechanics. Audit even candidate code against the pinned source. Distinguish missing source definitions, explicitly manual adjudication, and genuinely automated rules. Never invent mechanics to fill a data gap.

Preserve this attribution and identify adaptations/translations as applicable:

> This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

No endorsement implied. Review trademarks, art, code rights, source/license attribution and privacy separately. This handover does not assign a license to the user's original software. Do not publish without approval and rights review.

## 4. UX and visual identity (binding)

Use the existing approved GwenTable design system (GwenTable Edition), rather than imposing a new theme. Make every important action accessible and legible, especially during tabletop play: mobile-first, useful hierarchy, compact ergonomic sheets, obvious action cost, clear current state, no inaccessible hover-only information, keyboard and focus support, appropriate touch targets, readable contrast, loading/empty/error/confirmation states. Test at 320/390/768/1440px as appropriate and at 200% text zoom. Test both locales with long labels and correct language metadata. Do not claim accessibility conformance solely from a static audit.

All new WEBSITE illustrations use an original premium stylized fantasy/game-art identity: painterly depth, cinematic light, expressive faces, strong readable silhouettes, dynamic posing, graphic shapes, clean lines, controlled vivid palettes and rich material texture. The user references the high-level qualities of Legends of Runeterra and Valorant game illustrations, not their protected assets, logos, characters or compositions. Avoid photorealism and generic stock imagery. Reuse approved assets and preserve established character designs. Compress imagery, use appropriate formats and alt text. Do not generate art simply to advance a sprint; first fix functionality and clear existing rights. Earlier audits flagged 12 artwork variants in an older candidate; not a current site inventory. Private artwork-withheld previews are not public release approval.

## 5. Development history and evidence map

These are distinct development families unless a code-level ancestry check proves otherwise. Dates/labels below refer to historical artifacts, not deployed versions. Do not add test totals across families or successive cumulative snapshots.

| Family / snapshot | Historical scope and results | Transfer status / caution |
|---|---|---|
| Existing site UX9 / Convergence08 / dev.14 or dev.16 | Repeatedly named as authoritative-source reconciliation targets. A separate 19 Nov integration record referenced a GwenTable Sites v33 commit `89ad5dc2d11dbe30cf0b31029d07a45ce97e69a4` (package 0.22.5), with 107 upstream tests. | Source and live deployment not verified. Commit is a recovery lead only, not latest confirmed baseline. |
| MVP v0.25.7-inventory-dev.12–15 (20 Nov) | Cleric 1–20 recorded; dev.13 Druid Circle of the Land high levels, 18 high-level spells, 673 tests, 8 classes with full 1–20 range then reported; dev.14 Sorcerer Draconic Sorcery high levels; dev.15 Bard College of Lore levels 13–20, Magical Secrets, 22 high-level Bard spell records and 39 Wizard list entries for Magical Secrets. | Historical patches indexed, not available as raw source here. Warlock/Wizard levels 13–20 were outstanding in that snapshot; later work may supersede it. Wizard spell list entries do not prove class implementation. Feature range does not prove comprehensive automation. |
| dev.6-derived condition/travel branch (21–22 Nov) | dev.8: condition context, D20 preview, travel, 11-terrain planning and Play Sheet quick rule forms. dev.14: 2–8 selected PCs, atomic condition reconciliation, actor/source IDs, per-character revisions, single encounter revision, idempotent replay/Undo. 697 Node tests and static build historically passed. | Exact dev.14 source ZIP missing. Recorded SHA-256 `992748c0c8d8b7fa243477c90c63a89034b5058df49e36e609cb2313c56249cc`; browser localhost blocked, actual multi-tab unverified. Explicit party reconciliation is not automatic cross-character concentration. |
| Private synthetic rules bridge Dev.14–22 (23 Nov) | Dev.14 session composes turns/actions, HP/death, rest/Hit Dice, Pact Magic/Spellcasting. Dev.15 opt-in synthetic IndexedDB; Dev.16 conditions and Exhaustion; Dev.17 Concentration; Dev.18 temp HP, stabilization/recovery, Heroic Inspiration and Death Saves; Dev.20 owned weapon attack; Dev.21 Extra Attack/Light/Nick/Loading; Dev.22 synthetic target HP/AC, resistance/vulnerability/immunity, temp HP and confirmed damage. Historical Dev.15 376, Dev.16 393, Dev.17 419, Dev.18 458, Dev.20 519, Dev.21 545, Dev.22 573 tests; Dev.22 42 HTTP checks. | Earlier raw source/patch retrieval refused; latest complete bridge cannot be rerun. Schema `gwentable.srd521.private-session.v1` is a test envelope, not production. Browser timeout/admin block, real two-tab unproven. Many rules still manual. |
| Localization workstream (19–26 Nov) | Historical v0.60/0.61 reports: 339 spell cards, 330 monster registry entries, 12 semantic tables, 1,027-page print proof; not certified accessible. v0.70 metadata audit reports 339 paired spells across metadata categories. v1.39 reference audit: 120/339 spells and 1,385 source checkpoints, zero full-body or editor approvals in that slice. Prior v1.44 conversation reported 180/339 reference records (53.1%, 159 remaining). | v1.44 and earlier raw ZIP/master unavailable. 180 is reported, not independently confirmed. The 339-card archive count is not verified translation completion. Do not treat older PDF or metadata audits as independent bilingual approval. |
| Hazards v1–v3 (26 Nov) | v1 falling, burning, suffocation; v2 dehydration and malnutrition, size-based needs, source-specific Exhaustion; v3 supply fixture, pending DC 10 CON save, trusted host resolution, receipts/revision and rollback. | Latest recoverable source is bundled under `source/hazards-v3`. Original archives in `history/`. See current QA receipt. No actual website integration. |

Known artifact recovery names (also see `docs/ARTIFACT_REGISTER.csv`):
- `GwenTable_MVP_dev12_to_dev13_SRD_Druid.patch`, `GwenTable_MVP_dev14_to_dev15_SRD_Bard.patch` and their exact baseline/source ZIPs.
- `GwenTable_dev13_to_dev14_Party_Condition_Reconciliation.patch`, `GwenTable_dev14_SRD_Party_Condition_Reconciliation_PRIVATE_Source.zip`.
- `DEV15_TO_DEV16.patch`, `DEV16_TO_DEV17.patch`, `DEV17_TO_DEV18.patch`, `DEV20_TO_DEV21.patch`, `DEV21_TO_DEV22.patch` and matching complete sources.
- `GwenTable_SRD521_Spell_Localization_v1_44.zip`, `GwenTable_SRD521_Spell_Localization_v1_43.zip`, `GwenTable_SRD521_Spell_Central_Audit_v1_41.zip`, `GwenTable_SRD521_Spell_Central_Audit_v1_40.zip`, `GwenTable_SRD521_Spell_Text_Source_Gates_v1_39.zip`, plus original bilingual master and editorial signoffs.

Earlier raw access to Library files failed. A connected repository search returned no matching accessible GwenTable repository. This is an access limitation, not evidence that the files no longer exist. Ask the owner for the actual checkout or exact ZIP/location, not new credentials or speculative URLs.

## 6. Current executable candidate and API map

Hazards v3 is dependency-free ESM for Node.js 22+, with these files:
- `src/hazards.mjs`: falling dice/damage and landing, burning start-turn and extinguishing, breath duration, suffocation and restore-breathing helpers.
- `src/survival.mjs`: `createSurvival`, `dailyNeeds`, `previewDay`, `reduceSurvival`, `exhaustionTotal`. Validated daily intake, day close, suffocation-turn, breathing recovery, other Exhaustion gain and eligible reduction.
- `src/survival-session.mjs`: `createSession`, `sessionView`, `applyCommand`, `createMemorySessionStore`. Test-only command/receipt adapter with actor binding, revision checks, pending save and in-memory supply balances.
- `test/`: three test files, 170 cumulative standalone tests; inherited historical archives contain 76 and 131 tests respectively. See `source/hazards-v3/INTEGRATION.md` for exact function/command contracts and restrictions.

Five glossary hazard categories are represented. This does not mean the entire combat, survival or SRD rules engine is complete. The source-specific Exhaustion design must preserve unrelated levels; suffocation recovery removes only outstanding suffocation-origin levels. Adequate food/water unlocks appropriate recovery rather than deleting levels automatically. Do not invent source provenance for legacy saves. Fatal level 6 must route through canonical death and revival rules. Verify exact thresholds and turn phases against the official source before implementation.

Candidate limitations: whole ounces, fixed daily size, special creature exemptions/mid-day transformations/manual effects unresolved, deterministic water-first bookkeeping if simultaneous gains would be fatal (not an SRD priority), pending-save global lock, no cancellation, 10,000 command history ceiling, synchronous in-memory storage, no actual UI, no real inventory item identity or browser storage. None are binding production requirements. A trusted-host assertion is not client authorization. Unique command ID alone cannot prove new underlying consumption or recovery entitlement.

## 7. Proposed architecture for integration (not established stack)

Inspect actual framework, database, module layout, migrations, localization system, build/test scripts, and existing state ownership before choosing implementation. Keep one owner per domain: character build; derived stats; inventory and currency; spell/feature resources; turn and time; damage/conditions/Exhaustion; saves/prompts; storage/transactions; import/export; localization. Pure SRD calculation modules should not mutate canonical state or make networking decisions. Convert calculation outputs to explicit host commands and apply them atomically with revision checks, deduplicated effect receipts and trusted identity. Respect existing architecture and avoid dependencies unless justified.

Suggested general reminder lifecycle: event or effect -> source-linked rule proposal -> eligible target/phase -> pending prompt -> valid confirmed save outcome -> effect transaction -> receipt -> reload/export safe state. A reminder is not permission to roll, spend a slot, apply an effect, or modify another character. Do not invent a roll or assume failed save when dismissed. Preserve context (source, target, ability, DC, timing, modifiers, applicable advantage/disadvantage, source revision); support correction/invalidation and urgent unrelated actions. Do not expose private adjudication metadata. Reuse existing save resolver and avoid competing queues. This is a design proposal for actual integration, not existing production functionality.

## 8. Implementation sequence and acceptance criteria

P0: recover canonical source. Obtain a complete source checkout/ZIP with commit or hash, lockfile, test scripts, migrations, asset/source manifests, sanitized fixture saves and backup. Exclude `.env` secrets, API keys, tokens, actual personal data and dependency caches. Identify the current app by code/branch, not file name. Run baseline tests, build, type/lint if available; record failures honestly. Confirm recovery and rollback method. No destructive migration.

P0: reconciliation. Build an actual code map and status matrix: integrated and tested, exists but unverified, candidate only, missing, not applicable. Compare actual files against recovered branches. Prefer existing equivalent logic. Never apply a patch to a nonmatching base, never copy a synthetic IndexedDB or memory store into the real app wholesale, never start a replacement site merely because the branch is absent.

P1 first vertical slice: connect daily intake and end-of-day survival to real player sheet. Use actual inventory item IDs/units and source of clock/turn. Close a verified boundary once. Generate the correct DC 10 Constitution reminder for positive intake below half where applicable; evaluate zero food separately; calculate water shortage per source. Do not double count effects. Resolve through canonical save pipeline with all legitimate modifiers. Persist source-specific Exhaustion, actual supply deduction, day and receipt atomically. Reuse rest eligibility, handle old saves and valid recovery/revival. Support interrupted prompts, correction, reload/export without reapplying effects, rollback, race/replay/wrong actor/invalid event tests. Real EN/ID UI plus keyboard/mobile and two-tab IndexedDB or actual persistence tests required.

P1 combat and gameplay: reconcile attacks, proficiency/mastery, Light/Nick/Loading, extra attacks, actions/reactions, damage/HP/temp HP, concentration, conditions, stabilization, Death Saves, Inspiration, turn phase, and source-timed spell/environment saves. Verify resource gating, damage order, effect scope, immunity, criticals and invalid targets. Do not call a synthetic target an actual monster database. Separate manual adjudication from automatic consequences.

P1 character and spells: verify species/background/class/subclass/feat source list and levels 1–20, multiclass prerequisites/slots, spell preparation/selection/known spell/ritual resource handling, rests/limited-use features, legal choices and source IDs. Audit spell definitions and triggers, monsters and companions. Then inventory/equipment/currency/attunement and portable export parity. Do not add proprietary choices or setting-specific items. Exact implemented feature counts require repository inspection.

P2 localization: recover original bilingual master, source corpus and newest reference audit. Reconcile unique IDs, metadata, exact critical clauses, complete text, mechanical qualifiers and semantic tables. Maintain separate counts: source verified records; bilingual candidate translations; independently approved translations; site integrated; QA passed. Use Indonesian natural language, not literal machine translation that alters mechanics. Keep independent editorial signoff explicit. Test actual localized UI and printable sheets.

P2 UX/accessibility: preserve existing theme, approved imagery, readable mobile and desktop character workflow, printable sheet usability, clear errors, keyboard/focus, contrast and text resizing. Do not claim full accessibility without real test evidence. Keep manual table control and show which calculations are automatic versus requiring adjudication.

P0 release: no unresolved critical security/data-loss/rules issues. Verify actual build/type/lint/unit/integration/browser, old save compatibility, migrations/rollback, concurrent tabs, privacy/authorization, imports and malicious input, dependency/security review, approved asset/license registry, editorial review, and owner authorization before release. No unapproved money, infrastructure, credential changes, destructive changes, real data modifications or public deployment.

## 9. Testing and status reporting standard

Run `node verify.mjs` from the bundle. It checks manifested hashes and reruns 170 standalone candidate tests. Run actual website scripts separately once recovered. An HTTP smoke check is not real DOM/keyboard/mobile verification; mocked IndexedDB is not real cross-tab transaction verification; synthetic fixture is not actual player data; preview is not deployment. Record environment, commit/hash, test command, exact passed/failed/skipped/not-run counts, and cause of failure. Keep source changes, tests, logs and documentation together. Verify the packaged output from a fresh extraction. Do not invent browser screenshots or release URLs.

For every meaningful milestone report **COMPLETED / VERIFIED / OUTSTANDING / NEXT / ENVIRONMENT**. Include measured progress with real denominators and practical next action; no invented overall percentage, elapsed completion date or claim of remaining subscription credits. Estimates only after measured scope and throughput; label assumptions. Update PROJECT_STATE, decision records and recovery references as work advances. Explicitly disclose new design choices and limitations. Never silently promote a proposal into an approved rule.

Environment guidance: STAY in Claude chat for bounded context or planning; SWITCH to Claude Code (or another repo-aware engineering environment) for actual repository consolidation and verification once the source is supplied. Use least expensive adequate tools; batch changes, use local scripts and focused tests. No background work or promise of future delivery. Stop before creating a disconnected prototype if the actual source is missing; provide exact recovery instructions instead.

## 10. First action for Claude

Read this document, `PROJECT_STATE.md`, `docs/ARTIFACT_REGISTER.csv`, `docs/INTEGRATION_BACKLOG.md`, `docs/SOURCE_AND_RELEASE.md`, `source/hazards-v3/INTEGRATION.md` and the executable code. Verify the package. Locate the actual canonical website checkout. If it exists, establish baseline, choose one small integration slice and implement/test it. If it does not, ask the owner for the exact missing source ZIP or repository and avoid fabricating a website merge. The goal is a functional existing website, not more handover artifacts.

**Current release decision: NO GO.** No authoritative website integration or actual production release verified. Full context means all materially relevant recoverable context in this project handover, not all account conversations or unavailable source files.
