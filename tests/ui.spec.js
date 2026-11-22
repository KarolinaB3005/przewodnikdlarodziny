// Testy interfejsu: przejście przez aplikację tak, jak robi to użytkownik.
const { test, expect } = require('@playwright/test');
const JSZip = require('jszip');
const fs = require('fs');
const { openApp, loginUI, isoDays } = require('./helpers');

test.beforeEach(async ({ page }) => { await openApp(page); });

test('logowanie: profil → hasło → pulpit → formularz', async ({ page }) => {
  await expect(page.locator('[data-pid]')).toHaveCount(10);
  await page.click('[data-pid="marta"]');
  await expect(page.locator('#pw')).toHaveValue(/.+/);
  await expect(page.locator('#pw')).toHaveAttribute('readonly', '');
  await page.click('#lf button[type=submit]');
  await expect(page.locator('h2.hi')).toContainText('Dzień dobry, Marta');
  await page.click('#go');
  await expect(page.locator('#msgs')).toContainText('Kim jesteś dla dziecka?');
});

test('rozmowa przyciskami aż do gotowego wniosku', async ({ page }) => {
  await loginUI(page, 'tomasz');
  await page.click('#go');
  const click = v => page.click(`#inp [data-v="${v}"]`);
  await click('tata'); await click('1'); await click('po');
  await page.fill('#in', isoDays(-15)); await page.click('#ok');
  await click('1'); await click('nie');
  await page.click('#skip'); // imię dziecka: pomiń
  await click('nie'); await click('tak'); await click('tak');
  await page.click('#ok'); // 9 tygodni rodzicielskiego (domyślnie)
  await click('nie'); await click('1');
  await expect(page.locator('#msgs')).toContainText('Gotowe. Twój wniosek: Wniosek o urlop ojcowski i rodzicielski');
});

test('odpowiedzi pisane z klawiatury są rozumiane', async ({ page }) => {
  await loginUI(page, 'marta');
  await page.click('#go');
  const say = async t => { await page.fill('#ft', t); await page.click('#fts'); };
  await say('jestem w ciąży');
  await expect(page.locator('#msgs')).toContainText('Rozumiem: Mama');
  await say('tak, zgadza się');
  await say('czekamy na dziecko');
  await expect(page.locator('#msgs')).toContainText('Rozumiem: Jestem w ciąży');
  await say('jestem w 30 tygodniu');
  await expect(page.locator('#msgs')).toContainText('Jaki jest przewidywany termin porodu?');
  await expect(page.locator('#msgs')).toContainText('Czy do porodu planujesz zmianę pracy');
});

test('niezgodne dane z ZUS: dopytanie i wypełnienie z opisu', async ({ page }) => {
  await loginUI(page, 'marta');
  await page.click('#go');
  await page.click('#inp [data-v="mama"]');
  await page.click('#inp [data-v="0"]');
  await expect(page.locator('#msgs')).toContainText('Co się zmieniło albo nie zgadza?');
  await page.fill('#ft', 'od 1 września pracuję na zleceniu w innej firmie, zarabiam 5 tys zł');
  await page.click('#fts');
  await expect(page.locator('#msgs')).toContainText('Rozumiem, zmieniło się');
  await expect(page.locator('#msgs')).toContainText('z Twojego opisu');
  await expect(page.locator('#msgs')).toContainText('Jak nazywa się zleceniodawca?');
});

test('termin porodu w przeszłości jest odrzucany', async ({ page }) => {
  await loginUI(page, 'marta');
  await page.click('#go');
  await page.click('#inp [data-v="mama"]'); await page.click('#inp [data-v="1"]'); await page.click('#inp [data-v="ciaza"]');
  await expect(page.locator('#in')).toHaveAttribute('min', isoDays(0));
  await page.fill('#in', isoDays(-3)); await page.click('#ok');
  await expect(page.locator('#er')).toContainText('nie może być w przeszłości');
});

test('„Co to?” wyjaśnia pojęcie i nie zapisuje odpowiedzi', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('marta', { rola: 'mama', zus_ok: true, etap: 'ciaza', termin: (() => { const d = new Date(); d.setDate(d.getDate() + 120); return d.toISOString().slice(0, 10); })(), zmiana: 'nie', l4: 'nie', start_przed: 'nie', liczba: '1' }, 'form', 'chat'));
  await expect(page.locator('#msgs')).toContainText('Za życiem');
  await page.fill('#ft', 'Co to?'); await page.click('#fts');
  await expect(page.locator('#msgs')).toContainText('wystawia lekarz specjalista');
  expect(await page.evaluate(() => window.__przewodnik.next())).toBe('zazycie');
});

test('kliknięcie odpowiedzi pozwala ją zmienić', async ({ page }) => {
  await loginUI(page, 'marta');
  await page.click('#go');
  await page.click('#inp [data-v="mama"]');
  await page.click('[data-ed="rola"]');
  expect(await page.evaluate(() => window.__przewodnik.next())).toBe('rola');
});

test('wysłanie wniosku (symulacja) trafia do „Moje wnioski”', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('joanna'));
  await page.click('[data-t="wniosek"]');
  await page.click('#wsend');
  await expect(page.locator('.acts')).toContainText('Wysłano');
  await page.click('#nav [data-nv="wnioski"]');
  await expect(page.locator('#app')).toContainText('SYM-');
});

test('pobranie wniosku jako .docx i .html', async ({ page }, info) => {
  await page.evaluate(() => window.__przewodnik.load('joanna'));
  // zapamiętujemy nazwę pliku nadaną przez aplikację (atrybut download)
  await page.evaluate(() => { const o = HTMLAnchorElement.prototype.click; window.__names = []; HTMLAnchorElement.prototype.click = function () { window.__names.push(this.download); return o.call(this); }; });
  await page.click('[data-t="wniosek"]');
  const [d1] = await Promise.all([page.waitForEvent('download'), page.click('[data-dl="docx"]')]);
  const p1 = info.outputPath('wniosek.docx'); await d1.saveAs(p1);
  const zip = await JSZip.loadAsync(fs.readFileSync(p1));
  const xml = await zip.file('word/document.xml').async('string');
  expect(xml).toContain('WNIOSEK O URLOP MACIERZYŃSKI I RODZICIELSKI');
  expect(xml).toContain('Joanna Wójcik');
  const [d2] = await Promise.all([page.waitForEvent('download'), page.click('[data-dl="html"]')]);
  const p2 = info.outputPath('wniosek.html'); await d2.saveAs(p2);
  expect(fs.readFileSync(p2, 'utf8')).toContain('<!DOCTYPE html>');
  const names = await page.evaluate(() => window.__names);
  expect(names[0]).toMatch(/^Wniosek_o_urlop_macierzyński_i_rodzicielski\.docx$/);
  expect(names[1]).toMatch(/\.html$/);
});

test('wszystkie widoki z menu się otwierają', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('joanna', undefined, 'home'));
  const views = { asystent: 'Asystent AI', sprawa: 'Sprawa z PDF', wnioski: 'Moje wnioski', kalendarz: 'Kalendarz', dokumenty: 'Dokumenty', ezus: 'eZUS', pomoc: 'Pomoc' };
  for (const [v, title] of Object.entries(views)) {
    await page.click(`#nav [data-nv="${v}"]`);
    await expect(page.locator('h2.hi')).toHaveText(title);
  }
});

test('kalendarz: dodanie wizyty u lekarza', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('marta', undefined, 'kalendarz'));
  await page.fill('#evd', isoDays(14));
  await page.fill('#evt', 'Wizyta u lekarza');
  await page.click('#evf button[type=submit]');
  await expect(page.locator('.tl')).toContainText('Wizyta u lekarza');
});

test('asystent w trybie bez AI odpowiada na proste pytania', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('joanna', undefined, 'asystent'));
  await page.fill('#agin', 'Ile dostanę miesięcznie?');
  await page.click('#agsend');
  await expect(page.locator('#agm')).toContainText('zł/mies.');
});

test('organizacje wsparcia pokazują się przy wcześniakach', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('joanna'));
  await expect(page.locator('#pbody')).toContainText('Fundacja Wcześniak Rodzice-Rodzicom');
});

test('brak poziomego przewijania strony', async ({ page }) => {
  for (const v of ['profiles', 'home', 'form']) {
    if (v !== 'profiles') await page.evaluate(view => window.__przewodnik.load('marta', undefined, view), v);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('eZUS: dane konta, e-ZLA i wiadomość do ZUS z odpowiedzią', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('ola', undefined, 'home'));
  await page.click('#nav [data-nv="ezus"]');
  await expect(page.locator('h2.hi')).toHaveText('eZUS');
  await expect(page.locator('.ezbody')).toContainText('Zielińska Projekt');
  await page.click('[data-ezt="skladki"]');
  await expect(page.locator('.ezbody')).toContainText('nieopłacone');
  await page.click('[data-ezt="ezla"]');
  await expect(page.locator('.ezbody')).toContainText('ZY 4471825');
  await expect(page.locator('.ezbody')).toContainText('B: niezdolność do pracy w okresie ciąży');
  await page.click('[data-ezt="wiad"]');
  await page.selectOption('#ezt', 'Składki i zadłużenie');
  await page.fill('#ezq', 'Czy mam zaległości?');
  await page.click('#ezf button[type=submit]');
  await expect(page.locator('.ezbody')).toContainText('stan zadłużenia wynosi');
});

test('odpis aktu urodzenia: wybór rodzaju, osobno dla każdego dziecka', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('joanna', undefined, 'akt'));
  await expect(page.locator('[data-akk]')).toHaveCount(2);
  await page.check('input[name=akr][value=zupelny]');
  await page.check('input[name=aks][value=usc]');
  await page.click('#akf button[type=submit]');
  await expect(page.locator('.popup')).toContainText('Wniosek przyjęty do realizacji');
  await expect(page.locator('.popup')).toContainText('RSC/');
  await page.click('#ppok');
  await expect(page.locator('h2.hi')).toHaveText('Moje wnioski');
  await expect(page.locator('#app')).toContainText('Odpis zupełny, 1 egz. × 2 dzieci (Ala, Ola)');
  await page.click('#akref'); await page.click('#akref');
  await expect(page.locator('#app')).toContainText('gotowy do odbioru w USC');
});

test('linki do uprawnień dopasowane do sytuacji', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('tomasz'));
  expect(await page.evaluate(() => window.__przewodnik.linkTags())).toEqual(['akt', 'ezla', 'ezus', 'mac', 'pip', 'rodz']);
  await page.evaluate(() => window.__przewodnik.load('ola'));
  const t = await page.evaluate(() => window.__przewodnik.linkTags());
  expect(t).not.toContain('pip');
  expect(t).toContain('ezla');
});

test('„Pokaż oba warianty”: tabela porównania i wybór wariantu', async ({ page }) => {
  const d = new Date(); d.setDate(d.getDate() - 5); const born = d.toISOString().slice(0, 10);
  await page.evaluate(b => window.__przewodnik.load('marta', { rola: 'mama', zus_ok: true, etap: 'po', data_porodu: b, liczba: '1', hosp: 'nie', imie: 'Jan', zazycie: 'nie', drugi: 'nie' }, 'form', 'chat'), born);
  expect(await page.evaluate(() => window.__przewodnik.next())).toBe('w815');
  await page.fill('#ft', 'pokaż dwie opcje'); await page.click('#fts');
  await expect.poll(() => page.evaluate(() => window.__przewodnik.S.A.w815)).toBe('niewiem');
  await page.evaluate(() => { window.__przewodnik.S.m = 'panel'; window.__przewodnik.S.tab = 'wynik'; window.__przewodnik.set('laczenie', 'nie'); });
  await expect(page.locator('#pbody')).toContainText('Porównanie wariantów wypłaty');
  await expect(page.locator('[data-w815]')).toHaveCount(2);
  await page.click('[data-w815="815"]');
  expect(await page.evaluate(() => window.__przewodnik.S.A.w815)).toBe('815');
  const R = await page.evaluate(() => window.__przewodnik.compute());
  expect(R.ben.find(b => b.n === 'Urlop macierzyński').pct).toBe(81.5);
});

test('asystent przez OpenRouter: pętla narzędzi (serwer udawany)', async ({ page }) => {
  const bodies = [];
  await page.route('https://openrouter.ai/api/v1/chat/completions', async route => {
    const body = route.request().postDataJSON(); bodies.push(body);
    expect(route.request().headers()['authorization']).toBe('Bearer sk-or-test');
    const hasTool = body.messages.some(m => m.role === 'tool');
    const message = hasTool
      ? { role: 'assistant', content: 'Z kalkulatora: ok. 6731 zł miesięcznie na macierzyńskim.' }
      : { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'get_case', arguments: '{}' } }] };
    await route.fulfill({ json: { choices: [{ message }] } });
  });
  await page.evaluate(() => window.__przewodnik.load('joanna', undefined, 'asystent'));
  await page.fill('#orkey', 'sk-or-test');
  await page.click('#orsave');
  await expect(page.locator('#agmode')).toContainText('OpenRouter');
  await page.fill('#agin', 'Ile dostanę?');
  await page.click('#agsend');
  await expect(page.locator('#agm')).toContainText('6731 zł');
  expect(bodies.length).toBe(2);
  expect(bodies[0].tools.map(t => t.function.name)).toContain('get_case');
  expect(JSON.parse(bodies[1].messages.find(m => m.role === 'tool').content).wynik).toBeTruthy();
});

test('OpenRouter: zły klucz daje czytelny komunikat', async ({ page }) => {
  await page.route('https://openrouter.ai/api/v1/chat/completions', r => r.fulfill({ status: 401, json: { error: { message: 'No auth credentials found', code: 401 } } }));
  await page.evaluate(() => window.__przewodnik.load('joanna', undefined, 'asystent'));
  await page.fill('#orkey', 'zly');
  await page.click('#ortest');
  await expect(page.locator('#ormsg')).toContainText('nieprawidłowy klucz');
});

test('odpis aktu: dzieci z rejestru bez wypełniania formularza (Paweł, Tomasz) i brak dziecka (Marta)', async ({ page }) => {
  await page.evaluate(() => window.__przewodnik.load('tomasz', {}, 'akt'));
  await expect(page.locator('#akf')).toContainText('Zosia Lewandowska');
  await expect(page.locator('#akf')).toContainText('ojciec dziecka');
  await page.evaluate(() => window.__przewodnik.load('pawel', {}, 'akt'));
  await expect(page.locator('#akf')).toContainText('ojciec adopcyjny');
  await expect(page.locator('#akf')).toContainText('Kacper Mazur');
  await page.click('#akf button[type=submit]');
  await expect(page.locator('#aker')).toContainText('po uprawomocnieniu');
  await page.check('#akprawo');
  await page.click('#akf button[type=submit]');
  await expect(page.locator('.popup')).toContainText('Wniosek przyjęty do realizacji');
  await page.click('#ppok');
  await page.evaluate(() => window.__przewodnik.load('marta', {}, 'akt'));
  await expect(page.locator('#akf')).toHaveCount(0);
  await expect(page.locator('#app')).toContainText('po urodzeniu i zarejestrowaniu dziecka');
  await expect(page.locator('#app')).toContainText('21 dni od wystawienia karty urodzenia');
});

test('podpowiedź przy pytaniu o zarobki pasuje do jednostki (zł, nie tygodnie)', async ({ page }) => {
  const d = new Date(); d.setDate(d.getDate() - 400); const od = d.toISOString().slice(0, 10);
  await page.evaluate(o => window.__przewodnik.load('manual', { rola: 'mama', forma_m: 'uop', platnik_m: 'Firma', ponad20_m: 'tak', od_m: o, koniec_m: 'bezterminowa' }, 'form', 'chat'), od);
  expect(await page.evaluate(() => window.__przewodnik.next())).toBe('brutto_m');
  await expect(page.locator('#ft')).toHaveAttribute('placeholder', /tys\. zł/);
  await expect(page.locator('#ft')).not.toHaveAttribute('placeholder', /tygodni/);
  expect(await page.evaluate(() => window.__przewodnik.numIn('około 6 tys. zł'))).toBe(6000);
  await page.fill('#ft', 'około 6 tys. zł'); await page.click('#fts');
  await expect.poll(() => page.evaluate(() => window.__przewodnik.S.A.brutto_m)).toBe(6000);
});

test('numer rachunku: 2 litery + 26 cyfr', async ({ page }) => {
  await page.evaluate(() => { const p = window.__przewodnik.PERS.find(x => x.id === 'marta'); window.__przewodnik.load('marta', { ...p.sc, konto_ok: false }, 'form', 'chat'); });
  expect(await page.evaluate(() => window.__przewodnik.next())).toBe('konto');
  const send = async t => { await page.fill('#ft', t); await page.click('#fts'); };
  await send('61 1090 1014 0000 0712 1981 2874');
  await expect(page.locator('#msgs')).toContainText('dwóch liter');
  await send('PL61 1090 1014 0000 0712 1981');
  await expect(page.locator('#msgs')).toContainText('26 cyfr, a jest 22');
  await send('PL61 1090 1014 0000 0712 198A 2874');
  await expect(page.locator('#msgs')).toContainText('tylko cyfry');
  expect(await page.evaluate(() => window.__przewodnik.S.A.konto)).toBeUndefined();
  await send('pl61-1090-1014-0000-0712-1981-2874');
  await expect.poll(() => page.evaluate(() => window.__przewodnik.S.A.konto)).toBe('PL61 1090 1014 0000 0712 1981 2874');
});
