import { marked } from '/home/ubuntu/makefun/fresh-kits/markdown-render-speed-02-kit/baselines/vendor/marked/marked.esm.js';
const cases = process.argv.slice(2);
for (const c of cases) console.log(JSON.stringify(c), '=>', JSON.stringify(marked.parse(c)));
