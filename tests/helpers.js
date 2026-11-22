// Wspólne funkcje pomocnicze dla testów.
const path = require('path');
const { pathToFileURL } = require('url');

const APP_URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

// Otwiera aplikację bez zależności sieciowych: czcionki są blokowane,
// a JSZip (do .docx) podawany z node_modules zamiast z CDN.
async function openApp(page) {
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('**/jszip.min.js', r => r.fulfill({ path: require.resolve('jszip/dist/jszip.min.js'), contentType: 'application/javascript' }));
  await page.goto(APP_URL);
  await page.waitForFunction(() => !!window.__przewodnik);
}

// Wczytuje profil z przykładowymi (albo podanymi) odpowiedziami i zwraca wynik silnika reguł.
async function scenario(page, pid, answers) {
  await page.evaluate(([p, a]) => window.__przewodnik.load(p, a), [pid, answers === undefined ? undefined : answers]);
  return page.evaluate(() => window.__przewodnik.compute());
}

// Data przesunięta o n dni od dziś w formacie RRRR-MM-DD (jak w aplikacji).
function isoDays(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Logowanie przez interfejs: profil → hasło → pulpit.
async function loginUI(page, pid) {
  await page.click(`[data-pid="${pid}"]`);
  await page.click('#lf button[type=submit]');
  await page.waitForSelector('#go');
}

module.exports = { APP_URL, openApp, scenario, isoDays, loginUI };
