// Pagina di una scheda con scorrimento verticale proprio (e avviso di fondo vicino per le liste che caricano a gruppi).
// `anchor`: ref { on } - quando e' acceso e il contenuto cresce SOPRA quel che si guarda (es. "Partite precedenti"), la pagina si sposta della
// stessa altezza: quel che si leggeva resta dov'era.
import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { emitNearEnd } from './hooks';
import { scrollPing } from './inView';

export default function PaneN({ children, bottom = 90, anchor }) {
  const sc = useRef(null);
  const oy = useRef(0);
  const ch = useRef(0);
  // il contenuto non si accorcia mai mentre si guarda piu' in basso: cambiando filtro la pagina non salta (altrimenti iOS la riporta in cima/in fondo)
  const [minH, setMinH] = useState(0);
  return (
    <ScrollView ref={sc} scrollEventThrottle={16}
      onScroll={(e) => { const { contentOffset: o, contentSize: c, layoutMeasurement: l } = e.nativeEvent; oy.current = o.y; scrollPing(); if (o.y + l.height > c.height - 600) emitNearEnd(); }}
      onContentSizeChange={(w, h) => {
        setTimeout(scrollPing, 120); // i grafici che crescono entrando nello schermo (Hit rate) controllano se sono visibili
        const d = h - ch.current;
        ch.current = h;
        if (oy.current > 20) setMinH((m) => (h > m ? h : m)); else if (minH) setMinH(0);
        if (anchor && anchor.on && d > 0 && sc.current) { anchor.on = false; sc.current.scrollTo({ y: oy.current + d, animated: false }); }
      }}
      contentContainerStyle={{ paddingBottom: bottom + 24, minHeight: minH || undefined }}>{children}</ScrollView>
  );
}
