import test from 'node:test';
import assert from 'node:assert/strict';
import {mountChoicePicker} from '../dist/spell-picker.js';
// A minimal event-capable DOM contract for actual mountChoicePicker handlers.
// Native modal focus trapping, geometry and mobile IME still require a browser.
class Node {
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.isConnected=true;this.textContent='';this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  setAttribute(k,v){this.attrs[k]=v;}
  insertAdjacentHTML(){}
  closest(){return this.parent??new Node();}
  focus(){document.activeElement=this;}
  contains(node){return node===this||this.children.some(x=>x.contains?.(node));}
  querySelector(selector){return this.map?.[selector]??this.children.find(x=>selector==='strong'?x.tag==='strong':selector.startsWith('button')?x.tag==='button':false);}
  querySelectorAll(selector){return this.children.flatMap(x=>[...(selector==='.choice-row-main'&&x.className==='choice-row-main'?[x]:[]),...x.querySelectorAll(selector)]);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,event={}){for(const fn of this.listeners[type]??[]) fn(event);}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
  getBoundingClientRect(){return {left:10,right:200,top:10,bottom:200};}
}
function fixture(){
  const beforeDocument=globalThis.document,beforeOption=globalThis.Option;
  const body=new Node('body'),opener=new Node('button');
  globalThis.document={body,activeElement:opener,createElement:tag=>new Node(tag)};
  globalThis.Option=class extends Node{constructor(label,value){super('option');this.textContent=label;this.value=value;}};
  const dialog=new Node('dialog');dialog.map={};
  for(const key of ['h2','[type=search]','[data-spell-level]','[data-spell-school]','[data-concentration]','[data-selected-only]','[role=status]','[data-spell-results]','[data-spell-details]','[data-selection-toolbar]','[data-picker-back]','[data-picker-close]','.picker-filters','[data-picker-query-label]','[data-picker-category-label]'])dialog.map[key]=new Node();
  const toolbar=dialog.map['[data-selection-toolbar]'];toolbar.map={'[data-selection-count]':new Node(),'button':new Node('button'),'[data-selection-message]':new Node()};
  dialog.children.push(...Object.values(dialog.map));
  const open=mountChoicePicker(dialog);const results=dialog.map['[data-spell-results]'];
  return {dialog,open,results,toolbar,opener,close:dialog.map['[data-picker-close]'],cleanup(){globalThis.document=beforeDocument;globalThis.Option=beforeOption;}};
}
const rows=[{value:'A',name:'Alpha',summary:'One',level:0},{value:'B',name:'Beta',summary:'Two',level:0}];

test('short choices default to non-search, show selected state and commit once despite repeat invocation',()=>{
  const f=fixture();try{
    const chosen=[];f.open({label:'Class',options:rows,value:'A',onChoose:v=>chosen.push(v)});
    assert.equal(f.dialog.map['.picker-filters'].hidden,true);assert.equal(document.activeElement,f.close);
    const control=f.results.children[0].children[0];assert.equal(control.attrs['aria-pressed'],'true');
    control.onclick();control.onclick();assert.deepEqual(chosen,['A']);assert.equal(document.activeElement,f.opener);
    f.open({label:'Class',options:rows,value:'B',onChoose:v=>chosen.push(v)});
    control.onclick();assert.deepEqual(chosen,['A']);assert.equal(f.dialog.open,true);
  }finally{f.cleanup();}
});

test('dirty spell picks survive X, Escape and outside click until explicit discard',()=>{
  const f=fixture();try{
    const chosen=[];f.open({label:'Spells',options:rows,value:['A'],onChoose:v=>chosen.push(v),spells:true,limit:1});
    f.results.children[0].children[1].onclick(); // remove A without applying
    f.close.onclick();assert.equal(f.dialog.open,true);
    const discard=f.toolbar.children[0];assert.equal(discard.hidden,false);
    let prevented=false;f.dialog.fire('cancel',{preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(f.dialog.open,true);
    const outside={target:f.dialog,clientX:0,clientY:0};f.dialog.fire('pointerdown',outside);f.dialog.fire('click',outside);assert.equal(f.dialog.open,true);
    discard.onclick();assert.equal(f.dialog.open,false);assert.deepEqual(chosen,[]);
  }finally{f.cleanup();}
});

test('returning to original selection closes cleanly and Apply cannot double commit',()=>{
  const f=fixture();try{
    const chosen=[];const args={label:'Spells',options:rows,value:['A'],onChoose:v=>chosen.push(v),spells:true,limit:1};f.open(args);
    const quick=f.results.children[0].children[1];quick.onclick();quick.onclick();f.close.onclick();assert.equal(f.dialog.open,false);assert.deepEqual(chosen,[]);
    f.open(args);const apply=f.toolbar.map.button;apply.onclick();apply.onclick();assert.deepEqual(chosen,[['A']]);
  }finally{f.cleanup();}
});

test('empty read-only view does not inspect an absent row; disabled reason stays visible',()=>{
  const f=fixture();try{
    f.open({label:'Empty',options:[],value:null});assert.equal(f.dialog.open,true);f.close.onclick();
    f.open({label:'Class',options:[{...rows[0],disabled:true,disabledReason:'Not available'}],value:'B',onChoose:()=>assert.fail('disabled commit')});
    const control=f.results.children[0].children[0];assert.equal(control.disabled,true);assert.equal(control.children.at(-1).textContent,'Not available');control.onclick();assert.equal(f.dialog.open,true);
  }finally{f.cleanup();}
});
