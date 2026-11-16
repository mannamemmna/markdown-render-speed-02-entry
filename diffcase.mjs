// Show first-diff context for one case: node diffcase.mjs <id>
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
const a = String(got), b = String(exp);
let d = 0;
while (d < a.length && d < b.length && a[d] === b[d]) d++;
console.log('first diff @', d, 'gotlen', a.length, 'explen', b.length);
console.log('MD tail around diff? mdlen', c.markdown.length);
console.log('GOT ctx:', JSON.stringify(a.slice(Math.max(0, d - 120), d + 120)));
console.log('EXP ctx:', JSON.stringify(b.slice(Math.max(0, d - 120), d + 120)));
