import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const cmd=(args)=>spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
const dir=await mkdtemp(join(tmpdir(),'gwentable-artwork-withheld-test-'));
try{
  const result=cmd(['scripts/build-artwork-withheld-preview.mjs','--output',dir]);
  assert.equal(result.status,0, result.stderr||result.stdout);
} catch(error){await rm(dir,{force:true,recursive:true});throw error;}
test.after(async()=>{await rm(dir,{force:true,recursive:true});});

async function allFiles(folder,prefix=''){
  const files=[];
  for(const e of await readdir(folder,{withFileTypes:true})){
    const rel=prefix?prefix+'/'+e.name:e.name;
    if(e.isDirectory())files.push(...await allFiles(join(folder,e.name),rel));
    else files.push(rel);
  }
  return files;
}

test('preview strips all twelve uncleared binaries and does not change local development assets',async()=>{
  const files=await allFiles(dir);
  assert.equal(files.filter(path=>/\.(?:svg|png|webp|ico|jpe?g|gif|avif)$/i.test(path)).length,0);
  assert.ok(files.includes('app.js'));
  assert.ok(files.includes('lib/character.js'));
  assert.ok(files.includes('style.css'));
  assert.ok(files.includes('robots.txt'));
  assert.ok(files.includes('PUBLICATION_NOT_APPROVED.txt'));
  assert.ok(!files.some(path=>path.startsWith('design/taverley/')));
  const bytes=await readFile(new URL('../dist/branding/gwen-logo.png',import.meta.url));
  assert.ok(bytes.length>0, 'private local original was not deleted or modified');
});

test('fallback HTML retains recognizable branding and removes every external artwork reference',async()=>{
  const html=await readFile(join(dir,'index.html'),'utf8');
  assert.match(html,/brand-mark-fallback/);
  assert.match(html,/hero-portrait-fallback/);
  assert.match(html,/GwenTable/);
  assert.match(html,/This work includes material from the System Reference Document 5\.2\.1/);
  assert.doesNotMatch(html,/<img\b|branding\/|design\/taverley\//);
  const css=await readFile(join(dir,'style.css'),'utf8');
  assert.match(css,/hero-portrait-fallback/);
  assert.doesNotMatch(css,/var\(--tav-/);
});

test('offline cache cannot retain unapproved assets or collide with the normal local cache',async()=>{
  const sw=await readFile(join(dir,'sw.js'),'utf8');
  assert.match(sw,/open-5e-artwork-withheld-v0\.25\.7-inventory-dev/);
  assert.doesNotMatch(sw,/branding\/|design\/taverley\//);
  assert.doesNotMatch(sw,/const revision='open-5e-v0\.25\.7-inventory-dev'/);
  const originals=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(originals,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(originals,/branding\/gwen-logo\.png/);
});

test('art-only audit passes for withheld preview but still rejects uncleared local artwork',()=>{
  const preview=cmd(['scripts/audit-release-assets.mjs',dir]);
  assert.equal(preview.status,0, preview.stderr);
  assert.match(preview.stdout,/PASS: 0 variants/);
  const local=cmd(['scripts/audit-release-assets.mjs']);
  assert.equal(local.status,2);
  assert.match(local.stderr,/PUBLIC ARTWORK NO GO: 12/);
});

test('art-only audit fails closed if an unapproved image is reintroduced',async()=>{
  const added=join(dir,'gwen-logo-test.png');
  await copyFile(new URL('../dist/branding/gwen-logo.png',import.meta.url),added);
  try{
    const audit=cmd(['scripts/audit-release-assets.mjs',dir]);
    assert.equal(audit.status,2);
    assert.match(audit.stderr,/NOT CLEARED.*gwen-logo-test\.png/);
  }finally{await rm(added,{force:true});}
});

test('script refuses to overwrite the project or source directory',()=>{
  for(const output of ['.','dist','docs','tests']){
    const run=cmd(['scripts/build-artwork-withheld-preview.mjs','--output',output]);
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/Refusing to overwrite/);
  }
});
