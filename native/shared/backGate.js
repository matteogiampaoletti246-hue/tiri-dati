// Swipe indietro da qualunque punto dello schermo: attivo quando la pagina in cima non ha uno swipe a schede che deve prendere il gesto
// (cioe' quando e' sulla prima scheda o non ha schede). Le schede con swipe laterale (DayPagerN, SwipeBodyN) si registrano qui
// solo mentre NON sono sulla prima scheda e la loro pagina e' quella in cima.
import React, { createContext, useContext, useEffect } from 'react';
import { makeMutable } from 'react-native-reanimated';

export const backAny = makeMutable(1);
export const LiveLayerCtx = createContext(true);
let blockers = 0;
const sync = () => { backAny.value = blockers === 0 ? 1 : 0; };
export function useBackGate(blocking) {
  const live = useContext(LiveLayerCtx);
  useEffect(() => {
    if (!live || !blocking) return undefined;
    blockers += 1; sync();
    return () => { blockers = Math.max(0, blockers - 1); sync(); };
  }, [live, blocking]);
}
