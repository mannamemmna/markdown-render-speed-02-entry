
import fs from 'fs';
import { parse } from './parse.js';
import { readFileSync } from 'node:fs';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));
const fails = JSON.parse(fs.readFileSync('/tmp/mdfails.json','utf8'));
const out = [];
for (const f of fails) {
  const got = String(f.got), exp = String(f.exp);
  let i = 0; while (i < got.length && i < exp.length && got[i] === exp[i]) i++;
  out.push({id: f.id, at: i, got: got.slice(Math.max(0,i-50), i+70), exp: exp.slice(Math.max(0,i-50), i+70)});
}
fs.writeFileSync('/tmp/firstdiffs.json', JSON.stringify(out,null,1));
console.log('done');
