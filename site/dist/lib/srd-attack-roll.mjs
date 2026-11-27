// Player-initiated attack and damage preview (SRD 5.2.1). Pure: no state is changed.
// Rules used: p.6 Attack Rolls (natural 20 hits and is a Critical Hit; natural 1 misses);
// p.16 Critical Hits (roll the attack's damage dice twice, add modifiers once); p.89 Finesse
// (choose Str or Dex, same modifier for attack and damage). Target AC and the outcome stay
// with the table; weapon mastery and other properties are reference text, not automation.
import {resolveD20Test} from './srd-d20-preview.mjs';
import {applyD20Dice} from './srd-live-modifiers.mjs';

const need=(ok,msg)=>{if(!ok)throw new RangeError(msg);};
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export const abilityNames=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];

/** Parse "2d6" or a flat amount such as "1" (Unarmed Strike). */
export function parseDamageDice(spec){
  const dice=/^(\d{1,2})d(4|6|8|10|12|20)$/.exec(String(spec).trim());
  if(dice)return {count:Number(dice[1]),sides:Number(dice[2]),flat:0};
  const flat=/^(\d{1,3})$/.exec(String(spec).trim());
  need(flat,'Unsupported damage dice: '+spec);
  return {count:0,sides:0,flat:Number(flat[1])};
}

/** Attack and damage modifiers for one derived attack row; Finesse may switch Str/Dex. */
export function attackOptions(profile,row,{ability}={}){
  const {s}=profile;
  need(row&&typeof row.bonus==='number'&&typeof row.mod==='number','Choose an attack from this character.');
  const base=Number.isInteger(row.ability)?row.ability:null;
  const choices=row.finesse&&!row.custom?[0,1]:null;
  let index=base;
  if(ability!==undefined&&ability!==null){
    need(choices?.includes(ability),'Only a Finesse weapon lets you choose Strength or Dexterity.');
    index=ability;
  }
  // Re-express the derived row: bonus = ability mod + proficiency (if proficient) + other bonus.
  const prof=row.proficient?s.proficiency:0;
  const other=Number.isInteger(row.otherBonus)?row.otherBonus:0;
  const abilityMod=index===null?row.mod:s.mods[index];
  const switched=index!==base;
  const attackBonus=switched?abilityMod+prof+other:row.bonus;
  const damageMod=switched?abilityMod+(row.damageBonus??0):row.mod;
  const formula=[
    {label:index===null?'Ability':abilityNames[index],value:abilityMod},
    ...(row.proficient?[{label:'Proficiency Bonus',value:prof}]:[]),
    ...(other?[{label:row.custom?'Item bonus':'Fighting Style (Archery)',value:other}]:[])
  ];
  return {abilityIndex:index,choices,attackBonus,damageMod,formula,proficient:Boolean(row.proficient),
    criticalThreshold:profile.s.fighter?.critical&&(row.unarmed||!row.custom)?profile.s.fighter.critical:20,
    warning:row.disadvantage?'Heavy weapon: Disadvantage on attack rolls with a score below 13 in its ability.':
      !row.proficient?'Not proficient: no Proficiency Bonus on the attack roll.':''};
}

/** Attack roll from entered or generated d20s. targetAC is optional; without it the table decides. */
export function previewAttack(profile,play,{row,ability,rolls,advantage=false,disadvantage=false,otherBonus=0,spellDice={},targetAC=null}){
  need(play&&!play.dead,'Attack previews are unavailable for a dead character.');
  need(int(otherBonus,-50,50),'Enter an additional modifier between -50 and 50.');
  need(targetAC===null||int(targetAC,1,40),'Enter a target AC between 1 and 40, or leave it blank.');
  const options=attackOptions(profile,row,{ability});
  const dice=applyD20Dice(play,'attack',spellDice);
  const result=resolveD20Test({kind:'attack',rolls,advantage,disadvantage,abilityModifier:options.attackBonus,
    otherBonus:otherBonus+dice.total,exhaustion:play.exhaustion??0,dc:targetAC,criticalThreshold:options.criticalThreshold});
  return Object.freeze({...result,attackBonus:options.attackBonus,formula:options.formula,spellDice:dice.parts,otherBonus,
    critical:result.natural>=options.criticalThreshold,automaticMiss:result.natural===1});
}

/** Damage from entered dice (each die listed) or generated dice; critical doubles the dice only. */
export function previewDamage(profile,{row,ability,critical=false,rolls,extra=0}){
  need(int(extra,-50,100),'Enter extra damage between -50 and 100.');
  const options=attackOptions(profile,row,{ability});
  const spec=parseDamageDice(row.dice);
  const count=spec.count*(critical?2:1);
  need(Array.isArray(rolls)&&rolls.length===count&&rolls.every(r=>int(r,1,spec.sides)),
    count?`Enter ${count} result${count>1?'s':''} on d${spec.sides} (1–${spec.sides}).`:'This attack uses no damage dice.');
  const diceTotal=rolls.reduce((a,b)=>a+b,0);
  const total=diceTotal+spec.flat+options.damageMod+extra;
  return Object.freeze({count,sides:spec.sides,flat:spec.flat,rolls:[...rolls],diceTotal,modifier:options.damageMod,extra,total,type:row.type,critical,
    note:total<=0?'Total is 0 or less: confirm the result with your DM.':''});
}

/** Generated dice for the "Roll for me" path; rng returns [0,1). Kept apart from any commit. */
export function rollDice(count,sides,rng=Math.random){
  need(int(count,0,40)&&[4,6,8,10,12,20].includes(sides)||count===0,'Unsupported dice.');
  return Array.from({length:count},()=>1+Math.floor(rng()*sides));
}
