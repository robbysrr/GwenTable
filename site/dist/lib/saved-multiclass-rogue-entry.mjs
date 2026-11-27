/** GwenTable Player Convergence 04 — first-class-specific multiclass entry.
 * SRD 5.2.1 pp. 25 and 61–62.  Fighter -> Rogue, specifically Fighter (levels 1–19) ->
 * Rogue 1, is the FIRST validation fixture.  All values remain an *inert*
 * saved choice set pending a composite Play engine; no Rogue features are
 * automatically activated by this module.
 */
import {classes,allLanguages,weaponProfiles} from './catalog.js';
import {playProfile} from './play.js';
import {inspectSavedMulticlassPlan} from './saved-multiclass-plan.mjs';
import {inspectMulticlassLevelUp,validMulticlassLevelUpShape} from './saved-multiclass-levelup.mjs';
import {previewMulticlass} from './srd-multiclass-preview.mjs';

export const rogueEntrySchema='gwentable.multiclass.rogue-entry.v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const exact=(value,keys)=>isObject(value)&&Object.keys(value).length===keys.length&&keys.every(key=>own(value,key));
const uniqueTwo=values=>Array.isArray(values)&&values.length===2&&values[0]!==values[1]&&values.every(x=>typeof x==='string');
const fail=message=>{throw new Error(message);};
const entryKeys=['schema','primaryClass','primaryLevel','nextClass','nextTotalLevel','scoresAtChoice',
  'checkpoint','skill','expertise','language','masteries'];
const featureList=['Expertise (2 skill proficiencies)','Sneak Attack (1d6, once per turn)',
  'Thieves’ Cant','Weapon Mastery (2 kinds)'];
const weaponNames=Object.keys(weaponProfiles);
const optionsFrom=(profile)=>{
  const skills=classes.Rogue.skills.filter(name=>!profile.s.skills.some(entry=>entry.name===name&&entry.trained));
  const expertise=profile.s.skills.filter(item=>item.trained&&!item.expert).map(item=>item.name);
  const languages=allLanguages.filter(name=>!profile.s.languages.includes(name)&&
    name!=="Thieves’ Cant"&&name!=='Druidic');
  // Fighter has Martial weapon proficiency; list all catalogued SRD weapons,
  // not just currently carried equipment. Avoid duplicating mastered kinds.
  const currentMasteries=profile.d.mastery??[];
  const masteries=weaponNames.filter(name=>!currentMasteries.includes(name));
  return {skills,expertise,languages,masteries};
};
export function rogueEntryOptions(record){
 if(!isObject(record)||!isObject(record.draft))fail('Choose a saved character.');
 const plan=inspectSavedMulticlassPlan(record);
 const checkpoint=inspectMulticlassLevelUp(record);
 const supported=plan.status==='current'&&checkpoint.status==='current'&&
   plan.plan.primaryClass==='Fighter'&&plan.plan.primaryLevel>=1&&plan.plan.primaryLevel<=19&&plan.plan.nextClass==='Rogue'&&
   plan.plan.nextTotalLevel===plan.plan.primaryLevel+1;
 if(!supported)return {supported:false,reason:'This first supported entry path requires a current Fighter → Rogue 1 checkpoint. Other class combinations are not yet activated.',
   skills:[],expertise:[],languages:[],masteries:[],plan,checkpoint};
 const profile=playProfile(record.draft);
 const options=optionsFrom(profile);
 return {...options,supported:true,reason:'',plan,checkpoint};
}
export function validRogueEntryShape(value){
 return exact(value,entryKeys)&&value.schema===rogueEntrySchema&&value.primaryClass==='Fighter'&&
  Number.isInteger(value.primaryLevel)&&value.primaryLevel>=1&&value.primaryLevel<=19&&value.nextClass==='Rogue'&&
  value.nextTotalLevel===value.primaryLevel+1&&
  Array.isArray(value.scoresAtChoice)&&value.scoresAtChoice.length===6&&
  value.scoresAtChoice.every(n=>Number.isInteger(n)&&n>=1&&n<=30)&&
  validMulticlassLevelUpShape(value.checkpoint)&&value.checkpoint.primaryClass===value.primaryClass&&
  value.checkpoint.primaryLevel===value.primaryLevel&&value.checkpoint.nextClass===value.nextClass&&
  value.checkpoint.nextTotalLevel===value.nextTotalLevel&&
  JSON.stringify(value.checkpoint.scoresAtCheckpoint)===JSON.stringify(value.scoresAtChoice)&&
  typeof value.skill==='string'&&
  uniqueTwo(value.expertise)&&typeof value.language==='string'&&uniqueTwo(value.masteries);
}
export function setSavedRogueEntry(record,{skill,expertise,language,masteries,acknowledged=false}={}){
 if(acknowledged!==true)fail('Confirm that these Rogue class entry choices will not yet activate gameplay.');
 const opts=rogueEntryOptions(record);
 if(!opts.supported)fail(opts.reason);
 if(!opts.skills.includes(skill))fail('Choose one new skill from the Rogue skill proficiency list.');
 if(!uniqueTwo(expertise)||!expertise.every(name=>opts.expertise.includes(name)||name===skill))
   fail('Choose two distinct eligible proficient skills for Rogue Expertise.');
 if(!opts.languages.includes(language))fail('Choose one other permitted language not already known.');
 if(!uniqueTwo(masteries)||!masteries.every(name=>opts.masteries.includes(name)))
   fail('Choose two distinct weapon types you can master without duplicating first-class mastery choices.');
 const checkpoint=opts.checkpoint.checkpoint;
 const entry={schema:rogueEntrySchema,primaryClass:'Fighter',primaryLevel:opts.plan.plan.primaryLevel,
   nextClass:'Rogue',nextTotalLevel:opts.plan.plan.nextTotalLevel,scoresAtChoice:[...opts.plan.plan.scoresAtPlanning],
   checkpoint:{...checkpoint,scoresAtCheckpoint:[...checkpoint.scoresAtCheckpoint]},
   skill,expertise:[...expertise],language,masteries:[...masteries]};
 if(!validRogueEntryShape(entry))fail('Could not validate the selected Rogue class entry choices.');
 return {...record,multiclassRogueEntry:entry};
}
export function inspectSavedRogueEntry(record){
 const value=record?.multiclassRogueEntry;
 if(value===undefined)return {status:'none',entry:null,projection:null};
 if(!validRogueEntryShape(value))return {status:'invalid',entry:null,projection:null};
 try{
  const opts=rogueEntryOptions(record);
  if(!opts.supported)return {status:'review',entry:value,projection:null};
  const unchanged=value.primaryClass===opts.plan.plan.primaryClass&&
    value.primaryLevel===opts.plan.plan.primaryLevel&&value.nextClass===opts.plan.plan.nextClass&&
    value.nextTotalLevel===opts.plan.plan.nextTotalLevel&&
    JSON.stringify(value.scoresAtChoice)===JSON.stringify(opts.plan.plan.scoresAtPlanning)&&
    JSON.stringify(value.checkpoint)===JSON.stringify(opts.checkpoint.checkpoint)&&
    opts.skills.includes(value.skill)&&
    value.expertise.every(name=>opts.expertise.includes(name)||name===value.skill)&&
    opts.languages.includes(value.language)&&value.masteries.every(name=>opts.masteries.includes(name));
  const allocation=previewMulticlass([
    {className:value.primaryClass,level:value.primaryLevel},
    {className:value.nextClass,level:1}],value.scoresAtChoice);
  return {status:unchanged?'current':'review',entry:value,
    projection:unchanged?{
      totalLevel:allocation.totalLevel,classLevels:allocation.hitDice.map(({className,count})=>({className,level:count})),
      maxHP:opts.checkpoint.checkpoint.nextMaxHP,
      hitDice:allocation.hitDice,
      proficiencyBonus:allocation.proficiencyBonus,
      skillProficiency:value.skill,expertise:[...value.expertise],
      language:value.language,automaticLanguage:"Thieves’ Cant",
      armorTraining:['Light'],toolProficiencies:["Thieves’ Tools"],
      weaponMasteries:[...value.masteries],features:[...featureList],
      sharedSpellSlots:allocation.sharedSlots,
      grantedStartingEquipment:false,active:false,
      source:'SRD 5.2.1 pp. 25, 61–62'
    }:null};
 }catch{return {status:'review',entry:value,projection:null};}
}
export function clearSavedRogueEntry(record){
 if(!isObject(record)||!isObject(record.draft))fail('Choose a saved character.');
 if(!own(record,'multiclassRogueEntry'))return record;
 const copy={...record};delete copy.multiclassRogueEntry;return copy;
}
