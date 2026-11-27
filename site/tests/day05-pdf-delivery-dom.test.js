import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSheetExport} from '../dist/sheet-export.js';
import {templateCharacter} from '../dist/lib/character.js';

function harness(){
  const calls={clicks:[],tabs:[],created:[],revoked:[]};
  const makeControl=(value='')=>({value,disabled:false,hidden:false,checked:false,
    closest:()=>({hidden:false}),focus(){}});
  const fields={edition:makeControl('2024'),paper:makeControl('a4'),snapshot:makeControl('clean'),notes:makeControl(),generate:makeControl()};
  const form={elements:fields,handlers:{},addEventListener(type,cb){this.handlers[type]=cb;}};
  const feedback={textContent:'',children:[],replaceChildren(...items){this.children=items;this.textContent='';}};
  const web=makeControl(),close=makeControl();
  const listeners={};
  const dialog={open:false,querySelector(s){return s==='form'?form:s==='[data-sheet-web]'?web:s==='[data-sheet-close]'?close:feedback;},
    addEventListener(type,cb){listeners[type]=cb;},
    showModal(){this.open=true;},close(){this.open=false;listeners.close?.();}};
  const oldDoc=globalThis.document,oldWin=globalThis.window;
  const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
  globalThis.document={createElement(tag){
    const element={tag,children:[],textContent:'',className:'',append(...kids){this.children.push(...kids);},focus(){},click(){calls.clicks.push({tag:this.tag,href:this.href,download:this.download});}};
    return element;
  }};
  globalThis.window={open(url,target){
    const tab={opened:url,target,closed:false,opener:{},locations:[],location:{replace(to){tab.locations.push(to);}},close(){this.closed=true;}};
    calls.tabs.push(tab);
    return tab;
  }};
  URL.createObjectURL=blob=>{const url='blob:prepared-'+(calls.created.length+1);calls.created.push({url,size:blob.size});return url;};
  URL.revokeObjectURL=url=>calls.revoked.push(url);
  const cleanup=()=>{
    globalThis.document=oldDoc;
    globalThis.window=oldWin;
    URL.createObjectURL=oldCreate;
    URL.revokeObjectURL=oldRevoke;
  };
  return {dialog,form,feedback,calls,cleanup,open:mountSheetExport(dialog,()=>{})};
}

test('PDF component revokes a prepared download after a later revision change',async()=>{
  const h=harness();
  try{
    let current=true;
    h.open(templateCharacter('Fighter'),undefined,{eligibility:()=>true,verifyCurrent:async()=>current});
    await h.form.onsubmit({preventDefault(){}});
    assert.equal(h.calls.created.length,1,'a real PDF blob was created');
    assert.ok(h.calls.created[0].size>1000);
    const [download,open]=h.feedback.children[0].children;
    assert.equal(download.tag,'button');
    assert.equal(open.tag,'button');
    assert.equal(download.href,undefined,'no directly exposed blob URL on a persistent link');
    current=false;
    download.onclick();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.calls.clicks.length,0,'the stale PDF was not handed to a link');
    assert.deepEqual(h.calls.revoked,['blob:prepared-1']);
    assert.match(h.feedback.textContent,/newer version/);
  }finally{h.cleanup();}
});

test('PDF open action reserves only a blank tab, then delivers after fresh authorization',async()=>{
  const h=harness();
  try{
    h.open(templateCharacter('Fighter'),undefined,{eligibility:()=>true,verifyCurrent:async()=>true});
    await h.form.onsubmit({preventDefault(){}});
    const open=h.feedback.children[0].children[1];
    open.onclick();
    assert.equal(h.calls.tabs.length,1);
    assert.equal(h.calls.tabs[0].opened,'about:blank');
    assert.deepEqual(h.calls.tabs[0].locations,[]);
    await new Promise(resolve=>setImmediate(resolve));
    assert.deepEqual(h.calls.tabs[0].locations,['blob:prepared-1']);
    assert.equal(h.calls.tabs[0].opener,null);
    h.dialog.close();
    assert.deepEqual(h.calls.revoked,['blob:prepared-1']);
  }finally{h.cleanup();}
});
