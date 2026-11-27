# Integration 11 | Browser acceptance fixes and Bless/Bane D20 dice

Private Integration 10-derived candidate. Pinned SRD 5.2.1 (SHA-256 `8974902d…5e3d87`): Bless p.113, Bane p.112, Combining Magical Effects p.106. Attribution unchanged.

## Browser acceptance (first real execution)
Chromium 1243 via Playwright 1.63 (headless, Linux), Node 22.23.5, artwork-withheld preview served by `scripts/dev-local.mjs`. Synthetic characters only; `Math.random` seeded per browser context so runs repeat. Suite: `browser-acceptance/uat.e2e.mjs` (not part of `node --test` discovery). Results: `docs/INTEGRATION11_UAT_RESULTS.md`.

Two defects found and fixed:
1. **Builder blocker, Magic Initiate.** For a background granting Magic Initiate, the Spells step showed "Confirm Magic Initiate choices" as a required action, but the button was never rendered: the confirmation section was appended to `content` and then replaced by `content=renderMagic(...)`. Finish routed back to Spells. Fix: build the section first and append it after the Spells content (`dist/app.js`).
2. **Generated Standard Array hidden.** Random and level 3 template drafts carry a complete Standard Array assignment, but `replaceDraft()` resets `arrayAssigned` for new drafts, so all six score selects rendered blank (4 of 6 seeded Wizard runs). Point Buy and rolled scores were unaffected. Fix: after generating or loading a template, mark the assignment as shown when the scores are a complete Standard Array. Ability Score boosts still require their own confirmation.

## Bless / Bane slice
- `dist/lib/srd-live-modifiers.mjs`: `Bless` (+1d4) and `Bane` (−1d4) join the existing incoming-effect ledger (same `{id,spell,caster}` records, same 24-source cap, same validation, Undo and revision CAS). `liveD20Dice(play,kind)` lists active dice for `'save'`/`'attack'`; none for `'ability'`. `applyD20Dice(play,kind,rolls)` requires exactly one physical d4 per active applicable spell and rejects missing, out-of-range, non-integer, extra or inapplicable entries. Several Bless castings overlap into one die; Bless and Bane both apply. Live AC ignores them.
- `dist/lib/srd-live-check-preview.mjs`: the shared save resolver adds the dice; used by the quick save preview, the pending Concentration save and pending condition saves. Automatic failures need no dice. The result lists the dice; logs read e.g. `d20 8 (Bless +2)`.
- UI: Play sheet "Bless and Bane" panel (record with caster label and confirmation, end individual sources), d4 fields on all three save forms (`dist/spell-dice-fields.js`), EN/ID copy. Rest cleanup message now names AC, Bless and Bane.
- Offline cache revision `…-integration11`; new module listed in `sw.js`.

## Limits (explicit)
- **Attack rolls:** the Play sheet has no attack-roll resolver, so Bless/Bane on attacks is a reminder in the panel only. The player adds or subtracts the d4 at the table.
- Caster Concentration and the 1-minute duration are table-managed, like Shield of Faith. Bane's Charisma save is made by the target at the table; the player records Bane only after failing it. Caster labels are local, not authenticated character links.
- Death Saving Throws are saving throws and Bless applies to them by the spell text, but the death-save buttons do not ask for the d4 yet.
- Older builds will reject records holding Bless/Bane ledger entries (same downgrade restriction as Integration 10). No IndexedDB migration.
