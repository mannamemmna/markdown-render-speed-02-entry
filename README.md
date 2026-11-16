# markdown-render-speed-02-entry

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/mannamemmna/markdown-render-speed-02-entry/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/mannamemmna/markdown-render-speed-02-entry/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A dependency-free JavaScript Markdown renderer targeting marked 18.1.3's default HTML output. The parser handles blocks, nested lists, links, tables, code and inline delimiters using local state for each call. It passes all 720 supplied practice cases; unseen-input equivalence is not guaranteed by that test set.

## Run it

```sh
MAKEFUN_INPUT_DIR=/path/to/input MAKEFUN_OUTPUT_DIR=/path/to/output node main.ts
```

Use Node 22.23.4 or newer with native TypeScript stripping. Input is cases.json, an array of objects with markdown strings. Output is html.json, an array of rendered strings in input order. No installation or dependencies are required. The sandbox defaults are /input and /output.

The local comparison script uses the practice kit installed beside this repository. Runtime code does not read reference outputs, case identifiers or the clock, and does not cache data across calls.

---

<sub>Entered on [make.fun](https://make.fun/?ref=y7cjn3nn&utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
