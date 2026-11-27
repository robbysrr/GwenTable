import {validatedSavedDraft} from './builder-completion.js';
import {copy} from './locale.js';
import {createPDFDeliveryGuard} from './pdf-delivery-guard.js';
import {normalizePlay,playProfile,validatePlay} from './lib/play.js';

export function mountSheetExport(dialog,printWebSheet) {
  const form=dialog.querySelector('form');
  const {edition,paper,snapshot:mode,notes,generate}=form.elements;
  const feedback=dialog.querySelector('[data-sheet-feedback]');
  const web=dialog.querySelector('[data-sheet-web]');
  let request=0;
  let objectURL;
  let selected;
  let deliveryGate;
  const eligible=()=>Boolean(selected&&selected.eligibility()&&validatedSavedDraft(selected.draft));
  async function authorizedNow(snapshot) {
    if(snapshot!==selected||!eligible()) {
      if(snapshot===selected) feedback.textContent=copy('Review this saved build before exporting.');
      return false;
    }
    if(snapshot.verifyCurrent) {
      let current=false;
      try {current=await snapshot.verifyCurrent();} catch {}
      if(snapshot!==selected)return false;
      if(!current) {
        feedback.textContent=copy('A newer version of this saved character may exist. Reopen it before exporting or printing.');
        return false;
      }
    }
    return snapshot===selected&&eligible();
  }
  function resetOutput() {
    deliveryGate?.cancel();
    deliveryGate=null;
    if(objectURL) URL.revokeObjectURL(objectURL);
    objectURL=null;
    feedback.textContent='';
  }
  function busy(value) {
    for(const control of [edition,paper,mode,notes,generate,web]) control.disabled=value;
  }
  dialog.querySelector('[data-sheet-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{
    if(dialog.open) return;
    request++;
    resetOutput();
  });
  form.addEventListener('change',resetOutput);
  web.onclick=async()=>{
    const id=++request;
    const snapshot=selected;
    if(!snapshot)return;
    busy(true);
    try {
      if(!await authorizedNow(snapshot)||id!==request||!dialog.open)return;
      dialog.close();
      if(snapshot.multiclassActive)throw new Error('The single-class browser print view cannot print an active multiclass. Use the fillable PDF.');
      printWebSheet(snapshot.draft,snapshot.equipment);
    } finally {if(id===request)busy(false);}
  };
  form.onsubmit=async event=>{
    event.preventDefault();
    if(!eligible()) {feedback.textContent=copy('Review this saved build before exporting.');return;}
    const id=++request;
    const snapshot=selected;
    const {draft,play}=snapshot;
    const format=edition.value;
    const clean=mode.value==='clean'||!play;
    const options={edition:format,paper:paper.value,clean,notes:notes.checked,equipment:snapshot.equipment};
    resetOutput();
    busy(true);
    feedback.textContent=copy('Generating PDF…');
    try {
      if(!await authorizedNow(snapshot)||id!==request||!dialog.open)return;
      const profile=playProfile(draft,snapshot.multiclassActive);
      const state=normalizePlay(profile,clean?undefined:play);
      if(!clean&&play)validatePlay(profile,play);
      const {makeNativeSheetPDF}=await import('./lib/native-sheet-pdf.js');
      const result=await makeNativeSheetPDF(profile,state,options);
      if(id!==request||!dialog.open||snapshot!==selected)return;
      // A second read catches a revision change while the PDF was generated.
      if(!await authorizedNow(snapshot)||id!==request||!dialog.open)return;
      objectURL=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'}));
      const name=draft.name.trim().replace(/[^a-z0-9-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,60)||'Character';
      const preparedURL=objectURL;
      const filename='GwenTable_'+name+'_Level'+String(profile.totalLevel??draft.level).padStart(2,'0')+'_'+format+'_GwenTable'+'.pdf';
      // Do not put the blob URL in a persistent <a href>. A PDF can become
      // stale after generation, while the user leaves the dialog open.
      const gate=createPDFDeliveryGuard({
        authorize:async()=>id===request&&dialog.open&&snapshot===selected&&
          objectURL===preparedURL&&await authorizedNow(snapshot),
        onDenied:()=>{
          if(gate!==deliveryGate||id!==request)return;
          const warning=feedback.textContent||copy('A newer version of this saved character may exist. Reopen it before exporting or printing.');
          resetOutput();
          feedback.textContent=warning;
        }
      });
      deliveryGate=gate;
      const deliveryError=()=>{
        if(gate===deliveryGate)feedback.textContent=copy('The PDF could not be delivered. Try generating it again.');
      };
      const download=document.createElement('button');
      download.type='button';
      download.className='button primary';
      download.textContent=copy('Download character PDF');
      download.onclick=()=>{
        void gate.deliver(()=>{
          const freshLink=document.createElement('a');
          freshLink.href=preparedURL;
          freshLink.download=filename;
          freshLink.click();
        }).catch(deliveryError);
      };
      const tip=document.createElement('p');
      tip.textContent=result.pages+' '+(result.pages===1?'page':'pages')+' ready to print.'+
        (result.substituted?' Characters unsupported by the PDF font are shown by their Unicode code points.':'');
      const open=document.createElement('button');
      open.type='button';
      open.className='button';
      open.textContent=copy('Open PDF in new tab');
      open.onclick=()=>{
        // Reserve a blank tab synchronously during the click. Opening a tab
        // only after the async IndexedDB check may trigger popup blockers.
        const tab=window.open('about:blank','_blank');
        if(!tab){
          feedback.textContent=copy('Your browser blocked the new PDF tab. Use Download character PDF instead.');
          return;
        }
        tab.opener=null;
        void gate.deliver(()=>{
          if(tab.closed)throw new Error('PDF tab was closed.');
          tab.location.replace(preparedURL);
        }).then(delivered=>{if(!delivered)tab.close();}).catch(()=>{
          tab.close();
          deliveryError();
        });
      };
      const controls=document.createElement('div');
      controls.className='toolbar';
      controls.append(download,open);
      feedback.replaceChildren(controls,tip);
      download.focus();
    } catch {
      if(id===request) feedback.textContent=copy('The PDF could not be generated. Try again.');
    } finally {
      if(id===request) busy(false);
    }
  };
  return (draft,play,{showWebPrint=true,eligibility=()=>Boolean(validatedSavedDraft(draft)),verifyCurrent,equipment,multiclassActive=null}={})=>{
    selected={draft,play,eligibility,verifyCurrent,equipment,multiclassActive};
    if(!eligible()) return;
    web.hidden=!showWebPrint||Boolean(multiclassActive);
    web.textContent=copy(play?'Print build in browser':'Print web sheet');
    mode.closest('label').hidden=!play;
    mode.value=play?'current':'clean';
    notes.checked=false;
    busy(false);
    resetOutput();
    dialog.showModal();
  };
}
