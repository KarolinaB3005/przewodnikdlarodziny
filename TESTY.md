# Testy

Testy automatyczne (Playwright) uruchamiają aplikację z pliku `index.html` w przeglądarce i sprawdzają ją bez dostępu do internetu i bez modelu AI.

## Uruchomienie

Potrzebny jest Node.js 18 lub nowszy.

```bash
npm install
npx playwright install chromium   # jednorazowo: pobiera przeglądarkę testową
npm test                          # wszystkie testy
npm run test:reguly               # tylko silnik reguł i kalkulator
npm run test:parser               # tylko parser odpowiedzi
npm run test:ui                   # tylko interfejs (laptop i telefon)
npm run raport                    # raport HTML z ostatniego uruchomienia
```

Zamiast pobierać przeglądarkę, możesz wskazać zainstalowanego Chrome: `CHROME_PATH="/ścieżka/do/chrome" npm test`.

## Co sprawdzają (59 testów)

### `tests/reguly.spec.js`: silnik reguł i kalkulator (18)
| Test | Sprawdza |
|---|---|
| Marta | wniosek do pracodawcy, start urlopu przed porodem (R17), 81,5% (R24), kwota 5485,46 zł z 7800 zł brutto, 32 tyg. rodzicielskiego po odjęciu 9 tyg. drugiego rodzica |
| Joanna | bliźnięta (R26: 31 tyg. macierzyńskiego), urlop uzupełniający (R22), załączniki |
| Ewelina | umowa na czas określony przedłużona do porodu (R07), brak ryzyka R01 |
| Monika | zlecenie kończy się przed porodem: wysokie ryzyko R01, wniosek ZAM |
| Katarzyna | brak dobrowolnego chorobowego: brak prawa (R04) |
| Aleksandra | działalność: zadłużenie (R05), wzrost podstawy (R06), karencja (R03), e-ZLA i ZAS-53 (R12) |
| Tomasz | urlop ojcowski 14 dni (R33), 9 tyg. rodzicielskiego |
| Paweł | adopcja (R34), łączenie z pracą na pół etatu: 9 → 18 tyg. (R29) |
| Natalia | brak ubezpieczenia: brak prawa (R01) |
| Ścieżki szczególne | utrata pracy w ciąży (R15), martwe urodzenie: 8 tyg. (R36), zawodowa rodzina zastępcza (R35), wiek dziecka przy adopcji (R34), tata przejmuje urlop (R31), termin za mniej niż 6 tyg., minimalny zasiłek 1000 zł, zmiana parametru w panelu, treść wypełnionego wniosku |

### `tests/parser.spec.js`: odpowiedzi pisane z klawiatury (15)
Daty („30.11.2026”, „31 grudnia 2026”, „za 6 tygodni”, „wczoraj”, „jestem w 30 tygodniu”), walidacja dat, liczby („5 tys zł”, „około 8 500 zł”, „dziewięć”), tak/nie, wybór z listy („jestem w ciąży” → mama, „bliźnięta” → 2), opis zmian w danych z ZUS, pytania o wyjaśnienie („Co to?”).

### `tests/ui.spec.js`: interfejs na laptopie i telefonie (13 × 2)
Logowanie (profil → hasło → pulpit), rozmowa przyciskami do gotowego wniosku, odpowiedzi z klawiatury, dopytanie o niezgodne dane z ZUS, odrzucenie terminu porodu z przeszłości, „Co to?”, zmiana odpowiedzi kliknięciem, wysłanie wniosku, pobranie .docx i .html (z kontrolą treści dokumentu), wszystkie widoki z menu, kalendarz, asystent w trybie bez AI, organizacje wsparcia, brak poziomego przewijania.

## Testy ręczne funkcji AI (wersja na claude.ai)

Funkcje korzystające z Claude działają tylko w artefakcie na claude.ai, więc sprawdza się je ręcznie.

| # | Kroki | Oczekiwany wynik |
|---|---|---|
| 1 | Formularz, pytanie o etap: wpisz „no więc maluch będzie w marcu, jakoś pod koniec” | po zgodzie na Claude odpowiedź rozpoznana jako ciąża albo prośba o doprecyzowanie |
| 2 | Asystent (profil Joanna, „Przykład”): „Ile dostanę miesięcznie?” | kwoty zgodne z zakładką Wynik |
| 3 | Asystent: „Co jeśli drugi rodzic weźmie 16 tygodni?” | porównanie wariantów; formularz bez zmian |
| 4 | Asystent: „Zmień, że drugi rodzic bierze 16 tygodni” | komunikat o zmianie; w formularzu `drugi_tyg = 16` |
| 5 | Asystent: pytanie spoza danych, np. o zasiłek pogrzebowy | asystent mówi, że nie ma tego w danych, i odsyła do ZUS |
| 6 | Sprawa z PDF: wgraj skan sprawy z martwym urodzeniem | odczytana data porodu i martwe urodzenie; po „Przenieś do formularza” reguła R36 |
| 7 | Sprawa z PDF: sprawa z odmową (brak ubezpieczenia w dniu porodu) | czerwony komunikat R01 |
| 8 | Pytanie bez gotowego wyjaśnienia + „co to znaczy?” | krótkie wyjaśnienie od Claude |

Skanów spraw ZUS nie dodawaj do repozytorium ani do testów automatycznych: regulamin zabrania ich rozpowszechniania.

## Punkt wejścia dla testów

Aplikacja udostępnia `window.__przewodnik` (silnik reguł, parser, wczytanie profilu). Służy tylko testom i nie zmienia działania aplikacji.
