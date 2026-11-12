/* Model 100 / 102 / 200 BASIC tokenizer.
   Token bytes are the ROM keyword table (same on the 100, 102, and 200).
   NEC PC-8201 tokens are a different map and are not handled here.
   Line links are absolute placeholders. A real machine rewrites them on LOAD.
   100/102 programs start at 0x8001. The 200 starts at 0xA001. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.M100Basic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TOKEN_LIST = [
    [0x80, 'END'], [0x81, 'FOR'], [0x82, 'NEXT'], [0x83, 'DATA'],
    [0x84, 'INPUT'], [0x85, 'DIM'], [0x86, 'READ'], [0x87, 'LET'],
    [0x88, 'GOTO'], [0x89, 'RUN'], [0x8A, 'IF'], [0x8B, 'RESTORE'],
    [0x8C, 'GOSUB'], [0x8D, 'RETURN'], [0x8E, 'REM'], [0x8F, 'STOP'],
    [0x90, 'WIDTH'], [0x91, 'ELSE'], [0x92, 'LINE'], [0x93, 'EDIT'],
    [0x94, 'ERROR'], [0x95, 'RESUME'], [0x96, 'OUT'], [0x97, 'ON'],
    [0x98, 'DSKO$'], [0x99, 'OPEN'], [0x9A, 'CLOSE'], [0x9B, 'LOAD'],
    [0x9C, 'MERGE'], [0x9D, 'FILES'], [0x9E, 'SAVE'], [0x9F, 'LFILES'],
    [0xA0, 'LPRINT'], [0xA1, 'DEF'], [0xA2, 'POKE'], [0xA3, 'PRINT'],
    [0xA4, 'CONT'], [0xA5, 'LIST'], [0xA6, 'LLIST'], [0xA7, 'CLEAR'],
    [0xA8, 'CLOAD'], [0xA9, 'CSAVE'], [0xAA, 'TIME$'], [0xAB, 'DATE$'],
    [0xAC, 'DAY$'], [0xAD, 'COM'], [0xAE, 'MDM'], [0xAF, 'KEY'],
    [0xB0, 'CLS'], [0xB1, 'BEEP'], [0xB2, 'SOUND'], [0xB3, 'LCOPY'],
    [0xB4, 'PSET'], [0xB5, 'PRESET'], [0xB6, 'MOTOR'], [0xB7, 'MAX'],
    [0xB8, 'POWER'], [0xB9, 'CALL'], [0xBA, 'MENU'], [0xBB, 'IPL'],
    [0xBC, 'NAME'], [0xBD, 'KILL'], [0xBE, 'SCREEN'], [0xBF, 'NEW'],
    [0xC0, 'TAB('], [0xC1, 'TO'], [0xC2, 'USING'], [0xC3, 'VARPTR'],
    [0xC4, 'ERL'], [0xC5, 'ERR'], [0xC6, 'STRING$'], [0xC7, 'INSTR'],
    [0xC8, 'DSKI$'], [0xC9, 'INKEY$'], [0xCA, 'CSRLIN'], [0xCB, 'OFF'],
    [0xCC, 'HIMEM'], [0xCD, 'THEN'], [0xCE, 'NOT'], [0xCF, 'STEP'],
    [0xD0, '+'], [0xD1, '-'], [0xD2, '*'], [0xD3, '/'],
    [0xD4, '^'], [0xD5, 'AND'], [0xD6, 'OR'], [0xD7, 'XOR'],
    [0xD8, 'EQV'], [0xD9, 'IMP'], [0xDA, 'MOD'], [0xDB, '\\'],
    [0xDC, '>'], [0xDD, '='], [0xDE, '<'],
    [0xDF, 'SGN'], [0xE0, 'INT'], [0xE1, 'ABS'], [0xE2, 'FRE'],
    [0xE3, 'INP'], [0xE4, 'LPOS'], [0xE5, 'POS'], [0xE6, 'SQR'],
    [0xE7, 'RND'], [0xE8, 'LOG'], [0xE9, 'EXP'], [0xEA, 'COS'],
    [0xEB, 'SIN'], [0xEC, 'TAN'], [0xED, 'ATN'], [0xEE, 'PEEK'],
    [0xEF, 'EOF'], [0xF0, 'LOC'], [0xF1, 'LOF'], [0xF2, 'CINT'],
    [0xF3, 'CSNG'], [0xF4, 'CDBL'], [0xF5, 'FIX'], [0xF6, 'LEN'],
    [0xF7, 'STR$'], [0xF8, 'VAL'], [0xF9, 'ASC'], [0xFA, 'CHR$'],
    [0xFB, 'SPACE$'], [0xFC, 'LEFT$'], [0xFD, 'RIGHT$'], [0xFE, 'MID$']
  ];

  const NAME_OF = [];
  TOKEN_LIST.forEach(function (pair) { NAME_OF[pair[0]] = pair[1]; });
  NAME_OF[0xFF] = "'";

  const MATCHERS = TOKEN_LIST.map(function (pair) {
    return { token: pair[0], text: pair[1], upper: pair[1].toUpperCase() };
  }).sort(function (a, b) {
    return b.upper.length - a.upper.length || a.token - b.token;
  });

  const BASE = { '100': 0x8001, '102': 0x8001, '200': 0xA001 };

  function machineBase(machine) {
    const key = String(machine || '100');
    if (!Object.prototype.hasOwnProperty.call(BASE, key)) {
      throw new Error('Choose Model 100/102 or Model 200.');
    }
    return BASE[key];
  }

  function machineLabel(machine) {
    return String(machine) === '200' ? 'Model 200' : 'Model 100/102';
  }

  function pushByte(out, value) {
    out.push(value & 0xFF);
  }

  function matchAt(src, i) {
    const rest = src.slice(i);
    const go = /^GO[ \t]*TO/i.exec(rest);
    if (go) return { token: 0x88, length: go[0].length };
    const upper = rest.toUpperCase();
    for (let n = 0; n < MATCHERS.length; n++) {
      const m = MATCHERS[n];
      if (upper.startsWith(m.upper)) return { token: m.token, length: m.upper.length };
    }
    return null;
  }

  function tokenizePayload(src) {
    const out = [];
    let i = 0;
    let mode = 'code';
    while (i < src.length) {
      const c = src.charAt(i);
      const code = src.charCodeAt(i);
      if (code > 255) throw new Error('Only ASCII BASIC can be tokenized.');
      if (mode === 'remark') {
        pushByte(out, code);
        i++;
        continue;
      }
      if (mode === 'string' || mode === 'datastring') {
        pushByte(out, code);
        i++;
        if (c === '"') mode = mode === 'string' ? 'code' : 'data';
        continue;
      }
      if (mode === 'data') {
        if (c === '"') {
          pushByte(out, 0x22);
          i++;
          mode = 'datastring';
          continue;
        }
        if (c === ':') {
          pushByte(out, 0x3A);
          i++;
          mode = 'code';
          continue;
        }
        pushByte(out, code);
        i++;
        continue;
      }
      if (c === '"') {
        pushByte(out, 0x22);
        i++;
        mode = 'string';
        continue;
      }
      if (c === "'") {
        pushByte(out, 0x3A);
        pushByte(out, 0x8E);
        pushByte(out, 0xFF);
        i++;
        mode = 'remark';
        continue;
      }
      if (c === '?') {
        pushByte(out, 0xA3);
        i++;
        continue;
      }
      const found = matchAt(src, i);
      if (found) {
        if (found.token === 0x91) {
          pushByte(out, 0x3A);
          pushByte(out, 0x91);
        } else {
          pushByte(out, found.token);
          if (found.token === 0x8E) mode = 'remark';
          else if (found.token === 0x83) mode = 'data';
        }
        i += found.length;
        continue;
      }
      pushByte(out, code >= 0x61 && code <= 0x7A ? code - 0x20 : code);
      i++;
    }
    return out;
  }

  function splitLines(bytes) {
    let end = bytes.length;
    while (end > 0 && (bytes[end - 1] === 0x1A || bytes[end - 1] === 0x00)) end--;
    let start = 0;
    if (end >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) start = 3;
    let text = '';
    for (let i = start; i < end; i++) text += String.fromCharCode(bytes[i]);
    return text.split(/\r\n|\n|\r/);
  }

  function tokenize(bytes, machine) {
    const base = machineBase(machine);
    const rawLines = splitLines(bytes);
    const lines = [];
    const warnings = [];
    rawLines.forEach(function (line, idx) {
      if (line === '') return;
      const parsed = /^[ \t]*(\d+)(.*)$/.exec(line);
      if (!parsed) {
        throw new Error('Line ' + (idx + 1) + ' does not start with a BASIC line number: ' + line.slice(0, 40));
      }
      const num = parseInt(parsed[1], 10);
      if (num > 65529) throw new Error('Line number ' + num + ' is above 65529.');
      let rest = parsed[2];
      if (rest.charAt(0) === ' ') rest = rest.slice(1);
      const payload = tokenizePayload(rest);
      if (payload.length + 1 > 256) {
        throw new Error('Line ' + num + ' is longer than 255 tokenized bytes.');
      }
      lines.push({ num: num, payload: payload });
    });
    if (!lines.length) throw new Error('No BASIC lines found.');
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].num <= lines[i - 1].num) {
        warnings.push('Line numbers are not strictly increasing. Virtual T may refuse this file. A Model 100 still runs lines in file order.');
        break;
      }
    }
    const out = [];
    let addr = base;
    lines.forEach(function (line) {
      const next = addr + 4 + line.payload.length + 1;
      pushByte(out, next);
      pushByte(out, next >> 8);
      pushByte(out, line.num);
      pushByte(out, line.num >> 8);
      line.payload.forEach(function (b) { out.push(b); });
      out.push(0x00);
      addr = next;
    });
    out.push(0x00, 0x00);
    if (String(machine) === '200' && out.length >= 0x6000) {
      warnings.push('This .BA is large for a 24K Model 200.');
    } else if (out.length >= 0x7000) {
      warnings.push('This .BA is large for a 32K Model 100.');
    }
    return { bytes: new Uint8Array(out), lineCount: lines.length, base: base, warnings: warnings };
  }

  function detokenizePayload(payload) {
    let text = '';
    let j = 0;
    while (j < payload.length) {
      const b = payload[j];
      if (b === 0x3A && payload[j + 1] === 0x8E && payload[j + 2] === 0xFF) {
        text += "'";
        for (let k = j + 3; k < payload.length; k++) text += String.fromCharCode(payload[k]);
        break;
      }
      if (b === 0x8E) {
        text += 'REM';
        for (let k = j + 1; k < payload.length; k++) text += String.fromCharCode(payload[k]);
        break;
      }
      if (b === 0x3A && payload[j + 1] === 0x91) {
        text += 'ELSE';
        j += 2;
        continue;
      }
      if (b >= 0x80) {
        text += NAME_OF[b] || ('{' + b.toString(16) + '}');
        j++;
        continue;
      }
      text += String.fromCharCode(b);
      j++;
    }
    return text;
  }

  function detokenize(bytes) {
    if (!bytes || bytes.length < 6) throw new Error('File is too small to be a tokenized .BA.');
    const lines = [];
    let i = 0;
    while (i + 1 < bytes.length) {
      const link = bytes[i] | (bytes[i + 1] << 8);
      if (link === 0) break;
      if (i + 4 > bytes.length) throw new Error('Truncated .BA line header.');
      const num = bytes[i + 2] | (bytes[i + 3] << 8);
      i += 4;
      let end = i;
      while (end < bytes.length && bytes[end] !== 0) end++;
      if (end >= bytes.length) throw new Error('Tokenized line ' + num + ' has no ending zero.');
      lines.push(String(num) + detokenizePayload(bytes.subarray(i, end)));
      i = end + 1;
    }
    if (!lines.length) throw new Error('No tokenized BASIC lines found.');
    const text = lines.join('\r\n') + '\r\n';
    const out = new Uint8Array(text.length);
    for (let n = 0; n < text.length; n++) out[n] = text.charCodeAt(n);
    return { bytes: out, lineCount: lines.length, text: text, warnings: [] };
  }

  function isText(bytes) {
    const n = Math.min(bytes.length, 1000);
    if (!n) return false;
    for (let i = 0; i < n; i++) {
      const b = bytes[i];
      if (b > 127) return false;
      if (b < 32 && b !== 9 && b !== 10 && b !== 13 && b !== 26) return false;
    }
    return true;
  }

  function replaceExt(name, ext) {
    const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
    const base = slash >= 0 ? name.slice(slash + 1) : name;
    const dot = base.lastIndexOf('.');
    const stem = dot > 0 ? base.slice(0, dot) : base;
    return stem + ext;
  }

  function convert(bytes, filename, machine) {
    const name = filename || 'PROGRAM.DO';
    if (isText(bytes)) {
      const tokenized = tokenize(bytes, machine);
      return {
        kind: 'ba',
        filename: replaceExt(name, '.BA'),
        bytes: tokenized.bytes,
        lineCount: tokenized.lineCount,
        base: tokenized.base,
        warnings: tokenized.warnings,
        summary: 'Tokenized ' + tokenized.lineCount + ' lines for ' + machineLabel(machine) +
          '. Line addresses start at ' + tokenized.base.toString(16).toUpperCase() + '.'
      };
    }
    const text = detokenize(bytes);
    return {
      kind: 'do',
      filename: replaceExt(name, '.txt'),
      bytes: text.bytes,
      lineCount: text.lineCount,
      base: null,
      warnings: text.warnings,
      summary: 'Detokenized ' + text.lineCount + ' lines to a .txt file.'
    };
  }

  return {
    tokenize: tokenize,
    detokenize: detokenize,
    convert: convert,
    isText: isText,
    machineBase: machineBase
  };
});
