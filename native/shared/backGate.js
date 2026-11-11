// Swipe indietro da qualunque punto dello schermo: attivo quando la pagina in cima non ha uno swipe a schede che deve prendere il gesto
// (cioe' quando e' sulla prima scheda o non ha schede). Le schede con swipe laterale (DayPagerN, SwipeBodyN) si registrano qui
// solo mentre NON sono sulla prima scheda e la loro pagina e' quella in cima.
import React, { createContext, useContext, useEffect } from 'react';
import { makeMutable } from 'react-native-reanimated';

export const backAny = makeMutable(1);
// Schede con swipe laterale dentro una pagina con testata (Partita): lo swipe indietro e' spento solo se il dito parte DENTRO le schede;
// partendo dalla testata (risultato, squadre) o dalla barra delle schede torna sempre indietro.
export const backScoped = makeMutable(0);
export const pagerTouch = makeMutable(0);
export const LiveLayerCtx = createContext(true);
let blockers = 0;
let scoped = 0;
const sync = () => { backAny.value = blockers === 0 ? 1 : 0; backScoped.value = scoped > 0 ? 1 : 0; };
export function useBackGate(blocking, onlyInside = false) {
  const live = useContext(LiveLayerCtx);
  useEffect(() => {
    if (!live || !blocking) return undefined;
    if (onlyInside) scoped += 1; else blockers += 1;
    sync();
    return () => { if (onlyInside) scoped = Math.max(0, scoped - 1); else blockers = Math.max(0, blockers - 1); sync(); };
  }, [live, blocking, onlyInside]);
}
