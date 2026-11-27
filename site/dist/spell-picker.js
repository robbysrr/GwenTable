import {icon} from './ui-icons.js';
import {copy} from './locale.js';
import {metricText} from './lib/distances.js';
import {source} from './lib/rules.js';

function option(value,label) {return new Option(label,String(value));}
function button(text,action) {
  const node=document.createElement('button');
  node.type='button';
  node.textContent=text;
  node.onclick=action;
  return node;
}
const levelLabel=level=>level===0?'Cantrip':'Level '+level;

const fold=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,'').trim();
export function filterChoices(rows,{query='',category='',level='',concentration=false}={}) {
  const words=fold(query).split(/\s+/);
  return rows.filter(row=>words.every(word=>fold([row.name,row.category,row.keywords,row.time,row.tags].join(' ')).includes(word))&&
    (!category||row.category===category)&&(level===''||row.level===Number(level))&&
    (!concentration||row.duration?.startsWith('Concentration')));
}
export function mountChoicePicker(dialog,openOfficial) {
  const title=dialog.querySelector('h2');
  const query=dialog.querySelector('[type=search]');
  const level=dialog.querySelector('[data-spell-level]');
  const school=dialog.querySelector('[data-spell-school]');
  const concentration=dialog.querySelector('[data-concentration]');
  const selectedOnly=dialog.querySelector('[data-selected-only]');
  const count=dialog.querySelector('[role=status]');
  const results=dialog.querySelector('[data-spell-results]');
  const details=dialog.querySelector('[data-spell-details]');
  const toolbar=dialog.querySelector('[data-selection-toolbar]');
  const tally=toolbar.querySelector('[data-selection-count]');
  const applySelection=toolbar.querySelector('button');
  const selectionMessage=toolbar.querySelector('[data-selection-message]');
  const returning=dialog.querySelector('[data-picker-back]');
  let rows=[];
  let selected;
  let choose;
  let isSpell;
  let selection;
  let required;
  let readOnly;
  let shortMode;
  let opener;
  let initialSelection;
  let committed=false;
  let session=0;
  const close=dialog.querySelector('[data-picker-close]');
  let trigger;
  const resultButtons=new Map();
  const discard=button(copy('Discard unapplied changes'),()=>dialog.close());
  discard.className='quiet-action';
  discard.hidden=true;
  toolbar.append(discard);
  function requestClose() {
    const dirty=selection&&(selection.size!==initialSelection.size||[...selection].some(value=>!initialSelection.has(value)));
    if(dirty) {
      selectionNotice(copy('Your spell picks have not been applied. Apply them, or discard these changes.'));
      discard.textContent=copy('Discard unapplied changes');
      discard.hidden=false;
      discard.focus();
      return;
    }
    dialog.close();
  }
  function commit(value,expectedSession=session) {
    if(expectedSession!==session||!dialog.open||readOnly||committed) return;
    committed=true;
    dialog.close();
    choose(value);
  }

  function selectionNotice(message='') {
    discard.hidden=true;
    selectionMessage.textContent=message;
    selectionMessage.hidden=!message;
  }
  function toggleSpell(value) {
    if(selection.has(value)) selection.delete(value);
    else if(selection.size<required) selection.add(value);
    else {
      selectionNotice(copy('All {limit} spots are filled. Remove a spell first, or use Selected only to find your picks.',{limit:required}));
      return false;
    }
    selectionNotice();
    refreshSelection();
    return true;
  }
  function refreshSelection() {
    if(!selection) return;
    tally.textContent=copy('{picked} of {limit} selected',{picked:selection.size,limit:required});
    for(const [row,{control,quick}] of resultButtons) {
      const heading=control.querySelector('strong');
      heading.textContent=labelFor(row);
      if(isSpell) heading.insertAdjacentHTML('afterbegin',icon('spell'));
      if(quick) {
        const picked=selection.has(row.value);
        quick.textContent=picked?copy("Remove"):copy("Add");
        quick.setAttribute('aria-label',copy(picked?'Remove {name}':'Add {name}',{name:row.name}));
      }
    }
  }
  function labelFor(row) {
    return row.name+(isSpell?' · '+levelLabel(row.level):row.category?' · '+row.category:'')+
      ((selection?selection.has(row.value):row.value===selected)?' · '+copy('selected'):'');
  }
  function backToResults() {
    dialog.classList.remove('is-inspecting');
    trigger?.focus();
  }
  returning.onclick=backToResults;
  applySelection.onclick=()=>{
    if(selection.size!==required) {
      selectionNotice(copy(required-selection.size===1?'Choose {count} more spell before applying.':'Choose {count} more spells before applying.',{count:required-selection.size}));
      return;
    }
    commit([...selection]);
  };
  function inspect(row,control,focus=true) {
    const generation=session;
    trigger=control;
    dialog.classList.add('is-inspecting');
    for(const {control:node} of resultButtons.values()) node.setAttribute('aria-pressed',String(node===control));
    const heading=document.createElement('h3');
    heading.textContent=row.name;
    heading.tabIndex=-1;
    const summary=document.createElement('p');
    summary.textContent=metricText(row.summary??row.effect);
    const list=document.createElement('dl');
    for(const [label,value] of (isSpell?[[copy("Level and school"),levelLabel(row.level)+' · '+row.category],[copy("Casting time"),row.time],['Range',row.range],['Components',row.components],['Duration',row.duration]]:row.fields??[])) {
      const term=document.createElement('dt');
      const definition=document.createElement('dd');
      term.textContent=label;
      definition.textContent=metricText(value);
      list.append(term,definition);
    }
    const link=document.createElement('a');
    link.href=source.url+'#page='+row.page;
    link.target='_blank';
    link.rel='noopener';
    link.textContent='SRD 5.2.1 · p. '+row.page;
    const chosen=selection?.has(row.value);
    const apply=button(copy(selection?(chosen?'Remove {name}':'Add {name}'):'Choose {name}',{name:row.name}),()=>{
      if(selection) {
        if(!toggleSpell(row.value)) return;
        inspect(row,control,false);
        details.querySelector('button:enabled')?.focus();
        return;
      }
      if(!row.disabled) commit(row.value,generation);
    });
    const hint=document.createElement('p');
    hint.textContent=copy("Remove a selected spell before adding another.");
    const full=Boolean(selection&&!chosen&&selection.size>=required);

    apply.className='primary';
    apply.disabled=Boolean(row.disabled);
    const official=button(copy("Full official rules"),()=>openOfficial?.({name:row.name,first:row.page,spellName:isSpell?row.name:null}));
    official.className='quiet-action';
    const picked=readOnly||(selection?selection.has(row.value):row.value===selected);
    details.replaceChildren(heading,list,...(summary.textContent?[summary]:[]),...(row.page?[picked&&openOfficial?official:link]:[]),
      ...(full?[hint]:[]),...(readOnly?[]:[apply]));
    if(focus) heading.focus();
  }
  function render() {
    const generation=session;
    const pool=selection&&selectedOnly.checked?rows.filter(row=>selection.has(row.value)):rows;
    const matches=filterChoices(pool,{query:query.value,level:level.value,category:school.value,concentration:concentration.checked});
    count.textContent=matches.length?copy(matches.length===1?'{count} choice available':'{count} choices available',{count:matches.length}):copy("No eligible choices match your filters.");
    dialog.classList.remove('is-inspecting');
    trigger=null;
    resultButtons.clear();
    details.replaceChildren();
    if(selection) matches.sort((a,b)=>Number(selection.has(b.value))-Number(selection.has(a.value)));
    const entries=matches.map(row=>{
      const item=document.createElement('li');
      const control=button('',()=>{
        if(!shortMode||readOnly) return inspect(row,control);
        if(!row.disabled) commit(row.value,generation);
      });
      control.className='choice-row-main';
      control.disabled=Boolean(row.disabled);
      if(row.disabled) control.setAttribute('aria-disabled','true');
      const heading=document.createElement('strong');
      heading.textContent=labelFor(row);
      if(isSpell||shortMode) heading.insertAdjacentHTML('afterbegin',icon(isSpell?'spell':row.icon??'check'));
      control.append(heading);
      const preview=row.summary??row.effect;
      if(preview) {
        const snippet=document.createElement('span');
        snippet.className='choice-row-summary';
        snippet.textContent=metricText(preview);
        if(!shortMode) snippet.setAttribute('aria-hidden','true');
        control.append(snippet);
      }
      if(row.disabled&&row.disabledReason) {
        const reason=document.createElement('span');
        reason.textContent=row.disabledReason;
        control.append(reason);
      }
      const quick=selection?button('',()=>{
        if(toggleSpell(row.value)&&selectedOnly.checked&&!selection.has(row.value)) {
          render();
          selectedOnly.focus();
        }
      }):null;
      if(quick) {
        item.classList.add('has-quick-pick');
        quick.className='choice-row-quick';
        quick.disabled=Boolean(row.disabled);
      }
      resultButtons.set(row,{control,quick});
      control.setAttribute('aria-pressed',String(shortMode&&row.value===selected));
      item.append(control,...(quick?[quick]:[]));
      return item;
    });
    results.replaceChildren(...entries);
    refreshSelection();
  }
  close.onclick=requestClose;
  dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
  const outside=event=>{
    const rect=dialog.getBoundingClientRect();
    return event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||
      event.clientY<rect.top||event.clientY>rect.bottom);
  };
  let downOutside=false;
  dialog.addEventListener('pointerdown',event=>{downOutside=outside(event);});
  dialog.addEventListener('click',event=>{
    if(downOutside&&outside(event)) requestClose();
    downOutside=false;
  });
  dialog.addEventListener('close',()=>{
    if(dialog.open) return;
    if(opener?.isConnected&&(document.activeElement===document.body||dialog.contains(document.activeElement))) opener.focus();
  });
  dialog.addEventListener('input',event=>{if(event.target===query&&!event.isComposing)render();});
  query.addEventListener('compositionend',render);
  [level,school,concentration,selectedOnly].forEach(input=>input.onchange=render);
  dialog.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key)||!(event.target===query||results.contains(event.target))) return;
    const nodes=[...results.querySelectorAll('.choice-row-main')].filter(node=>!node.disabled);
    const index=nodes.indexOf(event.target);
    const next=index<0?0:index+(event.key==='ArrowDown'?1:-1);
    event.preventDefault();
    (nodes[next]??(shortMode?close:query)).focus();
  });
  return ({label,options,value,onChoose,spells=false,short=!spells,categoryLabel=copy("Category"),limit})=>{
    if(dialog.open) return;
    committed=false;
    session++;
    opener=document.activeElement;
    downOutside=false;
    shortMode=short;
    dialog.classList.toggle('short-choices',shortMode);
    dialog.querySelector('.picker-filters').hidden=shortMode;
    rows=options;
    isSpell=spells;
    dialog.querySelector('[data-picker-query-label]').textContent=spells?copy("Search eligible spells"):copy("Search choices");
    query.placeholder=spells?copy("Spell name or school"):copy("Name or category");
    selected=value;
    required=limit;
    selection=limit===undefined?null:new Set(value);
    initialSelection=new Set(selection??[]);
    readOnly=!onChoose;
    toolbar.hidden=!selection;
    dialog.classList.toggle('reference-only',readOnly);
    choose=onChoose;
    title.textContent=label;
    query.value='';
    concentration.checked=false;
    selectedOnly.checked=false;
    selectedOnly.closest('label').hidden=!selection;
    selectionNotice();
    const levels=isSpell?[...new Set(rows.map(row=>row.level))].sort((a,b)=>a-b):[];
    level.replaceChildren(option('',copy("Any level")),...levels.map(x=>option(x,levelLabel(x))));
    const categories=[...new Set(rows.map(row=>row.category).filter(Boolean))].sort();
    school.replaceChildren(option('',isSpell?copy("Any school"):copy('Any {category}',{category:categoryLabel.toLowerCase()})),...categories.map(x=>option(x,x)));
    level.closest('label').hidden=!isSpell;
    school.closest('label').hidden=!isSpell&&categories.length<2;
    concentration.closest('label').hidden=!isSpell;
    dialog.querySelector('[data-picker-category-label]').textContent=isSpell?'School':categoryLabel;
    render();
    refreshSelection();
    dialog.showModal();
    if(readOnly&&rows.length) inspect(rows[0],resultButtons.get(rows[0])?.control);
    else close.focus();
  };
}
