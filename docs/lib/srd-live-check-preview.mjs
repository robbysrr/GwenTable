import {dodgeActive} from './srd-dodge.mjs';
import {abilities,skills} from './rules.js';
import {resolveD20Test} from './srd-d20-preview.mjs';
import {applyD20Dice} from './srd-live-modifiers.mjs';
// Base sheet modifiers plus recorded Exhaustion. Situation, temporary bonuses and
// feature-specific roll replacement remain explicitly confirmed by the player.
export function previewLiveCheck(profile,play,input){
 if(!profile?.s||!play||!input||typeof input!=='object') throw new TypeError('Invalid check input.');
 if(play.dead||play.shape?.active) throw new RangeError('Check unavailable in the current state.');
 if(input.confirmed!==true) throw new RangeError('Confirm the applicable modifiers and situation.');
 const {kind,name,rolls,advantage,disadvantage,dc,otherBonus,spellDice={}}=input;
 if(!['skill','save'].includes(kind)||typeof advantage!=='boolean'||typeof disadvantage!=='boolean'||!Number.isInteger(otherBonus)||Math.abs(otherBonus)>100||!(dc===null||Number.isInteger(dc)&&dc>=1&&dc<=999)||!Array.isArray(rolls)||rolls.length>2||!rolls.every(n=>Number.isInteger(n)&&n>=1&&n<=20)) throw new TypeError('Invalid check input.');
 if(!Array.isArray(play.conditions)||!Number.isInteger(play.exhaustion)||play.exhaustion<0||play.exhaustion>5) throw new TypeError('Invalid character state.');
 const conditions=play.conditions;
 let bonus,automaticFailure=false;
 if(kind==='skill'){
  if(!Object.hasOwn(skills,name))throw new RangeError('Invalid skill.');
  bonus=profile.s.skills?.find(row=>row.name===name)?.total;
 }else{
  const i=abilities.indexOf(name); if(i<0)throw new RangeError('Invalid ability.');
  bonus=profile.s.saves?.[i];
  automaticFailure=i<2&&(play.hp===0||conditions.some(c=>['Paralyzed','Petrified','Stunned','Unconscious'].includes(c))); 
 }
 if(!Number.isInteger(bonus)||bonus < -30||bonus > 30)throw new RangeError('Invalid sheet modifier.');
 if(automaticFailure)return Object.freeze({kind,name,status:'automatic-failure',total:null,characterBonus:bonus});
 // Bless/Bane dice from recorded incoming effects: physical results only, saves (not ability checks).
 const dice=applyD20Dice(play,kind==='skill'?'ability':'save',spellDice);
 const disadvantageApplied=disadvantage||(kind==='skill'&&conditions.includes('Poisoned'))||(kind==='save'&&name==='Dexterity'&&conditions.includes('Restrained'));
 const result=resolveD20Test({kind:kind==='skill'?'ability':'save',rolls,advantage:advantage||(kind==='save'&&name==='Dexterity'&&dodgeActive(profile,play)),disadvantage:disadvantageApplied,abilityModifier:bonus,otherBonus:otherBonus+dice.total,dc,exhaustion:play.exhaustion});
 return Object.freeze({...result,name,characterBonus:bonus,otherBonus,spellDice:dice.parts});
}

// Resolve the oldest persisted Concentration check, not an arbitrary player DC.
// The host must execute this inside its saved-character revision transaction.
// Snapshot matching is an extra guard, not a replacement for revision CAS.
export function resolvePendingConcentration(profile,play,input){
 const head=play?.concentrationChecks?.[0];
 if(!head||!play.focus||play.dead||play.hp<=0)throw new RangeError('There is no pending Concentration saving throw.');
 if(input?.focus!==play.focus||input.damage!==head.damage||input.dc!==head.dc||input.pendingCount!==play.concentrationChecks.length)
  throw new RangeError('Pending Concentration save changed. Reopen the current character.');
 const result=previewLiveCheck(profile,play,{kind:'save',name:'Constitution',rolls:input.rolls,
  advantage:input.advantage,disadvantage:input.disadvantage,otherBonus:input.otherBonus,confirmed:input.confirmed,dc:head.dc,spellDice:input.spellDice});
 if(!['success','failure'].includes(result.status))throw new RangeError('Concentration save needs a resolved outcome.');
 return result;
}

// The actual host transaction must also check the saved record revision.
export function resolvePendingConditionSave(profile,play,input){
 const effect=play?.conditionEffects?.find(e=>e.id===input?.id);
 const save=effect?.save;
 if(!save?.pending||save.attempt!==input.attempt||save.ability!==input.ability||save.dc!==input.dc||effect.name!==input.name||effect.source!==input.source)
  throw new RangeError('Pending condition save unavailable or changed.');
 const result=previewLiveCheck(profile,play,{kind:'save',name:save.ability,dc:save.dc,rolls:input.rolls,advantage:input.advantage,disadvantage:input.disadvantage,otherBonus:input.otherBonus,confirmed:input.confirmed,spellDice:input.spellDice});
 if(!['success','failure','automatic-failure'].includes(result.status))throw new RangeError('Condition save needs a resolved outcome.');
 return result;
}
