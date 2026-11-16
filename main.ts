import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

// The harness supplies paths; rendering depends only on each markdown string.
const inputPath = join(process.env.MAKEFUN_INPUT_DIR ?? '/input', 'cases.json');
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const cases = JSON.parse(readFileSync(inputPath, 'utf8'));
if (!Array.isArray(cases)) throw new TypeError('cases.json must contain an array');
const rendered = new Array(cases.length);
for (let index = 0; index < cases.length; index++) {
  const markdown = cases[index].markdown;
  if (typeof markdown !== 'string') throw new TypeError(`Case ${index} has no markdown string`);
  rendered[index] = parse(markdown);
}
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'html.json'), JSON.stringify(rendered));
