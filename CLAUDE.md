# ScalperLab (Aurora) — regole che valgono per tutte le squadre, campionati e giocatori

Queste regole sono state chieste dall'utente e vanno applicate a TUTTO ciò che si aggiunge in futuro (nuovi campionati, squadre, giocatori), senza doverle ricorreggere.

## Uniformità
- Ogni scheda (campionato, squadra, giocatore, partita) usa gli stessi componenti per top campionati e minori: stessi font, numero di schede, disposizione, foto.
- Giocatori: tutti (attuali, ritirati, stagioni passate) usano la scheda `pages/Player.jsx` con Profilo / Partite / Statistiche / Carriera. Chi non è nell'elenco attuale si costruisce da `data/archivePlayer.js` (id `fm~<lega>~<stagione>~<id FotMob>`).
- Rose: gruppi per ruolo con volti; per i minori i dati arrivano da `rose.json` (`update_rose.py`, giornaliero). Spaziatura: stessa distanza sopra il primo giocatore, tra i giocatori e sotto l'ultimo.
- Allenatore nel banner squadra: da `rose.json` (FotMob), poi dalle formazioni.

## Stagioni e competizioni
- Il tasto stagione elenca SOLO le stagioni in cui squadra/giocatore ha davvero giocato quella competizione (`useSeasonList`, `teamSeasons`, `playerSeasons`).
- Il tasto competizione è legato alla stagione scelta (`useSeasonComps`, `useTeamView` in `components/past/PastBits.jsx`): "Tutte le competizioni" mostra solo quelle giocate in quella stagione. Valido per ogni squadra e per le competizioni aggiunte in futuro.
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

## Swipe tra giorni / schede
- Nel passaggio tra giorni il riquadro e' alto quanto il giorno piu' lungo (`growBox`): nessuna scheda tagliata. I giorni vicini sono costruiti per intero.
- I titoli delle schede (`SwipeTabs`) si accendono gradualmente con la barra (colore interpolato, stesso peso per tutti). Le righe di pillole non scorrono in verticale (`overflowY: hidden`).

## Campionati minori
- Partite di tutta la stagione in corso in `partite_extra.json` (`extra_partite.py`), cosi' forma, numeri da tenere d'occhio e medie sono affidabili. Arbitro: barra delle medie anche per i minori e nome nella fascia Stadio/Meteo/Arbitro.
- Autogol: nella mappa tiri compare come gol della squadra avversaria, specchiato (`og`).

## Campionati aggiunti (extra) — regola fissa
- Un campionato/coppa "extra" ha una riga in `data/leagues.js` (extra: true, fm), l'id in `FM_ID` (`data/archive.js`), l'id in `LEGHE` di `extra_partite.py` (prima i campionati, poi le coppe), in `ADDED` di `archivio.py`/`partite.py` (scaricati per primi) e, se ha rose, in `update_rose.py`.
- La stagione in corso di una squadra/giocatore di un extra si legge dall'archivio (`useTeamView` → `eff`, `RAW.extra.sk[fm]`): stesse schede, pillole e barre dei top campionati. Le tendine mostrano "Attuale".
- Mai lasciare una scheda extra vuota: se i dati sono in `arch/` e `partite/` devono comparire. Sempre provare su iPhone simulato (squadra + giocatore) prima di confermare.
- Gli swipe non devono far scattare: pillole senza ricostruire le liste (niente `key={mode}`), niente caricamento a due tempi; sopra le finestre (`data-no-back`) lo swipe indietro e' disattivato. Monitor fluidita': Menu -> Diagnostica.
- Tendine della Home: restano com'erano nel giro Home -> partita -> indietro (`useEntityScope('home')`).
- Formazioni: "probabile" finche' FotMob non dà `standard`; le icone sui volti (gol, assist, cartellini, cambio) vengono da `pl` (gol/assist) e dagli eventi.

## Formazioni (regola fissa, tutte le partite: live, prima del fischio, finite)
- Un solo campo con le due squadre (`MatchLineupsPanel.jsx`, `DualPitch`): casa in alto specchiata (ala destra a sinistra), ospite in basso, portieri agli estremi; nome casa nell'angolo in alto a sinistra, ospite in basso a destra; in cima "Formazione probabile/ufficiale" (o "Formazioni" a partita giocata) e i due moduli. Niente tasto di cambio squadra.
- Icone sul giocatore (concept A, posto fisso): voto a pillola sotto il volto, cartellino in alto a sinistra, gol/assist in colonna in alto a destra, cambio = solo le due freccette (verde su / rossa giu', niente sfondo, bordo o minuto) in basso a sinistra, capitano "C" in basso a destra, stella gialla al migliore in campo.

## Fluidita' (priorita' massima)
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
- Forma recente = ultime 5 partite in tutte le competizioni. Per le sole coppe nazionali le statistiche pre-partita sono la media coppa + campionato (coppe europee escluse).
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
- Indice `tidx/<id%100>.json` (`squadre_indice.py`, workflow `squadre_indice.yml`, ogni giorno): per id FotMob tutte le competizioni/stagioni dal 2010. `useTeamView`: con "Attuale" la tendina competizioni elenca tutte quelle giocate; con una stagione passata solo quelle di quell'anno; scelta una competizione le stagioni sono solo quelle giocate; una competizione non piu' giocata parte dalla stagione piu' recente (niente "Attuale", `noCur`).

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
