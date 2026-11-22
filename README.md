# Wniosek na Start

Prototyp aplikacji webowej na zadanie konkursowe **„Zasiłkowy Przewodnik Przyszłego Rodzica”** (HackNation 2026, partner: ZUS).

Aplikacja prowadzi przyszłego rodzica przez krótką rozmowę i na jej podstawie mówi, jaki wniosek złożyć, do kogo i kiedy, liczy zasiłki, wypełnia wniosek i ostrzega przed ryzykami utraty prawa do świadczeń.

> Prototyp konkursowy, nie jest serwisem ZUS. Logowanie mObywatel i dane ZUS są symulowane, profile testowe są zmyślone, a wyliczenia orientacyjne.

## Funkcje aplikacji

- **Wybór profilu i symulowane logowanie**: 10 profili testowych z różnymi sytuacjami (umowa o pracę, zlecenie, działalność, tata, adopcja, bliźnięta, brak ubezpieczenia, profil bez danych z ZUS).
- **Formularz w formie rozmowy**: odpowiedzi przyciskami albo własnymi słowami (parser rozumie m.in. „za 6 tygodni”, „30 listopada”, „jestem w 30 tygodniu”).
- **Wniosek wypełniany na żywo**: dane z ZUS i z rozmowy trafiają od razu do właściwego wniosku (wniosek o urlop do pracodawcy albo ZUS ZAM).
- **Kalkulator zasiłków**: okres i orientacyjna kwota zasiłku chorobowego w ciąży, macierzyńskiego, uzupełniającego, rodzicielskiego, ojcowskiego oraz na warunkach urlopu macierzyńskiego; porównanie wariantu 81,5% z 100% + 70%.
- **Ryzyka i ostrzeżenia**: brak ubezpieczenia w dniu porodu, karencja, umowa kończąca się przed porodem, wzrost podstawy w ciąży, zadłużenie w składkach przy działalności.
- **Silnik reguł (R01–R37)**: o uprawnieniach decyduje kod, nie model językowy. Zakładka „Reguły” pokazuje użyte reguły i pozwala zmieniać parametry kalkulatora (panel administratora, demo).
- **Pobieranie wniosku**: Word (.docx) albo strona do druku (.html, można zapisać jako PDF).
- **Oś czasu i kalendarz**: terminy kolejnych wniosków i urlopów.
- **eZUS i e-ZLA (symulacja)**: zwolnienia lekarskie, konto, wiadomości do ZUS.
- **Zadłużenie w składkach**: stan na dzień powstania prawa do zasiłku, spłata, zaświadczenie.
- **Odpis aktu urodzenia (symulacja usługi gov.pl)**: zamówienie odpisu i śledzenie statusu.
- **Moje wnioski, Dokumenty, Pomoc**: lista złożonych wniosków, potrzebne załączniki, linki do gov.pl i organizacji wsparcia.
- **Sytuacje szczególne**: martwe urodzenie, śmierć dziecka, poronienie; aplikacja pokazuje tylko to, co ważne w tej chwili.
- **Asystent AI**: rozmowa o sytuacji użytkownika (szczegóły niżej).
- **Sprawa z PDF**: widok do wczytania akt sprawy (odczyt skanów wymaga modelu obsługującego obrazy; w trybie lokalnym z Bielikiem i Gemini jest wyłączony).

## Wykorzystanie AI

- **Asystent w aplikacji**: asystent AI rozmawia z użytkownikiem o jego sytuacji i korzysta z narzędzi aplikacji (odczyt sprawy, symulacja wariantu, zmiana odpowiedzi tylko na prośbę, lista pytań, parametry, organizacje wsparcia). Model pomaga też zrozumieć odpowiedzi, z którymi nie radzi sobie lokalny parser. Asystent może działać lokalnie na modelu **Bielik** (przez Ollama) albo przez **Gemini API**. Wszystkie kwoty i uprawnienia liczy silnik reguł, nie model.
- **Aspekty graficzne**: AI było wykorzystane przy tworzeniu warstwy graficznej aplikacji (wygląd interfejsu i elementy graficzne).

## Uruchomienie

### Wymagania

- **Node.js 22.9 lub nowszy**: [nodejs.org](https://nodejs.org)
- **Ollama** z modelem Bielik, jeśli asystent AI ma działać lokalnie (patrz niżej)

Aplikacja nie ma zależności npm, więc `npm install` nie jest potrzebne.

### Wariant 1: lokalnie z Bielikiem (Ollama), zalecany

1. **Zainstaluj Ollama**
   - macOS / Windows: pobierz instalator z [ollama.com/download](https://ollama.com/download) i uruchom aplikację Ollama.
   - Linux: `curl -fsSL https://ollama.com/install.sh | sh`

   Sprawdź instalację: `ollama --version`

2. **Pobierz model Bielik** (ok. 6,7 GB, zalecane min. 16 GB RAM):
   ```bash
   ollama pull SpeakLeash/bielik-11b-v3.0-instruct:Q4_K_M
   ```
   Sprawdź, czy model jest na liście: `ollama list`

3. **Uruchom aplikację** w katalogu projektu (Ollama musi być włączona):
   ```bash
   npm run bielik
   ```

4. **Otwórz w przeglądarce** [http://localhost:3001](http://localhost:3001)

Inny model Ollama możesz wskazać zmienną `OLLAMA_MODEL`, a inny port zmienną `PORT`, np.:
```bash
OLLAMA_MODEL=inny-model PORT=4000 npm run bielik
```

Serwer przed startem sprawdza, czy Ollama działa (`http://127.0.0.1:11434`) i czy model jest pobrany. Jeśli nie, wypisze, co zrobić.

### Wariant 2: bez AI

Skopiuj `js/config.example.js` jako `js/config.js` i otwórz `index.html` w przeglądarce. Działa wszystko poza asystentem AI: rozmowa korzysta z lokalnego parsera, a asystent z uproszczonych odpowiedzi.

### Demo online (Render)

Demo dla jury działa jako usługa na [render.com](https://render.com) (Web Service, Node): Build Command `npm install`, Start Command `npm start`, zmienne środowiskowe `GEMINI_API_KEY` i `GEMINI_MODEL` (asystent online korzysta z Gemini API). Serwer sam rozpoznaje Render: słucha na porcie z `PORT` i przyjmuje adres usługi z `RENDER_EXTERNAL_HOSTNAME`. Bielik działa tylko lokalnie, bo wymaga Ollama.

## Struktura projektu

| Plik | Zawartość |
|---|---|
| `index.html`, `css/style.css` | strona i style |
| `assets/` | logo |
| `js/01-narzedzia.js` | daty, kwoty, parametry kalkulatora (`CFG`), opisy reguł |
| `js/02-profile.js` | profile testowe z symulowanymi danymi ZUS |
| `js/03-formularz.js` | stan aplikacji i pytania rozmowy |
| `js/04-zadluzenie.js` | zadłużenie w składkach |
| `js/05-reguly.js` | silnik reguł i kalkulator |
| `js/06-ekrany-startowe.js` | menu, wybór profilu, logowanie, pulpit |
| `js/07-parser.js` | rozumienie odpowiedzi pisanych z klawiatury |
| `js/08-ai.js` | połączenie z modelem AI |
| `js/09-czat.js`, `js/10-panel.js` | rozmowa i panel (wniosek, wynik, profil, reguły) |
| `js/11-linki-wsparcie.js` | linki i organizacje wsparcia |
| `js/12-ezus.js`, `js/13-odpis-aktu.js` | symulacja eZUS, e-ZLA i odpisu aktu urodzenia |
| `js/14-widoki.js` | kalendarz, dokumenty, moje wnioski, pomoc |
| `js/15-asystent.js` | asystent AI i jego narzędzia |
| `js/16-sprawa-pdf.js` | sprawa z PDF |
| `js/17-wniosek-pobieranie.js` | wniosek do pobrania (.docx, .html) |
| `js/18-start.js` | start aplikacji |
| `server.cjs` | serwer lokalny (localhost) z Gemini API |
| `server-bielik.cjs` | serwer lokalny (localhost) z Bielikiem przez Ollama |
| `ZUS_swiadczenia_wymagania_reguly.xlsx` | świadczenia, wymagania konkursu i reguły powiązań |

## Komponenty zewnętrzne

- **Bielik 11B v3.0 Instruct** (SpeakLeash), uruchamiany lokalnie przez **Ollama**
- **Gemini API** (Google), opcjonalnie
- **Lato** (Google Fonts), licencja SIL Open Font License 1.1
- **PDF.js** (Mozilla), licencja Apache 2.0, ładowany z cdnjs tylko przy odczycie PDF
- **JSZip**, licencja MIT, ładowany z cdnjs tylko przy pobieraniu wniosku jako .docx

## Ograniczenia

- Parametry kalkulatora trzeba zweryfikować z załącznikiem ZUS.
- Kwoty są orientacyjne: podstawa = wynagrodzenie brutto minus 13,71% składek.
- Stan aplikacji nie jest zapisywany po odświeżeniu strony.
- Repozytorium nie zawiera dokumentów ani spraw udostępnionych przez ZUS.
