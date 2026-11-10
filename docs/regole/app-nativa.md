# Regole ScalperLab: app-nativa

Testo completo delle regole fisse di quest'area (indice in CLAUDE.md). Valgono per tutto cio' che si aggiunge in futuro.

## App nativa (Expo / React Native, cartella `native/`)
- La Home e' nativa (`native/App.js`), tutto il resto e' il sito dentro una WebView gia' caricata. Si pubblica da sola a ogni push su `main` che tocca `native/**` (`native_expo.yml`, EAS Update); il progetto Expo sta nell'organizzazione `lozellatos-team`. Il link per Expo Go e' in `native-link/url.txt` (cambia a ogni pubblicazione, lo riscrive il workflow).
- Regole della Home: stesse del sito (finestre per paese, colori, ordine) da `meta.json` generato da `native/tools/gen_meta.mjs` (include i nomi squadra come nel sito, `names`). Nomi, stato e minuto live: `/f` del worker per il giorno, `/fx` per le partite iniziate da meno di 5 ore, `giorni/<data>.json` per le piu' vecchie; mai "live" per una partita finita.
- Fluidita' prima di tutto: swipe tra giorni su Reanimated/gesture-handler (nessun lavoro JS durante il gesto), stemmi con `expo-image` in cache, formattatori Intl creati una volta sola, liste a pezzi piccoli. Ogni modifica va giudicata sul telefono dall'utente (Expo Go).
- Tema chiaro/scuro: segue la scelta fatta nel sito (la WebView la comunica e l'app la ricorda). Nuovi colori sempre in `DARK`/`LIGHT`, mai valori fissi nei componenti.
- Partite: top campionati e coppe europee si aprono con `/match/a-<fm>-<stagione>-<id>`, i campionati aggiunti (`fm-<id>`) con `/match/x-<fm>-<id>`.
- Calendario: i giorni senza file in `giorni/` (oltre ~10 giorni) restano vuoti; il feed e' la stessa fonte dei campionati aggiunti del sito.
- Swipe indietro nell'app: la prima pagina aperta dalla Home torna alla Home con lo swipe dell'app (`EDGE_W` 60 px, sotto l'intestazione); dalle pagine successive lo swipe e' quello del sito (zona 64 px e gesto piu' leggero dentro la WebView, `isNative` in `lib/carousel.js`, niente blocco del bordo). La profondita' la comunica la WebView (`window.__slDepth`, messaggi `depth:N` e `home`). Il tasto indietro del sito alla prima pagina rimanda alla Home.
- Partite aperte dall'app: sempre `/match/a-<fm>-<stagione>-<id>` (il percorso `x-` funziona solo se il sito ha gia' caricato quel giorno). Stemmi: `Crest` riprova e poi mostra le iniziali; FotMob non ha lo stemma di circa 8 squadre su 3000.

## App nativa: Home concept B (regola fissa)
- Una tinta per finestra: top campionati = colore del campionato, paesi = colore dominante della bandiera (`meta.tints`, `gen_flags.mjs`); righe e campionati dentro il paese neutri. Bandiera = immagine rotonda vera (`native-link/flags/<codice>.png`, `fc` in `meta.json`) con anello e alone della tinta, mai emoji.

## Home nativa: striscia dei giorni (carousel concept B, regola fissa)
- Mentre si scorre tra i giorni la linea sotto ogni giorno (`DayBtn` in `native/App.js`, una per giorno: opacita' e scala dalla pagina frazionaria `x`) cresce sul giorno che arriva e si spegne su quello che si lascia; i giorni sfumano di colore e crescono un poco in modo continuo, mai a scatto a meta' strada. Tutto sul thread UI e SOLO con `transform`/colori: la prima versione animava la larghezza e su iPhone la linea non si vedeva. Niente misure ne' array condivisi (la versione con una sola linea mossa da `upos` non compariva).
- Anteprima prima di pubblicare: `gh workflow run native_anteprima.yml --ref <ramo>` pubblica sul ramo EAS `anteprima` e stampa il link `exp://...` nel log; non scrive `native-link/latest.json`, quindi il link normale resta com'e'.

## App nativa: tocco prima che la pagina web sia pronta (regola fissa)
- La pagina web si monta 2,5 s dopo l'avvio e poi si carica: un tasto (barra in basso, ricerca, menu, partita, campionato) toccato prima non deve mai mostrare le Linee guida. `openRoute` ricorda la rotta (`pendingHash`), monta subito la pagina sulla rotta giusta (`bootUri`, fissato al primo montaggio: cambiare `source` dopo ricaricherebbe tutto) e la applica a fine caricamento (`onWebLoaded`); finche' non e' pronta (`ready`) sotto c'e' lo spinner.

## App nativa: apertura veloce delle schede e rotella (regola fissa)
- Pagina web montata 0,7 s dopo i dati (non 2,5 s). Nella WebView nativa `bootData` non aspetta il feed della Home (`window.ReactNativeWebView`: il feed parte a riposo dopo 8 s) (lo scheletro finto da 320 ms `useInitialLoad` non esiste piu' in nessuna pagina). Misurato (CPU 4x): avvio -2 s, apertura Giocatori -350 ms.
- Scheletro al posto della rotella: aprendo una rotta l'app copre la WebView con lo scheletro nativo `SkWeb` (`busy`/`ready` in `native/App.js`; Home senza dati: `SkHome`). `SkBox`/`SkBar`: `Animated` di React Native con `useNativeDriver`, un solo valore per tutte le barre, riflesso con `expo-linear-gradient`, colori `skBase`/`skHi` in `DARK`/`LIGHT`, fermo con Riduci movimento, visibile dopo 150 ms. Mai `ActivityIndicator`. La copertura resta finche' la pagina web manda `route:<percorso>` (`NativeSignal` in `App.jsx`, dopo il primo disegno); rete di sicurezza 4 s; se la pagina e' gia' sulla rotta (`webPath`) niente attesa. Ogni nuovo caricamento pesante nelle schede va tenuto fuori dal primo disegno.

## Home nativa (Expo Go): ritorni, ricerca, storico, ordine (regola fissa)
- La Home del sito non deve mai comparire nell'app nativa: `NativeHomeGuard` (route `/` e `*`) avvisa l'app (`home`) e non disegna niente; il tasto Home della barra del sito fa lo stesso. La ricerca e il menu sono tendine native (vedi "Riga in alto della Home"); `/cerca` e `/menu` riaprono la Home con la tendina.
- Giorni passati: `giorni/` tiene 10 giorni, i piu' vecchi stanno in `giorni_arch/<data>.json` (`giorni_storico.py`, workflow `giorni_storico.yml`, dal 1 luglio dell'anno scorso, riga con la stagione in posizione 11); la Home nativa prova prima `giorni/` poi `giorni_arch/`.
- Ordine in alto (Home sito e nativa, `TOP_SOLO`): Champions, Europa, Conference, poi i 9 top campionati, poi internazionali, poi i paesi in ordine alfabetico.
- Swipe indietro: soglia bassa (`backDone`: 22% della larghezza, o 8% con scatto); durante lo swipe la pagina resta opaca ma con lo sfondo dell'app (bagliore azzurro, `paintSolid`), mai nero.
- Forma recente: ultime 5 in tutte le competizioni della squadra (`addLeagueForm`: indice `tidx`, stagione in corso + precedente).

## Pubblicazione app nativa (Expo)
- `native_expo.yml` ha `concurrency` (una pubblicazione alla volta, in coda): due merge ravvicinati pubblicavano insieme sullo stesso ramo EAS e scrivevano insieme `native-link/latest.json`; l'utente apriva un aggiornamento a meta' (errore Expo Go "RCTEventEmitter.receiveEvent ... not registered"). Dopo una pubblicazione: chiudere Expo Go del tutto e riaprirlo due volte.

## App nativa: barra unica e swipe indietro veloce (regola fissa)
- Nell'app nativa la barra in basso e' una sola, quella nativa (`TabBar` in `native/App.js`), disegnata SOPRA la pagina web: Home chiude la WebView (`closeWeb`), le altre voci aprono la rotta; la voce attiva segue `route:` della pagina. La barra del sito (`BottomBar`) e' `visibility:hidden` in nativo: nessun cambio di colore, mai la Home vecchia del sito.
- Swipe indietro: la pagina corre piu' veloce del dito (`SWIPE_GAIN` 2,2 in `native/App.js` e `lib/carousel.js`, soglia `backDone` nativa 23%): uno swipe leggero la porta oltre la meta'. Striscia nativa del bordo stretta (`EDGE_W` 16 px): piu' larga copriva i tasti a sinistra (Riepilogo) e ne mangiava il tocco.

## Home nativa: il risultato accanto a LIVE (regola fissa)
- Ogni partita live mostra i gol: `refresh` in `native/App.js` chiede `/fx` (36 per giro, 6 insieme) prima alle partite "live" ancora senza gol, e ricorda l'ultimo risultato noto (`LIVE_MEM`, 10 minuti) cosi' dopo molti cambi giorno non resta solo la scritta LIVE.

## Barra nativa solo nelle 4 voci (regola fissa)
- Nell'app nativa la barra in basso (`TabBar`) si vede SOLO in Home e nelle tre schede Calcolatore, Giocatori, Matchup (`isTabRoute`, `barOn` in `native/App.js`). Ogni altra pagina (partita, campionato, squadra, giocatore, finestre) non ha la barra: si torna con lo swipe o col tasto indietro. Mai spostare i tasti delle finestre per farli stare sopra la barra.

## Home nativa: finestre con molte partite
- Tendine di paesi e campionati (`Collapse` in `native/App.js`): tendina classica con la `LayoutAnimation` nativa (`tendAnim()` chiamata subito prima di `toggle()`), 260 ms, in apertura e in chiusura. Regola fissa dal 10/11/2026.
- Mai rimettere altezze misurate e animate da noi (Animated di React Native o Reanimated su `height`/`maxHeight`): in apertura la tendina restava ferma e compariva gia' aperta, due volte (9 e 10/11/2026, video dell'utente).
- Le prime 8 righe si montano subito, le altre solo ad animazione finita (`useChunk`, primo pezzo dopo `TEND_MS + 80`): un pezzo montato durante l'animazione la interrompe.
- La carta (`s.card`) deve restare `overflow: 'hidden'`: ritaglia le righe mentre cresce.
- Col filtro Live (`forceOpen`) le finestre sono aperte fisse: nessuna animazione.

## App nativa: ritorno dal background (regola fissa)
- Entro 10 minuti in background l'app si ritrova com'era; oltre 10 minuti riparte da zero (`App` rimonta `Screen` con `gen`, `onReset`). Tornando entro 10 minuti la pagina web riceve un ping (`pong`): se non risponde entro 1,5 s, o iOS ha terminato il suo processo (`onContentProcessDidTerminate`), o aprendo una pagina la rotta non arriva in 4 s, la WebView si ricrea gia' sulla rotta giusta (`recover`, `webKey`, `lastRoute`). Prima la WebView ricaricata riapriva l'ultima rotta fissata all'avvio (Calcolatore) e ignorava il tocco sulla partita.

## Riga in alto della Home: ricerca e menu a tendina (regola fissa)
- Riga unica: logo (solo il marchio), barra di ricerca che prende lo spazio libero, Calendario, menu. Uguale nel sito (`HomeHeader`) e nel nativo (`Header` in `native/App.js`).
- Ricerca: la barra si allarga in un pannello unico in cima (aspetto concept B); il pannello scende dalla barra e le voci arrivano a cascata (animazione concept A). Banner giocatore compatto (`PlayerBanner compact` nel sito, `PlayerBannerS` nel nativo). Altezza massima fino alla tastiera, scorre solo la lista. Risultati sempre da `lib/search.js` (`searchAll`): nel nativo li calcola la pagina web (`window.__slSearch` -> messaggio `srch:<n>:<json>`), mai un secondo elenco nell'app.
- Menu: tendina da destra con icone (concept B), stesse voci della vecchia pagina menu; tema e diagnostica nel nativo passano dalla pagina web (`window.__slCmd`, messaggio `ui:state`). Ricerca e menu mai aperti insieme; sopra la barra in basso senza cambiarne lo z-index. Vecchi link `/cerca` e `/menu`: Home con la tendina aperta (nel nativo messaggi `ui:search` / `ui:menu`).

## Dock in basso e cambio scheda (regola fissa)
- Dock "isola compatta" (concept C) uguale in nativo (`TabBar`) e nel sito (`BottomBar` + `components/dock.css`): vetro sfocato, tasselli 46 px, separatore dopo Home, la voce attiva si allarga in pillola col nome; badge rosso su Home con le partite live di oggi (solo se ce ne sono). Colori solo dai temi (`DARK`/`LIGHT`, variabili CSS); z-index sotto le tendine.
- La voce toccata si evidenzia subito (`tab` in nativo, `want` nel sito), non quando la pagina e' disegnata. Toccare la voce gia' attiva riporta in cima.
- Tra due schede (Calcolatore, Giocatori, Matchup) la pagina web scorre di lato da sola (`__slTabPrep` iniettato prima di `location.hash`, niente `busy`/scheletro): regole in `calcolatore-migliori.md`, sezione "Schede del dock".
- Causa del "cambio pagina che non va": l'attesa di `route:` restava accesa se si tornava alla pagina gia' mostrata prima che l'altra arrivasse, e dopo 4 s l'app ricaricava da zero la pagina web anche se era solo lenta. Ora: rotta gia' mostrata = attesa chiusa; dopo 4 s ping (`pong`): si ricrea solo se la pagina non risponde.

## App nativa: tocchi che riportano all'ultima sezione (regola fissa)
- Causa: dopo ogni chiusura l'app rimette la pagina web su `#/linee-guida` (`afterClose`) e la pagina rispondeva `home`; con l'app lenta (ritorno da un'altra app) il messaggio arrivava dopo il tocco successivo e `closeWeb` richiudeva la pagina appena aperta (la pagina "faceva capolino" e tornava via, e il tocco dopo ripartiva uguale).
- Ora ogni cambio di rotta deciso dall'app (`hashTo`, `onWebLoaded`) imposta `window.__slQ` (1,5 s) e il caricatore `NO_LAUNCH` non manda `home` mentre e' attivo; `home` resta per il vero ritorno indietro (gesto/tasto del sito).
- Seconda causa (stessa famiglia): `NavGuard` (`App.jsx`) annullava ogni cambio di rotta "all'indietro" partito da una scheda principale (Calcolatore, Giocatori, Matchup) per bloccare lo swipe del sistema nel browser. Dopo una navigazione interna della pagina (es. scelta di un giocatore nel Calcolatore) anche il cambio di scheda dalla barra in basso contava come "indietro" e veniva annullato: ogni tasto riportava al Calcolatore. Ora nell'app nativa il guardiano non agisce mai (le schede le cambia solo la barra); resta nel browser. Provato con la riproduzione: navigazione interna + tasti della barra in sequenza.

## App nativa: niente Linee guida durante l'apertura (regola fissa)
- La pagina web chiusa resta su `/linee-guida` ma coperta da un fondo pieno (`parked` in `native/App.js`): aprendo partita, squadra o campionato il primo fotogramma dello scorrimento e' gia' il fondo, poi lo scheletro (`SkWeb`, `SkBox delay={0}`) fino al messaggio `route:`. Prima la copertura arrivava dopo il disegno JS e 150 ms: si vedeva ~1 s il pannello delle Linee guida.

## Home nativa: testate e ricerca (regola fissa)
- Testate di paesi e campionati: numero partite e freccia in una zona fissa a destra (`s.tail`, 52 px, numero allineato a destra): stessa posizione in tutte le testate, il nome lungo si tronca prima.
- Ricerca: anche i campionati sono banner colorati (`LeagueBannerS`, colore del campionato da `color` della pagina web o `meta.comps[].tint`), come squadre e giocatori.
