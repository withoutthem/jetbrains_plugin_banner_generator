import assert from 'node:assert/strict';
import { test } from 'node:test';
import { render, renderMultiline, shadow, threeD } from '../src/renderer';
import { fontStack } from '../src/fonts';
import { detectCommentFormat, stripCommentPrefix, wrapComment } from '../src/comments';

test('shadow draws box outline on right and bottom', () => {
  const mask = [
    [true, true, false],
    [true, true, false],
    [false, false, false],
  ];
  assert.deepEqual(shadow(mask), ['██╗', '██║', '╚═╝']);
});

test('shadow draws inner corner where blocks meet', () => {
  const mask = [
    [true, true, false],
    [true, false, false],
    [false, false, false],
  ];
  assert.equal(shadow(mask)[1], '█╔╝');
});

test('3d extrudes two columns per row', () => {
  const lines = threeD([[true, false], [false, false]], 1);
  assert.equal(lines[0].trimEnd(), '█');
  assert.equal(lines[1].trimEnd(), ' ▒▒');
});

test('renders korean with the default font stack', () => {
  const lines = render('가나', { font: '', rows: 10, style: 'shadow', depth: 2 });
  assert.ok(lines.length >= 8, `rows: ${lines.length}`);
  assert.ok(lines.some((l) => l.includes('█')));
  assert.notEqual(lines[lines.length - 1], '');
});

test('renders latin', () => {
  const lines = render('Aa', { font: '', rows: 8, style: 'shade', depth: 2 });
  assert.ok(lines.length >= 6);
  assert.ok(lines.some((l) => l.includes('@')));
});

test('a latin-only font still draws korean through the fallback stack', () => {
  const withStack = render('가', { font: 'Arial', rows: 10, style: 'shade', depth: 2 }).join('\n');
  // 네모(tofu)는 속이 빈 테두리라 채워진 셀(@)이 거의 없다
  const solid = (withStack.match(/[%@]/g) ?? []).length;
  assert.ok(solid > 10, `solid cells: ${solid}`);
});

test('blank text renders nothing', () => {
  assert.deepEqual(render('   ', { font: '', rows: 10, style: 'shadow', depth: 2 }), []);
});

test('multiline stacks banners with one blank separator', () => {
  const lines = renderMultiline('가\n\n나', { font: '', rows: 6, style: 'shadow', depth: 2 });
  const blanks = lines.filter((l) => l === '');
  assert.equal(blanks.length, 1);
  const i = lines.indexOf('');
  assert.ok(i > 0 && i < lines.length - 1);
});

test('font stack puts the chosen font first and skips unknown ones', () => {
  assert.ok(!fontStack('NoSuchFontXYZ').includes('NoSuchFontXYZ'));
  assert.ok(fontStack('Arial').startsWith('"Arial"'));
  assert.equal(fontStack('Arial').split('"Arial"').length, 2, 'no duplicate entry');
});

test('comment format by language id', () => {
  assert.equal(detectCommentFormat('typescript').linePrefix, '// ');
  assert.equal(detectCommentFormat('python').linePrefix, '# ');
  assert.equal(detectCommentFormat('sql').linePrefix, '-- ');
  assert.deepEqual(detectCommentFormat('html'), { linePrefix: '', blockOpen: '<!--', blockClose: '-->' });
  assert.equal(detectCommentFormat('plaintext').linePrefix, '');
});

test('wrap adds indent, prefix and block markers', () => {
  const html = detectCommentFormat('html');
  assert.deepEqual(wrapComment(['ab', ''], '', '  ', html), ['  <!--', '  ab', '', '  -->']);
  const ts = detectCommentFormat('typescript');
  assert.deepEqual(wrapComment(['ab'], '// ', '\t', ts), ['\t// ab']);
});

test('strips comment marker from selected lines', () => {
  assert.equal(stripCommentPrefix('  // 결제\n//서비스', '// '), '결제\n서비스');
  assert.equal(stripCommentPrefix('plain', ''), 'plain');
});
