# UI and source delta

Source identity remains the four existing English engine keys. The new **derived, nonpersisted** source IDs are `srd-5.2.1:background:<lowercase>`. No duplicate catalog records.

* `dist/background-choice.js`: source/variant IDs, `grants[]` with fixed `sourceType/sourceId/optionId/effectId/appliedVersion`, pending ability and equipment plans, Soldier tool review flag, traceable A/B equipment. Grant entries are **read-only descriptions**, not applied mutations.
* `dist/builder-choice-review.js`: adds `gamingSet` acknowledgment to existing `choiceReview.version=1`. Current unreviewed Soldier needs confirmation; editing selected kind reopens review; pre-v0.22.7 already-advanced/saved progress has compatibility fallback.
* `dist/app.js`: retains Class→Background→Languages and the same shared no-search choice dialog. Displays beginner overview, benefit glossary, Soldier chosen-kind confirmation and source-accurate A/B previews. Next blocks missing Background or Soldier tool confirmation. Confirmations only report success **after the draft write succeeds**; failure rolls back acknowledgement without deleting character fields.
* `dist/persist-state.js`: extracted latest-write-wins save-state guard; checks progress/choiceReview as well as draft. An earlier queued write cannot assert Saved for a newer revision.
* `dist/beginner-help.js` and `dist/locale-copy.js`: seven added terms, giving **18** bilingual contextual entries with two examples each; background-specific copy and error states.
* `dist/draft-recovery.js`: import resets new Gaming Set approval as well as Background and Magic Initiate; nested history also sanitized.
* `dist/sw.js`: cache revision updated and new `persist-state.js` precached for offline consistency.

Built-in Backgrounds and spell/feat/item catalog remain unchanged; selected Character Sheet/PDF only unlock after inherited completion checks plus new review issues. New source IDs do **not** migrate or rename the persisted legacy `background` value.

Font binaries are omitted from the portable export. System-font fallbacks preserve text legibility, with a minor visual variation from the uploaded baseline.
