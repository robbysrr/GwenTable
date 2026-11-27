/** GwenTable Convergence 08: SRD 5.2.1 Rogue class level 3 (Thief) advancement.
 * Only a verified Fighter 1 / Rogue 2 may advance through this path.
 * The class-entry draft remains Fighter 1; the signed multiclass allocation
 * carries Rogue 2. This pure transform runs inside the existing saved-row
 * IndexedDB revision-CAS update; it does not modify other characters.
 *
 * SRD 5.2.1: multiclass HP after 1st level uses Rogue d8; Rogue 3 gains Steady Aim and Thief subclass Fast Hands / Second-Story Work,
 * and Sneak Attack grows to 2d6. Total character level 4 requires 2700 XP (or an explicit GM-awarded milestone).
 */
import {playProfile,normalizePlay,validatePlay} from './play.js';
import {activeFighterRogue2Schema,activeFighterRogue3Schema,validFighterRogueActive} from './srd-fighter-rogue-live.mjs';

const fail=message=>{throw new Error(message);};
export function advanceFighterRogue3(record,{confirmed=false,xpAuthority='xp',gmApproved=false,hpMethod='fixed',hpRoll=null,subclass='Thief'}={}){
  if(subclass!=='Thief')fail('Only the SRD 5.2.1 Thief subclass is implemented for Rogue level 3.');
  if(confirmed!==true)fail('Confirm a private backup and the Rogue level 3 (Thief) advancement.');
  const active=record?.multiclassActive;
  if(!active||active.schema!==activeFighterRogue2Schema||!validFighterRogueActive(active))
    fail('Only a verified active Fighter 1 / Rogue 2 may advance to Rogue level 3 (Thief).');
  if(!['fixed','rolled'].includes(hpMethod)||hpMethod==='fixed'&&hpRoll!==null||
    hpMethod==='rolled'&&(!Number.isInteger(hpRoll)||hpRoll<1||hpRoll>8))
    fail('Choose fixed HP or supply a valid d8 result between 1 and 8.');
  if(!['xp','gm'].includes(xpAuthority)||typeof gmApproved!=='boolean'||
    xpAuthority==='xp'&&gmApproved!==false||xpAuthority==='gm'&&gmApproved!==true)
    fail('Choose earned XP or separately confirm GM approval of a milestone.');
  const previousProfile=playProfile(record.draft,active);
  if(record.play!=null)validatePlay(previousProfile,record.play);
  const before=normalizePlay(previousProfile,record.play);
  if(before.dead||before.hp===0||before.combat.active||before.focus||before.concentrationChecks.length)
    fail('End combat, Concentration, and any zero-HP or pending saves before leveling up.');
  if(xpAuthority==='xp'&&before.xp<2700)
    fail('Character level 4 requires at least 2,700 XP or a separately confirmed GM milestone.');
  const hpGain=Math.max(1,(hpMethod==='fixed'?5:hpRoll)+previousProfile.con);
  const maxHP=previousProfile.maxHP+hpGain;
  if(maxHP>9999)fail('Maximum HP exceeds this version’s supported range.');
  const updated={...active,schema:activeFighterRogue3Schema,
    secondaryLevel:3,totalLevel:4,maxHP,
    rogue3:{subclass:'Thief',hpMethod,hpRoll,hpGain,xpAtAdvancement:before.xp,xpAuthority,gmApproved}};
  if(!validFighterRogueActive(updated))fail('The Rogue 3 Thief allocation failed shape validation.');
  const nextProfile=playProfile(record.draft,updated);
  const newPlay=normalizePlay(nextProfile,{...before,hp:Math.min(maxHP,before.hp+hpGain),
    dice:before.dice,hitDiceSpent:{...before.hitDiceSpent},
    log:[...before.log,'Advanced to Fighter 1 / Rogue 3 (Thief) (+ '+hpGain+' maximum HP, 1d8 Hit Die, Steady Aim and Thief features).'].slice(-30)});
  validatePlay(nextProfile,newPlay);
  // Old Undo describes a lower-level profile. It cannot be restored by the
  // current Play Undo button; private JSON backups remain the rollback path.
  return {...record,multiclassActive:updated,play:newPlay,playUndo:null};
}
