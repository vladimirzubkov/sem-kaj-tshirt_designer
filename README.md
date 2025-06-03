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

- Plátno vlevo, zobrazení trička vpravo, menu s nástroji dole.
- Nástroje: Text, výběr barvy, štětec, tužka, guma, voda.
- Proces: Kreslíme na plátno, poté přeneseme na tričko pomocí efektů (razítko, rozprašovač, válec, míchačka, šreder).
- Výstup: Stáhnout PDF nebo odeslat e-mailem.

## Implementované funkce

- **Výběr barvy**:
  - Uživatel může vybrat barvu prostřednictvím `<input type="color">` pro kreslení, která se dynamicky aplikuje na nástroje tužka, štětec a text. Barva je aktualizována v reálném čase při změně výběru nebo přepnutí nástroje. Nástroje guma a voda nejsou ovlivněny výběrem barvy.
  - Samostatný `<input type="color">` pro výběr barvy pozadí trička (transparentní, bílá, šedá, vlastní). Výchozí barva vlastního pozadí je `#E22222`, s možností uložení vybrané barvy pro každý fasón (mužský, ženský, dětský).
  - Výběr barvy trička a pozadí je implementován pomocí dynamicky generovaných kruhových prvků (`.color-circle`) s interaktivními klikacími událostmi, které aktualizují barvu v reálném čase.

- **Čištění plátna**: Tlačítko "Clear" vymaže obsah plátna a resetuje jeho původní stav, s uložením akce do historie.

- **Výběr nástrojů**: Nástroje (tužka, štětec, text, guma, voda) jsou identifikovány pomocí atributů `data-tool`, což zajišťuje spolehlivé přepínání. Aktuální nástroj je zvýrazněn zvětšenou ikonou a oranžovým rámečkem.

- **Výběr velikosti nástrojů**:
  - Posuvník (`<input type="range">`) s rozsahem 1–300 px (výchozí 10 px) nastavuje velikost nástrojů. Velikost se aplikuje na šířku čáry (tužka, štětec, guma), velikost písma (text) nebo poloměr rozmazání (voda).
  - Aktuální velikost je zobrazena nad posuvníkem, přesně sleduje pozici ukazatele, s inicializací a popisky "1px" a "300px".

- **Popisky nástrojů**: Popisky ("Pencil", "Brush", "Text", "Water", "Eraser") pod nástroji jsou generovány dynamicky z `tools.js`, zvyšují srozumitelnost rozhraní.

- **Vylepšené uživatelské rozhraní**:
  - Ikona nástroje Text je výrazný symbol "𝐓".
  - Popisky "Color" a "Brush Size" jsou zarovnány s popisky nástrojů, všechny kontejnery mají jednotnou výšku 76px.
  - Prvky ovládání (posuvník, výběr barvy) jsou v samostatných kontejnerech (`.control-element`, `.control-label`) pro flexibilní stylování.
  - Tlačítka efektů (razítko, rozprašovač, válec, míchačka, šreder) jsou horizontálně centrovaná, tlačítka "Save" a "Clear" jsou vertikálně zarovnaná v horizontálním řádku s textovým zalomením.
  - Kontejner trička (`.shirt-container`) má šířku 65% rodiče, výšku 300px, je centrovaný s flex zobrazením.
  - Color picker pro pozadí má výrazný oranžový puntíkovaný rámeček (2px dashed #ff4500) s efektem při najetí (#ffa500).

- **Zobrazení kurzoru nástrojů**:
  - Kreslicí nástroje mají kruhový kurzor odpovídající velikosti nástroje, textový nástroj má svislou čáru s výstupky.
  - Kurzor je červený při velikosti 128 px a více, jinak černý, aktualizuje se dynamicky při změně velikosti.

- **Nahrávání obrázků na plátno**:
  - Drag-and-drop pro SVG, PNG, GIF, JPG obrázky. Menší obrázky se zobrazují v místě přetažení, větší se škálují a centrovány.
  - Plátno je při přetahování zvýrazněno modrým rámečkem a světle modrým pozadím.

- **Historie akcí (Undo/Redo)**:
  - Podpora Undo (Ctrl+Z) a Redo (Ctrl+Y), synchronizovaná s historií prohlížeče.
  - Akce (kreslení, text, obrázky, čištění, přenos na tričko) jsou ukládány s popisy (např. "Draw with Pencil", "Transfer Design to Shirt").
  - Historie je optimalizována proti duplicitním stavům (100ms časový filtr) a rychlým efektům (1s filtr).

- **Výběr fasónu a barev trička**:
  - Podpora výběru fasónu (mužský, ženský, dětský) s dynamickým přepínáním v `shirtCanvasManager.js`.
  - Výběr barev trička podle fasónu definovaných v `shirtColors.js`, s automatickou inicializací při načtení stránky.
  - Výběr barvy pozadí (transparentní, bílá, šedá, vlastní) s persistentním ukládáním vlastní barvy (`customBackgroundColor`) pro každý fasón.

- **Přenos návrhu na tričko**:
  - Přenos návrhu z plátna (500x500 px) na tričko (213x284 px) pomocí efektů:
    - **Razítko**: Přímý přenos návrhu, přidává na stávající obsah.
    - **Rozprašovač**: Přidává 25 kapek každých 0,1 s (poloměr 1–5 px) na neprůhledné části, max. 5000 kapek za 20 s.
    - **Válec**: Dvě vrstvy s 50% průhledností a 2% zkreslením (mřížka 10x10), druhá po 1 s.
    - **Míchačka**: Až 5 deformací (merge, twistCW, twistCCW, inflate, deflate, gridWarp) po 1 s, s přerušením.
    - **Šreder**: Až 7 kroků rozřezávání (5x5 až 7x7 fragmentů) po 1 s, s rotací a deformací.
  - Efekty jsou ukládány do historie pouze po dokončení nebo přerušení (kromě razítka).
  - Optimalizováno pomocí `canvasPool.js` pro opětovné použití pláten.

- **Uložení a načítání návrhu**:
  - Ukládání do PNG přes tlačítko "Save Design", načítání z PNG přes "Load Design".
  - Akce jsou integrovány do historie pro Undo/Redo.

- **Export do PDF a odeslání e-mailem**:
  - Export návrhu do PDF přes `jsPDF` s titulkem "T-Shirt Design".
  - Simulace odeslání e-mailem (stahování PDF s upozorněním), integrovaná do historie.

- **Struktura kódu**:
  - **JavaScript**: Rozděleno do modulů:
    - `main.js`: Hlavní logika a inicializace.
    - `tools.js`: Třídy nástrojů (`Tool`, `Pencil`, `Brush`, `Eraser`, `Water`, `TextTool`).
    - `cursorManager.js`: Generování kurzorů.
    - `historyManager.js`: Správa historie akcí.
    - `effectManager.js`, `stampEffect.js`, `sprayEffect.js`, `rollEffect.js`, `mixerEffect.js`, `shredderEffect.js`: Logika efektů.
    - `progressManager.js`: Zobrazení průběhu efektů.
    - `projectManager.js`: Ukládání, načítání, export PDF, e-mail.
    - `canvasManager.js`: Zpracování událostí plátna.
    - `toolManager.js`, `colorManager.js`, `sizeManager.js`, `effectManagerUI.js`, `canvasPool.js`, `shirtCanvasManager.js`: Modulární UI logika.
    - `logger.js`: Podmíněné logování.
    - `shirtColors.js`: Definice barev triček.
  - **CSS**: Rozděleno do `base.css`, `layout.css`, `components.css`, `shirt.css` pro lepší organizaci, připojeno přes `<link>` v `index.html`.

## Plánované funkce

- Implementace skutečného 3D modelu trička (např. pomocí Three.js).
- Rozšíření výběru o velikosti triček (XXL, XL, L, M, S).
- Přidání zvukových efektů pro efekty přenosu (razítko, rozprašovač, válec, míchačka, šreder).

## Historie změn

- **Počáteční ladění a optimalizace**:
  - Centralizována správa událostí myši v `canvasManager.js`, přidáno logování pro nástroje a plátno.
  - Nahrazeno `console.log` podmíněným logováním v `logger.js` s úrovněmi `debug`, `info`, `warn`, `error`.

- **Modularizace a optimalizace kódu**:
  - Vytvořena třída `DrawingTool` v `tools.js` pro snížení duplicity kódu.
  - Sloučeny `exportManager.js` a `projectManager.js` do `projectManager.js` s vylepšeným exportem PDF.
  - Přidány utility `createOptimizedContext`, `countNonZeroPixels`, `isCanvasEmpty` v `effectManager.js`.
  - Rozdělena `uiManager.js` do modulů (`toolManager.js`, `colorManager.js`, apod.) pro lepší údržbu.

- **Vylepšení plátna a efektů**:
  - Nahrazeny přímé reference na `shirtCanvas` voláním `getCurrentShirtCanvas` z `shirtCanvasManager.js`.
  - Přidán `canvasPool.js` pro opětovné použití pláten, optimalizující paměť.
  - Zamezeno vícenásobným aplikacím efektů pomocí `isEffectActive` a asynchronního `transferDesignToShirt`.
  - Přidán typ `gridWarp` do `mixerEffect.js`, zajištěna sekvenční aplikace deformací a ukládání při přerušení.
  - Odebrány nepoužívané zvukové placeholdery z `effectManager.js`.

- **Vylepšení barev a rozhraní**:
  - Rozdělen `style.css` na `base.css`, `layout.css`, `components.css`, `shirt.css`, přidána třída `debug-border`.
  - Implementován výběr barev trička a pozadí v `colorManager.js`, s persistentními barvami pro každý fasón.
  - Opraveno počáteční zobrazení barev nahrazením `switchStyle('man')` voláním `updateShirtColorOptions('man')`.
  - Nahrazen kruh pro vlastní barvu pozadí `<input type="color">` s výchozí barvou `#E22222` a oranžovým puntíkovaným rámečkem.
  - Zamezeno ovlivňování pozadí color pickerem pro kreslení v `updateCustomColors`.
  - Přejmenována tlačítka fasónů v `index.html` (Male → Man, Female → Woman).
  - Upraveno rozložení tlačítek efektů (horizontální) a tlačítek Save/Clear (vertikální v horizontálním řádku).

- **Opravy chyb a robustnost**:
  - Odstraněny varování `willReadFrequently` použitím `createOptimizedContext` a dočasných pláten.
  - Opraveno duplikování historie časovým filtrem (100ms) a omezením ukládání efektů (1s).
  - Opraveny importy (`saveCanvasState`), syntaxe (`effectManagerUI.js`, `uiManager.js`) a reference (`canvasPool.js`).

## Hodnocení implementace

Projekt splňuje většinu povinných a část nepovinných požadavků dle kritérií hodnocení:

### Povinné požadavky (11/11 bodů)
- **Dokumentace (1/1)**: Kompletní popis v `README.md`, komentáře v kódu.
- **HTML5 (2/2)**:
  - **Validita HTML5 (1/1)**: Ověřeno přes https://validator.w3.org.
  - **Sémantické značky (1/1)**: Použity `header`, `main`, `footer`, `nav`, `section`.
- **CSS (3/3)**:
  - **Pokročilé selektory (1/1)**: Pseudotřídy (`.tool-icon.selected`), kombinátory.
  - **Přechody/animace (2/2)**: Přechody pro `.tool-icon`, progress bar.
- **JavaScript (5/5)**:
  - **OOP přístup (2/2)**: Třídy s dědičností, moduly.
  - **Pokročilé JS API (3/3)**: Drag & Drop, File API, History API, Canvas API.

### Nepovinné požadavky (12.5+?/25 bodů)
- **HTML5 (5/8)**:
  - **Podpora prohlížečů (2/2)**: Kompatibilita s Chrome, Firefox, Edge, Opera.
  - **Grafika (2/2)**: Canvas plně implementován, SVG jako obrázek.
  - **Média (0/1)**: Zvuky neimplementovány.
  - **Formuláře (1/2)**: `<input type="color">`, `<input type="range">` s validací.
  - **Offline aplikace (0/1)**: Neimplementováno.
- **CSS (3.5/5)**:
  - **Vendor prefix (0/1)**: Nepotřebné.
  - **Transformace 2D/3D (0.5/2)**: Pouze `translateX` pro `.size-value`.
  - **Media queries (2/2)**: Adaptivní design pro 1000px, 820px, 500px.
- **JavaScript (4/7)**:
  - **Frameworky (0/1)**: Nepoužity.
  - **History API (2/2)**: Plně implementováno.
  - **Media API (0/1)**: Zvuky neimplementovány.
  - **Práce s SVG přes JS (1/2)**: SVG jako obrázek.
  - **Offline aplikace (0/1)**: Neimplementováno.
- **Ostatní (0+?/5)**:
  - **Kompletnost řešení (?/3)**: Většina funkcí implementována, chybí 3D model a zvuky.
  - **Estetické zpracování (?/2)**: Funkční UI s kurzory, adaptivností, barevným výběrem.

### Celkové hodnocení
- **Povinné požadavky**: 11/11 bodů.
- **Nepovinné požadavky**: 12.5+?/25 bodů.
- **Celkem**: 23.5+?/36 bodů.