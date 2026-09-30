/** 언어별 주석 기호. 줄 주석이 있으면 줄마다 붙이고, 블록 주석만 있는 언어는 위아래를 감싼다. */
export interface CommentFormat {
  linePrefix: string;
  blockOpen?: string;
  blockClose?: string;
}

const LINE_MARKERS: Record<string, string[]> = {
  '//': ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'java', 'c', 'cpp', 'csharp', 'go', 'rust',
    'kotlin', 'swift', 'scala', 'dart', 'php', 'objective-c', 'objective-cpp', 'groovy', 'fsharp', 'scss', 'less',
    'jsonc', 'json5', 'zig', 'solidity', 'proto3', 'glsl', 'hlsl', 'd'],
  '#': ['python', 'ruby', 'shellscript', 'yaml', 'dockerfile', 'makefile', 'perl', 'r', 'toml', 'powershell',
    'coffeescript', 'elixir', 'julia', 'nim', 'crystal', 'graphql', 'properties', 'ignore', 'gitignore', 'cmake', 'tcl'],
  '--': ['sql', 'lua', 'haskell', 'ada', 'elm', 'plsql', 'mysql', 'postgres'],
  ';': ['clojure', 'lisp', 'scheme', 'racket', 'ini', 'asm'],
  '%': ['erlang', 'latex', 'tex', 'matlab', 'prolog'],
  "'": ['vb'],
  'REM': ['bat'],
  '!': ['fortran', 'fortran-modern'],
};

const BLOCK_MARKERS: Record<string, [string, string]> = {
  html: ['<!--', '-->'],
  xml: ['<!--', '-->'],
  vue: ['<!--', '-->'],
  svelte: ['<!--', '-->'],
  markdown: ['<!--', '-->'],
  css: ['/*', '*/'],
};

const NONE: CommentFormat = { linePrefix: '' };

export function detectCommentFormat(languageId: string): CommentFormat {
  for (const [marker, ids] of Object.entries(LINE_MARKERS)) {
    if (ids.includes(languageId)) {
      return { linePrefix: marker + ' ' };
    }
  }
  const block = BLOCK_MARKERS[languageId];
  if (block) {
    return { linePrefix: '', blockOpen: block[0], blockClose: block[1] };
  }
  if (languageId === 'plaintext') {
    return NONE;
  }
  return { linePrefix: '// ' };
}

export function wrapComment(art: string[], prefix: string, indent: string, format: CommentFormat): string[] {
  const out: string[] = [];
  if (format.blockOpen) {
    out.push(indent + format.blockOpen);
  }
  for (const line of art) {
    out.push((indent + prefix + line).replace(/\s+$/, ''));
  }
  if (format.blockClose) {
    out.push(indent + format.blockClose);
  }
  return out;
}

/** 선택한 줄이 이미 주석이면 주석 기호는 글자에서 뺀다. */
export function stripCommentPrefix(text: string, linePrefix: string): string {
  const marker = linePrefix.trim();
  return text
    .split('\n')
    .map((line) => {
      let s = line.trim();
      if (marker && s.startsWith(marker)) {
        s = s.slice(marker.length).trim();
      }
      return s;
    })
    .join('\n');
}
