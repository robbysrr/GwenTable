import {copy,htmlCopy} from './locale.js';
import {source} from './lib/rules.js';
import {characters, encounters} from './lib/storage.js';
import {migrateDraft, deriveCharacter} from './lib/character.js';
import {playProfile} from './lib/play.js';
import {creatureIndex} from './lib/creatures.js';
import {createActor, buildEncounter, appendEncounter, encounterBudget, getCreature, initiativeOrder, rolledInitiative, conditions} from './lib/encounter.js';
import {makeEncounterExport, readEncounterExport, encounterFileLimit} from './lib/portable.js';

const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const signed=value=>value>=0?'+'+value:String(value);
const fmt=value=>value.toLocaleString('en-US');
const sideNames={pc:'Party',ally:'Ally',foe:'Adversary'};
const phases={prep:'Preparation',live:'In combat',finished:'Completed'};
const stats=(label,value)=>`<div class="stat"><strong>${value}</strong><small>${label}</small></div>`;
const options=(items,value)=>items.map(([key,label])=>`<option value="${html(key)}" ${key===value?'selected':''}>${html(label)}</option>`).join('');
const navList=Object.entries(creatureIndex).map(([id,[name,,,,,,cr]])=>[id,name+' · CR '+cr]);
const rule=(page,label)=>`<a class="rule" href="${source.url}#page=${page}" rel="noopener" target="_blank">${html(label)} ↗</a>`;
const copiesFrom=(data,count,grouped)=>{
  const group=grouped&&count>1?crypto.randomUUID():null;
  return Array.from({length:count},(_,i)=>createActor({...data,group,name:count>1?data.name.slice(0,74)+' '+(i+1):data.name}));
};
const getNumber=(form,key)=> {
  const value=form.get(key);
  return value===null||value.trim()===''?NaN:Number(value);
};

export function mountEncounters(root,pickerForSelect) {
  const workspace=root.querySelector('#encounter-workspace');
  const select=root.querySelector('#encounter-select');
  const syncSavedEncounter=pickerForSelect(select,"Saved encounter");
  const file=root.querySelector('#encounter-import');
  const feedback=root.querySelector('#encounter-feedback');
  let record=null;
  let state=null;
  let selected=null;
  let roster=[];
  let busy=false;
  let prepTab='creature';
  let actorScroll=0;
  let combatInput={};
  let displayedLog=false;
  const briefEvent=(name,details={})=>({type:'brief',name,objective:details.objective??'',terrain:details.terrain??'',rewards:details.rewards??''});

  function status(text,problem=false) {
    feedback.textContent=text;
    feedback.classList.toggle('enc-problem',problem);
  }
  async function run(task) {
    if (busy) return;
    busy=true;
    try {await task();}
    catch (error) {status(error.message||copy("Could not save this change in the browser."),true);}
    finally {busy=false;}
  }
  function refresh(next,followTurn=false) {
    const oldSelected=selected;
    const previous=state;
    record=next;
    state=next?buildEncounter(next.events):null;
    const rows=workspace.querySelector('.encounter-order');
    actorScroll=rows?.scrollTop??actorScroll;
    const preserve=previous&&previous.phase===state?.phase&&state?.actors.some(a=>a.id===oldSelected);
    selected=followTurn||!preserve?state?.active??initiativeOrder(state?.actors??[])[0]?.id??null:oldSelected;
    render();
  }
  async function populate() {
    const all=(await encounters.list()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    select.innerHTML=("<option value=\"\">"+htmlCopy("Choose a saved encounter")+"</option>")+all.map(item=>`<option value="${html(item.id)}"${item.id===record?.id?' selected':''}>${html(item.name+' · '+copy(phases[item.phase]))}</option>`).join('');
    if (record) select.value=record.id;
    syncSavedEncounter();
  }
  async function setCurrent(next) {
    if (next?.id!==record?.id) {selected=null;actorScroll=0;combatInput={};displayedLog=false;}
    refresh(next);
    try {
      if (next) localStorage.setItem('open5e-current-encounter',next.id);
      else localStorage.removeItem('open5e-current-encounter');
    } catch {}
    await populate();
  }
  function stamped(events,id=crypto.randomUUID(),revision=1) {
    const current=buildEncounter(events);
    return {id,revision,events,name:current.name,phase:current.phase,updatedAt:new Date().toISOString()};
  }
  async function edit(event) {
    if (!record) return;
    const events=event?appendEncounter(record.events,event):record.events.slice(0,-1);
    const next=stamped(events,record.id,record.revision+1);
    await encounters.replace(next,record.revision);
    const follow=event?.type==='start'||event?.type==='next'||(!event&&state.phase==='live'&&buildEncounter(events).active!==state.active);
    refresh(next,follow);
    select.selectedOptions[0].textContent=next.name+' · '+copy(phases[next.phase]);
    syncSavedEncounter();
    const last=event&&state.log.at(-1);
    status(last&&event.type!=='brief'?last.text:event?copy("Saved in this browser."):copy("Undid the last change."));
    if (follow&&event?.type==='next') {
      const row=workspace.querySelector('[aria-current="step"]');
      row?.scrollIntoView({block:'nearest'});
      workspace.querySelector('[data-enc-action="next"]')?.focus({preventScroll:true});
    }
    if (!event) workspace.querySelector('[data-enc-action="undo"]')?.focus({preventScroll:true});
  }
  function brief() {
    return `<details class="enc-brief"><summary>${state.phase==='prep'?copy("Edit encounter details"):copy("Encounter details")}</summary>
      <form data-enc-form="brief">
        <label>${htmlCopy("Encounter name")}<input name="name" maxlength="100" required value="${html(state.name)}"></label>
        <div class="fields">${[['objective',copy("Objective")],['terrain',copy("Terrain")],['rewards',copy("Rewards")]].map(([key,label])=>`<label>${label}<textarea name="${key}" maxlength="1200">${html(state[key])}</textarea></label>`).join('')}</div>
        <button type="submit">${htmlCopy("Save details")}</button>
      </form>
    </details>`;
  }
  function budget() {
    const {counts:[low,moderate,high],partySize,spent}=encounterBudget(state.actors);
    const message=partySize?`<span>${partySize} party ${partySize===1?'member':'members'} · ${fmt(spent)} XP in adversaries</span>`:
      `<span>${htmlCopy("Add a PC to calculate the party’s budget.")} ${fmt(spent)} XP in adversaries.</span>`;
    return `<section class="enc-budget" aria-label="${htmlCopy("Encounter XP budget")}"><div class="enc-budget-head"><h3>Encounter XP</h3>${message}</div>
      <div class="stats">${stats('Low',partySize?fmt(low):'—')}${stats('Moderate',partySize?fmt(moderate):'—')}${stats('High',partySize?fmt(high):'—')}</div>
      <p>${partySize&&spent>high?'Adversary XP is '+fmt(spent-high)+' above the High budget. ':''}${rule(202,'SRD budget table')}</p></section>`;
  }
  function addPanel() {
    const tab=(key,label)=>`<button type="button" data-enc-action="tab" data-tab="${key}" aria-pressed="${prepTab===key}">${label}</button>`;
    let pane='';
    if(prepTab==='creature') pane=`<form data-enc-form="creature">
      <label>${htmlCopy("Creature")}<select name="creatureId" id="encounter-creature"><option value="" selected disabled>${htmlCopy("Choose a creature")}</option>${options(navList)}</select></label>
      <p id="encounter-creature-info" class="enc-muted">${htmlCopy("330 SRD 5.2.1 creature stat blocks.")}</p>
      <div class="fields"><label>${htmlCopy("Copies")}<input name="count" type="number" min="1" max="20" value="1" required></label>
      <label class="enc-checkbox"><input name="grouped" type="checkbox" checked> ${htmlCopy("Share initiative roll")}</label></div>
      <label id="encounter-lair" class="enc-checkbox" hidden><input name="lair" type="checkbox"> ${htmlCopy("In its lair (use lair XP)")}</label>
      <button type="submit" class="primary">${htmlCopy("Add creature")}</button></form>`;
    if(prepTab==='party') pane=roster.length?`<form data-enc-form="party"><label>${htmlCopy("Saved character")}<select name="characterId"><option value="" selected disabled>${htmlCopy("Choose a character")}</option>${options(roster.map(item=>[item.id,item.draft.name+' · Level '+item.draft.level]))}</select></label>
      <p class="enc-muted">${htmlCopy("Copies HP, AC, level, and initiative into this encounter.")}</p><button type="submit" class="primary">${htmlCopy("Add saved character")}</button></form>`:
      ("<p>"+htmlCopy("Save a character in the builder to add it here, or use Manual entry for a sheet you already have.")+"</p>");
    if(prepTab==='manual') pane=`<form data-enc-form="manual">
      <div class="fields"><label>${htmlCopy("Name")}<input name="name" maxlength="80" required></label><label>${htmlCopy("Side")}<select name="side" id="encounter-manual-side">${options(Object.entries(sideNames).map(([key,label])=>[key,copy(label)]),'pc')}</select></label>
      <label>Max HP<input name="maxHP" type="number" min="1" max="9999" value="10" required></label><label>Armor Class<input name="ac" type="number" min="0" max="99" value="10" required></label>
      <label>${htmlCopy("Initiative modifier")}<input name="initBonus" type="number" min="-40" max="60" value="0" required></label><label id="encounter-manual-level">${htmlCopy("PC level")}<input name="level" type="number" min="1" max="20" value="1"></label>
      <label id="encounter-manual-xp" hidden>${htmlCopy("Creature XP")}<input name="xp" type="number" min="0" max="999999" value="0"></label>
      <label class="enc-checkbox"><input name="advantage" type="checkbox"> ${htmlCopy("Initiative advantage")}</label></div>
      <button class="primary" type="submit">${htmlCopy("Add combatant")}</button></form>`;
    return `<section class="card enc-add"><h2>${htmlCopy("Add combatants")}</h2><div class="toolbar">${tab('creature','SRD creature')}${tab('party',copy("Saved character"))}${tab('manual',copy("Manual entry"))}</div>${pane}</section>`;
  }
  function health(actor) {
    if(actor.dead) return copy('Dead');
    if(actor.stable) return copy("Stable · unconscious");
    if(actor.hp===0) return actor.side==='pc'?copy("Down · unconscious"):copy("At 0 HP");
    return actor.hp+'/'+actor.maxHP+' HP'+(actor.temp?' + '+actor.temp+' temp':'');
  }
  function orderPanel() {
    const order=initiativeOrder(state.actors);
    const prep=state.phase==='prep';
    const rows=order.map((actor,index)=>{
      const creature=actor.creatureId?getCreature(actor.creatureId):null;
      const a=html(actor.id);
      const meta=(actor.level?'Level '+actor.level:copy(sideNames[actor.side]))+' · AC '+actor.ac+(creature?' · CR '+creature.cr:'');
      const tie=delta=>actor.initiative!==null&&actor.initiative===order[index+delta]?.initiative;
      const tags=[...actor.conditions,...(actor.exhaustion?['Exhaustion '+actor.exhaustion]:[]),...(actor.focus?['Concentrating: '+actor.focus]:[])];
      return `<li class="enc-row ${actor.id===selected?'enc-selected':''}" ${state.active===actor.id?'aria-current="step"':''} data-actor="${a}">
        <div class="enc-row-main"><span class="enc-initiative" title="Initiative">${actor.initiative??'—'}</span>
        <div class="enc-row-title">${prep?`<strong>${html(actor.name)}</strong>`:`<button type="button" class="enc-actor-button" data-enc-action="select-actor" data-id="${a}" aria-pressed="${actor.id===selected}">${html(actor.name)}</button>`}
          <small>${meta}${state.active===actor.id?' · Current turn':''}</small></div>
        <div class="enc-health ${actor.hp===0||actor.dead?'enc-down':''}">${health(actor)}</div></div>
        ${prep?`<form class="enc-init-form" data-enc-form="initiative" data-id="${a}"><label>Initiative <input type="number" name="value" min="-100" max="100" required value="${actor.initiative??''}" aria-label="Initiative for ${html(actor.name)}"></label>
        <button type="submit" aria-label="Set initiative for ${html(actor.name)}">${htmlCopy("Set")}</button>
        ${tie(-1)?`<button type="button" data-enc-action="tie-up" data-id="${a}" aria-label="Move ${html(actor.name)} up within tie">↑</button>`:''}
        ${tie(1)?`<button type="button" data-enc-action="tie-down" data-id="${a}" aria-label="Move ${html(actor.name)} down within tie">↓</button>`:''}
        <button type="button" data-enc-action="remove" data-id="${a}" aria-label="Remove ${html(actor.name)}">${htmlCopy("Remove")}</button></form>`:''}
        ${tags.length?`<div class="enc-tags">${tags.map(tag=>`<span>${html(tag)}</span>`).join('')}</div>`:''}
        ${creature?rule(creature.page,'SRD stat block'):''}</li>`;
    }).join('');
    const unset=order.some(a=>a.initiative===null);
    const passive=order.some(a=>a.initiative===null&&a.passiveInitiative!==null);
    return `<section class="card enc-roster"><h2>${htmlCopy("Initiative order")}</h2>
      ${prep&&order.length?`<div class="toolbar"><button type="button" data-enc-action="roll" ${unset?'':'disabled'}>${htmlCopy("Roll unassigned")}</button>${passive?("<button type=\"button\" data-enc-action=\"passive\">"+htmlCopy("Use passive monster initiative")+"</button>"):''}
      <button type="button" class="primary" data-enc-action="start" ${unset?'disabled':''}>${htmlCopy("Start combat")}</button></div>`:''}
      ${rows?`<ol class="encounter-order">${rows}</ol>`:("<p>"+htmlCopy("Add combatants to start setting initiative.")+"</p>")}</section>`;
  }
  function combatPanel() {
    const a=state.actors.find(row=>row.id===selected);
    if (!a) return '';
    const live=state.phase==='live';
    const down=a.side==='pc'&&a.hp===0&&!a.dead;
    const saveForm=down&&!a.stable?`<form data-enc-form="deathSave" class="enc-inline">
      <label>${htmlCopy("d20 result")}<input name="value" type="number" min="1" max="20" required></label><button type="submit">${htmlCopy("Record death save")}</button>
      <button type="button" data-enc-action="death-roll">Roll d20</button><button type="button" data-enc-action="stable">${htmlCopy("Stabilize")}</button></form>`:'';
    const currentInput=combatInput[a.id]??{};
    const hpForm=`<form data-enc-form="hp" class="enc-inline"><label>${htmlCopy("Amount")}<input type="number" name="value" min="0" max="9999" value="${html(currentInput.value??'')}" required></label>
      <button name="operation" value="damage" type="submit" class="primary">${htmlCopy("Damage")}</button><button name="operation" value="heal" type="submit">${htmlCopy("Heal")}</button><button name="operation" value="temp" type="submit">${htmlCopy("Set temp HP")}</button>
      <label class="enc-checkbox"><input name="critical" type="checkbox" ${currentInput.critical?'checked':''}> ${htmlCopy("Critical hit")}</label></form>`;
    const cond=conditions.filter(name=>name!=='Exhaustion').map(name=>[name,a.conditions.includes(name)?'Remove '+name:'Add '+name]);
    return `<section class="card enc-controls"><h2>${html(a.name)}</h2><p>AC ${a.ac} · ${a.hp}/${a.maxHP} HP · ${a.temp} temporary HP${a.dead?' · Dead':''}</p>
      ${down?`<p>${a.stable?'Stable':'Death saves · '+a.successes+' successes · '+a.failures+' failures'}</p>`:''}
      ${live&&!a.dead?hpForm+saveForm+
       `<form data-enc-form="condition" class="enc-inline"><label>Conditions<select name="name">${options(cond)}</select></label><button type="submit">${htmlCopy("Apply")}</button></form>
        <form data-enc-form="exhaustion" class="enc-inline"><label>Exhaustion<input type="number" name="value" min="0" max="6" value="${a.exhaustion}" required></label><button type="submit">${htmlCopy("Set")}</button></form>
        ${a.hp>0?`<form data-enc-form="focus" class="enc-inline"><label>Concentration<input name="value" maxlength="80" value="${html(a.focus)}" placeholder="Spell or effect"></label><button type="submit">${htmlCopy("Set")}</button>${a.focus?("<button type=\"button\" data-enc-action=\"end-focus\">"+htmlCopy("End concentration")+"</button>"):''}</form>`:''}`:
      '<p>'+(!live?copy("Combat has ended."):copy("Undo the last change if the death was recorded in error."))+'</p>'}</section>`;
  }
  function render() {
    if(!record) {
      workspace.innerHTML=("<section class=\"card\"><h2>"+htmlCopy("Prepare an encounter")+"</h2><p>"+htmlCopy("Build a roster, record an objective, and set initiative. Encounters save in this browser.")+"</p></section>");
      return;
    }
    const prep=state.phase==='prep';
    const live=state.phase==='live';
    const current=state.actors.find(actor=>actor.id===state.active);
    const last=state.log.slice(-12).reverse();
    workspace.innerHTML=`<section class="card enc-banner"><div><h2>${html(state.name)}</h2>
      <p>${prep?htmlCopy('Preparation'):live?htmlCopy('Round {round} · {name}’s turn',{round:state.round,name:current.name}):htmlCopy('Completed · Round {round}',{round:state.round})}</p>${state.objective?`<p>${html(state.objective)}</p>`:''}</div>
      <div class="toolbar">${live?("<button class=\"primary\" data-enc-action=\"next\" type=\"button\">"+htmlCopy("Next turn →")+"</button><button data-enc-action=\"finish\" type=\"button\">"+htmlCopy("End combat")+"</button>"):''}
      <button data-enc-action="undo" type="button" ${record.events.length<=1?'disabled':''}>${htmlCopy("Undo")}</button><button data-enc-action="export" type="button">${htmlCopy("Export JSON")}</button>
      <button data-enc-action="duplicate" type="button">${htmlCopy("Duplicate setup")}</button>
      ${!prep?("<button data-enc-action=\"print\" type=\"button\">"+htmlCopy("Print recap")+"</button>"):''}</div>${brief()}</section>
      ${prep?budget():''}
      <div class="enc-grid">${orderPanel()}${prep?addPanel():combatPanel()}</div>
      ${!prep?`<section class="card enc-log"><h2>${htmlCopy("Combat log")}</h2><form data-enc-form="note" class="enc-inline"><label>${htmlCopy("Action or session note")}<input name="value" maxlength="400" required></label><button type="submit">${htmlCopy("Add note")}</button></form>
        <ol>${(displayedLog?state.log.slice().reverse():last).map(row=>`<li><span>${row.round?'Round '+row.round:copy("Setup")}</span> ${html(row.text)}</li>`).join('')}</ol>
        ${state.log.length>12?`<button data-enc-action="toggle-log" type="button">${displayedLog?copy("Show recent events"):'Show all '+state.log.length+' entries'}</button>`:''}</section>`:''}`;
    for(const pick of workspace.querySelectorAll('select')) {
      const label=pick.closest('label').firstChild.textContent.trim();
      if(pick.id==='encounter-creature') {
        pickerForSelect(pick,label,({value})=>{
          const creature=getCreature(value);
          return {value,name:creature.name,category:'CR '+creature.cr,page:creature.page,
            fields:[['Hit Points',creature.hp],['Armor Class',creature.ac],['XP',fmt(creature.xp)]]};
        },'Challenge rating');
      } else pickerForSelect(pick,label);
    }
    const order=workspace.querySelector('.encounter-order');
    if (order) order.scrollTop=actorScroll;
  }
  function creatureDetails() {
    const choice=workspace.querySelector('#encounter-creature');
    const creature=getCreature(choice.value);
    const info=workspace.querySelector('#encounter-creature-info');
    info.innerHTML=creature?`${creature.hp} HP · AC ${creature.ac} · Initiative ${signed(creature.initBonus)} · ${fmt(creature.xp)} XP
      ${creature.lairXP?' (in lair '+fmt(creature.lairXP)+' XP)':''} · ${rule(creature.page,'SRD stat block')}`:copy("330 SRD 5.2.1 creature stat blocks.");
    const lair=workspace.querySelector('#encounter-lair');
    lair.hidden=!creature?.lairXP;
    lair.querySelector('input').checked=false;
  }
  function printRecap() {
    document.querySelector('#printout').innerHTML=`<h1>${html(state.name)}</h1><p>${phases[state.phase]} · Round ${state.round} · ${fmt(encounterBudget(state.actors).spent)} planned adversary XP</p>
      ${[[copy("Objective"),state.objective],[copy("Terrain"),state.terrain],[copy("Rewards"),state.rewards]].filter(([,value])=>value).map(([label,value])=>`<p><b>${label}</b> ${html(value)}</p>`).join('')}
      <h2>${htmlCopy("Combatants")}</h2><ul>${initiativeOrder(state.actors).map(a=>`<li>${html(a.name)} · Initiative ${a.initiative} · ${health(a)}</li>`).join('')}</ul>
      <h2>${htmlCopy("Combat log")}</h2><ol>${state.log.map(row=>`<li>${row.round?'Round '+row.round:copy("Setup")} · ${html(row.text)}</li>`).join('')}</ol>`;
    window.print();
  }
  const actions={
    new:async()=>{
      const next=stamped([briefEvent('Untitled encounter')]);
      await encounters.add(next);
      await setCurrent(next);
      const brief=workspace.querySelector('.enc-brief');
      brief.open=true;
      brief.querySelector('input').select();
      status(copy("New encounter saved in this browser."));
    },
    duplicate:async()=>{
      const events=[briefEvent(state.name.slice(0,91)+' (copy)',state)];
      if(state.actors.length) events.push({type:'add',actors:state.actors.map(actor=>createActor(actor))});
      const next=stamped(events);
      await encounters.add(next);
      await setCurrent(next);
      status(copy("Setup duplicated. Initiative, HP, and the combat log are reset for the new encounter."));
    },
    export:async()=>{
      const data=await makeEncounterExport(record.events);
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download=(state.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'encounter')+'.open5e-encounter.json';
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      status(copy("Encounter backup downloaded."));
    },
    import:()=>file.click(),
    undo:()=>edit(null),
    tab:button=>{prepTab=button.dataset.tab;render();workspace.querySelector(`[data-tab="${prepTab}"]`)?.focus();},
    'select-actor':button=>{selected=button.dataset.id;actorScroll=workspace.querySelector('.encounter-order')?.scrollTop??0;render();
      workspace.querySelector(`[data-enc-action="select-actor"][data-id="${selected}"]`)?.focus({preventScroll:true});},
    remove:button=>edit({type:'remove',id:button.dataset.id}),
    'tie-up':button=>edit({type:'tie',id:button.dataset.id,direction:-1}),
    'tie-down':button=>edit({type:'tie',id:button.dataset.id,direction:1}),
    roll:()=>{
      const unset=state.actors.filter(a=>a.initiative===null);
      const values=rolledInitiative(unset);
      return edit({type:'initiative',entries:unset.map((actor,i)=>[actor.id,values[i]])});
    },
    passive:()=>edit({type:'initiative',entries:state.actors.filter(a=>a.initiative===null&&a.passiveInitiative!==null).map(a=>[a.id,a.passiveInitiative])}),
    start:()=>edit({type:'start'}),
    next:()=>edit({type:'next'}),
    finish:()=>edit({type:'finish'}),
    'end-focus':()=>edit({type:'focus',id:selected,value:''}),
    'death-roll':()=>edit({type:'deathSave',id:selected,value:1+Math.floor(Math.random()*20)}),
    stable:()=>edit({type:'stable',id:selected}),
    print:printRecap,
    'toggle-log':()=>{displayedLog=!displayedLog;render();}
  };
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-enc-action]');
    if(button) run(()=>actions[button.dataset.encAction](button));
  });
  root.addEventListener('submit',event=>{
    const form=event.target;
    const type=form.dataset.encForm;
    if (!type) return;
    event.preventDefault();
    run(async()=>{
      const values=new FormData(form);
      const number=key=>getNumber(values,key);
      if(type==='brief') return edit({type,name:values.get('name').trim(),objective:values.get('objective'),terrain:values.get('terrain'),rewards:values.get('rewards')});
      if(type==='creature') {
        const creatureId=values.get('creatureId'), creature=getCreature(creatureId), count=number('count');
        if(!creature||!Number.isInteger(count)||count<1||count>20) throw new Error(copy("Select a creature and one to twenty copies."));
        return edit({type:'add',actors:copiesFrom({name:creature.name,side:'foe',maxHP:creature.hp,ac:creature.ac,initBonus:creature.initBonus,
          passiveInitiative:creature.passiveInitiative,xp:values.has('lair')&&creature.lairXP?creature.lairXP:creature.xp,creatureId},count,values.has('grouped'))});
      }
      if(type==='party') {
        const saved=roster.find(row=>row.id===values.get('characterId'));
        if(!saved) throw new Error(copy("Choose a saved character."));
        const d=saved.draft, profile=playProfile(d,saved.multiclassActive),s=profile.s;
        return edit({type:'add',actors:[createActor({name:d.name,side:'pc',level:profile.totalLevel??d.level,maxHP:profile.maxHP,ac:s.ac,initBonus:s.initiative,initAdvantage:s.initiativeAdvantage})]});
      }
      if(type==='manual') {
        const side=values.get('side');
        return edit({type:'add',actors:[createActor({name:values.get('name'),side,level:side==='pc'?number('level'):null,maxHP:number('maxHP'),
          ac:number('ac'),initBonus:number('initBonus'),initAdvantage:values.has('advantage'),xp:side==='foe'?number('xp'):0})]});
      }
      if(type==='initiative') return edit({type,entries:[[form.dataset.id,number('value')]]});
      if(type==='hp') {
        const operation=event.submitter?.value??'damage';
        const change={type:operation,id:selected,value:number('value')};
        if(operation==='damage') change.critical=values.has('critical');
        await edit(change);
        delete combatInput[selected];
        const amount=workspace.querySelector('[data-enc-form="hp"] input[name="value"]');
        if(amount) {amount.value='';amount.focus({preventScroll:true});}
        const critical=workspace.querySelector('[data-enc-form="hp"] input[name="critical"]');
        if(critical) critical.checked=false;
        return;
      }
      if(type==='condition') return edit({type,id:selected,name:values.get('name')});
      if(type==='focus') return edit({type,id:selected,value:values.get('value')});
      if(type==='note') return edit({type,value:values.get('value')});
      return edit({type,id:selected,value:number('value')});
    });
  });
  root.addEventListener('input',event=>{
    if(event.target.closest('[data-enc-form="hp"]')) {
      const values=new FormData(event.target.form);
      combatInput[selected]={value:values.get('value'),critical:values.has('critical')};
    }
  });
  root.addEventListener('change',event=>{
    if(event.target.id==='encounter-creature') creatureDetails();
    if(event.target.id==='encounter-manual-side') {
      workspace.querySelector('#encounter-manual-level').hidden=event.target.value!=='pc';
      workspace.querySelector('#encounter-manual-xp').hidden=event.target.value!=='foe';
    }
  });
  select.onchange=()=>run(async()=>{
    await setCurrent(select.value?await encounters.get(select.value):null);
    status(record?copy("Encounter opened."):'');
  });
  file.onchange=()=>{
    const chosen=file.files[0];
    file.value='';
    if(!chosen) return;
    run(async()=>{
      if(chosen.size>encounterFileLimit) throw new Error(copy("Choose an encounter file under 1 MB."));
      const next=stamped(await readEncounterExport(await chosen.text()));
      await encounters.add(next);
      await setCurrent(next);
      status(copy("Encounter imported as a new local copy."));
    });
  };
  render();
  return ()=>run(async()=>{
    roster=(await characters.list()).map(item=>({...item,draft:migrateDraft(item.draft)}));
    let recent;
    try {recent=localStorage.getItem('open5e-current-encounter');} catch {}
    if(!record&&recent) await setCurrent(await encounters.get(recent));
    else {await populate();render();}
  });
}
