// Print baseline (marked) output for given case ids
import { readFileSync } from 'node:fs';
import { parse as base } from '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit/baselines/parse.js';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expById = new Map(JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases.map(c => [c.id, c.html]));
for (const id of process.argv.slice(2)) {
  const c = cases.find(x => x.id === id);
  const b = base(c.markdown);
  const e = expById.get(id);
  console.log('== ' + id, 'baseline-match:', b === e);
  console.log('MD :', JSON.stringify(c.markdown).slice(0, 300));
  console.log('BAS:', JSON.stringify(b).slice(0, 300));
  if (b !== e) console.log('EXP:', JSON.stringify(e).slice(0, 300));
}
