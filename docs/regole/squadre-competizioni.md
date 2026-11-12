# Regole ScalperLab: squadre-competizioni

Testo completo delle regole fisse di quest'area (indice in CLAUDE.md). Valgono per tutto cio' che si aggiunge in futuro.

## Uniformità
- Ogni scheda (campionato, squadra, giocatore, partita) usa gli stessi componenti per top campionati e minori: stessi font, numero di schede, disposizione, foto.
- Giocatori: tutti (attuali, ritirati, stagioni passate) usano la scheda `pages/Player.jsx` con Profilo / Partite / Statistiche / Carriera. Chi non è nell'elenco attuale si costruisce da `data/archivePlayer.js` (id `fm~<lega>~<stagione>~<id FotMob>`).
- Rose: gruppi per ruolo con volti; per i minori i dati arrivano da `rose.json` (`update_rose.py`, giornaliero). Spaziatura: stessa distanza sopra il primo giocatore, tra i giocatori e sotto l'ultimo.
- Allenatore nel banner squadra: da `rose.json` (FotMob), poi dalle formazioni.
- Banner di campionato, squadra e giocatore (`EntityBanner.jsx`, un solo componente, concept 3B): freccia piccola senza cerchio, nome in grassetto senza logo accanto; a destra, dietro, lo stemma grande (il volto per i giocatori, `PlayerPhoto`) che sfuma verso sinistra con `mask-image`, mai una copertura sopra. Tendina stagione larga quanto il contenuto (`SeasonDrop`).

## Stagioni e competizioni
- Il tasto stagione elenca SOLO le stagioni in cui squadra/giocatore ha davvero giocato quella competizione (`useSeasonList`, `teamSeasons`, `playerSeasons`).
- La tendina COMPETIZIONI di una squadra mostra SEMPRE tutte le competizioni giocate in tutta la sua storia (indice `tidx`, `useTeamView` in `components/past/PastBits.jsx`), qualunque stagione sia scelta; la tendina STAGIONI si adatta alla competizione scelta. Scegliendo una competizione non giocata nella stagione selezionata la stagione torna ad "Attuale" (o alla piu' recente giocata). Vale per ogni squadra e per le competizioni aggiunte in futuro.
- Stagione e competizione scelte si ricordano finché la scheda resta nella pila (apro un giocatore e torno indietro); aprendo una scheda da zero si riparte da "Attuale" (`useEntityScope`, `useSel`). Una stagione richiesta da un link vale una sola volta (`initSeason`).
- Nomi squadra tra fonti diverse: `teamIdByName` (alias, sigla, mai due squadre simili).
- Stagioni passate: stesse pillole della stagione attuale (Totale/Casa/Trasferta, Tutte/Attacco/Difesa/Disciplina/Gioco).

## Partite squadra
- Competizione e stagione sono sulla stessa riga. Stagione attuale, "Tutte": parte dalle ultime due partite giocate con le prossime sotto (le precedenti dietro il tasto). Stagioni passate: dalla più recente alla più vecchia, a blocchi colorati per competizione.

## Ritorno da una partita
- Aprendo una partita (anche dal Tabellone) e tornando indietro, il campionato resta sulla stessa stagione, scheda, Classifica/Tabellone e fase (`useEntityScope`/`useSel` con chiave `lg-<fm>`); si resetta solo aprendo di nuovo la competizione da zero.

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

## Colori e loghi competizioni
- Colori scelti dall'utente in `PALETTE` (`data/leagues.js`): banner e pillole Home. Loghi dei campionati/coppe extra da FotMob (`leaguelogo/<fm>.png`, `dark/`). Le squadre delle coppe nazionali mostrano il campionato (`CUP_IDS`), e squadre omonime di altro paese non si fondono (es. Arsenal in Coupe de France).

## Squadra unica, rose, coppe (regola fissa)
- Una sola scheda per squadra (`findAppTeam` in `data/teamMatch.js`, `t.fmId`): il banner e' sempre quello del campionato nazionale (es. Francoforte = Bundesliga); le coppe sono tendine. Scegliendo una coppa nazionale pura nella Classifica della squadra compare il Tabellone.
- Rose da piu' fonti (`update_rose.py`: FotMob, PitchAPI, API-Football). Statistiche squadra: riquadri Gol/xG/Tiri/Tiri in porta con posizione + riga "Prossima" della competizione scelta (solo se esiste).
- Forma recente = ultime 5 partite in tutte le competizioni: partite in memoria + calendario archiviato della stagione della competizione e del campionato della squadra (`recentOf`, `addLeagueForm` in `data/archiveMatch.js`, unione senza doppioni in `FormCard`); senza partite giocate niente riquadro. Controllo: `forma` in `controllo_squadre.json`. Per le sole coppe nazionali le statistiche pre-partita sono la media coppa + campionato (coppe europee escluse). **Vale per OGNI partita, anche d'archivio (id `a-…`, Nations League, Mondiali, amichevoli, qualificazioni) e per le nazionali** (09/11/2026): `addLeagueForm` gira sia per `x-…` sia per `a-…` (`buildArchiveMatch`) e prende da `tidx` tutte le competizioni della squadra, con le stagioni dell'anno della partita e dell'anno prima (non "la stagione in corso": una partita passata guarda le stagioni di allora); solo se mancano partite per arrivare a 5 aggiunge stagioni piu' vecchie. Prova: `forma recente: nazionali con tutte le competizioni` in `preview.mjs`.
- Abbinamento squadra tra app e archivio: prima l'id FotMob della squadra (`teamIdByName` usa `teamByName(...).fmId` o lo stemma), poi il nome (alias `sheff`, `utd`, `wed`...). Prima 525 stagioni-squadra (Sheffield, MK Dons, Hearts, LAFC, NYCFC...) restavano senza statistiche.
- Swipe indietro: oltre la meta' dello schermo si torna, prima la pagina rientra lentamente. Pillole dei turni del Tabellone: la riga scorre e centra la pillola scelta; schede ben spaziate.

## Stagioni con suffisso
- Stagioni come "2026-2027 - Apertura", "2026 - Clausura" valgono ovunque: `parseArchiveId` (giocatore e partita), `seasonLabel` ("2026/27 Apertura"), `giocatori_indice.py`, `squadre_indice.py`.
- Stagione in corso con `_s.json` vuoto: giocatori da `statsFromMatches` (squadra e nome dalle formazioni), squadre da `loadTeamStats` (medie a partita). Per mostrare classifiche usare `loadPlayerStats`/`loadTeamStats`, mai `loadSeasonStats`.
- Controllo automatico: `controllo_squadre.py` (workflow `giocatori_indice.yml`) scrive `controllo_squadre.json` con le squadre senza Statistiche/Giocatori e il motivo.
- La scheda archivio di una squadra (`/storico/.../squadra/<id>`) rimanda alla scheda unica se la squadra e' nell'app: prima per id FotMob (`teamByFm`), poi per nome.

## Squadre B / riserve
- Prima si abbina per id FotMob (anche dallo stemma `teamlogo/<id>.png`), poi per nome. `sameSquad` (`data/teamMatch.js`): nomi che differiscono per B, II, III, U19/U21/U23, Reserves, Castilla, Jong, Promesas, femminili, ecc. non sono mai la stessa squadra (`findAppTeam`, `teamIdByName`, `roseOf`, feed live).

## Competizioni di una squadra: tutta la storia
- Indice `tidx/<id%100>.json` (`squadre_indice.py`, workflow `squadre_indice.yml`, ogni giorno): per id FotMob tutte le competizioni/stagioni dal 2010. `useTeamView`: la tendina competizioni elenca sempre tutte quelle giocate (anche con una stagione passata scelta); scelta una competizione le stagioni sono solo quelle giocate; una competizione non piu' giocata parte dalla stagione piu' recente (niente "Attuale", `noCur`).

## Partite squadra: "Partite precedenti"
- Premendo il tasto la pagina non si sposta: la partita che si guardava resta alla stessa altezza (si compensa l'altezza aggiunta sopra). Lo stato "aperto" si ricorda finche' la scheda e' nella pila (`useSel(teamId, 'more-<comp>')`).
- Nelle liste di partite sempre "vs" (mai "@").

## Rose (pannello "Squadra", regola fissa)
- Fonti in ordine: `rose.json` (id FotMob), giocatori dell'app, poi `seasonRoster` (`data/rose.js`): chi ha giocato la stagione in corso per quella squadra (minuti e formazioni delle partite, classifiche ufficiali dei giocatori, gol e cartellini), gruppo "Giocatori". Nessuna fonte = niente scheda Squadra (`Team.jsx`). Foto sempre con `PlayerPhoto`.
- Controllo: `rose` in `controllo_squadre.json` (squadre senza rosa e motivo, prima/dopo).

## Rose di tutte le squadre, per ruolo (regola fissa)
- `rose_tutte.py` (workflow `rose.yml`) -> `rosa/<id%100>.json`: tutte le squadre di `tidx`, non solo quelle di `rose.json`. Fonti in ordine: FotMob; archivio (chi ha giocato l'ultima stagione); LiveScore (la ricerca da' lo stemma `enet/<id FotMob>.png`: squadra certa per id); OneFootball (stesso nome e paese, una sola squadra); API-Football. Righe esterne ricordate in `rosa/_esterne.json`, unite per nome (`same_person`); id FotMob ritrovato con la ricerca FotMob solo se il giocatore e' in quella squadra, altrimenti id negativo: riga senza collegamento e sagoma.
- Ruolo mai indovinato: rosa della fonte, posizione piu' usata (righe delle classifiche `r[6]` e formazioni `st`, solo le posizioni con un ruolo chiaro, `POS_ROLE`), rosa FotMob di un'altra squadra, scheda FotMob del giocatore (`rosa/_ruoli.json`). Senza nessuna = "Giocatori".
- Solo giocatori di adesso (regola fissa, 07/11/2026): LiveScore, OneFootball e alcune rose FotMob di squadre minori tengono chiunque sia passato dalla squadra (Casertana: 9 portieri, Benassi del 2017). Chi non ha minuti nell'archivio della stagione resta solo se la scheda FotMob dice che non e' tesserato altrove (prestiti compresi) e ha presenze nella stagione in corso o nella precedente, o e' arrivato da poco (`still_here` in `rose_tutte.py`, schede in `rosa/_attivi.json`, rilette ogni 30 giorni). Vale per le rose con fonti esterne e per le rose FotMob sospette (>40 giocatori o >=6 portieri). Competizioni senza presenze su FotMob (meno di 5 giocatori con minuti nell'archivio): decide la carriera (tesserato qui adesso e senza presenze solo in stagioni vecchie). Solo squadre vive (stagione recente nell'indice o almeno 5 tesserati li' secondo FotMob): le squadre storiche tengono la rosa della loro ultima stagione. Righe esterne senza id FotMob solo se la squadra ha meno di 11 giocatori certi. `python rose_tutte.py --pulizia` ripulisce le rose salvate senza riscaricarle.
- App: `seasonRoster` legge prima `rosa/` (`rosaOf`, capienza fissa); `rose.json` con meno di 11 giocatori o ruoli mancanti (`rosePoor`) cede il posto a `rosa/`. La rosa LiveScore grezza del KV (`lsRoster`) solo se `rosa/` non ha nessuna riga per quella squadra. Ultimo gruppo: Allenatore (`CoachSection`). Controllo: `rose_per_ruolo` in `controllo_squadre.json`. Prova: "rose per ruolo: Van...".

## Giocatori della squadra: ogni competizione giocata (regola fissa)
- `TeamPlayersPanel`: competizioni e stagioni solo con statistiche giocatori della squadra (`useTeamView(..., { hasApp })`, `teamPlayerHistory`, colonne 3-4 di `tidx`: stagioni senza statistiche e senza Casa/Trasferta). Senza nessuna: niente scheda Giocatori (`Team.jsx`). Mai una frase al posto dei dati.
- Fonte: `loadTeamPlayerStats` (classifiche ufficiali; sotto 11 giocatori della squadra vale la fonte con piu' giocatori tra ufficiali e `statsFromMatches`). Campionato dell'app in corso: `LeaguePlayersPanel`, Casa/Trasferta dalle partite.
- Pillole `PlayerPills` uguali ovunque: Totale/Casa/Trasferta/Ogni 90' e Tutte/Attacco/Difesa/Disciplina/Gioco (solo le categorie con dati). Controllo: `giocatori_competizioni` in `controllo_squadre.json`. Prova: "giocatori squadra: Ararat Armenia...".

## Partite squadra: stagione in corso da tutte le competizioni
- "Attuale" = partite in memoria + calendario archiviato della stagione in corso di ogni competizione giocata quest'anno (indice `tidx` + campionato della squadra, `archCurrent` in `TeamMatchesPanel.jsx`, righe `ArchRow`); un giorno gia' presente non si ripete. Controllo: `partite_stagione` in `controllo_squadre.json`.

## Squadre femminili (regola fissa)
- FotMob le chiama come le maschili ("Barcelona" in Liga F) o con "(W)". Una sola forma ovunque: "Barcelona F" (`womenName`, `isWomenComp`, `isWomenName` in `data/teamMatch.js`; stessa regola in `femminili.py`). Vale per tutte le squadre di una competizione femminile, anche se non esiste una maschile omonima.
- I nomi si cambiano quando i dati arrivano: `loadSeason`, `loadSeasonStats` (`data/archive.js`), righe del feed (`womenFeedRow`), `teamFromIndex`; `risultati.py` (`giorni/`, Home nativa compresa) e `squadre_indice.py` (`tidx/`) li scrivono gia' cosi'. `sameSquad` non unisce mai "X F" e "X". Competizioni dal nome generico (A-Liga, Super Cup olandese): `WOMEN_FM`.

## Squadre di coppa con nome FotMob: una sola scheda (regola fissa)
- Le partite d'archivio di Champions/Europa League (`teamsOf` in `data/archiveMatch.js`) usano nomi FotMob corti ("PSG", "Man United", "Köln"): senza unione nascevano squadre `fm-<id>` senza giocatori e quindi senza Affidabilita' nelle formazioni e nel Calcolatore. Ora una squadra `fm-` senza giocatori si unisce alla squadra vera: prima per id FotMob (`teamByFm`), poi per nome/sigla tra le squadre con giocatori (coppe: tutte; campionato: solo quel campionato) solo se e' una sola; nel campionato l'id dell'archivio corregge un `fmId` sbagliato (era "1. FC Köln" con l'id di Viktoria Köln). Controllo fatto: tutte le 72 squadre di CL/EL 2026/27 hanno giocatori e medie.

## Nazionali: colori, tabelloni, qualificazioni
- Colori delle nazionali = colori storici delle federazioni (`NAT_LIST` in `data/teamColorFix.js`; Italia blu, Spagna rossa, Francia blu, Portogallo rosso, Irlanda verde...). Competizioni: Mondiali giallo, Nations League turchese (`PALETTE` in `data/leagues.js`, applicata anche alle competizioni d'archivio), qualificazioni rosso.
- Tabellone (`CUP_FM` in `data/bracket.js`): Mondiali, Europei, Copa America, Coppa d'Africa, Asian Cup, Gold Cup, Nations League (A-D, le passate; B-D senza fase finale non lo mostrano). Qualificazioni: `qualificazioni.py` le aggiunge a `selezione.json`.
- Banner giocatore in ricerca: club + linea sottile + bandiera e nazionale a destra (sito e nativo).
- Banner nazionali (concept A): bandiera intera a destra, nitida, sfuma verso sinistra (`flag` in `EntityBanner`, `isNationName`).
- Storico nazionali: `NAZ_IDS` in `archivio.py` = competizioni delle nazionali scaricate per intero (Mondiali dal 1930, Europei dal 1960, amichevoli `114`, qualificazioni, Nations League); stagioni e statistiche per ogni edizione, schede squadra via `tidx` (`squadre_indice.yml`). FotMob ha le amichevoli solo dell'anno in corso.

## Statistiche squadra: stessi numeri ovunque (regola fissa, novembre 2026)
- Ogni statistica di squadra e' una **media a partita**, identica tra scheda squadra (Totale/Casa/Trasferta, riquadri in alto) e "Stat. squadre" del campionato.
- Con le statistiche delle partite (`partite/`), `loadTeamStats` usa i valori calcolati dalle partite (`teamPartStats`, stesso filtro di `teamAverages`: squadre e stato dal calendario, solo partite del calendario) per tutte le voci che le partite hanno (`MATCH_FOR_TEAM_KEY`); le classifiche FotMob restano solo per voto, xG subiti, porta inviolata, rigori ecc.
- Le classifiche squadra FotMob (`_s.json`) mescolano TOTALI stagionali (gialli, rossi, angoli, xG, xG subiti, palle gol, tocchi in area, rigori, gol da palla inattiva) e medie: `loadSeasonStats` divide i totali per le partite (`TEAM_TOTAL_KEYS`, r[5]) e ordina sempre dal valore piu' alto (i "subiti" FotMob arrivano dal piu' basso: la squadra migliore risultava ultima e rossa). La porta inviolata resta un conteggio.
- `fk_foul_lost_team` di FotMob sono i falli **commessi** (prima etichettati "Falli subiti"); i falli subiti (`fk_foul_won_team` / `fouls_suffered`) sono i falli dell'avversario nelle stesse partite.
- Formato: medie con 2 decimali (1,25), come in "Stat. squadre".

## Banner squadra/nazionale: posizione e punti della tabella (regola fissa)
- Il banner mostra posizione e punti della competizione (e stagione) scelta nella tendina dei pannelli (`useAnnounceComp` -> evento `sl-comp` -> `useBannerSel`), all'apertura il campionato della squadra e "Attuale". I numeri vengono dalla stessa fonte e dagli stessi calcoli della tabella Classifica (`components/team/useBannerRow.js`: `useStandingRows` per i campionati dell'app, `seasonTeamRow` sull'archivio della stagione per gli aggiunti, FotMob fresca e live sopra). Competizioni a gironi: posizione nel girone. Coppa a eliminazione (Tabellone) o squadra assente: niente numeri. Prima il banner usava la classifica calcolata dalle sole partite caricate (CD FAS "1 pt") e unica per tutti i gironi (Turchia "15°").

## Competizioni rimosse (10/11/2026, regola fissa)
- `competizioni_rimosse.json` elenca le competizioni minori tolte su richiesta dell'utente (ids + nomi). Non si scaricano piu' (fuori da `selezione.json`), non compaiono in `arch/index.json` e le cartelle `arch/<id>/` e `partite/<id>/` sono cancellate. Non rimetterle senza che l'utente lo chieda.
- Le carriere dei giocatori mantengono il banner della squadra anche se il campionato e' rimosso; il banner di carriera non e' toccabile, quindi non apre nessuna scheda (squadra senza pagina = nessun tocco).
- Si tolgono solo le competizioni indicate dall'utente: le altre (es. Colombia Primera B, Conference League) restano.

## Statistiche squadra: tasto VS (subite) (12/11/2026, concept B, regola fissa)
- Nella scheda Statistiche di una squadra (stagione in corso, nativo `native/pages/SquadraStat.js`) a destra di Totale/Casa/Trasferta c'e' l'interruttore "VS": acceso mostra le statistiche subite (`SUB_OF`: gol, xG, tiri, tiri in porta, occasioni, corner concessi, falli subiti), riquadri in alto e pannelli in blu, "Attacco subito"; le categorie senza controparte subita (Difesa, Gioco) spariscono dalle pillole. Posizione 1° = chi subisce meno. Le barre scorrono dal valore attuale (`slide` in `Bar`), senza ripartire da zero. Il confronto con la prossima avversaria si nasconde con VS acceso.
- **VS in ogni stagione e competizione** (12/11/2026): il tasto VS e' anche nelle stagioni passate e nelle nazionali (Nations League ecc. passano da `PastTeamStats`): `teamPartStats(fm, sk, part, true)` in `data/archive.js` calcola le statistiche subite partita per partita (valore dell'avversario; chiavi `*_conceded`, `fouls_suffered`, `goals_conceded` dal calendario). Il tasto si vede solo se la stagione ha quei dati.
- **Banner nazionali** (concept A, 12/11/2026, regola fissa): la bandiera e' un rettangolo 4:3 vero, in basso a destra, nitida a destra (blur minimo, opacita 0,88) e sfumata solo verso sinistra e in alto, con i colori della squadra sopra come per gli stemmi dei club (`EntityBannerN.js`).
