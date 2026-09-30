import { createCanvas } from '@napi-rs/canvas';
import { fontStack } from './fonts';

export type BannerStyle = 'shadow' | '3d' | 'shade';

export interface BannerSettings {
  /** 폰트 패밀리. 빈 문자열이면 설치된 기본 폰트. 이 폰트에 없는 글자는 문자권별 폰트로 채운다. */
  font: string;
  rows: number;
  style: BannerStyle;
  depth: number;
}

const SUPERSAMPLE = 8;       // 출력 1행당 원본 px
const CELL_ASPECT = 2;       // 에디터 글자 셀의 세로/가로 비
const MASK_THRESHOLD = 96;   // 이 밝기 이상이면 채워진 셀로 본다
const SHADE_RAMP = ' .:-=+*#%@';

/** 줄마다 배너를 만들고 사이에 빈 줄을 하나 둔다. */
export function renderMultiline(text: string, settings: BannerSettings): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    if (out.length > 0) {
      out.push('');
    }
    out.push(...render(line.trim(), settings));
  }
  return out;
}

export function render(text: string, settings: BannerSettings): string[] {
  if (!text.trim() || settings.rows < 2) {
    return [];
  }
  const cells = rasterize(text, fontStack(settings.font), settings.rows);
  if (cells.length === 0) {
    return [];
  }
  let lines: string[];
  switch (settings.style) {
    case 'shade':
      lines = shade(cells);
      break;
    case '3d':
      lines = threeD(toMask(cells), settings.depth);
      break;
    default:
      lines = shadow(toMask(cells));
  }
  return trim(lines);
}

function rasterize(text: string, families: string, rows: number): number[][] {
  const size = rows * SUPERSAMPLE;
  const spec = `bold ${size}px ${families}`;

  const measure = createCanvas(1, 1).getContext('2d');
  measure.font = spec;
  // 폴백 글리프가 섞이면 측정값이 짧게 나올 수 있어 글자 수 기준 폭도 같이 본다
  const advance = Math.max(measure.measureText(text).width, [...text].length * size);
  const width = Math.ceil(advance) + size * 2;
  const height = size * 3;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.font = spec;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, size, size * 2);

  const rgba = ctx.getImageData(0, 0, width, height).data;
  const gray = (x: number, y: number) => rgba[(y * width + x) * 4];

  // 글자가 있는 영역만 남긴다
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (gray(x, y) > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    return [];
  }
  const inkW = maxX - minX + 1;
  const inkH = maxY - minY + 1;
  const cols = Math.max(1, Math.round((inkW / inkH) * rows * CELL_ASPECT));

  // 셀마다 픽셀 평균(박스 필터)
  const cells: number[][] = [];
  for (let cy = 0; cy < rows; cy++) {
    const y0 = minY + Math.floor((cy * inkH) / rows);
    const y1 = Math.max(y0 + 1, minY + Math.floor(((cy + 1) * inkH) / rows));
    const row: number[] = [];
    for (let cx = 0; cx < cols; cx++) {
      const x0 = minX + Math.floor((cx * inkW) / cols);
      const x1 = Math.max(x0 + 1, minX + Math.floor(((cx + 1) * inkW) / cols));
      let sum = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          sum += gray(x, y);
        }
      }
      row.push(Math.floor(sum / ((y1 - y0) * (x1 - x0))));
    }
    cells.push(row);
  }
  return cells;
}

/** 오른쪽·아래로 한 칸 넓게 잡는다. 그림자와 압출이 그 자리에 들어간다. */
export function toMask(cells: number[][]): boolean[][] {
  const rows = cells.length;
  const cols = cells[0].length;
  const mask: boolean[][] = [];
  for (let y = 0; y < rows; y++) {
    mask.push([...cells[y].map((v) => v >= MASK_THRESHOLD), false]);
  }
  mask.push(new Array<boolean>(cols + 1).fill(false));
  return mask;
}

export function shade(cells: number[][]): string[] {
  const last = SHADE_RAMP.length - 1;
  return cells.map((row) => row.map((v) => SHADE_RAMP[Math.round((v / 255) * last)]).join(''));
}

export function shadow(mask: boolean[][]): string[] {
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && mask[y][x];
  // 빈 셀의 왼쪽(L), 위(U), 왼쪽 위(UL) 가 채워졌는지로 그림자 문자를 정한다
  const shadowChar = (x: number, y: number): string => {
    const left = filled(x - 1, y);
    const up = filled(x, y - 1);
    const upLeft = filled(x - 1, y - 1);
    if (left && up) return '╔';
    if (left) return upLeft ? '║' : '╗';
    if (up) return upLeft ? '═' : '╚';
    return upLeft ? '╝' : ' ';
  };
  return mask.map((row, y) => row.map((on, x) => (on ? '█' : shadowChar(x, y))).join(''));
}

/** 한 단계당 아래 1행, 오른쪽 2열. 셀이 세로로 길어서 이게 45도로 보인다. */
export function threeD(mask: boolean[][], depth: number): string[] {
  const rows = mask.length;
  const cols = mask[0].length;
  const grid: string[][] = [];
  for (let y = 0; y < rows + depth; y++) {
    grid.push(new Array<string>(cols + 2 * depth).fill(' '));
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!mask[y][x]) continue;
      for (let i = 1; i <= depth; i++) {
        grid[y + i][x + 2 * i - 1] = '▒';
        grid[y + i][x + 2 * i] = '▒';
      }
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (mask[y][x]) grid[y][x] = '█';
    }
  }
  return grid.map((row) => row.join(''));
}

function trim(lines: string[]): string[] {
  const out = lines.map((l) => l.replace(/\s+$/, ''));
  while (out.length > 0 && out[out.length - 1] === '') {
    out.pop();
  }
  return out;
}
