# Day04 browser, phone, keyboard, screen-reader verification

**Not verified in browser.** Existing older managed Playwright navigation to localhost reported `ERR_BLOCKED_BY_ADMINISTRATOR`; this run served `GET /` = 200 but headless Chromium `--dump-dom` timed out with no document result. This is not a CSS/visual QA pass.

Manual acceptance now required on an unrestricted local machine (see `docs/LOCAL_QA_v0.22.7.md`): four-option popup without search/keyboard; X (44px), Escape and safe backdrop; key focus return; 320px portrait and 200% zoom with Indonesian text; Soldier selected Game Set pre/post confirmation and exact kit A; delayed and quota-failed saves; pre-existing draft save/reload, restore and icon failure; final printable PDF valid/invalid access.

Participant usability sessions **0**; actual screen reader passes **0**; real devices **0**; emulators **0**; screenshots **0**. Source has semantic fallbacks and a native dialog, but no accessibility conformance certification is claimed.
