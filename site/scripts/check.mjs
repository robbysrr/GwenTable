import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {coverage} from './catalogue.mjs';
const json = async file => JSON.parse(await readFile(file, 'utf8'));
assert.deepEqual(coverage, await json('audit/srd-coverage.json'), 'Review and update the source registry for any licensed catalogue change.');
assert.equal((await json('.openai/hosting.json')).static.directory, 'dist');
const design = await json('design/tokens.json');
const themeCSS = await readFile('dist/design/tokens.css', 'utf8');
const [, lightCSS, darkCSS] = /^:root\s*\{([^}]*)\}\s*\[data-theme="dark"\]\s*\{([^}]*)\}/m.exec(themeCSS);
for(const [tokens, css, prefix] of [
  [design.brand, lightCSS, '--gwen-brand-'],
  [design.themes.light, lightCSS, '--gwen-'],
  [design.themes.dark, darkCSS, '--gwen-']
]) {
  const properties=Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{6})/gi)].map(([,name,value])=>[name,value]));
  for(const [name,token] of Object.entries(tokens)) {
    assert.equal(properties[prefix+name],token.$value.hex,'Design kit token mismatch for '+prefix+name);
  }
}
const root = await readdir('dist', {recursive:true});
for (const file of root.filter(name => /\.m?js$/.test(name))) {
  const result = spawnSync(process.execPath, ['--check', 'dist/'+file], {stdio:'inherit'});
  assert.equal(result.status, 0, 'Syntax check failed for '+file);
}
const html = await readFile('dist/index.html', 'utf8');
const sw = await readFile('dist/sw.js', 'utf8');
for (const [,file] of [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g), ...sw.matchAll(/'\.\/([^']+)'/g)]) {
  await access('dist/'+file);
}
assert.ok(html.includes('This work includes material from the System Reference Document 5.2.1'));
console.log('Static build, asset references, and pinned source registry passed.');
