// Dump first-diff context for all failing cases to /tmp/failctx.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from './parse.js';

const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));
const out = [];
for (const c of cases) {
  const exp = expById.get(c.id);
  let got;
  try { got = parse(c.markdown); } catch (e) { got = 'ERROR: ' + e.message; }
  if (got === exp) continue;
  const a = String(got), b = String(exp);
  let d = 0;
  while (d < a.length && d < b.length && a[d] === b[d]) d++;
  out.push(`--- ${c.id} @${d} gl=${a.length} el=${b.length}\nMD : ${JSON.stringify(c.markdown.slice(0, 300))}\nGOT: ${JSON.stringify(a.slice(Math.max(0, d - 100), d + 100))}\nEXP: ${JSON.stringify(b.slice(Math.max(0, d - 100), d + 100))}\n`);
}
writeFileSync('/tmp/failctx.txt', out.join('\n'));
console.log('fails', out.length);
