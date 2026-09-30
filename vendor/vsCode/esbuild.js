const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

esbuild
  .context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    // vscode 는 런타임이 주고, 네이티브 캔버스는 node_modules 그대로 실려야 한다
    external: ['vscode', '@napi-rs/canvas'],
    sourcemap: !process.argv.includes('--production'),
    minify: process.argv.includes('--production'),
  })
  .then(async (ctx) => {
    if (watch) {
      await ctx.watch();
    } else {
      await ctx.rebuild();
      await ctx.dispose();
    }
  })
  .catch(() => process.exit(1));
