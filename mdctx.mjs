
import fs from 'fs';
import { readFileSync } from 'node:fs';
const KIT = '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(KIT + '/practice/input/cases.json', 'utf8'));
const byId = new Map(cases.map(c => [c.id, c.markdown]));
const diffs = JSON.parse(fs.readFileSync('/tmp/firstdiffs.json','utf8'));
const out = [];
for (const d of diffs) {
  const md = byId.get(d.id);
  // find where got diverges; use md around... we don't know md offset. Instead locate the got-context substring in md.
  let probe = d.got.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\n/g,'\n');
  let key = probe.split('\n').find(s=>s.trim().length>10) || probe.slice(0,40);
  key = key.trim().slice(0,60);
  let pos = md.indexOf(key);
  out.push({id:d.id, at:d.at, mdctx: pos>=0 ? md.slice(Math.max(0,pos-120), pos+180) : 'KEY NOT FOUND: '+key});
}
fs.writeFileSync('/tmp/mdctx.json', JSON.stringify(out,null,1));
console.log('done');
