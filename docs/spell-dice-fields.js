// Physical Bless/Bane d4 inputs for saving throw forms (SRD 5.2.1 pp.112-113).
// Shows one field per active applicable spell; same-spell castings share one die.
import {liveD20Dice} from './lib/srd-live-modifiers.mjs';
import {htmlCopy} from './locale.js';
export function spellDiceFields(play,kind='save'){
 let active;
 try {active=liveD20Dice(play,kind);} catch {return '';}
 if(!active.length)return '';
 return active.map(e=>`<label>${htmlCopy(e.sign>0?'{spell}: d4 to add':'{spell}: d4 to subtract',{spell:e.spell})}<input type="number" name="spell-die-${e.spell}" min="1" max="${e.sides}" required></label>`).join('')+
  `<p class="play-note">${htmlCopy('Roll the d4 yourself. Do not also include Bless or Bane in the additional modifier.')}</p>`;
}
export function spellDiceFrom(fields){
 const dice={};
 for(const [key,value] of fields.entries())if(key.startsWith('spell-die-')&&value!=='')dice[key.slice('spell-die-'.length)]=Number(value);
 return dice;
}
// Command field only when dice were entered, keeping earlier command shapes unchanged.
export function spellDiceField(fields){
 const dice=spellDiceFrom(fields);
 return Object.keys(dice).length?{spellDice:dice}:{};
}
export function spellDiceText(parts=[]){
 return parts.map(d=>d.spell+' '+(d.value>0?'+':'')+d.value).join(', ');
}
