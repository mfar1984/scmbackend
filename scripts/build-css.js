/**
 * ATLINE Admin — CSS Build Script
 * Merges all component and page CSS into globals.css
 * 
 * Usage:
 *   node scripts/build-css.js
 *   npm run css:build
 * 
 * Watch mode (auto-rebuild on change):
 *   npm run css:watch
 */

const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

const CSS_FILES = [
  // Components — edit these, change reflects everywhere
  'styles/components/button.css',
  'styles/components/form.css',
  'styles/components/table.css',
  'styles/components/badge.css',
  'styles/components/modal.css',
  'styles/components/tabs.css',
  'styles/components/card.css',
  'styles/components/toggle.css',

  // Pages — page-specific overrides
  'styles/pages/login.css',
  'styles/pages/dashboard.css',
  'styles/pages/roles.css',
  'styles/pages/users.css',
  'styles/pages/integration.css',
  'styles/pages/logs.css',
  'styles/pages/career.css',
  'styles/pages/payroll.css',
  'styles/pages/tender.css',
  'styles/pages/webcms.css',
];

const LAYOUT_FILE = 'styles/layout.css'; // sidebar, topbar, admin layout

function buildCss() {
  let output = '';

  // @import MUST be first — CSS spec requirement
  output += "@import 'bootstrap/dist/css/bootstrap.min.css';\n";
  output += "@import 'bootstrap-icons/font/bootstrap-icons.css';\n\n";

  // Merge each component/page file
  for (const file of CSS_FILES) {
    const fullPath = path.join(BASE, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`  [WARN] Missing: ${file}`);
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    output += content + '\n\n';
  }

  // Append layout CSS (variables, reset, sidebar, topbar)
  const layoutPath = path.join(BASE, LAYOUT_FILE);
  if (fs.existsSync(layoutPath)) {
    output += fs.readFileSync(layoutPath, 'utf8');
  }

  // Write without BOM
  const outPath = path.join(BASE, 'styles/globals.css');
  fs.writeFileSync(outPath, output, { encoding: 'utf8' });

  const lines = output.split('\n').length;
  console.log(`[CSS Build] globals.css rebuilt — ${lines} lines`);
}

// Watch mode
if (process.argv.includes('--watch')) {
  const chokidar = require('chokidar');
  const watchPaths = [
    path.join(BASE, 'styles/components'),
    path.join(BASE, 'styles/pages'),
    path.join(BASE, 'styles/layout.css'),
  ];

  console.log('[CSS Watch] Watching for changes...');
  buildCss();

  chokidar.watch(watchPaths, { ignoreInitial: true }).on('all', (event, filePath) => {
    console.log(`[CSS Watch] ${event}: ${path.relative(BASE, filePath)}`);
    buildCss();
  });
} else {
  buildCss();
}
