import {inventoryReceiptsField} from './saved-inventory.js';
import {readGCX,validateGCX} from './gcx.mjs';
import {source, newDraft, validate} from './rules.js';
import {migrateDraft, validateCharacter} from './character.js';
import {maxFileBytes, validateCustomList} from './custom.js';
import {buildEncounter} from './encounter.js';
import {playProfile, validatePlay} from './play.js';
export const version = '0.16.0';
export const encounterFileLimit=1024*1024;
export const rosterFileLimit=8*1024*1024;
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
};
async function hash(value) {
  const data = new TextEncoder().encode(JSON.stringify(canonical(value)));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),byte=>byte.toString(16).padStart(2,'0')).join('');
}
async function envelope(payload, kind, schemaVersion) {
  const body = {schemaVersion, kind, exportedAt:new Date().toISOString(),
    sourcePack:{id:source.id, version:source.version, license:source.license}, productVersion:version,
    payload, visibility:'private', assetManifest:[]};
  return {...body,integrity:{algorithm:'sha256',value:await hash(body)}};
}
export async function makeExport(payload) {
  if (validateCharacter(payload).length) throw new Error('Fix build choices before exporting.');
  return envelope(payload,'character',payload.model===2?'2.0.0':'1.0.0');
}
export async function makeCustomExport(entries) {
  if (!validateCustomList(entries)||!entries.length) throw new Error('Add at least one valid custom entry before exporting.');
  return envelope(entries,'custom-content','2.0.0');
}
function safeShape(root) {
  const stack = [[root,0]];
  while (stack.length) {
    const [value,depth] = stack.pop();
    if (depth>12) return false;
    if (!value || typeof value!=='object') continue;
    for (const [key,item] of Object.entries(value)) {
      if (['__proto__','constructor','prototype'].includes(key)) return false;
      stack.push([item,depth+1]);
    }
  }
  return true;
}
async function readEnvelope(raw, kind) {
  const limits={encounter:[encounterFileLimit,'1 MB'],'character-roster':[rosterFileLimit,'8 MB']};
  const [limit,label]=limits[kind]??[maxFileBytes,'512 KB'];
  if (typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>limit) throw new Error('Choose a JSON file under '+label+'.');
  const record = JSON.parse(raw);
  const supported=record?.schemaVersion==='2.0.0'||(kind==='character'&&record?.schemaVersion==='1.0.0');
  if (!record||!supported||!safeShape(record)||record.kind!==kind||
      record.sourcePack?.id!==source.id||record.sourcePack?.version!==source.version||record.sourcePack?.license!==source.license||
      record.visibility!=='private'||!Array.isArray(record.assetManifest)||record.assetManifest.length||!record.payload) {
    throw new Error('Choose an Open 5E Companion '+kind+' export.');
  }
  const {integrity,...body}=record;
  if (integrity?.algorithm!=='sha256'||integrity.value!==await hash(body)) throw new Error('The file failed its integrity check.');
  return record;
}
export async function readExport(raw) {
  const {payload,schemaVersion}=await readEnvelope(raw,'character');
  if (schemaVersion==='1.0.0'&&Object.keys(payload).sort().join()!==Object.keys(newDraft()).sort().join()) {
    throw new Error('This legacy file contains unsupported fields.');
  }
  if (schemaVersion==='2.0.0'&&payload.model!==2) throw new Error('This file is missing its character schema.');
  const issues=schemaVersion==='1.0.0'?validate(payload):validateCharacter(payload);
  if (issues.length) throw new Error(issues[0]);
  return payload;
}
export async function readCustomExport(raw) {
  const {payload}=await readEnvelope(raw,'custom-content');
  if (!validateCustomList(payload)||!payload.length) throw new Error('This file contains invalid or duplicate custom entries.');
  return payload;
}

export async function makeEncounterExport(events) {
  buildEncounter(events);
  const record=await envelope({events},'encounter','2.0.0');
  if (new TextEncoder().encode(JSON.stringify(record,null,2)).byteLength>encounterFileLimit) {
    throw new Error('This encounter is too large for a portable JSON file.');
  }
  return record;
}
export async function readEncounterExport(raw) {
  const {payload}=await readEnvelope(raw,'encounter');
  if (Object.keys(payload).join()!=='events') throw new Error('This file is missing its encounter events.');
  buildEncounter(payload.events);
  return payload.events;
}

// The legacy two-field Play export remains readable. Both forms must stay
// beneath the same 512 KiB import limit, including pretty-printed download bytes.
async function characterPlayEnvelope(payload) {
  const file=await envelope(payload,'character-play','2.0.0');
  if(new TextEncoder().encode(JSON.stringify(file,null,2)).byteLength>maxFileBytes)
    throw new Error('This individual character exceeds 512 KB. Use the private roster backup instead.');
  return file;
}
export async function makePlayExport(draft,play) {
  if (draft?.model!==2||validateCharacter(draft).length) throw new Error('Fix build choices before exporting.');
  validatePlay(playProfile(draft),play);
  return characterPlayEnvelope({draft,play});
}
// Preserve the complete JSON-safe saved-record envelope when exporting ONE
// character from Play, not just the known draft and Play fields. Browser-only
// IDs, timestamps and revision tokens are deliberately not portable. This
// reuses the roster's validated extension policy and remains format 2.0.0.
export async function makeSavedCharacterExport(savedRecord,currentPlay) {
  if(!savedRecord?.draft||savedRecord.draft.model!==2)
    throw new Error('Choose a saved character with a valid build.');
  const snapshot={...savedRecord,...(currentPlay===undefined?{}:{play:currentPlay})};
  const parts=portableRecordParts(snapshot);
  const [entry]=rosterEntries([parts]);
  if(!Object.hasOwn(entry,'play')) throw new Error('This character has no playable state to export.');
  return characterPlayEnvelope(entry);
}
export async function readSavedCharacterExport(raw) {
  if (typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>maxFileBytes) throw new Error('Choose a character JSON file under 512 KB.');
  if (JSON.parse(raw)?.kind!=='character-play') return {draft:await readExport(raw)};
  const {payload}=await readEnvelope(raw,'character-play');
  if(!payload||Array.isArray(payload)||typeof payload!=='object'||
      !Object.hasOwn(payload,'draft')||!Object.hasOwn(payload,'play')||
      payload.draft?.model!==2||Object.keys(payload).some(key=>
        !['draft','play','playUndo','gcx','extensions'].includes(key)))
    throw new Error('Invalid character build in this backup.');
  const [record]=rosterEntries([payload],{restoreExtensions:true});
  return record;
}

// Stable-format, private backup of user/extension fields that GwenTable itself
// does not understand. Browser-local record keys and compare-and-set tokens are
// NOT portable. Imports always receive fresh local IDs and revisions.
const localOnlyFields=new Set([inventoryReceiptsField,'id','updatedAt','_characterRevision','_storageRevision','_characterBaseRevision','completionApproval']);
const coreRosterFields=new Set(['draft','play','playUndo','gcx']);
// Unknown fields are portable only when their values can be represented
// faithfully as JSON. A browser may store Date, Blob, Map or undefined in
// IndexedDB; silently serializing those would corrupt the player's backup.
function jsonSafeExtension(value,ancestors=new WeakSet(),depth=0) {
  if(value===null||typeof value==='string'||typeof value==='boolean')return true;
  if(typeof value==='number')return Number.isFinite(value)&&!Object.is(value,-0);
  if(!value||typeof value!=='object'||depth>12)return false;
  const prototype=Object.getPrototypeOf(value);
  if(!Array.isArray(value)&&prototype!==Object.prototype&&prototype!==null)return false;
  // JSON drops symbol keys, non-enumerable fields, accessor behavior and
  // sparse array holes. A purported lossless backup must reject those too.
  const keys=Reflect.ownKeys(value);
  for(const key of keys) {
    if(typeof key!=='string')return false;
    if(Array.isArray(value)&&key==='length')continue;
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))return false;
  }
  if(Array.isArray(value)&&(Object.keys(value).length!==value.length||
    Object.keys(value).some(key=>!/^(?:0|[1-9]\d*)$/.test(key))))return false;
  if(ancestors.has(value))return false;
  ancestors.add(value);
  const safe=Object.entries(value).every(([key,item])=>
    !['__proto__','constructor','prototype'].includes(key)&&jsonSafeExtension(item,ancestors,depth+1));
  ancestors.delete(value);
  return safe;
}
function portableRecordParts(record) {
  if (!record||typeof record!=='object'||Array.isArray(record)) throw new Error('Invalid saved-character record.');
  const {draft,play,playUndo,gcx}=record;
  const extensions=Object.fromEntries(Object.entries(record).filter(([key])=>
    !localOnlyFields.has(key)&&!coreRosterFields.has(key)));
  if (!safeShape(extensions)||!jsonSafeExtension(extensions)) throw new Error('A roster extension is unsafe or cannot be represented accurately in JSON.');
  return {...(draft?{draft}:{}),...(gcx?{gcx}:{}),...(play?{play}:{}),
    ...(playUndo?{playUndo}:{}),...(Object.keys(extensions).length?{extensions}:{})};
}
function rosterEntries(entries,{restoreExtensions=false}={}) {
  if (!Array.isArray(entries)||!entries.length) throw new Error('A roster backup needs at least one saved character.');
  return entries.map((entry,index)=>{
    if (!entry||Array.isArray(entry)||typeof entry!=='object'||
        Object.keys(entry).some(key=>!['draft','play','playUndo','gcx','extensions'].includes(key))||
        (!entry.draft&&!entry.gcx)||entry.draft&&validateCharacter(entry.draft).length) {
      throw new Error('Character '+(index+1)+' has an invalid build.');
    }
    const extensions=entry.extensions;
    if (extensions!==undefined && (!extensions||Array.isArray(extensions)||typeof extensions!=='object'||
        !safeShape(extensions)||Object.keys(extensions).some(key=>
          localOnlyFields.has(key)||coreRosterFields.has(key)))) {
      throw new Error('Character '+(index+1)+' has invalid extension metadata.');
    }
    const draft=entry.draft?migrateDraft(entry.draft):undefined;
    const record=draft?{draft}:{};
    if(entry.gcx)record.gcx=validateGCX(entry.gcx);
    if(!draft&&(entry.play||entry.playUndo))throw new Error('A portable-only record cannot carry local play state.');
    if (Object.hasOwn(entry,'play')) {
      const profile=playProfile(draft,extensions?.multiclassActive);
      try {
        record.play=validatePlay(profile,entry.play);
        if (Object.hasOwn(entry,'playUndo')) record.playUndo=validatePlay(profile,entry.playUndo);
      } catch {
        throw new Error('Character '+(index+1)+' has invalid play state.');
      }
    } else if (Object.hasOwn(entry,'playUndo')) throw new Error('Character '+(index+1)+' is missing its play state.');
    if(extensions) Object.assign(record,restoreExtensions?extensions:{extensions});
    return record;
  });
}
// Synchronous preflight lets a damaged/unsupported record remain visible
// without disabling access to other, independently recoverable characters.
// The final export still performs full validation and size/integrity checks.
export function portableRosterRecordIssue(record) {
  try {
    rosterEntries([portableRecordParts(record)]);
    return null;
  } catch (error) {
    return error?.message??'This record cannot be included in a standard roster backup.';
  }
}

// An emergency *non-importable* copy of one damaged saved record. This is not
// a character backup and never authorizes Play. Keep the full JSON-safe local
// record for support/manual recovery, including private metadata. Do not
// silently coerce IndexedDB-only values into lossy JSON.
export async function makeSavedRecordRecoveryExport(record) {
  if(!record||typeof record!=='object'||Array.isArray(record)||
      !safeShape(record)||!jsonSafeExtension(record))
    throw new Error('This saved record cannot be copied faithfully as JSON. It remains in browser storage.');
  const file=await envelope({record},'saved-record-recovery','2.0.0');
  if(new TextEncoder().encode(JSON.stringify(file,null,2)).byteLength>rosterFileLimit)
    throw new Error('This recovery copy exceeds 8 MB. The original record remains in browser storage.');
  return file;
}

export async function makeRosterExport(records) {
  const record=await envelope(rosterEntries(records.map(portableRecordParts)),'character-roster','2.0.0');
  if (new TextEncoder().encode(JSON.stringify(record,null,2)).byteLength>rosterFileLimit) {
    throw new Error('This roster exceeds the 8 MB backup limit. Export individual characters to keep a copy.');
  }
  return record;
}
export async function readRosterExport(raw) {
  const {payload}=await readEnvelope(raw,'character-roster');
  const entries=rosterEntries(payload,{restoreExtensions:true});
  await Promise.all(entries.filter(row=>row.gcx).map(row=>readGCX(row.gcx)));
  return entries;
}
