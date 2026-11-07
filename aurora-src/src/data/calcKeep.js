// Il Calcolatore ricorda giocatore e valori inseriti finche' non si cambia zona dell'app (Home, Migliori giocatori, Migliori matchup):
// aprendo la scheda del giocatore dal suo banner, o la sua prossima partita, e tornando indietro (swipe o tasto Calcolatore)
// tutto resta com'era, compresi i valori cambiati a mano. Copia anche in localStorage: se l'app nativa ricrea la pagina web
// (ritorno dal background, processo chiuso da iOS) lo stato si ritrova uguale. La copia scade dopo 60 minuti senza modifiche.
const LS = 'sl-calc-keep';
const TTL = 60 * 60 * 1000;

const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (s && Date.now() - (s.at || 0) < TTL) return s;
  } catch (e) { /* storage non disponibile */ }
  return null;
};

const s0 = load();
export const CALC_KEEP = { player: s0 ? s0.player || null : null, team: s0 ? s0.team || null : null, index: s0 ? s0.index || 0 : 0, stKey: s0 ? s0.stKey || '' : '' };

let timer = null;
export const saveCalcKeep = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    try { localStorage.setItem(LS, JSON.stringify({ ...CALC_KEEP, at: Date.now() })); } catch (e) { /* ignora */ }
  }, 250);
};

export const resetCalcKeep = () => {
  CALC_KEEP.player = null; CALC_KEEP.team = null; CALC_KEEP.index = 0; CALC_KEEP.stKey = '';
  if (timer) { clearTimeout(timer); timer = null; }
  try { localStorage.removeItem(LS); } catch (e) { /* ignora */ }
};
