const esbuild = require('esbuild');
// const { svgrPlugin } = require('esbuild-plugin-svgr');

esbuild.build({
  entryPoints: ['./src/webview.tsx'],
  bundle: true,
  outfile: './dist/webview.js',
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: ['chrome58', 'firefox57', 'safari11'],
  // plugins: [svgrPlugin()], // SVG未使用なら不要
  loader: { '.svg': 'file', '.css': 'file' },
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  logLevel: 'info',
}).catch(() => process.exit(1));
