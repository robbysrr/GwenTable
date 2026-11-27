import {copy} from './locale.js';
import {source} from './lib/rules.js';

export function mountOfficialReference(dialog) {
  const label=dialog.querySelector('h2');
  const content=dialog.querySelector('pre');
  const counter=dialog.querySelector('[data-rules-page]');
  const prev=dialog.querySelector('[data-rules-prev]');
  const next=dialog.querySelector('[data-rules-next]');
  const link=dialog.querySelector('a');
  const modeButton=dialog.querySelector('[data-rules-mode]');
  let page;
  let lastPage;
  let startPage;
  let spell;
  let request=0;
  let official;
  let reader;
  let entries;
  let entryKey;
  let summary;
  let entryMode=false;

  async function showEntry(id) {
    // The subject's own SRD text (or its SRD table row), not the whole printed page.
    prev.hidden=next.hidden=true;
    content.removeAttribute('lang');
    content.textContent=copy("Loading official rules…");
    let text=summary,printed=page;
    if(!text&&entryKey) {
      try {entries??=await import('./lib/srd-entry-text.js');} catch {entries=null;}
      if(id!==request) return;
      const found=entries?.entryText?.[entryKey];
      if(found) [printed,text]=found;
    }
    if(!text) {entryMode=false;return show();}
    counter.textContent=copy('SRD description · page {page}',{page:printed});
    link.href=source.url+'#page='+printed;
    content.lang='en';
    content.textContent=text;
    modeButton.hidden=false;
    modeButton.textContent=copy('Show full SRD page');
  }
  async function show() {
    const id=++request;
    if(entryMode) return showEntry(id);
    modeButton.hidden=!(entryKey||summary);
    modeButton.textContent=copy('Back to description');
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
  modeButton.onclick=()=>{entryMode=!entryMode;if(!entryMode)spell=null;content.scrollTop=0;show();};
  prev.onclick=()=>{page--;show();};
  next.onclick=()=>{page++;show();};
  dialog.querySelector('[data-rules-close]').onclick=()=>dialog.close();
  return ({name,first,end,spellName,entryKey:key,summary:tableSummary})=>{
    label.textContent=name;
    page=startPage=Number(first);
    lastPage=end?Number(end):null;
    spell=spellName;
    entryKey=key;
    summary=tableSummary;
    entryMode=Boolean(key||tableSummary);
    if(entryMode&&!lastPage)lastPage=Math.min(page+1,364);
    content.scrollTop=0;
    dialog.showModal();
    show();
  };
}
