/** GwenTable Convergence 03 | Saved SRD multiclass level-up checkpoint.
 *
 * This is a confirmed, reversible *pre-activation* calculation, not a level
 * advance. The existing single-class Play engine must not receive secondary-
 * class abilities until the class-feature, spell, proficiency and resource
 * transactions have been implemented and verified as one coherent slice.
 * SRD 5.2.1 pages 24-25: multiclass prerequisites, total-level XP,
 * hit points at levels after 1, mixed Hit Dice and shared spellcasting slots.
 */
import {classes} from './catalog.js';
import {deriveCharacter} from './character.js';
import {playProfile,normalizePlay,validatePlay} from './play.js';
import {inspectSavedMulticlassPlan} from './saved-multiclass-plan.mjs';
import {previewMulticlass} from './srd-multiclass-preview.mjs';

export const multiclassLevelUpSchema='gwentable.multiclass.levelup-checkpoint.v1';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const fail=message=>{throw new Error(message);};
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
  (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const keys=['schema','primaryClass','primaryLevel','nextClass','nextTotalLevel','scoresAtCheckpoint',
  'xpAtCheckpoint','xpAuthority','hpMethod','hpRoll','hpGain','baseMaxHP','nextMaxHP','classHitDie'];
const scoresOK=a=>Array.isArray(a)&&a.length===6&&a.every(n=>Number.isInteger(n)&&n>=1&&n<=30);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const diceAllowed=new Set([6,8,10,12]);

export function validMulticlassLevelUpShape(value){
 if(!obj(value)||Object.keys(value).length!==keys.length||!keys.every(k=>own(value,k))||
   value.schema!==multiclassLevelUpSchema||!own(classes,value.primaryClass)||!own(classes,value.nextClass)||
   value.primaryClass===value.nextClass||!integer(value.primaryLevel,1,19)||
   value.nextTotalLevel!==value.primaryLevel+1||!scoresOK(value.scoresAtCheckpoint)||
   !integer(value.xpAtCheckpoint,0,999999)||!['xp','gm'].includes(value.xpAuthority)||
   !['fixed','rolled'].includes(value.hpMethod)||!diceAllowed.has(value.classHitDie)||
   value.classHitDie!==classes[value.nextClass].die||!integer(value.baseMaxHP,1,9999)||
   !integer(value.hpGain,1,9999)||value.nextMaxHP!==value.baseMaxHP+value.hpGain||
   value.nextMaxHP>9999||
   !(value.hpMethod==='fixed'?value.hpRoll===null:integer(value.hpRoll,1,value.classHitDie)))return false;
 try{
  const projection=previewMulticlass([
   {className:value.primaryClass,level:value.primaryLevel},
   {className:value.nextClass,level:1}
  ],value.scoresAtCheckpoint);
  return projection.qualified;
 }catch{return false;}
}

function activeSnapshot(record){
 if(!obj(record)||!obj(record.draft))fail('Choose a saved character with a valid build.');
 const plan=inspectSavedMulticlassPlan(record);
 if(plan.status!=='current')fail('Your saved future-class plan is missing, invalid or stale. Review it before preparing a level-up.');
 const profile=playProfile(record.draft);
 if(record.play!==undefined&&record.play!==null)validatePlay(profile,record.play);
 const state=normalizePlay(profile,record.play);
 const scores=deriveCharacter(record.draft).scores;
 return {plan:plan.plan,profile,state,scores};
}

/** Performs all deterministic HP/HD/proficiency/slot calculations, but never
 * mutates the saved draft, active Play, items or any current resource pool.
 * The GM option records explicit out-of-band approval, not an invented roll.
 */
export function prepareMulticlassLevelUp(record,{hpMethod='fixed',hpRoll=null,
  xpAuthority='xp',gmApproved=false,acknowledged=false}={}){
 if(acknowledged!==true)fail('Confirm this checkpoint will NOT activate multiclass gameplay.');
 if(!['xp','gm'].includes(xpAuthority))fail('Choose an XP threshold or explicit GM level approval.');
 if(xpAuthority==='gm'&&gmApproved!==true)fail('GM-approved advancement needs explicit confirmation.');
 const {plan,profile,state,scores}=activeSnapshot(record);
 if(state.dead||state.hp===0)fail('Resolve this character’s current zero-HP/death state before preparing advancement.');
 const xpAtCheckpoint=state.xp;
 if(xpAuthority==='xp'&&(profile.s.nextXP===null||xpAtCheckpoint<profile.s.nextXP))
   fail('This character has not yet reached the next total-level XP threshold.');
 if(!['fixed','rolled'].includes(hpMethod))fail('Select fixed Hit Points or a confirmed Hit Die result.');
 const classHitDie=classes[plan.nextClass].die;
 if(!diceAllowed.has(classHitDie))fail('The selected class has an unsupported Hit Die.');
 const hpBase=hpMethod==='fixed'?Math.floor(classHitDie/2)+1:
   (integer(hpRoll,1,classHitDie)?hpRoll:fail('Enter an actual roll from 1 to the selected class Hit Die.'));
 if(hpMethod==='fixed'&&hpRoll!==null)fail('Fixed Hit Points cannot also include a die roll.');
 const conMod=profile.s.mods[2];
 const hpGain=Math.max(1,hpBase+conMod);
 const nextMaxHP=profile.maxHP+hpGain;
 if(nextMaxHP>9999)fail('The resulting maximum HP exceeds supported character bounds.');
 const payload={schema:multiclassLevelUpSchema,primaryClass:plan.primaryClass,primaryLevel:plan.primaryLevel,
   nextClass:plan.nextClass,nextTotalLevel:plan.nextTotalLevel,scoresAtCheckpoint:[...scores],
   xpAtCheckpoint,xpAuthority,hpMethod,hpRoll:hpMethod==='fixed'?null:hpRoll,
   hpGain,baseMaxHP:profile.maxHP,nextMaxHP,classHitDie};
 if(!validMulticlassLevelUpShape(payload))fail('Could not validate the multiclass level-up checkpoint.');
 const next={...record,multiclassLevelUp:payload};
 delete next.multiclassRogueEntry;
 return next;
}

/** For UI inspection only. A checkpoint is never interpreted as an active
 * class allocation. Any source build/XP change moves it to review status.
 */
export function inspectMulticlassLevelUp(record){
 const value=record?.multiclassLevelUp;
 if(value===undefined)return {status:'none',checkpoint:null,preview:null};
 if(!validMulticlassLevelUpShape(value))return {status:'invalid',checkpoint:null,preview:null};
 try{
  const {plan,profile,state,scores}=activeSnapshot(record);
  const unchanged=plan.primaryClass===value.primaryClass&&plan.primaryLevel===value.primaryLevel&&
    plan.nextClass===value.nextClass&&plan.nextTotalLevel===value.nextTotalLevel&&
    scores.every((score,i)=>score===value.scoresAtCheckpoint[i])&&
    state.xp===value.xpAtCheckpoint&&profile.maxHP===value.baseMaxHP&&
    value.hpGain===Math.max(1,(value.hpMethod==='fixed'?Math.floor(value.classHitDie/2)+1:value.hpRoll)+profile.s.mods[2])&&
    (value.xpAuthority==='gm'||profile.s.nextXP!==null&&state.xp>=profile.s.nextXP);
  const before=previewMulticlass([{className:plan.primaryClass,level:plan.primaryLevel}],scores);
  const after=previewMulticlass([{className:plan.primaryClass,level:plan.primaryLevel},
    {className:plan.nextClass,level:1}],scores);
  return {status:unchanged?'current':'review',checkpoint:value,
    preview:{before,after,hpGain:value.hpGain,hitDie:value.classHitDie,nextMaxHP:value.nextMaxHP,
      sourcePage:'SRD 5.2.1 pp. 24–25'}};
 }catch{return {status:'review',checkpoint:value,preview:null};}
}
export function clearMulticlassLevelUp(record){
 if(!obj(record)||!obj(record.draft))fail('Choose a saved character with a valid build.');
 if(!own(record,'multiclassLevelUp'))return record;
 const next={...record};delete next.multiclassLevelUp;delete next.multiclassRogueEntry;return next;
}
