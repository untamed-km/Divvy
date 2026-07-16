#!/usr/bin/env node
// DistroFi ship check — run `node check.js` before every commit/push.
// Catches: file truncation, JS syntax errors, merge markers, banned patterns.
const fs = require('fs'), cp = require('child_process'), os = require('os'), path = require('path');
let fail = 0;
const bad = (m) => { console.error('  ✗ ' + m); fail = 1; };
const ok = (m) => console.log('  ✓ ' + m);

console.log('DistroFi ship check');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// 1. Truncation guard (the sandbox write bug bites here first)
if (html.trimEnd().endsWith('</html>')) ok('index.html ends with </html>');
else bad('index.html is TRUNCATED — does not end with </html>. Restore before committing!');

// 2. Main script block parses
const lines = html.split('\n');
const s = lines.findIndex((l) => l.trim() === '<script>');
let e = -1;
for (let i = lines.length - 1; i >= 0; i--) { if (lines[i].trim() === '</script>') { e = i; break; } }
if (s === -1 || e === -1 || e <= s) bad('could not locate the main <script> block');
else {
  const tmp = path.join(os.tmpdir(), 'distrofi-check.js');
  fs.writeFileSync(tmp, lines.slice(s + 1, e).join('\n'));
  const r = cp.spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  if (r.status === 0) ok('main script parses (' + (e - s - 1) + ' lines)');
  else bad('SYNTAX ERROR in main script:\n' + r.stderr);
}

// 3. Banned patterns
[
  ['<<<<<<<', 'merge conflict marker'],
  ['toISOString().slice(0,10)', 'UTC date stamp — use localDateStr()'],
  ["toISOString().split('T')[0]", 'UTC date stamp — use localDateStr()'],
  ['FINNHUB', 'removed Finnhub reference'],
].forEach(([pat, why]) => {
  if (html.includes(pat)) bad('banned pattern "' + pat + '" (' + why + ')');
  else ok('no "' + pat + '"');
});

// 4. sw.js parses
const r2 = cp.spawnSync(process.execPath, ['--check', path.join(__dirname, 'sw.js')], { encoding: 'utf8' });
if (r2.status === 0) ok('sw.js parses');
else bad('sw.js syntax error:\n' + r2.stderr);

// 5. vercel.json valid
try { JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8')); ok('vercel.json valid'); }
catch (err) { bad('vercel.json invalid: ' + err.message); }

console.log(fail ? '\nSHIP CHECK FAILED — do not push.' : '\nAll clear. Ship it.');
process.exit(fail);
