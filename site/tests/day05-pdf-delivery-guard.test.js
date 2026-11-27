import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPDFDeliveryGuard} from '../dist/pdf-delivery-guard.js';

function deferred(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}

test('prepared PDF cannot be delivered after another tab changes the saved revision',async()=>{
  let revision='A',denied=0,deliveries=0;
  const gate=createPDFDeliveryGuard({authorize:async()=>revision==='A',onDenied:()=>denied++});
  assert.equal(await gate.deliver(()=>deliveries++),true);
  revision='B';
  assert.equal(await gate.deliver(()=>deliveries++),false);
  assert.equal(await gate.deliver(()=>deliveries++),false);
  assert.equal(deliveries,1);
  assert.equal(denied,1);
});

test('both Download and Open paths can use the same gate when the character stays current',async()=>{
  const actions=[];
  const gate=createPDFDeliveryGuard({authorize:async()=>true});
  assert.equal(await gate.deliver(()=>actions.push('download')),true);
  assert.equal(await gate.deliver(()=>actions.push('open')),true);
  assert.deepEqual(actions,['download','open']);
});

test('concurrent clicks do not deliver a PDF twice before revision validation finishes',async()=>{
  const pending=deferred();let count=0;
  const gate=createPDFDeliveryGuard({authorize:()=>pending.promise});
  const first=gate.deliver(()=>count++);
  assert.equal(await gate.deliver(()=>count++),false);
  pending.resolve(true);
  assert.equal(await first,true);
  assert.equal(count,1);
});

test('closing the PDF dialog during an async revision read invalidates pending delivery',async()=>{
  const pending=deferred();let count=0,denied=0;
  const gate=createPDFDeliveryGuard({authorize:()=>pending.promise,onDenied:()=>denied++});
  const first=gate.deliver(()=>count++);
  gate.cancel();
  pending.resolve(true);
  assert.equal(await first,false);
  assert.equal(await gate.deliver(()=>count++),false);
  assert.equal(count,0);
  assert.equal(denied,0);
});

test('blocked IndexedDB read and absent record both fail closed and invalidate the PDF',async()=>{
  for(const authorize of [async()=>{throw new Error('database blocked');},async()=>false]){
    let denied=0,count=0;
    const gate=createPDFDeliveryGuard({authorize,onDenied:()=>denied++});
    assert.equal(await gate.deliver(()=>count++),false);
    assert.equal(await gate.deliver(()=>count++),false);
    assert.equal(denied,1);
    assert.equal(count,0);
  }
});

test('delivery action failure propagates without unlocking a denied file',async()=>{
  let success=0;
  const gate=createPDFDeliveryGuard({authorize:()=>true});
  await assert.rejects(gate.deliver(()=>{throw new Error('browser download failed');}),/browser download failed/);
  assert.equal(await gate.deliver(()=>success++),true);
  assert.equal(success,1);
});

test('PDF gate requires explicit verifier and a real delivery action',async()=>{
  assert.throws(()=>createPDFDeliveryGuard(),/authorization check/);
  const gate=createPDFDeliveryGuard({authorize:async()=>true});
  await assert.rejects(gate.deliver(null),/delivery needs an action/);
});

test('sheet UI rechecks PDF on final click and does not expose an enduring blob URL in its HTML',()=>{
  const source=readFileSync(new URL('../dist/sheet-export.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(source,/import \{createPDFDeliveryGuard\} from '\.\/pdf-delivery-guard\.js'/);
  assert.match(source,/deliveryGate\?\.cancel\(\)/);
  assert.match(source,/authorize:async\(\)=>id===request/);
  assert.match(source,/objectURL===preparedURL&&await authorizedNow\(snapshot\)/);
  assert.match(source,/const download=document\.createElement\('button'\)/);
  assert.match(source,/const open=document\.createElement\('button'\)/);
  assert.match(source,/gate\.deliver\(/);
  assert.match(source,/window\.open\('about:blank','_blank'\)/);
  assert.match(source,/freshLink\.href=preparedURL/);
  assert.doesNotMatch(source,/download\.href=objectURL|open\.href=objectURL/);
  assert.match(sw,/\.\/pdf-delivery-guard\.js/);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
});
