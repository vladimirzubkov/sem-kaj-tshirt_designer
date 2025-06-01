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
- Proces: Kreslíme na plátno, poté přeneseme na tričko pomocí nástrojů (rozprašovač, válec, šejkr, šreddr).
- Výstup: Stáhnout PDF nebo odeslat e-mailem.

## Implementované funkce
- **Výběr barvy**: Uživatel může vybrat barvu prostřednictvím `<input type="color">`, která se dynamicky aplikuje na nástroje tužka, štětec a text. Barva je aktualizována v reálném čase při změně výběru barvy nebo přepnutí nástroje. Nástroje guma a voda mají pevně dané chování a nejsou ovlivněny výběrem barvy.
- **Čištění plátna**: Tlačítko "Clear" umožňuje uživateli vymazat veškerý obsah plátna, resetujíc jeho původní stav.
- **Výběr nástrojů**: Nástroje (tužka, štětec, text, guma, voda) jsou identifikovány pomocí atributů `data-tool` na prvcích rozhraní, což zajišťuje spolehlivé a škálovatelné přepínání nástrojů.
- **Výběr velikosti nástrojů**: Uživatel může nastavit velikost nástrojů (tužka, štětec, guma, text, voda) pomocí posuvníku (`<input type="range">`) s rozsahem 1–300 px a výchozí hodnotou 10 px. Velikost se dynamicky aplikuje na šířku čáry (tužka, štětec, guma), velikost písma (text) nebo poloměr rozmazání (voda) podle typu nástroje. Aktuální velikost je zobrazena nad posuvníkem a přesně sleduje pozici jeho "thumb" (ukazatele), včetně inicializace. Pod posuvníkem jsou uvedeny hodnoty "1px" a "300px" pro lepší orientaci.
- **Popisky nástrojů**: Pod každým nástrojem (tužka, štětec, text, voda, guma) je zobrazen popisek ("Pencil", "Brush", "Text", "Water", "Eraser"), který zvyšuje srozumitelnost rozhraní. Popisky jsou generovány dynamicky z názvů nástrojů definovaných v `tools.js`.
- **Vylepšené uživatelské rozhraní**:
  - Aktuálně vybraný nástroj je vizuálně zvýrazněn zvětšením ikony a oranžovým rámečkem.
  - Ikona nástroje Text byla změněna na výraznější symbol "𝐓".
  - Přidány popisky "Color" a "Brush Size" pod výběr barvy a posuvník velikosti, které jsou zarovnány na úroveň popisků nástrojů.
  - Všechny kontejnery (nástroje, výběr barvy, posuvník velikosti) mají jednotnou výšku 76px.
  - Prvky ovládání (posuvník, výběr barvy) a popisky byly odděleny do samostatných kontejnerů (.control-element, .control-label), což umožňuje jejich nezávislé nastavení přes CSS.
  - Text nad posuvníkem velikosti ("size-value") je nyní umístěn relativně k posuvníku, nikoli k vnějšímu kontejneru, což zajišťuje konzistentní pozici při změnách rozložení.
- **Zobrazení kurzoru nástrojů**:
  - Pro nástroje kreslení (tužka, štětec, guma, voda) je kurzor zobrazen jako kruh, jehož velikost odpovídá nastavené velikosti nástroje.
  - Pro nástroj Text je kurzor zobrazen jako svislá čára s výstupky (serifs) nahoře a dole, přičemž jeho velikost odpovídá velikosti textu.
  - Kurzor se dynamicky mění při změně velikosti nástroje a zůstává viditelný i po opuštění a návratu na plátno.
  - Při dosažení velikosti 128 pixelů a více se kurzor zbarví červeně, jinak je černý.
- **Nahrávání obrázků na plátno**:
  - Implementována funkce drag-and-drop pro nahrávání obrázků (SVG, PNG, GIF, JPG) na plátno.
  - Obrázky menší než plátno (500x500 px) se zobrazují v místě přetažení s původní velikostí.
  - Obrázky větší než plátno se škálují tak, aby větší strana (šířka nebo výška) odpovídala velikosti plátna, a jsou centrovány.
  - Při přetahování je plátno vizuálně zvýrazněno (modrý rámeček a světle modré pozadí).
- **Historie akcí (Undo/Redo)**:
  - Implementována historie akcí s podporou vrácení (Undo) a opakování (Redo) pomocí kláves Ctrl+Z a Ctrl+Y.
  - Historie je synchronizována s historií prohlížeče, což umožňuje použití tlačítek "Zpět" a "Vpřed" v prohlížeči.
  - Každá akce (kreslení, přidání textu, přidání obrázku, vyčištění plátna) je uložena do historie.
  - Zprávy v historii zahrnují použitý nástroj (např. "Draw with Pencil", "Add Text with TextTool") a jsou viditelné v záhlaví stránky a URL fragmentu.
- **Přenos návrhu na 3D model trička**:
  - Implementován přenos návrhu z plátna na zobrazení trička v pravé části rozhraní.
  - Návrh je škálován a centrován na tričku (rozměry 213x284 px).
  - Přenos je spuštěn tlačítky "Stamp", "Spray", "Roll", "Mixer", "Shred":
    - **Stamp**: Přímo přenese návrh z plátna na tričko, přidává jej na stávající obsah trička.
    - **Spray**: Postupně přidává návrh na tričko formou náhodných kapek (25 kapek každých 0,1 sekundy, poloměr 1–5 px), dokud není tlačítko uvolněno nebo nedosáhne maxima (5000 kapek za 20 sekund). Kapky jsou přidávány pouze na neprůhledné části původního návrhu.
    - **Roll**: Přidává dvě vrstvy návrhu na tričko s náhodným zkreslením (2% výšky plátna), každá s průhledností 50%. První vrstva je aplikována okamžitě, druhá po 1 sekundě, pokud je tlačítko stále stisknuto. Zkreslení je generováno na základě mřížky 10x10.
    - **Mixer**: Přidává až 5 vrstev deformací (merge, twistCW, twistCCW, inflate, deflate) na tričko, jednu vrstvu za sekundu, dokud není tlačítko uvolněno.
    - **Shred**: Postupně přidává návrh na tričko formou až 7 kroků "rozřezávání", jeden krok za sekundu, dokud není tlačítko uvolněno. Každý krok zvyšuje počet fragmentů a přidává rotaci a deformaci tvaru.
  - Akce přenosu je uložena do historie, což umožňuje vrácení pomocí Undo (Ctrl+Z).
- **Uložení a načítání návrhu**:
  - Implementováno ukládání návrhu do PNG souboru pomocí tlačítka "Save Design".
  - Implementováno načítání návrhu z PNG souboru pomocí tlačítka "Load Design".
  - Akce uložení a načítání jsou integrovány do historie, což umožňuje vrácení (Undo) a opakování (Redo).
- **Export do PDF a odeslání e-mailem**:
  - Implementován export návrhu do PDF pomocí knihovny `jsPDF` a tlačítka "Download PDF".
  - PDF obsahuje název ("T-Shirt Design") a návrh z plátna.
  - Implementována simulace odeslání PDF e-mailem pomocí tlačítka "Send Email" (v současnosti zobrazí zprávu o "odeslání" a umožní stáhnout PDF, protože není k dispozici serverní část).
  - Akce exportu a odeslání jsou integrovány do historie (Undo/Redo).
- **Struktura kódu**:
  - **JavaScript**: Rozdělen do sedmi modulů:
    - `tools.js` obsahuje třídy nástrojů (Tool, Pencil, Brush, Eraser, Water, TextTool).
    - `cursorManager.js` obsahuje logiku pro generování vlastních kurzorů (kruh pro kreslení, svislá čára s výstupky pro text).
    - `historyManager.js` obsahuje logiku pro správu historie akcí (uložení stavu plátna, Undo, Redo, synchronizace s historií prohlížeče).
    - `effectManager.js` obsahuje logiku pro efekty při přenosu návrhu na tričko (Stamp, Spray, Roll, Mixer, Shred).
    - `progressManager.js` obsahuje logiku pro zobrazení průběhu efektů (progress bar).
    - `stampEffect.js`, `sprayEffect.js`, `rollEffect.js`, `mixerEffect.js`, `shredderEffect.js` obsahují specifickou logiku pro jednotlivé efekty.
    - `main.js` obsahuje hlavní logiku aplikace (inicializace, zpracování událostí) a importuje funkce z ostatních modulů.
  - **CSS**: Všechny styly jsou vyňaty z `index.html` do samostatného souboru `styles/style.css` pro lepší organizaci a údržbu. Soubor je připojen v `index.html` pomocí `<link rel="stylesheet">`.

## Plánované funkce
- Vylepšení zobrazení trička pomocí skutečného 3D modelu (např. s použitím Three.js).