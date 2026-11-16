
import fs from 'node:fs';
let src = fs.readFileSync('/home/ubuntu/makefun/markdown-render-speed-02-entry/parse.js','utf8');
src = src.replace('function parseLinkDef', 'export function parseLinkDef');
src = src.replace('function tryLinkDef', 'export function tryLinkDef');
fs.writeFileSync('/tmp/parse_dbg2.mjs', src);
const m = await import('/tmp/parse_dbg2.mjs');
const tests = ['[ref\\[]: /uri', '[bar\\\\]: /uri', '[Foo*bar\\]]:my_(url) \'t\'', '[]: /uri', '[foo]: /url1', '[\n ]: /uri'];
for (const t of tests) {
  const r = m.parseLinkDef(t);
  console.log(JSON.stringify(t), '->', r === undefined ? 'undef' : (typeof r === 'symbol' ? 'INCOMPLETE' : JSON.stringify(r)));
}
console.log('tryLinkDef:', JSON.stringify(m.tryLinkDef(['[ref\\[]: /uri'], 0)));
