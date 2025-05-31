# T-Shirt Designer: Semestrální práce pro B0B39KAJ

## Téma
Návrh grafiky pro trička online.

## Popis nápadu projektu
Vytvořit webovou stránku pro online návrh trička s možností:
- Nahrávání SVG a rastrových obrázků.
- Základní kreslení.
- Vkládání textu.
- Uložení stavu a pokračování v práci.
- Odeslání nebo stažení výsledku.

## Rozhraní
- Plátno vlevo, 3D model trička vpravo, menu s nástroji dole.
- Nástroje: Text, výběr barvy, štětec, tužka, guma, voda.
- Proces: Kreslíme na plátno, poté přeneseme na tričko pomocí nástrojů (válec, rozprašovač, šejkr, šreddr).
- Výstup: Stáhnout PDF nebo odeslat e-mailem.

## Implementované funkce
- **Výběr barvy**: Uživatel může vybrat barvu prostřednictvím `<input type="color">`, která se dynamicky aplikuje na nástroje tužka, štětec a text. Barva je aktualizována v reálném čase při změně výběru barvy nebo přepnutí nástroje. Nástroje guma a voda mají pevně dané chování a nejsou ovlivněny výběrem barvy.
- **Čištění plátna**: Tlačítko "Clear" umožňuje uživateli vymazat veškerý obsah plátna, resetujíc jeho původní stav.
- **Výběr nástrojů**: Nástroje (tužka, štětec, text, guma, voda) jsou identifikovány pomocí atributů `data-tool` na prvcích rozhraní, což zajišťuje spolehlivé a škálovatelné přepínání nástrojů.
- **Výběr velikosti nástrojů**: Uživatel může nastavit velikost nástrojů (tužka, štětec, guma, text, voda) pomocí posuvníku (`<input type="range">`) s rozsahem 1–300 px a výchozí hodnotou 10 px. Velikost se dynamicky aplikuje na šířku čáry (tužka, štětec, guma), velikost písma (text) nebo poloměr rozmazání (voda) podle typu nástroje. Aktuální velikost je zobrazena nad posuvníkem a přesně sleduje pozici jeho "thumb" (ukazatele), včetně inicializace. Pod posuvníkem jsou uvedeny hodnoty "1px" a "300px" pro lepší orientaci.
- **Popisky nástrojů**: Pod každým nástrojem (tužka, štětec, text, voda, guma) je zobrazen popisek ("Pencil", "Brush", "Text", "Water", "Eraser"), který zvyšuje srozumitelnost rozhraní.
- **Struktura kódu**:
  - **JavaScript**: Rozdělen do dvou modulů: `tools.js` obsahuje třídy nástrojů (Tool, Pencil, Brush, Eraser, Water, TextTool) a `main.js` obsahuje logiku aplikace (inicializace, zpracování událostí). Modul `main.js` importuje třídy z `tools.js` a je připojen v `index.html` pomocí `<script type="module">`. Kód byl refaktorován pro odstranění nepoužívaných proměnných, aby byl čistší a lépe udržovatelný.
  - **CSS**: Všechny styly jsou vyňaty z `index.html` do samostatného souboru `styles/style.css` pro lepší organizaci a údržbu. Soubor je připojen v `index.html` pomocí `<link rel="stylesheet">`.

## Plánované funkce
- Nahrávání obrázků na plátno.
- Přenos návrhu na 3D model trička.
- Uložení a načítání návrhu.
- Export do PDF a odeslání e-mailem.