// SRD 5.2.1 Rogue Sneak Attack and Cunning Strike. Only verified, user-
// confirmed facts authorize the bonus; targets remain outside Play state.
import {weaponProfiles} from './catalog.js';
const requireRule=(ok,message)=>{if(!ok)throw new Error(message);};
export const cunningCosts=Object.freeze({none:0,poison:1,trip:1,withdraw:1,daze:2,knockout:6,obscure:3});
export const cunningEffects=Object.freeze(Object.keys(cunningCosts));
export const rogueCunningOptions=level=>cunningEffects.filter(name=>name==='none'||
  level>=14||level>=5&&cunningCosts[name]===1);
export function sneakAttackDice(level){
  requireRule(Number.isInteger(level)&&level>=1&&level<=20,'Enter a valid Rogue level.');
  return Math.ceil(level/2);
}
export function planRogueStrike(profile,state,plan,entry){
  const wants=entry.sneak??false;
  const ally=entry.allyNear??false;
  const cunning=entry.cunning??'none';
  const cunningExtra=entry.cunningExtra??'none';
  requireRule(typeof wants==='boolean'&&typeof ally==='boolean','Confirm valid Sneak Attack options.');
  requireRule(cunningEffects.includes(cunning)&&cunningEffects.includes(cunningExtra),'Choose a supported Cunning Strike effect.');
  requireRule(wants||cunning==='none'&&cunningExtra==='none','Cunning Strike requires Sneak Attack.');
  requireRule(cunning!=='none'||cunningExtra==='none','Select the first Cunning Strike effect before a second.');
  requireRule(cunning!==cunningExtra||cunning==='none','Choose different effects for the two Cunning Strikes.');
  if(!wants||!plan.hit)return {used:false,count:0,cunning:null,dc:null,notes:null};
  requireRule(profile?.d?.className==='Rogue'||profile?.rogueLevel>=1,'Sneak Attack requires a Rogue.');
  const name=profile.s.attacks[entry.index]?.name;
  const weapon=weaponProfiles[name];
  requireRule(weapon&&(weapon[2].endsWith('Ranged')||weapon[3].includes('Finesse')),
    'Sneak Attack requires a verified Finesse or Ranged weapon; resolve custom weapons with the DM.');
  requireRule(plan.mode==='advantage'||(ally&&plan.mode!=='disadvantage'),
    'Sneak Attack requires Advantage, or a non-incapacitated ally within 5 feet and no Disadvantage.');
  requireRule(!state?.combat?.active||state.combat.sneakUsed!==true,
    'Sneak Attack was already used in this tracked turn. Confirm another creature turn before using it again.');
  const level=profile.rogueLevel??profile.d.level;
  const dice=sneakAttackDice(level);
  const selected=[cunning,cunningExtra].filter(effect=>effect!=='none');
  if(selected.length)requireRule(level>=5,'Cunning Strike requires Rogue level 5.');
  if(selected.length>1)requireRule(level>=11,'A second Cunning Strike requires Rogue level 11.');
  if(selected.some(effect=>cunningCosts[effect]>1))requireRule(level>=14,'Devious Strikes require Rogue level 14.');
  if(selected.includes('poison'))requireRule(entry.poisonKit===true,
    'Poison Cunning Strike requires a Poisoner’s Kit on your person.');
  if(selected.includes('trip'))requireRule(entry.targetLargeOrSmaller===true,
    'Trip Cunning Strike requires a Large or smaller target.');
  const cost=selected.reduce((total,effect)=>total+cunningCosts[effect],0);
  requireRule(cost<=dice,'Cunning Strike costs more dice than this Sneak Attack provides.');
  const count=(dice-cost)*(plan.critical?2:1);
  requireRule(count>=0,'Cunning Strike cannot spend more damage dice than Sneak Attack grants.');
  const notes={poison:'Constitution save; Poisoned for up to 1 minute, repeat save each turn',
    trip:'Dexterity save or Prone',withdraw:'Move up to half Speed without Opportunity Attacks',
    daze:'Constitution save or next turn: move, Action, or Bonus Action (one only)',
    knockout:'Constitution save or Unconscious up to 1 minute; end on damage or successful repeat save',
    obscure:'Dexterity save or Blinded until end of next turn'};
  const saving=selected.some(effect=>effect!=='withdraw');
  return {used:true,count,cunning:cunning==='none'?null:cunning,
    cunningExtra:cunningExtra==='none'?null:cunningExtra,effects:selected,cost,
    dc:saving?8+profile.s.mods[1]+profile.s.proficiency:null,
    notes:selected.map(effect=>effect+': '+notes[effect]).join('; ')||null};
}
