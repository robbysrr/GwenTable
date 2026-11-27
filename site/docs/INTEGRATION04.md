# Integration 04: source-specific Saving Throw resolution

Source: embedded SRD 5.2.1 spell corpus (`dist/lib/spell-effects.js`, Hold Person and Hold Monster), Rules Glossary and D20 rules. See NOTICE and existing source registry. The implementation does not infer mechanics from names. This is a bounded table-confirmed workflow, not complete automation of either spell.

1. Open an existing character's Play Sheet and its Tracked condition sources panel.
2. After the table has determined an effect applies, expand Add save-ended condition. Only register an effect if the applicable rule allows a repeat save whose success ends this source on this target. Confirm ability and DC with the DM.
3. When a save is actually due, confirm and queue it. No real-time timer or automatic turn trigger.
4. Enter physical dice (one normal, two for uncancelled Advantage or Disadvantage), confirm situational modifiers and submit. For recorded automatic STR/DEX failure, leave dice blank. A successful save removes exactly that source; failure retains the condition and clears the pending attempt. No resources are spent. For changed DCs, transformed stats or different outcomes, adjudicate manually; end the source only when the table confirms.
5. Test overlapping sources, manual condition toggles, stale prompts, Undo, reload, and export/import using synthetic data only. Existing older builds may reject new records; back up before testing. Run `npm test`, `npm run build`, `npm run verify:source`. Windows launcher `Run-GwenTable-Integration04-Private.cmd` uses loopback port 42630 and artwork-withheld preview. Real browser UAT remains outstanding.
