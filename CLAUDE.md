# ScalperLab (Aurora): regole fisse

App calcio: Home nativa Expo (`native/`), sito React in WebView (`aurora-src/`, compilato in `aurora/` dalla CI), worker Cloudflare (`worker/`). Questo file e' volutamente corto: le regole complete stanno in `docs/regole/<area>.md`.
**Prima di toccare un'area apri il suo file** (indice in fondo); se aggiungi o cambi una regola, scrivila nel file dell'area e qui solo se e' una regola generale. Le regole valgono per TUTTE le squadre, campionati e giocatori presenti e futuri, senza doverle ricorreggere.

## Come si lavora (sempre)
- Ogni modifica grafica: 3 concept A/B/C come immagini in chat. Se c'e' animazione/transizione: una pagina (artifact) con A/B/C animati e tasto "Riproduci" ciascuno, mai GIF. L'utente sceglie in chat, poi si applica.
- Prima di pubblicare: build locale (`cd aurora-src && npm ci && npm run build`), prova su iPhone simulato (`.github/webkit/preview.mjs`, WebKit/Chromium mobile) e, se serve, una prova nuova in `preview.mjs`. Dopo il push: aspettare la CI (`aurora_build.yml`), controllare il sito vero e i dati veri su GitHub e correggere da soli i problemi, senza aspettare la segnalazione.
- Fluidita' prima di tutto: niente scatti, salti di layout o schermi neri. Diagnosticare provando (misure, frame) prima di chiedere un video; niente riassunti "da 100 ms a 26 ms", servono correzioni vere.
- App nativa: dopo una pubblicazione Expo l'utente chiude Expo Go del tutto e lo riapre due volte; ogni modifica nativa la giudica lui sul telefono.
- `worker/index.js`: prima di ogni push `npx esbuild worker/index.js --outfile=/dev/null`; dopo il push provare l'endpoint (un errore di sintassi ferma la pubblicazione in silenzio).
- Il repository e' pubblico: mai dati di terzi (PitchAPI, LiveScore) ne' chiavi nel repo; stanno su Cloudflare KV / secrets (`docs/regole/giocatori-dati.md`). Le chiavi (`PITCHAPI_KEY`, `API_FOOTBALL_KEY`, `CLOUDFLARE_API_TOKEN`) non sono nell'ambiente di lavoro: si provano solo coi workflow (`gh workflow run`).
- Ogni cache nuova ha capienza fissa (`lib/lru.js`). Nuovi colori sempre nei temi (`DARK`/`LIGHT`, variabili CSS), mai fissi nei componenti.
- Token: leggere solo i file dell'area che si tocca; non rileggere CLAUDE.md o i docs senza motivo.

## Regole generali dell'interfaccia
- **Uniformita'**: ogni scheda (campionato, squadra, giocatore, partita) usa gli stessi componenti per top campionati e minori, passati e attuali: stessi font, schede, disposizione, foto, colori, tasti. Cambiano solo i dati.
- **Niente "non disponibile"**: statistica, riquadro, pillola, voce o scheda senza dati non si mostra (mai "non disponibile", "in arrivo", "nessun dato", riquadri vuoti, "—"); la pagina parte dal primo elemento con dati. Mai dati inventati. (Due eccezioni per le statistiche giocatore: vedi `giocatori-dati.md`.)
- **Swipe indietro**: sempre a scorrimento con la pagina di destinazione sotto (`pageDrag`/`pageBack` in `lib/carousel.js`), mai schermo nero, mai salti. Ogni punto che torna indietro passa da li'.
- **Tendine e finestre**: `usePopFit`/`popScroll`, `MenuBackdrop`, `useModalLock`; scorre solo la lista; con una finestra aperta nessuno swipe di pagina.
- **Giocatore toccato in una partita non iniziata** (formazioni, Migliori Giocatori, Affidabilita'): pannello da destra `PlayerPanel` (dettagli in `swipe-interfaccia.md`); iniziata/finita: tendina dal basso. Il controllo e' solo `matchStarted` (`data/playerPanel.js`).
- **Foto giocatori**: solo `PlayerPhoto` (sagoma se manca). **Icone gol/assist**: `BallIcon`/`BootIcon`, mai emoji. Liste di partite sempre "vs".
- **Stagione/competizione scelte** restano finche' la scheda e' nella pila; aprendo da zero si riparte da "Attuale".
- **Fonti dati**: FotMob prima, poi PitchAPI, LiveScore, OneFootball, API-Football; mai formazioni, nomi o zone inventate.
- **Home e Matchup/Giocatori** partono da Oggi (niente giorni passati in Migliori Giocatori e Migliori Matchup).

## Indice delle regole (docs/regole/)

**`swipe-interfaccia.md`**: swipe indietro e tra giorni/schede, tendine e finestre, fluidita', memoria, testi tagliati.
Sezioni: Interfaccia · Swipe per tornare indietro · Swipe indietro su iPhone · Swipe tra giorni / schede · Swipe indietro: la pagina vera prima della fotografia · Swipe indietro: dove parte · Scroll indipendente tra le pagine · Tendine e finestre · Tendina delle stagioni nel banner · Finestra giocatore su iPhone: altezza dallo schermo vero · Testi tagliati · Niente salti all'arrivo · Fluidita' · Memoria (l'app resta fluida anche dopo molte pagine) · Fluidita' della Home.

**`home-live.md`**: Home (finestre per paese, stato/risultati veri), live, classifica live, risultati, giornate, colori partita.
Sezioni: Home: stato e risultato sempre quelli veri · Risultati sempre aggiornati · Giornate dalle date (competizioni aggiunte e d'archivio) · Tutte le competizioni in Home e una scheda per ogni squadra · Home: finestre per paese (concept Sofascore, regola fissa) · Colore delle schede partita, tabellone, riepilogo live, minuti live · Tasto Tutte | Live: pillola unica · Risultato live veloce quanto le statistiche · Live: mappa tiri, barre e risultato insieme · Live e riepiloghi: FotMob poi LiveScore · Classifica sempre fresca e classifica live.

**`squadre-competizioni.md`**: schede squadra, rose, stagioni/competizioni, campionati aggiunti, uniformita', femminili, squadre B.
Sezioni: Uniformità · Stagioni e competizioni · Partite squadra · Ritorno da una partita · Campionati minori · Campionati aggiunti (extra) — regola fissa · Colori e loghi competizioni · Squadra unica, rose, coppe · Stagioni con suffisso · Squadre B / riserve · Competizioni di una squadra: tutta la storia · Partite squadra: "Partite precedenti" · Rose (pannello "Squadra", regola fissa) · Rose di tutte le squadre, per ruolo · Giocatori della squadra: ogni competizione giocata · Partite squadra: stagione in corso da tutte le competizioni · Squadre femminili.

**`partite-formazioni.md`**: pagina partita, formazioni, tabellone, mappa tiri, arbitro/meteo, numeri da tenere d'occhio.
Sezioni: Mappa tiri · Tabellone (coppe a eliminazione diretta) · Partite minori non iniziate · Formazioni · Numeri da tenere d'occhio (tutte le partite) · Meteo e arbitro (campionati aggiunti) · Tabellone fluido · Icone gol e assist · Classifiche: zone e leggenda · Mappa tiri: tiri murati · Posizioni nelle statistiche (mai "0°") · Statistiche previste (partite non iniziate, regola fissa) · Arbitro in partita: ultime due stagioni · Formazioni probabili dei campionati aggiunti (verificato) · Scheda giocatore live: pallini dei minuti e ragnatela · Mappa tiri: pali e traverse.

**`giocatori-dati.md`**: scheda giocatore, statistiche, fonti dati (FotMob/PitchAPI/LiveScore), foto, carriere, "niente non disponibile".
Sezioni: Giocatori: competizioni e stagioni · Giocatori di tutti i campionati · Foto dei giocatori · Carriere · Statistiche complete per ogni stagione · Statistiche giocatore · Classifiche giocatori: tutti con almeno 180 minuti · Foto mancanti (calcolatore e ovunque) · Statistiche giocatore: stessi numeri ovunque · Statistiche giocatori: gerarchia delle fonti · Rose da LiveScore (squadre senza rosa FotMob, regola fissa) · Dati di fonti terze: mai nel repository · Profili completi per tutti i giocatori · Dati · Niente "non disponibile" · Profili unici: PitchAPI collegato a FotMob · Archivio partite: la stagione in corso non si chiude mai · Classifiche delle competizioni: tutte le squadre e tutti i giocatori.

**`calcolatore-migliori.md`**: Calcolatore, Affidabilita', Migliori Giocatori e Matchup, handicap, statistiche previste.
Sezioni: Affidabilita' e arbitri · Affidabilita' per Eredivisie, Pro League, Superliga (Danimarca), Super League (Grecia), Primeira Liga, Super Lig · Migliori giocatori e Migliori matchup (fluidita') · Migliori giocatori: riga squadre (concept B, regola fissa) · Handicap dei campionati minori · Migliori giocatori: anche Champions ed Europa League · Calcolatore: falli commessi e subiti · Calcolatore: peso della linea e tasto dal profilo · Calcolatore: colori e animazioni · Migliori Giocatori: statistiche, tendina e animazioni · Hit Rate: partite da almeno 50 minuti, stagione in corso poi passata · Partite del giocatore: un'unica lista.

**`app-nativa.md`**: app Expo/React Native (Home nativa, barra, swipe, background, pubblicazione).
Sezioni: App nativa (Expo / React Native, cartella `native/`) · App nativa: Home concept B · App nativa: tocco prima che la pagina web sia pronta · App nativa: apertura veloce delle schede e rotella · Home nativa (Expo Go): ritorni, ricerca, storico, ordine · Pubblicazione app nativa (Expo) · App nativa: barra unica e swipe indietro veloce · Home nativa: il risultato accanto a LIVE · Barra nativa solo nelle 4 voci · Home nativa: finestre con molte partite · App nativa: ritorno dal background.

## Dove sta cosa (percorsi utili)
- Sito: `aurora-src/src/{pages,components,data,lib,hooks}`; prove WebKit in `.github/webkit/preview.mjs` (`ONLY=regex` per un passo solo); server locale `node .github/webkit/serve.mjs <radice> 8080`.
- Dati: script Python `*.py` nella radice con workflow in `.github/workflows/`; archivi `arch/`, `partite/`, `giorni/`, `rosa/`, `car/`, `pidx/`, `tidx/`.
- Nativo: `native/App.js`, `native/meta.json` (generato da `native/tools/gen_meta.mjs`); worker `worker/index.js`.
