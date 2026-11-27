import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {previewLiveCheck} from '../dist/lib/srd-live-check-preview.mjs';
import {liveCheckHTML,resolveLiveCheckForm} from '../dist/live-check-preview.js';
import {setLanguage} from '../dist/locale.js';
const profile=playProfile(templateCharacter('Fighter'));
const state=normalizePlay(profile);
const opts={kind:'skill',name:'Athletics',rolls:[12],advantage:false,disadvantage:false,dc:15,otherBonus:0,confirmed:true};
const calc=(more={},p=state,pr=profile)=>previewLiveCheck(pr,p,{...opts,...more});
test('live check uses actual sheet skill modifier, without changing profile or play state',()=>{
 const before=structuredClone({profile,state});const r=calc();assert.equal(r.total,12+profile.s.skills.find(x=>x.name==='Athletics').total);assert.deepEqual({profile,state},before);
});
test('live check uses actual source saving throw modifier, including another class',()=>{
 const wizard=playProfile(templateCharacter('Wizard'));const r=calc({kind:'save',name:'Intelligence'},normalizePlay(wizard),wizard);assert.equal(r.total,12+wizard.s.saves[3]);
});
test('recorded exhaustion and additional confirmed modifier applied exactly once',()=>{
 const r=calc({otherBonus:2},{...state,exhaustion:2});assert.equal(r.total,12+r.characterBonus+2-4);assert.equal(r.exhaustionPenalty,4);
});
test('recorded Poisoned gives disadvantage, advantage cancels; dice count is enforced',()=>{
 const p={...state,conditions:['Poisoned']};assert.equal(calc({rolls:[12,4]},p).natural,4);assert.equal(calc({advantage:true},p).mode,'normal');assert.throws(()=>calc({},p));
});
test('recorded Restrained affects Dexterity save but not Constitution save',()=>{
 const p={...state,conditions:['Restrained']};assert.equal(calc({kind:'save',name:'Dexterity',rolls:[16,3]},p).natural,3);assert.equal(calc({kind:'save',name:'Constitution'},p).mode,'normal');
});
test('recorded automatic Strength/Dexterity failure; other saves may be previewed',()=>{
 for(const condition of ['Paralyzed','Petrified','Stunned','Unconscious']) {const p={...state,conditions:[condition]};assert.equal(calc({kind:'save',name:'Strength'},p).status,'automatic-failure');assert.equal(calc({kind:'save',name:'Dexterity'},p).total,null);assert.notEqual(calc({kind:'save',name:'Wisdom'},p).status,'automatic-failure');}
});
test('physical dice natural 20 and 1 are not automatic skill success/failure',()=>{
 assert.equal(calc({rolls:[20],dc:99}).status,'failure');assert.equal(calc({rolls:[1],dc:1,otherBonus:20}).status,'success');assert.equal(calc({dc:null}).status,'unresolved');
});
test('fails closed on unsupported state and unconfirmed or invalid inputs',()=>{
 for(const options of [{confirmed:false},{name:'__proto__'},{kind:'attack'},{rolls:[0]},{rolls:[21]},{otherBonus:1.5},{dc:0},{advantage:'true'}])assert.throws(()=>calc(options));
 assert.throws(()=>calc({}, {...state,dead:true}));assert.throws(()=>calc({}, {...state,shape:{active:true}}));assert.throws(()=>calc({}, {...state,exhaustion:6}));
});
test('panel includes both checks, explicit table confirmation, and accessible output in both languages',()=>{
 try{setLanguage('en');const en=liveCheckHTML();assert.match(en,/data-live-check="skill"/);assert.match(en,/data-live-check="save"/);assert.match(en,/aria-live="polite"/);assert.match(en,/Read-only/);setLanguage('id');const id=liveCheckHTML();assert.match(id,/Hanya pratinjau/);assert.match(id,/Pratinjau hasil/);}finally{setLanguage('en');}
});
test('actual Play Sheet renders the panel and intercepts submissions without writing state; offline files registered',()=>{
 const src=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');assert.match(src,/statsIntro\+attackPanelHTML\(profile,p\)\+liveCheckHTML\(p\)/);const handler=src.slice(src.indexOf("if(event.target.matches('[data-live-check]'))"),src.indexOf('if (event.target.dataset.inventoryForm)',src.indexOf("if(event.target.matches('[data-live-check]'))")));assert.match(handler,/resolveLiveCheckForm\(event.target,profile,play\)/);assert.match(handler,/textContent/);assert.doesNotMatch(handler,/change\(|characters\./);const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');for(const x of ['live-check-preview.js','lib/srd-live-check-preview.mjs','lib/srd-d20-preview.mjs'])assert.ok(sw.includes(x));assert.ok(sw.includes('convergence08-integration13'));
});
