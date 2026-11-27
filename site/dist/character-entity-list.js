import {canonicalOptionName, copy, htmlCopy} from './locale.js';
import {icon} from './ui-icons.js';

export const entityText=value=>String(value??'').replace(/[&<>"']/g,letter=>({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[letter]);

const normalize=text=>String(text??'').normalize('NFKD').replace(/\p{M}|['’]/gu,'')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const pageSize=20;

export function filterEntities(rows,{query='',facets={},sort='default'}={}) {
  const words=normalize(query).split(' ').filter(Boolean);
  const matches=rows.filter(row=>{
    return (!words.length||words.every(word=>searchText(row).includes(word)))&&
      Object.entries(facets).every(([key,selected])=>!selected.length||[].concat(row.facets?.[key]??[])
        .some(value=>selected.includes(value)));
  });
  return sort==='name'?matches.sort((a,b)=>a.label.localeCompare(b.label)):matches;
}

const searchIndex=new WeakMap();
function searchText(row) {
  if(!searchIndex.has(row)) searchIndex.set(row,normalize([row.label,row.summary,row.description,row.search,row.source,
    ...Object.values(row.facets??{}).flat()].join(' ')));
  return searchIndex.get(row);
}
const initialView=()=>({query:'',facets:{},sort:'default',limit:pageSize,expanded:new Set(),filterOpen:false});
// Category chrome uses interface copy. Rule values are also used as stable
// filter selections, and can share words with interface labels.
const canonicalFacets=new Set(['ability','school','trait','damage','category','mastery']);
const labelFor=(facet,value)=>canonicalFacets.has(facet)?canonicalOptionName(value):copy(value);
function rowMarkup(row,index) {
  return `<li data-entity-row="${index}" hidden><details data-entry="${entityText(row.id)}">
    <summary>${icon(row.icon??'item')}<span class="entity-label"><strong>${entityText(row.label)}</strong>
    ${row.summary?`<small>${entityText(row.summary)}</small>`:''}</span>
    ${row.status?`<small class="entity-status">${entityText(row.status)}</small>`:''}</summary>
    <div class="entity-details">
      ${row.description?`<p>${entityText(row.description)}</p>`:''}
      <p class="entity-source">${entityText(row.source??'SRD 5.2.1')}${row.page?' · '+htmlCopy('Page {page}',{page:row.page}):''}</p>
      ${row.spell||row.page?`<button type="button" data-entity-control="rule" data-entry-id="${entityText(row.id)}">${htmlCopy('Read full rule')}</button>`:''}
      ${row.actions??''}
    </div></details></li>`;
}

export function mountCharacterEntityLists(root,showRule) {
  let identity;
  const views=new Map();
  const lists=new Map();
  function viewFor(key) {
    if(!views.has(key)) views.set(key,initialView());
    return views.get(key);
  }
  function apply(list) {
    const {key,title,node,rows}=list;
    const view=viewFor(key);
    const found=filterEntities(rows,view);
    const nodes=new Map([...node.querySelectorAll('[data-entity-row]')].map(item=>[rows[Number(item.dataset.entityRow)],item]));
    const visible=new Set(found.slice(0,view.limit));
    for(const [row,item] of nodes) item.hidden=!visible.has(row);
    const ordered=found.slice(0,view.limit).map(row=>nodes.get(row));
    const ul=node.querySelector('ul');
    const current=[...ul.children].filter(child=>!child.hidden);
    if(ordered.some((item,index)=>current[index]!==item))
      for(const item of ordered) ul.append(item);
    node.querySelector('[data-entity-count]').textContent=copy('Showing {visible} of {total}',{visible:visible.size,total:rows.length})+
      (found.length<rows.length?' · '+copy('{count} matches',{count:found.length}):'');
    const active=[...new Set(Object.entries(view.facets).flatMap(([facet,values])=>values.map(value=>labelFor(facet,value))))];
    node.querySelector('[data-entity-active]').textContent=active.length?active.join(' · '):'';
    node.querySelector('[data-entity-empty]').hidden=found.length>0;
    node.querySelector('[data-entity-control="more"]').hidden=found.length<=view.limit;
    node.querySelector('[data-entity-control="clear"]').hidden=!view.query;
    const reset=node.querySelector('[data-entity-control="reset"]');
    if(reset) reset.hidden=!active.length;
    node.querySelector('input[type="search"]').setAttribute('aria-label',copy('Search in {section}',{section:title}));
  }

  function branch(event) {
    return lists.get(event.target.closest('[data-entity-list]')?.dataset.entityList);
  }
  function update(event) {
    const list=branch(event);
    if(!list) return;
    const view=viewFor(list.key);
    const field=event.target;
    if(field.type==='search'&&event.type==='input') view.query=field.value;
    else if(field.dataset.facet&&event.type==='change') {
      view.facets[field.dataset.facet]=[...list.node.querySelectorAll('[data-facet]:checked')]
        .filter(box=>box.dataset.facet===field.dataset.facet).map(box=>box.value);
    } else if(field.dataset.entityControl==='sort'&&event.type==='change') view.sort=field.value;
    else return;
    view.limit=pageSize;
    apply(list);
  }
  root.addEventListener('input',update);
  root.addEventListener('change',update);
  root.addEventListener('toggle',event=>{
    const list=branch(event);
    if(!list||!list.node.contains(event.target)) return;
    const view=viewFor(list.key);
    if(event.target.classList.contains('entity-filters')) view.filterOpen=event.target.open;
    const id=event.target.dataset.entry;
    if(id) {
      if(event.target.open) view.expanded.add(id);
      else view.expanded.delete(id);
    }
  },true);
  function clear(list) {
    viewFor(list.key).query='';
    viewFor(list.key).limit=pageSize;
    const input=list.node.querySelector('input[type="search"]');
    input.value='';
    input.focus({preventScroll:true});
    apply(list);
  }
  root.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||event.target.type!=='search'||!event.target.value) return;
    const list=branch(event);
    if(list) {event.preventDefault();clear(list);}
  });
  root.addEventListener('click',event=>{
    const list=branch(event);
    const button=event.target.closest('button[data-entity-control]');
    if(!list||!button) return;
    const view=viewFor(list.key);
    switch(button.dataset.entityControl) {
      case 'clear':return clear(list);
      case 'reset':
        view.facets={};
        view.limit=pageSize;
        list.node.querySelectorAll('[data-facet]').forEach(field=>{field.checked=false;});
        list.node.querySelector('.entity-filters > summary').focus({preventScroll:true});
        break;
      case 'more': {
        const first=filterEntities(list.rows,view)[view.limit];
        view.limit+=pageSize;
        apply(list);
        const target=[...list.node.querySelectorAll('[data-entry]')].find(node=>node.dataset.entry===first?.id);
        target?.querySelector('summary').focus();
        return;
      }
      case 'rule': {
        const row=list.rows.find(entry=>entry.id===button.dataset.entryId);
        if(row) showRule({name:row.label,description:row.description,page:row.page,end:row.end,spell:row.spell});
        return;
      }
    }
    apply(list);
  });

  return (scope,html)=>{
    const sameCharacter=identity===scope;
    const disclosures=new Map([...root.querySelectorAll('[data-sheet-section]')].map(node=>[node.dataset.sheetSection,node.open]));
    if(sameCharacter) for(const [key,list] of lists) {
      const view=viewFor(key);
      view.expanded=new Set([...list.node.querySelectorAll('[data-entry][open]')].map(row=>row.dataset.entry));
      view.filterOpen=list.node.querySelector('.entity-filters')?.open??false;
    }
    const focus=document.activeElement;
    const focusList=focus?.closest('[data-entity-list]');
    const focusIndex=focusList?[...focusList.querySelectorAll('input,select,button,summary')].indexOf(focus):-1;
    const focusRow=focus?.closest('[data-entry]')?.dataset.entry;
    const focusControl=focus?.dataset.entityControl;
    if(identity!==scope) {views.clear();identity=scope;}
    lists.clear();
    const collection=(key,title,rows,facets={})=>{
      if(!rows.length) return '';
      lists.set(key,{key,title,rows});
      const view=viewFor(key);
      const groups=Object.entries(facets).map(([facet,heading])=>{
        const choices=[...new Set(rows.flatMap(row=>row.facets?.[facet]??[]))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
        view.facets[facet]=choices.length<2?[]:(view.facets[facet]??[]).filter(value=>choices.includes(value));
        if(choices.length<2) return '';
        return `<fieldset><legend>${htmlCopy(heading)}</legend>${choices.map(value=>
          `<label><input type="checkbox" data-facet="${facet}" value="${entityText(value)}" ${view.facets[facet]?.includes(value)?'checked':''}> ${entityText(labelFor(facet,value))}</label>`).join('')}</fieldset>`;
      }).join('');
      return `<section class="entity-list" data-entity-list="${key}" aria-label="${entityText(title)}">
        <h3>${entityText(title)}</h3>
        <div class="entity-search"><label class="entity-search-field">${icon('search')}<input type="search" maxlength="120" value="${entityText(view.query)}" placeholder="${htmlCopy('Search entries')}"></label>
        <button type="button" data-entity-control="clear" hidden>${icon('close')} ${htmlCopy('Clear search')}</button></div>
        ${groups?`<details class="entity-filters" ${view.filterOpen?'open':''}><summary>${icon('filter')} ${htmlCopy('Filters')} <small data-entity-active></small></summary>
        <div class="entity-filter-options"><p>${htmlCopy('All entries are shown when no filters are selected.')}</p>${groups}
        <button type="button" data-entity-control="reset" hidden>${icon('reset')} ${htmlCopy('Reset filters')}</button></div></details>`:'<span data-entity-active hidden></span>'}
        <div class="entity-list-status"><p data-entity-count role="status"></p>
        ${rows.length>=8?`<label>${htmlCopy('Sort')} <select data-entity-control="sort"><option value="default">${htmlCopy('Default order')}</option>
        <option value="name" ${view.sort==='name'?'selected':''}>${htmlCopy('Name A–Z')}</option></select></label>`:''}</div>
        <ul class="entity-rows">${rows.map(rowMarkup).join('')}</ul>
        <p data-entity-empty hidden>${htmlCopy('No matches. Try clearing the search or filters.')}</p>
        <button type="button" data-entity-control="more" hidden>${htmlCopy('Show more')}</button>
      </section>`;
    };
    const markup=html(collection);
    root.innerHTML=markup;
    for(const node of root.querySelectorAll('[data-sheet-section]')) if(sameCharacter&&disclosures.has(node.dataset.sheetSection)) node.open=disclosures.get(node.dataset.sheetSection);
    for(const node of root.querySelectorAll('[data-entity-list]')) {
      const list=lists.get(node.dataset.entityList);
      if(!list) continue;
      list.node=node;
      const view=viewFor(list.key);
      for(const row of node.querySelectorAll('[data-entry]')) row.open=view.expanded.has(row.dataset.entry);
      apply(list);
    }
    if(focusIndex>=0&&sameCharacter) {
      const next=lists.get(focusList.dataset.entityList)?.node;
      const row=focusRow&&[...next?.querySelectorAll('[data-entry]')??[]].find(entry=>entry.dataset.entry===focusRow);
      const target=row?(focusControl?row.querySelector(`[data-entity-control="${focusControl}"]`):row.querySelector('summary')):
        [...next?.querySelectorAll('input,select,button,summary')??[]][focusIndex];
      target?.focus({preventScroll:true});
      if(focus.type==='search'&&target?.type==='search') {
        try {target.setSelectionRange(focus.selectionStart,focus.selectionEnd);} catch {}
      }
    }
  };
}

export function jumpToSheetSection(root,key) {
  if(key==='top') {
    const nav=root.querySelector('.sheet-section-nav');
    nav?.querySelector('button')?.focus({preventScroll:true});
    nav?.scrollIntoView({block:'start'});
    return;
  }
  const target=[...root.querySelectorAll('[data-sheet-section], [data-panel]')].find(node=>(node.dataset.sheetSection??node.dataset.panel)===key);
  if(!target) return;
  target.open=true;
  const heading=target.querySelector('summary');
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'start'});
}

export function sheetSectionNav(sections) {
  return `<nav class="sheet-section-nav" aria-label="${htmlCopy('Jump to section')}">${sections.map(([key,title])=>
    `<button type="button" data-sheet-jump="${key}">${htmlCopy(title)}</button>`).join('')}</nav>`;
}

export const sheetReturnLink=()=>`<button type="button" class="quiet-action sheet-return" data-sheet-jump="top">${icon('up')} ${htmlCopy('Back to section links')}</button>`;
