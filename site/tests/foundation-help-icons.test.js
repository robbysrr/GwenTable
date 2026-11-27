import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beginnerTerms,beginnerHelp} from '../dist/beginner-help.js';
import {copy,setLanguage} from '../dist/locale.js';
import {icon,resolveIcon} from '../dist/ui-icons.js';
test('all eighteen beginner terms have distinct Indonesian definitions, examples and consequences',()=>{
  setLanguage('id');
  try {
    assert.equal(Object.keys(beginnerTerms).length,18);
    for(const [term,entry] of Object.entries(beginnerTerms)) {
      assert.ok(entry.pages,term);assert.ok(entry.why,term);assert.equal(entry.examples.length,2,term);
      for(const text of [entry.definition,entry.why,...entry.examples]) assert.notEqual(copy(text),text,term+': untranslated text');
      assert.match(beginnerHelp(term),/<details/);assert.match(beginnerHelp(term),/<summary/);
    }
    assert.equal(beginnerHelp('Unavailable term'),'');
  } finally {setLanguage('en');}
});
test('semantic icon resolver uses only existing public licensed assets and safe fallbacks',()=>{
  const registry=JSON.parse(readFileSync(new URL('../audit/icon-registry.json',import.meta.url)));
  for(const entityType of ['class','background','species','feat','ability-score','skill','tool','navigation','help','error','success','close','expand','item','spell']) {
    const resolved=resolveIcon({entityType,canonicalId:'fixture:unknown'});
    assert.equal(resolved.uniqueIllustration,false);
    assert.ok(registry.assets[resolved.assetId],entityType);
    assert.equal(resolved.provenance,'audit/icon-registry.json');
    assert.equal(resolved.assetId,resolved.fallbackId);
  }
  assert.equal(resolveIcon({entityType:'<script>bad</script>'}).assetId,'tav-item');
  assert.doesNotMatch(icon('<script>bad</script>'),/<script>/);
  assert.match(icon('class'),/aria-hidden="true"/);
});
