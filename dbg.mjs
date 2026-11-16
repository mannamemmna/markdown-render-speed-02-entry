// Debug one or more case ids: node dbg.mjs cm-278 cm-279 ...
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));
const ids = process.argv.slice(2);
for (const id of ids) {
  const c = cases.find(x => x.id === id);
  if (!c) { console.log('no case', id); continue; }
  const exp = expById.get(id);
  let got;
  try { got = parse(c.markdown); } catch (e) { got = 'ERROR: ' + e.message; }
  console.log('===', id);
  console.log('MD :', JSON.stringify(c.markdown));
  console.log('GOT:', JSON.stringify(got));
  if (got !== exp) console.log('EXP:', JSON.stringify(exp));
}
