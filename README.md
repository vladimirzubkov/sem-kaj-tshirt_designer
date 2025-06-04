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
- Výstup: Stáhnout PDF, odeslat e-mailem, uložit/načíst projekt jako JSON, odeslat objednávku s PDF.

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
  - Přenos návrhu z plátna (375x500 px) na tričko (213x284 px) pomocí efektů:
    - **Razítko**: Přímý přenos návrhu, přidává na stávající obsah.
    - **Rozprašovač**: Přidává 25 kapek každých 0,1 s (poloměr 1–5 px) na neprůhledné části, max. 5000 kapek za 20 s.
    - **Válec**: Dvě vrstvy s 50% průhledností a 2% zkreslením (mřížka 10x10), druhá po 1 s.
    - **Míchačka**: Až 5 deformací (merge, twistCW, twistCCW, inflate, deflate, gridWarp) po 1 s, s přerušením.
    - **Šreder**: Až 7 kroků rozřezávání (5x5 až 7x7 fragmentů) po 1 s, s rotací a deformací.
  - Efekty jsou ukládány do historie pouze po dokončení nebo přerušení (kromě razítka).
  - Optimalizováno pomocí `canvasPool.js` pro opětovné použití pláten.

- **Uložení a načítání návrhu**:
  - Ukládání projektu do JSON přes tlačítko "Save Project", načítání z JSON přes "Load Project".
  - JSON obsahuje design hlavního plátna (`drawCanvas`) a data začatých fasónů (velikost, barva trička, barva pozadí, vlastní barva pozadí, design trička). Prázdné fasóny se neukládají.
  - Při ukládání je možné zadat název souboru, při nevyplnění se použije formát `t-shirt-design-yymmdd-hh-mm.json`.
  - Akce uložení a načítání jsou integrovány do historie pro Undo/Redo.
  - Ukládání designu jako PNG z plátna pro kreslení (`drawCanvas`) do localStorage pod klíčem `tshirtDesignPNG` přes tlačítko "Save Design". Při načtení stránky se PNG načítá zpět na plátno pro kreslení, což umožňuje pokračovat v úpravách.

- **Export do PDF a odeslání e-mailem**:
  - **Export do PDF**: Tlačítko "Download PDF" exportuje návrhy všech neprázdných fasónů do PDF (A3 formát) přes `jsPDF`. Každý fasón má samostatnou stránku s textem (styl, velikost, barvy), náhledy barev, škálovaným obrazem trička, typografickými značkami a měřítkem.
  - **Forma objednávky**: Tlačítko "Order T-Shirts" otevírá formulář, který dynamicky zobrazuje pouze fasóny s neprázdnými designy. Uživatel zadá email a množství pro každý fasón a velikost. Při odeslání (`submit`) se generují PDF pro každý fasón (Data URL) a ukládají do `orderData.designs`, spolu s emailem a množstvím. Data jsou logována do konzole, simulujíc odeslání na server.
  - Simulace odeslání e-mailem (mailto odkaz s PNG), integrovaná do historie.

- **Struktura kódu**:
  - **JavaScript**: Rozděleno do modulů:
    - `main.js`: Hlavní logika a inicializace.
    - `tools.js`: Třídy nástrojů (`Tool`, `Pencil`, `Brush`, `Eraser`, `Water`, `TextTool`).
    - `cursorManager.js`: Generování kurzorů.
    - `historyManager.js`: Správa historie akcí.
    - `effectManager.js`, `stampEffect.js`, `sprayEffect.js`, `rollEffect.js`, `mixerEffect.js`, `shredderEffect.js`: Logika efektů.
    - `progressManager.js`: Zobrazení průběhu efektů.
    - `projectManager.js`: Ukládání, načítání, export PDF, e-mail, JSON projekty.
    - `canvasManager.js`: Zpracování událostí plátna.
    - `toolManager.js`, `colorManager.js`, `sizeManager.js`, `effectManagerUI.js`, `canvasPool.js`, `shirtCanvasManager.js`: Modulární UI logika.
    - `logger.js`: Podmíněné logování.
    - `shirtColors.js`: Definice barev triček.
  - **CSS**: Rozděleno do `base.css`, `layout.css`, `components.css`, `shirt.css` pro lepší organizaci, připojeno přes `<link>` v `index.html`.

## Plánované funkce

- Implementace skutečného 3D modelu trička (např. pomocí Three.js).
- Přidání zvukových efektů pro efekty přenosu (razítko, rozprašovač, válec, míchačka, šreder).
- Vylepšení správy barev triček v `shirtColors.js` pro opravu nesprávných barev a zajištění nezávislosti ukládání na změny barev.
- Rozšíření funkcionality tlačítka "Remember and Save Design" pro další možnosti ukládání.

## Historie změn

- **Navigace mezi obrazovkami (4. června 2025)**:
  - Upraven `index.html` pro zahrnutí obrazovek Nastavení a O aplikaci.
  - Aktualizován `layout.css` pro přechody mezi obrazovkami a správu viditelnosti.
  - Přidán `screenManager.js` pro logiku přepínání obrazovek.
  - Aktualizován `main.js` pro inicializaci navigace mezi obrazovkami.
  - Aktualizován `README.md` s popisem nových funkcí.

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
  - Zamezeno duplikaci `colorPicker` v `uiManager.js` při opakovaném volání `initUI` po načtení JSON.
  - Zamezeno ovlivňování pozadí color pickerem pro kreslení v `updateCustomColors`.
  - Přejmenována tlačítka fasónů v `index.html` (Male → Man, Female → Woman).
  - Upraveno rozložení tlačítek efektů (horizontální) a tlačítek Save/Clear (vertikální v horizontálním řádku).

- **Uložení a načítání projektu**:
  - Přidáno ukládání projektu do JSON přes tlačítko "Save Project" s volitelným názvem souboru nebo výchozím formátem `t-shirt-design-yymmdd-hh-mm.json`.
  - Implementováno načítání projektu z JSON přes tlačítko "Load Project", obnovující hlavní plátno, fasóny, velikosti, barvy a designy triček. Použito `Promise.all` pro asynchronní načítání všech pláten, zajišťující konzistentní obnovu UI.
  - Prázdné fasóny se při ukládání ignorují, UI se po načtení automaticky aktualizuje voláním `initUI`.
  - Opraveno načítání JSON v `projectManager.js` zajištěním správného přepnutí fasónu (`switchStyle`) a aktualizací DOM pro zachování obnovených pláten.
  - Přidána podpora načítání SVG, PNG, GIF, JPG obrázků na hlavní plátno přes tlačítko "Load Project", s automatickým škálováním a centrováním.
  - Uložení PNG z plátna pro kreslení: Tlačítko "Save Design" nyní ukládá obsah plátna pro kreslení (`drawCanvas`) jako PNG do localStorage pod klíčem `tshirtDesignPNG`. Při načtení stránky se uložený PNG načítá zpět na plátno pro kreslení, což umožňuje uživatelům pokračovat v úpravách designu.

- **Export do PDF a forma objednávky**:
  - Vylepšen export PDF v `projectManager.js` pro vícestránkový výstup (jedna stránka na neprázdný fasón) ve formátu A3. Tlačítko "Download PDF" ukládá soubor `shirt-designs.pdf` s designy všech neprázdných fasónů.
  - Přidána forma objednávky přes tlačítko "Order T-Shirts", která dynamicky generuje formulář s neprázdnými fasóny. Formulář obsahuje pole pro email a množství (XXL, XL, L, M, S) pro každý fasón. Při odeslání se generují PDF (Data URL) pro každý fasón a ukládají do `orderData.designs`, logována do konzole.
  - Přidána centrována textová řádka s tučným písmem pro fasón, velikost, barvu trička a pozadí.
  - Přidány obdélníky (20x10 mm) pro náhled barev trička a pozadí na pravém okraji (180 mm od levého okraje) s šedým rámečkem (#808080, 0.5 mm) a šachovnicovým vzorem pro transparentní pozadí.
  - Obraz trička je škálován podle fasónu (mužský: 1, ženský: 0.9, dětský: 0.7), s typografickými značkami a textem měřítka.
  - Opraveno kódování textu v PDF použitím fontu Helvetica s podporou UTF-8.

- **Opravy chyb a robustnost**:
  - Odstraněny varování `willReadFrequently` použitím `createOptimizedContext` a dočasných pláten.
  - Opraveno duplikování historie časovým filtrem (100ms) a omezením ukládání efektů (1s).
  - Opraveny importy (`saveCanvasState`), syntaxe (`effectManagerUI.js`, `uiManager.js`) a reference (`canvasPool.js`).
  - Opraveno nesprávné přiřazení událostí v `main.js`, odstraněna reference na neexistující `loadDesignButton`, zajištěna správná inicializace nástrojů a efektů.
  - Dynamická inicializace formy objednávky v `openOrderModal` pro aktuální kontrolu neprázdných pláten.

## Hodnocení implementace

Projekt splňuje většinu povinných a část nepovinných požadavků dle kritérií hodnocení:

### Povinné požadavky (11/11 bodů)
- **Dokumentace (1/1)**: Kompletní popis v `README.md`, komentáře v kódu.
- **HTML5 (2/2)**:
  - **Validita HTML5 (1/1)**: Ověřeno přes https://validator.w3.org.
  - **Sémantické značky**: Použity `header`, `main`, `footer`, `nav`, `section`.
- **CSS (3/3)**:
  - **Pokročilé selektory**: Pseudotřídy (`.tool-icon.selected`), kombinátory.
  - **Přechovy/animace**: Přechovy pro `.tool-icon`, progress bar.
- **JavaScript (5/5)**:
  - **OOP přístup**: Třídy s dědičností, moduly.
  - **Pokročilé API**: Drag & Drop, File API, History API, Canvas API.

### Nepovinné požadavky (14.5+?/25 bodů)
- **HTML5**:
  - **Podpora prohlížečů**: Kompatibilita s Chrome, Firefox, Edge, Opera.
  - **Grafika**: Canvas plně implementován, SVG jako obrázek.
  - **Média**: Zvuky neimplementovány.
  - **Formuláře**: `<input type="color">`, `<input type="radio">`, `<input type="file">`, formulář objednávky s validací.
  - **Offline aplikace**: Neimplementováno.
- **CSS**:
  - **Vendor prefix**: Nepotřebné.
  - **Transformace 2D/3D**: Pouze `translateX` pro `.size-value`.
  - **Media queries**: Adaptivní design pro 1000px, 820px, 500px.
- **JavaScript**::
  - **Frameworky**: Nepoužity.
  - **History API**: Plně implementováno.
  - **Media API**: Zvuky neimplementovány.
  - **Práce s SVG přes JS**: SVG jako obrázek.
  - **Offline aplikace**: Neimplementováno.
- **Ostatní**:
  - **Kompletnost řešení**: Většina funkcí implementována, včetně formy objednávky, chybí 3D model a zvuky.
  - **Estetické zpracování**: Funkční UI s kurzy, adaptivitou, barevným výběrem, formulářem.

### Celkové hodnocení
- **Povinné požadavky: 11/11 bodův.
- **Nepovinné požadavky**: 14.5+?/25 bodů.
- **Celkem**: 25.5+?/36 bodů.