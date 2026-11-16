
import fs from 'fs';
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));

function fails(md, exp) {
  let got;
  try { got = parse(md); } catch (e) { got = 'ERR'; }
  return String(got) !== String(exp);
}

function shrink(md, exp) {
  // line-based shrinking (keep order)
  let lines = md.split('\n');
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 400) {
    improved = false;
    for (let i = 0; i < lines.length && lines.length > 1; i++) {
      const cand = lines.slice(0, i).concat(lines.slice(i + 1)).join('\n');
      if (fails(cand, exp)) { lines = cand.split('\n'); improved = true; break; }
    }
  }
  return lines.join('\n');
}

const out = [];
const ids = process.argv.slice(2);
for (const id of ids) {
  const c = cases.find(c => c.id === id);
  if (!c) { console.log('??', id); continue; }
  const exp = expById.get(c.id);
  const sm = shrink(c.markdown, exp);
  out.push({ id, md: sm });
  console.log('====', id, 'len', sm.length);
  console.log(JSON.stringify(sm));
  console.log('GOT:', JSON.stringify(String(parse(sm)).slice(0, 500)));
  console.log('EXP:', JSON.stringify(String(exp).slice(0, 500)));
}
fs.writeFileSync('/tmp/shrunk.json', JSON.stringify(out, null, 1));
