import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const script=readFileSync(new URL('../scripts/audit-release-assets.mjs',import.meta.url),'utf8');
const fixture=(approve=false,hashOverride=null)=>{
  const folder=mkdtempSync(join(tmpdir(),'gt-public-art-'));
  mkdirSync(join(folder,'scripts'),{recursive:true});
  mkdirSync(join(folder,'audit'),{recursive:true});
  mkdirSync(join(folder,'dist'),{recursive:true});
  const art='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
  const hash=createHash('sha256').update(art).digest('hex');
  writeFileSync(join(folder,'dist','safe.svg'),art);
  writeFileSync(join(folder,'scripts','audit-release-assets.mjs'),script);
  writeFileSync(join(folder,'audit','GWENTABLE_PUBLIC_ALLOWLIST.json'),JSON.stringify({
    schemaVersion:1,reviewStatus:'PENDING_OWNER_REVIEW',assets:approve?[{
      path:'safe.svg',publicApproved:true,sha256:hashOverride??hash,license:'CC0',rightsOwner:'Fixture author',
      approvedBy:'Fixture signer',approvedAt:'2026-11-19'
    }]:[]
  }));
  return {folder,hash};
};
const execute=folder=>spawnSync(process.execPath,['scripts/audit-release-assets.mjs'],{cwd:folder,encoding:'utf8'});

test('public artwork release denies a present asset when no documented owner clearance exists',()=>{
  const {folder}=fixture();
  try {const outcome=execute(folder);assert.equal(outcome.status,2);assert.match(outcome.stderr,/PUBLIC ARTWORK NO GO/);}finally{rmSync(folder,{recursive:true,force:true});}
});
test('public artwork release rejects filename-matched but hash-mismatched assets',()=>{
  const {folder}=fixture(true,'0'.repeat(64));
  try {const outcome=execute(folder);assert.equal(outcome.status,2);assert.match(outcome.stderr,/NOT CLEARED/);}finally{rmSync(folder,{recursive:true,force:true});}
});
test('asset-only approval requires exact hash plus license, owner and approval record',()=>{
  const {folder}=fixture(true);
  try {const outcome=execute(folder);assert.equal(outcome.status,0,outcome.stderr);assert.match(outcome.stdout,/Artwork-only check PASS/);assert.match(outcome.stdout,/gates remain separate/);}finally{rmSync(folder,{recursive:true,force:true});}
});
test('actual GwenTable local assets stay blocked for public release without signed allowlist',()=>{
  const root=new URL('../',import.meta.url).pathname;
  const outcome=execute(root);
  assert.equal(outcome.status,2);
  assert.match(outcome.stderr,/12 non-approved\/mismatched records/);
});
