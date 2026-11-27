# Browser acceptance results | Integration 11 | 27 November 2026

Environment: Linux container, headless Chromium build 1243 (Playwright 1.63.0), Node 22.23.5, artwork-withheld preview on 127.0.0.1. Synthetic generated characters, seeded randomness. Suite `browser-acceptance/uat.e2e.mjs`, final run 12/12 pass. Not tested: headed Chrome/Edge on Windows, the Windows launcher on port 42636, real phones, screen readers, 200% zoom.

| ID | Result | What actually happened |
|---|---|---|
| UAT-01 | PASS after 2 fixes | Fighter 5 (seed 1) and Wizard 5 (seeds 7, 8) generated, every step confirmed, saved, reloaded from IndexedDB `open-5e-companion` with the same level, class and HP. Level 3 template keeps its scores. Before the fixes, Magic Initiate backgrounds could not finish (missing confirm button) and Standard Array Wizards showed blank scores. Rolled HP is explained on the sheet (12 at level 1 + rolled dice). Unsupported-choice labelling not separately assessed. |
| UAT-02 | PARTIAL | Save preview exercised with Bless (d20 10 + sheet modifier + Bless 3 = shown total). Skill check refuses Bless dice. Advantage cancellation and Exhaustion covered by Node tests only. |
| UAT-03 | NODE ONLY | Concentration save with Bless d4 tested in Node, not clicked in the browser. |
| UAT-04 to UAT-10 | NOT RUN | Condition sources, Hold timing, elapsed time, Nature's Veil, Dodge, Shield, Shield of Faith: not exercised in the browser this session. Existing Node tests pass. |
| UAT-11 | PASS | 5 damage, reload keeps it, Undo restores full HP and persists, "Export play backup" produces a JSON download containing the character. GCX and roster exports not exercised. |
| UAT-12 | PASS | Second page on the same origin, opened before the edit, tried to apply 3 damage: refused with "This saved character changed in another tab…"; the first tab's value survived reload (no lost update). The stale tab does not refresh itself; the player reopens. |
| UAT-13 | PASS | With the network switched off, reload rendered the saved character with current HP (service worker + IndexedDB). Cache revision update after a new deploy not tested. |
| UAT-14 | PASS (overflow only) | No horizontal page overflow at 360, 390, 768 and 1280 px on overview, builder and play sheet. Keyboard order, focus, zoom and screen reader: not tested. |
| UAT-15 | PASS | Language toggle sets `lang="id"`, translates navigation and persists across reload; Bless/Bane panel shows Indonesian labels. A tampered play backup (name replaced with an `<img onerror>` payload) is refused with "The file failed its integrity check" and nothing is imported. The same payload typed as a name renders as literal text on the sheet and in Saved Characters and never runs. |
| UAT-16 | NOT RUN | PDF sheet mapping and export parity not exercised. |
