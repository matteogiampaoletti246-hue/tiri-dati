// Il Calcolatore ricorda giocatore e valori inseriti finche' non si cambia zona dell'app (Home, Migliori giocatori, Migliori matchup):
// aprendo la scheda di un giocatore dal suo banner e tornando indietro (swipe o tasto Calcolatore) la scelta resta com'era.
export const CALC_KEEP = { player: null, team: null, index: 0, stKey: '' };
export const resetCalcKeep = () => { CALC_KEEP.player = null; CALC_KEEP.team = null; CALC_KEEP.index = 0; CALC_KEEP.stKey = ''; };
