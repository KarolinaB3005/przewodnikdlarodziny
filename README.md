# Przewodnik przyszłego rodzica

Prototyp aplikacji webowej na zadanie konkursowe **„Zasiłkowy Przewodnik Przyszłego Rodzica”** (HackNation 2026, partner: ZUS).

Aplikacja prowadzi przyszłego rodzica przez krótką rozmowę i na jej podstawie:
- ustala, jaki wniosek trzeba złożyć, do kogo i kiedy,
- liczy okres i orientacyjną wysokość zasiłków (chorobowy w ciąży, macierzyński, uzupełniający, rodzicielski, ojcowski, na warunkach urlopu macierzyńskiego),
- ostrzega przed ryzykami utraty prawa do zasiłku,
- wypełnia wniosek i zapamiętuje dane potrzebne w kolejnych wnioskach,
- pokazuje oś czasu z terminami i organizacje wsparcia w sytuacjach szczególnych.

> Prototyp konkursowy, nie jest serwisem ZUS. Logowanie mObywatel i dane ZUS są symulowane, profile testowe są zmyślone, a wyliczenia orientacyjne.

## Uruchomienie

Aplikacja to statyczna strona: `index.html` + `css/` + `js/` (bez instalacji i bez backendu).

- **Lokalnie:** otwórz `index.html` w przeglądarce (pliki `css/`, `js/` i `assets/` muszą leżeć obok).
- **Jeden plik:** `npm run build` tworzy `dist/index.html` ze wszystkim w środku (np. do wysłania albo wgrania jako artefakt na claude.ai).
- **Demo online:** wgraj pliki do repozytorium i włącz GitHub Pages (Settings → Pages → gałąź `main`).

Funkcje AI (asystent, odczyt PDF, interpretacja trudnych odpowiedzi) działają po wpisaniu klucza OpenRouter w zakładce „Asystent AI” (Ustawienia AI) albo w wersji uruchomionej jako artefakt na claude.ai. Bez modelu działa lokalny parser odpowiedzi i uproszczony asystent.

## Przebieg

1. **Wybór profilu** (profile testowe z różnymi sytuacjami) i **symulowane logowanie** z wpisanym hasłem.
2. **Pulpit**: start formularza, dane z ZUS i menu.
3. **Formularz w formie rozmowy**: przyciski albo odpowiedzi pisane własnymi słowami. Obok widać na żywo wypełniany wniosek, wynik, profil i użyte reguły.
4. **Pobieranie wniosku**: wypełniony wniosek jako Word (.docx) albo strona do druku (.html, którą można zapisać jako PDF).
5. **Widoki dodatkowe**: Asystent AI, Sprawa z PDF, Moje wnioski, Kalendarz, Dokumenty, eZUS, Odpis aktu urodzenia, Pomoc.

## Funkcje korzystające z AI

| Funkcja | Rola AI | Co robi kod bez AI |
|---|---|---|
| Odpowiedzi pisane własnymi słowami | Claude interpretuje odpowiedź, gdy nie poradzi sobie lokalny parser | parser dat („za 6 tygodni”, „30 listopada”, „jestem w 30 tygodniu”), liczb, tak/nie i słów kluczowych |
| Asystent AI | rozmowa o sytuacji użytkownika; korzysta z narzędzi: odczyt sprawy, symulacja wariantu, zmiana odpowiedzi (tylko na prośbę), lista pytań, parametry, organizacje wsparcia | wszystkie liczby i uprawnienia liczy silnik reguł |
| Sprawa z PDF | odczyt skanów wniosków i zaświadczeń (strony PDF zamieniane na obrazy w przeglądarce) | weryfikacja ubezpieczenia, podstawa wymiaru i kwoty |
| Wyjaśnienia pojęć | objaśnienie, gdy nie ma gotowego opisu | ponad 20 gotowych wyjaśnień |

Decyzje o uprawnieniach podejmuje kod (silnik reguł R01–R39), a nie model językowy.

## Komponenty zewnętrzne

- **Lato** (Google Fonts), licencja SIL Open Font License 1.1
- **PDF.js 3.11.174** (Mozilla), licencja Apache 2.0, ładowany z cdnjs tylko przy odczycie PDF
- **JSZip 3.10.1**, licencja MIT, ładowany z cdnjs tylko przy pobieraniu wniosku jako .docx
- **Claude** (Anthropic) przez funkcję „ask Claude” artefaktów claude.ai
- Ikony: własne, rysowane w SVG. Logo: dostarczone przez zespół.

## Struktura kodu

Skrypty w `js/` są zwykłymi plikami `<script>` (nie modułami, żeby aplikacja działała po otwarciu z dysku). Ładują się w kolejności numerów i współdzielą zmienne globalne.

| Plik | Zawartość |
|---|---|
| `css/style.css` | wszystkie style |
| `js/01-narzedzia.js` | daty, kwoty, `CFG` (parametry kalkulatora), `RULES` (opisy reguł) |
| `js/02-profile.js` | `PERS`: profile testowe z symulowanymi danymi ZUS |
| `js/03-formularz.js` | stan `S`, `ctx()`, pytania `Q` (w tym osobno dla każdego dziecka) |
| `js/04-zadluzenie.js` | zadłużenie w składkach na dzień powstania prawa, zaświadczenie |
| `js/05-reguly.js` | `compute()`: silnik reguł i kalkulator |
| `js/06-ekrany-startowe.js` | menu, nagłówek, wybór profilu, logowanie, pulpit |
| `js/07-parser.js` | rozumienie odpowiedzi pisanych z klawiatury |
| `js/08-ai.js` | dostawca AI (OpenRouter albo claude.ai), `askLLM()` |
| `js/09-czat.js` | `HELP` i rozmowa w formularzu |
| `js/10-panel.js` | panel: wniosek, wynik, profil, reguły |
| `js/11-linki-wsparcie.js` | organizacje wsparcia, linki do uprawnień |
| `js/12-ezus.js` | e-ZLA i symulacja eZUS |
| `js/13-odpis-aktu.js` | wniosek o odpis aktu urodzenia |
| `js/14-widoki.js` | kalendarz, dokumenty, moje wnioski, pomoc |
| `js/15-asystent.js` | asystent AI i jego narzędzia |
| `js/16-sprawa-pdf.js` | odczyt sprawy z PDF |
| `js/17-wniosek-pobieranie.js` | wniosek do pobrania (.docx, .html) |
| `js/18-start.js` | `render()`, punkt wejścia dla testów, start aplikacji |

## Profile testowe

Marta (umowa o pracę, ciąża) · Joanna (bliźnięta, wcześniaki, wariant 81,5%) · Ewelina (umowa na czas określony przedłużona do porodu) · Monika (zlecenie kończy się przed porodem) · Katarzyna (zlecenie bez dobrowolnego chorobowego, odmowa) · Aleksandra (działalność, e-ZLA, zadłużenie, krótki staż) · Tomasz (tata) · Paweł (adopcja, łączenie z pracą) · Natalia (brak ubezpieczenia; ścieżka utraty pracy w ciąży) · profil bez danych z ZUS.

## Testy

77 testów automatycznych (Playwright): silnik reguł dla wszystkich profili, parser odpowiedzi i interfejs na laptopie i telefonie. Uruchomienie: `npm install`, `npx playwright install chromium`, `npm test`. Szczegóły i scenariusze ręczne dla funkcji AI są w [TESTY.md](TESTY.md).

## Ograniczenia i do potwierdzenia

- Parametry kalkulatora (m.in. wymiar urlopu przy wieloraczkach, urlop uzupełniający, minimalny zasiłek) trzeba zweryfikować z załącznikiem ZUS.
- Reguły R13 i R15 opierają się na niepełnych informacjach z treści zadania.
- Kwoty są orientacyjne: podstawa = wynagrodzenie brutto minus 13,71% składek.
- Stan aplikacji (odpowiedzi, wysłane wnioski, kalendarz) nie jest zapisywany po odświeżeniu strony.

## Dane i prywatność

Repozytorium nie zawiera dokumentów ani spraw udostępnionych przez ZUS; zgodnie z treścią zadania nie wolno ich kopiować ani rozpowszechniać. Do testów należy je wgrywać lokalnie w widoku „Sprawa z PDF”.

## Pliki

- `index.html`, `css/`, `js/`: aplikacja
- `scripts/build.js`: sklejanie w jeden plik `dist/index.html`
- `assets/logo.png`: logo
- `ZUS_swiadczenia_wymagania_reguly.xlsx`: świadczenia i dokumenty, wymagania konkursu ze statusem realizacji, reguły powiązań
- `tests/`, `package.json`, `playwright.config.js`, `TESTY.md`: testy automatyczne
