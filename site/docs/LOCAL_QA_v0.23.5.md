# GwenTable v0.23.5 | Individual saved-character portability | Local QA

**Coverage:** Unit tests verified; this is a manual acceptance guide, not evidence that a browser or user completed the scenarios. Run in a local browser with a separate test profile. Never overwrite a real user save as a fixture.

1. Open an existing valid saved character and record its Build, Play and Undo state. Export from Play. Import as a separate character; confirm that Build, HP/slots/XP, Play Undo, notes, private extension fields and supported GCX link survive.
2. Make another export of the imported character; compare its non-device fields with the previous export. Internal IDs and revision tokens must be new / excluded.
3. Import a v0.23.4 `character-play` backup containing only `draft` and `play`; confirm the legacy path remains usable.
4. Import a v0.23.4 `character` build-only export; confirm that it still loads without invented live state.
5. Create a normal private roster backup, reimport a character, then export it individually; confirm extension fields are stable across both routes.
6. Inject an unknown user notes field with JSON-safe nested values in an isolated IndexedDB character fixture. Export and reimport. No metadata loss.
7. Test invalid JSON keys, malformed checksum, unrecognized root fields, forbidden `extensions` collisions, overdeep and circular runtime data, as covered by automated fixtures. Files must not load as valid.
8. Test a character with more than 512 KiB of safe extension text. Individual export must fail before a download link is offered, with guidance to private roster backup.
9. Test EN and id-ID: the size-limit error and import markers for private extensions and Undo remain meaningful and readable.
10. Test an imported GCX-linked SRD build and validate retained link identity. Imported non-SRD GCX-only entries must remain private and not be presented as normal playable SRD characters.
11. Two tabs: update Play on tab A; verify tab B's next revision-dependent action detects the conflict; exports must not imply they refreshed newer changes from another tab.
12. At 320, 360, 390, 412, 768, 1024 and 1440 CSS px, 200% zoom, touch and keyboard, verify export/download and import review controls are operable and visible.
13. Screen reader: confirm import preview announces the presence of private metadata and Undo context; verify `role=status` feedback and focus restoration.
14. Offline refresh with service worker `open-5e-v0.23.5`: verify the new Play and portable modules are cached and update correctly after closing old tabs.
15. Attempt direct final character export/print/PDF with an incomplete build; completion gate must prevent access.
16. Inspect the public asset allowlist and every served artwork; no release until permissions are explicitly approved.

**Not yet run here:** real browser interactive test, actual IndexedDB concurrency, mobile devices, screen readers, real people, final printable/fillable PDF acceptance. Browser command-line smoke navigation timed out in this environment. Record actual observations before marking any of these PASS.
