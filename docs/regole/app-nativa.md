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
- Apertura in due tempi: le prime 8 righe si creano di nascosto in un contenitore alto zero, poi a righe pronte (`onLayout` + 2 fotogrammi) parte `tendAnim()` e si toglie il vincolo. Mai creare le righe nello stesso passaggio dell'animazione: con piu' di 4 partite ne saltava l'inizio (10/11/2026). Le righe oltre le prime 8 arrivano ad animazione finita (`useChunk`). In chiusura `tendAnim()` la chiama chi tocca e la tendina si smonta subito.
- La carta (`s.card`) deve restare `overflow: 'hidden'`: ritaglia le righe mentre cresce.
- Col filtro Live (`forceOpen`) le finestre sono aperte fisse: nessuna animazione.

## App nativa: ritorno dal background (regola fissa)
- Entro 10 minuti in background l'app si ritrova com'era; oltre 10 minuti riparte da zero (`App` rimonta `Screen` con `gen`, `onReset`). Tornando entro 10 minuti la pagina web riceve un ping (`pong`): se non risponde entro 1,5 s, o iOS ha terminato il suo processo (`onContentProcessDidTerminate`), o aprendo una pagina la rotta non arriva in 4 s, la WebView si ricrea gia' sulla rotta giusta (`recover`, `webKey`, `lastRoute`). Prima la WebView ricaricata riapriva l'ultima rotta fissata all'avvio (Calcolatore) e ignorava il tocco sulla partita.

- Memoria in background (10/11/2026): Expo Go veniva chiuso da iOS per la memoria. Andando in background si svuota la cache immagini (`Image.clearMemoryCache`) e, se la pagina web e' chiusa (Home), si smonta la WebView (`sleep`); al ritorno si ricrea sulla pagina di partenza. Con una pagina aperta la WebView resta (si perderebbe la posizione).

- Tocco subito al ritorno (13/11): al ritorno in primo piano Home, pagina partita e Calcolatore NON aggiornano i dati per 2,5 s e poi solo dopo le interazioni (`shared/resume.js`: `onResumeCalm`, `justResumed`); prima partivano tutti a 0 ms e il thread JS occupato lasciava l'app senza risposta al tocco per 1-2 s. Ogni nuovo aggiornamento al ritorno deve passare da li', mai da `AppState` diretto.

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

## Logo e avvio: diamante (regola fissa dal 10/11/2026)
- Marchio = diamante a otto facce (concept A "Facet"): `Logo.jsx` nel sito, `Logo` in `native/App.js` (immagine SVG con `C.bg` negli spazi tra le facce), icone in `aurora/` (`icon.svg`, `icon-192/512.png`, `apple-touch-icon.png`). Vecchio marchio (lente) abbandonato.
- Avvio del sito (`LaunchScreen.jsx`, concept C "Dock"): il diamante compare al centro (rimbalzo, alone, riflesso, scintilla), vola nel posto del logo dell'intestazione (`#sl-brand`), da dietro esce la scritta ScalperLab mentre la barra di ricerca resta nascosta (`sl-launch-end` la fa riapparire), poi tutto si dissolve sul logo vero.
- Avvio nativo (`LaunchOverlay` in `native/App.js`, 10/11/2026): stessa sequenza del sito (concept C), una volta a ogni apertura dell'app (`LAUNCHED`); il diamante vola nel posto di `brandRef` (logo dell'intestazione), la ricerca resta nascosta (`SEARCH_OP`) finche' esce la scritta; se l'intestazione non c'e' entro 9 s si sblocca da sola.

## Migrazione a pagine native (a tappe, dal 10/11/2026)
- Obiettivo: tutto in nativo, senza WebView. Le pagine native stanno in `native/pages/` (copiate in `app/pages` da `native_expo.yml`) e si registrano in `NATIVE_PAGES` di `native/App.js`: `openRoute` apre la pagina nativa scorrendo da destra (stessa animazione `ov`), senza toccare la WebView. Ricevono `C` (tema), `top` (inset) e `onBack`.
- Tappe: 1 Linee guida (fatta) · 2 Calcolatore · 3 Migliori Giocatori/Matchup · 4 Partita · 5 Squadra/Campionato · 6 Giocatore · 7 Archivio/Arbitro/Ricerca · poi si toglie la WebView. Ogni tappa si pubblica e la giudica l'utente su Expo Go.
- Livello condiviso (tappa 2): la CI copia `aurora-src/src/data` e `lib` in `app/src` e `native/metro.config.js` risolve l'alias `@/` come nel sito, quindi calcoli (`lib/calc.js`) e dati (`data/calcData.js`, `teams`, ...) sono GLI STESSI del sito, non si riscrivono. Prima di usarli: `import './shared/shim'` (document.baseURI e localStorage in memoria) e `bootShared()` (`native/shared/boot.js`). Mattoni UI nativi in `native/shared/` (`ui.js`, `ResultCard.js`); un modulo di `data/` che importa da `@/components` non si porta in nativo. Verifica locale: progetto Expo in /tmp con `npx expo export --platform ios`.
- Una pagina web si sostituisce con la nativa (voce in `NATIVE_PAGES`) solo quando ha tutte le funzioni di quella web: mai pagine a meta'.

### Migrazione: stato e piano (10/11/2026, sera)
- Fatto e pubblicato: Linee guida, Calcolatore (Giocatore + Squadra), livello dati condiviso (`native/shared/boot.js` = sequenza di `data/index.js` senza live/feed; `data/playerPid.js` = `resolvePid` senza dipendenze web; `calcComp.js` copiato in `app/src/components/calc/` dal workflow).
- L'utente ha scelto di migrare TUTTO a tappe. Ordine per dipendenze: Giocatore (scheda + pannello da destra) -> Partita -> Migliori Giocatori e Matchup -> Squadra/Campionato -> Archivio/Arbitro/Ricerca -> rimozione WebView. Pagina registrata in `NATIVE_PAGES` solo quando completa.
- Misure: ~13.000 righe di pagine web da portare. Giocatore dipende da `components/player/PlayerTabs.jsx` (672 righe: Profilo, Partite, Statistiche con percentili e barre, Carriera), `PlayerPanel.jsx` (421), `Radar`, `components/past/*` (PastBits/PastStats/PastMatches), `CompSeasonBar`/`CompSelect`, `archive/parts` e `ArchiveLeague`; hook `useAsync` e `playerIndex` (usePlayerCareer, usePlayerSeason, useBioPid, useArchivePct) usano `playerCalc.js` (pure, copiabile da CI).
- Migliori Giocatori: `data/topPlayers.js` importa `resolvePid` da `./playerIndex` (cambiarlo in `./playerPid` prima di portarlo); righe -> `openPanel`/tendina/`/giocatore`.
- Tocchi verso pagine non ancora native passano da `openRoute` (WebView) finche' la destinazione non e' nativa.

### Stato Giocatore nativo (10/11/2026, sera)
- Scritto e compilato, NON ancora registrato (in `App.js` la riga `NATIVE_DYN` e' commentata): `pages/Giocatore.js` (testata, Profilo, Carriera), `GiocatorePartite.js`, `GiocatoreStat.js`, `GiocatorePast.js`; mattoni in `shared/` (`hooks.js` useSel, `Radar.js`, `Icons.js`, `StatBars.js`, `DropBtn`/`LeagueLogo` in `ui.js`).
- La CI copia anche `components/player/playerCalc.js` e `hooks/useAsync.js` (`playerIndex.js` li importa: `topPlayers.js` ora si porta senza cambiare `resolvePid`).
- Manca: pannello giocatore (da destra se la partita non e' iniziata, tendina dal basso altrimenti), poi attivare `NATIVE_DYN` per `/giocatore/:id` e i tocchi dal Calcolatore.

## Giocatore nativo attivo (10/11/2026, sera)
- `/giocatore/:id` e' nativa (`NATIVE_DYN` in `native/App.js`); `native/shared/PlayerPanel.js` e' il pannello da destra (68%, velo, swipe/tasto chiudi, Profilo -> scheda) montato nella radice di App.js; si apre con `openPanel(id)` da `@/data/playerPanel` (lo useranno Partita, Migliori Giocatori, Affidabilita' quando saranno native).
- Scroll Partite: `onScroll` -> `emitNearEnd`. Errore di caricamento: torna indietro da solo.
- Manca ancora: tendina dal basso per partite iniziate/finite (con Partita), swipe dal bordo per le pagine native.

## Partita nativa: a pezzi (10/11/2026, sera) - NON registrata
- Fatti: `pages/Partita.js` (preparazione dati, live, tab), `PartitaHero.js` (testata, `FormDots`), `shared/Standings.js` (classifica campionato + archivio/gironi), `PartitaPanels.js` (mappa `PANELS`; `hasPanel` nasconde le schede non portate). Temi: aggiunti `good`/`bad`.
- Da fare, in quest'ordine: Riepilogo (Momentum, Riassunto, InfoBand, Arbitro, FormCard) · Statistiche (+ mappa tiri) · Formazioni (Pitch, PlayerSheet = tendina dal basso) · Panoramica (KeyNumbers, Idea, BestPlayers) · Affidabilita' · Tabellone coppe (Bracket; ora `hasPanel` lo nasconde). Poi registrare `/match/:id` e `/storico/:fm/:sk/:mid` in `NATIVE_DYN`, collegare `openPanel`/tendina dai giocatori e le righe Giocatore->Partita.

- Partita nativa, Riepilogo fatto (`PartitaRiepilogo.js`, `PartitaInfo.js`): Momentum (SVG, mirino al tocco), cronologia, scheda stadio (foto da raw.githubusercontent, mappa nomi in `shared/stadiMappa.json` che la CI riallinea a `aurora-src/stadi/mappa.json`), meteo (icona semplice, senza cielo animato), arbitro con barre e Over/Under, forma. `PlayerLinkN`: non iniziata = pannello, iniziata = scheda giocatore finche' non c'e' la tendina. Restano: Statistiche, Formazioni, Panoramica, Affidabilita', Tabellone.
- Prova di caricamento (obbligatoria prima di pubblicare moduli nuovi): jest-expo in /tmp/xapp con `require('../pages/Partita')` e `shared/PlayerPanel`; l'export Metro non basta, non esegue i moduli. `shared/shim.js` deve dare a `document`/`global` addEventListener, visibilityState e dispatchEvent finti (il livello dati del sito li usa all'import: bracket.js, archive.js).
- Statistiche partita (giocate): `PartitaStats.js`, `shared/CompareBars.js`, `shared/ShotMap.js` portati; le non iniziate (Previste, tabelle) restano con PartitaPre.
- Formazioni native (`PartitaLineups.js`): campo, voti/affidabilita' (selettori a pillole Tiri/In porta/Falli + Over), allenatore, panchina, infortunati, soli nomi. Semplificazioni: niente tira-per-aggiornare, niente animazione numeri del voto, scheda giocatore da partita iniziata = pagina giocatore (la tendina dal basso va fatta). Colori portiere nei temi (`gk`, `gkAlt`, `gkInk`). Restano: Panoramica + Statistiche/Previste non iniziate, Affidabilita', Tabellone, tendina giocatore.
- Panoramica e Statistiche non iniziate native (`PartitaPanoramica.js`, `PartitaPre.js`): forma, storie 'Numeri da tenere d'occhio' (tocco, pausa, swipe), giocatori migliori (concept B), duello (ragnatela), stadio, arbitro; Previste e tabelle fatti/subiti. Colori storie nei temi (`storyBase`, `storyScrim`). Restano: Affidabilita', Tabellone coppe, tendina giocatore (iniziata/finita), poi attivare `/match/:id` e `/storico/:fm/:sk/:mid`.
- Affidabilita' nativa (`PartitaRel.js`: pillole Over 0,5/1,5/2,5, righe col colore squadra, voto colorato, tocco = pannello se non iniziata) e Tabellone coppe nativo (`PartitaBracket.js`: un solo `Animated.Value` p per turno in primo piano; riquadri e altezza per interpolazione fra i turni interi, connettori SVG ridisegnati da p, finale come manifesto scuro fisso con oro `POSTER_GOLD`). Semplificazioni: niente aggiornamento live del tabellone (`useArchFresh`), niente animazione del voto. Prove: jest di caricamento + `__t__/render.test.js` (render con dati finti e cambio turno). Restano: tendina giocatore (iniziata/finita), poi attivare `/match/:id` e `/storico/:fm/:sk/:mid`.
- Tendina giocatore nativa (`shared/PlayerSheet.js`, montata in App.js accanto a `PlayerPanelHost`): partita iniziata/finita = tendina dal basso (55% / 92%, si trascina l'intestazione; swipe laterale = compagno; sostituzioni toccabili), mappa tiri del giocatore (porta + minuti + meta' campo + dettagli) e statistiche a schede. Si apre con `openPlayer({matchId,name,fmId})` (`PlayerLinkN` e le righe di Formazioni); non iniziata = `openPanel`. Prova: `__t__/sheet.test.js`.
- Partita ATTIVA (10/11/2026): `/match/:id` e `/storico/:fm/:sk/:mid` (id `a-<fm>-<sk>-<mid>`) in `NATIVE_DYN` (la voce puo' avere un quarto elemento: funzione che costruisce il parametro). Pila di pagine native in App.js: `natStack` (pagine impilate, ognuna resta sotto la successiva con stato e scorrimento), `popNat` (indietro: scorre via l'ultima, se e' l'ultima chiude tutto), `NatLayer` (scorre solo la pagina indicata da `nvIdx`); il bordo sinistro usa `stackN` per scegliere se trascinare la pagina in cima o tutta la sovrapposizione. Una pagina del SITO aperta sopra una nativa la nasconde (`natHidden`, `natBelow`): il tasto indietro del sito ('home') o lo swipe dal bordo rimostrano la pila invece di tornare alla Home; dal dock si riparte da zero.
- Giudizio dell'utente su Expo Go: aprire una partita dalla Home (non iniziata, iniziata, finita, archivio, coppa nazionale), tocchi sui giocatori (pannello / tendina), indietro e swipe indietro tra Partita -> Giocatore -> Partita e dopo una pagina del sito. Restano: swipe tra le schede della Partita, aggiornamento live del Tabellone, poi Migliori Giocatori/Matchup.

## Migliori Giocatori e Matchup nativi (tappa 3)
- `native/pages/TopPlayers.js` e `TopMatchups.js` sono registrati in `NATIVE_PAGES` (`/migliori-giocatori`, `/migliori-matchup`); usano `@/data/topPlayers`, `@/data/matchups`, `@/data/refMatchup` come il sito (`topPlayers.js` importa `resolvePid` da `./playerPid`, non da `./playerIndex`).
- Pezzi nuovi condivisi: `shared/DayNav.js` (striscia giorni, pager a scorrimento sul thread UI, giorno vuoto), `shared/Dropdown.js` (tendina a pillola, elenco sotto la pillola, scorre solo la lista), `shared/StatIconN.js` (icone statistiche), `shared/calcIn.js` (`CALC_IN`: giocatore/linea/partita/statistica dalla riga al Calcolatore, letto una volta da `CalcPlayer`).
- Righe giocatore: partita non iniziata -> `openPanel`, iniziata -> `/giocatore/:id`; tasto calcolatrice -> `CALC_IN` + `/calcolatore`. Matchup: scheda -> `/match/:id` (o `/match/a-fm-sk-id`).
- Nuovi colori nei temi: `medal` (oro/argento/bronzo), `goldHi`, `goldInk`.
- Semplificazioni: niente numero del voto che sale (RollNumber), niente `content-visibility`; uscita dei banner al cambio statistica = dissolvenza.
- Da giudicare su Expo Go: giorni (swipe e striscia), soglie Over, tendina statistica, righe, tasto calcolatrice (giocatore e linea gia' inseriti), Matchup con tutte le statistiche (Arbitri e Cartellini col bordo dorato), tocco sulla scheda.


## Squadra nativa (tappa 4a, 10/11/2026)
- `/squadra/:id` (anche `fm-<id>`) e' nativa (`NATIVE_DYN`): `pages/Squadra.js` (banner + posizione/punti + allenatore, schede a scorrimento) con `SquadraPartite`, `SquadraClassifica`, `SquadraRosa`, `SquadraStat`, `SquadraGiocatori`.
- Pezzi condivisi nuovi (servono anche a Campionato/Archivio): `shared/EntityBannerN.js`, `TabsN.js` (barra + pager, pagine accanto montate dopo 320 ms, prima scheletro), `CompBarN.js` (tendine competizione/stagione), `PaneN.js` (scroll di scheda, `anchor` per "Partite precedenti"), `StatListsN.js` (classifiche con podio, "Vai a"), `MatchRowsN.js`, `statSections.js`, `appPlayerSections.js`, `teamView.js` (useTeamView, banner che segue le tendine), `fmt.js`.
- Colori nuovi nei temi: `role` (GK/DEF/MID/ATT/UNK/COACH). CI copia anche `hooks/useArchFresh.js` e `useNextMatch.js`.
- Semplificazioni: niente nome che compare lettera per lettera, stemma del banner senza maschera sfumata, nessuna animazione del numero nelle barre.
- Restano: Campionato, Archivio (storico/*), Arbitro, Ricerca, poi togliere la WebView.

## Grafica nativa uguale al sito (11/11/2026, dopo il giudizio dell'utente)
- **Sfondo**: ogni pagina nativa e' dentro `NatLayer` (App.js) che mette `C.bg` + `<Beams />` (stessi fasci della Home; si muovono solo nella pagina in cima). Le pagine hanno la radice `transparent`, mai `C.bg`.
- **Riquadri colorati**: `Panel` (shared/ui.js) prende la sfumatura ferma (mai animata) dal colore della scheda: `TintProvider color` attorno alle schede (Squadra, Giocatore, Partita = squadra di casa) oppure `tint` sul singolo `Panel` (Calcolatore).
- **Schede con swipe laterale**: pagine di entita' (Squadra, Giocatore) = `EntityBannerN` fisso + `TabsN` con una `PaneN` per scheda. La Partita scorre tutta insieme: `TabBarN` sticky + `SwipeBodyN` (scheda attiva montata, entra da lato).
- **Tasti**: `Segmented`, `Dropdown`, `DropBtn` = pillola liquid glass come Tutte/Live (`RingBox`: contorno multicolore che gira con un solo orologio condiviso, indicatore blu-viola che scorre con rimbalzo). Sede del Calcolatore = `SedeButtonsN` (Casa/Neutro/Trasferta con icone).
- **Tendine**: `PickerModal` e `Dropdown` si aprono vicino al tocco (`TOUCH.y`), mai pagina intera; voce scelta con spunta verde `C.good` che compare prima di chiudere; il contenuto nuovo entra con `SwapN` (dissolvenza, mai schermo nero).
- **Barre**: `Bar` e `CompareBars` ripartono da zero e scorrono sul thread UI (reanimated), niente `Animated` JS.
- **Swipe indietro**: `edgeSettle` in App.js e' chiamato sia da `onEnd` sia da `onFinalize`: la pagina non resta mai a meta'.
- **Formazioni**: icone eventi con offset in pixel rispetto al volto (mai percentuali).

## Campionato nativo (11/11/2026)
- `/campionato/:id` e' nativo (`native/pages/Campionato.js`): banner `EntityBannerN` coi colori e il logo del campionato (logo chiaro dal tema, bianco con `logoTint` per Premier/Champions/Ligue 1 al buio), tendina stagioni (`Dropdown` nel banner), `TintProvider` col colore del campionato.
- Schede: Partite (giornate in riquadri tinti, "Giornate precedenti" senza salto grazie a `anchor`), Classifica (+ Tabellone se la stagione ha turni a eliminazione, `ClassificaSwitchN`), Stat. squadre, Giocatori, Arbitri (solo con dati). Stagioni passate: `pages/CampionatoArch.js`, schede mostrate solo se hanno dati.
- Elenchi per giornata: `shared/MatchdayN.js`; classifica arbitri: `shared/RefereesN.js`. Pillole e cambi di filtro come in tutta l'app (`Segmented`, `SwapN`).

## Archivio, Arbitro, Competizioni nativi (11/11/2026)
- `/storico/:fm/:sk/squadra/:tid` e `/giocatore/:pid` (`pages/ArchiveRoute.js`) aprono la scheda unica con la stagione scelta (`presetSel`, `NAV`), come il sito. `/arbitro/:id` = `pages/Arbitro.js`; `/competizioni` = `pages/Competizioni.js`.

## WebView rimossa (11/11/2026)
- L'app non incorpora piu' il sito: tutte le pagine sono native (`NATIVE_PAGES` / `NATIVE_DYN` in `App.js`), una rotta senza pagina nativa non si apre. Ricerca = `shared/searchN.js` (usa `lib/search.js` del sito); tema = scelta Chiaro / Sistema / Scuro in `AsyncStorage` (`sl-theme`). Il pannello diagnosi del sito non c'e' piu'.
- Il sito web (`aurora-src`) resta com'e' per il browser; il lavoro nativo non lo tocca.
- `/tiri-squadre` e' nativa (`pages/TiriSquadre.js`). `/partite` non ha pagina a parte: e' la Home (striscia dei giorni, calendario, filtri). I dati si scaricano coi workflow/worker di sempre; l'app li legge con la stessa cadenza del sito (Home: live ogni 5 s, altrimenti 60 s).

## Tendine, testata e swipe indietro (nativo)
- **Tendine**: sempre `shared/Dropdown.js` (pillola con contorno che gira + elenco sotto con lo stesso contorno, voce scelta azzurra con spunta). Mai `PickerModal` per scelte senza ricerca (`DropBtn` e `Select` del Calcolatore la usano gia'). `PickerModal` resta solo per le ricerche (giocatore, squadra).
- **Testata** di Calcolatore / Migliori Giocatori / Matchup: `shared/PageHead.js` (titolo con barra azzurra e due tasti tondi cerca/menu); le pagine ricevono `onMenu`.
- **Swipe indietro**: la striscia sul bordo (`EDGE_W`) sta in `App.js` con `zIndex: 200`, SOPRA i livelli `NatLayer` (zIndex 5+i): se si abbassa, lo swipe smette di funzionare su tutte le pagine native.
- **Riquadri del Calcolatore**: `Panel ring` (bordo azzurro 1.5).
- **Banner colorati** (competizioni, squadre): `Dropdown` con opzioni che hanno `color`/`logoNode` si apre come elenco di banner (gradiente `mixHex`, logo in cerchio bianco); `PickerModal banners` per le ricerche. Pillola competizione = banner con logo (`compLogoN`), mai pillola piatta.
- **Calcolatore**: pannelli e riquadri nel colore della squadra del giocatore (`TintProvider`, `Panel ring`); `NumInput ring` per le quote (piccolo, 3-4 cifre); `ShotsTeam` e' la scheda squadra unica (giocatore, squadra, avversario) con rango `r°/n` nelle tessere.
- **Migliori Giocatori**: righe basse (~97 pt), a tutta larghezza, margini 10; soglie `Segmented hug`.
- **Scelte a pagina intera** (Calcolatore): ricerca giocatore `shared/PlayerSearch.js`, campionato/squadra `shared/FullPicker.js` (barra di ricerca in alto, banner grandi colorati con logo). Le tendine piccole restano solo per scelte corte.
- **Colori competizioni**: `data/compColors.js` (colore dominante del logo) per le competizioni senza palette; ogni competizione ha sempre un banner colorato e un logo assoluto (mai percorsi relativi in nativo).
- **Prossima partita**: `NextMatchBtn` nel banner giocatore e in ogni scheda squadra; pesi dei testi nelle righe di Migliori Giocatori: 700 massimo.

## App nativa: caratteri fissi, tendine, scelte a pagina intera (11 nov 2026)
- **Caratteri a dimensione fissa**: i file dell'app importano `react-native` tramite `native/shared/rn.js` (alias in `metro.config.js`), che mette `allowFontScaling={false}` su `Text` e `TextInput`. Senza, iPhone con "Dimensione testo" grande ingrandiva tutto (banner altissimi, titoli tagliati) e il sito no. Non importare `Text` da altrove.
- **Tendine** (`shared/Dropdown.js`): animazione "Cascata" (voci che scendono una dopo l'altra); se sotto non c'e' posto la tendina si apre verso l'alto, mai tagliata.
- **Scelte a pagina intera** (`PlayerSearch`, `FullPicker`): righe compatte come Migliori Giocatori (foto 52, nome 16/600, squadra 12.5, bandiera e nome nazionalita'); la scelta si applica a finestra chiusa (`onDismiss`), mai durante l'animazione.
- **Cambio linea/statistica** (Migliori Giocatori e Matchup): la lista sfuma, poi i banner entrano da sinistra a destra (`FadeInLeft`), calcolo in `startTransition`.
- **Schede Matchup**: misure del sito (stemma 46, nome 12.5, centro 30). Pesi font: nomi 600, numeri 700, mai 800.
- **Riquadri statistiche squadra** (Calcolatore): sfondo scuro `tileBg`, campo `NumInput tint` verde/rosso secondo la fascia di classifica.
- **Prossima partita giocatore**: se nella competizione scelta non ci sono partite (es. Nations) vale la prossima del club.
- Al ritorno dal background la cache immagini si svuota solo dopo piu' di 10 minuti (prima a ogni uscita: al ritorno ricaricava tutto e l'app restava ferma).

## App nativa: aggiornamento automatico in Expo Go
- Il link `exp://…/group/<id>` e' fisso su una pubblicazione: riaprire dai recenti di Expo Go mostra la versione vecchia. Il segnalibro in Home e' `native-link/apri.html` (legge `latest.json` dall'API GitHub, senza cache).
- La CI scrive `app/build.json` (`sha` del commit) dentro l'app e `sha` in `native-link/latest.json`; `shared/AutoUpdate.js` all'apertura e al ritorno dal background confronta i due e apre da solo la versione nuova (`Linking.openURL`), con blocco di 3 minuti sulla stessa versione per evitare cicli. `native/build.json` = `dev` (nessun controllo) per prove e anteprima.

## App nativa: scheda giocatore e pannello (club e nazionale)
- Una scheda sola per giocatore: club e nazionale cambiano solo colori e squadra scelta (`shared/playerCtx.js`). Se si apre la nazionale senza dati propri, statistiche, partite e carriera arrivano dal club. Informazioni = sempre il club (mai la nazionale come squadra con contratto) con bandiera nella Nazionalita'.
- Colore di banner, riquadri e tabelle = squadra della competizione scelta nelle Statistiche (club = colore club, Nations League = colore nazionale); aprendo dalla nazionale parte la nazionale. Sotto il nome: stemma club + nome | bandiera + nazione, per tutti i giocatori (`ClubNatN`).
- Niente "voto stagione" nel banner. Affidabilita' prossima partita: tendina con icone (come Migliori Giocatori) e numeri colorati (`scoreColorSmooth`).
- Contorni multicolore (`RingBox`) FERMI: l'animazione girevole costava un livello grafico per tasto.
- Al ritorno dal background il risultato/minuto live e le statistiche si aggiornano SUBITO (Home e pagina partita, un giro immediato); `__resumeUntil` non esiste piu'.
- Nel pannello laterale la foto non ha riquadro ne' sfumatura (volto ritagliato, appoggiato al fondo).

## App nativa: ricerca, riquadri e partite (11/11)
- **Aggiornamento automatico**: si controlla solo all'avvio a freddo e ogni versione si apre una volta sola (mai al ritorno dal background: prima poteva riaprire l'app o bloccare il tocco). In `native_expo.yml` il passo "Link fisso" riparte da `origin/main` a ogni tentativo (niente conflitti col rebase dei dati).
- **Background**: entrando in background e a ogni `memoryWarning` si svuota la cache immagini in memoria (`Image.clearMemoryCache()`).
- **Ricerca**: squadre nazionali = bandiera tonda senza cornice (`FlagN bare`) e banner con i colori della bandiera (`shared/flagColors.js`); giocatori = bordo nitido del colore squadra e riempimento piu' chiaro; nazionalita' (bandiera e nome) accanto alla squadra per tutti (`natFor` in `searchN.js`, anche dalla carriera).
- **Riquadri**: `Panel` ha il bordo nel colore della scheda (`TintProvider`: squadra o nazionale nel giocatore, competizione nella partita) e quando il colore cambia sfuma (`PanelRing`). La testata partita mostra solo il nome della competizione, centrato.
- **Giocatore**: Partite con tendine Competizione e Stagione (contorno), tutte le partite scelte si caricano da sole; cambiando Totale/Casa/Trasferta restano i numeri di prima finche' arrivano i nuovi (la pagina non salta). Prossima partita delle competizioni d'archivio (Nations League…) dai file `giorni/` dei prossimi 12 giorni (`useUpcoming`).
- **Formazioni (prima della partita)**: tendina statistica a sinistra e tendina linea (Over) a destra, sulla stessa riga.
- **Vetro (concept C)**: banner piccoli (ricerca, ricerca giocatore del Calcolatore, Migliori Giocatori) = sfumatura dal colore squadra (alpha .34 -> .06), bordo 1,5 del colore squadra, filo bianco sottile; niente blur (liste lunghe).
- **Banner con testo bianco**: colori troppo chiari (bianco…) passano da `legible()` (`shared/ui.js`); le nazionali usano la bandiera tonda senza cerchio bianco (`bare`) e i colori della bandiera.
- **Stagioni giocatore (Partite)**: sempre "2025/2026" (stagione calcistica luglio-giugno anche per Europei, Mondiali, amichevoli), mai anni solari; la tendina Competizione ha i loghi.
- **Stadio**: se manca dalle altre fonti si prende da ESPN (`shared/espnStadium.js`, solo per quelle partite).
- **Calcolatore**: handicap dei campionati minori applicato a meta' forza alla media "Campionato" del giocatore, solo nel calcolo Nations League (`playerLeagueHcap`); le medie mostrate restano vere.
- **Partita**: i timer (formazioni, storie) si fermano in background e per 5 s dopo il ritorno.

## App nativa: loghi per tema, tendina giocatore, ritorno dal background
- Loghi competizione scuri (Premier, Ligue 1, Champions, Europa, Conference…): `CompLogo`/`logoSrc` in `shared/ui.js`; Night = bianchi (tintColor), Light = originali scuri. Ogni logo competizione nuovo passa da `CompLogo`/`LeagueLogo`/`Mark`, mai `Image` diretta.
- Stemmi squadra (`TeamCrest`, `TeamLogoN`): in Night contorno bianco sottile.
- Tendina giocatore (`PlayerSheet`) si apre al 72% dell'altezza; il Dock sparisce mentre tendina o pannello giocatore sono aperti e riappare alla chiusura (`sheetOpen` in App.js).
- Ritorno dal background: i gesti (`pan`, `edge`) vengono ricreati (`epoch`) per sbloccare i tasti.
- Ricerca/scheda giocatore: bandiera nazionalita' sempre, via `useNatFor` (carriera lazy).
- Dock: nascosto con opacita'/translate (mai smontato: i layout Reanimated del Dock smontati davano schermo bianco). `Guard` (App.js) protegge tendina/pannello giocatore e radice: un errore di disegno non lascia piu' lo schermo bianco.
- Partita: pagina aperta appena pronti i dati principali (`prepareMatchCore`, max 2,5 s), meteo/arbitro/rose dopo; schede (Panoramica…) non fisse in alto; swipe a schede esclude i 28 px sul bordo sinistro (lo swipe indietro vince).
- Stadio: foto anche con nome diverso (San Siro → Giuseppe Meazza) via alias/termini caratteristici.
- Bandiere: `flagCode` copre tutte le nazioni FotMob (`EXTRA_ISO2`), PNG per ogni codice in `aurora-src/public/flags` e `native-link/flags`.
- Calcolatore: `NextMatchBtn` carica le partite dei prossimi giorni (`useUpcoming`) cosi' la nazionale mostra la sua partita e non quella del club.
- Ritorno dal background: nessuno svuotamento delle immagini (causava il "refresh"); svuotamento solo su memory warning o dopo 10 minuti.
- Swipe indietro da qualunque punto: gesto `anyBack` (App.js) su tutta la pila nativa, attivo quando la pagina in cima e' sulla prima scheda o non ha schede (`shared/backGate.js`: `useBackGate` in DayPagerN/SwipeBodyN). Sulla prima scheda lo swipe a schede NON prende il movimento verso destra (niente pagina che si sposta). Ogni nuovo swipe a schede deve usare `useBackGate(index > 0)` e `activeOffsetX([-N, index > 0 ? N : 100000])`.

## Hook sempre chiamati (tendina giocatore)
- Mai `usePlayerSheet() || usePlayerPanel()` o altri hook dentro `||`, `&&`, `?:` o dopo un `return`: se il primo e' vero il secondo non viene chiamato, React lancia "meno hook di prima" e l'app si resetta alla Home (schermo nero). Ogni hook in una variabile, poi si combinano i valori.

## Tendina giocatore e apertura partita (11 nov)
- Tendina: la barra X/Profilo sta sempre sul fondo dello schermo (compensa lo spostamento della tendina a meta') con sfumatura come il sito; riaprire durante la chiusura risale senza smontare; lo smontaggio a fine chiusura solo se nel frattempo non e' stata riaperta.
- Partita: la testata (squadre, risultato, stato) si vede subito dai dati della Home, le schede arrivano dopo i dati principali; l'elenco FotMob del giorno parte in parallelo al dettaglio (`fmDay` in `fotmob.js`).

## Tendina piena, dati in anticipo, guardia dei tasti (11 nov)
- Tendina giocatore: si apre alla massima altezza; la X la fa scendere con animazione (la scheda resta disegnata finche' e' sotto lo schermo).
- `bootShared()` (squadre, partite, giocatori) parte a riposo 2,5 s dopo l'avvio: prima partiva al primo tocco su una partita e valeva la maggior parte dell'attesa.
- Ritorno dal background (riscritto): come tutte le app. Entro 10 minuti niente reset, niente gesti ricreati, niente guardie; oltre 10 minuti l'app riparte da zero (`onReset`: Screen + contenitore gesti). Unico accorgimento: dati in rete fermi 5 s dopo il ritorno (`__resumeUntil`).
- Tasti di Home, Dock, barre, ricerca e menu (`App.js`) usano il `Pressable` di react-native-gesture-handler (riconoscimento nativo, lo stesso di swipe e scroll), non quello di JS: dopo il background i tocchi letti da JS potevano restare muti mentre scroll e swipe andavano. Dentro un `Modal` (Calendario) resta il `Pressable` di react-native (`RNPressable`): i gesti nativi li' non hanno il contenitore.

## App nativa: archivi .gz, swipe tra schede, amichevoli (regole fisse)
- Hermes non ha `DecompressionStream`: i file `.json.gz` (archivio partite, falli) si leggono con `globalThis.__gunzip` (fflate, impostato in `native/shared/shim.js`; `npm install fflate` e' nel workflow `native_expo.yml`). Senza, storico giocatore/squadra e falli restano vuoti in silenzio.
- Swipe tra schede (`DayPagerN`, `SwipeBodyN`): le schede scorrono col dito; la scheda vicina si monta all'inizio del trascinamento; l'indice cambia solo a scorrimento finito (mai un ridisegno pesante durante l'animazione).
- Cambio Totale/90' e Casa/Trasferta nelle classifiche: `useDeferredValue` + `pending` su `StatListsN` (la lista si abbassa subito e torna piena a calcolo finito), mai blocchi.
- Amichevoli: nome italiano ("Amichevoli nazionali" / "di club" / "femminili" / "U21") e immagine del mondo (`world.png`) tramite `friendlyFix` in `leagues.js`.
- Stemmi di notte: contorno con ombra bianca (`TeamCrest`), mai copie bianche sfalsate (facevano il riquadro bianco).

### App nativa: swipe indietro nella partita (regola fissa)
- Dalla testata della partita (risultato, squadre) e dalla barra delle schede lo swipe indietro funziona sempre, su qualunque scheda; dentro il corpo delle schede, dalla seconda in poi, lo swipe a destra torna alla scheda precedente (`useBackGate(blocking, true)` + `pagerTouch` in `shared/backGate.js`).
- I riquadri con gesto proprio (momentum, storie della Panoramica) non devono prendersi i trascinamenti orizzontali veloci: il mirino segue il dito solo dopo una breve pressione.

## Nativo: barre e selettore dei periodi (statistiche partita)
`native/shared/CompareBars.js`: la barra parte gia' dal valore vero e scorre dal valore attuale al nuovo, mai `value = 0` prima di animare. Il selettore Totale / 1° tempo / 2° tempo usa la pillola normale (stessa animazione di tutti gli altri tasti a pillola, niente scivolo liquido). `Card` di `PartitaStats.js` sta fuori dal componente: definita dentro, le barre venivano ricreate a ogni cambio e non scorrevano.

## Nativo: Migliori Giocatori, riga linee + statistica
Come nel sito: il filtro delle linee (`Segmented fit pad={10}`) prende lo spazio che resta e, se le voci non entrano, scorre di lato; il tasto statistica (`Dropdown slim`, `flexShrink: 0`) non si tronca mai ("Commessi", "In porta" sempre interi).

## Aperture pesanti, arbitri, giocatori (nativo)
- Campionato e Squadra montano la pagina vera solo a tendina finita (`afterSlide`): durante lo scorrimento resta lo scheletro leggero.
- Bandiera arbitro sempre con `FlagN` (mai `${BASE}flags/` nel nativo); nazione dal profilo, poi da FotMob, poi dal campionato (`leagueCC`).
- Schermate giocatori di competizioni e squadre: solo Totale / Ogni 90' e "Vai a" (niente Casa/Trasferta ne' filtri Attacco/Difesa/Disciplina/Gioco).
- Minuti di recupero ("45+1'") nelle pillole dei tiri: la pillola si allarga, il testo non si taglia.
- Cambio tabella giocatori (Totale/Ogni 90'): solo sfumatura (opacita') con piccolo scarto tra le righe, su podio e righe; niente spostamenti (si bugavano).
- Pagine native in pila dentro `Guard`: un errore in una scheda riporta indietro invece di crashare l'app. Competizioni d'archivio senza stagioni con dati: mai aprire la scheda (torna indietro).
- Banner squadre nei selettori a pagina intera (`FullPicker`, `soft`): stesso tono scuro e sfumato dei banner dei campionati.
- Partita di un campionato minore: la scheda Classifica usa la stagione in corso FotMob (`LiveClassifica`).
- Controllo identificatori non definiti nel nativo (eslint no-undef) prima di pubblicare: un nome mancante in una scheda la chiude da sola.
- Barra delle schede (Panoramica, Statistiche...): scorre in orizzontale e tiene visibile la voce scelta e la successiva (`TabStrip` in `TabsN.js`); nessuna voce tagliata.
- Swipe indietro: dai banner/testate (partita, campionato, squadra, giocatore) e dalla barra delle voci torna sempre indietro; lo swipe laterale delle schede e' attivo solo dentro il contenuto sotto (`DayPagerN`/`SwipeBodyN`, `backScoped`).
- Banner squadra nelle carriere e nelle statistiche del giocatore: toccati aprono la scheda della squadra.
- Loghi scuri (Champions, Premier, Ligue 1, Conference) risolti alla fonte in `buildLeagues` con il file FotMob: bianchi di notte ovunque.
- Competizioni della stessa famiglia (Nations League, World Cup, qualificazioni) usano i colori del torneo principale (`familyOf`).
- Dock: cambio voce con carosello (concept B): Home e pagine scorrono attaccate 1:1 (260-280 ms), a destra andando avanti e a sinistra tornando; swipe indietro e pagine non-dock restano come prima.

### Prova di avvio senza telefono (obbligatoria prima di ogni push in `native/`)
- `node native/tools/smoke.cjs` impacchetta `native/App.js` e lo esegue in Node con i pacchetti nativi finti: trova import mancanti e codice che gira troppo presto ("Property 'document'/'SITE' doesn't exist"). Gira anche in CI (`native_expo.yml`) prima di pubblicare: se fallisce, nulla va sul telefono.
- `import './shared/shim'` deve restare la PRIMA riga di import di `native/App.js`: il livello dati del sito (`load.js`) legge `document.baseURI` appena viene importato.
- Ogni file nuovo/modificato: anche `npx eslint` con `no-undef` sul file toccato (da qualsiasi finestra di lavoro).

## Tasti a pillola ("pillola liquid glass") e riquadri colorati
- Ogni selettore a 2-3 voci (Tutte | Live, Italia | Francia | Previste…) usa `Segmented` di `native/shared/ui.js` (indicatore azzurro-viola che scorre); supporta `icon` per gli stemmi. Si chiama "pillola liquid glass".
- Banner "Numeri da tenere d'occhio": solo giocatore sullo sfondo bandiera/stemma, niente sfumature sopra la foto.
- Logo Ligue 1 (53) in versione piena e' opaco: in scuro si usa la variante `/leaguelogo/dark/53.png` senza tinta.
- "Affidabilita' prossima partita": `Panel` con `tint` + `vivid` nei colori della squadra del giocatore.
- Grafico hit rate: la riga nome/logo/puntini ha altezza fissa (20): col logo non deve spostare il grafico nello swipe.

## Niente `InteractionManager` da react-native (12/11/2026, regola fissa)
- La build Expo usa l'ULTIMO SDK (`create-expo-app@latest`): react-native 0.88 ha tolto `InteractionManager` dal core e `InteractionManager.runAfterInteractions` dava "Cannot read property 'runAfterInteractions' of undefined" aprendo Migliori Giocatori e Migliori Matchup. Usare sempre `import { InteractionManager } from '../shared/afterInteractions'` (timer, stessa interfaccia), mai da `react-native`. Prima di usare un'API di react-native nuova controllare che esista nell'ultima versione.


## Live: ogni 3 secondi (12/11/2026)
- Home (`refresh`) e pagina partita (`prepareMatch(id, true)`) si aggiornano ogni 3 s quando c'e' una partita live; prima del fischio dentro la finestra formazioni ogni 3 s, fuori finestra 30-60 s. Stessa fonte (worker `/f` e `/fx`), cosi' il minuto e' uguale ovunque.
- Al ritorno dal background e alla chiusura di una pagina sopra la Home parte subito un giro (Home: `__homeLiveNow`). iOS non esegue codice in background (Expo Go): in background niente giri, ma appena l'app torna attiva i dati sono aggiornati subito.
