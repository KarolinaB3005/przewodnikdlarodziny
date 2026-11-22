// Testy silnika reguł i kalkulatora (bez klikania): profil + odpowiedzi -> wynik.
const { test, expect } = require('@playwright/test');
const { openApp, scenario, isoDays } = require('./helpers');

const ben = (R, name) => R.ben.find(b => b.n === name);

test.beforeEach(async ({ page }) => { await openApp(page); });

test.describe('Profile testowe z przykładowymi odpowiedziami', () => {
  test('Marta: umowa o pracę, start przed porodem, 81,5%, podział z tatą', async ({ page }) => {
    const R = await scenario(page, 'marta');
    expect(R.blocked).toBeNull();
    expect(R.w.name).toBe('Wniosek o urlop macierzyński i rodzicielski');
    expect(R.w.where).toContain('Kwadrat Logistyka');
    expect(R.w.pay).toContain('Pracodawca sam ustali');
    expect(R.fired).toEqual(expect.arrayContaining(['R08', 'R09', 'R17', 'R18', 'R19', 'R23', 'R24', 'R27']));
    const mac = ben(R, 'Urlop macierzyński');
    expect(mac.tyg).toContain('20 tyg.');
    expect(mac.pct).toBe(81.5);
    // 7800 zł brutto - 13,71% składek = 6730,62 zł podstawy; 81,5% = 5485,46 zł
    expect(mac.m).toBeCloseTo(5485.46, 1);
    // pula 41 tyg. - 9 tyg. drugiego rodzica = 32 tyg.
    expect(ben(R, 'Urlop rodzicielski').tyg).toContain('32 tyg.');
    expect(ben(R, 'Rodzicielski: drugi rodzic').m).toBeGreaterThan(0);
    expect(R.att.map(a => a.t)).toEqual(expect.arrayContaining(['Zaświadczenie lekarskie o przewidywanej dacie porodu']));
  });

  test('Joanna: bliźnięta, wcześniaki: dłuższe urlopy i urlop uzupełniający', async ({ page }) => {
    const R = await scenario(page, 'joanna');
    expect(R.fired).toEqual(expect.arrayContaining(['R21', 'R22', 'R24', 'R26']));
    expect(ben(R, 'Urlop macierzyński').tyg).toContain('31 tyg.');
    expect(ben(R, 'Uzupełniający urlop macierzyński')).toBeTruthy();
    // pula 43 tyg. - 12 tyg. drugiego rodzica = 31 tyg.
    expect(ben(R, 'Urlop rodzicielski').tyg).toContain('31 tyg.');
    expect(R.att.map(a => a.t)).toEqual(expect.arrayContaining([
      'Odpisy aktów urodzenia dzieci (2 szt.: Ala, Ola)',
      'Zaświadczenie ze szpitala o hospitalizacji / wcześniactwie (dotyczy: Ala, Ola)']));
  });

  test('Ewelina: umowa na czas określony przedłuża się do porodu (R07), bez ryzyka R01', async ({ page }) => {
    const R = await scenario(page, 'ewelina');
    expect(R.fired).toContain('R07');
    expect(R.good.map(g => g.id)).toContain('R07');
    expect(R.risks.filter(r => r.id === 'R01')).toHaveLength(0);
    expect(R.w.pay).toContain('Z-3');
  });

  test('Monika: zlecenie kończy się przed porodem: wysokie ryzyko R01, wniosek ZAM', async ({ page }) => {
    const R = await scenario(page, 'monika');
    expect(R.blocked).toBeNull();
    expect(R.w.name).toMatch(/^ZAM/);
    const r01 = R.risks.find(r => r.id === 'R01');
    expect(r01).toBeTruthy();
    expect(r01.h).toBe(1);
  });

  test('Katarzyna: zlecenie bez dobrowolnego chorobowego: brak prawa (R04)', async ({ page }) => {
    const R = await scenario(page, 'kasia');
    expect(R.blocked).toContain('dobrowolne ubezpieczenie chorobowe');
    expect(R.fired).toContain('R04');
    expect(R.w).toBeNull();
  });

  test('Aleksandra: działalność, e-ZLA, zadłużenie, krótki staż, wzrost podstawy', async ({ page }) => {
    const R = await scenario(page, 'ola');
    expect(R.w.where).toBe('Do ZUS, przez eZUS');
    expect(R.fired).toEqual(expect.arrayContaining(['R03', 'R05', 'R06', 'R12', 'R13']));
    expect(R.risks.find(r => r.id === 'R05').h).toBe(1);
    expect(R.att.map(a => a.t).join(' ')).toContain('ZAS-53');
    expect(R.info.join(' ')).toContain('e-ZLA');
  });

  test('Tomasz: tata: urlop ojcowski i 9 tygodni rodzicielskiego', async ({ page }) => {
    const R = await scenario(page, 'tomasz');
    expect(R.w.name).toBe('Wniosek o urlop ojcowski i rodzicielski');
    expect(R.fired).toContain('R33');
    expect(ben(R, 'Urlop ojcowski').tyg).toContain('14 dni');
    expect(ben(R, 'Urlop rodzicielski').tyg).toContain('9 tyg.');
  });

  test('Paweł: adopcja z łączeniem pracy na pół etatu', async ({ page }) => {
    const R = await scenario(page, 'pawel');
    expect(R.w.name).toBe('Wniosek o urlop na warunkach urlopu macierzyńskiego');
    expect(R.fired).toEqual(expect.arrayContaining(['R29', 'R33', 'R34']));
    // 9 tyg. przy pracy na pół etatu wydłuża się do 18 tyg.
    expect(ben(R, 'Urlop rodzicielski').tyg).toContain('18 tyg.');
  });

  test('Natalia: brak ubezpieczenia: brak prawa (R01)', async ({ page }) => {
    const R = await scenario(page, 'natalia');
    expect(R.blocked).toContain('Bez ubezpieczenia chorobowego');
    expect(R.fired).toContain('R01');
  });
});

test.describe('Ścieżki szczególne', () => {
  test('utrata pracy w ciąży przez upadłość: zasiłek w wysokości macierzyńskiego (R15)', async ({ page }) => {
    const R = await scenario(page, 'natalia', { rola: 'mama', zus_ok: true, etap: 'ciaza', termin: isoDays(60), utrata: 'upadlosc', utrata_brutto: 6000 });
    expect(R.blocked).toBeNull();
    expect(R.fired).toContain('R15');
    expect(R.w.name).toBe('Wniosek o zasiłek w wysokości zasiłku macierzyńskiego');
    expect(ben(R, 'Zasiłek w wysokości zasiłku macierzyńskiego').m).toBeCloseTo(6000 * 0.8629, 0);
  });

  test('martwe urodzenie: 8 tygodni zasiłku macierzyńskiego (R36)', async ({ page }) => {
    const R = await scenario(page, 'joanna', { rola: 'mama', zus_ok: true, etap: 'po', data_porodu: isoDays(-5), liczba: '1', spec_open: true, spec: 'martwe' });
    expect(R.fired).toContain('R36');
    const b = ben(R, 'Zasiłek macierzyński');
    expect(b.tyg).toBe('8 tyg.');
    expect(R.support).toBe(true);
  });

  test('zawodowa rodzina zastępcza: brak prawa (R35)', async ({ page }) => {
    const R = await scenario(page, 'pawel', { rola: 'zast_k', zus_ok: true, etap: 'po', przyjecie: isoDays(-3), wiek: 2, typ_zast: 'zawodowa' });
    expect(R.blocked).toContain('zawodowej rodzinie zastępczej');
  });

  test('adopcja dziecka w wieku 14 lat: brak prawa (R34)', async ({ page }) => {
    const R = await scenario(page, 'pawel', { rola: 'adop_k', zus_ok: true, etap: 'po', przyjecie: isoDays(-3), wiek: 14, sad: true });
    expect(R.blocked).toContain('mniej niż 14 lat');
  });

  test('tata przejmuje urlop, gdy mama jest w szpitalu (R31)', async ({ page }) => {
    const R = await scenario(page, 'tomasz', { ...{ rola: 'tata', zus_ok: true, etap: 'po', data_porodu: isoDays(-10), liczba: '1', hosp: 'nie', imie: '', zazycie: 'nie', mama_status: 'szpital', mama_ubezp: 'tak', tata_tyg: 9, laczenie: 'nie', konto_ok: true } });
    expect(R.fired).toContain('R31');
    expect(ben(R, 'Urlop macierzyński przejęty od mamy')).toBeTruthy();
  });

  test('termin porodu za mniej niż 6 tygodni: urlop liczony od dziś', async ({ page }) => {
    const sc = await page.evaluate(() => window.__przewodnik.PERS.find(p => p.id === 'marta').sc);
    const R = await scenario(page, 'marta', { ...sc, termin: isoDays(9), start_przed: 'tak' });
    const today = await page.evaluate(() => window.__przewodnik.today());
    expect(ben(R, 'Urlop macierzyński').od).toBe(today);
  });

  test('minimalny zasiłek: kwota nie spada poniżej 1000 zł', async ({ page }) => {
    const R = await scenario(page, 'manual', { rola: 'mama', forma_m: 'uop', od_m: isoDays(-400), brutto_m: 800, etap: 'po', data_porodu: isoDays(-3), liczba: '1', hosp: 'nie', imie: '', zazycie: 'nie', drugi: 'nie', w815: '100_70', laczenie: 'nie', konto: '' });
    expect(ben(R, 'Urlop macierzyński').m).toBe(1000);
  });

  test('zmiana parametru w panelu administratora zmienia wynik', async ({ page }) => {
    await page.evaluate(() => { window.__przewodnik.CFG.mac[0] = 22; });
    const R = await scenario(page, 'marta');
    expect(ben(R, 'Urlop macierzyński').tyg).toContain('22 tyg.');
  });

  test('wypełniony wniosek zawiera dane z profilu i okresy urlopów', async ({ page }) => {
    await scenario(page, 'joanna');
    const D = await page.evaluate(() => window.__przewodnik.doc());
    expect(D.title).toBe('Wniosek o urlop macierzyński i rodzicielski');
    expect(D.osoba.find(r => r[0] === 'Imię i nazwisko')[1]).toBe('Joanna Wójcik');
    expect(D.lines.map(l => l[0])).toEqual(expect.arrayContaining(['Urlop macierzyński', 'Urlop rodzicielski']));
    expect(D.os.find(o => o[1].includes('81,5%'))[0]).toBe(true);
    expect(D.konto).toBeNull(); // umowa o pracę: bez rachunku, wypłaca pracodawca
  });
});

test.describe('Kilkoro dzieci: pytania dla każdego dziecka i komplet danych we wniosku', () => {
  const base = { rola: 'mama', zus_ok: true, etap: 'po', data_porodu: isoDays(-10), liczba: '3' };

  test('kreator pyta o każde dziecko po kolei', async ({ page }) => {
    await page.evaluate(a => window.__przewodnik.load('joanna', a), base);
    const order = [];
    const answers = { hosp: 'nie', imie: 'Jan', zazycie: 'nie', hosp_2: 'hosp', imie_2: 'Ewa', zazycie_2: 'tak', hosp_3: 'nie', imie_3: 'Ola', zazycie_3: 'nie' };
    for (let i = 0; i < 9; i++) {
      const id = await page.evaluate(() => window.__przewodnik.next());
      order.push(id);
      await page.evaluate(([k, v]) => window.__przewodnik.set(k, v), [id, answers[id]]);
    }
    expect(order).toEqual(['hosp', 'imie', 'zazycie', 'hosp_2', 'imie_2', 'zazycie_2', 'hosp_3', 'imie_3', 'zazycie_3']);
    expect(await page.evaluate(() => window.__przewodnik.next())).toBe('drugi');
  });

  test('wniosek zawiera dane wszystkich dzieci, a reguły uwzględniają każde dziecko', async ({ page }) => {
    const R = await scenario(page, 'joanna', { ...base, hosp: 'nie', imie: 'Jan', zazycie: 'nie', hosp_2: 'hosp', imie_2: 'Ewa', zazycie_2: 'tak', hosp_3: 'nie', imie_3: '', zazycie_3: 'nie', drugi: 'nie', w815: '100_70', laczenie: 'nie', konto_ok: true });
    expect(R.fired).toEqual(expect.arrayContaining(['R22', 'R25', 'R26']));
    expect(R.att.map(a => a.t)).toEqual(expect.arrayContaining([
      'Odpisy aktów urodzenia dzieci (3 szt.: Jan, Ewa, dziecko 3)',
      'Zaświadczenie „Za życiem” (dotyczy: Ewa)',
      'Zaświadczenie ze szpitala o hospitalizacji / wcześniactwie (dotyczy: Ewa)']));
    const D = await page.evaluate(() => window.__przewodnik.doc());
    expect(D.kidH).toBe('Dane dzieci');
    const kid = Object.fromEntries(D.kid);
    expect(kid['Dziecko 1: imię']).toBe('Jan');
    expect(kid['Dziecko 2: imię']).toBe('Ewa');
    expect(kid['Dziecko 3: imię']).toBe('');
    expect(kid['Dziecko 2: hospitalizacja']).toBe('tak, hospitalizacja');
    expect(kid['Dziecko 2: zaświadczenie „Za życiem”']).toBe('tak');
    expect(kid['Dziecko 3: zaświadczenie „Za życiem”']).toBe('nie');
    expect(D.os.find(o => o[1].startsWith('Dziecko ma zaświadczenie'))).toEqual([true, 'Dziecko ma zaświadczenie „Za życiem” (dotyczy: Ewa)']);
  });

  test('zmniejszenie liczby dzieci pomija odpowiedzi o dzieciach spoza zakresu', async ({ page }) => {
    const R = await scenario(page, 'joanna', { ...base, liczba: '1', hosp: 'nie', imie: 'Jan', zazycie: 'nie', hosp_2: 'wczesniak', zazycie_2: 'tak', drugi: 'nie', w815: '100_70', laczenie: 'nie', konto_ok: true });
    expect(R.fired).not.toContain('R22');
    expect(R.fired).not.toContain('R25');
    const D = await page.evaluate(() => window.__przewodnik.doc());
    expect(D.kidH).toBe('Dane dziecka');
    expect(Object.fromEntries(D.kid)['Imię dziecka']).toBe('Jan');
  });
});

test.describe('Zadłużenie w składkach na dzień powstania prawa (działalność)', () => {
  test('Aleksandra: stan na dzień L4 i na dzień startu macierzyńskiego, z odsetkami', async ({ page }) => {
    const R = await scenario(page, 'ola');
    expect(R.dniPrawa.map(p => p.n)).toEqual(['Zasiłek chorobowy (e-ZLA)', 'Urlop macierzyński']);
    const l4 = await page.evaluate(d => window.__przewodnik.debtOn(d), R.dniPrawa[0].d);
    expect(l4.items.length).toBe(1);          // druga składka nie była jeszcze wymagalna
    expect(l4.glowna).toBe(620);
    const mac = await page.evaluate(d => window.__przewodnik.debtOn(d), R.dniPrawa[1].d);
    expect(mac.glowna).toBe(1240);
    expect(mac.ods).toBeGreaterThan(0);
    expect(mac.przyszlosc).toBe(true);
    expect(R.risks.find(r => r.id === 'R05').t).toContain('zadłużenie w składkach wyniesie');
  });

  test('symulowana spłata zeruje zadłużenie na późniejsze dni, a zaświadczenie zawiera kwotę', async ({ page }) => {
    await scenario(page, 'ola');
    await page.click('[data-t="wynik"]');
    await page.click('[data-zasw="1"]');
    const html = await page.evaluate(() => window.__przewodnik.zaswHTML(0));
    expect(html).toContain('ZAŚWIADCZENIE O STANIE ZADŁUŻENIA');
    expect(html).toMatch(/Łączne zadłużenie na dzień [\d.]+: 1310,00 zł/); // 1240 zł + 70 zł odsetek
    await page.click('#zsplac');
    const R = await page.evaluate(() => window.__przewodnik.compute());
    const r05 = R.risks.find(r => r.id === 'R05');
    expect(r05.h).toBeUndefined();             // po spłacie już nie jako ryzyko wysokie
    expect(r05.t).toContain('Zadłużenie opłacone');
    const mac = await page.evaluate(d => window.__przewodnik.debtOn(d), R.dniPrawa[1].d);
    expect(mac.razem).toBe(0);
    const l4 = await page.evaluate(d => window.__przewodnik.debtOn(d), R.dniPrawa[0].d);
    expect(l4.glowna).toBe(620);              // spłata dziś nie zmienia stanu z przeszłości
  });

  test('umowa o pracę: sekcji zadłużenia nie ma', async ({ page }) => {
    const R = await scenario(page, 'marta');
    expect(R.dniPrawa).toBeUndefined();
  });
});
