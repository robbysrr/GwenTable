# Integration 05 — automatic own-turn repeat saves

Source: embedded SRD 5.2.1 `dist/lib/spell-effects.js` entries Hold Person and Hold Monster, tested against the clauses for Wisdom save, Paralyzed, end of each affected target turn and success ending the spell on that target. Official SRD source and attribution remain in the existing NOTICE and source registry. No non-SRD content added.

## Private UAT
1. Back up existing characters. Extract to a separate directory, run `Run-GwenTable-Integration05-Private.cmd` using Node installed (Node 22 tested); open http://127.0.0.1:42631/ in a test browser profile.
2. Create a synthetic character, save and open Play Sheet. In Tracked condition sources select Add automatic end-of-turn save. Choose Hold Person, DC 15, confirm actual source following failed initial save. Start encounter and own turn. End own turn. Exactly one pending Wisdom save; next turn disabled until resolved. Record a failed result then begin/end next own turn; second attempt due. Record success and observe source removed.
3. Repeat with two independent sources and manual Paralyzed. Resolve one source; the other and manual condition remain. Confirm removal of an expired source with DM. Verify Undo restores turn and pending state coherently; export/import and reload. Test keyboard, narrow screens, offline refresh and stale cross-tab rejection manually.
4. For generic manual save-ended effects, including same-name text labels, timing remains manual. Outside encounter auto-profile manual fallback is available, with DM confirmation. Do not double count timing between workflows.

## Boundaries
The tracker does not control actual initiative order. No auto-expiry, Concentration link to other caster, or initial cast/save inference. The DM confirms source applicability, DC and expiration; remove ended sources explicitly before recording the next turn boundary. Reminder guard is product design, not SRD restriction. No global event receipts. Pending state and attempt count are stored with the condition record; existing character CAS and Undo protect writes. No DB version migration; older builds cannot load automatic profiles. Public NO GO.
