// Pagina "Affidabilita'" della scheda giocatore (nativo): affidabilita' prossima partita + il Calcolatore del giocatore con tutti i filtri.
// Competizione e partita sono quelle della prossima partita vera del giocatore (club o nazionale), scelte in automatico; una scelta a mano resta.
import React from 'react';
import { View } from 'react-native';
import { DropBtn, LeagueLogo } from '../shared/ui';
import { useSel } from '../shared/hooks';
import { Affidabilita, statComps, useNextComp } from './GiocatoreStat';
import CalcPlayer from './CalcPlayer';

// competizione mostrata in Affidabilita': la scelta a mano, altrimenti quella della prossima partita
export function useAffidComp(p, car) {
  const { comps } = statComps(p, car);
  const [sel, setSel] = useSel(p.id, 'ac', null);
  const auto = useNextComp(p, comps);
  const comp = comps.some((c) => c.id === sel) ? sel : auto.id || (comps.length ? comps[0].id : null);
  return { comps, comp, setSel, ready: auto.ready };
}

export default function GiocatoreAffid({ C, player: p, car, openRoute }) {
  const { comps, comp, setSel, ready } = useAffidComp(p, car);
  const [, setSc] = useSel(p.id, 'sc', comps.length ? comps[0].id : null); // la scelta a mano vale anche per Statistiche e per i colori della testata (come prima)
  const curLg = comps.find((c) => c.id === comp) || null;
  return (
    <View>
      {comps.length > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
          <DropBtn C={C} title="Competizione" label={curLg ? curLg.name : ''} icon={<LeagueLogo league={curLg} size={24} C={C} />} options={comps.map((c) => ({ value: c.id, label: c.name, icon: <LeagueLogo league={c} size={26} C={C} /> }))} value={comp} onChange={(v) => { setSel(v); setSc(v); }} />
        </View>
      ) : null}
      {comp ? <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>{ready ? <Affidabilita key={comp} C={C} player={p} comp={comp} /> : <View style={{ height: 190, borderRadius: 18, backgroundColor: C.skBase }} />}</View> : null}
      <CalcPlayer embedId={p.id} C={C} openRoute={openRoute} />
    </View>
  );
}
