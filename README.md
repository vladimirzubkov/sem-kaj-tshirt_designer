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

- **Výběr barvy**: Uživatel může vybrat barvu prostřednictvím `<input type="color">`, která se dynamicky aplikuje na nástroje tužka, štětec a text. Barva je aktualizována v reálném čase při změně výběru barvy nebo přepnutí nástроje. Nástроje guma a vода mají pevně dané chовání а nejsou ovlivněny výběrem barvy.
- **Čištění plátna**: Tlačítko "Clear" umožňuje uživateli vymazat veškerý obsah plátna, resetuje jej do původního stavu.

**Struktura kódu**:

- **JavaScript**: Rozdělen do dvou modulů: `tools.js` obsahuje třídy nástrojů (Tool, Pencil, Brush, Eraser, Water, TextTool), a `main.js` obsahuje logiku aplikace (inicializace, zpracování událostí). Modul `main.js` importuje třídy z `tools.js` a je připojen v `index.html` pomocí `<script type="module">`.
- **CSS**: Všechny styly jsou vyňaty z `index.html` do samostatného souboru `styles/style.css` pro lepší organizaci a údržbu. Soubor je připojen v `index.html` pomocí `<link rel="stylesheet">`.

## Plánované funkce

- Přenos návrhu na 3D model trička.
- Uložení a načítání návrhu.
- Export do PDF a odeslání e-mailem.