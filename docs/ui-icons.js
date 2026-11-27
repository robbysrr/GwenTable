// Static, first-party UI glyphs. Source and rights: audit/icon-registry.json.
const shapes={
  "tav-character": "<circle cx=\"12\" cy=\"7.5\" r=\"3.3\"/><path d=\"M5.5 20v-2a6.5 6.5 0 0 1 13 0v2\"/>",
  "tav-dice": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3\"/><circle cx=\"9\" cy=\"9\" r=\"1\"/><circle cx=\"15\" cy=\"15\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>",
  "tav-enemy": "<path d=\"M4 5l5 6-5 8 8-3 8 3-5-8 5-6-8 3z\"/><circle cx=\"9\" cy=\"12\" r=\".8\"/><circle cx=\"15\" cy=\"12\" r=\".8\"/>",
  "tav-exchange": "<path d=\"M4 7h15l-4-4m4 4-4 4M20 17H5l4-4m-4 4 4 4\"/>",
  "tav-feat": "<path d=\"M12 2l2.6 6.5H22l-5.7 4.2 2.2 7.3L12 16l-6.5 4 2.2-7.3L2 8.5h7.4z\"/>",
  "tav-item": "<rect x=\"4\" y=\"6\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M8 6V4a4 4 0 0 1 8 0v2M4 11h16\"/>",
  "tav-search": "<circle cx=\"10\" cy=\"10\" r=\"6\"/><path d=\"m14.5 14.5 5.5 5.5\"/>",
  "tav-spell": "<path d=\"M12 2l1.8 7.5L21 12l-7.2 2.5L12 22l-1.8-7.5L3 12l7.2-2.5z\"/>",
  "gwen-overview": "<path d=\"M3 10l9-7 9 7M5 9v11h14V9M10 20v-6h4v6\"/>",
  "gwen-create": "<path d=\"M12 5v14M5 12h14\"/>",
  "gwen-filter": "<path d=\"M3 5h18l-7 8v5l-4 2v-7z\"/>",
  "gwen-archive": "<path d=\"M5 3h14v18H5zM8 8h8M8 12h8M8 16h5\"/>",
  "gwen-attack": "<path d=\"M3 21l5-5m-3-3 6 6m-4-4L18 4l3-1-1 3L9 17\"/>",
  "gwen-language": "<path d=\"M3 4h18v13h-9l-5 4v-4H3zM7 9h10m-10 4h6\"/>",
  "gwen-edit": "<path d=\"M4 20l4-1 12-12-3-3L5 16zM14 7l3 3\"/>",
  "gwen-save": "<path d=\"M4 4h13l3 3v13H4zM8 4v6h8V4M8 20v-6h8v6\"/>",
  "gwen-help": "<path d=\"M6 21h14m-14 0a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h13v15H7a2 2 0 0 0-2 2M8 8h8m-8 4h6\"/>",
  "gwen-reset": "<path d=\"M4 15a8 8 0 1 0 1-7m0 0V3m0 5h5\"/>",
  "gwen-close": "<path d=\"M6 6l12 12M18 6 6 18\"/>",
  "gwen-trash": "<path d=\"M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5\"/>",
  "gwen-warning": "<path d=\"M12 3 2 20h20zM12 9v5m0 3h.01\"/>",
  "gwen-info": "<path d=\"M12 10v7m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z\"/>",
  "gwen-up": "<path d=\"M12 20V4m-6 6 6-6 6 6\"/>"
};
const semantic={
  "character": "tav-character",
  "dice": "tav-dice",
  "enemy": "tav-enemy",
  "exchange": "tav-exchange",
  "feat": "tav-feat",
  "item": "tav-item",
  "search": "tav-search",
  "spell": "tav-spell",
  "overview": "gwen-overview",
  "create": "gwen-create",
  "filter": "gwen-filter",
  "archive": "gwen-archive",
  "attack": "gwen-attack",
  "language": "gwen-language",
  "edit": "gwen-edit",
  "save": "gwen-save",
  "help": "gwen-help",
  "reset": "gwen-reset",
  "close": "gwen-close",
  "trash": "gwen-trash",
  "warning": "gwen-warning",
  "info": "gwen-info",
  "up": "gwen-up",
  "class": "tav-character",
  "subclass": "tav-character",
  "species": "tav-character",
  "background": "gwen-help",
  "trait": "tav-feat",
  "slot": "tav-spell",
  "check": "tav-search"
};

// Canonical IDs remain data identifiers. Until per-record artwork is supplied,
// resolve only installed semantic glyphs and explicitly report that fallback.
export function resolveIcon({entityType='item',canonicalId,subtype,context}={}) {
  const aliases={'ability-score':'dice',ability:'dice',skill:'check',tool:'check',training:'check',navigation:'overview',error:'warning',success:'feat',expand:'up'};
  const kind=Object.hasOwn(aliases,entityType)?aliases[entityType]:entityType;
  const assetId=Object.hasOwn(semantic,kind)?semantic[kind]:Object.hasOwn(shapes,kind)?kind:'tav-item';
  return {assetId,fallbackId:assetId,provenance:'audit/icon-registry.json',uniqueIllustration:false};
}

export function icon(kind) {
  const {assetId:image}=resolveIcon({entityType:kind});
  const cssKind=Object.hasOwn(semantic,kind)?kind:'item';
  return `<span class="entry-icon entry-icon-${cssKind}" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">${shapes[image]}</svg></span>`;
}

export function mountInterfaceIcons(root) {
  for(const target of root.querySelectorAll('[data-ui-icon]')) target.insertAdjacentHTML('afterbegin',icon(target.dataset.uiIcon));
}
export function iconFor(type) {
  if(/subclass/i.test(type)) return 'subclass';
  if(/class|feature/i.test(type)) return 'class';
  if(/species|lineage/i.test(type)) return 'species';
  if(/trait/i.test(type)) return 'trait';
  if(/feat|boon|style/i.test(type)) return 'feat';
  if(/spell|cantrip|magic/i.test(type)) return 'spell';
  if(/skill|check|training|expertise/i.test(type)) return 'check';
  if(/enemy|creature/i.test(type)) return 'enemy';
  if(/background/i.test(type)) return 'background';
  if(/character/i.test(type)) return 'character';
  return 'item';
}
