/** Atomic-transform-ready ACTIVE Fighter 1 -> Rogue 1 conversion.
 * Called only inside characters.update() revision-checked transaction.
 * The method is pure and leaves the source record unchanged on failure.
 */
import {playProfile,normalizePlay,validatePlay} from './play.js';
import {inspectSavedMulticlassPlan} from './saved-multiclass-plan.mjs';
import {inspectMulticlassLevelUp} from './saved-multiclass-levelup.mjs';
import {inspectSavedRogueEntry} from './saved-multiclass-rogue-entry.mjs';
import {activeFighterRogueSchema,validFighterRogueActive} from './srd-fighter-rogue-live.mjs';
export function activateFighterRogue(record,{confirmed=false}={}) {
 if(confirmed!==true)throw new Error('Explicitly confirm the irreversible advancement from Fighter 1 to Fighter 1 / Rogue 1.');
 if(record?.multiclassActive)throw new Error('Character already has an active multiclass allocation.');
 if(!record?.draft||record.draft.className!=='Fighter'||record.draft.level!==1)
  throw new Error('This release supports only Fighter level 1 taking Rogue level 1.');
 const plan=inspectSavedMulticlassPlan(record),check=inspectMulticlassLevelUp(record),entry=inspectSavedRogueEntry(record);
 if(plan.status!=='current'||check.status!=='current'||entry.status!=='current')
  throw new Error('Planning note, level checkpoint or Rogue choices have changed; review and save them again.');
 const base=playProfile(record.draft);
 if(record.play!=null)validatePlay(base,record.play);
 const before=normalizePlay(base,record.play);
 if(before.dead||before.hp===0||before.combat.active||before.focus||before.concentrationChecks.length)
  throw new Error('End combat and Concentration and resolve zero-HP/death state before level advancement.');
 // Undo snapshots in the old single-class schema cannot be replayed as a
 // post-advancement state. Do not preserve that one-step Undo across schemas.
 const cp=check.checkpoint,choice=entry.entry;
 if(cp.primaryLevel!==1||cp.nextClass!=='Rogue'||cp.nextTotalLevel!==2||cp.baseMaxHP!==base.maxHP)
  throw new Error('The saved checkpoint does not authorize this level combination.');
 const active={schema:activeFighterRogueSchema,primaryClass:'Fighter',primaryLevel:1,
  secondaryClass:'Rogue',secondaryLevel:1,totalLevel:2,scoresAtActivation:[...cp.scoresAtCheckpoint],
  baseMaxHP:cp.baseMaxHP,hpMethod:cp.hpMethod,hpRoll:cp.hpRoll,
  hpGain:cp.hpGain,maxHP:cp.nextMaxHP,xpAtActivation:before.xp,
  skill:choice.skill,expertise:[...choice.expertise],language:choice.language,masteries:[...choice.masteries]};
 if(!validFighterRogueActive(active))throw new Error('Invalid active multiclass allocation.');
 const mixed=playProfile(record.draft,active);
 const after=normalizePlay(mixed,{...before,hp:Math.min(mixed.maxHP,before.hp+cp.hpGain),
  hitDiceSpent:{10:before.dice,8:0},dice:before.dice,
  log:[...before.log,'Advanced to Fighter 1 / Rogue 1 (+ '+cp.hpGain+' maximum HP; 1d8 added).'].slice(-30)});
 validatePlay(mixed,after);
 const next={...record,multiclassActive:active,play:after,playUndo:null};
 delete next.multiclassPlan;delete next.multiclassLevelUp;delete next.multiclassRogueEntry;
 return next;
}
