// SRD 5.2.1 attack assistant. Dice are supplied by the UI for a deterministic,
// auditable Play transition; opponents and all DM decisions remain external.
import {planRogueStrike} from './rogue-strike.js';
import {weaponMasteryResult,weaponMasterySummary} from './weapon-mastery.js';
import {rangerProgression,isHuntersMark} from './ranger-progression.js';
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const requireRule=(valid,text)=>{if(!valid)throw new Error(text);};
export function attackDice(expression,critical=false){
  requireRule(typeof expression==='string','Attack damage expression is missing.');
  const match=/^([1-9]\d?)d(4|6|8|10|12|20|100)$/i.exec(expression);
  if(match)return {count:Number(match[1])*(critical?2:1),sides:Number(match[2]),fixed:null};
  requireRule(/^[1-9]\d?$/.test(expression),'Unsupported attack damage expression.');
  return {count:0,sides:null,fixed:Number(expression)};
}
export function attackRollMode({advantage=false,disadvantage=false,forcedDisadvantage=false}={}){
  requireRule(typeof advantage==='boolean'&&typeof disadvantage==='boolean'&&typeof forcedDisadvantage==='boolean',
    'Choose valid Advantage and Disadvantage options.');
  return advantage&&(disadvantage||forcedDisadvantage)?'normal':advantage?'advantage':
    disadvantage||forcedDisadvantage?'disadvantage':'normal';
}
export function planAttack(profile,state,entry){
  const attack=profile?.s?.attacks?.[entry?.index];
  requireRule(Number.isInteger(entry?.index)&&attack,'Choose an attack on the character sheet.');
  requireRule(int(attack.bonus,-100,200)&&int(attack.mod,-100,200),'Invalid attack bonus.');
  requireRule(entry?.targetAC===null||int(entry.targetAC,1,99),'Enter a target AC from 1 to 99, or leave it blank.');
  requireRule(typeof entry?.confirmedHit==='boolean','Explicitly confirm a hit if AC is unknown.');
  const marked=entry.markedTarget===true;
  requireRule(entry.markedTarget===undefined||typeof entry.markedTarget==='boolean','Choose a valid marked-target option.');
  const markActive=profile.d.className==='Ranger'&&isHuntersMark(state?.focus);
  requireRule(!marked||markActive,'Hunter’s Mark must be the active Concentration spell for a marked target.');
  const ranger=profile.d.className==='Ranger'?rangerProgression(profile.d.level):null;
  const aim=state?.combat?.aimPending===true&&state.combat.active&&state.combat.turnActive;
  const mode=attackRollMode({advantage:entry.advantage||aim||(marked&&ranger?.preciseHunter)||false,disadvantage:entry.disadvantage,
    forcedDisadvantage:attack.disadvantage===true});
  const diceCount=mode==='normal'?1:2;
  requireRule(Array.isArray(entry.rolls)&&entry.rolls.length===diceCount&&entry.rolls.every(n=>int(n,1,20)),
    'Provide the correct number of d20 results.');
  const natural=mode==='advantage'?Math.max(...entry.rolls):mode==='disadvantage'?
    Math.min(...entry.rolls):entry.rolls[0];
  const criticalAt=profile.s.fighter?.critical??20;
  const critical=natural>=criticalAt;
  const bonus=attack.bonus-2*(state?.exhaustion??0);
  const total=natural+bonus;
  const hit=natural===1?false:critical?true:entry.targetAC!==null?total>=entry.targetAC:
    entry.confirmedHit?true:null;
  requireRule(!(natural===1&&entry.confirmedHit),'A natural 1 misses regardless of confirmation.');
  requireRule(!(entry.targetAC!==null&&entry.confirmedHit&&!hit),
    'The entered target AC conflicts with the confirmed hit.');
  const dice=attackDice(attack.dice,critical);
  const markDice=marked&&hit?{count:critical?2:1,sides:ranger.foeSlayer?10:6}:{count:0,sides:null};
  const basic={attack:attack.name,mode,natural,rolls:entry.rolls.slice(),total,bonus,critical,hit,markedTarget:marked,steadyAim:aim,markDice,
    targetAC:entry.targetAC,damageDice:dice,damageType:attack.type,formula:attack.dice,modifier:attack.mod};
  return {...basic,rogue:planRogueStrike(profile,state,basic,entry),
    mastery:weaponMasteryResult(profile,basic,attack)};
}
export function resolveAttack(profile,state,entry){
  const plan=planAttack(profile,state,entry);
  const rolls=entry.damageRolls??[];
  requireRule(Array.isArray(rolls)&&rolls.length===(plan.hit?plan.damageDice.count:0),
    'Damage dice must be provided only for a confirmed hit.');
  requireRule(rolls.every(n=>int(n,1,plan.damageDice.sides)),
    'An attack damage die result is outside the permitted range.');
  const sneakRolls=entry.sneakRolls??[];
  requireRule(Array.isArray(sneakRolls)&&sneakRolls.length===plan.rogue.count&&
    sneakRolls.every(n=>int(n,1,6)),'Sneak Attack dice must match the verified bonus.');
  const markRolls=entry.markRolls??[];
  requireRule(Array.isArray(markRolls)&&markRolls.length===plan.markDice.count&&
    markRolls.every(n=>int(n,1,plan.markDice.sides)),'Hunter’s Mark dice must match the confirmed marked hit.');
  const markDamage=markRolls.reduce((sum,n)=>sum+n,0);
  const sneakDamage=sneakRolls.reduce((sum,n)=>sum+n,0);
  const weaponDamage=plan.hit?Math.max(0,(plan.damageDice.fixed??rolls.reduce((sum,n)=>sum+n,0))+plan.modifier):null;
  const damage=weaponDamage===null?null:weaponDamage+sneakDamage+markDamage;
  const {damageDice,modifier,...data}=plan;
  return {...data,damage,weaponDamage,damageRolls:rolls.slice(),sneakRolls:sneakRolls.slice(),sneakDamage,markRolls:markRolls.slice(),markDamage};
}

export function attackSummary(result){
  const status=result.hit===null?'unconfirmed (DM resolves target AC)':result.hit?
    result.critical?'critical hit':'hit':'miss';
  const target=result.targetAC===null?'vs unknown AC':'vs AC '+result.targetAC;
  const dice=result.rolls.join('/');
  return (result.attack+': d20 '+dice+' '+(result.bonus>=0?'+':'')+result.bonus+' = '+result.total+
    ' '+target+'; '+status+'.'+(result.damage===null?'':
      ' '+result.damage+' '+result.damageType+' TOTAL damage (weapon '+result.weaponDamage+
      (result.rogue.used?' + Sneak Attack '+result.sneakDamage:'')+(result.markedTarget?' + Hunter’s Mark '+result.markDamage:'')+'; base '+result.formula+
      (result.critical?', critical dice doubled':'')+'). Apply to target at table ONCE.'))+
    (result.markedTarget&&result.hit?` Hunter’s Mark bonus: ${result.markDamage} (${result.markDice.count}d${result.markDice.sides}, included in total).`:'')+
    (result.steadyAim?' Steady Aim used for this attack roll.':'')+
    (result.rogue.used?` Sneak Attack: ${result.sneakDamage} extra damage (${result.rogue.count}d6; included in total, do not add twice)`+
      (result.rogue.cunning?`; Cunning Strike ${result.rogue.cunning}`+(result.rogue.cunningExtra?' + '+result.rogue.cunningExtra:'')+
      (result.rogue.dc?` (DC ${result.rogue.dc})`:'')+`; ${result.rogue.notes}`:'')+'.':'')+
    weaponMasterySummary(result.mastery);
}
