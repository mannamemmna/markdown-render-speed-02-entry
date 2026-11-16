// Full got/exp dump for one case
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync(KIT + '/practice/reference/expected.json', 'utf8')).cases;
const expById = new Map(expected.map(c => [c.id, c.html]));
const id = process.argv[2];
const c = cases.find(x => x.id === id);
const exp = expById.get(id);
let got;
try { got = parse(c.markdown); } catch (e) { got = 'ERROR: ' + e.stack; }
console.log('MD :', JSON.stringify(c.markdown));
console.log('GOT:', JSON.stringify(String(got)));
console.log('EXP:', JSON.stringify(String(exp)));
