import { parse } from './parse.js';
const cases = [
 '- one\n\n two',
 '- a\n  - b\n\n    c\n- d',
 '- foo\n  - bar\n    - baz\n\n\n      bim',
 '1.     indented code\n\n   paragraph\n\n       more code',
 '- foo\n- bar\n\n<!-- -->\n\n- baz\n- bim',
 '* foo\n  * bar\n\n  baz'
];
for (const c of cases) console.log(JSON.stringify(c), '=>', JSON.stringify(parse(c)));
