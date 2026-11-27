# GwenTable MVP safety continuation | dev.5

Base: the user's `GwenTable-v0.25.7-inventory-dev.4-Source.zip`. This version adds an importable private backup-first UI gate for legacy inventory activation. No production account or user character data was modified. See `docs/MVP_RELEASE_SCOPE_v0.25.7-dev.5.md` and `PROJECT_STATE.md` for acceptance criteria and unverified gates.

Local verification:

```sh
npm test
npm run build
npm run verify:source
npm run build:artwork-withheld-preview
npm run audit:artwork-withheld-preview
npm run audit:public-art # expected nonzero: 12 inherited, uncleared artwork assets
```

To run locally, `npm run dev`. Do not expose the original development ZIP or the artwork-withheld QA preview publicly without satisfying rights, privacy, accessibility, browser and owner sign-off requirements. The new backup-first UI does not prove the downloaded file exists on disk; it depends on explicit confirmation and current revision checking.
