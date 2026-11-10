// Riga con la tendina della competizione e, accanto, quella delle stagioni (come CompSeasonBar del sito).
import React from 'react';
import { View } from 'react-native';
import Dropdown from './Dropdown';
import { LeagueLogo } from './ui';
import { seasonLabel } from '@/data/archive';

export default function CompBarN({ C, comps, comp, onComp, allLabel = null, seasons = [], season, onSeason, noCur = false }) {
  const copts = comps && comps.length ? [...(allLabel ? [{ key: 'all', label: allLabel }] : []), ...comps.map((c) => ({ key: c.id, label: c.name, league: c }))] : null;
  const sopts = seasons.length ? [...(noCur ? [] : [{ key: 'cur', label: 'Stagione attuale', short: 'Attuale' }]), ...seasons.map((s) => ({ key: s, label: seasonLabel(s) }))] : null;
  if (!copts && !sopts) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
      {copts ? <View style={{ flexShrink: 1 }}><Dropdown C={C} options={copts} value={comp} onChange={onComp} side="left" width={270} pillKey="label" icon={(o) => (o.league ? <LeagueLogo league={o.league} size={22} C={C} /> : null)} /></View> : null}
      {sopts ? <Dropdown C={C} options={sopts} value={season || 'cur'} onChange={onSeason} side="left" width={200} /> : null}
    </View>
  );
}
