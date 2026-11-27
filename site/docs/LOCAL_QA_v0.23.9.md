# GwenTable v0.23.9 | Local QA instructions (not execution evidence)

1. Run `npm run dev` on port 4173. Existing Gwen logo and hero image should still appear. Never deploy this unapproved-art build.
2. Run `npm run build:artwork-withheld-preview` and `npm run dev:artwork-withheld-preview` on port 4174. Page should show a readable **G** lettermark and abstract star hero fallback, not broken image placeholders.
3. Confirm the preview contains no `.svg`, `.png`, `.webp`, `.ico`, `.jpg`, `.gif`, or `.avif` files. Original development artwork must remain untouched.
4. Run `npm run audit:public-art`: expected exit 2 and **12** not-cleared assets. Do not fill the allowlist without explicit approval.
5. Run `npm run audit:artwork-withheld-preview`: expected artwork-only pass with **0 image binaries**.
6. Check GET `/index.html`, `/app.js`, `/style.css`, `/sw.js`, `/licenses/original-ui-kit-MIT.txt` return 200 on port 4174. Old `/branding/gwen-logo.png` and `/design/taverley/icons/dice.svg` must return 404.
7. Check the preview service worker caches no removed artwork, uses `open-5e-artwork-withheld-v0.23.9`, and never installs under the normal 4173 origin.
8. On mobile 320/360/390/412px and 200% zoom, assess fallback branding contrast, layout, disabled motion, language flags, hero spacing, no horizontal overflow.
9. Keyboard-only: navigate Home → Create → Saved Characters → Rules; check visible focus, readable controls and no trapping. Test with a screen reader; these are **manual checks**, not certified by Node tests.
10. Verify the full original SRD attribution and independent-site disclaimer remain visible. Check the MIT license still appears through its updated link. The `PUBLICATION_NOT_APPROVED.txt` should be present.
11. In the browser, restore an older character backup, create a draft, exercise Play/final PDF authorization, two-tab conflict, damaged-record recovery, and draft reload. The static preview builder should not change these paths.
12. Run completion and print/PDF from an approved character and verify actual document layout separately. This iteration does not certify PDF or form output.

**Evidence collected by automation:** source/static tests, output byte scan and local HTTP when documented in `EXPORT_TEST_RESULTS.txt`. **Not performed by automation:** real browser interaction, device/screen-reader testing, actual PDF print, legal signoff and participant research. They remain G1/G2 release blockers.
