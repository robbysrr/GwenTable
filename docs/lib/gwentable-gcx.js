import {inventoryField, validateSavedInventory} from './saved-inventory.js';
import {gcxExtensions,makeGCX} from './gcx.mjs';
import {deriveCharacter,migrateDraft,validateCharacter} from './character.js';
import {normalizePlay,playProfile,validatePlay} from './play.js';
import {validFighterRogueActive} from './srd-fighter-rogue-live.mjs';

const buildKey='gwentable/build';
const playKey='gwentable/play';
const inventoryKey='gwentable/inventory';
// Local SRD-only class allocation. Other GCX consumers may preserve this
// namespaced extension without interpreting or changing the class ledger.
export const multiclassGCXKey='gwentable/multiclass';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function validatedComposite(file,draft){
  const active=file.preservedExtensions[multiclassGCXKey];
  if(active===undefined)return null;
  if(file.sourceApp!=='gwentable'||file.rulesProfile!=='SRD_5_2_1'||!validFighterRogueActive(active))return false;
  try{
    const profile=playProfile(draft,active);
    const classes=file.character.classes;
    if(file.character.kind!=='PC'||file.character.level!==active.totalLevel||classes?.length!==2||
      classes[0]?.name!=='Fighter'||classes[0]?.level!==1||
      classes[1]?.name!=='Rogue'||classes[1]?.level!==active.secondaryLevel||
      !same(file.character.scores,profile.s.scores)||file.character.maxHp!==profile.maxHP)return false;
    return active;
  }catch{return false;}
}
export async function gcxLocalId(portableId){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(portableId));
  return 'gcx-'+Array.from(new Uint8Array(hash),value=>value.toString(16).padStart(2,'0')).join('');
}
export const gwenPortableId=record=>record.gcx?.portableCharacterId??'gwen:'+record.id;

export function gcxToGwen(file,applyPlay){
  const source=file.preservedExtensions[buildKey];
  if (!source || source.model!==2) return {gcx:file};
  const migrated=migrateDraft(source);
  const draft={...migrated,name:file.character.name.trim()};
  if(validateCharacter(draft).length) return {gcx:file};
  const active=validatedComposite(file,draft);
  // Never import an unrecognized composite into a single-class GwenTable
  // character, even if its draft extension claims to be a Fighter.
  if(active===false || (!active&&file.character.classes?.length!==1))return {gcx:file};
  const tracked={};
  const incomingInventory=file.preservedExtensions[inventoryKey];
  if(file.sourceApp==='gwentable'&&file.rulesProfile==='SRD_5_2_1'&&incomingInventory!==undefined) {
    try {tracked[inventoryField]=validateSavedInventory(incomingInventory);} catch {
      // Keep unsupported extensions in the preserved GCX document for recovery.
    }
  }
  const native=file.preservedExtensions[playKey];
  if(!applyPlay||file.exportMode!=='live-snapshot')return {draft,gcx:file,...tracked,...(active?{multiclassActive:active}:{})};
  const profile=playProfile(draft,active);
  const common=file.character.play;
  let play=native?validatePlay(profile,native):normalizePlay(profile);
  if(common)play=normalizePlay(profile,{...play,hp:common.hp??play.hp,temp:common.tempHp??play.temp,exhaustion:common.exhaustion??play.exhaustion});
  validatePlay(profile,play);
  return {draft,play,gcx:file,...tracked,...(active?{multiclassActive:active}:{})};
}

export function asSeparateGCX(file,portableCharacterId=crypto.randomUUID()){
  const {integrity,...body}=file;
  return {...body,portableCharacterId,derivedFrom:file.portableCharacterId};
}

export function exportGwenGCX(record,mode){
  const prior=record.gcx;
  const extensions=gcxExtensions(prior,mode);
  const identity={portableCharacterId:gwenPortableId(record),derivedFrom:prior?.derivedFrom,
    sourceApp:'gwentable',sourceBuild:'gcx-1',exportMode:mode,preservedExtensions:extensions};
  if(!record.draft){
    if(!prior)throw new Error('There is no character to export.');
    const {play,...build}=prior.character;
    return makeGCX({...identity,rulesProfile:prior.rulesProfile,provenance:prior.provenance,
      character:mode==='live-snapshot'?prior.character:build});
  }
  const draft=migrateDraft(record.draft);
  const problems=validateCharacter(draft);
  if(problems.length)throw new Error(problems[0]);
  const active=record.multiclassActive??null;
  // Fail closed if the source draft, HP checkpoint or proficiencies no longer
  // authorize this exact active composite profile.
  const profile=playProfile(draft,active);
  const derived=profile.s;
  extensions[buildKey]=draft;
  if(active)extensions[multiclassGCXKey]=active;
  else delete extensions[multiclassGCXKey];
  if(Object.hasOwn(record,inventoryField)) extensions[inventoryKey]=record[inventoryField];
  const play=record.play&&mode==='live-snapshot'?validatePlay(profile,record.play):null;
  if(play){
    const {log,...snapshot}=play;
    extensions[playKey]={...snapshot,log:[]};
  }else if(mode==='live-snapshot'&&extensions[playKey]){
    delete extensions[playKey];
  }
  const provenance=prior?.provenance??[];
  return makeGCX({...identity,rulesProfile:'SRD_5_2_1',
    provenance:provenance.some(row=>row.family==='SRD_5_2_1')?provenance:[...provenance.slice(0,19),{title:'D&D System Reference Document',family:'SRD_5_2_1',version:'5.2.1'}],
    character:{name:draft.name,kind:'PC',level:profile.totalLevel??draft.level,species:draft.species,background:draft.background,alignment:draft.alignment,
      classes:active?[{name:'Fighter',subclass:derived.subclass??undefined,level:1},{name:'Rogue',level:active.secondaryLevel}]:
        [{name:draft.className,subclass:derived.subclass??undefined,level:draft.level}],scores:derived.scores,maxHp:profile.maxHP,
      xp:play?.xp??record.play?.xp??prior?.character.xp,
      play:play?{hp:play.hp,tempHp:play.temp,exhaustion:play.exhaustion}:undefined}
  });
}
