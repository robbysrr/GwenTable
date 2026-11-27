// SRD 5.2.1 (2024), Animals pp. 344–364. Curated, source-verified Beast
// stat blocks only. This is NOT a generic monster parser or a replacement for
// the DM. Only Druid forms that satisfy the Circle of the Land limit are rolled.
import {beastQuickReference} from './beast-reference.js';
import {attackDice,attackRollMode} from './combat-assist.js';

const check=(valid,message)=>{if(!valid)throw new Error(message);};
const number=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const strike=(name,bonus,components,notes='')=>({name,bonus,components,notes});
const hit=(dice,mod,type)=>({dice,mod,type});
// Every entry was checked against its named SRD Animals stat block/page.
const BEASTS={
  'Wolf': {size:'Medium',speed:{walk:40},traits:['Pack Tactics: Advantage if an active ally is within 5 feet of the target'],attacks:[
    strike('Bite',4,[hit('1d6',2,'Piercing')],'Medium or smaller target: Prone on hit')]},
  'Panther': {size:'Medium',speed:{walk:50,climb:40},traits:['Nimble Escape: Bonus Action Disengage or Hide'],attacks:[
    strike('Rend',5,[hit('1d6',3,'Slashing')])]},
  'Boar': {size:'Medium',speed:{walk:40},traits:['Bloodied Fury: Advantage on attacks while Bloodied'],attacks:[
    strike('Gore',3,[hit('1d6',1,'Piercing')],'20-foot straight charge vs Medium or smaller: +1d6 Piercing and Prone (DM handles conditional damage)')]},
  'Giant Badger': {size:'Medium',speed:{walk:30,burrow:10},traits:['Poison resistance'],attacks:[
    strike('Bite',3,[hit('2d4',1,'Piercing')])]},
  'Giant Crab': {size:'Medium',speed:{walk:30,swim:30},traits:['Amphibious'],attacks:[
    strike('Claw',3,[hit('1d6',1,'Bludgeoning')],'Medium or smaller target: Grappled (escape DC 11), up to two claws')]},
  'Giant Wolf Spider': {size:'Medium',speed:{walk:40,climb:40},traits:['Spider Climb'],attacks:[
    strike('Bite',5,[hit('1d4',3,'Piercing'),hit('2d4',0,'Poison')])]},
  'Giant Venomous Snake': {size:'Medium',speed:{walk:40,swim:40},traits:['Blindsight 10 ft.'],attacks:[
    strike('Bite',6,[hit('1d4',4,'Piercing'),hit('1d8',0,'Poison')])]},
  'Brown Bear': {size:'Large',speed:{walk:40,climb:30},traits:['Multiattack: one Bite and one Claw'],attacks:[
    strike('Bite',5,[hit('1d8',3,'Piercing')]),
    strike('Claw',5,[hit('1d4',3,'Slashing')],'Large or smaller target: Prone on hit')]},
  'Tiger': {size:'Large',speed:{walk:40},traits:['Nimble Escape: Bonus Action Disengage or Hide'],attacks:[
    strike('Rend',5,[hit('2d6',3,'Slashing')],'Large or smaller target: Prone on hit')]},
  'Giant Spider': {size:'Large',speed:{walk:30,climb:30},traits:[
    'Spider Climb and Web Walker',
    'Web (Recharge 5–6): Dex save DC 13 or Restrained; see SRD page 354 (not an attack roll)'],attacks:[
    strike('Bite',5,[hit('1d8',3,'Piercing'),hit('2d6',0,'Poison')])]},
  'Giant Toad': {size:'Large',speed:{walk:30,swim:30},traits:[
    'Amphibious; Standing Leap',
    'Swallow: DM-managed special action vs grappled Medium or smaller creature; see SRD page 354'],attacks:[
    strike('Bite',4,[hit('1d6',2,'Piercing'),hit('2d4',0,'Poison')],
      'Medium or smaller target: Grappled (escape DC 12); see Swallow special action')]}
};
export const curatedBeastNames=Object.freeze(Object.keys(BEASTS));
const freezeProfile=value=>Object.freeze({
  ...value,speed:Object.freeze({...value.speed}),traits:Object.freeze([...value.traits]),
  attacks:Object.freeze(value.attacks.map(attack=>Object.freeze({...attack,
    components:Object.freeze(attack.components.map(component=>Object.freeze({...component})))})))
});
const profiles=Object.freeze(Object.fromEntries(Object.entries(BEASTS).map(([name,value])=>[name,freezeProfile(value)])));

// Return null for unsupported forms, changed creature types, or level-ineligible
// forms. A 2024 Giant Eagle is a Celestial, not a Beast.
export function beastCombatProfile(name,level){
  const ref=beastQuickReference(name,level);
  const profile=profiles[name];
  return ref?.eligible&&profile?{...profile,name,ac:ref.ac,hp:ref.hp,cr:ref.cr,page:ref.page}:null;
}
export function planBeastAttack(profile,state,entry){
  check(profile?.d?.className==='Druid'&&state?.shape?.active===true,
    'Enter Wild Shape with an eligible Druid before making a Beast attack.');
  const beast=beastCombatProfile(state.shape.form,profile.d.level);
  check(beast,'This form does not have a verified, level-eligible SRD Beast attack profile. Ask the DM to resolve it.');
  check(typeof entry?.attack==='string','Choose a Beast attack.');
  const strike=beast.attacks.find(item=>item.name===entry.attack);
  check(strike,'Choose a listed Beast attack.');
  check(entry.targetAC===null||number(entry.targetAC,1,99),'Choose a target AC from 1 to 99 or leave it empty.');
  check(typeof entry.confirmedHit==='boolean','Explicitly confirm a hit if the AC is unknown.');
  const mode=attackRollMode({advantage:entry.advantage,disadvantage:entry.disadvantage});
  check(Array.isArray(entry.rolls)&&entry.rolls.length===(mode==='normal'?1:2)&&
    entry.rolls.every(n=>number(n,1,20)),'Supply the correct number of d20 results.');
  const natural=mode==='advantage'?Math.max(...entry.rolls):mode==='disadvantage'?
    Math.min(...entry.rolls):entry.rolls[0];
  const critical=natural===20;
  const bonus=strike.bonus-2*(state.exhaustion??0);
  const total=natural+bonus;
  const hitResult=natural===1?false:critical?true:entry.targetAC===null?
    (entry.confirmedHit?true:null):total>=entry.targetAC;
  check(!(natural===1&&entry.confirmedHit),'A natural 1 misses automatically.');
  check(!(entry.targetAC!==null&&entry.confirmedHit&&!hitResult),
    'The target AC conflicts with the confirmed hit.');
  const components=strike.components.map(component=>({...component,
    roll:attackDice(component.dice,critical)}));
  return {beast:beast.name,attack:strike.name,mode,natural,rolls:[...entry.rolls],bonus,total,
    critical,hit:hitResult,targetAC:entry.targetAC,components,notes:strike.notes,
    sourcePage:beast.page};
}
export function resolveBeastAttack(profile,state,entry){
  const plan=planBeastAttack(profile,state,entry);
  const damageRolls=entry.damageRolls??[];
  check(Array.isArray(damageRolls)&&damageRolls.length===(plan.hit?plan.components.length:0),
    'Damage rolls must match the hit and the Beast attack damage components.');
  const damage=[];
  for(let i=0;i<damageRolls.length;i++){
    const values=damageRolls[i],component=plan.components[i];
    check(Array.isArray(values)&&values.length===component.roll.count&&
      values.every(n=>number(n,1,component.roll.sides)),'Invalid Beast damage dice.');
    const amount=Math.max(0,values.reduce((a,b)=>a+b,0)+component.mod);
    damage.push({type:component.type,amount,rolls:[...values]});
  }
  const {components,...out}=plan;
  return {...out,damage,totalDamage:plan.hit?damage.reduce((a,b)=>a+b.amount,0):null};
}
export function beastAttackSummary(result){
  const status=result.hit===null?'unconfirmed; DM resolves target AC':result.hit?
    result.critical?'critical hit':'hit':'miss';
  const target=result.targetAC===null?'AC unknown':'AC '+result.targetAC;
  return `Wild Shape ${result.beast} ${result.attack}: d20 ${result.rolls.join('/')} `+
    `${result.bonus>=0?'+':''}${result.bonus} = ${result.total} vs ${target}; ${status}.`+
    (result.totalDamage===null?'':` ${result.totalDamage} TOTAL damage (`+
      result.damage.map(item=>`${item.amount} ${item.type}`).join(' + ')+
      '); apply to target at table once.')+
    (result.notes?` ${result.notes}.`: '')+
    ` SRD p.${result.sourcePage}.`;
}
