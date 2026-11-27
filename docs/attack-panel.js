// Play sheet Attack roller: player-initiated attack and damage previews (no saved changes).
// Physical dice are typed in; "Roll for me" fills the same fields with generated dice so both
// paths share one calculation. Hit, damage to a target and on-hit effects stay with the table.
import {copy,htmlCopy} from './locale.js';
import {attackOptions,previewAttack,previewDamage,parseDamageDice,abilityNames} from './lib/srd-attack-roll.mjs';
import {weaponReference} from './lib/srd-weapon-reference.js';
import {spellDiceFields,spellDiceFrom,spellDiceText} from './spell-dice-fields.js';
import {liveD20Dice} from './lib/srd-live-modifiers.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>(n>=0?'+':'−')+Math.abs(n);
const die=sides=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return 1+(a[0]%sides);};
const propertyNames=row=>String(row.properties??'').split(/,\s*(?![^(]*\))/).map(p=>p.replace(/\s*\(.*\)$/,'').trim()).filter(p=>Object.hasOwn(weaponReference,p));

export function attackInfoHTML(profile,row,ability){
  if(!row)return '';
  const o=attackOptions(profile,row,{ability});
  const props=propertyNames(row);
  const reference=[...props,...(row.mastery?[row.mastery]:[])].map(name=>{
    const ref=weaponReference[name];
    return `<details class="attack-ref"><summary>${esc(name)}${ref.kind==='mastery'?' · '+htmlCopy('Mastery'):''}</summary><p lang="en">${esc(ref.text)}</p><p class="play-note">SRD p. ${ref.page}</p></details>`;
  }).join('');
  return `<p><strong>${htmlCopy('Attack')} ${esc(signed(o.attackBonus))}</strong> = ${o.formula.map(f=>esc(f.label)+' '+esc(signed(f.value))).join(' + ')}
    · <strong>${htmlCopy('Damage')}</strong> ${esc(row.dice)}${o.damageMod?' '+esc(signed(o.damageMod)):''} ${esc(row.type)}
    ${o.criticalThreshold<20?' · '+htmlCopy('Critical Hit on {n}–20',{n:o.criticalThreshold}):''}</p>
    ${row.properties?`<p class="play-note">${esc(row.properties)}</p>`:''}
    ${o.warning?`<p class="play-note" role="note">${htmlCopy(o.warning)}</p>`:''}
    ${reference?`<div class="attack-refs">${reference}</div><p class="play-note">${htmlCopy('Properties and mastery are reference text; apply their effects at the table.')}</p>`:''}`;
}

export function attackPanelHTML(profile,play){
  const rows=profile?.s?.attacks??[];
  if(!rows.length||play?.dead||play?.shape?.active)return '';
  const first=rows[0];
  return `<details class="play-attack-panel" open><summary>${htmlCopy('Attack roller')}</summary>
  <form data-attack-form class="enc-inline">
    <p class="play-note">${htmlCopy('Roll your own dice and type them in, or use Roll for me. Your DM decides whether the attack hits. Nothing is saved.')}</p>
    <label>${htmlCopy('Attack')}<select name="attack">${rows.map((r,i)=>`<option value="${i}">${esc(r.name)}</option>`).join('')}</select></label>
    <label data-attack-ability${first.finesse&&!first.custom?'':' hidden'}>${htmlCopy('Finesse ability')}<select name="ability"><option value="">${htmlCopy('As built')}</option><option value="0">${htmlCopy('Strength')}</option><option value="1">${htmlCopy('Dexterity')}</option></select></label>
    <div data-attack-info>${attackInfoHTML(profile,first)}</div>
    <fieldset class="attack-mode"><legend>${htmlCopy('Roll')}</legend>
      <label><input type="radio" name="mode" value="normal" checked> ${htmlCopy('Normal')}</label>
      <label><input type="radio" name="mode" value="advantage"> ${htmlCopy('Advantage')}</label>
      <label><input type="radio" name="mode" value="disadvantage"> ${htmlCopy('Disadvantage')}</label></fieldset>
    <div class="attack-pair"><label>${htmlCopy('First d20')}<input type="number" name="first" min="1" max="20" inputmode="numeric"></label>
    <label>${htmlCopy('Second d20 if needed')}<input type="number" name="second" min="1" max="20" inputmode="numeric"></label></div>
    ${spellDiceFields(play,'attack').replace(/ required>/g,'>')}
    <div class="attack-pair"><label>${htmlCopy('Additional modifier')}<input type="number" name="bonus" min="-50" max="50" value="0"></label>
    <label>${htmlCopy('Target AC (optional)')}<input type="number" name="ac" min="1" max="40" inputmode="numeric"></label></div>
    <div class="toolbar"><button type="button" data-attack-fill="attack">${htmlCopy('Roll for me')}</button><button type="submit" value="attack" class="primary">${htmlCopy('Show attack result')}</button></div>
    <output data-attack-result role="status" aria-live="polite"></output>
    <h4>${htmlCopy('Damage')}</h4>
    <label><input type="checkbox" name="critical"> ${htmlCopy('Critical Hit (roll the damage dice twice)')}</label>
    <label>${htmlCopy('Damage dice results')}<input name="dice" inputmode="numeric" autocomplete="off" placeholder="${htmlCopy('e.g. 3 5')}"></label>
    <label>${htmlCopy('Extra damage')}<input type="number" name="extra" min="-50" max="100" value="0"></label>
    <p class="play-note">${htmlCopy('Add other damage (such as Sneak Attack) as Extra damage. On a Critical Hit, roll those dice twice too.')}</p>
    <div class="toolbar"><button type="button" data-attack-fill="damage">${htmlCopy('Roll damage for me')}</button><button type="submit" value="damage">${htmlCopy('Show damage')}</button></div>
    <output data-damage-result role="status" aria-live="polite"></output>
  </form></details>`;
}

function selection(form,profile){
  const f=new FormData(form);
  const row=profile.s.attacks[Number(f.get('attack'))];
  const raw=f.get('ability');
  return {f,row,ability:raw===''||raw===null||!(row?.finesse&&!row?.custom)?undefined:Number(raw)};
}
const number=(f,k,fallback=0)=>{const v=f.get(k);return v===null||v===''?fallback:Number(v);};

/** Refresh the weapon summary when the chosen attack or Finesse ability changes. */
export function attackFormChanged(form,profile){
  const {row,ability}=selection(form,profile);
  form.querySelector('[data-attack-ability]').hidden=!(row?.finesse&&!row?.custom);
  form.querySelector('[data-attack-info]').innerHTML=attackInfoHTML(profile,row,ability);
  form.querySelector('[data-attack-result]').textContent='';
  form.querySelector('[data-damage-result]').textContent='';
}

/** "Roll for me": fill the dice fields with generated results (the player can still edit them). */
export function fillAttackDice(form,which,profile,play){
  const {f,row}=selection(form,profile);
  if(which==='attack'){
    const mode=f.get('mode');
    form.elements.first.value=String(die(20));
    form.elements.second.value=mode==='normal'?'':String(die(20));
    for(const e of liveD20Dice(play,'attack'))form.elements['spell-die-'+e.spell].value=String(die(e.sides));
  } else {
    const spec=parseDamageDice(row.dice);
    const count=spec.count*(form.elements.critical.checked?2:1);
    form.elements.dice.value=Array.from({length:count},()=>die(spec.sides)).join(' ');
  }
}

export function attackFormResult(form,submitter,profile,play){
  const {f,row,ability}=selection(form,profile);
  if(submitter==='damage'){
    const spec=parseDamageDice(row.dice);
    const rolls=String(f.get('dice')??'').trim()===''?(spec.count?null:[]):String(f.get('dice')).trim().split(/[\s,+]+/).map(Number);
    if(rolls===null)throw new RangeError(copy('Enter the damage dice results, or use Roll damage for me.'));
    const r=previewDamage(profile,{row,ability,critical:form.elements.critical.checked,rolls,extra:number(f,'extra')});
    return copy('{name} damage: {dice} = {diceTotal}{flat}, modifier {mod}{extra} → {total} {type}.',{name:row.name,dice:r.count?r.count+'d'+r.sides+' ['+r.rolls.join(', ')+']':copy('no dice'),diceTotal:r.diceTotal,
      flat:r.flat?' + '+r.flat:'',mod:signed(r.modifier),extra:r.extra?', '+copy('extra')+' '+signed(r.extra):'',total:r.total,type:r.type})+
      (r.critical?' '+copy('Critical Hit: dice rolled twice.'):'')+(r.note?' '+copy(r.note):'')+' '+copy('Apply it only if the attack hit.');
  }
  const mode=f.get('mode');
  const rolls=[number(f,'first',NaN),...(mode==='normal'?[]:[number(f,'second',NaN)])];
  if(rolls.some(n=>!Number.isInteger(n)))throw new RangeError(copy(mode==='normal'?'Enter one d20 result, or use Roll for me.':'Enter both d20 results for Advantage or Disadvantage.'));
  const ac=f.get('ac')===''||f.get('ac')===null?null:Number(f.get('ac'));
  const r=previewAttack(profile,play,{row,ability,rolls,advantage:mode==='advantage',disadvantage:mode==='disadvantage',otherBonus:number(f,'bonus'),spellDice:spellDiceFrom(f),targetAC:ac});
  if(r.critical)form.elements.critical.checked=true;
  else form.elements.critical.checked=false;
  const parts=[copy('{name}: d20 {natural} ({mode})',{name:row.name,natural:r.natural,mode:copy({normal:'Normal',advantage:'Advantage',disadvantage:'Disadvantage'}[r.mode])}),
    copy('attack bonus {bonus}',{bonus:signed(r.attackBonus)}),
    ...(r.exhaustionPenalty?[copy('Exhaustion −{n}',{n:r.exhaustionPenalty})]:[]),
    ...(r.otherBonus?[copy('additional {n}',{n:signed(r.otherBonus)})]:[]),
    ...(r.spellDice.length?[spellDiceText(r.spellDice)]:[])];
  const verdict=r.automaticMiss?copy('Natural 1: the attack misses.'):r.critical?copy('Critical Hit: the attack hits. Roll damage dice twice.'):
    ac===null?copy('Your DM compares it with the target’s AC.'):copy(r.total>=ac?'Hits AC {ac}.':'Misses AC {ac}.',{ac});
  return parts.join('; ')+' → '+copy('Total {total}.',{total:r.total})+' '+verdict;
}
