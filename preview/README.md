# Survival preview (candidate)

Browser page that runs the unchanged Hazards v3 engine (`candidate/hazards-v3/src`) for one example character. Not the GwenTable website.

```bash
node preview/serve.mjs 8080
```

Open http://127.0.0.1:8080/. Browser tests (needs Playwright + Chromium):

```bash
node --test preview/test/preview.e2e.mjs
```
