# Regole ScalperLab: partite-formazioni

Testo completo delle regole fisse di quest'area (indice in CLAUDE.md). Valgono per tutto cio' che si aggiunge in futuro.

## Mappa tiri
- Le coordinate FotMob si specchiano in `data/fotmob.js` (campo e porta): vale per tutte le mappe.
- Cambiare tiro con le frecce deve essere fluido (niente componenti ricreati a ogni render, foto precaricate).

## Tabellone (coppe a eliminazione diretta)
- Dentro Classifica c'e' il selettore Classifica | Tabellone (`components/bracket/ClassificaSwitch.jsx`), per ogni competizione in `CUP_FM` (`data/bracket.js`): per aggiungere una coppa basta aggiungere il suo id FotMob.
- Il tabellone si ricava da `arch/<fm>/<stagione>.json` (turni `playoff,1/16,1/8,1/4,1/2,final`), rigori dall'evento `PenaltyShootout` delle partite. Stagione senza turni a eliminazione: il Tabellone non si mostra (niente pillola, niente scheda).
- Fasi in pillole: ogni schermata mostra due fasi e il passaggio e' uno scorrimento orizzontale (`components/bracket/Bracket.jsx`, posizioni calcolate a ogni fotogramma, mai componenti ricreati). Finale: locandina con colori e logo della competizione.

## Partite minori non iniziate
- Stesse schede dei top campionati: Panoramica, Statistiche (`data/archiveMetrics.js`, medie a partita dalla stagione archiviata), Formazioni, Classifica; niente "Giocatori migliori" né Affidabilità; ragnatela in "Duello in numeri"; meteo da 3 giorni prima.

## Formazioni (regola fissa, tutte le partite: live, prima del fischio, finite)
- Un solo campo con le due squadre (`MatchLineupsPanel.jsx`, `DualPitch`): casa in alto specchiata (ala destra a sinistra), ospite in basso, portieri agli estremi; nome casa nell'angolo in alto a sinistra, ospite in basso a destra; in cima "Formazione probabile/ufficiale" (o "Formazioni" a partita giocata) e i due moduli. Niente tasto di cambio squadra.
- Sotto il campo: selettore squadra (`SidePicker` in `MatchLineupsPanel.jsx`, concept Sofascore): due pillole a meta' larghezza, larghe quanto il campo, casa a sinistra e ospite a destra con stemma + nome; la scelta scorre (striscia orizzontale, niente componenti ricreati) e mostra la pillola dell'allenatore nei colori della squadra e sotto, in colonna, tutta la sua panchina. Il "niente tasto di cambio squadra" vale per il campo, non per queste pillole. Una sola squadra con dati = niente pillole.
- Icone sul giocatore (concept A, posto fisso): voto a pillola sotto il volto, cartellino in alto a sinistra, gol/assist in colonna in alto a destra, cambio = solo le due freccette (verde su / rossa giu', niente sfondo, bordo o minuto) in basso a sinistra, capitano "C" in basso a destra, stella gialla al migliore in campo.

## Numeri da tenere d'occhio (tutte le partite)
- `matchKeyNumbers` (`data/extras.js`): un solo calcolo per top campionati (`metricOf`) e campionati/coppe aggiunti (`archiveMetrics`, altrimenti `listMetrics`). Per ogni statistica di `CATEGORY_DEFS` la posizione nel proprio campionato (1° = migliore; statistiche negative al contrario): solo le squadre tra le prime o le ultime (~12%, almeno 2), con valore e posizione, casa e trasferta alternate, al massimo 8. Valori condivisi da molte squadre non sono primati. Vittorie fuori casa e Over 2,5 solo se fuori dal comune. Niente di notevole = niente riquadro.
- Aspetto (regola fissa, concept C scelto il 04/11/2026): carosello stile storie (`MatchKeyNumbers.jsx`, classi `km-*` in `index.css`, colori `--story-*` nei temi). Barrette in alto, avanzamento da solo (5,5 s), tocco a destra/sinistra = avanti/indietro, tenuto premuto = pausa, swipe di lato (`data-no-swipe`, lo swipe indietro dell'app resta). Altezza fissa 232 px, dissolvenza con opacity/transform, barretta mossa da un solo requestAnimationFrame che scrive il transform (nessun nuovo disegno della pagina), ferma fuori schermo, in background e con "riduci movimento". Schede squadra: stemma sfocato di sfondo + stemma nitido; schede giocatore: volto (`PlayerPhoto`, sagoma se manca) a destra, posizione grande in trasparenza.
- Schede giocatore (`data/keyPlayers.js`, `matchKeyPlayers`): giocatori delle due squadre tra i primi 10 della competizione della partita in Tiri, Tiri in porta, Falli commessi, Falli subiti, Fuorigioco, classifica ogni 90' con almeno 180' (pari merito = stessa posizione). Top 5 da `stats.json`; le altre competizioni da `loadLeaguePlayerStats` della stagione in corso (voci ufficiali gia' ogni 90': totali dalle partite solo se concordano, altrimenti niente totale) e fuorigioco da `statsFromMatches`; falli subiti solo se la competizione ha `was_fouled`. Squadre senza id FotMob (stemma PitchAPI, coppe) abbinate per nome con `teamIdByName`. Mostrata la statistica con la posizione migliore, le altre citate ("anche 4° tiri in porta"); al massimo 6 giocatori, casa e trasferta alternate, alternati alle schede squadra. Nessuno in top 10 = solo schede squadra. Prova: "numeri da tenere d occhio: storie..." in `preview.mjs`.

## Meteo e arbitro (campionati aggiunti)
- Meteo (`data/weather.js`, Open-Meteo, da 3 giorni prima): stadio da `stadi.json`, poi stadio FotMob della squadra di casa (`v` in `rose.json`, `update_rose.py`), poi `stadi_ex.json` (`stadi_extra.py`), infine geocoding filtrato per paese del campionato (risultati ricordati sul telefono). Il nome dello stadio FotMob riempie anche la voce Stadio.
- Arbitro: FotMob (`/fx`), poi `arbitri_extra.json` (`arbitri_extra.py`, API-Football con `API_FOOTBALL_KEY`, partite di oggi e dei 3 giorni dopo), letto in `prepareMatch`. Workflow `arbitri_extra.yml` ogni 4 ore. ESPN non da' gli arbitri (verificato). Mai nomi inventati.

## Tabellone fluido
- Riquadri del tabellone con `contain: layout paint`; `will-change` solo durante il passaggio tra fasi (da fermo e nello swipe tra schede un solo livello). Stemmi pre-decodificati in `loadBracket`.

## Icone gol e assist
- Gol = pallone bianco con pentagono e cuciture neri (`BallIcon`), assist = scarpino dorato basso e inclinato, punta in basso a destra, tacchetti sotto (`BootIcon`), in `components/match/EventIcons.jsx`: usarle ovunque (formazioni, Riassunto, finestre, liste, mappe). Mai emoji.

## Classifiche: zone e leggenda
- FotMob per molte stagioni da' la classifica a gironi/conference (`tables`): `archivio.py` e `tabelle_gironi.py` (workflow Archivio storico) la salvano come `groups: [{n, table, legend}]` (un solo gruppo = `table` + `legend`); `nogroups` = FotMob non ha classifica. `StandingsPanel` mostra un blocco per gruppo con le sue zone e la sua leggenda.
- Le lineette colorate vengono dalla fonte (`qualColor` delle righe, `legend` della stagione). Se FotMob non ha la tabella e la classifica e' ricostruita dalle partite, le posizioni della leggenda si applicano solo dove la classifica finale e' a punti (`ZONES_NOT_BY_POINTS` in `data/archive.js` esclude MLS, Argentina, Austria, Belgio, Grecia e coppe). La leggenda c'e' solo se le righe hanno colori. Mai zone inventate.

## Mappa tiri: tiri murati
- Ogni pallino ha un'area di tocco trasparente ampia (~54 px, `ShotDot.jsx`) in tutte le mappe: si tocca facilmente anche se piccolo.
- Un tiro murato (`outcome === 'Murato'`) non e' in porta (`onTarget` false anche se la fonte dice il contrario): pallino vuoto, traiettoria tratteggiata fino al punto in cui e' stato fermato (`bx`,`by`) chiusa da un trattino perpendicolare (`BlockTrace` in `ShotDot.jsx`), mai nella grafica della porta. Vale in ogni mappa (`MatchShotMap`, `ShotExplorer`, `MiniShotMap`).

## Posizioni nelle statistiche (mai "0°")
- Posizione = 1 + squadre con valore migliore (pari merito = stessa posizione); squadra senza quel dato = riga omessa (`PreMatchStats`, `TeamStatsPanel`). Prova: "statistiche pre-partita: nessuna posizione 0°".

## Statistiche previste (partite non iniziate, regola fissa)
- Al posto del tasto "Confronto completo delle statistiche" c'e' il pannello `components/match/PredictedStats.jsx` (concept B): casa a sinistra, ospite a destra con stemmi, una barra divisa per statistica nei colori sociali delle due squadre (se troppo simili l'ospite passa al secondo colore), senza note sul calcolo. Previsto casa = (fatti dalla casa + subiti dall'ospite) / 2 e viceversa (`fallisubiti`, `fuorigiocoAvv`, `gialliAvv` in `SRC`); fattore casa +15% / trasferta -15% SOLO su tiri, tiri in porta e corner (etichetta "Fattore casa"), mai su falli, fuorigioco e cartellini. Riga senza uno dei quattro dati = omessa; niente dati = niente pannello. Prova: "statistiche previste: pannello..." in `preview.mjs`.

## Arbitro in partita: ultime due stagioni
- `arbitri_stagioni.py` (workflow `arbitri_stagioni.yml`, ogni giorno) -> `arbitri2/<fm>.json`: gare e medie di cartellini (gialli + rossi) e falli nelle due stagioni piu' recenti con arbitri, stesso arbitro con nomi diversi unito (nome + cognome), medie solo sulle partite con quel dato. `refTwoSeasons` in `prepareMatch`, `RefereeCard`: "N gare nelle ultime 2 stagioni". Senza dati si resta sulle altre fonti; una barra senza dato non si mostra.

## Formazioni probabili dei campionati aggiunti (verificato)
- FotMob (`matchDetails` -> `content.lineup`) per molti campionati minori (es. Pro League) ha `lineupType: unavailable` e nessun titolare fino a ~1 ora dal fischio: la scheda Formazioni compare quando FotMob li pubblica. Mai formazioni inventate o stimate.

## Scheda giocatore live: pallini dei minuti e ragnatela (regola fissa)
- Pallini dei minuti sopra la mappa (`Chips` in `ShotExplorer.jsx`, concept A): rispecchiano il pallino del tiro. Fuori e murato = solo contorno nel colore squadra, dentro scuro come lo sfondo; in porta e palo = pieno nel colore squadra; gol = pieno con anello dorato. Colore squadra troppo scuro (`seen` in `player/Radar.jsx`) = bianco. Esito di palo/traversa = "Palo" (`outcomeOf`). Le mappe (campo e porta) non cambiano.
- Ragnatela giocatore (`player/Radar.jsx`, concept B): colore squadra scuro (`lum` < 0,42, letto anche da #rgb e rgb()) = area `--ink` al 34%, linea e punti `--ink` spessi, griglia al 30%, nomi piu' chiari; colori chiari restano come prima.

## Mappa tiri: pali e traverse (regola fissa)
- FotMob li da' come `eventType: Post` (con `isOnTarget` spesso falso): in `mapShots` (`data/fotmob.js`), `data/matches.js` ed `extras.js` diventano esito "Palo" con `onTarget` vero, quindi pallino pieno come un tiro in porta in ogni mappa. Nel conteggio "tiri in porta" (`MiniShotMap`, `ShotExplorer`) il palo non conta.
