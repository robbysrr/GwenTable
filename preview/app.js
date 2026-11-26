// GwenTable survival preview: a browser host for the unchanged Hazards v3 candidate.
// This page plays the "trusted host" role for a single local example character.
// It is a preview, not the GwenTable website, its save schema or its character sheet.
import {createSession, sessionView, applyCommand} from './engine/survival-session.mjs';
import {previewDay} from './engine/survival.mjs';

const KEY = 'gwentable.survival-preview.v1';
const LANG_KEY = 'gwentable.survival-preview.lang';
const FORMAT = 'gwentable.survival-preview.v1';
const ACTOR = 'pc1';
const SOURCES = ['other', 'suffocation', 'dehydration', 'dehydrationLocked', 'malnutrition', 'malnutritionLocked'];
const REMOVABLE = ['other', 'suffocation', 'dehydration', 'malnutrition'];

const T = {
  en: {
    eyebrow: 'GwenTable · SRD 5.2.1', title: 'Daily survival',
    candidate: 'Candidate preview of the Hazards v3 rules engine. This is not the GwenTable website, its saves or its character sheet. Data stays in this browser only.',
    character: 'Character', size: 'Size', needs: 'Daily needs', exhaustion: 'Exhaustion', d20: 'D20 Tests', speed: 'Speed',
    immune: 'Immune to Exhaustion (table ruling)', supplies: 'Supplies carried', water: 'Water', food: 'Food',
    stocknote: 'Supplies are example quantities in whole ounces, not real inventory items.',
    recovery: 'Recovery and other effects',
    restnote: "Finishing a Long Rest removes 1 Exhaustion level. Dehydration or malnutrition levels stay locked until the character drinks or eats a full day's amount.",
    restfrom: 'Remove level from', longrest: 'Finished a Long Rest', addother: 'Other effect: gain 1 Exhaustion',
    day: 'Day', halfmark: 'The line marks half the daily need.', drink: 'Drink (fl oz)', eat: 'Eat (oz)', consume: 'Consume…',
    ifends: 'If the day ends now', closeday: 'End the day…', log: 'Receipts', data: 'Save data', export: 'Export JSON', copy: 'Copy',
    import: 'Import JSON', load: 'Load snapshot', newsize: 'New example size', reset: 'Start new example…',
    adapt: 'Rules adapted into original code (Dehydration, Malnutrition, Exhaustion). Indonesian labels are draft translations. Not endorsed by Wizards of the Coast.',
    confirm: 'Confirm', cancel: 'Cancel', rev: n => `revision ${n}`, level: n => `Level ${n} of 6`, none: 'None',
    d20v: n => n ? `−${n} to every roll` : 'No penalty', speedv: n => n ? `−${n} ft` : 'No penalty',
    src: {other: 'Other effects', suffocation: 'Suffocation', dehydration: 'Dehydration', dehydrationLocked: 'Dehydration (locked)', malnutrition: 'Malnutrition', malnutritionLocked: 'Malnutrition (locked)'},
    lockedHint: 'Locked levels need a full day of water or food before a Long Rest can remove them.',
    of: (a, b) => `${a} of ${b}`,
    fWaterBad: 'Water below half: gain 1 Exhaustion level (dehydration).', fWaterOk: 'Water at least half: no dehydration.',
    fFoodSave: 'Ate less than half: DC 10 Constitution saving throw, or gain 1 Exhaustion level.',
    fFoodOk: 'Food at least half: no malnutrition.',
    fFoodAuto: n => `No food for ${n} days: gain 1 Exhaustion level automatically.`,
    fFoodCount: n => `No food today: day ${n} without food. Exhaustion starts at the end of day 5.`,
    fImmune: 'Marked immune to Exhaustion: no levels will be gained.',
    cConsume: (w, f) => `Record that the character consumed ${w} fl oz of water and ${f} oz of food? Supplies go down by the same amount.`,
    cClose: d => `End day ${d}? Today's intake is locked in and the results above apply.`,
    cRest: s => `Record a finished Long Rest and remove 1 level from ${s}?`,
    cOther: 'Record 1 Exhaustion level from another effect, such as a spell or monster ability?',
    cReset: 'Start a new example? The current example and its receipts are replaced.',
    cImport: 'Replace the current example with the imported snapshot? Its effects are not applied again.',
    pTitle: 'Constitution saving throw needed', pBody: d => `Day ${d}: the character ate less than half of the food they need. Roll a DC 10 Constitution saving throw at the table.`,
    pHow: 'Include the character\'s Constitution save modifier, the Exhaustion penalty and any Advantage or Disadvantage. Then record the result. Other actions wait until this is resolved.',
    pSuccess: 'Saved (10 or higher)', pFail: 'Failed (9 or lower)',
    dead: 'The character has 6 Exhaustion levels and dies. Revival is handled outside this preview.',
    ok: {consume: 'Supplies consumed.', close: 'Day ended.', pending: 'Record the saving throw to finish the day.', save: 'Saving throw recorded.', rest: 'Long Rest recorded.', other: 'Exhaustion level added.', reset: 'New example started.', import: 'Snapshot loaded.', copy: 'Copied.'},
    err: {
      qty: 'Enter whole numbers of 0 or more, and at least one amount above 0.',
      stock: 'Not enough supplies carried for that amount.',
      tab: 'This example changed in another tab. The latest version is now shown; try again.',
      json: 'That text is not a valid survival snapshot.',
      storage: 'This browser is not saving data, so the example resets when the page closes.',
      copy: 'Copy failed. Select the text and copy it manually.', generic: m => `The rules engine rejected this: ${m}`,
    },
    synced: 'Updated from another tab.', loadFail: 'Saved data could not be read, so a new example was started.',
    l: {
      'supplies-consumed': p => `Consumed ${p.waterFlOz} fl oz water, ${p.foodOz} oz food.`,
      'exhaustion-gained': p => `+${p.amount} Exhaustion (${T.en.src[p.source]}).`,
      'exhaustion-removed': p => `−${p.amount} Exhaustion (${T.en.src[p.source]}).`,
      'recovery-unlocked': p => `${T.en.src[p.source]} recovery unlocked for ${p.amount} level(s).`,
      'save-required': p => `Day ${p.day}: DC 10 Constitution saving throw required.`,
      'save-resolved': p => `Day ${p.day}: Constitution saving throw ${p.outcome === 'success' ? 'succeeded' : 'failed'}.`,
      'day-closed': p => `Day ${p.day} ended.`, 'long-rest': () => 'Long Rest finished.', 'other-effect': () => 'Other effect recorded.',
      'death': () => 'Death: 6 Exhaustion levels.', 'started': p => `New ${p.size} example started.`, 'imported': () => 'Snapshot imported.',
    },
  },
  id: {
    eyebrow: 'GwenTable · SRD 5.2.1', title: 'Kebutuhan harian',
    candidate: 'Pratinjau kandidat mesin aturan Hazards v3. Ini bukan situs GwenTable, data simpanannya, atau lembar karakternya. Data hanya tersimpan di browser ini.',
    character: 'Karakter', size: 'Ukuran', needs: 'Kebutuhan harian', exhaustion: 'Exhaustion', d20: 'D20 Test', speed: 'Speed',
    immune: 'Kebal terhadap Exhaustion (keputusan meja)', supplies: 'Persediaan yang dibawa', water: 'Air', food: 'Makanan',
    stocknote: 'Persediaan berupa contoh dalam ons bulat, bukan item inventaris sungguhan.',
    recovery: 'Pemulihan dan efek lain',
    restnote: 'Menyelesaikan Long Rest menghapus 1 level Exhaustion. Level akibat dehidrasi atau kekurangan gizi tetap terkunci sampai karakter minum atau makan sesuai kebutuhan satu hari penuh.',
    restfrom: 'Hapus level dari', longrest: 'Long Rest selesai', addother: 'Efek lain: tambah 1 Exhaustion',
    day: 'Hari', halfmark: 'Garis menandai setengah kebutuhan harian.', drink: 'Minum (fl oz)', eat: 'Makan (oz)', consume: 'Konsumsi…',
    ifends: 'Jika hari berakhir sekarang', closeday: 'Akhiri hari…', log: 'Catatan', data: 'Data simpanan', export: 'Ekspor JSON', copy: 'Salin',
    import: 'Impor JSON', load: 'Muat snapshot', newsize: 'Ukuran contoh baru', reset: 'Mulai contoh baru…',
    adapt: 'Aturan diadaptasi menjadi kode orisinal (Dehydration, Malnutrition, Exhaustion). Label bahasa Indonesia masih draf terjemahan. Tidak didukung oleh Wizards of the Coast.',
    confirm: 'Konfirmasi', cancel: 'Batal', rev: n => `revisi ${n}`, level: n => `Level ${n} dari 6`, none: 'Tidak ada',
    d20v: n => n ? `−${n} untuk setiap lemparan` : 'Tanpa penalti', speedv: n => n ? `−${n} ft` : 'Tanpa penalti',
    src: {other: 'Efek lain', suffocation: 'Kekurangan napas', dehydration: 'Dehidrasi', dehydrationLocked: 'Dehidrasi (terkunci)', malnutrition: 'Kekurangan gizi', malnutritionLocked: 'Kekurangan gizi (terkunci)'},
    lockedHint: 'Level terkunci membutuhkan air atau makanan satu hari penuh sebelum Long Rest dapat menghapusnya.',
    of: (a, b) => `${a} dari ${b}`,
    fWaterBad: 'Air kurang dari setengah: tambah 1 level Exhaustion (dehidrasi).', fWaterOk: 'Air minimal setengah: tidak ada dehidrasi.',
    fFoodSave: 'Makan kurang dari setengah: Constitution Saving Throw DC 10, atau tambah 1 level Exhaustion.',
    fFoodOk: 'Makanan minimal setengah: tidak ada kekurangan gizi.',
    fFoodAuto: n => `Tanpa makanan selama ${n} hari: otomatis tambah 1 level Exhaustion.`,
    fFoodCount: n => `Tidak makan hari ini: hari ke-${n} tanpa makanan. Exhaustion mulai di akhir hari ke-5.`,
    fImmune: 'Ditandai kebal terhadap Exhaustion: tidak ada level yang bertambah.',
    cConsume: (w, f) => `Catat bahwa karakter mengonsumsi ${w} fl oz air dan ${f} oz makanan? Persediaan berkurang sebanyak itu.`,
    cClose: d => `Akhiri hari ke-${d}? Asupan hari ini dikunci dan hasil di atas berlaku.`,
    cRest: s => `Catat Long Rest yang selesai dan hapus 1 level dari ${s}?`,
    cOther: 'Catat 1 level Exhaustion dari efek lain, misalnya spell atau kemampuan monster?',
    cReset: 'Mulai contoh baru? Contoh saat ini beserta catatannya akan diganti.',
    cImport: 'Ganti contoh saat ini dengan snapshot impor? Efeknya tidak diterapkan ulang.',
    pTitle: 'Constitution Saving Throw diperlukan', pBody: d => `Hari ke-${d}: karakter makan kurang dari setengah kebutuhannya. Lempar Constitution Saving Throw DC 10 di meja.`,
    pHow: 'Sertakan modifier Constitution save karakter, penalti Exhaustion, serta Advantage atau Disadvantage jika ada. Lalu catat hasilnya. Aksi lain menunggu sampai ini selesai.',
    pSuccess: 'Berhasil (10 atau lebih)', pFail: 'Gagal (9 atau kurang)',
    dead: 'Karakter memiliki 6 level Exhaustion dan mati. Kebangkitan ditangani di luar pratinjau ini.',
    ok: {consume: 'Persediaan dikonsumsi.', close: 'Hari berakhir.', pending: 'Catat hasil saving throw untuk menyelesaikan hari.', save: 'Saving throw dicatat.', rest: 'Long Rest dicatat.', other: 'Level Exhaustion ditambahkan.', reset: 'Contoh baru dimulai.', import: 'Snapshot dimuat.', copy: 'Tersalin.'},
    err: {
      qty: 'Masukkan bilangan bulat 0 atau lebih, dengan minimal satu jumlah di atas 0.',
      stock: 'Persediaan yang dibawa tidak cukup untuk jumlah itu.',
      tab: 'Contoh ini berubah di tab lain. Versi terbaru kini ditampilkan; coba lagi.',
      json: 'Teks itu bukan snapshot kebutuhan harian yang valid.',
      storage: 'Browser ini tidak menyimpan data, jadi contoh akan diulang saat halaman ditutup.',
      copy: 'Gagal menyalin. Pilih teksnya lalu salin secara manual.', generic: m => `Mesin aturan menolak ini: ${m}`,
    },
    synced: 'Diperbarui dari tab lain.', loadFail: 'Data simpanan tidak dapat dibaca, jadi contoh baru dimulai.',
    l: {
      'supplies-consumed': p => `Mengonsumsi ${p.waterFlOz} fl oz air, ${p.foodOz} oz makanan.`,
      'exhaustion-gained': p => `+${p.amount} Exhaustion (${T.id.src[p.source]}).`,
      'exhaustion-removed': p => `−${p.amount} Exhaustion (${T.id.src[p.source]}).`,
      'recovery-unlocked': p => `Pemulihan ${T.id.src[p.source].toLowerCase()} tersedia untuk ${p.amount} level.`,
      'save-required': p => `Hari ke-${p.day}: Constitution Saving Throw DC 10 diperlukan.`,
      'save-resolved': p => `Hari ke-${p.day}: Constitution Saving Throw ${p.outcome === 'success' ? 'berhasil' : 'gagal'}.`,
      'day-closed': p => `Hari ke-${p.day} berakhir.`, 'long-rest': () => 'Long Rest selesai.', 'other-effect': () => 'Efek lain dicatat.',
      'death': () => 'Mati: 6 level Exhaustion.', 'started': p => `Contoh baru ukuran ${p.size} dimulai.`, 'imported': () => 'Snapshot diimpor.',
    },
  },
};

const $ = id => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
};
let lang = store.get(LANG_KEY) === 'id' ? 'id' : 'en';
const t = () => T[lang];
let state;
let toastMsg = null;

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fmtGal = n => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '');
const fmtWater = oz => `${oz} fl oz (${fmtGal(oz / 128)} gal)`;
const fmtFood = oz => `${oz} oz (${fmtGal(oz / 16)} lb)`;
const entry = (key, params = {}) => ({key, params, rev: state?.session?.revision ?? 0});

function exampleState(size = 'medium') {
  let session = createSession({actorId: ACTOR, size, stock: {waterFlOz: 640, foodOz: 80}});
  const log = [{key: 'started', params: {size}, rev: 0}];
  // Example starting point: part of the day's food and water already consumed.
  const cmd = {id: newId(), type: 'consume', actorId: ACTOR, expectedRevision: 0, confirmed: true, waterFlOz: 48, foodOz: 4};
  const r = applyCommand(session, cmd, hostContext(cmd));
  session = r.state;
  for (const e of r.effects) log.push(effectEntry(e, 1));
  return {format: FORMAT, session, log};
}

function hostContext(cmd, extra = {}) {
  // Single-user local preview: the page itself is the only actor and authorizes its own commands.
  return {actorId: ACTOR, authorized: true, commandId: cmd.id, commandType: cmd.type, ...extra};
}

function effectEntry(e, rev) {
  const {type, ...params} = e;
  return {key: type, params, rev};
}

function parseSnapshot(text) {
  const obj = JSON.parse(text);
  const candidate = obj && obj.format === FORMAT ? obj : {format: FORMAT, session: obj, log: []};
  sessionView(candidate.session); // throws on anything the engine would not accept
  if (candidate.session.actorId !== ACTOR) throw new Error('actor');
  if (!Array.isArray(candidate.log)) candidate.log = [];
  candidate.log = candidate.log.filter(x => x && typeof x.key === 'string' && T.en.l[x.key]).slice(-200);
  return candidate;
}

function readStored() {
  const raw = store.get(KEY);
  if (raw === null) return null;
  return parseSnapshot(raw);
}

function persist() { return store.set(KEY, JSON.stringify(state)); }

function toast(msg, kind = 'ok') { toastMsg = {msg, kind}; renderToast(); }
function renderToast() {
  const el = $('status');
  el.replaceChildren();
  if (!toastMsg) return;
  const d = document.createElement('div');
  d.className = `toast ${toastMsg.kind}`;
  d.textContent = toastMsg.msg;
  el.append(d);
}

function errText(e) {
  const m = String(e?.message || e);
  if (/stock/.test(m)) return t().err.stock;
  if (/stale|revision/.test(m)) return t().err.tab;
  return t().err.generic(m);
}

// Run one command through the engine. Compare the stored revision first so two
// tabs cannot both commit on the same revision (simple check-and-set in localStorage).
function run(type, fields, extra, okKey, logBefore = [], logAfter = []) {
  let stored = null;
  try { stored = readStored(); } catch { toast(t().err.json, 'err'); return false; }
  if (stored && JSON.stringify(stored.session) !== JSON.stringify(state.session)) {
    state = stored; render(); toast(t().err.tab, 'err'); return false;
  }
  const cmd = {id: newId(), type, actorId: ACTOR, expectedRevision: state.session.revision, confirmed: true, ...fields};
  let r;
  try { r = applyCommand(state.session, cmd, hostContext(cmd, extra)); } catch (e) { toast(errText(e), 'err'); return false; }
  const rev = r.state.revision;
  const entries = [...logBefore, ...r.effects.map(e => effectEntry(e, rev)), ...logAfter].map(x => ({...x, rev}));
  state = {format: FORMAT, session: r.state, log: [...state.log, ...entries].slice(-200)};
  const saved = persist();
  render();
  toast(saved ? t().ok[okKey] : t().err.storage, saved ? 'ok' : 'err');
  return true;
}

function confirmBox(containerId, text, onYes) {
  clearConfirms();
  const host = $(containerId);
  const box = document.createElement('div');
  box.className = 'confirm';
  const p = document.createElement('p');
  p.textContent = text;
  const row = document.createElement('div');
  row.className = 'row';
  const yes = document.createElement('button');
  yes.type = 'button'; yes.className = 'primary'; yes.textContent = t().confirm; yes.id = `${containerId}-yes`;
  const no = document.createElement('button');
  no.type = 'button'; no.textContent = t().cancel; no.id = `${containerId}-no`;
  yes.onclick = () => { clearConfirms(); onYes(); };
  no.onclick = () => clearConfirms();
  box.addEventListener('keydown', e => { if (e.key === 'Escape') clearConfirms(); });
  row.append(yes, no); box.append(p, row); host.append(box);
  yes.focus();
}
function clearConfirms() {
  for (const id of ['confirm-consume', 'confirm-close', 'confirm-side', 'confirm-reset']) $(id).replaceChildren();
}

function li(text, cls) { const el = document.createElement('li'); el.textContent = text; if (cls) el.className = cls; return el; }

function render() {
  const s = state.session;
  const v = sessionView(s);
  const tx = t();
  const ledger = s.survival.ledger;
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) { const val = tx[el.dataset.t]; if (typeof val === 'string') el.textContent = val; }
  $('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
  $('lang-id').setAttribute('aria-pressed', String(lang === 'id'));
  $('rev').textContent = tx.rev(v.revision);
  $('size-v').textContent = s.survival.size;
  $('needs-v').textContent = `${fmtWater(v.needs.waterFlOz)} · ${fmtFood(v.needs.foodOz)}`;

  // Exhaustion track: one pip per level, coloured and labelled by source.
  const levels = SOURCES.flatMap(k => Array(ledger[k]).fill(k));
  const track = $('track');
  track.replaceChildren();
  track.setAttribute('aria-label', `${tx.exhaustion}: ${tx.level(v.exhaustion)}`);
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('div');
    const src = levels[i];
    d.className = 'pip' + (src ? ` on s-${src}` : '') + (src && src.endsWith('Locked') ? ' locked' : '') + (v.terminal ? ' dead' : '');
    d.textContent = String(i + 1);
    if (src) d.title = tx.src[src];
    track.append(d);
  }
  $('d20-v').textContent = tx.d20v(2 * v.exhaustion);
  $('speed-v').textContent = tx.speedv(5 * v.exhaustion);
  const srcList = $('sources');
  srcList.replaceChildren();
  const present = SOURCES.filter(k => ledger[k] > 0);
  if (!present.length) srcList.append(li(`${tx.exhaustion}: ${tx.none}`));
  for (const k of present) srcList.append(li(`${tx.src[k]}: ${ledger[k]}`, k.endsWith('Locked') ? 'save' : 'bad'));
  if (present.some(k => k.endsWith('Locked'))) srcList.append(li(tx.lockedHint));

  $('stock-w').textContent = fmtWater(v.stock.waterFlOz);
  $('stock-f').textContent = fmtFood(v.stock.foodOz);
  $('day-v').textContent = v.pending ? v.pending.day : v.day;
  $('in-w').textContent = tx.of(`${v.intake.waterFlOz} fl oz`, `${v.needs.waterFlOz}`);
  $('in-f').textContent = tx.of(`${v.intake.foodOz} oz`, `${v.needs.foodOz}`);
  $('bar-w').style.width = `${Math.min(100, 100 * v.intake.waterFlOz / v.needs.waterFlOz)}%`;
  $('bar-f').style.width = `${Math.min(100, 100 * v.intake.foodOz / v.needs.foodOz)}%`;

  const immune = $('immune').checked;
  const fc = $('forecast');
  fc.replaceChildren();
  if (v.terminal) fc.append(li(tx.dead, 'bad'));
  else {
    const p = previewDay(s.survival, {exhaustionImmune: immune});
    if (immune) fc.append(li(tx.fImmune, 'good'));
    else {
      fc.append(p.waterShort ? li(tx.fWaterBad, 'bad') : li(tx.fWaterOk, 'good'));
      if (p.foodSave) fc.append(li(tx.fFoodSave, 'save'));
      else if (s.survival.foodOz === 0) fc.append(p.automaticFoodGain ? li(tx.fFoodAuto(p.foodlessDays), 'bad') : li(tx.fFoodCount(p.foodlessDays), 'save'));
      else fc.append(li(tx.fFoodOk, 'good'));
    }
  }

  // Pending saving throw prompt.
  const pend = $('pending');
  pend.replaceChildren();
  if (v.pending) {
    const box = document.createElement('div');
    box.className = 'prompt'; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-labelledby', 'p-title');
    const h = document.createElement('h3'); h.id = 'p-title'; h.textContent = tx.pTitle;
    const b = document.createElement('p'); b.textContent = tx.pBody(v.pending.day);
    const how = document.createElement('p'); how.className = 'small muted'; how.textContent = tx.pHow;
    const row = document.createElement('div'); row.className = 'row';
    for (const [outcome, label] of [['success', tx.pSuccess], ['failure', tx.pFail]]) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.id = `save-${outcome}`; btn.textContent = label;
      btn.className = outcome === 'success' ? 'primary' : 'danger';
      btn.onclick = () => resolveSave(outcome);
      row.append(btn);
    }
    box.append(h, b, how, row);
    pend.append(box);
  }

  const blocked = Boolean(v.pending) || v.terminal;
  for (const id of ['btn-consume', 'btn-close', 'btn-other', 'q-w', 'q-f', 'immune']) $(id).disabled = blocked;
  const sel = $('rest-src');
  const prev = sel.value;
  sel.replaceChildren();
  for (const k of REMOVABLE.filter(k => ledger[k] > 0)) {
    const o = document.createElement('option'); o.value = k; o.textContent = `${tx.src[k]} (${ledger[k]})`; sel.append(o);
  }
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  sel.disabled = blocked || !sel.options.length;
  $('btn-rest').disabled = sel.disabled;

  const log = $('log');
  log.replaceChildren();
  for (const x of [...state.log].reverse()) {
    const fn = tx.l[x.key];
    log.append(li(`#${x.rev} · ${fn(x.params || {})}`, x.key === 'death' ? 'bad' : ''));
  }
  $('out').value = JSON.stringify(state, null, 2);
  renderToast();
}

function intOrNull(str) {
  if (str.trim() === '') return 0;
  const n = Number(str);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

function onConsume(e) {
  e.preventDefault();
  const w = intOrNull($('q-w').value), f = intOrNull($('q-f').value);
  if (w === null || f === null || (w === 0 && f === 0)) { toast(t().err.qty, 'err'); return; }
  const v = sessionView(state.session);
  if (w > v.stock.waterFlOz || f > v.stock.foodOz) { toast(t().err.stock, 'err'); return; }
  confirmBox('confirm-consume', t().cConsume(w, f), () => run('consume', {waterFlOz: w, foodOz: f}, {}, 'consume'));
}

function onClose() {
  const day = state.session.survival.day;
  confirmBox('confirm-close', t().cClose(day), () => {
    const immune = $('immune').checked;
    const willPend = Boolean(previewDay(state.session.survival, {exhaustionImmune: immune}).foodSave);
    const ok = run('close-day', {day}, {closedDay: day, exhaustionImmune: immune}, willPend ? 'pending' : 'close', [], willPend ? [] : [{key: 'day-closed', params: {day}}]);
    if (ok && willPend) $('save-success')?.focus();
  });
}

function resolveSave(outcome) {
  const p = state.session.pending;
  run('resolve-save', {reminderId: p.id},
    {closedDay: p.day, exhaustionImmune: p.exhaustionImmune, saveResult: {reminderId: p.id, actorId: ACTOR, ability: 'constitution', dc: 10, outcome}},
    'save', [{key: 'save-resolved', params: {day: p.day, outcome}}], [{key: 'day-closed', params: {day: p.day}}]);
  $('btn-close').focus();
}

function onRest() {
  const src = $('rest-src').value;
  if (!src) return;
  confirmBox('confirm-side', t().cRest(t().src[src]), () =>
    run('recover', {source: src}, {recoveryApproved: true, recoverySource: src}, 'rest', [{key: 'long-rest'}]));
}

function onOther() {
  confirmBox('confirm-side', t().cOther, () =>
    run('add-other', {}, {exhaustionEffectApproved: true, amount: 1, exhaustionImmune: $('immune').checked}, 'other', [{key: 'other-effect'}]));
}

function onReset() {
  confirmBox('confirm-reset', t().cReset, () => {
    state = exampleState($('new-size').value);
    const saved = persist(); render(); toast(saved ? t().ok.reset : t().err.storage, saved ? 'ok' : 'err');
  });
}

function onImport() {
  let next;
  try { next = parseSnapshot($('in').value); } catch { toast(t().err.json, 'err'); return; }
  confirmBox('confirm-reset', t().cImport, () => {
    next.log.push({key: 'imported', params: {}, rev: next.session.revision});
    state = next;
    const saved = persist(); render(); toast(saved ? t().ok.import : t().err.storage, saved ? 'ok' : 'err');
  });
}

async function onCopy() {
  const area = $('out');
  try { await navigator.clipboard.writeText(area.value); toast(t().ok.copy); }
  catch { area.focus(); area.select(); toast(t().err.copy, 'err'); }
}

function setLang(next) { lang = next; store.set(LANG_KEY, next); toastMsg = null; clearConfirms(); render(); }

function boot() {
  let loadFailed = false;
  try { state = readStored(); } catch { state = null; loadFailed = true; }
  if (!state) { state = exampleState(); persist(); }
  $('f-consume').addEventListener('submit', onConsume);
  $('btn-close').onclick = onClose;
  $('btn-rest').onclick = onRest;
  $('btn-other').onclick = onOther;
  $('btn-reset').onclick = onReset;
  $('btn-import').onclick = onImport;
  $('btn-copy').onclick = onCopy;
  $('immune').onchange = render;
  $('lang-en').onclick = () => setLang('en');
  $('lang-id').onclick = () => setLang('id');
  window.addEventListener('storage', e => {
    if (e.key === LANG_KEY && (e.newValue === 'en' || e.newValue === 'id')) { lang = e.newValue; render(); return; }
    if (e.key !== KEY) return;
    try { const next = readStored(); if (next) { state = next; clearConfirms(); render(); toast(t().synced); } } catch { /* ignore unreadable writes */ }
  });
  render();
  if (loadFailed) toast(t().loadFail, 'err');
}

boot();
