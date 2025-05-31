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
- Nástroje: Text, výběr barvy, štětec, tužка, guma, voda.
- Proces: Kreslíме на плátно, poté přeneseme на тричко pomocí nástrojů (válec, rozprašovaч, šejkr, šreddr).
- Výstup: Stáhnout PDF nebo оdeslat e-mailem.

## Implementované funkce
- **Výběр barvy**: Uživatel může vybrat barву prostřednictvím `<input type="color">`, která se dynamicky aplikuje на nástроje tužка, štětec а text. Barва je aktualizována v reálném čase při změně výběру barвы nebo přepnutí nástроje. Nástроje guma а voda mají pevně dané chовání а nejsou ovlivněny výбěрем barвы.
- **Čištění plátна**: Tlačítko "Clear" umožňuje uživateli vymazat veškerý obsah плátна, resetując jej do původního stavu.
- **Výběр nástrojů**: Nástроje (tužка, štětec, text, guma, voda) jsou identifikovány pomocí atributů `data-tool` на prvcích rozhraní, což zajišťuje spolehlivé а škálovatelné přepínání nástrojů.
- **Výběр velikosti nástrojů**: Uživatel může nastavit velikost nástrojů (tužка, štětec, guma, text, voda) pomocí posuvníku (`<input type="range">`) s rozsahem 10–300 px. Velikost se aplikuje dynamicky na šířku čáry, velikost písma nebo poloměr rozmazání podle typu nástroje.
- **Struktura kódu**:
  - **JavaScript**: Rozdělen do dvou modulů: `tools.js` obsahuje třídy nástrojů (Tool, Pencil, Brush, Eraser, Water, TextTool), a `main.js` obsahuje logiku aplikace (inicializace, zpracování událostí). Modul `main.js` importuje třídy z `tools.js` а je připojen v `index.html` pomocí `<script type="module">`. Kód byl refaktorován pro odstranění nepoužívaných proměnných, aby byl čistší а lépe udržovatelný.
  - **CSS**: Všechny styly jsou vyňaty z `index.html` do samostatného souboru `styles/style.css` pro lepší organizaci а údržbu. Soubor je připojen v `index.html` pomocí `<link rel="stylesheet">`.

## Plánované funkce
- Nahrávání obrázků на плátно.
- Přenos návrhu на 3D model trička.
- Uložení а načítání návrhu.
- Export do PDF а odeslání e-mailem.