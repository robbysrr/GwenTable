# Files withheld from this public repository

These Integration 11 files are not published here: 12 image/icon binaries without cleared rights, plus the Taverley design kit they belong to. Restore them from the private Integration 10 handover (`workspace/GwenTable-Integration10/`, unchanged since) before running `npm run verify:source`, which will otherwise report them missing.

| Path | SHA-256 |
|---|---|
| `dist/branding/gwen-favicon.ico` | `b09fa1d713f64f0487f570976139fd634f413e7779eb8a9e7f355d3147aad0e4` |
| `dist/branding/gwen-logo.png` | `0616262f70fa839ca7b0f5ec5b1b1aab67af9f1fc068bb69ba1444b549762a14` |
| `dist/branding/gwen-portrait.webp` | `c3fea296401ff52cb19296714ae696f2bd081f4f808902738a8766be59345801` |
| `dist/branding/gwen-touch.png` | `d573baf7b9c3e33d59c113e4a22ae4d975caffc2208cddf1821e042335d899a7` |
| `dist/design/taverley/LICENSE.txt` | `1d1ad9f7162e6f55291c9da9228e8ddedc84d3e27fc6637a95261df3d3c3bc77` |
| `dist/design/taverley/icons/character.svg` | `b0d7ed74755fbecccc0873d11d77093097e530edcc2b6cc0c707349dd3fa2422` |
| `dist/design/taverley/icons/dice.svg` | `aa6b3cfa7c72ff16cf415fc4bfb45dc1dc6fa128bd515e0bb28385948f829f99` |
| `dist/design/taverley/icons/enemy.svg` | `74c38c10f124b9e1d6e1ef65f2e0f581b3669d7dc8fe7f8242e4f99feba34bf1` |
| `dist/design/taverley/icons/exchange.svg` | `42642e028e98c0a9b52f5735eb0e19617bd959508cb9d47be8ecbeb0f3b95afd` |
| `dist/design/taverley/icons/feat.svg` | `e4d94d45a633f9b1b6ec4f9f6f70bdc4a30a80226a788c845681b60bf55e422c` |
| `dist/design/taverley/icons/item.svg` | `da8ad633744e3a913cc58bd30a240d6ea56327ef128425d84969b76788d94829` |
| `dist/design/taverley/icons/search.svg` | `46b1fc8eb06c859317407c8c6271f23ec9b8fea7f52cdf53e8463c295c6ace8c` |
| `dist/design/taverley/icons/spell.svg` | `3d6771b1d389fbc464e1d2d7fb5c85a83bbe7097b778742a44c1ed552f0f16a3` |
| `dist/design/taverley/taverley-theme.css` | `cfc1a71a10a6bbfe227d1234110b8411dd39e374c0ddcfd00900237509d016ab` |

## Effect on checks in this public copy
Without these files, `npm run build` (asset-reference check) and 3 tests fail: `tests/artwork-withheld-preview.test.js`, "actual GwenTable local assets stay blocked…", "shipped icon mappings resolve…". Measured at Integration 13: 823 pass / 3 fail here. With the files restored the full tree passes 831/831, the build and the art audit.
