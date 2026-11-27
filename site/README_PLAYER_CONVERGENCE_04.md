# GwenTable Convergence 04 | Private Player-facing Development

Built from the verified Convergence 03 source. This website is **not** the newer UX9/dev.14 merged application. No live data or production deployment was touched.

## Run

- Extract the COMPLETE private source ZIP to a new folder.
- Install Node.js 22+ for local testing (Windows release acceptance target Node26).
- Run `npm test`, `npm run build`, `npm run verify:source`.
- Use `npm run dev:artwork-withheld-preview` to launch the private artwork-free local review server. Open the printed localhost URL in a private browser profile. **Do not import your only copy of real saved characters.**

## What changed

Under Saved Characters → Play Sheet → XP & Advancement, the **Rogue multiclass class-entry choices** form becomes available when a saved qualifying Fighter → Rogue plan and approved HP/XP checkpoint are current. Choose one Rogue skill, two eligible Expertise skills, a language, and two weapon mastery kinds, then check the non-activation consent box. The form validates exact eligibility and saves the choices in a single revision-checked saved character transaction. Existing Play resources are left alone.

The projection shows distinct class-level Hit Dice and projected HP, but **no secondary class feature can be used yet**. Reapproving a plan or checkpoint clears its dependent choices; imports remain private extensions.

## Boundaries

Only Fighter (level 1–19) → Rogue level 1 has the first class-entry choice implementation. No Warlock/Pact Magic, spellcaster mixing, full multiclass activation, alternate classes, new equipment/coin transfer, or automatic class-feature actions are introduced. Actual Windows/Node26 and persistent two-tab real browser tests are not verified. The artwork-withheld preview contains no uncleared binary images. Public release **NO GO**.
