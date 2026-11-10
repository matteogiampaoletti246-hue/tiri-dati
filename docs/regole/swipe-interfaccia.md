# Regole ScalperLab: swipe-interfaccia

Testo completo delle regole fisse di quest'area (indice in CLAUDE.md). Valgono per tutto cio' che si aggiunge in futuro.

## Interfaccia
- Il tasto "Vai a" è fisso in basso a destra: non deve mai coprire i tasti competizione/stagione.
- Barra in basso, scorrimento tra schede (la pagina riparte dall'alto) e altre regole già in `.github/webkit/preview.mjs`: ogni modifica si prova su iPhone simulato prima di pubblicare.

## Swipe per tornare indietro (regola fissa, vale per ogni pagina presente e futura)
- Lo swipe indietro e' a scorrimento: la pagina attuale esce a destra e la pagina di destinazione si vede sotto (fotografia presa prima di lasciarla, `installBackSnaps` in `lib/carousel.js`) e prende il posto al centro. Mai schermo nero. Tutti i punti che tornano indietro passano da `pageDrag`/`pageBack` di `lib/carousel.js`.
- Tornando, i tabelloni gia' caricati restano in memoria (`peekBracket`) e non si rianimano.
- La fotografia deve avere le righe ESATTAMENTE dove stanno nella pagina vera: le parti fisse/sticky tolte dalla copia lasciano il loro spazio (`data-slm` in `grab`), altrimenti al cambio pagina tutto salta di ~110 px. La fotografia della pagina precedente si monta in anticipo e quasi invisibile (`warmLater`) cosi' non c'e' nero mentre si decodificano le immagini. L'altezza di scroll si salva esatta quando si lascia la pagina (`__slSaveScroll`). Prova automatica: `home: la fotografia sotto lo swipe...` in `preview.mjs` (misura la posizione della riga a ogni fotogramma, non solo `scrollY`).
- Coppe nazionali pure (`isPureCup`, `data/bracket.js`): solo Tabellone, niente Classifica; i turni si normalizzano con `normRound`. Le squadre dei campionati extra usano la scheda `/squadra/<id>` (nessun `href` sulla squadra).

## Swipe indietro su iPhone (regola fissa)
- Il bordo sinistro avvia anche l'"indietro" di iOS (fotografia nera o Home in doppia copia): `installEdgeGuard` in `lib/carousel.js` blocca il touchstart nei primi 26 px (i tasti sul bordo ricevono comunque il tocco) e lo swipe resta solo nostro (`pageDrag`/`pageBack`).
- Zona dello swipe indietro: `BACK_ZONE` = 48 px dal bordo (SwipeTabs e `useSwipeBack`), angolo largo per le partenze dal bordo (`backAngleOk`); `useSwipeBack` usa eventi touch (i pointer venivano annullati da iOS). Prova: "swipe indietro: parte anche un po lontano dal bordo...".
- Rete di sicurezza di `pageBack`: se la cronologia e' gia' tornata indietro la vecchia pagina resta fuori a destra finche' arriva la nuova (mai `pageReset` sopra la Home: era il glitch del video 23). Prova: "home: swipe indietro verso la Home in cima...".
- Le copie della fotografia non hanno mai `data-pf` (altrimenti `pageDrag` le spostava con la pagina vera: banner e schede sparivano, sotto il nero); `pageEls` ignora tutto cio' che sta dentro `aria-hidden`.
- `cloneVisible` copia anche lo scorrimento orizzontale (striscia dei giorni, pillole) e gli spazi vuoti hanno larghezza: la fotografia e' identica alla pagina. `DayStrip` centra il giorno prima del disegno (`useLayoutEffect`).
- Prove: "swipe indietro da partite squadra..." e "swipe indietro verso la Home: giorno scelto..." in `preview.mjs` (misura a ogni fotogramma).

## Swipe tra giorni / schede
- Nel passaggio tra giorni il riquadro e' alto quanto il giorno piu' lungo (`growBox`): nessuna scheda tagliata. I giorni vicini sono costruiti per intero.
- I titoli delle schede (`SwipeTabs`) si accendono gradualmente con la barra (colore interpolato, stesso peso per tutti). Le righe di pillole non scorrono in verticale (`overflowY: hidden`).

## Swipe indietro: la pagina vera prima della fotografia
- Dopo il ritorno la fotografia sotto resta finche' la pagina vera e' disegnata (`waitDestination` in `lib/carousel.js`: alcuni fotogrammi stabili, max 3 s, poi dissolvenza); senza fotografia c'e' una superficie dello stesso colore dell'app, mai il nero. Prova: "swipe indietro: azioni veloci..." in `preview.mjs`.
- Home: il minuto live si aggiorna ogni 10 s solo se c'e' una partita live, altrimenti ogni minuto.

## Swipe indietro: dove parte (regola fissa, sostituisce la vecchia "zona")
- Pagina senza schede/giorni a sinistra (prima scheda compresa): da tutto lo schermo, tranne dentro cio' che scorre o si trascina di lato (`inHScroll` in `lib/carousel.js`). Con schede o giorni a sinistra: dal bordo (`BACK_ZONE`) o dal banner (`data-back-banner`, `EntityBanner` e `MatchHero`). Dal bordo verso sinistra resta il cambio scheda.
- App nativa, prima pagina dopo la Home (`__slDepth === 0`): la pagina web non si muove, si muove tutta la WebView (`drag:<px>`, `drag:-1` = rientra, `home` = chiude; `onMsg` in `native/App.js`). Le pagine con i giorni (`DayPager backEdge`) e il calcolatore hanno lo swipe indietro solo nell'app nativa. Prova: "swipe indietro: con schede a sinistra...".

## Scroll indipendente tra le pagine (regola fissa)
- Tornando indietro una pagina va all'altezza salvata per la sua voce di cronologia; senza altezza o a 0 va in cima, mai a quella della pagina appena lasciata (`ScrollToTop`). Nell'app nativa le pagine aperte cambiando l'hash non hanno chiave: si distinguono col percorso (`keyOf`) e si dimenticano tornando a `/linee-guida`. Prova: "home e squadra non condividono lo scroll".

## Tendine e finestre
- Ogni tendina (`Dropdown`, `CompSelect`, `MiniSelect`, `StatPicker`) usa `usePopFit`/`popScroll` (`lib/popFit.js`): altezza massima sopra la barra in basso con margine, si apre verso l'alto se sotto non c'e' spazio, non esce dallo schermo, scorre solo la lista (`data-pop-scroll`, overscroll contain). `MenuBackdrop` tiene ferma la pagina dietro; si chiude solo scegliendo o toccando fuori.
- Finestre e fogli (giocatore, stagioni, Vai a, ricerca, menu): `useModalLock` (`lib/modal.js`). Con una finestra aperta nessuno swipe di pagina parte (giorni, schede, indietro, `pageDrag`); la finestra giocatore ha `role=dialog` e `data-no-back`.
- Tendina dal basso: `components/ui/Drawer.jsx` (finestra giocatore delle partite iniziate/finite). Snap point in frazioni dello schermo vero (giocatore 0.55 e 0.92), apre in 500 ms e chiude in 250 ms con `cubic-bezier(0.23,1,0.32,1)`, colpo veloce in basso chiude, barra in basso sempre sul fondo visibile, colori `--drawer-*` nei temi. Ogni nuova tendina dal basso usa questo componente.

## Pannello giocatore da destra (partite non iniziate, regola fissa)
- `components/player/PlayerPanel.jsx` (stato in `data/playerPanel.js`): si apre dal volto nelle formazioni pre-partita (`PlayerLink`), dalle righe di Migliori Giocatori (`TopPlayerRow`) e di Affidabilita' (`MatchReliabilityList`) solo se `matchStarted(match)` e' falso; altrimenti resta il comportamento di prima. Largo 68% (resta visibile 1/3 della pagina sotto), dentro la colonna dell'app.
- Contenuto: foto senza sfondo (stessa di `PlayerPhoto`, sfuma in basso) con l'alone del colore della squadra come il banner, in alto a sinistra (40%); accanto nome, squadra, numero di maglia e tasto azzurro Profilo piccolo (grande come le tendine di campionato e stagione). Sotto quattro riquadri 2x2 compatti (stretti sulle scritte): Nazionalita', Ruolo, Piede, Valore (da `useBio`, senza voci vuote; il Profilo resta con tutte le Informazioni), poi un po' di spazio e solo `StatistichePanel` (stessi filtri e calcoli) identiche al Profilo ma rimpicciolite in proporzione (`Scaled`: disegnate larghe come la scheda giocatore e ridotte con `transform: scale` alla larghezza del pannello, altezza misurata; mai `zoom`, che in WebKit sposta le lineette della media; caratteri, barre e tabelle tengono lo stesso rapporto larghezza-altezza). Competizione/stagione ripartono da "Attuale" a ogni apertura.
- Meccanica GSAP: pannello `xPercent` 100→0 e velo nero a 0,45 in 0,65 s `power2.inOut`; il contenuto si monta a pannello fermo e appare in 0,25 s, poi le Statistiche (scorrimento senza fotogrammi lunghi). Chiusura: velo, X o swipe a destra (il pannello segue il dito, oltre il 30% o colpo veloce chiude). `useModalLock`, `role=dialog`, `data-no-back`, body bloccato, altezza da `visualViewport`, `prefers-reduced-motion` senza animazioni. Prova in `preview.mjs` ("pannello giocatore da destra").

## Tendina delle stagioni nel banner (regola fissa, concept A)
- Il tasto stagione del banner di una competizione (`pages/League.jsx`) apre una tendina SOTTO il tasto (`components/archive/SeasonDrop.jsx`), mai il foglio dal basso: si srotola verso il basso (clip-path, voci in cascata), scorre dopo ~7 voci, sta sopra la barra in basso (`popRoom`) e, se sotto non c'e' spazio, si apre verso l'alto. Portale a posizione fissa (il banner non la taglia), `MenuBackdrop` + `useModalLock` come le altre tendine. Tasto largo almeno 150 px, tendina almeno 196 px. `SeasonSheet` non e' piu' usato.

## Finestra giocatore su iPhone: altezza dallo schermo vero (regola fissa)
- Con la pagina live che cresce Safari a volte accorcia il riquadro degli elementi fissi: la finestra giocatore finiva a meta' schermo con la pagina non oscurata sotto e i tasti sopra il contenuto. `PlayerSheet.jsx` misura altezza e posizione da `visualViewport` (`vbox`, si rimisura a ogni resize/scroll) e usa il 92% di quella altezza; senza `visualViewport` resta `92dvh`. Vale per ogni finestra a tutta altezza futura.

## Testi tagliati (regola fissa)
- Le righe con `truncate`/`line-clamp` (overflow nascosto) e interlinea stretta tagliavano le lettere che scendono (g, p, y, q) e gli accenti: `index.css` (livello components) allarga l'area visibile sopra e sotto e compensa col margine, la riga resta dov'era. Prova: "testi: lettere che scendono non tagliate" in `preview.mjs`.

## Niente salti all'arrivo
- `useAsync` ricorda i risultati (LRU): rimontando un pannello i dati ci sono al primo disegno. Banner e barra schede fisse si misurano prima del disegno (`useLayoutEffect`, ultima altezza ricordata). L'animazione `comp-in` solo cambiando competizione/stagione (`useCompIn`), mai all'arrivo. Prova: "pillole: tornando su una squadra..." in `preview.mjs`.

## Fluidita' (priorita' massima)
- Partite d'archivio: appena compare una lista (`ArchRow`) il file della stagione (`partite/<fm>/<stagione>.json.gz`) si scarica a riposo, al tocco della riga parte `prepareMatch`.
- Una partita si mostra solo quando e' pronta: `data/prepare.js` (`prepareMatch`, una promessa per partita, avviata al tocco della riga in `MatchRow`), scheletro unico in `pages/Match.jsx` (intestazione vera se la partita e' gia' nota); niente riepilogo/momentum/statistiche che arrivano dopo.
- Cambio giorno dal calendario: `dayReady` aspetta gli orari reali; la riga dell'orario e' sempre riservata (niente salti di altezza).
- La fotografia per lo swipe indietro (`cloneVisible` in `lib/carousel.js`) copia solo la parte visibile.

## Scheletro al posto della rotella (regola fissa, concept C)
- Mai rotella ne' "Carico...": ogni attesa mostra uno scheletro con la forma della pagina vera (`components/PageSkeletons.jsx`: `SkMatchHero`/`SkMatchBody` partita, `EntitySkeleton` squadra/giocatore/campionato con `kind`, `PanelSkeleton` pannelli, `SkList`/`SkRow`/`SkCard`/`SkTabs` pezzi comuni). Barra base: `LoaderSkeleton.jsx` (`.sk` in `index.css`).
- Stile C: la cornice resta vera e toccabile (freccia indietro, intestazione della partita se gia' nota, barra in basso); il grigio solo dove arrivano i dati. Testi finti con le stesse classi del testo vero e lettere invisibili (`SkText`): stessa altezza di riga. Misurato: barra delle schede scheletro = pagina vera (partita 245 px, squadra 153, giocatore 101, campionato 138). Prova: "scheletri: al posto della rotella..." in `preview.mjs`.
- Colori solo dai temi (`--sk-base`, `--sk-hi`, `--sk-panel` in `:root`/`.dark`); riflesso solo `transform` in CSS (niente JS per fotogramma); `prefers-reduced-motion`: fermo. Compare dopo 150 ms (`.sk-delay`): un'attesa piu' corta non lampeggia. Negli elenchi solo le righe che entrano nello schermo (`fill`).
- Dati gia' visti: nessuno scheletro (`useAsync`, `once`, LRU). Niente attese finte: tolto `useInitialLoad` (320 ms di scheletro anche con i dati pronti). Precarico al tocco (`lib/prefetch.js`, `pointerdown` sui link): squadre dell'indice, squadre e giocatori d'archivio; le partite gia' con `prepareMatch`.

## Memoria (l'app resta fluida anche dopo molte pagine)
- Capienza fissa (`lib/lru.js`): fotografie dello swipe indietro ultime 5 (mai quelle "avanti"), file grandi dell'archivio (partite .gz 10, statistiche 30), dettagli FotMob 12, partite pronte 30 (uscendo liberano `det`/`moreDet` e si ricostruiscono se riaperte), tabelloni 16, `useAsync` 120. Ogni cache nuova va limitata allo stesso modo. Prova: "memoria: 40+ pagine..." in `preview.mjs`.

## Fluidita' della Home (regola fissa)
- Misurato (Chromium, CPU 4x, 10 cambi giorno): blocchi del thread principale 18,6 s -> 7,4 s. Colli di bottiglia tolti: abbinamento squadre del feed (`leagueById` su mappa, nomi normalizzati in memoria a capienza fissa in `teamMatch.js`), raggruppamento per giorno memorizzato (`groupsOf`), ogni giorno si ridisegna solo se cambiano le sue partite (`daySig`), giorni vicini costruiti a pezzi a riposo (`FIRST`/`STEP`), `growBox` solo quando cambia il giorno affiancato.
- Swipe tra giorni (terzo giro, misurato): 3 riquadri fissi che ruotano (`Home.jsx`, nessun montaggio/smontaggio per swipe); il giorno centrale si completa a riposo a pezzi (`STEP`), i vicini mostrano solo le prime finestre (`FIRST`) e solo scorrendo in basso (`deep`) si completano; `end()` scrive gli stili PRIMA di `flushSync`; indice per giorno in `matchesByDate`; aggiornamenti di rete (`later`) solo a pagina ferma e solo per i giorni vicini. Confronto in `aurora_perf.yml` (`gh workflow run aurora_perf.yml --ref main -f ref=dev -f old_ref=main`): confrontare SOLO varianti dello stesso job (il runner varia fino a 2x). Ultimo risultato: tempo in blocchi lunghi 721 ms contro 2223 ms della versione precedente, nodi 1129 contro 3071.
- Il WebKit dell'anteprima disegna in software: i suoi fotogrammi servono solo per confronti relativi (prima/dopo, inizio/fine giro). Prove: "fluidita: 12 swipe di fila...", "fluidita: swipe tra schede...".

## Ritorno nell'app dopo background o inattivita' (regola fissa)
- `lib/resume.js` (`initResume` in `main.jsx`): a ogni ritorno (visibilitychange, pageshow, focus, evento `sl-native-resume` dall'app nativa) chiude animazioni e fotografie di scorrimento rimaste a meta' (`finishCarousel`, copie `body > div[aria-hidden][will-change]`), azzera un blocco-finestra rimasto acceso senza finestre aperte (`resetModalLockIfIdle` in `lib/modal.js`: senza `[role=dialog|listbox]` il contatore torna a 0, altrimenti ogni swipe/tocco di pagina restava fermo), toglie la tastiera se l'assenza supera 20 s e rimisura lo schermo (`sl-resume` + `resize` subito, dopo 350 ms e 1,2 s).
- Finestra giocatore: dopo background il `visualViewport` puo' restare corto (altezza della tastiera) e la finestra finiva a meta' schermo con la pagina non oscurata sotto (mappa tiri "rotta"). Ora `vbox.h = max(visualViewport.height, innerHeight)` quando non c'e' un campo attivo, si rimisura anche ogni 700 ms e su `sl-resume`. Prova: "ritorno dal background" in `preview.mjs`.
- Nativo (`native/App.js`): tornando entro 10 minuti `ov` torna a 0 se la pagina e' aperta (altrimenti fuori schermo), la rotella si spegne se non c'e' una rotta in arrivo e la pagina riceve `sl-native-resume`; poi ping/pong come prima.

## Selettori a pillola: liquid glass unico (regola fissa)
- Dal 10/11/2026 la pillola di riferimento e' quella di AnimatedTabs (Turkiye | Belgium | Previste, linee dell'Affidabilita'): gradiente blu-viola con bagliore, testo attivo bianco (`--atabs-pill-ink`), barra larga quanto la riga con le voci che si dividono lo spazio. `TextFilter` usa la stessa barra (`.tfilter` / `.tfilter-tab` in `index.css`; `fit` solo dentro una riga con altro, es. `FieldRow` del Calcolatore) e ogni `.lg-thumb` prende lo stesso gradiente; nessuna eccezione, Tutte|Live compresa (sito e nativa). Ogni selettore a pillola ha anche il contorno multicolore che gira delle tendine (`.halo-trigger` sulla cornice; in `TextFilter` e `LivePill` sta su una cornice esterna perche' la striscia dentro taglia il bordo; nativo: gradiente che ruota dietro la pillola). Un selettore nuovo usa `TextFilter` o `AnimatedTabs`, mai uno stile suo.
- Ogni selettore in cui la scelta scorre da una voce all'altra usa la stessa pillola: `.lg-thumb` (vetro nel colore d'accento o `--lg-c`, riflesso in alto, ombra sotto) e lo stesso movimento con leggero rimbalzo (`.lg-move` / .6s `cubic-bezier(.34,1.42,.64,1)`), testo attivo `--atabs-pill-ink`. Oggi: AnimatedTabs, TextFilter (Totale/Casa/Trasferta/Forma e tutte le altre), Tutte|Live (sito e nativa, blu -> rosso), squadre in Formazioni, Over|Under arbitro, Classifica|Tabellone, Affidabilita' giocatore|squadra. Le schede con la lineetta sotto (SwipeTabs, giorni) non sono pillole e restano com'erano.
