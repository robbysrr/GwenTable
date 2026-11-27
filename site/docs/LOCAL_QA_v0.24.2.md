# GwenTable v0.24.2 | Real-browser acceptance checklist

Local-only source under test. Use an unrestricted desktop browser, and a phone/browser if available. **Do not mark these as PASS based on automated Node tests.**

1. Run `npm test` (expected 265) and `npm run build`.
2. Run `npm run dev`, open `http://127.0.0.1:4173`; create and save a completed SRD character with confirmed choices.
3. Saved Characters -> Print / PDF -> Generate. Verify a PDF with a descriptive filename is prepared and downloads successfully. Print to A4 and Letter; confirm no clipping and inspect at least one fillable field.
4. Generate the PDF in tab A, then edit and save that character in tab B. Return to A and click **Download character PDF**. Expected: file is NOT delivered, Blob URL is revoked, and the dialog requests reopening the current character.
5. Repeat step 4 for **Open PDF in new tab**. Expected: only a temporary blank tab can appear; it closes on rejection. No stale PDF is navigated to.
6. Repeat with a still-current saved record. Download and Open must both produce the PDF. Open must not be blocked on supported browsers; if popups are blocked, the UI must advise Download.
7. Delay the IndexedDB read (browser dev tools), click Download twice rapidly, then let the first read complete. Expected: no duplicate downloads from simultaneous clicks.
8. Close the PDF dialog while a slow revision check is running. Expected: no file delivery and no broken blank tab.
9. Simulate an IndexedDB read failure. Expected: fail closed, no PDF delivery, actionable error. Resume after restoring storage.
10. Change PDF paper/notes settings after generation. The old output must disappear and its Blob URL must be revoked; regenerate before clicking.
11. Repeat steps 3-10 at 320px/200% zoom, keyboard-only, English and Bahasa Indonesia. Check focus restoration, button names, screen-reader text, popup behavior and reduced-motion settings.
12. Test a legacy character without completion approval. Play and PDF must remain blocked pending builder review; after review/save the current record may export.
13. Run `npm run build:artwork-withheld-preview`, `npm run audit:artwork-withheld-preview`, then `npm run dev:artwork-withheld-preview`; verify no missing assets disrupt the choice or PDF controls.
14. Confirm local assets are NOT deployed publicly: `npm run audit:public-art` must still report 12 uncleared files. Rights approval is an independent owner gate.

Record browser name/version/OS, screenshot or video only if actually obtained, and PASS/FAIL/BLOCKED/NOT TESTED per scenario. Suggested focus: test all critical actions on a real device before Sprint 02 G1 is marked GO.
