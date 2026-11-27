# GwenTable v0.24.3 | Manual Browser QA Checklist

This guide describes **UNTESTED manual acceptance cases**, not successfully completed tests. Use actual Chrome/Firefox/Safari, one mobile device if possible, and an assistive technology reader for the screen-reader cases. Back up any real characters first.

1. At `http://127.0.0.1:4173`, confirm the sidebar displays one compact toggle with two recognizable flags (English left, Indonesia right), not two separate buttons.
2. Click the toggle: `html[lang]` becomes `id`, visible UI copy becomes Indonesian, the gold thumb moves to the Indonesia flag, `aria-checked` is `true`, and `aria-label` identifies Bahasa Indonesia and the action to return to English.
3. Click again: language returns to `en`, gold thumb moves left, `aria-checked` becomes `false`, `aria-label` and `title` update to English.
4. Refresh after selecting Indonesian: same selected state and copy persist without user intervention; a v0.24.2 browser language setting should be honored without migration.
5. Tab from the preceding control to the toggle, press Space then Enter, and verify each activation changes language exactly once, retains keyboard focus and does not submit the builder form.
6. Verify screen reader announces switch, checked/unchecked and meaningful current/next language in both locales. Native button behavior is covered only by source/Node tests; this must be tested with real assistive tech.
7. On 320px, 360px, 390px widths and landscape, verify one readable control, both flags visible, no overflow or covered Next button.
8. Test light/dark theme and Windows high-contrast/forced-colors mode: selected side, keyboard focus, and flag alternative remain perceivable.
9. With reduced-motion preference on, verify no sliding animation.
10. With active unsaved builder notes and Play fields, toggle language; text input and characters remain unchanged. Test locale switching with an open modal and after reload.
11. Block localStorage access and confirm the toggle still works within the current tab, without falsely claiming persistence.
12. Run the artwork-withheld preview on port 4174; the same toggle must work using CSS flags only and the preview should expose no denied image assets.
13. Verify existing save/reopen, multi-tab revision conflict, GCX/PDF download and accessibility workflows from earlier handoffs. These are not certified by this UX-only patch.

**Acceptance gate:** G1 remains REPAIR until unrestricted browser tests and saved-data/accessible-controls checks are actually conducted. Original artwork distribution approval remains blocked for 12 binaries.
