# GwenTable | Player Convergence 02

**Prepared 22 November 2026. Private source candidate; public release NO GO.**

## Authority and precise scope

Baseline is the byte-verified `GwenTable_Player_Convergence_01_Private_Source.zip`, SHA-256 `dd577c800dbc370e3510b8872f969b11cbb5ae2ce7bb9148fa42e86a0d61b59c`. This source remains descended from the earlier dev.6 snapshot. **Neither the separate dev.14 encounter branch nor the newer UX9 application was available for this merge.** No canonical Git repository, production account, or actual player data was changed.

## Completed: saved next-class intent, not active multiclassing

- Added `dist/lib/saved-multiclass-plan.mjs` for one **planned** next level in a distinct SRD class. It validates the current saved build's effective ability scores against the SRD 5.2.1 primary-ability prerequisites of **both** classes and total level 20. Options list prerequisites and disable ineligible choices.
- The Play Sheet's **XP & advancement** section can save, review or remove the non-active plan. An explicit checkbox acknowledges that this is only a planning note, not gameplay. Corrupt imported notes can be removed without executing them.
- The planning note lives on the **existing saved character record** as `multiclassPlan`. Saves use `characters.update(...,{expectedRevision,requireExisting:true})`, comparing the acknowledged token within the existing IndexedDB readwrite transaction. No database version change, no extra store and no separate inventory or Play record.
- The plan records only primary class/level, next class, next total level, and an effective six-ability snapshot. It contains no personal contact data, no independently authoritative spell/feature list and no editable execution script. The active draft, HP, spell slots, features, inventory, current XP, character Play and Undo remain unchanged.
- An imported plan is shape-validated and compared against the **current derived** build. If ability scores/class/level change, it displays **needs revalidation**; it is never silently activated. A safe read-only malformed-plan warning remains visible instead of modifying character state.
- The existing portable **individual and roster** backups preserve the plan through their validated extensions system; private browser revision tokens and inventory receipts are not included as portable metadata.
- Service worker cache revision is advanced and the new module is precached for the artwork-withheld offline preview.

## QA results

- 538 inherited Convergence 01 Node tests passed at baseline. The updated full source suite now contains **559 tests** (538 inherited + 21 new, pending clean-source package receipt).
- New cases cover validation, prerequisite failures, shape tampering, stale-plan detection, opt-in removal, one-step Play Undo preservation, builder edit preservation, individual and roster export/import, and a deterministic simulated IndexedDB revision-conflict/rollback fixture.
- Existing static build, private artwork-withheld preview, and artwork binary audit have passed. The preview excludes 12 inherited uncleared image/icon variants.

## Not implemented / next work

This feature **does not** implement active multiclass character progression. It grants **no** second-class armor/weapon/skill training, Hit Dice, HP, class features, subclass, spell preparation, Pact Magic, spell slot spending, or level-up effects. The current character model remains single-class, and it does not interpret the plan as an entitlement to abilities.

The next substantive slice should add a **validated active class-level allocation** and rework class-derived features/Hit Dice/resources in one coherent transaction, starting with a small supported class combination and genuine saved-character fixture. Do not alter active class rules or promises until the whole slice passes. Then expand to additional classes. Reconciliation with UX9/dev.14 remains a separate unresolved source-authority blocker.

Real full-app browser/IndexedDB, Windows Node 26, cross-tab browser acceptance, accessibility/hardware and release rights remain unverified. Synthetic Node IndexedDB tests are **not** real browser acceptance.

## Run

From the extracted private source (Node.js 22+):

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run dev:artwork-withheld-preview
```

Use synthetic characters in a separate browser profile and retain independent backups. Never overwrite the only copy of real player data. No public deployment is authorized.

**ENVIRONMENT: STAY in Chat/local** per explicit project direction; no Codex prerequisite or further parallel branch is assumed.
