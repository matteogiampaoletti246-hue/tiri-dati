# Regole ScalperLab: giocatori-dati

Testo completo delle regole fisse di quest'area (indice in CLAUDE.md). Valgono per tutto cio' che si aggiunge in futuro.

## Giocatori: competizioni e stagioni (regola fissa)
- Indice `pidx/<id%100>.json` (`giocatori_indice.py`, workflow `giocatori_indice.yml`, ogni giorno): per ogni id FotMob tutte le competizioni/stagioni giocate. `data/playerIndex.js` (`usePlayerCareer`, `resolvePid`) lo usa per: tendina competizioni di Statistiche (squadra attuale + tutte quelle giocate, anche Premier League dell'anno scorso), stagioni per competizione, lista Partite di tutte le competizioni (`PastPlayerMatches items`).
- L'id FotMob si trova da carriere.json, id archivio, rosa della squadra, statistiche della stagione in corso. Anagrafica da carriere.json, altrimenti dalla rosa (`rose.json`); radar da `archivePercentiles` se il giocatore non e' tra quelli dei campionati principali.

## Giocatori di tutti i campionati
- `ourPlayerId` (`data/playerSheet.js`): se il giocatore non e' nell'elenco principale usa l'id archivio `fm~<lega>~<stagione>~<id FotMob>` (id dalla formazione o dalla rosa; prima il campionato della squadra). Il volto in formazione prima della partita apre la scheda, la finestra a partita iniziata ha sempre il tasto Profilo.

## Foto dei giocatori
- Un solo componente per tutte le foto (`components/PlayerPhoto.jsx`): se la foto manca o non si carica compare la sagoma scura (testa e spalle) sul colore del riquadro che la contiene (colori squadra in formazione e nel banner), mai l'icona di immagine rotta ne' le iniziali. Formazioni, rose, liste, finestre e banner usano la stessa foto (id FotMob, `resolvePid`). Il banner del giocatore e' `EntityBanner person`.
- `foto_check.py` (workflow `carriere_extra.yml`) scrive `foto_mancanti.json`: gli id senza foto su FotMob (circa il 16%).

## Carriere
- `car/<id FotMob % 100>.json` (`carriere_extra.py`, workflow `carriere_extra.yml`): carriera di tutti i giocatori delle rose e dei top 5, con senior (`car`), giovanili (`yo`), nazionali (`nt`). `careerByFm` in `data/carriere.js`. La carriera ricostruita dalle sole stagioni di un campionato non sostituisce quella completa.
- `CarrieraPanel`: periodi consecutivi nella stessa squadra in una sola pillola (intervallo e somma presenze/gol/assist, `mergeConsecutive`); se tra due periodi c'e' un'altra squadra restano separati. Sezioni Nazionale e Giovanili sotto.

## Statistiche complete per ogni stagione
- Indice giocatori `pidx` comprende anche chi non e' nelle classifiche ufficiali (si ricava dalle partite archiviate). `loadPlayerStatsFor(fm, sk, pid)`: classifiche ufficiali se il giocatore c'e', altrimenti statistiche calcolate dalle partite. `playerSeasons` legge `pidx`.
- `controllo_stagioni.py` scrive `controllo_stagioni.json`: per ogni competizione/stagione partite scaricate, statistiche, e (con la rete) un campione FotMob per capire se una stagione "dimenticata" va riscaricata. Verificato: dove mancano statistiche FotMob non le ha.

## Statistiche giocatore (regola fissa, con due eccezioni a "niente non disponibile")
- Eccezione 1: giocatore con statistiche in almeno una stagione/competizione ma non in quella di partenza: la scheda Statistiche resta e mostra un solo messaggio "Dati non disponibili" (`NoData` in `PlayerTabs.jsx`, anche in `PastStats` per i giocatori), niente riquadri vuoti ne' "–"; le tendine portano alle stagioni/competizioni con dati (in tendina solo quelle con dati, piu' quella di partenza).
- Eccezione 2: giocatore senza statistiche in nessuna stagione e competizione (dati dell'app `playerHasCurStats` o righe `pidx`): la scheda Statistiche non c'e' (`Player.jsx`), come la Carriera senza dati. Vale anche per chi ha presenze nei dati dell'app ma nessuna competizione in cui mostrarle (squadra senza competizioni, es. avversari di una squadra di coppa in un campionato non seguito): `playerHasCurStats` lo controlla.
- `pidx` (`giocatori_indice.py`) segue le stesse regole dell'app: solo `_s.json` v2 e mai le liste con chiave che inizia per `_`; `statsFromMatches` da' a chiunque abbia giocato almeno la voce `mins_played` (presenze e minuti). Cosi' ogni riga dell'indice ha statistiche visibili.
- Controllo: `controllo_statistiche_giocatori.py [n] [--app-vecchia]` -> `controllo_statistiche_giocatori.json` (righe competizione/stagione senza statistiche e motivo). Prova: "statistiche giocatore: dati solo nel passato, nella stagione attuale, nessun dato" in `preview.mjs`.

## Falli subiti in Disciplina (regola fissa)
- Ogni giocatore che ha la voce ha i falli subiti ogni 90', anche sotto i 180' (media e posizione sui giocatori da 180', a inizio stagione 45'). FotMob non scrive lo 0: nelle partite con la voce chi ha giocato senza subire falli conta 0 (`statsFromMatches`, `fouledList` in `data/archive.js`).

## Classifiche giocatori: tutti con almeno 180 minuti (regola fissa, ogni competizione presente e futura)
- Nelle classifiche delle statistiche dei giocatori di un campionato (`LeaguePlayersPanel`, `statSections` in `ArchiveLeague.jsx`, `MIN_MIN` = 180) compaiono TUTTI i giocatori con almeno 180 minuti in stagione, in ogni modalita' (Totale e Ogni 90'): niente limite ai primi 50, niente soglia piu' alta (prima 450' in "Ogni 90'"). Nella squadra restano tutti quelli che hanno giocato.

## Foto mancanti (calcolatore e ovunque)
- `foto_fm.py` (workflow `carriere_extra.yml`) -> `foto_fm.json`: id FotMob di chi non ha foto in `foto.json`/`stats.json` (carriere, rosa + nome, classifiche della stagione + squadra, nome solo se unico). Letto da `photoOf` in `data/players.js`.

## Statistiche giocatore: stessi numeri ovunque (regola fissa)
- Un solo calcolo: `playerSeasonLine` (`data/archive.js`, classifiche ufficiali, altrimenti partite) per Profilo (`usePlayerSeason`) e Statistiche. Presenze = campionato, le coppe hanno le loro statistiche: mai la somma campionato + coppa, mai 0 gol "di default" per chi non e' in `stats.json`.
- Tutte le competizioni e stagioni con l'archivio usano `PastStats` con pillole Totale/Casa/Trasferta (solo se le partite della stagione hanno il giocatore, `statsFromMatches(lid, sk, part)`) e Tutte/Attacco/Difesa/Disciplina/Gioco. L'interfaccia vecchia resta solo per chi non e' nell'archivio. Controllo: `controllo_coerenza_giocatori.py` -> `controllo_coerenza_giocatori.json` (ufficiali contro partite: le differenze sono partite mancanti nei file, es. preliminari).

## Statistiche giocatori: gerarchia delle fonti (regola fissa, ogni competizione presente e futura)
- Scaletta: 1) classifiche stagionali ufficiali FotMob (`_s.json`); 2) se il giocatore manca da una voce (le classifiche hanno solo chi supera una soglia: caso Diarra in Champions, 56') la voce si completa sommando le sue partite FotMob (`loadPlayerStatsFor` in `data/archive.js`, `MATCH_TO_SEASON` traduce le chiavi delle partite in quelle delle classifiche); 3) dove FotMob non ha `p` nelle partite (105 competizioni su 177, quasi tutte minori) `giocatori_pitch.py` (workflow `giocatori_pitch.yml`, ogni 3 ore, stessa `concurrency` di `partite.yml`) le prende da PitchAPI e le scrive nello STESSO formato (`p`: id FotMob -> chiave/valore, marcate `px: pitchapi`), cosi' l'app le usa senza modifiche; 4) LiveScore (`giocatori_livescore.py`, workflow `giocatori_livescore.yml`, ogni 3 ore e si rilancia da solo): per le partite finite ancora senza `p` in competizioni non coperte da PitchAPI (`nolega` in `pitch_stato.json`) o senza abbinamento. LiveScore NON ha tiri, passaggi ne' voti: da formazioni + eventi ricava solo presenze, minuti (`Mo`, cambi), gol (IT 36/37), assist (63), gialli (43), marcate `px: livescore`; codici visti in `livescore_giocatori.json` (`codici_it_visti`, i rossi vanno aggiunti quando il codice e' verificato). Abbinamento: stemma `enet/<id FotMob>.png` + data (+-1 giorno). OneFootball: la ricerca non da' statistiche di partita, non usato. Tutte le stagioni di tutte le competizioni (PitchAPI e LiveScore: prima le piu' recenti, `pitch_stato.json`/`livescore_stato.json` ricordano i tentativi per 7 giorni).
- Abbinamento PitchAPI: lega = stesso paese + stesso nome + stagione in elenco; partita = data (+-36 ore) + nomi squadre simili; giocatore = nome tra quelli della squadra (formazioni FotMob della partita, poi di tutta la stagione, classifiche stagionali e `rosa/`, solo id FotMob veri; mai a caso: senza abbinamento sicuro il giocatore resta fuori). Se FotMob non ha la partita o le formazioni la voce `m['pn']` (id -> [nome, lato, squadra]) da' nome e squadra a `statsFromMatches` (nessuna formazione finta). Si completano solo partite finite senza `p`, stagione in corso e precedente. Referto: `pitch_giocatori.json` (competizioni completate, `senza_lega_pitch` = non coperte da PitchAPI).
- La chiave `PITCHAPI_KEY` e' un segreto del repository: non e' nell'ambiente di lavoro, si prova solo con i workflow (`gh workflow run`).

## Rose da LiveScore (squadre senza rosa FotMob, regola fissa)
- `tools/rose_livescore_all.py` (workflow `rose_livescore_tutti.yml`, ogni notte): per ogni campionato dell'indice abbina il campionato LiveScore dall'elenco ufficiale (sitemap) con le squadre in comune (id stemma = id FotMob, nomi) e salva la rosa di ogni squadra (ruoli, numeri, paese) su Cloudflare KV: una chiave `idx:lg/<paese>/<campionato>` e la mappa `idx:fmmap`. NIENTE nel repository (e' pubblico). Il worker le serve da `/r?k=`.
- Il binding KV `ROSE` e' in `worker/wrangler.toml`: Cloudflare ripubblica il Worker da GitHub a ogni push e senza quella riga lo toglieva.
- App: `seasonRoster` (`data/rose.js`) usa `lsRoster` se la rosa FotMob manca o e' povera e quella di LiveScore ha piu' giocatori. Id negativo = giocatore senza id FotMob: riga senza collegamento e sagoma al posto della foto. Ruoli solo quelli della fonte.

## Dati di fonti terze: mai nel repository (regola fissa)
- Il repository e' pubblico: statistiche di PitchAPI e LiveScore stanno SOLO su Cloudflare KV, una chiave per competizione-stagione `idx:ps/<fm>/<stagione-slug>` (`{id partita: {p, px, pn?}}`) + indice `idx:ps/index` (`kvstats.py`, stesso spazio `rose`, il worker le serve gia' con `/r?k=`, nessuna modifica al worker). `giocatori_pitch.py` e `giocatori_livescore.py` leggono e scrivono il KV (secret `CLOUDFLARE_API_TOKEN`), nei file `partite/` non scrivono piu'; nel repository restano solo referti e stato con conteggi.
- App: `loadSeasonMatches` (`data/archive.js`) unisce il KV alle partite dove FotMob non ha `p` (solo per le stagioni nell'indice); `giocatori_indice.py` fa lo stesso con `kvstats.overlay`. Qualsiasi nuovo script che legga `p` delle partite deve usare `overlay`. Sonde con risposte grezze delle fonti non vanno committate.
- Spostamento una tantum: `tools/stats_terzi_kv.py` (workflow `stats_terzi_kv.yml`): prima carica nel KV, poi toglie `p/px/pn` dai file solo per le partite gia' nel KV.

## Profili completi per tutti i giocatori (regola fissa)
- `resolvePid` (`data/playerIndex.js`): carriere.json, rose.json, poi la rosa completa `rosa/` (rose.json puo' avere la squadra vuota: caso Hudson-Odoi), nomi con lettere speciali (ı, ø, ł) e ordine diverso, cognome unico; infine le classifiche. Senza id niente anagrafica ne' stagioni.
- Il Voto del Profilo non si mostra se manca (mai "—"). `carriere_extra.py` scarica prima chi e' in una rosa attuale e ha giocato di recente.
- Controllo: `controllo_profili_giocatori.py` -> `controllo_profili_giocatori.json` (per campionato: senza id, senza anagrafica, senza stagioni, senza carriera).

- Il controllo copre anche i campionati dal 6 al 20 e Champions/Europa/Conference (giocatori dalle classifiche della stagione in corso + rose delle loro squadre): `campionati_6_20_e_coppe` in `controllo_profili_giocatori.json`. `carriere_extra.py` scarica prima chi compare in quelle classifiche. Senza stagioni (`pidx`) = chi e' solo in rosa e non ha mai giocato: non e' un errore.

## Dati
- Dopo ogni partita finita: `dopo_partita.yml` (ogni 5 minuti, gate su feed live) aggiorna partite, voti, statistiche e indici.

## Niente "non disponibile" (regola fissa, ogni pagina presente e futura)
- Statistica, riquadro, pillola, voce o scheda senza dati: non si mostra (mai "non disponibile", "non ancora disponibile", "in arrivo", "nessun dato", mai un riquadro vuoto o un "—"). La pagina parte dal primo elemento con dati. Mai dati inventati (niente sole come meteo finto, niente pareggio per una partita senza risultato).
- Partita: le schede vuote si tolgono (`hasMatchStats`, `hasLineups`, Tabellone da `peekBracket`, caricato in `prepareMatch`); la scheda scelta si ricorda per nome (`usePageTabKey`). Riepilogo: Momentum solo se c'e'. Stadio/Meteo/Arbitro: solo le voci con dato (`InfoBand`).
- Campionato dell'archivio: schede filtrate per dati (`ArchiveLeague`). Prova: `ND` in `preview.mjs`.

## Profili unici: PitchAPI collegato a FotMob (regola fissa, ogni giocatore presente e futuro)
- `profili.py` (nessuna chiave; in `update.yml` con `--giocatori`, in `calc_extra.yml` con `--calc`: ogni workflow scrive solo il suo file) da' a ogni giocatore di `giocatori.json`/`calc_extra.json` l'id FotMob `f`: squadra PitchAPI -> squadra FotMob (nome con alias dei nomi brevi "Man City", "PSG" + date delle partite), poi nome normalizzato (accenti, ordine delle parole, cognome + iniziale) nella squadra, confermato da date e minuti; senza nome uguale solo se date e minuti coincidono in almeno 3 partite. Mai a caso.
- Doppi uniti: due id PitchAPI con lo stesso id FotMob (Plzen, Sparta, Hapoel Beer Sheva...), profilo d'archivio `fm~` di calc_extra doppio di un `p_`, stesso giocatore in due campionati aggiunti (trasferito). Il vecchio id resta come alias (`al`). Elenco con motivo in `report/profili_uniti.json`, conteggi in `report/profili_stato.json`.
- `dl` = campionato nazionale FotMob della squadra: il Profilo e le Statistiche partono da li' (Dinamo Zagreb = HNL, non Europa League); `resolvePid` usa `fmId`, `ourPlayerId` apre il profilo principale se l'id FotMob c'e' (niente scheda d'archivio doppia). Anagrafica anche da `car/` (`BioCard`), ruolo dalla posizione FotMob.
- Statistiche della stagione in corso complete: partite PitchAPI + partite FotMob che PitchAPI non ha (stessa giornata = stessa partita). `l` campionato, `c` coppe europee, `r` ultime 5 di tutte le competizioni del club (mai la nazionale).

## Archivio partite: la stagione in corso non si chiude mai (regola fissa)
- `partite.py`: una stagione recente (anno >= anno attuale - 1) si ricontrolla a ogni giro; `done` vale solo quando il calendario non ha piu' partite da giocare. Prima `done` restava vero dopo il primo giro completo e tutte le partite successive mancavano (2.662 partite in 202 stagioni, es. Feyenoord-Fortuna Sittard del 31/10). Solo partite finite (`m[7]`). Il tetto di spazio (`CAP_MB`) vale solo per lo storico: a 399 MB fermava anche la stagione in corso. Ordine: prima le stagioni recenti di tutte le competizioni.
- `giocatori_indice.yml` parte anche subito dopo ogni giro di `partite.yml` (`workflow_run`, 00:41/06:41/12:41/18:41 UTC): le partite della sera europea sono nell'indice nella notte, quelle americane la mattina.
- Controllo: `controllo_dati.py` -> `report/controllo_dati.json` (squadre del calendario contro squadre in classifica, partite finite mancanti, giocatori da 180' fuori dalle classifiche ufficiali, profili ancora doppi).

## Classifiche delle competizioni: tutte le squadre e tutti i giocatori (regola fissa)
- Stat. squadre della stagione attuale (`LeagueTeamsPanel`): statistiche della competizione aperta (`hasMetrics(t.id, leagueId)`), mai quelle di campionato della squadra (in Europa League restavano 18 squadre su 36).
- Giocatori di Champions ed Europa League (stagione attuale): `LeagueArchPlayersPanel` (sezione sotto) con `loadLeaguePlayerStats`, non `stats.json` (solo top 5 e solo campionato: mancava Jota Silva).
- Classifiche giocatori dell'archivio: `loadLeaguePlayerStats` completa ogni voce ufficiale con chi manca, sommando le sue partite (831 giocatori da 180' mancavano in 47 competizioni); mai nelle voci ufficiali gia' ogni 90' (`OFFICIAL_P90`, totali dal pannello).
- Stat. squadre dell'archivio senza statistiche di partita: gol fatti/subiti di tutte le squadre dai risultati e sotto le classifiche ufficiali (che hanno solo una parte delle squadre).

## Classifiche giocatori di coppe e campionati non top 5 (regola fissa, novembre 2026)
- La scheda Giocatori di Champions/Europa League e di ogni competizione che non e' uno dei top 5 usa le statistiche FotMob DELLA COMPETIZIONE (`LeagueArchPlayersPanel`, stesso pannello delle stagioni passate), mai `stats.json` (che sono i numeri del campionato nazionale: Ueda in Champions mostrava i 3,17 falli/90 della Ligue 1). I top 5 usano `stats.json` (verificato uguale a FotMob: falli/minuti di tutte e 5 le leghe).
- Nelle classifiche stagionali FotMob le voci "per 90" (`P90_OFFICIAL` in `ArchiveLeague.jsx`: fouls, total_scoring_att, accurate_pass, total_tackle, ...) sono GIA' medie ogni 90': mai moltiplicarle per 90/minuti. Totale e media esatta si sommano dalle partite (`statsFromMatches`) solo se concordano (>=95%) con la classifica ufficiale; senza partite il Totale non si mostra, l'Ogni 90' resta il valore FotMob.

## Statistiche giocatore: medie sempre ogni 90' (regola fissa)
- Nella scheda Statistiche del giocatore (`PastStats`, ogni competizione e stagione) falli, falli subiti, tiri, passaggi, contrasti, intercetti, recuperi, azioni difensive, parate... sono SEMPRE ogni 90' come su FotMob, con 2 decimali; restano totali solo gli eventi rari (gol, assist, xG/xA, passaggi chiave, palle gol, cartellini, rigori, autogol, porta inviolata).
- Quando la classifica ufficiale FotMob non ha il giocatore (sotto soglia), la riga aggiunta dalle sue partite (`loadPlayerStatsFor`) nelle voci `OFFICIAL_P90` va convertita ogni 90' (totale x 90 / minuti): prima entrava il totale (Spalt: 6 falli in 3. Liga invece di 1,87/90, 3 in Bundesliga invece di 4,82/90). La voce si completa per OGNI giocatore che manca, non solo per chi non ha i tiri.
- Competizioni senza classifiche ufficiali e Casa/Trasferta (statistiche sommate dalle partite): `playerViewLists` porta le voci di conteggio ogni 90'; posizione e media del campionato solo tra chi ha almeno 180' (45' a inizio stagione) piu' il giocatore stesso.
- Dove serve il totale (percentili, profilo dell'archivio: tiri, tiri in porta, falli) si usa `statTotal`, mai il valore ogni 90' come se fosse un totale.

## Infortunati: controllo a tappeto da piu' fonti (regola fissa)
- `infortuni.py` (workflow `infortuni.yml`, 3 volte al giorno: ~5:40, 11:40, 17:40 ora italiana) controlla TUTTI i giocatori dell'app (`giocatori.json`, `calc_extra.json`, `stats.json`; non solo `carriere.json`).
- Fonti incrociate: FotMob `injuryInformation` + ultima distinta col club (`recentMatches`); FotMob prossima partita (`unavailable`, formazione probabile/ufficiale); LiveScore lineups (`IS` = infortunati/squalificati con motivo e rientro, `Ps` = distinta) della prossima partita o delle ultime 3; assenza: fuori dalla distinta del club in almeno 2 partite di fila coperte da formazioni e da almeno 10 giorni (caso Lukic: FotMob non lo segna, LiveScore si').
- PitchAPI ed ESPN non pubblicano infortuni del calcio (verificato: endpoint 404, elenchi sempre vuoti): non si usano per questo.
- Rientro: chi compare in una distinta dopo la notizia o nella formazione della prossima partita, o la cui data di rientro e' passata, sparisce al giro dopo. "In dubbio" e "Back in training" NON escludono il giocatore.
- Uscite: `infortuni.json` (repository) solo con dati FotMob; decisione completa con LiveScore su KV `idx:inj` (worker `/r?k=idx:inj`), che l'app preferisce (`RAW.infortuniKv`, attesa massima 2,5 s). Referto `report/infortuni_stato.json`.
- Migliori Giocatori e Affidabilita' escludono solo chi e' fuori alla data della partita (`isOutOn`): infortunato, squalificato (fino alla partita dopo) o fuori dai convocati.
