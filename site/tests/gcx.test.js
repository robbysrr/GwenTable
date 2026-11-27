import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build,templateCharacter} from '../dist/lib/character.js';
import {newCustom} from '../dist/lib/custom.js';
import {gcxLocalId,asSeparateGCX,exportGwenGCX,gcxToGwen} from '../dist/lib/gwentable-gcx.js';
import {makeGCX,readGCX} from '../dist/lib/gcx.mjs';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {makeRosterExport,readRosterExport} from '../dist/lib/portable.js';

test('GwenTable GCX restores native custom choices and opt-in current resources',async()=>{
  const custom={...newCustom('Feat'),name:'Test Feat',description:'Private fixture'};
  const draft=build({...templateCharacter('Wizard'),name:'Test Wizard',custom:[custom]}).draft;
  const play=normalizePlay(playProfile(draft),{hp:5,slots:{1:2}});
  const file=await readGCX(await exportGwenGCX({id:'test-id',draft,play},'live-snapshot'));
  const imported=gcxToGwen(file,true);
  assert.deepEqual(imported.draft.custom,[custom]);
  assert.equal(imported.play.hp,5);
  assert.deepEqual(imported.play.slots,play.slots);
  assert.equal(gcxToGwen(file,false).play,undefined);
  const buildFile=await exportGwenGCX({id:'test-id',draft,play},'build');
  assert.equal(buildFile.character.play,undefined);
  assert.equal(buildFile.preservedExtensions['gwentable/play'],undefined);
  assert.equal(await gcxLocalId(file.portableCharacterId),await gcxLocalId(file.portableCharacterId));
  assert.match(await gcxLocalId(file.portableCharacterId),/^[a-z0-9-]{1,80}$/);
});

test('unsupported builds stay private, survive roster backups, and can be separated',async()=>{
  const file=await makeGCX({sourceApp:'gwens-pocket-table',sourceBuild:'test',exportMode:'build',portableCharacterId:'pocket:test',
    rulesProfile:'AVARRA',provenance:[],character:{name:'Custom Mage',kind:'PC',level:5,classes:[{name:'Unknown Mage',level:5}]},
    preservedExtensions:{'table.test/options':{names:['Custom lineage','Custom spell']}}});
  const record=gcxToGwen(file,false);
  assert.equal(record.draft,undefined);
  const [restored]=await readRosterExport(JSON.stringify(await makeRosterExport([record])));
  assert.deepEqual(restored.gcx,file);
  const copy=asSeparateGCX(restored.gcx);
  assert.notEqual(copy.portableCharacterId,file.portableCharacterId);
  const exported=await readGCX(await exportGwenGCX({gcx:copy},'build'));
  assert.equal(exported.derivedFrom,file.portableCharacterId);
  assert.deepEqual(exported.preservedExtensions,file.preservedExtensions);
});
