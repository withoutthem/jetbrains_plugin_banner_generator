// 플랫폼별 VSIX 를 한 번에 만든다. 네이티브 캔버스가 플랫폼마다 달라서 VSIX 도 플랫폼마다 따로다.
// 번들은 한 번만 빌드하고, 플랫폼마다 임시 폴더에 그 플랫폼용 배포 의존성만 설치해서 포장한다.
// 사용: node scripts/package-all.js [target ...]   (인자가 없으면 전부)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGETS = {
  'win32-x64': ['--os=win32', '--cpu=x64'],
  'win32-arm64': ['--os=win32', '--cpu=arm64'],
  'linux-x64': ['--os=linux', '--cpu=x64', '--libc=glibc'],
  'linux-arm64': ['--os=linux', '--cpu=arm64', '--libc=glibc'],
  'linux-armhf': ['--os=linux', '--cpu=arm', '--libc=glibc'],
  'alpine-x64': ['--os=linux', '--cpu=x64', '--libc=musl'],
  'alpine-arm64': ['--os=linux', '--cpu=arm64', '--libc=musl'],
  'darwin-x64': ['--os=darwin', '--cpu=x64'],
  'darwin-arm64': ['--os=darwin', '--cpu=arm64'],
};

const COPY = ['package.json', 'package-lock.json', '.vscodeignore', 'README.md', 'CHANGELOG.md', 'LICENSE', 'icon.png', 'dist'];

const root = path.resolve(__dirname, '..');
const vsce = path.join(root, 'node_modules', '@vscode', 'vsce', 'vsce');
const outDir = path.join(root, 'vsix');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TARGETS);
for (const t of targets) {
  if (!TARGETS[t]) {
    throw new Error(`unknown target ${t}. valid: ${Object.keys(TARGETS).join(', ')}`);
  }
}

run(npm, ['run', 'build'], root);
fs.mkdirSync(outDir, { recursive: true });

for (const target of targets) {
  console.log(`\n=== ${target}`);
  const stage = path.join(root, 'build', 'stage', target);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  for (const name of COPY) {
    fs.cpSync(path.join(root, name), path.join(stage, name), { recursive: true });
  }

  // 번들은 이미 있으니 포장 전에 다시 빌드하지 않게 한다 (esbuild 는 대상 플랫폼용이면 여기서 못 돈다)
  const pkgPath = path.join(stage, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts['vscode:prepublish'];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  run(npm, ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', ...TARGETS[target]], stage);
  const out = path.join(outDir, `${pkg.name}-${target}-${pkg.version}.vsix`);
  run(process.execPath, [vsce, 'package', '--target', target, '--out', out], stage);
}

fs.rmSync(path.join(root, 'build'), { recursive: true, force: true });
console.log(`\nVSIX files are in ${outDir}`);
