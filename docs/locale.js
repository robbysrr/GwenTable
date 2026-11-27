import {messages} from './locale-copy.js';

export const languageKey = 'gwentable-language';
export const supportedLanguages = ['en','id'];
let language='en';

export function setLanguage(preference) {
  language=supportedLanguages.includes(preference)?preference:'en';
  return language;
}

export function copy(key, values={}) {
  const text=Object.hasOwn(messages,key)?messages[key][language]??key:key;
  return typeof text==='string'?text.replace(/\{(\w+)\}/g,(token,name)=>Object.hasOwn(values,name)?String(values[name]):token):text;
}

// Official SRD option names are identifiers for players, not translatable interface
// copy. Always render them verbatim, even when they coincide with ordinary UI
// words such as "Light", "Lock", "Paper", or "Fear". This does not alter the
// saved value, the canonical catalogue ID, or custom user-provided names.
export function canonicalOptionName(name) {
  return String(name ?? '');
}

export function htmlCanonicalOptionName(name) {
  return canonicalOptionName(name).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function htmlCopy(key, values) {
  return copy(key,values).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function applyInterfaceLanguage(root, preference) {
  root.documentElement.lang=setLanguage(preference);
  for(const element of root.querySelectorAll('[data-copy]'))
    element.textContent=copy(element.dataset.copy);
  for(const attribute of ['aria-label','title','placeholder']) {
    const marker='data-copy-'+attribute;
    for(const element of root.querySelectorAll('['+marker+']'))
      element.setAttribute(attribute,copy(element.getAttribute(marker)));
  }
}

// A single native button, presented as a two-state switch. Flags are decorative;
// the accessible name states the current language and the next action.
export function languageToggleDescription(value) {
  return value==='id'
    ?'Bahasa: Bahasa Indonesia. Ganti ke English.'
    :'Language: English. Switch to Bahasa Indonesia.';
}

export function initInterfaceLanguage(root, storage) {
  const toggle=root.getElementById('language-toggle');
  let preference;
  try {preference=storage().getItem(languageKey);} catch {}
  const apply=value=>{
    applyInterfaceLanguage(root,value);
    toggle.setAttribute('aria-checked',String(language==='id'));
    toggle.setAttribute('data-active-language',language);
    const description=languageToggleDescription(language);
    toggle.setAttribute('aria-label',description);
    toggle.setAttribute('title',description);
  };
  apply(preference);
  // Native button activation supports pointer, Space, and Enter without
  // creating a custom keyboard handler or surprising mobile text keyboard.
  toggle.addEventListener('click',()=>{
    apply(language==='en'?'id':'en');
    try {storage().setItem(languageKey,language);} catch {}
    root.dispatchEvent(new Event('gwentable-languagechange'));
  });
}

// Refresh an open view without discarding a note or a combat input in progress.
export async function preserveViewInputs(view, refresh) {
  const read = () => [...view.querySelectorAll('form')].map(form=>({
    form,
    key:[form.id,form.dataset.encForm,form.dataset.playForm,form.dataset.inventoryForm,form.dataset.npcId,form.dataset.id].join(':'),
    fields:[...form.elements].filter(field=>field.matches('input:not([type=hidden],[type=file]), textarea, select'))
  }));
  const before=read().map(({form,key,fields})=>({
    form,key,
    open:form.closest('details')?.open,
    values:fields.map(field=>({name:field.name,type:field.type,value:field.value,checked:field.checked}))
  }));
  await refresh();
  if(view.hidden) return;
  read().forEach(({form,key,fields},index)=>{
    const previous=before[index];
    if(!previous||key!==previous.key||form===previous.form||previous.values.length!==fields.length||
      fields.some((field,i)=>field.name!==previous.values[i].name||field.type!==previous.values[i].type)) return;
    const disclosure=form.closest('details');
    if(disclosure&&previous.open!==undefined) disclosure.open=previous.open;
    fields.forEach((field,i)=>{
      const {value,checked}=previous.values[i];
      if(field.type==='checkbox'||field.type==='radio') field.checked=checked;
      else if(field.type!=='select-one') field.value=value;
      else if([...field.options].some(option=>option.value===value)) {
        field.value=value;
        if(field.nextElementSibling?.classList.contains('picker-trigger'))
          field.nextElementSibling.textContent=field.selectedOptions[0].label;
      }
    });
  });
}
