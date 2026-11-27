# GwenTable v0.23.7 | Saved-character completion acceptance guide

Status: **MANUAL / BROWSER NOT VERIFIED**. These are instructions for future QA, NOT results from human participants. Use a private backup of any existing character before testing, and use synthetic records for destructive scenarios. 19 November 2026.

## Run

`npm run dev` from the extracted project folder (Node 22+), then open the printed local URL. If port 4173 is occupied, set `PORT=4198` before starting. Use a fresh private browser profile for synthetic tests. Test EN and Bahasa Indonesia independently.

## Scenarios (record PASS/FAIL/NOT TESTED with screenshot or repro)

1. Create a new Human Fighter/Soldier, confirm Species, Class, Background, Gaming Set, Languages, Class training/Feats, ability increases and both equipment kits. Finish/skip Appearance. Save; check Play opens and a new completed receipt exists in the saved IndexedDB record.
2. Without confirmation on the same new draft, verify completed sheet, Save Character, final Print/PDF, GCX and Play remain unavailable. Draft backup must still work.
3. Seed a synthetic **v0.23.6** character with a mechanically valid Build but no `completionApproval`. Saved Characters must show **Review build**, not Play/Print/GCX, with an explanation. Its notes, Play, Undo, and unknown fields must remain intact.
4. Try direct URL `#play/<legacy-id>` for that synthetic legacy record. Verify no Play controls or final export are exposed; the page tells the player to reopen and review it.
5. Choose **Review build**. Confirm every required choice, then visit or skip Appearance. Verify the application preserves pre-existing notes and current Play resources when Save Character is used. Only then should Play and PDF become available.
6. Change the saved character's Class or Background. Before reconfirming dependent choices, verify Play/final sheet/GCX are gated and no private notes, purchased items or Play/Undo history are lost.
7. Open the same completed saved record in two tabs. Make a Build change in tab A and save, then try saving or applying a Play action from tab B. Confirm the stale revision is rejected and recovery backup remains available.
8. Change appearance or story after completion. The saved receipt must not authorize the changed Build until Appearance is reviewed/skipped and the updated record is successfully saved.
9. Export a completed character as an individual Play file and as a private roster backup. Import copies into a clean browser profile. Verify private JSON-compatible extension metadata and Play/Undo are preserved, but completion authorization is **not** transferred. Review imported copies before Play/PDF.
10. Tamper with a synthetic roster backup to insert `completionApproval` inside `extensions`, recompute the file checksum, and attempt import. The unsafe local authorization key must be rejected.
11. Export and reimport a draft backup with a forged `finished`, `appearanceDecision` or nested `completionApproval`. Verify these values are not accepted as completion authority and previous drafts remain recoverable.
12. Test the Play Print/PDF button, roster Print/PDF action, browser print, and `#play` deep-link for an approved and an unapproved saved character. Verify both dialog entry and submit-time eligibility.
13. Simulate IndexedDB read/write failure or quota error. A failed save cannot create a trusted receipt or show success. The current unsaved draft must remain available for private backup.
14. Test at 320/360/390/768/1440 CSS px, 200% zoom, keyboard-only navigation, Escape/focus restoration, screen reader and id-ID. Ensure review warnings and required confirm controls are discoverable. No actual device, AT or novice participant testing was performed in this development run.
15. Test service-worker upgrade from v0.23.6 to v0.23.7 on a controlled local origin. Verify `saved-character-completion.js` precaches and no mixed-version builder modules execute.
16. Verify SRD v5.2.1 attribution remains visible, and `npm run audit:public-art` still returns NO GO until rights for all served artwork are actually approved.

## Evidence standard

Record real browser/version/device, QA tester, timestamp, video/screenshot where available, and PASS/FAIL with reproduction steps. A successful unit suite is not equivalent to these tasks. Any unauthenticated user must retain access to their draft and private backup even when final completion is gated.
