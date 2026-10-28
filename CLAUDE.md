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
- Il tabellone si ricava da `arch/<fm>/<stagione>.json` (turni `playoff,1/16,1/8,1/4,1/2,final`), rigori dall'evento `PenaltyShootout` delle partite. Stagione in corso senza turni a eliminazione: "Nessun dato ancora disponibile".
- Fasi in pillole: ogni schermata mostra due fasi e il passaggio e' uno scorrimento orizzontale (`components/bracket/Bracket.jsx`, posizioni calcolate a ogni fotogramma, mai componenti ricreati). Finale: locandina con colori e logo della competizione.

## Ritorno da una partita
- Aprendo una partita (anche dal Tabellone) e tornando indietro, il campionato resta sulla stessa stagione, scheda, Classifica/Tabellone e fase (`useEntityScope`/`useSel` con chiave `lg-<fm>`); si resetta solo aprendo di nuovo la competizione da zero.

## Partite minori non iniziate
- Stesse schede dei top campionati: Panoramica, Statistiche (`data/archiveMetrics.js`, medie a partita dalla stagione archiviata), Formazioni, Classifica; niente "Giocatori migliori" né Affidabilità; ragnatela in "Duello in numeri"; meteo da 3 giorni prima.

## Swipe per tornare indietro (regola fissa, vale per ogni pagina presente e futura)
- Lo swipe indietro e' a scorrimento: la pagina attuale esce a destra e la pagina di destinazione si vede sotto (fotografia presa prima di lasciarla, `installBackSnaps` in `lib/carousel.js`) e prende il posto al centro. Mai schermo nero. Tutti i punti che tornano indietro passano da `pageDrag`/`pageBack` di `lib/carousel.js`.
- Tornando, i tabelloni gia' caricati restano in memoria (`peekBracket`) e non si rianimano.

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
- Icone sul giocatore (concept A, posto fisso): voto a pillola sotto il volto, cartellino in alto a sinistra, gol/assist in colonna in alto a destra, cambio col minuto in basso a sinistra, capitano "C" in basso a destra, stella gialla al migliore in campo.

## Fluidita' (priorita' massima)
- Una partita si mostra solo quando e' pronta: `data/prepare.js` (`prepareMatch`, una promessa per partita, avviata al tocco della riga in `MatchRow`), spinner unico in `pages/Match.jsx`; niente riepilogo/momentum/statistiche che arrivano dopo.
- Cambio giorno dal calendario: `dayReady` aspetta gli orari reali; la riga dell'orario e' sempre riservata (niente salti di altezza).
- La fotografia per lo swipe indietro (`cloneVisible` in `lib/carousel.js`) copia solo la parte visibile.

## Colori e loghi competizioni
- Colori scelti dall'utente in `PALETTE` (`data/leagues.js`): banner e pillole Home. Loghi dei campionati/coppe extra da FotMob (`leaguelogo/<fm>.png`, `dark/`). Le squadre delle coppe nazionali mostrano il campionato (`CUP_IDS`), e squadre omonime di altro paese non si fondono (es. Arsenal in Coupe de France).
