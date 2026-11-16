// Original single-file markdown -> HTML renderer.
// Target output: CommonMark 0.31.2 + GFM (tables, task lists, strikethrough,
// extended autolinks) as rendered by marked 18.1.3 with default options.
// Composed from scratch for the markdown-render-speed-02 competition.

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

// Escape < > " ' always; bare & only when not already an entity reference.
function escapeText(s) {
  let out = '';
  let seg = 0;
  const n = s.length;
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    if (c === 60 || c === 62 || c === 34 || c === 39) {
      out += s.slice(seg, i);
      out += c === 60 ? '&lt;' : c === 62 ? '&gt;' : c === 34 ? '&quot;' : '&#39;';
      seg = i + 1;
    } else if (c === 38) {
      let j = i + 1;
      let ok = false;
      let k2;
      if (s.charCodeAt(j) === 35) {
        j++;
        if (s.charCodeAt(j) === 120 || s.charCodeAt(j) === 88) {
          k2 = j + 1;
          while (k2 < n && ((s.charCodeAt(k2) >= 48 && s.charCodeAt(k2) <= 57) || (s.charCodeAt(k2) >= 65 && s.charCodeAt(k2) <= 70) || (s.charCodeAt(k2) >= 97 && s.charCodeAt(k2) <= 102))) k2++;
          ok = k2 > j + 1 && s.charCodeAt(k2) === 59;
        } else {
          k2 = j;
          while (k2 < n && s.charCodeAt(k2) >= 48 && s.charCodeAt(k2) <= 57) k2++;
          ok = k2 > j && s.charCodeAt(k2) === 59;
        }
      } else {
        k2 = j;
        while (k2 < n && (isAlnum(s.charCodeAt(k2)) || s.charCodeAt(k2) === 95)) k2++;
        ok = k2 > j && s.charCodeAt(k2) === 59;
      }
      if (ok) {
        if (s.charCodeAt(i + 1) === 35) {
          // numeric: keep verbatim only when the value fits a code point
          let k3 = i + 2;
          let hex2 = false;
          if (s.charCodeAt(k3) === 120 || s.charCodeAt(k3) === 88) { hex2 = true; k3++; }
          let k4 = k3;
          if (hex2) {
            while (k4 < n && ((s.charCodeAt(k4) >= 48 && s.charCodeAt(k4) <= 57) || (s.charCodeAt(k4) >= 65 && s.charCodeAt(k4) <= 70) || (s.charCodeAt(k4) >= 97 && s.charCodeAt(k4) <= 102))) k4++;
          } else {
            while (k4 < n && s.charCodeAt(k4) >= 48 && s.charCodeAt(k4) <= 57) k4++;
          }
          const v = parseInt(s.slice(k3, k4), hex2 ? 16 : 10);
          if (v > 0x10FFFF) {
            out += s.slice(seg, i);
            out += '&amp;';
            seg = i + 1;
            continue;
          }
        }
        i = k2; // entity verbatim: covered by the pending slice
      } else {
        out += s.slice(seg, i);
        out += '&amp;';
        seg = i + 1;
      }
    }
  }
  out += s.slice(seg);
  return out;
}

// Escape everything, including every bare & (code spans, code blocks, URLs).
function escapeAll(s) {
  let out = '';
  let seg = 0;
  const n = s.length;
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    if (c === 60 || c === 62 || c === 34 || c === 39) {
      out += s.slice(seg, i);
      out += c === 60 ? '&lt;' : c === 62 ? '&gt;' : c === 34 ? '&quot;' : '&#39;';
      seg = i + 1;
    } else if (c === 38) {
      out += s.slice(seg, i);
      out += '&amp;';
      seg = i + 1;
    }
  }
  out += s.slice(seg);
  return out;
}

function isSpaceChar(c) { return c === 32 || c === 9 || c === 10 || c === 11 || c === 12 || c === 13; }
function isPunctChar(c) {
  return (c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
}
function isAlnum(c) {
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
// Unicode whitespace (flanking rules use it; block parsing uses ASCII only)
function isUniSpace(c) {
  return isSpaceChar(c) || c === 0xA0 || c === 0x1680 ||
    (c >= 0x2000 && c <= 0x200A) || c === 0x2028 || c === 0x2029 ||
    c === 0x202F || c === 0x205F || c === 0x3000;
}
// Unicode punctuation/symbol categories (P and S), practical subset
function isUniPunct(c) {
  if (isPunctChar(c)) return true;
  return (c >= 0xA1 && c <= 0xA7) || c === 0xA9 || c === 0xAB || c === 0xAC ||
    c === 0xAE || c === 0xB0 || c === 0xB1 || (c >= 0xB6 && c <= 0xB7) ||
    c === 0xBB || c === 0xBF || c === 0xD7 || c === 0xF7 ||
    (c >= 0x2010 && c <= 0x2027) || (c >= 0x2030 && c <= 0x205E) ||
    (c >= 0x20A0 && c <= 0x20CF) || c === 0x2122 || c === 0x2126 ||
    (c >= 0x2190 && c <= 0x2BFF) || (c >= 0x2E00 && c <= 0x2E7F) ||
    (c >= 0x3001 && c <= 0x3003) || (c >= 0x3008 && c <= 0x3011) ||
    (c >= 0x3014 && c <= 0x301F) || c === 0x3030 || c === 0xFD3E ||
    c === 0xFD3F || (c >= 0xFE10 && c <= 0xFE19) || (c >= 0xFE30 && c <= 0xFE6F) ||
    (c >= 0xFF01 && c <= 0xFF20) || (c >= 0xFF3B && c <= 0xFF40) ||
    (c >= 0xFF5B && c <= 0xFF65);
}
function isAlpha(c) { return (c >= 65 && c <= 90) || (c >= 97 && c <= 122); }

function cleanUrl(href) {
  if (!href) return '';
  try {
    // encodeURI-like: re-encode specials and non-ASCII, restore original % escapes
    return escapeText(encodeURI(href).replace(/%25/g, '%').replace(/\\/g, '%5C'));
  } catch (e) {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Block parsing helpers
// ---------------------------------------------------------------------------

const HTML_BLOCK_TAGS = new Set(('address article aside base basefont blockquote body caption center col colgroup ' +
  'dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head ' +
  'header hr html iframe legend li link main menu menuitem nav noframes ol optgroup option p param section source ' +
  'summary table tbody td tfoot th thead title tr track ul pre script style textarea').split(' '));

function indentWidth(line) {
  let w = 0;
  const n = line.length;
  for (let i = 0; i < n; i++) {
    const c = line.charCodeAt(i);
    if (c === 32) w++;
    else if (c === 9) w += 4 - (w % 4);
    else break;
  }
  return w;
}

// Indented code: consume exactly 4 columns of leading whitespace; spaces count
// 1 column each, a tab counts 4 and is consumed whole (marked keeps tabs that
// survive the 4-column strip verbatim in the code text).
function stripCodeIndent(line) {
  let col = 0;
  let i = 0;
  const n = line.length;
  while (i < n && col < 4) {
    const c = line.charCodeAt(i);
    if (c === 32) { col++; i++; }
    else if (c === 9) { col += 4; i++; }
    else break;
  }
  return line.slice(i);
}

function isBlank(line) {
  const n = line.length;
  for (let i = 0; i < n; i++) {
    const c = line.charCodeAt(i);
    if (c !== 32 && c !== 9) return false;
  }
  return true;
}

// Expand the leading whitespace run (tabs -> next tab stop) to spaces, then
// drop `cols` columns. The rest of the line keeps its original characters.
function stripIndent(line, cols) {
  let out = '';
  let col = 0;
  let i = 0;
  const n = line.length;
  while (i < n) {
    const c = line.charCodeAt(i);
    if (c === 32) { out += ' '; col++; i++; }
    else if (c === 9) { const t = 4 - (col % 4); out += ' '.repeat(t); col += t; i++; }
    else break;
  }
  if (col < cols) return out + line.slice(i);
  return out.slice(cols) + line.slice(i);
}

// remove up to max leading spaces (fenced code indentation)
function stripSpacesMax(line, max) {
  let k = 0;
  while (k < max && line.charCodeAt(k) === 32) k++;
  return line.slice(k);
}

// List item first line: skip the marker (already located), expand the
// whitespace run after it and drop `consume` columns of it.
function stripAfterMarker(line, from, consume) {
  let out = '';
  let col = from;
  let i = from;
  const n = line.length;
  while (i < n) {
    const c = line.charCodeAt(i);
    if (c === 32) { out += ' '; col++; i++; }
    else if (c === 9) { const t = 4 - (col % 4); out += ' '.repeat(t); col += t; i++; }
    else break;
  }
  if (out.length > consume) return out.slice(consume) + line.slice(i);
  return line.slice(i);
}

function normalizeLineEnds(src) {
  if (src.indexOf('\r') === -1) return src;
  return src.replace(/\r\n?/g, '\n');
}

function splitLines(src) {
  const lines = src.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// ---------------------------------------------------------------------------
// Block structure matching
// ---------------------------------------------------------------------------

function matchFence(line) {
  const w = indentWidth(line);
  if (w >= 4) return null;
  const c = line.charCodeAt(w);
  if (c !== 96 && c !== 126) return null;
  let len = 0;
  let i = w;
  const n = line.length;
  while (i < n && line.charCodeAt(i) === c) { len++; i++; }
  if (len < 3) return null;
  const info = line.slice(i).trim();
  if (c === 96 && info.indexOf('`') !== -1) return null;
  return { char: c, len, indent: w, info: info.split(/[ \t]/)[0] };
}

function matchAtx(line) {
  const w = indentWidth(line);
  if (w >= 4) return null;
  let i = w;
  const n = line.length;
  if (line.charCodeAt(i) !== 35) return null;
  let level = 0;
  while (i < n && line.charCodeAt(i) === 35 && level < 7) { level++; i++; }
  if (level > 6) return null;
  if (i < n && line.charCodeAt(i) !== 32 && line.charCodeAt(i) !== 9) return null;
  let text = line.slice(i);
  const tm = /[ \t]+#+[ \t]*$/.exec(text);
  if (tm) text = text.slice(0, tm.index);
  text = text.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '');
  return { level, text };
}

function isThematicBreak(line) {
  const w = indentWidth(line);
  if (w >= 4) return false;
  const ch = line.charCodeAt(w);
  if (ch !== 45 && ch !== 95 && ch !== 42) return false;
  let count = 0;
  const n = line.length;
  for (let i = w; i < n; i++) {
    const c = line.charCodeAt(i);
    if (c === ch) count++;
    else if (c === 32 || c === 9) continue;
    else return false;
  }
  return count >= 3;
}

const COND6_TAGS = new Set(('address article aside base basefont blockquote body caption center col colgroup ' +
  'dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head ' +
  'header hr html iframe legend li link main menu menuitem nav noframes ol optgroup option p param section source ' +
  'summary table tbody td tfoot th thead title tr track ul').split(' '));

function startsHtmlBlock6(L) {
  const w = indentWidth(L);
  if (w >= 4) return false;
  if (L.charCodeAt(w) !== 60) return false;
  const m = /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(L.slice(w));
  if (!m) return false;
  return COND6_TAGS.has(m[1].toLowerCase());
}

function matchHtmlBlock(line, prevWasParagraph) {
  const w = indentWidth(line);
  if (w >= 4) return null;
  if (line.charCodeAt(w) !== 60) return null;
  const t = line.slice(w);
  const lower = t.toLowerCase();
  let m = /^<(script|pre|style|textarea)\b/.exec(lower);
  if (m) return { kind: 'raw', close: '</' + m[1] };
  if (/^<!--/.test(t)) return { kind: 'raw', close: '-->' };
  if (/^<\?/.test(t)) return { kind: 'raw', close: '?>' };
  if (/^<![A-Za-z]/.test(t)) return { kind: 'raw', close: '>' };
  if (/^<!\[CDATA\[/.test(t)) return { kind: 'raw', close: ']]>' };
  if (startsHtmlBlock6(line)) return { kind: 'cond6' };
  // condition 7: a complete open/close tag alone on the line
  const tagEnd = matchHtmlTag(line, w);
  if (tagEnd && tagEnd === line.replace(/[ \t]+$/, '').length) {
    if (prevWasParagraph) return null;
    return { kind: 'cond6' };
  }
  return null;
}

function matchListMarker(line) {
  const w = indentWidth(line);
  if (w >= 4) return null;
  const n = line.length;
  let i = w;
  const c = line.charCodeAt(i);
  let marker;
  let ordered = false;
  if (c === 45 || c === 43 || c === 42) { marker = String.fromCharCode(c); i++; }
  else if (c >= 48 && c <= 57) {
    let d = 0;
    while (i < n && line.charCodeAt(i) >= 48 && line.charCodeAt(i) <= 57 && d < 9) { i++; d++; }
    const cc = line.charCodeAt(i);
    if (cc !== 46 && cc !== 41) return null;
    marker = line.slice(w, i + 1);
    i++;
    ordered = true;
  } else return null;
  if (i >= n) return { marker, ordered, indent: w, contentIndent: w + marker.length + 1, consume: 1, blank: true };
  const nc = line.charCodeAt(i);
  if (nc !== 32 && nc !== 9) return null;
  // measure the whitespace run after the marker
  let runCols = 0;
  let hasTab = false;
  let k = i;
  let col = w + marker.length;
  let restBlank = true;
  while (k < n) {
    const d = line.charCodeAt(k);
    if (d === 32) { runCols++; k++; col++; }
    else if (d === 9) { const t = 4 - (col % 4); runCols += t; hasTab = true; k++; col += t; }
    else { restBlank = false; break; }
  }
  // marked quirk: a blank-marker line behaves like '-' (consume = 1) regardless
  // of how many trailing spaces follow the marker
  if (restBlank) return { marker, ordered, indent: w, contentIndent: w + marker.length + 1, consume: 1, blank: true };
  // marked quirk: a run containing a tab contributes only 1 column of content
  // indent; an all-space run is consumed entirely when <= 4 columns, else only
  // one space is consumed (marked 'bullet spaces' rule)
  const consume = hasTab ? 1 : (runCols <= 4 ? runCols : 1);
  if (k >= n) return { marker, ordered, indent: w, contentIndent: w + marker.length + consume, consume, blank: true };
  return { marker, ordered, indent: w, contentIndent: w + marker.length + consume, consume, blank: false };
}

// ---------------------------------------------------------------------------
// Block tokenization
// ---------------------------------------------------------------------------

function parseBlocks(lines, defs, endNl, inItem) {
  const tokens = [];
  let i = 0;
  const n = lines.length;
  let lastWasPara = false;
  while (i < n) {
    const prevPara = lastWasPara;
    lastWasPara = false;
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    const width = indentWidth(line);

    // Indented code
    if (width >= 4) {
      let j = i;
      const buf = [];
      let started = false; // code block begins at the first non-blank line
      while (j < n) {
        if (isBlank(lines[j])) { buf.push(indentWidth(lines[j]) >= 4 ? stripCodeIndent(lines[j]) : ''); j++; continue; }
        if (indentWidth(lines[j]) >= 4) { buf.push(stripCodeIndent(lines[j])); started = true; j++; continue; }
        break;
      }
      // drop leading/trailing blank lines, keep interior blanks
      let a = 0, b = buf.length;
      while (a < b && buf[a] === '') a++;
      while (b > a && buf[b - 1] === '') b--;
      tokens.push({ type: 'code', text: buf.slice(a, b).join('\n') + '\n' });
      i = j;
      continue;
    }

    // Fenced code
    const f = matchFence(line);
    if (f) {
      let j = i + 1;
      const buf = [];
      while (j < n) {
        const L = lines[j];
        if (!isBlank(L) && indentWidth(L) < 4 && L.charCodeAt(indentWidth(L)) === f.char) {
          let k = indentWidth(L);
          let flen = 0;
          while (k < L.length && L.charCodeAt(k) === f.char) { flen++; k++; }
          if (flen >= f.len && L.slice(k).trim() === '') { j++; break; }
        }
        buf.push(stripSpacesMax(L, f.indent));
        j++;
      }
      // marked: a fence keeps at most (trailingBlanks - 1) blank lines
      let tb = 0;
      while (tb < buf.length && buf[buf.length - 1 - tb] === '') tb++;
      if (tb > 1) { buf.length = buf.length - tb + (tb - 1); }
      else if (tb === 1) { buf.length = buf.length - 1; }
      tokens.push({ type: 'fence', lang: f.info, text: buf.join('\n') + (buf.length ? '\n' : '') });
      i = j;
      continue;
    }

    // ATX heading
    const atx = matchAtx(line);
    if (atx) {
      tokens.push({ type: 'heading', level: atx.level, text: atx.text });
      i++;
      continue;
    }

    // Setext heading underline (takes precedence over thematic break after a paragraph)
    const sm = /^ {0,3}(=+|-+)[ \t]*$/.exec(line);
    if (sm && prevPara && tokens.length > 0 && tokens[tokens.length - 1].type === 'paragraph') {
      const last = tokens[tokens.length - 1];
      last.type = 'heading';
      last.level = sm[1][0] === '=' ? 1 : 2;
      last.text = last.lines.join('\n').trim();
      delete last.lines;
      i++;
      continue;
    }

    // Thematic break
    if (isThematicBreak(line)) { tokens.push({ type: 'hr' }); i++; continue; }

    // Blockquote
    if (line.charCodeAt(width) === 62) {
      const inner = [];
      let j = i;
      let prevQuote = true;
      let paraActive = false; // is the deepest open block inside the quote an active paragraph?
      let fenceOpen = false;
      let fenceMark = 0, fenceLen = 0;
      const updState = (s) => {
        if (fenceOpen) {
          const cf = matchFence(s);
          if (cf && cf.char === fenceMark && cf.len >= fenceLen && !cf.info) {
            fenceOpen = false; paraActive = false;
          }
          return;
        }
        if (isBlank(s)) { paraActive = false; return; }
        if (indentWidth(s) >= 4) { paraActive = false; return; }
        if (s.charCodeAt(0) === 62) { paraActive = true; return; }
        const f = matchFence(s);
        if (f) { fenceOpen = true; fenceMark = f.char; fenceLen = f.len; paraActive = false; return; }
        if (matchAtx(s) || isThematicBreak(s) || startsHtmlBlock6(s)) { paraActive = false; return; }
        const lm = matchListMarker(s);
        if (lm) { paraActive = !lm.blank; return; }
        paraActive = true;
      };
      while (j < n) {
        const L = lines[j];
        if (isBlank(L)) break;
        const w2 = indentWidth(L);
        if (w2 < 4 && L.charCodeAt(w2) === 62) {
          inner.push(stripAfterMarker(L, w2 + 1, 1));
          j++;
          prevQuote = true;
          updState(inner[inner.length - 1]);
        } else if (inner.length > 0 && paraActive && !fenceOpen && !interruptsParagraph(L)) {
          // marked's lazy-continuation quirks (fitted to baseline behavior):
          // after a quote line, exactly 4 leading spaces or one tab are stripped
          const lead = /^ {4}\S/.test(L) ? 4 : (/^\t\S/.test(L) ? 1 : 0);
          const se = !prevQuote && /^ *(=+|-+)[ \t]*$/.test(L) && L.trim()[0] !== '-';
          let pushed;
          if (prevQuote && lead) {
            // stripped lazy line: sentinel so the content re-parse keeps it
            // as paragraph text instead of a new block start
            pushed = '\x00' + L.slice(lead);
          } else if (se) {
            // setext-looking lazy lines must not pair with the paragraph;
            // marked re-indents them to exactly 4 spaces
            pushed = '    ' + L.replace(/^ +/, '');
          } else {
            pushed = L;
          }
          inner.push(pushed);
          j++;
          prevQuote = false;
          paraActive = true;
        } else break;
      }
      tokens.push({ type: 'blockquote', tokens: parseBlocks(inner, defs) });
      i = j;
      continue;
    }

    // HTML block
    const prevType = tokens.length ? tokens[tokens.length - 1].type : null;
    const h = matchHtmlBlock(line, prevPara);
    if (h) {
      let j = i + 1;
      const buf = [line];
      if (h.kind === 'raw') {
        // condition 1 / comments / PI / declarations: end at the closing
        // marker (possibly many lines later, spanning blank lines)
        if (h.close && line.indexOf(h.close) !== -1) {
          // closes on the opening line
        } else {
          let closed = false;
          while (j < n && !closed) {
            buf.push(lines[j]);
            if (h.close && lines[j].indexOf(h.close) !== -1) closed = true;
            j++;
          }
        }
      } else {
        while (j < n && !isBlank(lines[j])) { buf.push(lines[j]); j++; }
      }
      // trailing newline: present when the raw md continues right after the
      // block with a single newline; absent when a blank line follows or at
      // EOF without a final newline
      let text = buf.join('\n');
      if (j < n && !isBlank(lines[j])) text += '\n';
      else if (j >= n && endNl) text += '\n';
      tokens.push({ type: 'html', text });
      i = j;
      continue;
    }

    // Link reference definition
    const def = tryLinkDef(lines, i);
    if (def) {
      if (!defs[def.label]) {
        defs[def.label] = { dest: unescapeBackslashes(def.dest), title: def.title != null ? unescapeBackslashes(def.title) : null };
      }
      i = def.next;
      if (def.restLines.length) {
        tokens.push({ type: 'paragraph', lines: def.restLines });
        lastWasPara = true;
      }
      continue;
    }

    // List
    const li = matchListMarker(line);
    if (li && !(lastWasPara && !listCanInterrupt(li, inItem))) {
      const res = parseList(lines, i, li);
      for (const item of res.token.items) {
        // task list checkbox on the first line
        let lines2 = item.lines;
        item.task = -1;
        let firstLine = -1;
        for (let q = 0; q < lines2.length; q++) {
          if (!isBlank(lines2[q])) { firstLine = q; break; }
        }
        if (firstLine >= 0) {
          const m = /^(\[[ xX]\])[ \t]+(.*)$/.exec(lines2[firstLine]);
          if (m) {
            item.task = m[1] === '[x]' || m[1] === '[X]' ? 1 : 0;
            lines2 = lines2.slice();
            if (m[2] === '') lines2.splice(firstLine, 1);
            else lines2[firstLine] = m[2];
          }
        }
        item.tokens = parseBlocks(lines2, defs, false, true);
        item.lines = lines2;
      }
      tokens.push(res.token);
      i = res.next;
      continue;
    }
    if (li && prevType === 'paragraph') {
      // paragraph is still open from a previous iteration? never: paragraphs
      // are only created at the end of the loop
    }

    // Table
    if (i + 1 < n && line.indexOf('|') !== -1) {
      const delim = parseDelimRow(lines[i + 1]);
      if (delim) {
        const header = splitTableRow(line);
        if (header.length === delim.length) {
          const rows = [];
          let j = i + 2;
          const isRowLine = (s) => {
            if (isBlank(s)) return false;
            const w = indentWidth(s);
            if (w >= 4) return false;
            if (s.charCodeAt(w) === 62 || s.charCodeAt(w) === 35) return false;
            if (matchFence(s) || isThematicBreak(s) || matchListMarker(s) || matchAtx(s)) return false;
            if (startsHtmlBlock6(s)) return false;
            return true;
          };
          while (j < n && isRowLine(lines[j])) {
            rows.push(splitTableRow(lines[j]));
            j++;
          }
          tokens.push({ type: 'table', header, align: delim, rows });
          i = j;
          continue;
        }
      }
    }

    // Paragraph
    const buf = [line];
    let j = i + 1;
    while (j < n) {
      const L = lines[j];
      if (isBlank(L)) {
        // marked: a whitespace-only final line (no trailing newline in src)
        // still joins the paragraph (an empty line does not)
        if (L.length > 0 && j + 1 >= n && !endNl) { buf.push(L); j++; }
        break;
      }
      if (L.charCodeAt(0) === 0) { buf.push(L.slice(1)); j++; continue; } // lazy sentinel
      const w2 = indentWidth(L);
      if (matchAtx(L) || isThematicBreak(L) || matchFence(L)) break;
      if (w2 < 4 && L.charCodeAt(w2) === 62) break;
      if (matchHtmlBlock(L, true)) break;
      const mk = matchListMarker(L);
      if (mk && !mk.blank && listCanInterrupt(mk, inItem)) break;
      if (/^ {0,3}(=+|-+)[ \t]*$/.test(L)) break; // setext
      if (L.indexOf('|') !== -1 && j + 1 < n && buf.length === 1) {
        const dm = parseDelimRow(lines[j + 1]);
        if (dm && splitTableRow(L).length === dm.length) break; // table
      }
      // keep continuation lines verbatim (marked keeps leading whitespace)
      buf.push(L);
      j++;
    }
    // setext: next line is the underline
    if (j < n && /^ {0,3}(=+|-+)[ \t]*$/.test(lines[j])) {
      tokens.push({ type: 'heading', level: lines[j].trim()[0] === '=' ? 1 : 2, text: buf.join('\n').trim() });
      i = j + 1;
      continue;
    }
    tokens.push({ type: 'paragraph', lines: buf });
    lastWasPara = true;
    i = j;
  }
  return tokens;
}

function interruptsParagraph(L, inItem) {
  const w = indentWidth(L);
  if (w >= 4) return false; // indented code cannot interrupt a paragraph
  if (matchAtx(L) || isThematicBreak(L) || matchFence(L)) return true;
  if (L.charCodeAt(w) === 62) return true;
  if (startsHtmlBlock6(L)) return true;
  const mk = matchListMarker(L);
  if (mk && !mk.blank && listCanInterrupt(mk, inItem)) return true;
  return false;
}

function listCanInterrupt(mk, inItem) {
  if (mk.blank) return false;
  if (mk.ordered && !inItem) {
    // only "1." can interrupt a top-level paragraph
    return mk.marker === '1.' || mk.marker === '1)';
  }
  return true;
}

function parseList(lines, start, first) {
  const ordered = first.ordered;
  const items = [];
  let i = start;
  const n = lines.length;
  let loose = false;
  let sawBlankBetween = false;
  const startNum = ordered ? parseInt(first.marker.slice(0, -1), 10) : 1;
  const delimChar = ordered ? first.marker.charCodeAt(first.marker.length - 1) : 0;
  const bulletChar = ordered ? 0 : first.marker.charCodeAt(0);

  while (i < n) {
    // skip blanks between items
    let j = i;
    let blanks = 0;
    while (j < n && isBlank(lines[j])) { j++; blanks++; }
    if (j >= n) break;
    const mk = matchListMarker(lines[j]);
    if (!mk || mk.ordered !== ordered) break;
    if (isThematicBreak(lines[j])) break; // hr wins over sibling item
    if (ordered) {
      if (mk.marker.charCodeAt(mk.marker.length - 1) !== delimChar) break;
    } else {
      if (mk.marker.charCodeAt(0) !== bulletChar) break;
    }
    if (blanks > 0 && items.length > 0) sawBlankBetween = true;
    // collect item lines (the marker line is consumed as item content)
    const ci = mk.contentIndent;
    const firstContent = stripAfterMarker(lines[j], mk.indent + mk.marker.length, mk.consume);
    const itemLines = [];
    let k = j + 1;
    let blanksIn = 0;
    let paraActive = !mk.blank;
    // stack of nested list domains inside this item: {markerCol, contentCol}
    const domains = [];
    let itemLoose = false;
    let fenceOpen = false, fenceMark = 0, fenceLen = 0;
    {
      const ff = matchFence(firstContent);
      if (ff) { fenceOpen = true; fenceMark = ff.char; fenceLen = ff.len; paraActive = false; }
    }
    while (k < n) {
      const L = lines[k];
      if (fenceOpen) {
        // inside a fenced code block: every line is verbatim item content
        if (isBlank(L)) { itemLines.push(''); k++; continue; }
        const w = indentWidth(L);
        const ded = w >= ci ? stripIndent(L, ci) : L;
        itemLines.push(ded);
        const cf = matchFence(ded);
        if (cf && cf.char === fenceMark && cf.len >= fenceLen && !cf.info) fenceOpen = false;
        k++;
        continue;
      }
      if (isBlank(L)) {
        // an item that starts with a blank marker line ends at the next blank
        if (mk.blank && itemLines.length === 0) break;
        let p = k + 1;
        let bcount = 0;
        while (p < n && isBlank(lines[p])) { p++; bcount++; }
        if (p >= n) break;
        const L2 = lines[p];
        const w2 = indentWidth(L2);
        if (w2 < ci) break;
        // content continues after blanks: keep every blank line
        const mk2 = matchListMarker(stripIndent(L2, ci));
        // looseness attribution: a blank inside a nested list's domain
        // loosens only the innermost list; a blank in the item's own
        // content loosens this item. A domain covers its marker column
        // (sibling markers) and its content column and beyond.
        let inDomain = false;
        for (let d = domains.length - 1; d >= 0; d--) {
          if (w2 >= domains[d].contentCol) { inDomain = true; break; }
          if (mk2 && ci + mk2.indent >= domains[d].markerCol) { inDomain = true; break; }
        }
        if (!inDomain) itemLoose = true;
        for (let b = 0; b < bcount + 1; b++) itemLines.push('');
        blanksIn += bcount;
        paraActive = false;
        k = p;
        continue;
      }
      const w = indentWidth(L);
      if (isThematicBreak(L) && w < ci) break;
      if (w >= ci) {
        // pop nested domains this line no longer belongs to
        const mkHere = matchListMarker(stripIndent(L, ci));
        while (domains.length) {
          const d = domains[domains.length - 1];
          if (mkHere) {
            if (ci + mkHere.indent >= d.markerCol) break;
          } else if (w >= d.contentCol) break;
          domains.pop();
        }
        const cols = (paraActive && w - ci >= 4) ? ci + 4 : ci;
        const ded = stripIndent(L, cols);
        itemLines.push(ded);
        const dmk = matchListMarker(ded);
        if (dmk) {
          const absCol = ci + dmk.indent;
          const dContent = absCol + dmk.marker.length + dmk.consume;
          const topD = domains[domains.length - 1];
          if (!topD || absCol > topD.markerCol) {
            domains.push({ markerCol: absCol, contentCol: dContent });
          }
        }
        const f = matchFence(ded);
        if (f) { fenceOpen = true; fenceMark = f.char; fenceLen = f.len; paraActive = false; }
        else paraActive = !(indentWidth(ded) >= 4 || matchAtx(ded) ||
          isThematicBreak(ded) || startsHtmlBlock6(ded) || ded.charCodeAt(0) === 62 || dmk);
        k++;
        continue;
      }
      if (paraActive && !interruptsParagraph(L) && !matchListMarker(L)) {
        // lazy paragraph continuation; marked strips 4+ leading spaces
        // sentinel so the content re-parse keeps it as paragraph text
        itemLines.push('\x00' + (w >= 4 ? stripSpacesMax(L, 4) : L));
        k++;
        continue;
      }
      break;
    }
    if (itemLoose) loose = true;
    items.push({ lines: [firstContent].concat(itemLines) });
    i = k;
  }

  if (sawBlankBetween) loose = true;

  return { token: { type: 'list', ordered, start: startNum, loose, items }, next: i };
}

function splitTableRow(line) {
  const row = line.trim();
  const n = row.length;
  if (n === 0) return [''];
  let start = 0;
  if (row.charCodeAt(0) === 124) start = 1;
  let end = n;
  if (n > start && row.charCodeAt(n - 1) === 124 && !isEscapedPipe(row, n - 1)) end = n - 1;
  const cells = [];
  let cur = '';
  let i = start;
  while (i < end) {
    const c = row.charCodeAt(i);
    if (c === 92 && i + 1 < end && row.charCodeAt(i + 1) === 124) {
      cur += '|';
      i += 2;
      continue;
    }
    if (c === 124) { cells.push(cur); cur = ''; i++; continue; }
    cur += row[i];
    i++;
  }
  cells.push(cur);
  return cells;
}

function isEscapedPipe(row, idx) {
  let back = 0;
  let i = idx - 1;
  while (i >= 0 && row.charCodeAt(i) === 92) { back++; i--; }
  return back % 2 === 1;
}

function parseDelimRow(line) {
  const t = line.trim();
  if (t.indexOf('-') === -1) return null;
  const cells = splitTableRow(t);
  const aligns = [];
  for (const rawCell of cells) {
    const cell = rawCell.trim();
    if (!/^:?-+:?$/.test(cell)) return null;
    let a = null;
    if (cell[0] === ':' && cell[cell.length - 1] === ':') a = 'center';
    else if (cell[0] === ':') a = 'left';
    else if (cell[cell.length - 1] === ':') a = 'right';
    aligns.push(a);
  }
  return aligns;
}

function tryLinkDef(lines, i) {
  // gather lines until the def parse completes; prefer the longest successful
  // form (multi-line titles), fall back to the shortest on definitive failure
  const n = lines.length;
  let best = null;
  let bestJ = i;
  const buf = [];
  let j = i;
  while (j < n && buf.length < 16) {
    const L = lines[j];
    if (isBlank(L)) break;
    let L2 = L;
    if (buf.length === 0) {
      const w = indentWidth(L);
      if (w > 0 && w < 4) L2 = stripIndent(L, w);
    }
    buf.push(L2);
    j++;
    const joined = buf.join('\n');
    const r = parseLinkDef(joined);
    if (r === INCOMPLETE_DEF) {
      if (j >= n) break;
      continue;
    }
    if (r) {
      best = r;
      bestJ = j;
      const rest = joined.slice(r.consumed);
      if (rest.trim() !== '') break; // def followed by paragraph text
      if (r.title !== null || j >= n || isBlank(lines[j])) break;
      continue; // a title may continue on the following lines
    }
    if (best) break; // use the previous complete parse
    return null;
  }
  if (!best) return null;
  return { label: best.label, dest: best.dest, title: best.title, next: bestJ, restLines: [] };
}

const INCOMPLETE_DEF = Symbol('incomplete');

function parseLinkDef(s) {
  const n = s.length;
  if (s.charCodeAt(0) !== 91) return null;
  let i = 1;
  let label = '';
  while (i < n) {
    const c = s[i];
    if (c === '\\') {
      const d = s.charCodeAt(i + 1) || 0;
      if (isPunctChar(d)) { label += c + s[i + 1]; i += 2; continue; }
      label += c;
      i++;
      continue;
    }
    if (c === '[') return null; // unescaped inner bracket: invalid label
    if (c === ']') break;
    label += c;
    i++;
  }
  if (i >= n) return INCOMPLETE_DEF; // ran out before ]
  if (s[i] !== ']') return null;
  // marked: empty or whitespace-only labels are not valid reference defs
  if (label.trim() === '') return null;
  i++;
  if (i >= n) return INCOMPLETE_DEF;
  if (s.charCodeAt(i) !== 58) return null; // ':'
  i++;
  // optional whitespace with at most one newline, then the destination
  let nls = 0;
  while (i < n && isSpaceChar(s.charCodeAt(i))) {
    if (s.charCodeAt(i) === 10 && ++nls > 1) return null;
    i++;
  }
  if (i >= n) return INCOMPLETE_DEF;
  let dest;
  if (s.charCodeAt(i) === 60) {
    let j = i + 1;
    let d = '';
    let ok = false;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === 10 || c === 60) break;
      if (c === 62) { ok = true; break; }
      if (c === 92 && isPunctChar(s.charCodeAt(j + 1) || 0)) { d += s[j] + s[j + 1]; j += 2; continue; }
      d += s[j];
      j++;
    }
    if (j >= n) return INCOMPLETE_DEF;
    if (!ok) return null;
    dest = d;
    i = j + 1;
  } else {
    let j = i;
    let d = '';
    let pd = 0;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === 92 && isPunctChar(s.charCodeAt(j + 1) || 0)) { d += s[j] + s[j + 1]; j += 2; continue; }
      if (isSpaceChar(c)) break;
      if (c === 40) pd++;
      else if (c === 41) { if (pd === 0) break; pd--; }
      d += s[j];
      j++;
    }
    if (pd > 0) return null;
    if (d.length === 0) return null;
    dest = d;
    i = j;
  }
  // optional title, possibly on following lines
  let j = i;
  while (j < n && isSpaceChar(s.charCodeAt(j))) j++;
  let title = null;
  if (j > i) {
    const q = s.charCodeAt(j);
    if (q === 34 || q === 39 || q === 40) {
      const close = q === 40 ? 41 : q;
      let k = j + 1;
      let t = '';
      let closed = false;
      while (k < n) {
        const c = s.charCodeAt(k);
        if (c === 92 && isPunctChar(s.charCodeAt(k + 1) || 0)) { t += s[k] + s[k + 1]; k += 2; continue; }
        if (q === 40 && c === 40) return null;
        if (c === close) { closed = true; break; }
        t += s[k];
        k++;
      }
      if (k >= n) return INCOMPLETE_DEF;
      if (!closed) return null;
      if (s.slice(k + 1).trim() !== '') return null;
      title = t;
    } else if (s.slice(j).trim() !== '') return null;
  } else if (s.slice(j).trim() !== '') return null;
  return { label: normLabel(label), dest, title, consumed: n };
}

function normLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase().replace(/ß/g, 'ss');
}

// Remove backslash escapes from an info string / label-ish text.
function unescapeBackslashes(s) {
  let out = '';
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s.charCodeAt(i);
    if (c === 92 && i + 1 < n && isPunctChar(s.charCodeAt(i + 1))) { out += s[i + 1]; i += 2; continue; }
    out += s[i];
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Inline tokenization
// ---------------------------------------------------------------------------
// Token shapes:
//   {t:'text',s}         literal text (backslash escapes resolved)
//   {t:'raw',s}          entity reference, emitted verbatim
//   {t:'code',s}         code span content
//   {t:'html',s}         raw inline HTML
//   {t:'br'} / {t:'soft'}
//   {t:'autolink',s}     <uri> source text
//   {t:'gfm',text,href,email}
//   {t:'delim',ch,len,orig,canOpen,canClose}
//   {t:'linkOpen',img} / {t:'close'}
//   {t:'link',children,dest,title,img}
//   {t:'em'|'strong'|'del',children}

function scanInline(src, state) {
  state = state || { inLink: false };
  const toks = [];
  const n = src.length;
  let i = 0;
  let textStart = 0;
  let openCount = 0;
  const pushText = (end) => {
    if (end > textStart) toks.push({ t: 'text', s: src.slice(textStart, end) });
  };
  while (i < n) {
    const c = src.charCodeAt(i);
    if (c === 92) {
      const d = src.charCodeAt(i + 1);
      if (d === 10) {
        pushText(i);
        toks.push({ t: 'br' });
        i += 2;
        while (i < n && (src.charCodeAt(i) === 32 || src.charCodeAt(i) === 9)) i++;
        textStart = i;
        continue;
      }
      if (isPunctChar(d)) {
        pushText(i);
        toks.push({ t: 'text', s: src[i + 1], esc: true });
        i += 2;
        textStart = i;
        continue;
      }
      i++; // lone backslash stays text
      continue;
    }
    if (c === 96) {
      let len = 0;
      let j = i;
      while (j < n && src.charCodeAt(j) === 96) { len++; j++; }
      let k = j;
      let found = -1;
      while (k < n) {
        if (src.charCodeAt(k) === 96) {
          let m = k;
          while (m < n && src.charCodeAt(m) === 96) m++;
          if (m - k === len) { found = k; break; }
          k = m;
        } else k++;
      }
      if (found >= 0) {
        pushText(i);
        let content = src.slice(j, found).replace(/\n/g, ' ');
        if (content.length >= 2 && content[0] === ' ' && content[content.length - 1] === ' ' && content.trim() !== '') {
          content = content.slice(1, -1);
        }
        toks.push({ t: 'code', s: content });
        i = found + len;
        textStart = i;
        continue;
      }
      i = j;
      continue;
    }
    if (c === 60) {
      const a = matchAutolink(src, i);
      if (a) {
        pushText(i);
        toks.push({ t: 'autolink', s: src.slice(i + 1, a.end - 1), email: a.email });
        i = a.end;
        textStart = i;
        continue;
      }
      const h = matchHtmlTag(src, i);
      if (h) {
        pushText(i);
        const tag = src.slice(i, h);
        if (!state.inLink && /^<[aA][\s>]/.test(tag)) state.inLink = true;
        else if (state.inLink && /^<\/[aA][\s>]/.test(tag)) state.inLink = false;
        toks.push({ t: 'html', s: tag });
        i = h;
        textStart = i;
        continue;
      }
      i++;
      continue;
    }
    if (c === 38) {
      let j = i + 1;
      let isNumeric = false;
      let hex = false;
      if (src.charCodeAt(j) === 35) { isNumeric = true; j++; if (src.charCodeAt(j) === 120 || src.charCodeAt(j) === 88) { hex = true; j++; } }
      let k = j;
      while (k < n) {
        const d = src.charCodeAt(k);
        if (hex ? ((d >= 48 && d <= 57) || (d >= 65 && d <= 70) || (d >= 97 && d <= 102)) : d >= 48 && d <= 57) k++;
        else if (!isNumeric && (isAlnum(d) || d === 95)) k++;
        else break;
      }
      if (k > j && k < n && src.charCodeAt(k) === 59) {
        if (isNumeric) {
          // decode numeric character reference (marked decodes at render)
          const cp = parseInt(src.slice(j, k), hex ? 16 : 10);
          if (cp > 0x10FFFF) {
            // out of range: marked leaves it as literal text
            i++; // keep the '&' in text
            continue;
          }
          pushText(i);
          toks.push({ t: 'numchar', cp: (cp === 0 || (cp >= 0xD800 && cp <= 0xDFFF)) ? 0xFFFD : cp });
        } else {
          pushText(i);
          toks.push({ t: 'raw', s: src.slice(i, k + 1) });
        }
        i = k + 1;
        textStart = i;
        continue;
      }
      i++;
      continue;
    }
    if (c === 42 || c === 95 || c === 126) {
      let j = i;
      while (j < n && src.charCodeAt(j) === c) j++;
      const before = i > 0 ? src.charCodeAt(i - 1) : 10;
      const after = j < n ? src.charCodeAt(j) : 10;
      const ch = String.fromCharCode(c);
      const leftFlank = !isUniSpace(after) && (!isUniPunct(after) || isUniSpace(before) || isUniPunct(before));
      const rightFlank = !isUniSpace(before) && (!isUniPunct(before) || isUniSpace(after) || isUniPunct(after));
      let canOpen = leftFlank;
      let canClose = rightFlank;
      if (ch === '_') {
        canOpen = leftFlank && (!rightFlank || isUniPunct(before));
        canClose = rightFlank && (!leftFlank || isUniPunct(after));
      }
      if (ch === '~') {
        if (j - i > 2) { i = j; continue; } // marked: only 1-2 tildes form delimiters
        canOpen = leftFlank;
        canClose = rightFlank;
      }
      pushText(i);
      toks.push({ t: 'delim', ch, len: j - i, orig: j - i, canOpen, canClose,
        after: String.fromCharCode(after), before: String.fromCharCode(before) });
      i = j;
      textStart = i;
      continue;
    }
    if (c === 33 && src.charCodeAt(i + 1) === 91) {
      pushText(i);
      toks.push({ t: 'linkOpen', img: true });
      openCount++;
      i += 2;
      textStart = i;
      continue;
    }
    if (c === 91) {
      pushText(i);
      toks.push({ t: 'linkOpen', img: false });
      openCount++;
      i++;
      textStart = i;
      continue;
    }
    if (c === 93) {
      pushText(i);
      toks.push({ t: 'close' });
      if (openCount > 0) openCount--;
      i++;
      textStart = i;
      continue;
    }
    if (c === 10) {
      pushText(i);
      const last = toks[toks.length - 1];
      let spaces = 0;
      if (last && last.t === 'text') {
        const mm = /[ \t]+$/.exec(last.s);
        if (mm) {
          spaces = mm[0].length;
          if (spaces >= 2) last.s = last.s.slice(0, mm.index);
        }
      }
      const hard = spaces >= 2;
      toks.push({ t: hard ? 'br' : 'soft' });
      i++;
      if (hard) while (i < n && (src.charCodeAt(i) === 32 || src.charCodeAt(i) === 9)) i++;
      textStart = i;
      continue;
    }
    if (c === 119 || c === 104 || c === 64 || isAlpha(c)) {
      const a = matchGfmLink(src, i, openCount, state);
      if (a) {
        const s2 = a.start < i ? a.start : i;
        if (s2 < textStart) {
          // the match reaches back past tokens already emitted (e.g. an '_'
          // delimiter inside the email local part): retract them
          let need = textStart - s2;
          while (need > 0 && toks.length > 0) {
            const t2 = toks[toks.length - 1];
            const len = t2.t === 'delim' ? t2.len : (t2.esc ? 2 : (t2.s !== undefined ? t2.s.length : 0));
            if (t2.t !== 'delim' && t2.t !== 'text' && t2.t !== 'gfm') break;
            if (len > need) break;
            toks.pop();
            need -= len;
          }
          textStart = s2;
        }
        pushText(s2);
        toks.push({ t: 'gfm', text: a.text, href: a.href, email: a.email });
        i = a.end;
        textStart = i;
        continue;
      }
    }
    if (isAlnum(c)) {
      // no gfm match at this word: skip the whole run (email/scheme scans
      // only ever start at a word boundary, and '@' is reached next)
      i++;
      while (i < n && isAlnum(src.charCodeAt(i))) i++;
      continue;
    }
    i++;
  }
  pushText(n);
  return toks;
}

function matchAutolink(src, i) {
  const n = src.length;
  let j = i + 1;
  let scheme = '';
  while (j < n) {
    const c = src.charCodeAt(j);
    if (isAlnum(c) || c === 43 || c === 45 || c === 46) {
      scheme += src[j];
      j++;
      if (scheme.length > 32) break;
    } else break;
  }
  if (scheme.length >= 2 && src.charCodeAt(j) === 58) {
    let k = j + 1;
    while (k < n) {
      const c = src.charCodeAt(k);
      if (c === 62) break;
      if (c <= 32 || c === 60) return null;
      k++;
    }
    if (k < n) return { end: k + 1 };
    return null;
  }
  // email autolink
  j = i + 1;
  let local = 0;
  while (j < n) {
    const c = src.charCodeAt(j);
    if (isAlnum(c) || c === 46 || c === 43 || c === 45 || c === 95) { local++; j++; }
    else break;
  }
  if (local > 0 && src.charCodeAt(j) === 64) {
    let k = j + 1;
    let dom = 0;
    let lastDotOrHyphen = false;
    while (k < n) {
      const c = src.charCodeAt(k);
      if (isAlnum(c) || c === 45) { dom++; lastDotOrHyphen = c === 45; k++; continue; }
      if (c === 46) { dom++; lastDotOrHyphen = true; k++; continue; }
      if (c === 62) break;
      return null;
    }
    if (k < n && dom > 0 && !lastDotOrHyphen && isAlnum(src.charCodeAt(k - 1))) {
      return { end: k + 1, email: true };
    }
  }
  return null;
}

function matchHtmlTag(src, i) {
  const n = src.length;
  let j = i + 1;
  if (j >= n) return 0;
  if (src.startsWith('!--', j)) {
    // marked-style: <!-->, <!---> are complete comments; otherwise up to -->
    if (src.charCodeAt(j + 3) === 62) return j + 4;
    if (src.charCodeAt(j + 3) === 45 && src.charCodeAt(j + 4) === 62) return j + 5;
    const end = src.indexOf('-->', j + 4);
    if (end === -1) return 0;
    return end + 3;
  }
  if (src[j] === '?') {
    const end = src.indexOf('?>', j + 1);
    if (end === -1) return 0;
    return end + 2;
  }
  if (src.startsWith('![CDATA[', j)) {
    const end = src.indexOf(']]>', j + 8);
    if (end === -1) return 0;
    return end + 3;
  }
  if (src.charCodeAt(j) === 33 && isAlpha(src.charCodeAt(j + 1))) {
    const end = src.indexOf('>', j);
    if (end === -1) return 0;
    return end + 1;
  }
  let close = false;
  if (src[j] === '/') { close = true; j++; }
  if (!isAlpha(src.charCodeAt(j))) return 0;
  while (j < n && (isAlnum(src.charCodeAt(j)) || src.charCodeAt(j) === 45)) j++;
  if (close) {
    while (j < n && isSpaceChar(src.charCodeAt(j))) j++;
    if (src[j] !== '>') return 0;
    return j + 1;
  }
  while (true) {
    let ws = 0;
    while (j < n && isSpaceChar(src.charCodeAt(j))) { j++; ws++; }
    if (j >= n) return 0;
    const c = src.charCodeAt(j);
    if (c === 62) return j + 1;
    if (c === 47 && src.charCodeAt(j + 1) === 62) return j + 2;
    if (ws === 0) return 0;
    if (c === 95 || isAlnum(c)) {
      while (j < n && (isAlnum(src.charCodeAt(j)) || src.charCodeAt(j) === 95 || src.charCodeAt(j) === 58 || src.charCodeAt(j) === 46 || src.charCodeAt(j) === 45)) j++;
    } else return 0;
    let k = j;
    while (k < n && isSpaceChar(src.charCodeAt(k))) k++;
    if (src.charCodeAt(k) === 61) {
      k++;
      while (k < n && isSpaceChar(src.charCodeAt(k))) k++;
      const q = src.charCodeAt(k);
      if (q === 34 || q === 39) {
        const endq = src.indexOf(String.fromCharCode(q), k + 1);
        if (endq === -1) return 0;
        j = endq + 1;
      } else {
        let e = k;
        while (e < n && !isSpaceChar(src.charCodeAt(e)) && src.charCodeAt(e) !== 62 && src.charCodeAt(e) !== 34 && src.charCodeAt(e) !== 39 && src.charCodeAt(e) !== 61 && src.charCodeAt(e) !== 60 && src.charCodeAt(e) !== 96) e++;
        if (e === k) return 0;
        j = e;
      }
    } else {
      j = j; // attribute without value
    }
  }
}

function gfmStartOk(src, i, openCount, state) {
  if (state && state.inLink) return false;
  if (i >= 2 && src.charCodeAt(i - 2) === 93 && src.charCodeAt(i - 1) === 40) {
    if (!openCount) return true;
    // '](' : the URL is an inline-link dest when the dest parses; when the
    // surrounding link will fail (nested link in label), marked linkifies it
    if (!parseInlineDest(src.slice(i - 1))) return true;
    if (nestedLinkInLabel(src, i)) return true;
    return false;
  }
  if (i === 0) return true;
  const p = src.charCodeAt(i - 1);
  return isSpaceChar(p) || p === 40 || p === 42 || p === 95 || p === 126 || p === 60;
}

// Does the bracket label ending at src[i-2..] contain another '[...]' group
// that itself has a '(' dest (i.e. a nested link/image)? Such outer links
// always fail in marked, leaving '](url)' to be linkified.
function nestedLinkInLabel(src, i) {
  // walk back from the '(' at i-1 to find the matching '['
  let depth = 0;
  let k = i - 2;
  while (k >= 0) {
    const c = src[k];
    if (c === ']') depth++;
    else if (c === '[') {
      if (depth === 0) break;
      depth--;
    } else if (c === '\\') k--;
    k--;
  }
  if (k < 0) return false;
  // inside label [k+1, i-2): find '](' occurrences at depth 1
  let d = 0;
  for (let q = k + 1; q < i - 2; q++) {
    const c = src[q];
    if (c === '[') d++;
    else if (c === ']') {
      if (d > 0) d--;
      if (d === 0 && src[q + 1] === '(') return true;
    } else if (c === '\\') q++;
  }
  return false;
}

function matchGfmLink(src, i, openCount, state) {
  const c = src.charCodeAt(i);
  const lc = c >= 65 && c <= 90 ? c + 32 : c;
  if (lc === 119) {
    if (src.startsWith('www.', i) && gfmStartOk(src, i, openCount, state)) return scanGfmUrl(src, i, 'http://', openCount);
    return null;
  }
  if (lc === 104) {
    if (/^https:\/\//i.test(src.slice(i, i + 8)) && gfmStartOk(src, i, openCount, state)) return scanGfmUrl(src, i, '', openCount);
    if (/^http:\/\//i.test(src.slice(i, i + 7)) && gfmStartOk(src, i, openCount, state)) return scanGfmUrl(src, i, '', openCount);
    return null;
  }
  if (c === 64) return matchGfmEmail(src, i, state);
  if (isAlpha(c)) return matchGfmScheme(src, i, state);
  return null;
}

// scheme:user@domain[/one-segment] extended autolink (mailto:, xmpp:, ...)
function matchGfmScheme(src, i, state) {
  if (!gfmStartOk(src, i, 0, state)) return null;
  const n = src.length;
  let k = i + 1;
  while (k < n) {
    const c = src.charCodeAt(k);
    if (isAlnum(c) || c === 43 || c === 45 || c === 46) k++;
    else break;
  }
  if (src.charCodeAt(k) !== 58) return null; // ':'
  const scheme = src.slice(i, k);
  if (scheme === 'http' || scheme === 'https') return null; // handled by url form
  // user@domain after the colon
  let j = k + 1;
  let ls = j;
  while (j < n) {
    const c = src.charCodeAt(j);
    if (isAlnum(c) || c === 46 || c === 43 || c === 45 || c === 95) j++;
    else break;
  }
  if (j === ls || src.charCodeAt(j) !== 64) return null;
  let m = j + 1;
  while (m < n) {
    const c = src.charCodeAt(m);
    if (isAlnum(c) || c === 45 || c === 46) m++;
    else break;
  }
  let end = m;
  // one optional path segment after the domain
  if (end < n && src.charCodeAt(end) === 47 && end + 1 < n) {
    const d = src.charCodeAt(end + 1);
    if (d !== 47 && d > 32 && d !== 60) {
      let q = end + 1;
      while (q < n) {
        const c = src.charCodeAt(q);
        if (c <= 32 || c === 47 || c === 60) break;
        q++;
      }
      end = q;
    }
  }
  let text = src.slice(i, end);
  // marked: an immediately following '_' or '-' invalidates the whole autolink
  if (end < n) { const nc = src.charCodeAt(end); if (nc === 95 || nc === 45) return null; }
  while (text.length > 0 && text.charCodeAt(text.length - 1) === 46) text = text.slice(0, -1);
  if (!text.length || text.length <= scheme.length + 1) return null;
  const last = text.charCodeAt(text.length - 1);
  if (last === 45 || last === 95 || last === 40) return null; // '-' '_' '('
  // strip other trailing punctuation
  while (text.length > scheme.length + 1) {
    const lc = text.charCodeAt(text.length - 1);
    if (lc === 63 || lc === 33 || lc === 44 || lc === 58 || lc === 42 || lc === 126 || lc === 39 || lc === 34 || lc === 41 || lc === 59) {
      if (lc === 41) {
        let op = 0;
        for (let q = 0; q < text.length; q++) {
          if (text.charCodeAt(q) === 40) op++;
          else if (text.charCodeAt(q) === 41) op--;
        }
        if (op < 0) { text = text.slice(0, -1); continue; }
      } else {
        text = text.slice(0, -1);
        continue;
      }
    }
    break;
  }
  if (text.length <= scheme.length + 1) return null;
  return { text, href: text, email: false, end: i + text.length };
}

function scanGfmUrl(src, i, prefix, openCount) {
  const n = src.length;
  let end = i;
  while (end < n) {
    const c = src.charCodeAt(end);
    if (c <= 32 || c === 60 || c === 62) break;
    // inside bracket context, a ']' would close the bracket: never swallow it
    if (c === 93 && openCount > 0) break;
    end++;
  }
  let text = src.slice(i, end);
  // cut at an unmatched '(' (marked: url ends before a paren group with no
  // closer, e.g. 'https://x.io)](https://y.com/heading' -> 'https://x.io)]')
  {
    let depth = 0;
    for (let q = text.length - 1; q >= 0; q--) {
      const c = text.charCodeAt(q);
      if (c === 41) depth++;
      else if (c === 40) {
        depth--;
        if (depth < 0) { text = text.slice(0, q); break; }
      }
    }
  }
  while (text.length > 0) {
    const last = text.charCodeAt(text.length - 1);
    if (last === 59) {
      const em = /&(#?[0-9a-zA-Z]+);$/.exec(text);
      if (em) { text = text.slice(0, text.length - em[0].length); continue; }
      text = text.slice(0, -1);
      continue;
    }
    if (last === 63 || last === 33 || last === 46 || last === 44 || last === 58 || last === 42 ||
        last === 95 || last === 126 || last === 39 || last === 34) {
      text = text.slice(0, -1);
      continue;
    }
    if (last === 41) {
      let op = 0;
      for (let q = 0; q < text.length; q++) {
        if (text.charCodeAt(q) === 40) op++;
        else if (text.charCodeAt(q) === 41) op--;
      }
      if (op < 0) { text = text.slice(0, -1); continue; }
    }
    if (last === 59) {
      const em = /&(#?[0-9a-zA-Z]+);$/.exec(text);
      if (em) { text = text.slice(0, text.length - em[0].length); continue; }
    }
    break;
  }
  if (text.length <= (prefix ? 4 : 0)) return null;
  return { text, href: prefix + text, email: false, end: i + text.length };
}

function matchGfmEmail(src, i, state) {
  const n = src.length;
  if (state && state.inLink) return null;
  let j = i - 1;
  while (j >= 0) {
    const c = src.charCodeAt(j);
    if (isAlnum(c) || c === 46 || c === 43 || c === 45 || c === 95) j--;
    else break;
  }
  if (j >= 0) {
    const p = src.charCodeAt(j);
    if (isAlnum(p) || p === 46 || p === 43 || p === 45 || p === 95 || p === 64 || p === 92) return null;
  }
  const local = src.slice(j + 1, i);
  if (!local) return null;
  let k = i + 1;
  while (k < n) {
    const c = src.charCodeAt(k);
    if (isAlnum(c) || c === 45 || c === 46) k++;
    else break;
  }
  let domain = src.slice(i + 1, k);
  while (domain.length && domain.endsWith('.')) {
    domain = domain.slice(0, -1);
    k--;
  }
  if (!domain || domain.indexOf('.') === -1) return null;
  const dl = domain.charCodeAt(domain.length - 1);
  if (!isAlnum(dl)) return null; // trailing '-' invalidates
  // marked: an immediately following '-' invalidates; a following '_' only
  // when it sits at end of line (an emphasis closer like '_com_ write' keeps
  // the email valid)
  const nx = k < n ? src.charCodeAt(k) : 10;
  if (nx === 45) return null;
  if (nx === 95 && (k + 1 >= n || src.charCodeAt(k + 1) === 10)) return null;
  const text = local + '@' + domain;
  return { text, href: 'mailto:' + text, email: true, start: j + 1, end: j + 1 + text.length };
}

// ---------------------------------------------------------------------------
// Link resolution
// ---------------------------------------------------------------------------

// Returns {dest,title,consumed} with consumed = tokens used after closeIdx, or null.
function tryResolveLink(toks, openIdx, closeIdx, refs) {
  const n = toks.length;
  let i = closeIdx + 1;
  // gather source text of following t/raw/delim/soft tokens
  let src = '';
  let lastIdx = closeIdx;
  for (let k = i; k < n; k++) {
    const t = toks[k];
    if (t.t === 'text' || t.t === 'raw' || t.t === 'html') src += t.esc ? '\\' + t.s : t.s;
    else if (t.t === 'soft' || t.t === 'br') src += '\n';
    else if (t.t === 'delim') src += t.ch.repeat(t.len);
    else if (t.t === 'gfm') src += t.text;
    else break;
    lastIdx = k;
    if (src.length > 4096) break;
  }
  if (src.length > 0 && src[0] === '(') {
    const r = parseInlineDest(src);
    if (r) {
      // map consumed chars back to token index (split delim tokens if needed)
      const used = r.consumed;
      let k = i;
      let acc = 0;
      while (k <= lastIdx && acc < used) {
        const t = toks[k];
        const tl = t.t === 'soft' || t.t === 'br' ? 1 : (t.t === 'delim' ? t.len : (t.t === 'gfm' ? t.text.length : (t.esc ? 2 : (t.s ? t.s.length : 0))));
        if (acc + tl > used && t.t === 'delim') {
          const take = used - acc;
          const rest = t.len - take;
          t.len = take;
          const after = { t: 'delim', ch: t.ch, len: rest, orig: t.orig, canOpen: t.canOpen, canClose: t.canClose };
          toks.splice(k + 1, 0, after);
          return { dest: r.dest, title: r.title, consumedTok: k + 1 };
        }
        if (acc + tl > used) {
          const take = used - acc;
          if (t.t === 'gfm') {
            const pre = t.href.length - t.text.length;
            const head = { t: 'gfm', text: t.text.slice(0, take), href: t.href.slice(0, pre + take), email: t.email };
            t.text = t.text.slice(take);
            t.href = t.href.slice(pre + take);
            toks.splice(k + 1, 0, t);
            toks[k] = head;
          } else {
            const rest = t.s.slice(take);
            t.s = t.s.slice(0, take);
            if (t.t === 'html') t.t = 'text';
            toks.splice(k + 1, 0, { t: 'text', s: rest });
          }
          return { dest: r.dest, title: r.title, consumedTok: k + 1 };
        }
        acc += tl;
        k++;
      }
      return { dest: r.dest, title: r.title, consumedTok: k };
    }
  }
  // reference forms: [text] [label] / [text][] / [text]
  if (i < n && toks[i].t === 'linkOpen' && !toks[i].img) {
    // find matching close for this inner bracket
    let depth = 0;
    let k = i + 1;
    let label = '';
    let closedAt = -1;
    while (k < n) {
      const t = toks[k];
      if (t.t === 'linkOpen') { depth++; label += '['; }
      else if (t.t === 'close') {
        if (depth === 0) { closedAt = k; break; }
        depth--;
        label += ']';
      }
      else if (t.t === 'text' || t.t === 'raw') label += t.esc ? '\\' + t.s : t.s;
      else if (t.t === 'code') label += '`' + t.s + '`';
      else if (t.t === 'soft' || t.t === 'br') label += '\n';
      else if (t.t === 'delim') label += t.ch.repeat(t.len);
      else break;
      k++;
    }
    if (closedAt >= 0) {
      let key;
      if (label.trim() === '') {
        key = normLabel(innerTextOf(toks, openIdx + 1, closeIdx));
      } else {
        key = normLabel(label);
      }
      const ref = key ? refs[key] : null;
      if (ref) return { dest: ref.dest, title: ref.title, consumedTok: closedAt + 1 };
      return null;
    }
    return null;
  }
  // shortcut reference [text]
  const inner = normLabel(innerTextOf(toks, openIdx + 1, closeIdx));
  const ref = inner ? refs[inner] : null;
  if (ref) return { dest: ref.dest, title: ref.title, consumedTok: i };
  return null;
}

function innerTextOf(toks, from, to) {
  let s = '';
  for (let k = from; k < to; k++) {
    const t = toks[k];
    if (t.t === 'text') s += t.esc ? '\\' + t.s : t.s;
    else if (t.t === 'raw') s += t.s;
    else if (t.t === 'code') s += '`' + t.s + '`';
    else if (t.t === 'soft' || t.t === 'br') s += '\n';
    else if (t.t === 'delim') s += t.ch.repeat(t.len);
    else if (t.t === 'linkOpen') s += t.img ? '![' : '[';
    else if (t.t === 'close') s += ']';
    else if (t.t === 'img' || t.t === 'link') s += innerTextOf(t.children, 0, t.children.length);
  }
  return s;
}

function parseInlineDest(src) {
  let i = 1;
  const n = src.length;
  while (i < n && isSpaceChar(src.charCodeAt(i))) i++;
  let dest;
  if (src.charCodeAt(i) === 60) {
    let j = i + 1;
    let d = '';
    let ok = false;
    while (j < n) {
      const c = src.charCodeAt(j);
      if (c === 10 || c === 60) break;
      if (c === 62) { ok = true; break; }
      if (c === 92 && isPunctChar(src.charCodeAt(j + 1) || 0)) { d += src[j] + src[j + 1]; j += 2; continue; }
      d += src[j];
      j++;
    }
    if (!ok) return null;
    dest = d;
    i = j + 1;
  } else {
    let j = i;
    let d = '';
    let pd = 0;
    while (j < n) {
      const c = src.charCodeAt(j);
      if (c === 92 && isPunctChar(src.charCodeAt(j + 1) || 0)) { d += src[j] + src[j + 1]; j += 2; continue; }
      if (isSpaceChar(c)) break;
      if (c === 40) pd++;
      else if (c === 41) { if (pd === 0) break; pd--; }
      d += src[j];
      j++;
    }
    if (pd > 0) return null; // unmatched '('
    if (d.length === 0 && src.charCodeAt(j) !== 41) return null;
    dest = d;
    i = j;
  }
  let j = i;
  while (j < n && isSpaceChar(src.charCodeAt(j))) j++;
  let title = null;
  if (j < n && src.charCodeAt(j) !== 41) {
    const q = src.charCodeAt(j);
    if (q !== 34 && q !== 39 && q !== 40) return null;
    const close = q === 40 ? 41 : q;
    let k = j + 1;
    let t = '';
    let closed = false;
    while (k < n) {
      const c = src.charCodeAt(k);
      if (c === 92 && isPunctChar(src.charCodeAt(k + 1) || 0)) { t += src[k] + src[k + 1]; k += 2; continue; }
      if (q === 40 && c === 40) return null;
      if (c === close) { closed = true; break; }
      t += src[k];
      k++;
    }
    if (!closed) return null;
    title = t;
    j = k + 1;
  }
  while (j < n && isSpaceChar(src.charCodeAt(j))) j++;
  if (src.charCodeAt(j) !== 41) return null;
  return { dest, title, consumed: j + 1 };
}

// Walk tokens, resolving brackets into link/image nodes left-to-right.
function resolveLinks(toks, refs) {
  const out = [];
  const stack = []; // {pos, img, hasLink, failed}
  let i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (t.t === 'linkOpen') {
      stack.push({ pos: out.length, idx: i, img: !!t.img, hasLink: false, failed: false });
      out.push({ t: '__open', img: !!t.img });
      i++;
      continue;
    }
    if (t.t === 'close') {
      let s = stack.length - 1;
      while (s >= 0 && stack[s].failed) s--;
      if (s < 0) {
        out.push({ t: 'text', s: ']' });
        i++;
        continue;
      }
      const open = stack[s];
      // links cannot contain links (marked: images always resolve)
      const res = (!open.img && open.hasLink) ? null : tryResolveLink(toks, open.idx, i, refs);
      if (!res) {
        open.failed = true;
        out.push({ t: 'text', s: ']' });
        i++;
        continue;
      }
      // children: tokens after the opener placeholder; splice also removes it
      const region = out.splice(open.pos, out.length - open.pos);
      const children = [];
      for (let k = 1; k < region.length; k++) {
        const tk = region[k];
        children.push(tk.t === '__open' ? { t: 'text', s: tk.img ? '![' : '[' }
          : tk.t === 'gfm' ? { t: 'text', s: tk.text } : tk);
      }
      const kids2 = processEmphasis(children);
      const dest = unescapeBackslashes(res.dest);
      const title = res.title != null ? unescapeBackslashes(res.title) : null;
      out.push(open.img ? { t: 'img', children: kids2, dest, title } : { t: 'link', children: kids2, dest, title });
      stack.length = s;
      if (!open.img) for (let q = 0; q < s; q++) stack[q].hasLink = true;
      i = res.consumedTok !== undefined ? res.consumedTok : i + 1;
      continue;
    }
    out.push(t);
    i++;
  }
  // any unresolved open brackets become literal text
  for (const e of stack) {
    if (out[e.pos] && out[e.pos].t === '__open') out[e.pos] = { t: 'text', s: e.img ? '![' : '[' };
  }
  return processEmphasis(out);
}

// ---------------------------------------------------------------------------
// Emphasis: CommonMark delimiter algorithm
// ---------------------------------------------------------------------------

// Does this region contain a formed em node (nested anywhere)?
function regionHasEm(toks) {
  for (const x of toks) {
    if (x.t === 'em') return true;
    if (x.children && regionHasEm(x.children)) return true;
  }
  return false;
}

// Does this region contain a formed '**' strong node whose closer was
// immediately followed by an alphanumeric char in the source? Used for the
// marked single-'*' em quirk (doc-03/07/11: those ems never form).
function regionHasBadStrong(toks) {
  for (const x of toks) {
    if (x.hasDouble && x.afterAlnum) return true;
    if (x.children && regionHasBadStrong(x.children)) return true;
  }
  return false;
}

function processEmphasis(toks) {
  const openers = []; // token refs
  let i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (t.t === 'delim') {
      if (t.canOpen) openers.push(t);
      if (t.canClose) {
        let oi = -1;
        for (let o = openers.length - 1; o >= 0; o--) {
          const od = openers[o];
          if (od === t) continue; // a closer only matches openers strictly before it
          if (od.active === false) continue;
          if (od.ch !== t.ch) continue;
          // rule of three
          if ((od.canClose || t.canOpen) && ((od.orig + t.orig) % 3 === 0) && !(od.orig % 3 === 0 && t.orig % 3 === 0)) continue;
          // marked: a single-'*' closer never borrows from a '**' opener when
          // the span already holds a formed em (doc-01); cm-442 has no inner em
          if (t.orig === 1 && od.orig >= 2 && od.ch === '*' && od.orig !== t.orig) {
            const oj = toks.indexOf(od);
            let hasEm = false;
            if (oj >= 0) {
              for (let q = oj + 1; q < i && !hasEm; q++) {
                const x = toks[q];
                if (x.t === 'em') hasEm = true;
                else if (x.children) { for (const y of x.children) { if (y.t === 'em') { hasEm = true; break; } } }
              }
            }
            if (hasEm) continue;
          }
          oi = o;
          break;
        }
        if (oi < 0) {
          if (!t.canOpen) t.canClose = false; // dead: emit literally later
          // marked: an unmatched leftover closer of a partially consumed run
          // ends up inside the emphasis it belonged to, but only when the span
          // holds a formed em (doc-11: two* inside; cm-443: foo* outside)
          if (t.hostNode) {
            const hi = toks.indexOf(t);
            if (hi >= 0 && regionHasEm(t.hostNode.children)) {
              toks.splice(hi, 1);
              t.hostNode.children.push(t);
              i = hi - 1 < 0 ? 0 : hi - 1;
              continue;
            }
          }
          i++;
          continue;
        }
        const od = openers[oi];
        t.hostNode = null;
        const use = t.ch === '~' ? Math.min(od.len, t.len) : (od.len >= 2 && t.len >= 2 ? 2 : 1);
        const tag = t.ch === '~' ? 'del' : (use === 2 ? 'strong' : 'em');
        const j = toks.indexOf(od);
        if (j < 0) { i++; continue; } // should not happen
        const children = toks.slice(j + 1, i);
        // marked quirk: an em delimited by single '*' never forms when its
        // content contains a '**' run (matched or not); both stars stay literal
        if (tag === 'em' && t.ch === '*' && regionHasBadStrong(children)) {
          t.canClose = false;
          // drop the opener too: marked leaves both stars literal
          od.active = false;
          const odIdx = openers.indexOf(od);
          if (odIdx >= 0) openers.splice(odIdx, 1);
          i++;
          continue;
        }
        // deactivate delimiters trapped between opener and closer
        for (let q = j + 1; q < i; q++) {
          const d = toks[q];
          if (d.t === 'delim') { d.canOpen = false; d.canClose = false; }
          const oiIdx = openers.indexOf(d);
          if (oiIdx >= 0) openers.splice(oiIdx, 1);
        }
        const node = { t: tag, children };
        if (tag === 'strong' && t.ch === '*') {
          node.hasDouble = true;
          // char immediately following the consumed closer run in the source;
          // rejection only applies to "pure opener" strongs (preceded by ws)
          node.afterAlnum = t.len <= use && t.after && isAlnum(t.after.charCodeAt(0)) &&
            isUniSpace(od.before.charCodeAt(0));
        }
        const newRegion = [];
        if (od.len > use) { od.len -= use; newRegion.push(od); }
        else { od.active = false; openers.splice(oi, 1); }
        newRegion.push(node);
        if (t.len > use) { t.len -= use; t.hostNode = node; newRegion.push(t); }
        else { t.active = false; const tIdx = openers.indexOf(t); if (tIdx >= 0) openers.splice(tIdx, 1); }
        toks.splice(j, i - j + 1, ...newRegion);
        if (t.len > use && t.active !== false) {
          // leftover closer retries at its new position
          i = toks.indexOf(t) - 1;
          if (i < -1) i = -1;
          continue;
        } else {
          i = j + (od.len > use && od.active !== false ? 1 : 0) + 1;
          continue;
        }
      }
    }
    i++;
  }
  return toks;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderTokens(toks) {
  let out = '';
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    switch (t.t) {
      case 'text': out += escapeText(t.s); break;
      case 'raw': out += t.s; break;
      case 'numchar': out += escapeText(String.fromCodePoint(t.cp)); break;
      case 'code': out += '<code>' + escapeAll(t.s) + '</code>'; break;
      case 'html': out += t.s; break;
      case 'br': out += '<br>'; break;
      case 'soft': out += '\n'; break;
      case 'autolink': {
        const s = t.s;
        if (t.email) out += '<a href="mailto:' + cleanUrl(s) + '">' + escapeText(s) + '</a>';
        else out += '<a href="' + cleanUrl(s) + '">' + escapeAll(s) + '</a>';
        break;
      }
      case 'gfm': out += '<a href="' + cleanUrl(t.href) + '">' + escapeText(t.text) + '</a>'; break;
      case 'link':
        out += '<a href="' + cleanUrl(t.dest) + '"' + (t.title != null ? ' title="' + escapeText(t.title) + '"' : '') + '>';
        out += renderTokens(t.children);
        out += '</a>';
        break;
      case 'img': {
        out += '<img src="' + cleanUrl(t.dest) + '" alt="' + escapeText(plainText(t.children)) + '"' +
          (t.title != null ? ' title="' + escapeText(t.title) + '"' : '') + '>';
        break;
      }
      case 'delim': out += t.ch.repeat(t.len); break;
      case 'em': out += '<em>' + renderTokens(t.children) + '</em>'; break;
      case 'strong': out += '<strong>' + renderTokens(t.children) + '</strong>'; break;
      case 'del': out += '<del>' + renderTokens(t.children) + '</del>'; break;
    }
  }
  return out;
}

function renderInline(src, refs, state) {
  if (!state) state = { inLink: false };
  return renderTokens(resolveLinks(scanInline(src, state), refs));
}

// Plain-text projection used for image alt text (marked behavior: markup
// disappears, links/images contribute their inner text, delimiters vanish).
function plainText(toks) {
  let s = '';
  for (const t of toks) {
    if (t.t === 'text' || t.t === 'raw') s += t.s;
    else if (t.t === 'soft' || t.t === 'br') s += '\n';
    else if (t.t === 'code') s += t.s;
    else if (t.t === 'numchar') s += String.fromCodePoint(t.cp);
    else if (t.t === 'autolink' || t.t === 'gfm') s += t.text !== undefined ? t.text : t.s;
    else if (t.t === 'delim') { /* dropped */ }
    else if (t.t === 'link' || t.t === 'img' || t.t === 'em' || t.t === 'strong' || t.t === 'del') {
      s += plainText(t.children);
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Block rendering
// ---------------------------------------------------------------------------

function renderBlocks(tokens, top, defs, state) {
  if (!state) state = { inLink: false };
  let out = '';
  for (const t of tokens) {
    switch (t.type) {
      case 'heading':
        out += '<h' + t.level + '>' + renderInline(t.text, defs, state) + '</h' + t.level + '>\n';
        break;
      case 'paragraph': {
        const body = renderInline(t.lines.join('\n'), defs, state);
        out += top ? '<p>' + body + '</p>\n' : body;
        break;
      }
      case 'code':
        out += '<pre><code>' + escapeAll(t.text) + '</code></pre>\n';
        break;
      case 'fence': {
        const cls = t.lang ? ' class="language-' + escapeText(unescapeBackslashes(t.lang)) + '"' : '';
        out += '<pre><code' + cls + '>' + escapeAll(t.text) + '</code></pre>\n';
        break;
      }
      case 'hr':
        out += '<hr>\n';
        break;
      case 'html':
        out += t.text;
        break;
      case 'blockquote': {
        out += '<blockquote>\n' + renderBlocks(t.tokens, true, defs, state) + '</blockquote>\n';
        break;
      }
      case 'list':
        out += renderList(t, defs, state);
        break;
      case 'table':
        out += renderTable(t, defs, state);
        break;
    }
  }
  return out;
}

function renderList(t, defs, state) {
  let out = t.ordered
    ? (t.start !== 1 ? '<ol start="' + t.start + '">\n' : '<ol>\n')
    : '<ul>\n';
  for (const item of t.items) {
    let body = renderBlocks(item.tokens, t.loose, defs, state);
    const cb = item.task >= 0 ? '<input ' + (item.task === 1 ? 'checked="" ' : '') + 'disabled="" type="checkbox">' : '';
    if (item.task >= 0 && body !== '') body = ' ' + body;
    // loose items: checkbox goes inside the first paragraph
    if (item.task >= 0 && t.loose && body.startsWith(' <p>')) {
      body = '<p>' + cb + ' ' + body.slice(4);
    } else {
      body = cb + body;
    }
    out += '<li>' + body + '</li>\n';
  }
  out += t.ordered ? '</ol>\n' : '</ul>\n';
  return out;
}

function renderTable(t, defs, state) {
  let out = '<table>\n<thead>\n<tr>\n';
  for (let c = 0; c < t.header.length; c++) {
    out += cellTag('th', t.align[c], renderInline(t.header[c].trim(), defs, state));
  }
  out += '</tr>\n</thead>\n';
  if (t.rows.length) {
    out += '<tbody>';
    for (const row of t.rows) {
      out += '<tr>\n';
      for (let c = 0; c < t.header.length; c++) {
        const cellText = row[c] !== undefined ? row[c] : '';
        out += cellTag('td', t.align[c], renderInline(cellText.trim(), defs, state));
      }
      out += '</tr>\n';
    }
    out += '</tbody>';
  }
  out += '</table>\n';
  return out;
}

function cellTag(tag, align, content) {
  const a = align ? ' align="' + align + '"' : '';
  return '<' + tag + a + '>' + content + '</' + tag + '>\n';
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export function parse(src) {
  const s = normalizeLineEnds(String(src));
  const defs = Object.create(null);
  const lines = splitLines(s);
  const tokens = parseBlocks(lines, defs, s.endsWith('\n'));
  return renderBlocks(tokens, true, defs, { inLink: false });
}

export default { parse };
