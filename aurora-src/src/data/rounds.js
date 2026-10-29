// Giornate delle competizioni d'archivio/aggiunte decise dalle DATE, non dal solo numero di turno.
// Una giornata contiene solo le partite della sua finestra di date; le partite rinviate e giocate settimane
// dopo (stesso numero di turno) diventano "Recuperi" nella loro data e non allungano la giornata.
// Riga partita: [id, turno, casa, ospite, isoUTC, punteggio, finita, iniziata, annullata]
const DAY = 864e5;
const GAP = 3 * DAY; // partite dello stesso turno a piu' di 3 giorni l'una dall'altra = gruppi diversi
const REC_GAP = 3 * DAY; // recuperi vicini nel tempo stanno nello stesso riquadro
const STALE = 36 * 3600e3; // turno con l'ultima partita passata da 36 ore: concluso anche se manca un risultato
const NUM = /^\d+$/;

export const tsOf = (m) => Date.parse(m[4]) || 0;
export const isDone = (m) => !!m[6] || !!m[8];

// gruppi di date di un turno: quelli consistenti (>= 20% delle partite, almeno 3) sono riquadri propri
// (fasi diverse o andata/ritorno con lo stesso numero), quelli piccoli sono recuperi
function splitRound(sorted) {
  const cl = [];
  sorted.forEach((m) => {
    const l = cl[cl.length - 1];
    if (l && tsOf(m) - tsOf(l[l.length - 1]) <= GAP) l.push(m); else cl.push([m]);
  });
  if (cl.length < 2) return { cores: [sorted], out: [] };
  const min = Math.max(3, sorted.length * 0.2);
  let cores = cl.filter((c) => c.length >= min);
  if (!cores.length) cores = [cl.reduce((a, b) => (b.length > a.length ? b : a))];
  return { cores, out: sorted.filter((m) => !cores.some((c) => c.includes(m))) };
}

// blocchi in ordine di data: { key, r (turno, null per i recuperi), rec, list }
export function roundBlocks(fix) {
  const byR = new Map();
  fix.forEach((m) => { if (!byR.has(m[1])) byR.set(m[1], []); byR.get(m[1]).push(m); });
  const blocks = [];
  const rec = [];
  let ord = 0;
  byR.forEach((list, r) => {
    const s = [...list].sort((a, b) => tsOf(a) - tsOf(b));
    const { cores, out } = NUM.test(String(r)) ? splitRound(s) : { cores: [s], out: [] };
    cores.forEach((core, i) => blocks.push({ key: `r${r}${i ? `-${i}` : ''}`, r, rec: false, list: core, start: tsOf(core[0]), ord: ord++ }));
    rec.push(...out);
  });
  rec.sort((a, b) => tsOf(a) - tsOf(b));
  let last = null;
  rec.forEach((m) => {
    if (last && tsOf(m) - tsOf(last.list[last.list.length - 1]) <= REC_GAP) last.list.push(m);
    else { last = { key: `x${m[0]}`, r: null, rec: true, list: [m], start: tsOf(m), ord: ord++ }; blocks.push(last); }
  });
  return blocks.sort((a, b) => a.start - b.start || a.ord - b.ord);
}

// stato di un blocco dalle date: Conclusa / In corso / Prossima
export function blockTag(list, now = Date.now()) {
  const first = tsOf(list[0]);
  const lastTs = tsOf(list[list.length - 1]);
  if (list.every(isDone) || now > lastTs + STALE) return 'Conclusa';
  return first <= now ? 'In corso' : 'Prossima';
}

// indice del blocco da cui parte la lista: il primo non concluso, altrimenti l'ultimo
export function currentBlock(blocks, now = Date.now()) {
  const i = blocks.findIndex((b) => blockTag(b.list, now) !== 'Conclusa');
  return i >= 0 ? i : Math.max(0, blocks.length - 1);
}
