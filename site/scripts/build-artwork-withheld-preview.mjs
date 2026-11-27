// GwenTable local-only artwork-withheld preview. This intentionally does not
// approve or replace the original artwork, code license, or SRD release gates.
import assert from 'node:assert/strict';
import {cp,mkdir,rm,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative,join,sep} from 'node:path';

export const extensionPattern=/\.(?:svg|png|webp|ico|jpe?g|gif|avif)$/i;
const source=resolve('dist');
const flag=process.argv.indexOf('--output');
if(flag>=0&&(!process.argv[flag+1]||process.argv.length!==flag+2))throw new Error('Provide a single output directory after --output.');
if(flag<0&&process.argv.length>2)throw new Error('Only --output DIRECTORY is supported.');
const output=resolve(flag>=0?process.argv[flag+1]:'.artwork-withheld-preview');
const repo=resolve('.');
const reserved=resolve('.artwork-withheld-preview');
if(output===source||source.startsWith(output+sep)||output.startsWith(source+sep)||
   output===repo||(output.startsWith(repo+sep)&&output!==reserved))
  throw new Error('Refusing to overwrite the application source or repository.');
// Refuse a symlink at the preview root to avoid deleting an unrelated directory.
const existing=await stat(output).catch(()=>null);
if(existing&&!existing.isDirectory()) throw new Error('Preview output must be a directory.');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(source,output,{recursive:true});
async function tree(base) {
  const files=[];
  async function visit(folder){
    for(const entry of await readdir(folder,{withFileTypes:true})){
      const path=join(folder,entry.name);
      if(entry.isDirectory())await visit(path);
      else if(entry.isFile())files.push(relative(base,path).replaceAll('\\','/'));
    }
  }
  await visit(base);return files.sort();
}
const removed=(await tree(output)).filter(path=>extensionPattern.test(path));
for(const path of removed)await rm(join(output,path));
// Keep the legal attribution for inherited MIT code, but not the private theme
// and icon files. A new preview isn't an authorization for unrelated artwork.
await mkdir(join(output,'licenses'),{recursive:true});
await writeFile(join(output,'licenses/original-ui-kit-MIT.txt'),
  await readFile(join(output,'design/taverley/LICENSE.txt')));
await rm(join(output,'design/taverley'),{recursive:true,force:true});
let html=await readFile(join(output,'index.html'),'utf8');
const original=html;
html=html.replace(/<link rel="stylesheet" href="\.\/design\/taverley\/taverley-theme\.css"[^>]*>/g,'');
html=html.replace('<a href="./design/taverley/LICENSE.txt">Taverley design kit · MIT license</a>',
  '<a href="./licenses/original-ui-kit-MIT.txt">Original UI kit · MIT license</a>');
html=html.replace(/<link rel="icon"[^>]*>\s*/g,'').replace(/<link rel="apple-touch-icon"[^>]*>\s*/g,'');
html=html.replace(/<img class="brand-mark"[^>]*>/g,'<span class="brand-mark brand-mark-fallback" aria-hidden="true">G</span>');
html=html.replace(/<img class="hero-portrait"[^>]*>/g,'<div class="hero-portrait hero-portrait-fallback" aria-hidden="true"><span>✦</span></div>');
assert.notEqual(html,original,'Source HTML changed; verify the intentional fallback replacement.');
assert.match(html,/brand-mark-fallback/);
assert.match(html,/hero-portrait-fallback/);
await writeFile(join(output,'index.html'),html);
const swPath=join(output,'sw.js');
let sw=await readFile(swPath,'utf8');
for(const path of removed){
  const key="'./"+path+"'";
  assert.ok(sw.includes(key),'Unexpected service-worker asset reference for '+path);
  sw=sw.replaceAll(','+key,'').replaceAll(key+',','').replaceAll(key,'');
}
sw=sw.replaceAll(",'./design/taverley/taverley-theme.css'",'');
sw=sw.replace(/open-5e-v0\.25\.7-inventory-dev/g,'open-5e-artwork-withheld-v0.25.7-inventory-dev');
assert.match(sw,/open-5e-artwork-withheld-v0\.25\.7-inventory-dev/);
await writeFile(swPath,sw);
const cssPath=join(output,'style.css');
const css=await readFile(cssPath,'utf8');
const independentCss=css.replaceAll('var(--tav-size-frequent-touch)','44px')
  .replaceAll('var(--tav-radius-small)','6px')
  .replaceAll('var(--tav-radius-card)','12px')
  .replaceAll('var(--tav-color-warning)','var(--gwen-warning,#87530C)');
await writeFile(cssPath,independentCss+`\n/* Artwork-withheld local preview: text/CSS fallback, no unapproved binaries. */\n.brand-mark-fallback{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:12px;background:var(--gwen-brand-scholar-plum,#42243F);color:#fff;font:700 1.3rem Georgia,serif;line-height:1;min-width:39px;min-height:39px}\n.hero-portrait-fallback{display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;border:2px solid var(--gwen-brand-guild-gold,#C9A15B);border-radius:50%;background:radial-gradient(circle at 30% 25%,#E9D8F3,#6D3E82 76%,#42243F);color:#fff;min-width:0;font:700 clamp(3rem,12vw,8rem) Georgia,serif}\n.hero-portrait-fallback span{line-height:1}\n`);
await writeFile(join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
await writeFile(join(output,'PUBLICATION_NOT_APPROVED.txt'),
  'GwenTable artwork-withheld QA preview only. NOT authorized for public deployment.\nArtwork-only auditing cannot clear code, inline illustrations, legal notices, privacy, accessibility, browser behavior or owner signoff.\n');
const served=await tree(output);
assert.equal(served.filter(path=>extensionPattern.test(path)).length,0,'No image binaries may enter the artwork-withheld build.');
for(const path of served.filter(path=>/\.(?:html|css|m?js)$/.test(path))){
  const content=await readFile(join(output,path),'utf8');
  assert.doesNotMatch(content,/(?:branding\/|design\/taverley\/)/,'Private/public-unapproved file reference in '+path);
}
for(const match of [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g),...sw.matchAll(/'\.\/([^']+)'/g)]){
  assert.ok(served.includes(match[1]),'Broken static asset reference: '+match[1]);
}
console.log('Artwork-withheld preview built:',output);
console.log('Unapproved image/icon binaries withheld:',removed.length);
console.log('Local QA only. Other licenses, browser acceptance and owner release approval remain open.');
