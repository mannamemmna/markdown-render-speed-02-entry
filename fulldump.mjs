// Dump full MD/GOT/EXP for all failing cases, compactly
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from './parse.js';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expById = new Map(JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases.map(c => [c.id, c.html]));
let out = [];
let fails = 0;
for (const c of cases) {
  let got;
  try { got = parse(c.markdown); } catch (e) { got = 'ERROR: ' + e.stack; }
  const exp = expById.get(c.id);
  if (String(got) === String(exp)) continue;
  fails++;
  out.push('=== ' + c.id);
  out.push('MD : ' + JSON.stringify(c.markdown));
  out.push('GOT: ' + JSON.stringify(String(got)));
  out.push('EXP: ' + JSON.stringify(String(exp)));
}
writeFileSync('/tmp/allfails.txt', out.join('\n') + '\n');
console.log('fails', fails);
