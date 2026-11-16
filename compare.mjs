// Local compare loop: run parse over practice cases, diff against expected.
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';

const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));

const filter = process.argv[2];
let pass = 0;
const fails = [];
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  if (filter && !c.id.startsWith(filter)) continue;
  const exp = expById.get(c.id);
  let got;
  try { got = parse(c.markdown); } catch (e) { got = 'ERROR: ' + e.message; }
  if (got === exp) pass++;
  else fails.push({ id: c.id, i, got, exp, md: c.markdown });
}
console.log('passed', pass, '/', cases.length, '| mismatches:', fails.length);
for (const f of fails.slice(0, 8)) {
  console.log('---', f.id);
  console.log('MD :', JSON.stringify(f.md.slice(0, 400)));
  console.log('GOT:', JSON.stringify(String(f.got).slice(0, 400)));
  console.log('EXP:', JSON.stringify(String(f.exp).slice(0, 400)));
  // first diff position
  let d = 0;
  const a = String(f.got), b = String(f.exp);
  while (d < a.length && d < b.length && a[d] === b[d]) d++;
  console.log('DIFF@', d, 'ctx got:', JSON.stringify(a.slice(Math.max(0, d - 60), d + 60)), 'exp:', JSON.stringify(b.slice(Math.max(0, d - 60), d + 60)));
}
if (fails.length) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/mdfails.json', JSON.stringify(fails.map(f => ({ id: f.id, md: f.md, got: String(f.got), exp: String(f.exp) })), null, 1));
  console.log('full fails written to /tmp/mdfails.json');
}
