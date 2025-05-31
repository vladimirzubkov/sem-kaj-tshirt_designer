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
- Proces: Kreslíme na plátно, poté přeneseme на tričko pomocí nástrojů (válec, rozprašovač, šejkr, šreddr).
- Výstup: Stáhnout PDF nebo odeslat e-mailem.

## Implementované funkce
- **Výběr barvy**: Uživatel může vybrat barvu prostřednictvím `<input type="color">`, která se dynamicky aplikuje на nástroje tužка, štětec a text. Barva je aktualizována v reálném čase při změně výběru barвы nebo přepnutí nástроje. Nástроje guma а voda mají pevně dané chовání a nejsou ovlivněny výběрем barвы.
- **Čištění plátна**: Tlačítko "Clear" umožňuje uživateli vymazat veškerý obsah plátна, resetując jej do původního stavu.
- **Výběr nástrojů**: Nástроje (tužка, štětec, text, guma, voda) jsou identifikovány pomocí atributů `data-tool` na prvcích rozhraní, což zajišťuje spolehlivé a škálovatelné přepínání nástrojů.
- **Struktura kódu**:
  - **JavaScript**: Rozdělen do dvou modulů: `tools.js` obsahuje třídy nástrojů (Tool, Pencil, Brush, Eraser, Water, TextTool), a `main.js` obsahuje logiku aplikace (inicializace, zpracování událostí). Modul `main.js` importuje třídy z `tools.js` a je připojen v `index.html` pomocí `<script type="module">`. Kód byl refaktorován pro odstranění nepoužívaných proměnných, aby byl čistší a lépe udržovatelný.
  - **CSS**: Všechny styly jsou vyňaty z `index.html` do samostatného souboru `styles/style.css` pro lepší organizaci a údržbu. Soubor je připojen v `index.html` pomocí `<link rel="stylesheet">`.

## Plánované funkce
- Výběr velikosti nástrojů.
- Nahrávání obrázků na plátно.
- Přenos návrhu na 3D model trička.
- Uložení a načítání návrhu.
- Export do PDF a odeslání e-mailem.