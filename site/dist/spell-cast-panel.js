// Play sheet "Cast a spell": choose a spell, see its SRD casting details, choose how to cast,
// confirm. One reducer action spends the slot and starts/replaces Concentration together.
import {copy,htmlCopy} from './locale.js';
import {castableSpells,castOptions} from './lib/srd-spell-cast.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>(n>=0?'+':'−')+Math.abs(n);
const ordinal=n=>copy('Level {n}',{n});

function methodLabel(m){
  if(m.kind==='cantrip')return copy('Cantrip · no slot');
  if(m.kind==='ritual')return copy('Ritual · 10 minutes longer, no slot');
  return copy('{level} slot · {left} of {count} left',{level:ordinal(m.level),left:m.remaining,count:m.count});
}

export function castDetailsHTML(profile,play,name){
  if(!name)return '';
  const o=castOptions(profile,play,name);
  const h=o.header;
  const usable=o.methods.filter(m=>m.kind!=='slot'||m.remaining>0);
  const methods=o.methods.map((m,i)=>`<option value="${m.kind}:${m.level??''}"${m.kind==='slot'&&m.remaining<1?' disabled':''}${usable[0]===m?' selected':''}>${esc(methodLabel(m))}</option>`).join('');
  return `<dl class="cast-facts">
      <div><dt>${htmlCopy('Casting Time')}</dt><dd lang="en">${esc(h.castingTime)}</dd></div>
      <div><dt>${htmlCopy('Range')}</dt><dd lang="en">${esc(h.range)}</dd></div>
      <div><dt>${htmlCopy('Components')}</dt><dd lang="en">${esc(h.components)}</dd></div>
      <div><dt>${htmlCopy('Duration')}</dt><dd lang="en">${esc(h.duration)}</dd></div>
      ${o.spell.dc?`<div><dt>${htmlCopy('Save DC')}</dt><dd>${o.spell.dc}</dd></div><div><dt>${htmlCopy('Spell attack')}</dt><dd>${esc(signed(o.spell.attack))}</dd></div>`:''}
    </dl>
    ${o.concentration?`<p class="cast-badge">${htmlCopy('Concentration')}</p>`:''}
    <details class="cast-text" data-cast-text="${esc(name)}"><summary>${htmlCopy('Read the SRD spell text')} · SRD p. ${h.page}</summary><p lang="en" data-cast-text-body>${htmlCopy('Loading official rules…')}</p></details>
    ${o.dedicated?`<p class="play-note" role="note">${htmlCopy(o.dedicated)}</p>`:
      o.methods.length?`<label>${htmlCopy('Cast using')}<select name="method">${methods}</select></label>
      <p class="cast-consequence" data-cast-consequence></p>
      <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('I cast this spell at the table.')}</label>
      <button type="submit" class="primary"${usable.length?'':' disabled'}>${htmlCopy('Record casting')}</button>
      ${usable.length?'':`<p class="play-note" role="note">${htmlCopy('No spell slots of a suitable level remain. Finish a rest or choose another spell.')}</p>`}`:
      `<p class="play-note" role="note">${htmlCopy('This spell is in your spellbook but not prepared, and it has no Ritual tag.')}</p>`}`;
}

export function castConsequence(profile,play,form){
  const name=form.elements.spell.value;
  const box=form.querySelector('[data-cast-consequence]');
  if(!box||!name)return;
  const o=castOptions(profile,play,name);
  const [kind,level]=String(form.elements.method?.value??'').split(':');
  const parts=[kind==='slot'?copy('Spends one {level} slot.',{level:ordinal(Number(level))}):kind==='ritual'?copy('No slot spent; takes 10 minutes longer.'):copy('No slot spent.')];
  if(o.concentration)parts.push(play.focus&&play.focus!==name?copy('Starts Concentration on {spell} and ends Concentration on {old}.',{spell:name,old:play.focus}):copy('Starts Concentration on {spell}.',{spell:name}));
  if(kind==='slot')parts.push(copy('Only one spell slot can be spent per turn.'));
  parts.push(copy('Targets, saves, damage and components are handled at the table.'));
  box.textContent=parts.join(' ');
}

export function castPanelHTML(profile,play){
  if(play?.dead||play?.shape?.active)return '';
  const rows=castableSpells(profile);
  if(!rows.length)return '';
  const group=(label,list)=>list.length?`<optgroup label="${esc(label)}">${list.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}${r.prepared?'':' · '+esc(copy('spellbook ritual'))}</option>`).join('')}</optgroup>`:'';
  const levels=[...new Set(rows.filter(r=>r.level>0).map(r=>r.level))].sort((a,b)=>a-b);
  return `<details class="play-cast-panel" open><summary>${htmlCopy('Cast a spell')}</summary>
    <form data-play-form="spell-cast" class="enc-inline">
      <p class="play-note">${htmlCopy('Record a spell you cast: the slot and Concentration update together, and Undo reverses both.')}</p>
      <label>${htmlCopy('Spell')}<select name="spell"><option value="">${htmlCopy('Choose a spell')}</option>
        ${group(copy('Cantrips'),rows.filter(r=>r.level===0))}
        ${levels.map(l=>group(ordinal(l),rows.filter(r=>r.level===l&&r.prepared))).join('')}
        ${group(copy('Spellbook rituals'),rows.filter(r=>!r.prepared))}</select></label>
      <div data-cast-details></div>
    </form></details>`;
}

export function castFormChanged(form,profile,play,target){
  if(target.name==='spell'){
    form.querySelector('[data-cast-details]').innerHTML=castDetailsHTML(profile,play,form.elements.spell.value);
  }
  castConsequence(profile,play,form);
}

export async function loadCastText(details){
  const body=details.querySelector('[data-cast-text-body]');
  if(!body||body.dataset.loaded)return;
  try {
    const {entryText}=await import('./lib/srd-entry-text.js');
    body.textContent=entryText['Spell|'+details.dataset.castText]?.[1]??copy('Open the Compendium for this spell.');
    body.dataset.loaded='1';
  } catch {body.textContent=copy('The rules text could not load. Open the official PDF below.');}
}

export function castCommand(form){
  const [kind,level]=String(form.elements.method?.value??'').split(':');
  return {type:'spell-cast',spell:form.elements.spell.value,method:kind,...(kind==='slot'?{slotLevel:Number(level)}:{}),confirmed:form.elements.confirmed?.checked===true};
}
