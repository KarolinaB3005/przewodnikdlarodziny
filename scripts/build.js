// Skleja aplikację w jeden plik dist/index.html (CSS, JS i logo wpisane do środka).
// Przydaje się do wysłania jednym plikiem albo wgrania jako artefakt na claude.ai.
// Uruchomienie: npm run build
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let html = read('index.html');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets/logo.png')).toString('base64');

html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}</style>`);
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>\n?/g)];
if (!scripts.length) throw new Error('Nie znaleziono skryptów w index.html');
const js = scripts.map(m => `/* ${m[1]} */\n${read(m[1])}`).join('\n');
html = html.replace(/<!-- Skrypty[^\n]*-->\n/, '');
scripts.forEach((m, i) => { html = html.replace(m[0], i === 0 ? () => `<script>\n${js}</script>\n` : ''); });
html = html.split('assets/logo.png').join(logo);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB, ${scripts.length} skryptów`);
