/** GwenTable SRD 5.2.1: private, non-active next-class planning for saved PCs.
 *
 * This is intentionally an intent document, not an executable multiclass
 * character build. The existing single-class Play engine remains unchanged.
 * It never grants HP, spell slots, spells, armor, weapons, features or proficiencies.
 * Persistence must run through the saved-character revision-checked store.
 */
import {deriveCharacter} from './character.js';
import {classes} from './catalog.js';
import {previewMulticlass,multiclassRequirementStatus} from './srd-multiclass-preview.mjs';

export const multiclassPlanSchema='gwentable.multiclass.next-level.v1';
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const fail=message=>{throw new Error(message);};
const canObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const exactKeys=['schema','primaryClass','primaryLevel','nextClass','nextTotalLevel','scoresAtPlanning'];
const scoresOK=value=>Array.isArray(value)&&value.length===6&&value.every(n=>Number.isInteger(n)&&n>=1&&n<=30);
export function validMulticlassPlanShape(value){
  if(!canObject(value)||Object.keys(value).length!==exactKeys.length||
    !exactKeys.every(key=>own(value,key))||value.schema!==multiclassPlanSchema||
    typeof value.primaryClass!=='string'||!own(classes,value.primaryClass)||
    typeof value.nextClass!=='string'||!own(classes,value.nextClass)||value.nextClass===value.primaryClass||
    !Number.isInteger(value.primaryLevel)||value.primaryLevel<1||value.primaryLevel>=20||
    value.nextTotalLevel!==value.primaryLevel+1||!scoresOK(value.scoresAtPlanning))return false;
  try{
    const result=previewMulticlass([
      {className:value.primaryClass,level:value.primaryLevel},
      {className:value.nextClass,level:1}
    ],value.scoresAtPlanning);
    return result.qualified&&result.totalLevel===value.nextTotalLevel;
  }catch{return false;}
}
const ensureSaved=record=>{
  if(!canObject(record)||!canObject(record.draft))fail('Choose a saved character with a valid class build.');
  const draft=record.draft;
  if(typeof draft.className!=='string'||!own(classes,draft.className)||
    !Number.isInteger(draft.level)||draft.level<1||draft.level>20)
    fail('Saved character class or level is invalid.');
  return draft;
};
/** @returns {object} A new saved record with an opt-in future class plan. */
export function setSavedMulticlassPlan(record,nextClass){
  const draft=ensureSaved(record);
  if(draft.level>=20)fail('A level 20 character cannot plan an additional character level.');
  if(typeof nextClass!=='string'||!own(classes,nextClass)||nextClass===draft.className)
    fail('Choose a different SRD class for your next level.');
  const scores=deriveCharacter(draft).scores;
  const check=previewMulticlass([{className:draft.className,level:draft.level},
    {className:nextClass,level:1}],scores);
  if(!check.qualified)fail('Both your current class and the proposed next class require qualifying ability scores (usually 13+).');
  const plan={schema:multiclassPlanSchema,primaryClass:draft.className,
    primaryLevel:draft.level,nextClass,nextTotalLevel:check.totalLevel,scoresAtPlanning:[...scores]};
  // Any new plan approval invalidates a previously saved level-up checkpoint.
  // The checkpoint is not an active class entitlement and must not outlive its source plan.
  const updated={...record,multiclassPlan:plan};
  delete updated.multiclassLevelUp;
  delete updated.multiclassRogueEntry;
  return updated;
}
/** Read-only options used by both the Play UI and the rule checks. No
 * invalid class appears actionable, but the prerequisite stays visible. */
export function multiclassPlanChoices(record){
  const draft=ensureSaved(record);
  const scores=deriveCharacter(draft).scores;
  return Object.keys(classes).filter(name=>name!==draft.className).map(name=>{
    const other=multiclassRequirementStatus(name,scores);
    const current=multiclassRequirementStatus(draft.className,scores);
    const requirements=other.alternatives.map(group=>group.map(requirement=>
      `${requirement.ability} ${requirement.minimum}+`).join(' and ')).join(' or ');
    return {className:name,eligible:draft.level<20&&current.eligible&&other.eligible,requirements,
      reason:draft.level>=20?'Character level 20 is the maximum.':
        !current.eligible?'Your current class also needs to meet its primary ability prerequisite.':
        !other.eligible?`Requires ${requirements}.`:''};
  });
}

/** Deliberate user removal. Never edits the active class/Play/inventory. */
export function clearSavedMulticlassPlan(record){
  ensureSaved(record);
  if(!own(record,'multiclassPlan'))return record;
  const updated={...record};delete updated.multiclassPlan;delete updated.multiclassLevelUp;delete updated.multiclassRogueEntry;return updated;
}
/** Review automatically on load; changed class, level or scores need renewal.
 * No stale intent is converted into a game mechanic automatically. */
export function inspectSavedMulticlassPlan(record){
  const candidate=record?.multiclassPlan;
  if(candidate===undefined)return {status:'none',plan:null,preview:null};
  if(!validMulticlassPlanShape(candidate))return {status:'invalid',plan:null,preview:null};
  try{
    const draft=ensureSaved(record);
    const scores=deriveCharacter(draft).scores;
    const check=previewMulticlass([{className:candidate.primaryClass,level:candidate.primaryLevel},
      {className:candidate.nextClass,level:1}],scores);
    const unchanged=draft.className===candidate.primaryClass&&draft.level===candidate.primaryLevel&&
      candidate.scoresAtPlanning.every((value,index)=>value===scores[index]);
    return {status:unchanged&&check.qualified?'current':'review',plan:candidate,preview:check};
  }catch{return {status:'review',plan:candidate,preview:null};}
}
