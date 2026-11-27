# GwenTable v0.23.8 | Manual browser and accessibility QA

**Status: NOT EXECUTED in a usable browser**. These are handoff scenarios, not claims of passing actual device or participant tests.

## Set up

1. Extract the ZIP. In its root, run `npm test`, `npm run build`, `npm run dev`.
2. Use an isolated browser profile. Download a backup before injecting corrupt fixtures.
3. Use DevTools IndexedDB `open-5e-companion` > `characters`. Do not edit real user data.
4. Work in EN and id-ID at 320, 360, 390, 412 and desktop widths; also 200% zoom and keyboard-only navigation.

## Acceptance scenarios (record PASS/FAIL with screenshot, browser and version)

1. **Clean roster:** create/save two valid SRD characters; both show normally. Full backup enabled; partial button hidden.
2. **One malformed draft:** add synthetic record `id:'broken-qa',draft:{model:2,name:'Broken',className:'NotAClass'}`. Reload Saved Characters. Healthy characters remain visible; the bad entry shows **Saved record needs recovery**.
3. **No silent omissions:** full backup disabled and warning names excluded record count. The warning must remain visible when download feedback changes.
4. **Partial export:** click **Export readable characters only**. Filename prominently contains `PARTIAL`; verify downloaded payload contains only the two healthy records, not `broken-qa`.
5. **Partial import:** import the partial file as new copies in another isolated profile. Verify valid records, private notes and custom fields; verify corrupted entry was **not** imported. Do not treat this as a complete backup.
6. **Recovery file:** click the bad record's **Download recovery copy** and inspect `kind:'saved-record-recovery'`, `visibility:'private'`, exact original record data, SHA-256 envelope; try normal Import. It must reject the file, not open it as a valid character.
7. **Data conservation:** reread IndexedDB after export; ensure bad and healthy entries are unchanged. Confirm no automatic repair, migration or deletion.
8. **Malformed GCX:** add one GCX record missing `character.name`/classes. Ensure isolation and fallback.
9. **Unportable extension:** save one otherwise valid character with a `Date`, `Map`, sparse array or nested unsupported field. It should remain visible but excluded from standard backup; recovery download should fail safely if JSON-fidelity cannot be guaranteed, leaving data intact.
10. **Missing ID:** inspect a malformed record with missing/nonstring ID from synthetic data. Rendering should fail only for that record, not the entire list; no dangerous delete/edit action.
11. **Locale:** switch EN ↔ Bahasa Indonesia. Warning/action labels remain accurate; character source IDs and amounts unchanged.
12. **Keyboard/a11y:** Tab through partial-export and recovery buttons, check focus, action names, reading order and `role=status`. No invisible focus traps or horizontal overflow at 320px.
13. **Old data:** load an earlier v0.23.7 roster and draft, verify valid characters still accessible, legacy approval behavior unchanged and new page does not mutate records on reading.
14. **Multi-tab:** open two tabs, edit a valid saved character, save in one tab, confirm second tab detects conflict rather than overwriting.
15. **Completion guard:** malformed and legacy unapproved records never enter Play/final PDF, including direct URL or import attempts; valid reviewed/saved record still can.
16. **PDF and offline:** verify real print/PDF and offline refresh/service worker v0.23.8 after update; capture mobile screenshots and accessibility results.

**Release:** Do not approve Sprint 02 G1 until real browser IndexedDB, import/export, mobile and accessibility checks pass. Public release additionally requires 12 artwork rights approvals. No actual beginner participants were involved in this source-level update.
