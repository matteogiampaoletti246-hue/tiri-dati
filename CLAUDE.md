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
