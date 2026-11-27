const revision='open-5e-v0.25.7-inventory-dev.10-player-convergence08-integration11';
const files=['./lib/srd-live-modifiers.mjs','./lib/srd-shield.mjs','./lib/srd-dodge.mjs','./condition-sources.js','./lib/srd-condition-lifecycle.mjs','./live-check-preview.js','./spell-dice-fields.js','./lib/srd-live-check-preview.mjs','./lib/srd-d20-preview.mjs','./inventory-panel.js','./lib/saved-inventory.js','./lib/inventory-activation-backup.js','./lib/inventory-storage.js','./lib/srd-encumbrance.mjs','./lib/srd-item-catalog.mjs','./','./index.html','./compendium.js','./ui-icons.js','./character-entity-list.js','./sheet-entities.js','./dice-geometry.js','./lib/appearance.js','./lib/srd-compendium-index.js','./design/taverley/taverley-theme.css','./design/taverley/icons/character.svg','./design/taverley/icons/dice.svg','./design/taverley/icons/enemy.svg','./design/taverley/icons/exchange.svg','./design/taverley/icons/feat.svg','./design/taverley/icons/item.svg','./design/taverley/icons/search.svg','./design/taverley/icons/spell.svg','./branding/gwen-logo.png','./branding/gwen-favicon.ico','./branding/gwen-touch.png','./branding/gwen-portrait.webp','./design/theme.js','./design/tokens.css','./style.css','./bootstrap.js','./locale.js','./locale-copy.js','./app.js','./choice-guidance.js','./lib/srd-multiclass-preview.mjs','./lib/saved-multiclass-plan.mjs','./lib/saved-multiclass-levelup.mjs','./lib/saved-multiclass-rogue-entry.mjs','./lib/srd-fighter-rogue-live.mjs','./lib/activate-fighter-rogue.mjs','./lib/advance-fighter-rogue2.mjs','./lib/advance-fighter-rogue3.mjs','./builder-stages.js','./builder-completion.js','./builder-choice-review.js','./persist-state.js','./saved-character-build.js','./saved-character-completion.js','./saved-character-freshness.js','./gcx-export-freshness.js','./linked-gcx-update.js','./class-choice.js','./background-choice.js','./draft-recovery.js','./beginner-help.js','./builder-magic.js','./choice-reference.js','./character-guide.js','./play-guide.js','./dice-tools.js','./lib/distances.js','./identity-generator.js','./official-reference.js','./lib/official-rules.js','./lib/spell-effects.js','./sheet-export.js','./pdf-delivery-guard.js','./spell-picker.js','./lib/spell-reference.js','./lib/spell-headers.js','./lib/native-sheet-pdf.js','./lib/gwentable-sheet-v03.js','./stat-explanations.js','./vendor/pdf-lib.min.js','./lib/rules.js','./lib/storage.js','./lib/revision-tokens.js','./lib/portable.js','./lib/roster-sort.js','./lib/roster-view.js','./lib/gcx.mjs','./lib/gwentable-gcx.js','./lib/npc.js','./lib/character.js','./lib/barbarian-progression.js','./lib/monk-progression.js','./lib/paladin-progression.js','./lib/ranger-progression.js','./lib/catalog.js','./lib/tables.js','./lib/custom.js','./encounters.js','./lib/encounter.js','./lib/creatures.js','./play-sheet.js','./lib/play.js','./lib/combat-assist.js','./lib/rogue-strike.js','./lib/weapon-mastery.js','./lib/beast-reference.js','./lib/beast-combat.js','./lib/health.js'];
const onDemand=['./lib/srd-reader-pages.js','./dice-tray.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(revision).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('open-5e-')&&key!==revision).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Hash routes are handled by the app; all share the cached HTML document.
  url.hash='';
  const lazy=onDemand.some(path=>new URL(path,self.registration.scope).href===url.href);
  if(event.request.method!=='GET'||!lazy&&!files.some(path=>new URL(path,self.registration.scope).href===url.href)) return;
  const fallback=async ()=>{
    const cache=await caches.open(revision);
    return await cache.match(url.href)??Response.error();
  };
  event.respondWith(fetch(event.request).then(async response=>{
    if(lazy&&response.ok) {
      try {await (await caches.open(revision)).put(event.request,response.clone());} catch {}
    }
    return response;
  }).catch(fallback));
});
