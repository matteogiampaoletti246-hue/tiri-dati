# ScalperLab (Aurora) — regole che valgono per tutte le squadre, campionati e giocatori

Queste regole sono state chieste dall'utente e vanno applicate a TUTTO ciò che si aggiunge in futuro (nuovi campionati, squadre, giocatori), senza doverle ricorreggere.

## Uniformità
- Ogni scheda (campionato, squadra, giocatore, partita) usa gli stessi componenti per top campionati e minori: stessi font, numero di schede, disposizione, foto.
- Giocatori: tutti (attuali, ritirati, stagioni passate) usano la scheda `pages/Player.jsx` con Profilo / Partite / Statistiche / Carriera. Chi non è nell'elenco attuale si costruisce da `data/archivePlayer.js` (id `fm~<lega>~<stagione>~<id FotMob>`).
- Rose: gruppi per ruolo con volti; per i minori i dati arrivano da `rose.json` (`update_rose.py`, giornaliero). Spaziatura: stessa distanza sopra il primo giocatore, tra i giocatori e sotto l'ultimo.
- Allenatore nel banner squadra: da `rose.json` (FotMob), poi dalle formazioni.

## Stagioni e competizioni
- Il tasto stagione elenca SOLO le stagioni in cui squadra/giocatore ha davvero giocato quella competizione (`useSeasonList`, `teamSeasons`, `playerSeasons`).
- La tendina COMPETIZIONI di una squadra mostra SEMPRE tutte le competizioni giocate in tutta la sua storia (indice `tidx`, `useTeamView` in `components/past/PastBits.jsx`), qualunque stagione sia scelta; la tendina STAGIONI si adatta alla competizione scelta. Scegliendo una competizione non giocata nella stagione selezionata la stagione torna ad "Attuale" (o alla piu' recente giocata). Vale per ogni squadra e per le competizioni aggiunte in futuro.
- Stagione e competizione scelte si ricordano finché la scheda resta nella pila (apro un giocatore e torno indietro); aprendo una scheda da zero si riparte da "Attuale" (`useEntityScope`, `useSel`). Una stagione richiesta da un link vale una sola volta (`initSeason`).
- Nomi squadra tra fonti diverse: `teamIdByName` (alias, sigla, mai due squadre simili).
- Stagioni passate: stesse pillole della stagione attuale (Totale/Casa/Trasferta, Tutte/Attacco/Difesa/Disciplina/Gioco).

## Partite squadra
- Competizione e stagione sono sulla stessa riga. Stagione attuale, "Tutte": parte dalle ultime due partite giocate con le prossime sotto (le precedenti dietro il tasto). Stagioni passate: dalla più recente alla più vecchia, a blocchi colorati per competizione.

## Mappa tiri
- Le coordinate FotMob si specchiano in `data/fotmob.js` (campo e porta): vale per tutte le mappe.
- Cambiare tiro con le frecce deve essere fluido (niente componenti ricreati a ogni render, foto precaricate).

## Interfaccia
- Il tasto "Vai a" è fisso in basso a destra: non deve mai coprire i tasti competizione/stagione.
- Barra in basso, scorrimento tra schede (la pagina riparte dall'alto) e altre regole già in `.github/webkit/preview.mjs`: ogni modifica si prova su iPhone simulato prima di pubblicare.

## Dati
- Dopo ogni partita finita: `dopo_partita.yml` (ogni 5 minuti, gate su feed live) aggiorna partite, voti, statistiche e indici.

## Tabellone (coppe a eliminazione diretta)
- Dentro Classifica c'e' il selettore Classifica | Tabellone (`components/bracket/ClassificaSwitch.jsx`), per ogni competizione in `CUP_FM` (`data/bracket.js`): per aggiungere una coppa basta aggiungere il suo id FotMob.
- Il tabellone si ricava da `arch/<fm>/<stagione>.json` (turni `playoff,1/16,1/8,1/4,1/2,final`), rigori dall'evento `PenaltyShootout` delle partite. Stagione senza turni a eliminazione: il Tabellone non si mostra (niente pillola, niente scheda).
- Fasi in pillole: ogni schermata mostra due fasi e il passaggio e' uno scorrimento orizzontale (`components/bracket/Bracket.jsx`, posizioni calcolate a ogni fotogramma, mai componenti ricreati). Finale: locandina con colori e logo della competizione.

## Ritorno da una partita
- Aprendo una partita (anche dal Tabellone) e tornando indietro, il campionato resta sulla stessa stagione, scheda, Classifica/Tabellone e fase (`useEntityScope`/`useSel` con chiave `lg-<fm>`); si resetta solo aprendo di nuovo la competizione da zero.

## Partite minori non iniziate
- Stesse schede dei top campionati: Panoramica, Statistiche (`data/archiveMetrics.js`, medie a partita dalla stagione archiviata), Formazioni, Classifica; niente "Giocatori migliori" né Affidabilità; ragnatela in "Duello in numeri"; meteo da 3 giorni prima.

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

## Campionati minori
- Partite di tutta la stagione in corso in `partite_extra.json` (`extra_partite.py`), cosi' forma, numeri da tenere d'occhio e medie sono affidabili. Arbitro: barra delle medie anche per i minori e nome nella fascia Stadio/Meteo/Arbitro.
- Autogol: nella mappa tiri compare come gol della squadra avversaria, specchiato (`og`).

## Campionati aggiunti (extra) — regola fissa
- Tutte le competizioni di `arch/index.json` sono raggiungibili: quelle non in `data/leagues.js` diventano campionati d'archivio `fm-<id FotMob>` (`addArchiveLeagues` in `data/archive.js`, `arch: true`): scheda campionato dalla stagione piu' recente, tendine di squadra/giocatore (`LID_BY_FM`), ricerca. In Home nei giorni in cui giocano (vedi "Tutte le competizioni in Home").
- `archivio.py`: lega irraggiungibile 3 volte = `skip`; `done` solo se tutte le stagioni sono scaricate; `arch/.complete` quando tutte sono `done` o `skip` (il workflow non si rilancia piu' a vuoto).
- Un campionato/coppa "extra" ha una riga in `data/leagues.js` (extra: true, fm), l'id in `FM_ID` (`data/archive.js`), l'id in `LEGHE` di `extra_partite.py` (prima i campionati, poi le coppe), in `ADDED` di `archivio.py`/`partite.py` (scaricati per primi) e, se ha rose, in `update_rose.py`.
- La stagione in corso di una squadra/giocatore di un extra si legge dall'archivio (`useTeamView` → `eff`, `RAW.extra.sk[fm]`): stesse schede, pillole e barre dei top campionati. Le tendine mostrano "Attuale".
- Mai lasciare una scheda extra vuota: se i dati sono in `arch/` e `partite/` devono comparire. Sempre provare su iPhone simulato (squadra + giocatore) prima di confermare.
- Gli swipe non devono far scattare: pillole senza ricostruire le liste (niente `key={mode}`), niente caricamento a due tempi; sopra le finestre (`data-no-back`) lo swipe indietro e' disattivato. Monitor fluidita': Menu -> Diagnostica.
- Tendine della Home: restano com'erano nel giro Home -> partita -> indietro (`useEntityScope('home')`).
- Formazioni: "probabile" finche' FotMob non dà `standard`; le icone sui volti (gol, assist, cartellini, cambio) vengono da `pl` (gol/assist) e dagli eventi.

## Formazioni (regola fissa, tutte le partite: live, prima del fischio, finite)
- Un solo campo con le due squadre (`MatchLineupsPanel.jsx`, `DualPitch`): casa in alto specchiata (ala destra a sinistra), ospite in basso, portieri agli estremi; nome casa nell'angolo in alto a sinistra, ospite in basso a destra; in cima "Formazione probabile/ufficiale" (o "Formazioni" a partita giocata) e i due moduli. Niente tasto di cambio squadra.
- Sotto il campo: selettore squadra (`SidePicker` in `MatchLineupsPanel.jsx`, concept Sofascore): due pillole a meta' larghezza, larghe quanto il campo, casa a sinistra e ospite a destra con stemma + nome; la scelta scorre (striscia orizzontale, niente componenti ricreati) e mostra la pillola dell'allenatore nei colori della squadra e sotto, in colonna, tutta la sua panchina. Il "niente tasto di cambio squadra" vale per il campo, non per queste pillole. Una sola squadra con dati = niente pillole.
- Icone sul giocatore (concept A, posto fisso): voto a pillola sotto il volto, cartellino in alto a sinistra, gol/assist in colonna in alto a destra, cambio = solo le due freccette (verde su / rossa giu', niente sfondo, bordo o minuto) in basso a sinistra, capitano "C" in basso a destra, stella gialla al migliore in campo.

## Fluidita' (priorita' massima)
- Partite d'archivio: appena compare una lista (`ArchRow`) il file della stagione (`partite/<fm>/<stagione>.json.gz`) si scarica a riposo, al tocco della riga parte `prepareMatch`.
- Una partita si mostra solo quando e' pronta: `data/prepare.js` (`prepareMatch`, una promessa per partita, avviata al tocco della riga in `MatchRow`), spinner unico in `pages/Match.jsx`; niente riepilogo/momentum/statistiche che arrivano dopo.
- Cambio giorno dal calendario: `dayReady` aspetta gli orari reali; la riga dell'orario e' sempre riservata (niente salti di altezza).
- La fotografia per lo swipe indietro (`cloneVisible` in `lib/carousel.js`) copia solo la parte visibile.

## Colori e loghi competizioni
- Colori scelti dall'utente in `PALETTE` (`data/leagues.js`): banner e pillole Home. Loghi dei campionati/coppe extra da FotMob (`leaguelogo/<fm>.png`, `dark/`). Le squadre delle coppe nazionali mostrano il campionato (`CUP_IDS`), e squadre omonime di altro paese non si fondono (es. Arsenal in Coupe de France).

## Giocatori: competizioni e stagioni (regola fissa)
- Indice `pidx/<id%100>.json` (`giocatori_indice.py`, workflow `giocatori_indice.yml`, ogni giorno): per ogni id FotMob tutte le competizioni/stagioni giocate. `data/playerIndex.js` (`usePlayerCareer`, `resolvePid`) lo usa per: tendina competizioni di Statistiche (squadra attuale + tutte quelle giocate, anche Premier League dell'anno scorso), stagioni per competizione, lista Partite di tutte le competizioni (`PastPlayerMatches items`).
- L'id FotMob si trova da carriere.json, id archivio, rosa della squadra, statistiche della stagione in corso. Anagrafica da carriere.json, altrimenti dalla rosa (`rose.json`); radar da `archivePercentiles` se il giocatore non e' tra quelli dei campionati principali.

## Squadra unica, rose, coppe (regola fissa)
- Una sola scheda per squadra (`findAppTeam` in `data/teamMatch.js`, `t.fmId`): il banner e' sempre quello del campionato nazionale (es. Francoforte = Bundesliga); le coppe sono tendine. Scegliendo una coppa nazionale pura nella Classifica della squadra compare il Tabellone.
- Rose da piu' fonti (`update_rose.py`: FotMob, PitchAPI, API-Football). Statistiche squadra: riquadri Gol/xG/Tiri/Tiri in porta con posizione + riga "Prossima" della competizione scelta (solo se esiste).
- Forma recente = ultime 5 partite in tutte le competizioni: partite in memoria + calendario archiviato della stagione della competizione e del campionato della squadra (`recentOf`, `addLeagueForm` in `data/archiveMatch.js`, unione senza doppioni in `FormCard`); senza partite giocate niente riquadro. Controllo: `forma` in `controllo_squadre.json`. Per le sole coppe nazionali le statistiche pre-partita sono la media coppa + campionato (coppe europee escluse).
- Abbinamento squadra tra app e archivio: prima l'id FotMob della squadra (`teamIdByName` usa `teamByName(...).fmId` o lo stemma), poi il nome (alias `sheff`, `utd`, `wed`...). Prima 525 stagioni-squadra (Sheffield, MK Dons, Hearts, LAFC, NYCFC...) restavano senza statistiche.
- Swipe indietro: oltre la meta' dello schermo si torna, prima la pagina rientra lentamente. Pillole dei turni del Tabellone: la riga scorre e centra la pillola scelta; schede ben spaziate.

## Niente "non disponibile" (regola fissa, ogni pagina presente e futura)
- Statistica, riquadro, pillola, voce o scheda senza dati: non si mostra (mai "non disponibile", "non ancora disponibile", "in arrivo", "nessun dato", mai un riquadro vuoto o un "—"). La pagina parte dal primo elemento con dati. Mai dati inventati (niente sole come meteo finto, niente pareggio per una partita senza risultato).
- Partita: le schede vuote si tolgono (`hasMatchStats`, `hasLineups`, Tabellone da `peekBracket`, caricato in `prepareMatch`); la scheda scelta si ricorda per nome (`usePageTabKey`). Riepilogo: Momentum solo se c'e'. Stadio/Meteo/Arbitro: solo le voci con dato (`InfoBand`).
- Campionato dell'archivio: schede filtrate per dati (`ArchiveLeague`). Prova: `ND` in `preview.mjs`.

## Tendine e finestre
- Ogni tendina (`Dropdown`, `CompSelect`, `MiniSelect`, `StatPicker`) usa `usePopFit`/`popScroll` (`lib/popFit.js`): altezza massima sopra la barra in basso con margine, si apre verso l'alto se sotto non c'e' spazio, non esce dallo schermo, scorre solo la lista (`data-pop-scroll`, overscroll contain). `MenuBackdrop` tiene ferma la pagina dietro; si chiude solo scegliendo o toccando fuori.
- Finestre e fogli (giocatore, stagioni, Vai a, ricerca, menu): `useModalLock` (`lib/modal.js`). Con una finestra aperta nessuno swipe di pagina parte (giorni, schede, indietro, `pageDrag`); la finestra giocatore ha `role=dialog` e `data-no-back`.

## Home: stato e risultato sempre quelli veri
- `refreshStatus` (`data/fotmob.js`): all'avvio (prima della Home, max 2,5 s), cambiando giorno, ogni 30 s e quando l'app torna in primo piano. Top campionati/coppe europee: lista FotMob del giorno (`syncDayTimes` applica anche stato, punteggio e minuto); campionati e coppe aggiunti: `/fx` per le partite iniziate da meno di 5 ore o ancora "live" (stessa cache della pagina partita). Mai "live" per una partita finita.

## Stagioni con suffisso
- Stagioni come "2026-2027 - Apertura", "2026 - Clausura" valgono ovunque: `parseArchiveId` (giocatore e partita), `seasonLabel` ("2026/27 Apertura"), `giocatori_indice.py`, `squadre_indice.py`.
- Stagione in corso con `_s.json` vuoto: giocatori da `statsFromMatches` (squadra e nome dalle formazioni), squadre da `loadTeamStats` (medie a partita). Per mostrare classifiche usare `loadPlayerStats`/`loadTeamStats`, mai `loadSeasonStats`.
- Controllo automatico: `controllo_squadre.py` (workflow `giocatori_indice.yml`) scrive `controllo_squadre.json` con le squadre senza Statistiche/Giocatori e il motivo.
- La scheda archivio di una squadra (`/storico/.../squadra/<id>`) rimanda alla scheda unica se la squadra e' nell'app: prima per id FotMob (`teamByFm`), poi per nome.

## Giocatori di tutti i campionati
- `ourPlayerId` (`data/playerSheet.js`): se il giocatore non e' nell'elenco principale usa l'id archivio `fm~<lega>~<stagione>~<id FotMob>` (id dalla formazione o dalla rosa; prima il campionato della squadra). Il volto in formazione prima della partita apre la scheda, la finestra a partita iniziata ha sempre il tasto Profilo.

## Squadre B / riserve
- Prima si abbina per id FotMob (anche dallo stemma `teamlogo/<id>.png`), poi per nome. `sameSquad` (`data/teamMatch.js`): nomi che differiscono per B, II, III, U19/U21/U23, Reserves, Castilla, Jong, Promesas, femminili, ecc. non sono mai la stessa squadra (`findAppTeam`, `teamIdByName`, `roseOf`, feed live).

## Competizioni di una squadra: tutta la storia
- Indice `tidx/<id%100>.json` (`squadre_indice.py`, workflow `squadre_indice.yml`, ogni giorno): per id FotMob tutte le competizioni/stagioni dal 2010. `useTeamView`: la tendina competizioni elenca sempre tutte quelle giocate (anche con una stagione passata scelta); scelta una competizione le stagioni sono solo quelle giocate; una competizione non piu' giocata parte dalla stagione piu' recente (niente "Attuale", `noCur`).

## Numeri da tenere d'occhio (tutte le partite)
- `matchKeyNumbers` (`data/extras.js`): un solo calcolo per top campionati (`metricOf`) e campionati/coppe aggiunti (`archiveMetrics`, altrimenti `listMetrics`). Per ogni statistica di `CATEGORY_DEFS` la posizione nel proprio campionato (1° = migliore; statistiche negative al contrario): solo le squadre tra le prime o le ultime (~12%, almeno 2), con valore e posizione, casa e trasferta alternate, al massimo 8. Valori condivisi da molte squadre non sono primati. Vittorie fuori casa e Over 2,5 solo se fuori dal comune. Niente di notevole = niente riquadro.

## Meteo e arbitro (campionati aggiunti)
- Meteo (`data/weather.js`, Open-Meteo, da 3 giorni prima): stadio da `stadi.json`, poi stadio FotMob della squadra di casa (`v` in `rose.json`, `update_rose.py`), poi `stadi_ex.json` (`stadi_extra.py`), infine geocoding filtrato per paese del campionato (risultati ricordati sul telefono). Il nome dello stadio FotMob riempie anche la voce Stadio.
- Arbitro: FotMob (`/fx`), poi `arbitri_extra.json` (`arbitri_extra.py`, API-Football con `API_FOOTBALL_KEY`, partite di oggi e dei 3 giorni dopo), letto in `prepareMatch`. Workflow `arbitri_extra.yml` ogni 4 ore. ESPN non da' gli arbitri (verificato). Mai nomi inventati.

## Tabellone fluido
- Riquadri del tabellone con `contain: layout paint`; `will-change` solo durante il passaggio tra fasi (da fermo e nello swipe tra schede un solo livello). Stemmi pre-decodificati in `loadBracket`.

## Memoria (l'app resta fluida anche dopo molte pagine)
- Capienza fissa (`lib/lru.js`): fotografie dello swipe indietro ultime 5 (mai quelle "avanti"), file grandi dell'archivio (partite .gz 10, statistiche 30), dettagli FotMob 12, partite pronte 30 (uscendo liberano `det`/`moreDet` e si ricostruiscono se riaperte), tabelloni 16, `useAsync` 120. Ogni cache nuova va limitata allo stesso modo. Prova: "memoria: 40+ pagine..." in `preview.mjs`.

## Niente salti all'arrivo
- `useAsync` ricorda i risultati (LRU): rimontando un pannello i dati ci sono al primo disegno. Banner e barra schede fisse si misurano prima del disegno (`useLayoutEffect`, ultima altezza ricordata). L'animazione `comp-in` solo cambiando competizione/stagione (`useCompIn`), mai all'arrivo. Prova: "pillole: tornando su una squadra..." in `preview.mjs`.

## Foto dei giocatori
- Un solo componente per tutte le foto (`components/PlayerPhoto.jsx`): se la foto manca o non si carica compare la sagoma scura (testa e spalle) sul colore del riquadro che la contiene (colori squadra in formazione e nel banner), mai l'icona di immagine rotta ne' le iniziali. Formazioni, rose, liste, finestre e banner usano la stessa foto (id FotMob, `resolvePid`). Il banner del giocatore e' `EntityBanner person`.
- `foto_check.py` (workflow `carriere_extra.yml`) scrive `foto_mancanti.json`: gli id senza foto su FotMob (circa il 16%).

## Icone gol e assist
- Gol = pallone bianco con pentagono e cuciture neri (`BallIcon`), assist = scarpino dorato basso e inclinato, punta in basso a destra, tacchetti sotto (`BootIcon`), in `components/match/EventIcons.jsx`: usarle ovunque (formazioni, Riassunto, finestre, liste, mappe). Mai emoji.

## Partite squadra: "Partite precedenti"
- Premendo il tasto la pagina non si sposta: la partita che si guardava resta alla stessa altezza (si compensa l'altezza aggiunta sopra). Lo stato "aperto" si ricorda finche' la scheda e' nella pila (`useSel(teamId, 'more-<comp>')`).
- Nelle liste di partite sempre "vs" (mai "@").

## Affidabilita' e arbitri
- Scheda Affidabilita' (partite non iniziate): solo giocatori con voto >= 7,00 (`okVoto`, `MIN_VOTO` in `data/topPlayers.js`); senza nessuno la scheda non c'e'.
- Scheda Arbitri di un campionato: SOLO per i 9 top campionati (top 5 + Pro League, Eredivisie, Primeira Liga, Super Lig), coppe europee e competizioni internazionali (`refsAllowed` in `data/archive.js`, paese `INT` dell'indice); per tutte le altre niente pillola ne' riquadro. Dove c'e': tutte le stagioni per top 5 e coppe europee (`refsAllSeasons`), per gli altri solo la stagione in corso. Il nome dell'arbitro nella partita (fascia Stadio/Meteo/Arbitro) e le barre delle medie restano per tutte le competizioni.

## Classifiche: zone e leggenda
- FotMob per molte stagioni da' la classifica a gironi/conference (`tables`): `archivio.py` e `tabelle_gironi.py` (workflow Archivio storico) la salvano come `groups: [{n, table, legend}]` (un solo gruppo = `table` + `legend`); `nogroups` = FotMob non ha classifica. `StandingsPanel` mostra un blocco per gruppo con le sue zone e la sua leggenda.
- Le lineette colorate vengono dalla fonte (`qualColor` delle righe, `legend` della stagione). Se FotMob non ha la tabella e la classifica e' ricostruita dalle partite, le posizioni della leggenda si applicano solo dove la classifica finale e' a punti (`ZONES_NOT_BY_POINTS` in `data/archive.js` esclude MLS, Argentina, Austria, Belgio, Grecia e coppe). La leggenda c'e' solo se le righe hanno colori. Mai zone inventate.

## Mappa tiri: tiri murati
- Ogni pallino ha un'area di tocco trasparente ampia (~54 px, `ShotDot.jsx`) in tutte le mappe: si tocca facilmente anche se piccolo.
- Un tiro murato (`outcome === 'Murato'`) non e' in porta (`onTarget` false anche se la fonte dice il contrario): pallino vuoto, traiettoria tratteggiata fino al punto in cui e' stato fermato (`bx`,`by`) chiusa da un trattino perpendicolare (`BlockTrace` in `ShotDot.jsx`), mai nella grafica della porta. Vale in ogni mappa (`MatchShotMap`, `ShotExplorer`, `MiniShotMap`).

## Carriere
- `car/<id FotMob % 100>.json` (`carriere_extra.py`, workflow `carriere_extra.yml`): carriera di tutti i giocatori delle rose e dei top 5, con senior (`car`), giovanili (`yo`), nazionali (`nt`). `careerByFm` in `data/carriere.js`. La carriera ricostruita dalle sole stagioni di un campionato non sostituisce quella completa.
- `CarrieraPanel`: periodi consecutivi nella stessa squadra in una sola pillola (intervallo e somma presenze/gol/assist, `mergeConsecutive`); se tra due periodi c'e' un'altra squadra restano separati. Sezioni Nazionale e Giovanili sotto.

## Statistiche complete per ogni stagione
- Indice giocatori `pidx` comprende anche chi non e' nelle classifiche ufficiali (si ricava dalle partite archiviate). `loadPlayerStatsFor(fm, sk, pid)`: classifiche ufficiali se il giocatore c'e', altrimenti statistiche calcolate dalle partite. `playerSeasons` legge `pidx`.
- `controllo_stagioni.py` scrive `controllo_stagioni.json`: per ogni competizione/stagione partite scaricate, statistiche, e (con la rete) un campione FotMob per capire se una stagione "dimenticata" va riscaricata. Verificato: dove mancano statistiche FotMob non le ha.

## Swipe indietro: la pagina vera prima della fotografia
- Dopo il ritorno la fotografia sotto resta finche' la pagina vera e' disegnata (`waitDestination` in `lib/carousel.js`: alcuni fotogrammi stabili, max 3 s, poi dissolvenza); senza fotografia c'e' una superficie dello stesso colore dell'app, mai il nero. Prova: "swipe indietro: azioni veloci..." in `preview.mjs`.
- Home: il minuto live si aggiorna ogni 10 s solo se c'e' una partita live, altrimenti ogni minuto.

## Risultati sempre aggiornati (regola fissa, ogni competizione presente e futura)
- `risultati.py` (workflow `risultati.yml`, ogni 10 minuti; ogni 3 ore anche i 7 giorni dopo): feed FotMob del giorno (una richiesta copre tutte le leghe) -> `giorni/<data>.json` `[id, fm, utc, idCasa, idOspite, casa, ospite, punteggio (solo a partita finita), stato n|l|f|c, eliminata]` e correzione delle righe della stagione in corso in `arch/<fm>/<stagione>.json` (risultato, finita, iniziata, annullata, squadra eliminata ai rigori in posizione 9). Commit solo se qualcosa cambia; `giorni/` tiene 10 giorni.
- App: una stagione in corso (`isCurrent`) con righe dall'orario passato e senza risultato si corregge da `partite_extra.json`, `giorni/` e `/fx` (iniziate da meno di 5 ore) in `freshSeason` (`data/archive.js`): nuovo array `fix`, evento `sl-arch`; chi mostra la stagione usa `useArchFresh`/`useArchAny` (Partite, Tabellone ricalcolato, squadra, archivio squadra). Al primo arrivo si aspetta al massimo 1,2 s, poi ogni minuto.
- Tabellone: senza l'evento `PenaltyShootout` decide la squadra eliminata del feed (`m[9]`). Home: le partite extra iniziate da oltre 5 ore e senza risultato si chiudono da `giorni/`.
- Prova: "risultati: partita finita con dati vecchi in cache..." in `preview.mjs`.

## Giornate dalle date (competizioni aggiunte e d'archivio)
- `data/rounds.js` (`roundBlocks`, `blockTag`, `currentBlock`): un turno numerico si divide in gruppi di date (partite a piu' di 3 giorni = gruppo nuovo); i gruppi con almeno il 20% delle partite (min 3) sono riquadri del turno, gli altri diventano "Recuperi" nella loro data (giorno + "· Giornata N"). "In corso"/"Prossima"/"Conclusa" dalle date (una giornata la cui ultima partita e' passata da 36 ore e' conclusa); annullata = "Annull." senza orario ne' risultato; mai risultato e orario insieme (`ArchRow`); il giorno si raggruppa nel fuso di Roma (`dayKey`).
- Controllo: `controllo_giornate.py` -> `controllo_giornate.json` (giornate di oltre 10 giorni prima/dopo la regola). Prova "giornate: nessuna giornata di mesi..." in `preview.mjs`.

## Tutte le competizioni in Home e una scheda per ogni squadra
- Le competizioni d'archivio (`fm-<id>`) entrano in Home nei giorni in cui giocano, come finestre chiuse (`data/dayFeed.js` -> `addFeedRows` in `data/matches.js`): si caricano solo il giorno aperto e i vicini (all'avvio oggi, max 2,5 s con `refreshStatus`). Ordine e raggruppamento: vedi "Home: finestre per paese". Annullate/rinviate non in Home. `/fx` per le partite del feed: max 24 per giro.
- Squadre: id `fm-<id FotMob>` per quelle che l'app non conosceva; `/squadra/fm-<id>` si ricostruisce da `tidx` (`teamFromIndex`, campionato = competizione nazionale a punti piu' recente, colori dallo stemma). `/storico/.../squadra/<id>` apre sempre la scheda unica.
- Competizione d'archivio: la scheda parte dalla stagione piu' recente CON dati (`firstSeasonWithData`), le stagioni vuote non sono in tendina.

## Statistiche giocatore (regola fissa, con due eccezioni a "niente non disponibile")
- Eccezione 1: giocatore con statistiche in almeno una stagione/competizione ma non in quella di partenza: la scheda Statistiche resta e mostra un solo messaggio "Dati non disponibili" (`NoData` in `PlayerTabs.jsx`, anche in `PastStats` per i giocatori), niente riquadri vuoti ne' "–"; le tendine portano alle stagioni/competizioni con dati (in tendina solo quelle con dati, piu' quella di partenza).
- Eccezione 2: giocatore senza statistiche in nessuna stagione e competizione (dati dell'app `playerHasCurStats` o righe `pidx`): la scheda Statistiche non c'e' (`Player.jsx`), come la Carriera senza dati.
- `pidx` (`giocatori_indice.py`) segue le stesse regole dell'app: solo `_s.json` v2 e mai le liste con chiave che inizia per `_`; `statsFromMatches` da' a chiunque abbia giocato almeno la voce `mins_played` (presenze e minuti). Cosi' ogni riga dell'indice ha statistiche visibili.
- Controllo: `controllo_statistiche_giocatori.py [n] [--app-vecchia]` -> `controllo_statistiche_giocatori.json` (righe competizione/stagione senza statistiche e motivo). Prova: "statistiche giocatore: dati solo nel passato, nella stagione attuale, nessun dato" in `preview.mjs`.

## Home: finestre per paese (concept Sofascore, regola fissa)
- In alto, da soli: i 9 top campionati (Serie A, Premier League, LaLiga, Bundesliga, Ligue 1 aperti; Pro League, Eredivisie, Primeira Liga, Super Lig chiusi), poi coppe europee, poi competizioni internazionali (senza paese, es. Giovanili internazionali: finestra propria). `TOP_SOLO` in `Home.jsx`.
- Tutte le altre competizioni stanno nella finestra del loro paese (`CountryGroup` in `components/LeagueGroup.jsx`): bandiera + nome (il nome apre/chiude, non e' un collegamento), paesi in ordine alfabetico italiano. Dentro, in ordine di importanza (`importance` in `data/countries.js`: campionati maschili nell'ordine dell'indice, poi femminili/giovanili, poi coppe), ogni competizione con la sua intestazione cliccabile e le sue partite. Il paese si ricava dai dati della competizione (`countryCode`: `cc` dell'indice o nome del paese), mai da un elenco fisso.
- Finestra chiusa = nessuna partita montata, `content-visibility: auto` (altezza fissa nota). Stato aperto/chiuso ricordato nel giro Home -> partita -> indietro (`useSel('home', ...)`). Animazione di apertura `Collapse`.

## Fluidita' della Home (regola fissa)
- Misurato (Chromium, CPU 4x, 10 cambi giorno): blocchi del thread principale 18,6 s -> 7,4 s. Colli di bottiglia tolti: abbinamento squadre del feed (`leagueById` su mappa, nomi normalizzati in memoria a capienza fissa in `teamMatch.js`), raggruppamento per giorno memorizzato (`groupsOf`), ogni giorno si ridisegna solo se cambiano le sue partite (`daySig`), giorni vicini costruiti a pezzi a riposo (`FIRST`/`STEP`), `growBox` solo quando cambia il giorno affiancato.
- Swipe tra giorni (terzo giro, misurato): 3 riquadri fissi che ruotano (`Home.jsx`, nessun montaggio/smontaggio per swipe); il giorno centrale si completa a riposo a pezzi (`STEP`), i vicini mostrano solo le prime finestre (`FIRST`) e solo scorrendo in basso (`deep`) si completano; `end()` scrive gli stili PRIMA di `flushSync`; indice per giorno in `matchesByDate`; aggiornamenti di rete (`later`) solo a pagina ferma e solo per i giorni vicini. Confronto in `aurora_perf.yml` (`gh workflow run aurora_perf.yml --ref main -f ref=dev -f old_ref=main`): confrontare SOLO varianti dello stesso job (il runner varia fino a 2x). Ultimo risultato: tempo in blocchi lunghi 721 ms contro 2223 ms della versione precedente, nodi 1129 contro 3071.
- Il WebKit dell'anteprima disegna in software: i suoi fotogrammi servono solo per confronti relativi (prima/dopo, inizio/fine giro). Prove: "fluidita: 12 swipe di fila...", "fluidita: swipe tra schede...".

## Rose (pannello "Squadra", regola fissa)
- Fonti in ordine: `rose.json` (id FotMob), giocatori dell'app, poi `seasonRoster` (`data/rose.js`): chi ha giocato la stagione in corso per quella squadra (minuti e formazioni delle partite, classifiche ufficiali dei giocatori, gol e cartellini), gruppo "Giocatori". Nessuna fonte = niente scheda Squadra (`Team.jsx`). Foto sempre con `PlayerPhoto`.
- Controllo: `rose` in `controllo_squadre.json` (squadre senza rosa e motivo, prima/dopo).

## Partite squadra: stagione in corso da tutte le competizioni
- "Attuale" = partite in memoria + calendario archiviato della stagione in corso di ogni competizione giocata quest'anno (indice `tidx` + campionato della squadra, `archCurrent` in `TeamMatchesPanel.jsx`, righe `ArchRow`); un giorno gia' presente non si ripete. Controllo: `partite_stagione` in `controllo_squadre.json`.

## Posizioni nelle statistiche (mai "0°")
- Posizione = 1 + squadre con valore migliore (pari merito = stessa posizione); squadra senza quel dato = riga omessa (`PreMatchStats`, `TeamStatsPanel`). Prova: "statistiche pre-partita: nessuna posizione 0°".

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

## Classifiche giocatori: tutti con almeno 180 minuti (regola fissa, ogni competizione presente e futura)
- Nelle classifiche delle statistiche dei giocatori di un campionato (`LeaguePlayersPanel`, `statSections` in `ArchiveLeague.jsx`, `MIN_MIN` = 180) compaiono TUTTI i giocatori con almeno 180 minuti in stagione, in ogni modalita' (Totale e Ogni 90'): niente limite ai primi 50, niente soglia piu' alta (prima 450' in "Ogni 90'"). Nella squadra restano tutti quelli che hanno giocato.

## Testi tagliati (regola fissa)
- Le righe con `truncate`/`line-clamp` (overflow nascosto) e interlinea stretta tagliavano le lettere che scendono (g, p, y, q) e gli accenti: `index.css` (livello components) allarga l'area visibile sopra e sotto e compensa col margine, la riga resta dov'era. Prova: "testi: lettere che scendono non tagliate" in `preview.mjs`.

## Affidabilita' per Eredivisie, Pro League, Superliga (Danimarca), Super League (Grecia), Primeira Liga, Super Lig (regola fissa)
- `calc_extra.py` (workflow `calc_extra.yml`, ogni 2 ore) legge `arch/<fm>/<stagione>.json` e `partite/<fm>/<stagione>.json.gz` della stagione in corso e scrive `calc_extra.json`: medie tiri (totali/in porta, fatti/subiti) di TUTTE le squadre, statistiche di campionato di tutti i giocatori (`upd` per chi e' gia' in `giocatori.json` con id `p_...`, che per questi campionati ha solo 1-2 partite; `players` per chi manca, id d'archivio `fm~<lega>~<stagione>~<id FotMob>`, `lite`) e prossime partite delle squadre senza `fix`. Nomi squadra uniti a quelli API-Football (mai squadre doppie).
- `data/load.js` (`mergeCalcExtra`) unisce il file a `data.json`/`giocatori.json`: il resto dell'app (Calcolatore, Migliori giocatori, scheda Affidabilita' in partita, `PlayerTabs`) non cambia. Chiavi in `EXTRA_KEYS` (`data/calcData.js`; Danimarca = `fm-46`); aggiungere un campionato = riga in `LEGHE` di `calc_extra.py` + chiave in `EXTRA_KEYS`.
- Giocatori `lite`: stanno in `PLAYERS` (ricerca del Calcolatore, Migliori giocatori) ma non in `BY_TEAM`/`BY_KEY`; la scheda si costruisce dall'archivio (`makeArchivePlayer`, `needArchive` in `Player.jsx`) e conserva tiri e ultime partite.
- Partite non iniziate di questi campionati: scheda Affidabilita' come per i top (`PRE_TABS_X`, solo se c'e' un giocatore con voto >= 7,00); Migliori giocatori include gli stessi campionati (`DOMESTIC_KEYS`, max 80 al giorno). Prova: "affidabilita campionati aggiunti" in `preview.mjs`.

## Statistiche previste (partite non iniziate, regola fissa)
- Al posto del tasto "Confronto completo delle statistiche" c'e' il pannello `components/match/PredictedStats.jsx` (concept B): casa a sinistra, ospite a destra con stemmi, una barra divisa per statistica nei colori sociali delle due squadre (se troppo simili l'ospite passa al secondo colore), senza note sul calcolo. Previsto casa = (fatti dalla casa + subiti dall'ospite) / 2 e viceversa (`fallisubiti`, `fuorigiocoAvv`, `gialliAvv` in `SRC`); fattore casa +15% / trasferta -15% SOLO su tiri, tiri in porta e corner (etichetta "Fattore casa"), mai su falli, fuorigioco e cartellini. Riga senza uno dei quattro dati = omessa; niente dati = niente pannello. Prova: "statistiche previste: pannello..." in `preview.mjs`.

## Squadre femminili (regola fissa)
- FotMob le chiama come le maschili ("Barcelona" in Liga F) o con "(W)". Una sola forma ovunque: "Barcelona F" (`womenName`, `isWomenComp`, `isWomenName` in `data/teamMatch.js`; stessa regola in `femminili.py`). Vale per tutte le squadre di una competizione femminile, anche se non esiste una maschile omonima.
- I nomi si cambiano quando i dati arrivano: `loadSeason`, `loadSeasonStats` (`data/archive.js`), righe del feed (`womenFeedRow`), `teamFromIndex`; `risultati.py` (`giorni/`, Home nativa compresa) e `squadre_indice.py` (`tidx/`) li scrivono gia' cosi'. `sameSquad` non unisce mai "X F" e "X". Competizioni dal nome generico (A-Liga, Super Cup olandese): `WOMEN_FM`.

## Swipe indietro: dove parte (regola fissa, sostituisce la vecchia "zona")
- Pagina senza schede/giorni a sinistra (prima scheda compresa): da tutto lo schermo, tranne dentro cio' che scorre o si trascina di lato (`inHScroll` in `lib/carousel.js`). Con schede o giorni a sinistra: dal bordo (`BACK_ZONE`) o dal banner (`data-back-banner`, `EntityBanner` e `MatchHero`). Dal bordo verso sinistra resta il cambio scheda.
- App nativa, prima pagina dopo la Home (`__slDepth === 0`): la pagina web non si muove, si muove tutta la WebView (`drag:<px>`, `drag:-1` = rientra, `home` = chiude; `onMsg` in `native/App.js`). Le pagine con i giorni (`DayPager backEdge`) e il calcolatore hanno lo swipe indietro solo nell'app nativa. Prova: "swipe indietro: con schede a sinistra...".

## Scroll indipendente tra le pagine (regola fissa)
- Tornando indietro una pagina va all'altezza salvata per la sua voce di cronologia; senza altezza o a 0 va in cima, mai a quella della pagina appena lasciata (`ScrollToTop`). Nell'app nativa le pagine aperte cambiando l'hash non hanno chiave: si distinguono col percorso (`keyOf`) e si dimenticano tornando a `/linee-guida`. Prova: "home e squadra non condividono lo scroll".

## Arbitro in partita: ultime due stagioni
- `arbitri_stagioni.py` (workflow `arbitri_stagioni.yml`, ogni giorno) -> `arbitri2/<fm>.json`: gare e medie di cartellini (gialli + rossi) e falli nelle due stagioni piu' recenti con arbitri, stesso arbitro con nomi diversi unito (nome + cognome), medie solo sulle partite con quel dato. `refTwoSeasons` in `prepareMatch`, `RefereeCard`: "N gare nelle ultime 2 stagioni". Senza dati si resta sulle altre fonti; una barra senza dato non si mostra.

## Migliori giocatori e Migliori matchup (fluidita')
- `ChunkRows`: 10 righe al primo disegno (5 nei giorni vicini), il resto a riposo, `content-visibility`; tornando indietro la lista nasce intera. Giorni vicini a riposo (`DayPager`). `bestPlayers` guarda solo le squadre del giorno (`playersOf`, stesso ordine di prima), `matchupRows` memorizzato, righe `memo`. Risultati invariati (`MAX_PER_DAY` compreso).

## Foto mancanti (calcolatore e ovunque)
- `foto_fm.py` (workflow `carriere_extra.yml`) -> `foto_fm.json`: id FotMob di chi non ha foto in `foto.json`/`stats.json` (carriere, rosa + nome, classifiche della stagione + squadra, nome solo se unico). Letto da `photoOf` in `data/players.js`.

## Statistiche giocatore: stessi numeri ovunque (regola fissa)
- Un solo calcolo: `playerSeasonLine` (`data/archive.js`, classifiche ufficiali, altrimenti partite) per Profilo (`usePlayerSeason`) e Statistiche. Presenze = campionato, le coppe hanno le loro statistiche: mai la somma campionato + coppa, mai 0 gol "di default" per chi non e' in `stats.json`.
- Tutte le competizioni e stagioni con l'archivio usano `PastStats` con pillole Totale/Casa/Trasferta (solo se le partite della stagione hanno il giocatore, `statsFromMatches(lid, sk, part)`) e Tutte/Attacco/Difesa/Disciplina/Gioco. L'interfaccia vecchia resta solo per chi non e' nell'archivio. Controllo: `controllo_coerenza_giocatori.py` -> `controllo_coerenza_giocatori.json` (ufficiali contro partite: le differenze sono partite mancanti nei file, es. preliminari).

## Migliori giocatori: riga squadre (concept B, regola fissa)
- Sotto il nome: stemma + squadra del giocatore in grassetto, sotto stemma + avversaria (tenue) · orario (`TopPlayerRow.jsx`). Niente nazionalita' ne' bandiera. Vale per tutti i giocatori della sezione.
