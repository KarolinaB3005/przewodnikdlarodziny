// Testy parsera odpowiedzi pisanych własnymi słowami (działa bez modelu AI).
const { test, expect } = require('@playwright/test');
const { openApp, isoDays } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.__przewodnik.load('marta', { rola: 'mama' }));
});
const P = (page, fn, ...args) => page.evaluate(([f, a]) => window.__przewodnik[f](...a), [fn, args]);

test.describe('Daty', () => {
  test('format dd.mm.rrrr i rrrr-mm-dd', async ({ page }) => {
    expect(await P(page, 'dateIn', '30.11.2026')).toBe('2026-11-30');
    expect(await P(page, 'dateIn', '2027-01-15')).toBe('2027-01-15');
  });
  test('nazwa miesiąca', async ({ page }) => {
    expect(await P(page, 'dateIn', '31 grudnia 2026')).toBe('2026-12-31');
    expect(await P(page, 'dateIn', '3 marca 2027')).toBe('2027-03-03');
  });
  test('określenia względne', async ({ page }) => {
    expect(await P(page, 'dateIn', 'za 6 tygodni')).toBe(isoDays(42));
    expect(await P(page, 'dateIn', 'za 10 dni')).toBe(isoDays(10));
    expect(await P(page, 'dateIn', 'wczoraj')).toBe(isoDays(-1));
    expect(await P(page, 'dateIn', '2 tygodnie temu')).toBe(isoDays(-14));
  });
  test('tydzień ciąży zamienia się na termin porodu', async ({ page }) => {
    expect(await P(page, 'dateIn', 'jestem w 30 tygodniu', 'termin')).toBe(isoDays(70));
  });
  test('brak daty w tekście', async ({ page }) => {
    expect(await P(page, 'dateIn', 'nie pamiętam')).toBeNull();
  });
  test('walidacja: termin porodu nie może być w przeszłości', async ({ page }) => {
    expect(await P(page, 'validDate', 'termin', isoDays(-3))).toContain('nie może być w przeszłości');
    expect(await P(page, 'validDate', 'termin', isoDays(30))).toBe('');
    expect(await P(page, 'validDate', 'data_porodu', isoDays(5))).toContain('nie może być w przyszłości');
  });
});

test.describe('Liczby', () => {
  test('kwoty i liczby słownie', async ({ page }) => {
    expect(await P(page, 'numIn', '5 tys zł')).toBe(5000);
    expect(await P(page, 'numIn', 'około 8 500 zł')).toBe(8500);
    expect(await P(page, 'numIn', '12 tygodni')).toBe(12);
    expect(await P(page, 'numIn', 'dziewięć')).toBe(9);
  });
});

test.describe('Tak / nie', () => {
  test('rozpoznaje odpowiedzi', async ({ page }) => {
    expect(await P(page, 'yesNo', 'tak, płacę')).toBe(true);
    expect(await P(page, 'yesNo', 'zgadza się')).toBe(true);
    expect(await P(page, 'yesNo', 'nie, zmieniłam pracę')).toBe(false);
    expect(await P(page, 'yesNo', 'nie wiem')).toBeNull();
  });
});

test.describe('Wybór z listy', () => {
  test('rola', async ({ page }) => {
    expect(await P(page, 'choiceIn', 'rola', 'jestem w ciąży')).toBe('mama');
    expect(await P(page, 'choiceIn', 'rola', 'jestem tatą')).toBe('tata');
    expect(await P(page, 'choiceIn', 'rola', 'tata adopcyjny')).toBe('adop_m');
  });
  test('etap, hospitalizacja, liczba dzieci, wielkość firmy', async ({ page }) => {
    expect(await P(page, 'choiceIn', 'etap', 'czekamy na dziecko')).toBe('ciaza');
    expect(await P(page, 'choiceIn', 'hosp', 'to wcześniak, jest w szpitalu')).toBe('wczesniak');
    expect(await P(page, 'choiceIn', 'liczba', 'bliźnięta')).toBe('2');
    expect(await P(page, 'choiceIn', 'ponad20_m', 'to mała firma, kilka osób')).toBe('nie');
  });
  test('nierozpoznana odpowiedź', async ({ page }) => {
    expect(await P(page, 'choiceIn', 'etap', 'fioletowy')).toBeNull();
  });
});

test.describe('Opis zmian w danych z ZUS', () => {
  test('wyciąga pola i wartości z jednego zdania', async ({ page }) => {
    const r = await P(page, 'fixExtract', 'od 1 września 2026 pracuję na zleceniu w innej firmie, zarabiam 5 tys zł');
    expect(r.fields).toEqual(expect.arrayContaining(['forma', 'platnik', 'od', 'brutto']));
    expect(r.vals.forma_m).toBe('zlecenie');
    expect(r.vals.od_m).toBe('2026-09-01');
    expect(r.vals.brutto_m).toBe(5000);
  });
});

test.describe('Pytania o wyjaśnienie', () => {
  test('rozpoznaje prośbę o wyjaśnienie zamiast odpowiedzi', async ({ page }) => {
    expect(await P(page, 'isHelp', 'Co to?')).toBe(true);
    expect(await P(page, 'isHelp', 'nie rozumiem, wytłumacz')).toBe(true);
    expect(await P(page, 'isHelp', 'tak')).toBe(false);
  });
});
