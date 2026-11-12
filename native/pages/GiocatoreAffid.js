// Pagina "Affidabilita'" della scheda giocatore (nativo): affidabilita' prossima partita + il Calcolatore del giocatore con tutti i filtri.
import React from 'react';
import { View } from 'react-native';
import { DropBtn, LeagueLogo } from '../shared/ui';
import { useSel } from '../shared/hooks';
import { Affidabilita, statComps } from './GiocatoreStat';
import CalcPlayer from './CalcPlayer';

export default function GiocatoreAffid({ C, player: p, car, openRoute }) {
  const { comps } = statComps(p, car);
  const [sel, setComp] = useSel(p.id, 'sc', comps.length ? comps[0].id : null);
  const comp = comps.some((c) => c.id === sel) ? sel : comps.length ? comps[0].id : null;
  const curLg = comps.find((c) => c.id === comp) || null;
  return (
    <View>
      {comps.length > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
          <DropBtn C={C} title="Competizione" label={curLg ? curLg.name : ''} icon={<LeagueLogo league={curLg} size={24} C={C} />} options={comps.map((c) => ({ value: c.id, label: c.name, icon: <LeagueLogo league={c} size={26} C={C} /> }))} value={comp} onChange={setComp} />
        </View>
      ) : null}
      {comp ? <View style={{ paddingHorizontal: 20, paddingTop: 16 }}><Affidabilita key={comp} C={C} player={p} comp={comp} /></View> : null}
      <CalcPlayer embedId={p.id} C={C} openRoute={openRoute} />
    </View>
  );
}
