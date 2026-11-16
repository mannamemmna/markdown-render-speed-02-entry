
import fs from 'node:fs';
let src = fs.readFileSync('/home/ubuntu/makefun/markdown-render-speed-02-entry/parse.js','utf8');
src = src.replace('function scanInline', 'export function scanInline');
fs.writeFileSync('/tmp/parse_dbg3.mjs', src);
const m = await import('/tmp/parse_dbg3.mjs');
console.log(JSON.stringify(m.scanInline('a.b-c_d@a.b\n'), null, 0));
