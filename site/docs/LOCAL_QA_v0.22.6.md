# GwenTable v0.22.6: local browser acceptance checks

Automated checks are not real-browser proof. Use an isolated browser profile. **First export any existing local or online drafts/characters as backups**, because localhost storage is separate and tests intentionally create, change, and restore records.

## Run locally

From the extracted project root (Node.js 22+):

```sh
npm run dev
```

Open `http://127.0.0.1:4173/#create`. In another terminal run `npm run build && npm test`. The project uses no npm install for its included runtime and unit tests. Keep the hostname and port consistent when checking persistence. If you see stale files, first inspect/clear localhost service-worker cache after exporting local drafts.

## Required manual scenarios

| ID | Steps | Expected result |
| --- | --- | --- |
| C01 Fresh Background | New draft; type a character name; Next through Class to Background; click Next before confirmation. | Remains on Background; readable action points to **Use this Background**; no sheet/export allowed. |
| C02 Confirm same default | On Background, choose **Use this Background** and click Next. | Advances to Languages. After going Back, Background displays as confirmed. |
| C03 Change via dialog | On Background, open a different option. Press Cancel/X/Escape. Then reopen and Confirm. | Cancel makes no edit or acknowledgement; Confirm first writes a recovery snapshot then applies the new Background; Restore is available. |
| C04 Background mutation under persistence denial | Disable storage in browser DevTools or reproduce a save failure; try confirming a Background change. | Do not mutate character if `saveBefore` fails; show explicit failure text. Export a draft backup rather than asserting a successful save. |
| C05 Magic Initiate from Background | Choose Acolyte or Sage; advance to Spells; try Next before confirmation; change a cantrip, then confirm. | Pending gate blocks Next; choices visibly include casting ability, two cantrips, 1st-level spell; confirming current values unlocks Next. |
| C06 Magic Initiate from Human | Choose Human with Magic Initiate Origin feat or change a Human Soldier to Criminal (the engine can replace duplicate Alert with Magic Initiate). | The Human feat's spell-list and spells appear; completing Spells requires explicit confirmation. |
| C07 Stale magic acknowledgement | Confirm Magic Initiate, then edit one cantrip/spell or the source spell list. | Review returns to pending; cannot finish until re-confirmation. |
| C08 Save and reload | Confirm Background and Magic Initiate, advance, reload on the **same origin**, revisit those steps. | Previously confirmed values remain confirmed, and any pending confirmations remain pending. No extra feats/spells/coins granted. |
| C09 Draft backup authority | Download a draft backup; Load it; Restore the imported draft; revisit Background and Spells. | Imported record is not considered finalized or saved; both confirmations reset even if the original was complete; its raw source content survives. |
| C10 Legacy character | Open a previously saved valid character in Saved Characters. | Old choices survive, the sheet is editable, no forced migration overwrites its data. |
| C11 Completion gates | Try to finish the Appearance step and export before pending confirmations. Then confirm them and finish Appearance. | No final sheet/PDF/character export before completion, then legitimate final actions become available. |
| C12 Language toggle | Switch English ↔ Bahasa Indonesia while on pending confirmation panels. | New text is localized; original class, Background, feat and spell names remain canonical; calculations remain identical. |
| C13 Keyboard and dialog | Use Tab/Shift+Tab, Enter/Space, Escape and dialog Cancel/X through all confirmation paths. | Logical focus order, visible focus, no trapped keyboard, no inadvertent confirmation. |
| C14 Mobile and assistive technology | Repeat C01-C12 at 320px and 375px, 200% zoom, portrait/landscape, and with a screen reader. | No clipped approval buttons/overlap; explanations and validation actions are announced clearly. |
| C15 PDF/print | Finish one noncaster and one caster, save, then exercise actual PDF and browser-print routes. | Correct eligibility, expected page output; no premature PDF for incomplete character. |
| C16 Offline upgrade | Load v0.22.6, go offline and reload using the same origin; inspect service worker/cache state. | Cached new module loads or a clear offline failure is shown; never claim the change was saved unless persistence succeeded. |

Record actual browser/version, viewport, date, device, observed behavior, pass/fail and a screenshot or console trace for each run. **Until the P0 browser journeys pass, keep production NO GO.**
