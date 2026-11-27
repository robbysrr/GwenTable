import {copy} from './locale.js';
import {source} from './lib/rules.js';

export function mountOfficialReference(dialog) {
  const label=dialog.querySelector('h2');
  const content=dialog.querySelector('pre');
  const counter=dialog.querySelector('[data-rules-page]');
  const prev=dialog.querySelector('[data-rules-prev]');
  const next=dialog.querySelector('[data-rules-next]');
  const link=dialog.querySelector('a');
  let page;
  let lastPage;
  let startPage;
  let spell;
  let request=0;
  let official;
  let reader;

  async function show() {
    const id=++request;
    counter.textContent=spell?copy("Spell description"):copy('SRD page {page}',{page});
    prev.hidden=!lastPage;
    next.hidden=!lastPage;
    prev.disabled=page<=startPage;
    next.disabled=page>=lastPage;
    link.href=source.url+'#page='+page;
    content.removeAttribute('lang');
    content.textContent=copy("Loading official rules…");
    try {
      official??=await import('./lib/official-rules.js');
      if(id!==request) return;
      let rules=spell?official.spellText[spell]:official.rulePages[page];
      if(!rules&&!spell) {
        reader??=await import('./lib/srd-reader-pages.js');
        if(id!==request) return;
        rules=reader.srdPages[page];
      }
      if(rules) content.lang='en';
      content.textContent=rules??copy("Open the official PDF to continue reading.");
    } catch {
      if(id===request) content.textContent=copy("The rules text could not load. Open the official PDF below.");
    }
  }
  prev.onclick=()=>{page--;show();};
  next.onclick=()=>{page++;show();};
  dialog.querySelector('[data-rules-close]').onclick=()=>dialog.close();
  return ({name,first,end,spellName})=>{
    label.textContent=name;
    page=startPage=Number(first);
    lastPage=end?Number(end):null;
    spell=spellName;
    content.scrollTop=0;
    dialog.showModal();
    show();
  };
}
