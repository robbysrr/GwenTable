/** GwenTable Convergence 05: bounded ACTIVE Fighter 1 / Rogue 1 rules overlay.
 * SRD 5.2.1 pp. 24–25, 47–49, 61–62. Do not generalize to other pairs
 * by altering the className or assuming character level equals class level.
 * A verified saved record contains the second-class level and choices. The
 * original Fighter 1 draft remains immutable for original class features.
 */
import {classes,allLanguages,weaponProfiles} from './catalog.js';
import {skills as skillAbilities} from './rules.js';
import {previewMulticlass} from './srd-multiclass-preview.mjs';

export const activeFighterRogueSchema='gwentable.multiclass.active.fighter1-rogue1.v1';
export const activeFighterRogue2Schema='gwentable.multiclass.active.fighter1-rogue2.v1';
export const activeFighterRogue3Schema='gwentable.multiclass.active.fighter1-rogue3-thief.v1';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const exact=(o,keys)=>plain(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const uniq=xs=>Array.isArray(xs)&&new Set(xs).size===xs.length&&xs.every(x=>typeof x==='string');
const activeFields=['schema','primaryClass','primaryLevel','secondaryClass','secondaryLevel',
  'totalLevel','scoresAtActivation','baseMaxHP','hpMethod','hpRoll','hpGain','maxHP','xpAtActivation',
  'skill','expertise','language','masteries'];
const rogue2Fields=['hpMethod','hpRoll','hpGain','xpAtAdvancement','xpAuthority','gmApproved'];
const validRogue2=entry=>exact(entry,rogue2Fields)&&['fixed','rolled'].includes(entry.hpMethod)&&
 (entry.hpMethod==='fixed'?entry.hpRoll===null:integer(entry.hpRoll,1,8))&&
 integer(entry.hpGain,1,20)&&integer(entry.xpAtAdvancement,0,999999)&&
 (entry.xpAuthority==='xp'?entry.xpAtAdvancement>=900&&entry.gmApproved===false:
  entry.xpAuthority==='gm'&&entry.gmApproved===true);
const rogue3Fields=['subclass','hpMethod','hpRoll','hpGain','xpAtAdvancement','xpAuthority','gmApproved'];
const validRogue3=entry=>exact(entry,rogue3Fields)&&entry.subclass==='Thief'&&
 ['fixed','rolled'].includes(entry.hpMethod)&&
 (entry.hpMethod==='fixed'?entry.hpRoll===null:integer(entry.hpRoll,1,8))&&
 integer(entry.hpGain,1,20)&&integer(entry.xpAtAdvancement,0,999999)&&
 (entry.xpAuthority==='xp'?entry.xpAtAdvancement>=2700&&entry.gmApproved===false:
  entry.xpAuthority==='gm'&&entry.gmApproved===true);
export function validFighterRogueActive(active){
 const three=active?.schema===activeFighterRogue3Schema;
 const two=active?.schema===activeFighterRogue2Schema||three;
 return exact(active,three?[...activeFields,'rogue2','rogue3']:two?[...activeFields,'rogue2']:activeFields)&&
  (two||active.schema===activeFighterRogueSchema)&&
  active.primaryClass==='Fighter'&&active.primaryLevel===1&&active.secondaryClass==='Rogue'&&
  active.secondaryLevel===(three?3:two?2:1)&&active.totalLevel===(three?4:two?3:2)&&
  (two?validRogue2(active.rogue2):true)&&
  (three?validRogue3(active.rogue3):true)&&
  Array.isArray(active.scoresAtActivation)&&active.scoresAtActivation.length===6&&
  active.scoresAtActivation.every(n=>integer(n,1,30))&&
  integer(active.baseMaxHP,1,9999)&&integer(active.hpGain,1,20)&&
  active.maxHP===active.baseMaxHP+active.hpGain+(two?active.rogue2.hpGain:0)+(three?active.rogue3.hpGain:0)&&active.maxHP<=9999&&
  ['fixed','rolled'].includes(active.hpMethod)&&
  (active.hpMethod==='fixed'?active.hpRoll===null:integer(active.hpRoll,1,8))&&
  previewMulticlass([{className:'Fighter',level:1},{className:'Rogue',level:1}],active.scoresAtActivation).qualified&&
  integer(active.xpAtActivation,0,999999)&&typeof active.skill==='string'&&
  Object.hasOwn(skillAbilities,active.skill)&&uniq(active.expertise)&&active.expertise.length===2&&
  active.expertise.every(name=>Object.hasOwn(skillAbilities,name))&&
  typeof active.language==='string'&&allLanguages.includes(active.language)&&
  uniq(active.masteries)&&active.masteries.length===2&&active.masteries.every(name=>Object.hasOwn(weaponProfiles,name));
}
export function applyFighterRogueOverlay(profile,active){
 if(active===null||active===undefined)return profile;
 if(!validFighterRogueActive(active))throw new Error('Unrecognized or malformed active multiclass record. Restore a verified backup.');
 const {d,s}=profile;
 if(d.className!=='Fighter'||d.level!==1||profile.maxHP!==active.baseMaxHP||
   !s.scores.every((score,i)=>score===active.scoresAtActivation[i])||
   active.hpGain!==Math.max(1,(active.hpMethod==='fixed'?5:active.hpRoll)+s.mods[2])||
   (active.secondaryLevel>=2&&active.rogue2.hpGain!==
     Math.max(1,(active.rogue2.hpMethod==='fixed'?5:active.rogue2.hpRoll)+s.mods[2]))||
   (active.secondaryLevel===3&&active.rogue3.hpGain!==
     Math.max(1,(active.rogue3.hpMethod==='fixed'?5:active.rogue3.hpRoll)+s.mods[2])))
  throw new Error('The Fighter 1 source build changed after multiclass activation; gameplay is blocked pending review.');
 if(!s.skills.some(row=>row.name===active.skill&&!row.trained) ||
   active.expertise.some(name=>!(name===active.skill||s.skills.some(row=>row.name===name&&row.trained&&!row.expert)))||
   s.languages.includes(active.language)||s.languages.includes('Thieves’ Cant')||
   active.masteries.some(name=>d.mastery?.includes(name)))
  throw new Error('Active multiclass proficiencies no longer match the original character; restore a verified backup.');
 const p=s.proficiency;
 const rogue2=active.secondaryLevel>=2,rogue3=active.secondaryLevel>=3;
 const advancement=active.hpGain+(rogue2?active.rogue2.hpGain:0)+(rogue3?active.rogue3.hpGain:0);
 const nextSkills=s.skills.map(row=>{
  const trained=row.trained||row.name===active.skill;
  const expert=row.expert||active.expertise.includes(row.name);
  return {...row,trained,expert,total:row.total+(row.trained?0:p*(expert?2:1))+(row.trained&&!row.expert&&expert?p:0)};
 });
 const nextAttacks=s.attacks.map(attack=>{
  if(!active.masteries.includes(attack.name)||attack.mastery)return attack;
  return {...attack,mastery:weaponProfiles[attack.name]?.[4]??null};
 });
 const nextS={...s,hp:active.maxHP,hpParts:{...s.hpParts,advancement:s.hpParts.advancement+advancement},
  xp:rogue3?2700:rogue2?900:300,nextXP:rogue3?6500:rogue2?2700:900,
  dice:'1d10 + '+active.secondaryLevel+'d8',skills:nextSkills,
  ...(rogue3?{climbSpeed:s.speed,jumpAbility:'Dexterity'}:{}),
  languages:[...s.languages,active.language,'Thieves’ Cant'],
  proficientTools:[...new Set([...s.proficientTools,'Thieves’ Tools'])],
  armorTraining:[...new Set([...s.armorTraining,'Light'])],
  attacks:nextAttacks,features:[...s.features,'Rogue 1: Expertise (2 chosen skills)',
    'Rogue 1: Sneak Attack '+(rogue3?'2d6':'1d6')+' (once per turn; Finesse or Ranged weapon)',
    'Rogue 1: Thieves’ Cant','Rogue 1: Weapon Mastery (2 selected kinds)',
    ...(rogue2?['Rogue 2: Cunning Action (Dash, Disengage, or Hide as a Bonus Action)']:[]),
    ...(rogue3?['Rogue 3: Steady Aim (Bonus Action; no movement before use, Speed 0 until turn end)',
      'Rogue 3 / Thief: Fast Hands (Sleight of Hand, Utilize, or qualifying Magic-item action as Bonus Action)',
      'Rogue 3 / Thief: Second-Story Work (Climb Speed equals Speed; use Dexterity for jumping)']:[])]};
 return {...profile,s:nextS,maxHP:active.maxHP,dice:active.totalLevel,
  hitDicePools:[{className:'Fighter',die:10,count:1},{className:'Rogue',die:8,count:active.secondaryLevel}],
  totalLevel:active.totalLevel,multiclass:{primaryClass:'Fighter',primaryLevel:1,secondaryClass:'Rogue',secondaryLevel:active.secondaryLevel},
  rogueLevel:active.secondaryLevel,...(rogue3?{rogueSubclass:'Thief'}:{})};
}
