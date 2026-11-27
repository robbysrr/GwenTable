# GwenTable Player Convergence 05 (PRIVATE)

This is **source code and a local website**, not an officially released application. It is descended from Convergence 04 and the dev.6 branch, **not** an authenticated UX9/dev.14 source merge.

### Locally run and verify

Install Node.js 22 or later, then extract the ZIP and run from its source folder:

```sh
npm test
npm run build
npm run verify:source
npm run dev:artwork-withheld-preview
```

Open the loopback URL printed by the server. The artwork-withheld preview excludes 12 unpublished inherited image/icon assets. Use test data in a separate browser origin/profile; back up any genuine records before attempting import. There is no public deployment approval.

### Using the first active multiclass feature

1. Build and save a **Fighter level 1** who meets Fighter + Rogue multiclass prerequisites and has a valid character build.
2. Accumulate the next total-level XP threshold or request explicit GM milestone authorization.
3. In the saved Play Sheet, choose future class **Rogue**, prepare the level-up HP checkpoint and complete the Rogue skill, Expertise, language and mastery choices.
4. Export a private character JSON backup before activation. Finish active combat or Concentration.
5. Confirm **Activate Fighter 1 / Rogue 1**. The atomic transaction changes the saved active character but not the original Fighter 1 build draft. Reopen the Play Sheet to inspect total level 2 and both class Hit Dice.
6. Play using the attack assistant; confirm Sneak Attack qualifying facts. Your second-class starting equipment is **not** granted. If your saved build differs or a second tab edited the record, the operation fails closed.

Only this **Fighter1/Rogue1** combination is active. Other class combinations remain saved previews and checkpoints. Composite PDF and GCX output from this active character are deliberately blocked: use the private character JSON backup instead. Do not open the old single-class Builder for an active composite; the application blocks it to preserve data.

### Provenance and QA

`CHANGELOG_PLAYER_CONVERGENCE_05.md` and `PROJECT_STATE.md` identify supported behavior and gaps. `QA_RECEIPT_CONVERGENCE_05.json` records actual verification. Public release is **NO GO** until current UX9/dev.14 source, genuine saved-character migrations, real browser UAT, licensing, accessibility and security are verified.
