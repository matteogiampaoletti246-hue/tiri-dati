// Ritorno dal background: per i primi istanti il thread JS deve restare libero per il tocco.
// Tutto cio' che al ritorno aggiorna dati (Home, partita, Calcolatore) aspetta RESUME_CALM ms e parte dopo le interazioni in corso.
import { AppState, InteractionManager } from 'react-native';

export const RESUME_CALM = 2500;
let activeAt = 0;
AppState.addEventListener('change', (st) => { if (st === 'active') activeAt = Date.now(); });

// true finche' siamo nei primi istanti dopo il ritorno
export function justResumed() { return Date.now() - activeAt < RESUME_CALM; }

// esegue fn al ritorno in primo piano, dopo RESUME_CALM e quando il tocco/animazioni hanno finito; ritorna la funzione per annullare
export function onResumeCalm(fn) {
  let tm = null; let task = null;
  const sub = AppState.addEventListener('change', (st) => {
    if (st !== 'active') return;
    clearTimeout(tm); if (task && task.cancel) task.cancel();
    tm = setTimeout(() => { task = InteractionManager.runAfterInteractions(() => { task = null; fn(); }); }, RESUME_CALM);
  });
  return () => { sub.remove(); clearTimeout(tm); if (task && task.cancel) task.cancel(); };
}
