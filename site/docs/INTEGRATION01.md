# Integration 01 — private branch reconciliation

## Source and scope
Convergence 08 is the selected **private integration candidate**, not the authoritative live checkout. Original archives are unchanged. Unified Player Console Dev.15 supplied the D20 resolver; the port is deliberately bounded to the skill/save preview. UX9, MVP Dev.16, Wizard Dev.19, Dev.22 and Hazards v3 are not fully merged. Historical counts are independent.

## Changes
- `dist/lib/srd-d20-preview.mjs`: selected D20 and skill helper functions ported from Dev.15. The source pin and license remain identical.
- `dist/lib/srd-live-check-preview.mjs`: adapter using the current `playProfile` derived statistics, current Exhaustion, selected skill or saving throw and confirmed roll context. Handles Poisoned skill disadvantage, Restrained Dexterity save disadvantage, recorded automatic Strength/Dexterity save failures. Dead and active Wild Shape states are rejected; other situational modifiers and exceptions require table adjudication.
- `dist/live-check-preview.js`: bilingual physical-dice preview in Play Sheet > Attacks & checks. Both advantage and disadvantage cancel; a second die is necessary when the actual mode requires one. Optional DC and signed modifier. Nothing is committed, including roll history or resources. This is not a Death Save, attack, general ability/tool check, automatic effect resolution, or real-time shared party system. Alternative skill ability, special roll replacement, sight/hearing requirements, aura, cover, conditional features and unmodeled situations require manual handling or adjudication.
- `dist/play-sheet.js`, `dist/locale-copy.js`, `dist/sw.js`: actual application integration, interface copy and new offline cache revision. One existing test updated for the exact cache revision. Existing save schemas and advancement logic untouched.
- `tests/live-check-integration01.test.js`: ten new tests.

## Source mapping
Pinned SRD 5.2.1 source (CC BY 4.0) in `dist/lib/rules.js` and embedded SRD reader: D20 Tests pp. 6–8; Exhaustion p.181; Paralyzed, Petrified and Poisoned p.186; Restrained p.187; Stunned p.189; Unconscious p.191 (embedded PDF page keys). The existing source registry and build checks passed. No non-SRD content added.

## Run
Extract separately from all old installations. Use a test browser profile with synthetic characters only. From root: `npm test`, `npm run build`, `npm run verify:source`, `npm run dev:artwork-withheld-preview` (loopback port 4174 by default). Use `PORT` override if needed. Do not use the art-bearing site for public publication. Existing package.json version is intentionally retained for compatibility; this candidate is identified by its new cache revision and receipt.

## Next
Select/confirm canonical target, audit conflicting `character.js`, `play.js`, storage and export contracts against MVP Dev.16, UX9 and Console before migrating. Move one source-backed save-trigger or condition lifecycle slice into actual revision-checked persistence; no blind file replacement. Full real browser/IndexedDB and Windows Node26 acceptance is outstanding. See baseline and candidate logs.
