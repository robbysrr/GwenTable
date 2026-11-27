import assert from 'node:assert/strict';
import {test} from 'node:test';
import {copy,htmlCopy,initInterfaceLanguage,languageKey,setLanguage} from '../dist/locale.js';

test('interface messages use the chosen language with safe HTML interpolation',()=>{
  try {
    setLanguage('id');
    assert.equal(copy('Step {number} of {total}',{number:6,total:14}),'Langkah 6 dari 14');
    assert.equal(copy('Magic Missile'),'Magic Missile');
    assert.equal(htmlCopy('Notes for {name}',{name:'<Faye>'}),'Catatan untuk &lt;Faye&gt;');
    setLanguage('unknown');
    assert.equal(copy('Build character free'),'Build a character');
  } finally {setLanguage('en');}
});


function harness(preferred='id',throws=false) {
  const attrs=new Map();
  const toggle=Object.assign(new EventTarget(),{
    setAttribute:(name,value)=>attrs.set(name,value),
    getAttribute:name=>attrs.get(name)
  });
  const root=new EventTarget();
  root.documentElement={lang:'en'};
  root.getElementById=id=>id==='language-toggle'?toggle:null;
  const heading={dataset:{copy:'Welcome to my table.'}};
  root.querySelectorAll=selector=>selector==='[data-copy]'?[heading]:[];
  const stored=new Map([[languageKey,preferred]]);
  const storage=()=>({
    getItem:key=>{if(throws)throw Error('storage unavailable');return stored.get(key);},
    setItem:(key,value)=>{if(throws)throw Error('storage unavailable');stored.set(key,value);}
  });
  let changes=0;
  root.addEventListener('gwentable-languagechange',()=>changes++);
  return {root,toggle,attrs,heading,stored,storage,changes:()=>changes};
}

test('flag toggle restores id-ID and switches twice with one event each',()=>{
  const h=harness();
  initInterfaceLanguage(h.root,h.storage);
  assert.equal(h.root.documentElement.lang,'id');
  assert.equal(h.heading.textContent,'Selamat datang di mejaku.');
  assert.equal(h.toggle.getAttribute('aria-checked'),'true');
  assert.equal(h.toggle.getAttribute('data-active-language'),'id');
  assert.match(h.toggle.getAttribute('aria-label'),/Bahasa Indonesia/);
  h.toggle.dispatchEvent(new Event('click'));
  assert.equal(h.toggle.getAttribute('aria-checked'),'false');
  assert.equal(h.root.documentElement.lang,'en');
  assert.equal(h.heading.textContent,'Welcome to my table.');
  assert.equal(h.stored.get(languageKey),'en');
  h.toggle.dispatchEvent(new Event('click'));
  assert.equal(h.toggle.getAttribute('aria-checked'),'true');
  assert.equal(h.stored.get(languageKey),'id');
  assert.equal(h.changes(),2);
  setLanguage('en');
});

test('flag toggle falls back safely from an unsupported stored language',()=>{
  const h=harness('fr');
  initInterfaceLanguage(h.root,h.storage);
  assert.equal(h.root.documentElement.lang,'en');
  assert.equal(h.toggle.getAttribute('aria-checked'),'false');
  assert.match(h.toggle.getAttribute('aria-label'),/Switch to Bahasa Indonesia/);
  setLanguage('en');
});

test('flag toggle stays usable when localStorage access is blocked',()=>{
  const h=harness('id',true);
  initInterfaceLanguage(h.root,h.storage);
  assert.equal(h.root.documentElement.lang,'en');
  h.toggle.dispatchEvent(new Event('click'));
  assert.equal(h.root.documentElement.lang,'id');
  assert.equal(h.changes(),1);
  assert.equal(h.toggle.getAttribute('aria-checked'),'true');
  setLanguage('en');
});

test('the single flag switch has native keyboard activation, accessible names, and 44px touch target',async()=>{
  const {readFile}=await import('node:fs/promises');
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const css=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
  assert.match(html,/<button id="language-toggle"[^>]*type="button"[^>]*role="switch"[^>]*aria-checked="false"/);
  assert.match(html,/class="lang-flag flag-en" aria-hidden="true"/);
  assert.match(html,/class="lang-flag flag-id" aria-hidden="true"/);
  assert.doesNotMatch(html,/class="language-buttons"/);
  assert.match(css,/\.language-toggle\{[^}]*height:44px/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/language-toggle:focus-visible/);
});
