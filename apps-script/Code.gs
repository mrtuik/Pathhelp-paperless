// Pathhelp — Paperless entry backend (Google Apps Script). Works as a standalone project (script.google.com) or bound to a Sheet.
// Phone page  : open the Web App URL → take a photo of the Horiba rack screen → numbers are read → confirm → saved.
// Extension   : reads the list with  <URL>?action=list&token=…  and marks a PT done with  action=done&id=…
// Setup steps are in SETUP.md.

const SHEET_NAME = 'Samples';
const LOT_GAP_MIN = 10;                       // photos further apart than this start a new Lot
const HEADERS = ['ts', 'lot', 'rack', 'pos', 'id', 'done'];

// Run this ONCE from the editor: it creates the sheet tab and a secret token (see Execution log).
function setup() {
  const props = PropertiesService.getScriptProperties();
  let t = props.getProperty('TOKEN');            // keep the existing token if there is one (running setup again must not break the extension / phone page)
  if (!t) { t = Utilities.getUuid().replace(/-/g, '').slice(0, 12); props.setProperty('TOKEN', t); }
  const sh = getSheet_();
  readRows_(sh).forEach((r) => strike_(sh, r.row, r.done));   // re-apply the strike-through to rows already done
  Logger.log('YOUR TOKEN: ' + t);
  Logger.log('SHEET: ' + getSpreadsheet_().getUrl());
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.action) {
    return HtmlService.createHtmlOutputFromFile('Upload')
      .setTitle('Pathhelp photos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (!check_(p.token)) return json_({ ok: false, error: 'bad token' });
  if (p.action === 'list') return json_({ ok: true, lots: lots_() });
  if (p.action === 'done') return json_(markDone_(String(p.id || ''), p.value !== '0'));
  return json_({ ok: false, error: 'unknown action' });
}

// JSON API for your own app (TypeScript etc.). POST with Content-Type "text/plain" (no CORS pre-flight):
//   { token, action: 'ocr',  image: <base64 jpeg, no prefix>, mime?: 'image/jpeg' }  → { ok, rack, ids, raw }
//   { token, action: 'save', rack: 1, ids: ['260725PT130', …], newLot?: false }       → { ok, lot, rack, added, updated }
//   { token, action: 'list' }                                                          → { ok, lots }
//   { token, action: 'done', id: '260725PT130', value?: '0' }                          → { ok }
//   { token, action: 'editRack',   lot: 3, rack: 4, newRack: 5, ids: ['260725PT130', …] } → { ok, lot, rack, added, updated, removed }   (ids = the full new list, in order)
//   { token, action: 'deleteRack', lot: 3, rack: 4 }                                    → { ok, removed }
//   { token, action: 'editLot',    lot: 3, newLot: 7 }                                  → { ok, lot }
//   { token, action: 'deleteLot',  lot: 3 }                                             → { ok, removed }
function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (_) { return json_({ ok: false, error: 'bad json' }); }
  if (!check_(b.token)) return json_({ ok: false, error: 'bad token' });
  try {
    if (b.action === 'ocr') return json_(Object.assign({ ok: true }, ocrPhoto(b.token, b.image, b.mime)));
    if (b.action === 'save') return json_(Object.assign({ ok: true }, savePhoto(b.token, b.rack, b.ids, b.newLot)));
    if (b.action === 'list') return json_({ ok: true, lots: lots_() });
    if (b.action === 'done') return json_(markDone_(String(b.id || ''), b.value !== '0' && b.value !== false));
    if (b.action === 'editRack') return json_(Object.assign({ ok: true }, editRack(b.token, b.lot, b.rack, b.newRack, b.ids)));
    if (b.action === 'deleteRack') return json_(Object.assign({ ok: true }, deleteRack(b.token, b.lot, b.rack)));
    if (b.action === 'editLot') return json_(Object.assign({ ok: true }, editLot(b.token, b.lot, b.newLot)));
    if (b.action === 'deleteLot') return json_(Object.assign({ ok: true }, deleteLot(b.token, b.lot)));
    return json_({ ok: false, error: 'unknown action' });
  } catch (er) { return json_({ ok: false, error: String((er && er.message) || er) }); }
}

// ───────── called from the phone page (google.script.run) ─────────
function ocrPhoto(token, b64, mime) {
  if (!check_(token)) throw new Error('Wrong token');
  const text = ocr_(b64, mime || 'image/jpeg');
  const r = parse_(text);
  return { rack: r.rack, ids: r.ids, raw: text.slice(0, 600) };
}

function savePhoto(token, rack, ids, forceNew) {
  if (!check_(token)) throw new Error('Wrong token');
  const clean = [];
  (ids || []).forEach((x) => { const id = String(x).toUpperCase().replace(/\s+/g, ''); if (/^\d{6}PT\d{1,4}$/.test(id) && clean.indexOf(id) < 0) clean.push(id); });
  if (!clean.length) throw new Error('No valid PT numbers to save');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_();
    const rows = readRows_(sh);
    const plan = planSave_(rows, Date.now(), Number(rack) || 1, clean, !!forceNew);
    plan.updates.forEach((u) => sh.getRange(u.row, 3, 1, 2).setValues([[u.rack, u.pos]]));
    if (plan.inserts.length) sh.getRange(sh.getLastRow() + 1, 1, plan.inserts.length, HEADERS.length).setValues(plan.inserts);
    return { lot: plan.lot, rack: Number(rack) || 1, added: plan.inserts.length, updated: plan.updates.length };
  } finally { lock.releaseLock(); }
}

// ───────── logic (pure — easy to test) ─────────
function parse_(text) {
  const fix = (s) => s.toUpperCase().replace(/[O]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
  const ids = [];
  const re = /([0-9OILSB]{6})\s*[PF]\s*[T7]\s*([0-9OILSB]{1,4})/gi;
  let m;
  while ((m = re.exec(text))) {
    const d = fix(m[1]), n = fix(m[2]).replace(/^0+(?=\d)/, '');
    const mo = +d.slice(2, 4), da = +d.slice(4, 6);
    if (!/^\d{6}$/.test(d) || !/^\d+$/.test(n) || mo < 1 || mo > 12 || da < 1 || da > 31) continue;
    const id = d + 'PT' + n;
    if (ids.indexOf(id) < 0) ids.push(id);
  }
  let rack = null;
  const rm = /RACK\s*NUMBER\D{0,3}([0-9OIL]{1,2})/i.exec(text);
  if (rm) { const v = parseInt(fix(rm[1]), 10); if (v > 0) rack = v; }
  return { ids: ids, rack: rack };
}

// rows: [{row, ts, lot, rack, pos, id, done}]  →  where each id goes (which Lot / Rack / position)
function planSave_(rows, now, rack, ids, forceNew) {
  let lot = 1;
  if (rows.length) {
    const last = rows.reduce((a, b) => (b.ts >= a.ts ? b : a));
    const maxLot = Math.max.apply(null, rows.map((r) => r.lot));
    lot = maxLot;
    const inLot = rows.filter((r) => r.lot === lot);
    const overlap = ids.some((id) => inLot.some((r) => r.id === id));       // same rack photographed again
    const maxRack = Math.max.apply(null, inLot.map((r) => r.rack));
    const gap = now - last.ts > LOT_GAP_MIN * 60000;
    if (forceNew || (!overlap && (gap || rack <= maxRack))) lot = maxLot + 1;
  }
  const updates = [], inserts = [];
  ids.forEach((id, i) => {
    const ex = rows.find((r) => r.lot === lot && r.id === id);
    if (ex) updates.push({ row: ex.row, rack: rack, pos: i + 1 });
    else inserts.push([now, lot, rack, i + 1, id, false]);
  });
  return { lot: lot, updates: updates, inserts: inserts };
}

function lotsFrom_(rows) {
  const byLot = {};
  rows.forEach((r) => { (byLot[r.lot] = byLot[r.lot] || []).push(r); });
  return Object.keys(byLot).map(Number).sort((a, b) => b - a).map((lot) => {
    const rs = byLot[lot], racks = {};
    rs.forEach((r) => { (racks[r.rack] = racks[r.rack] || []).push(r); });
    return {
      id: lot,
      start: Math.min.apply(null, rs.map((r) => r.ts)),
      racks: Object.keys(racks).map(Number).sort((a, b) => a - b).map((k) => ({
        rack: k,
        items: racks[k].sort((a, b) => a.pos - b.pos).map((r) => ({ id: r.id, done: !!r.done })),
      })),
    };
  });
}

// ───────── edit / delete (Lot and Rack) ─────────
function cleanIds_(ids) {
  const clean = [];
  (ids || []).forEach((x) => { const id = String(x).toUpperCase().replace(/\s+/g, ''); if (/^\d{6}PT\d{1,4}$/.test(id) && clean.indexOf(id) < 0) clean.push(id); });
  return clean;
}

function editRack(token, lot, rack, newRack, ids) {
  if (!check_(token)) throw new Error('Wrong token');
  const clean = cleanIds_(ids);
  if (!clean.length) throw new Error('Add at least one PT number (or delete the rack)');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_();
    const plan = planEditRack_(readRows_(sh), Number(lot), Number(rack), Number(newRack) || Number(rack), clean, Date.now());
    plan.updates.forEach((u) => sh.getRange(u.row, 3, 1, 2).setValues([[u.rack, u.pos]]));   // updates first: deleting rows shifts row numbers
    deleteRows_(sh, plan.deletes);
    if (plan.inserts.length) sh.getRange(sh.getLastRow() + 1, 1, plan.inserts.length, HEADERS.length).setValues(plan.inserts);
    return { lot: Number(lot), rack: Number(newRack) || Number(rack), added: plan.inserts.length, updated: plan.updates.length, removed: plan.deletes.length };
  } finally { lock.releaseLock(); }
}

function deleteRack(token, lot, rack) {
  if (!check_(token)) throw new Error('Wrong token');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_();
    const rows = readRows_(sh).filter((r) => r.lot === Number(lot) && r.rack === Number(rack));
    if (!rows.length) throw new Error('Rack ' + rack + ' not found in Lot ' + lot);
    deleteRows_(sh, rows.map((r) => r.row));
    return { removed: rows.length };
  } finally { lock.releaseLock(); }
}

function deleteLot(token, lot) {
  if (!check_(token)) throw new Error('Wrong token');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_();
    const rows = readRows_(sh).filter((r) => r.lot === Number(lot));
    if (!rows.length) throw new Error('Lot ' + lot + ' not found');
    deleteRows_(sh, rows.map((r) => r.row));
    return { removed: rows.length };
  } finally { lock.releaseLock(); }
}

function editLot(token, lot, newLot) {
  if (!check_(token)) throw new Error('Wrong token');
  const from = Number(lot), to = Number(newLot);
  if (!(to >= 1) || Math.floor(to) !== to) throw new Error('Lot number must be 1 or higher');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_();
    const rows = readRows_(sh);
    const mine = rows.filter((r) => r.lot === from);
    if (!mine.length) throw new Error('Lot ' + lot + ' not found');
    if (to !== from && rows.some((r) => r.lot === to)) throw new Error('Lot ' + to + ' already exists');
    mine.forEach((r) => sh.getRange(r.row, 2).setValue(to));
    return { lot: to };
  } finally { lock.releaseLock(); }
}

// Pure: rows of one rack → what to change so the rack becomes exactly `ids` (in this order) under number `newRack`.
function planEditRack_(rows, lot, rack, newRack, ids, now) {
  const mine = rows.filter((r) => r.lot === lot && r.rack === rack);
  if (!mine.length) throw new Error('Rack ' + rack + ' not found in Lot ' + lot);
  if (newRack !== rack && rows.some((r) => r.lot === lot && r.rack === newRack)) throw new Error('Rack ' + newRack + ' already exists in Lot ' + lot);
  const clash = rows.find((r) => r.lot === lot && r.rack !== rack && ids.indexOf(r.id) >= 0);
  if (clash) throw new Error(clash.id + ' is already in Rack ' + clash.rack);
  const ts = Math.min.apply(null, mine.map((r) => r.ts)) || now;   // new PTs keep the rack's original time
  const keep = {}, deletes = [], updates = [], inserts = [];
  mine.forEach((r) => { if (ids.indexOf(r.id) < 0) deletes.push(r.row); else keep[r.id] = r; });
  ids.forEach((id, i) => {
    const ex = keep[id];
    if (ex) updates.push({ row: ex.row, rack: newRack, pos: i + 1 });
    else inserts.push([ts, lot, newRack, i + 1, id, false]);
  });
  return { deletes: deletes, updates: updates, inserts: inserts };
}

function deleteRows_(sh, rowNumbers) {
  rowNumbers.slice().sort((a, b) => b - a).forEach((r) => sh.deleteRow(r));   // bottom-up so row numbers stay valid
}

// ───────── sheet / helpers ─────────
// Standalone project: setup() creates a Google Sheet called "Pathhelp Paperless" and remembers its id. Bound project: uses the Sheet it is attached to.
function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) { /* deleted → make a new one below */ } }
  let ss = null;
  try { ss = SpreadsheetApp.getActive(); } catch (e) {}
  if (!ss) ss = SpreadsheetApp.create('Pathhelp Paperless');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}
function getSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function readRows_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEADERS.length).getValues()
    .map((v, i) => ({ row: i + 2, ts: Number(v[0]), lot: Number(v[1]), rack: Number(v[2]), pos: Number(v[3]), id: String(v[4]), done: v[5] === true || v[5] === 'TRUE' }))
    .filter((r) => r.id);
}
function lots_() { return lotsFrom_(readRows_(getSheet_())); }
function markDone_(id, value) {
  if (!/^\d{6}PT\d+$/i.test(id)) return { ok: false, error: 'bad id' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet_(), rows = readRows_(sh);
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].id.toUpperCase() === id.toUpperCase()) {
        sh.getRange(rows[i].row, 6).setValue(value);
        strike_(sh, rows[i].row, value);          // submitted PTs are struck through (and greyed) in the sheet
        return { ok: true };
      }
    }
    return { ok: false, error: 'not in list' };
  } finally { lock.releaseLock(); }
}
function strike_(sh, row, on) {
  const r = sh.getRange(row, 1, 1, HEADERS.length);
  r.setFontLine(on ? 'line-through' : 'none');
  r.setFontColor(on ? '#9ca3af' : '#000000');
}
function check_(t) {
  const real = PropertiesService.getScriptProperties().getProperty('TOKEN');
  return !!real && String(t || '') === real;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Free OCR: Drive converts the photo to a Google Doc (needs the "Drive API" advanced service, v3 — see SETUP.md).
function ocr_(b64, mime) {
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, 'rack-photo');
  const f = Drive.Files.create({ name: 'pathhelp-ocr-temp', mimeType: 'application/vnd.google-apps.document' }, blob, { ocrLanguage: 'en' });
  try { return DocumentApp.openById(f.id).getBody().getText(); }
  finally { try { DriveApp.getFileById(f.id).setTrashed(true); } catch (e) {} }
}
