# GwenTable v0.25.1: Manual QA and acceptance checklist

**Automation does not replace manual verification.** Tester must record browser/OS, viewport, date, screenshots, console warnings, and observed vs expected result for each item. These are not claimed as completed.

1. Start `npm run dev` in an unrestricted desktop Chromium browser and confirm no JavaScript/runtime errors, failed assets or unhandled promise rejections.
2. Create and **finish** a supported level-8 Druid with a valid known Wolf form. Save and enter Play. Transform; confirm original Druid HP stays unchanged, Temporary HP and Wild Shape use are tracked, and source-linked Wolf AC 12/HP 11/speed 40 ft appear.
3. Roll a Wolf Bite vs target AC; confirm attack total, damage dice and typed damage, and verify enemy HP is not changed automatically.
4. Roll Beast attack with Advantage, Disadvantage and both; verify 2d20/2d20/1d20 selection and natural 1/20 behavior.
5. As Giant Wolf Spider or Giant Venomous Snake, confirm that a critical doubles both Pierce and Poison dice, not flat modifiers.
6. Validate a Brown Bear's Bite and Claw independently and read the Multiattack reminder. Verify the UI does not mark or consume multiple Actions automatically.
7. For Wolf/Boar/Giant Crab/Giant Toad, ensure Prone/Grappled/charge reminders do **not** change a target condition automatically.
8. At Druid level 2 try Brown Bear and Giant Spider: no automatic attack profile should be offered. At level 8 these should appear. Verify off-list homebrew forms display manual-only guidance.
9. Verify Giant Owl and Giant Eagle are not granted Beast automatic stat profiles under SRD 5.2.1.
10. Apply Exhaustion and compare attack d20 totals before/after. Try downed, dead and incapacitating conditions; Beast attack actions must reject.
11. Save, refresh, reopen, and Undo a Beast attack. Compare the persistent Play history and the initial state before and after Undo.
12. Export a private character backup and restore it into a fresh browser profile. Confirm form, resources and Attack history round-trip without revision tokens.
13. In two tabs, change a character's Play state in one tab; the stale tab must reject the write and offer a reopen path.
14. Switch 🇬🇧/🇮🇩 while Wild Shape and attacks are visible; labels and button remain understandable, history remains intact.
15. Complete keyboard-only and screen-reader review (visible focus, form labeling, target AC validation, button submission, status announcements, touch targets); repeat at 360px, 768px, 1280px and on a real mobile device.
16. Test offline first installation/reload and service-worker updates from v0.25.0, including cleared/uncleared cache behavior. Compare normal and artwork-withheld previews using isolated ports.
17. Inspect print/PDF, GCX exports and cross-tab revision gates for regressions; ensure new mechanics do not bypass completed-character authorization.
18. Confirm original artwork audit returns NO GO for 12 files; preview withholding does not get mistaken for an owner release approval.

**GO criteria:** no critical browser/runtime failures; no state corruption; no unresolved completion bypass; keyboard and screen-reader acceptance; explicit source/art/code license approval; owner deployment approval. Until then Sprint 02 G1 is REPAIR and public publication is NO GO.
