import { GlobalFonts } from '@napi-rs/canvas';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// 캔버스는 시스템 폰트 폴백을 하지 않는다. 대신 font 에 여러 패밀리를 나열하면 글자마다 앞에서부터 찾는다.
// 그래서 문자권별로 설치된 폰트 하나씩을 뒤에 붙여 둔다. 목록은 macOS, Windows, Linux 기본 폰트 순.
const FALLBACKS = [
  ['Helvetica Neue', 'Arial', 'Segoe UI', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', 'Ubuntu'],
  ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', 'Noto Sans KR', 'NanumGothic', 'UnDotum'],
  ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'Noto Sans CJK JP', 'Noto Sans JP', 'IPAGothic'],
  ['PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', 'WenQuanYi Zen Hei', 'SimHei', 'Heiti SC'],
];

/** 라이브러리가 자동으로 읽지 않는 폰트 폴더를 추가로 읽는다. 활성화 시 한 번. */
export function loadExtraFonts(): void {
  for (const dir of extraFontDirs()) {
    if (fs.existsSync(dir)) {
      GlobalFonts.loadFontsFromDir(dir);
    }
  }
}

// macOS ~/Library/Fonts 와 Windows 사용자 폰트 폴더는 라이브러리가 이미 읽는다
function extraFontDirs(): string[] {
  switch (process.platform) {
    case 'darwin':
      return ['/Library/Fonts'];
    case 'win32':
      return [];
    default:
      return ['/usr/local/share/fonts', path.join(os.homedir(), '.local', 'share', 'fonts')];
  }
}

export function installedFamilies(): string[] {
  return GlobalFonts.families.map((f) => f.family).sort((a, b) => a.localeCompare(b));
}

/** ctx.font 에 넣을 패밀리 목록. 고른 폰트가 먼저, 없는 글자는 뒤의 문자권별 폰트가 그린다. */
export function fontStack(preferred: string): string {
  const families: string[] = [];
  if (preferred && GlobalFonts.has(preferred)) {
    families.push(preferred);
  }
  for (const group of FALLBACKS) {
    const found = group.find((f) => GlobalFonts.has(f));
    if (found && !families.includes(found)) {
      families.push(found);
    }
  }
  if (families.length === 0) {
    return 'sans-serif';
  }
  return families.map((f) => `"${f.replace(/"/g, '')}"`).join(', ');
}
