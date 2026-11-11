// Statistiche di una stagione (attuale dall'archivio o passata) di un giocatore: stesso aspetto della stagione attuale.
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import useAsync from '@/hooks/useAsync';
import { loadSeason, statsFromMatches, zeroFor, poolAvg, loadPlayerStatsFor, playerViewLists, playerStatIsP90, teamIdByName, PLAYER_STAT_IT, SEASON_STAT_IT, prettyKey, seasonLabel, loadColors, loadColors2, teamLogo } from '@/data/archive';
import { teamByName } from '@/data/teams';
import { fixedColors } from '@/data/teamColorFix';
import { Segmented, Panel } from '../shared/ui';
import { BarRow, groupOf, ORDER, fmtVal, standingOf, zeroStandingOf } from '../shared/StatBars';

const shade = (hex, k) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#1B2C4E';
  const n = parseInt(m[1], 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${((1 << 24) | (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1)}`;
};
// colori sociali: dal file generato dagli stemmi; se manca, dalla squadra gia' presente nell'app; altrimenti un blu neutro
export function useTeamColors() {
  const { data } = useAsync(() => loadColors(), []);
  const { data: d2 } = useAsync(() => loadColors2(), []);
  return useMemo(() => {
    const map = data || {};
    return (id, name) => {
      const fx = fixedColors(name);
      if (fx) return { colors: fx };
      const t = name ? teamByName(name) : null;
      let c = t && t.colors && t.colors[0];
      if (!c || c === '#2C3E66') c = map[String(id)] || c || '#2C3E66';
      const sec = (t && !t.fixedCol && t.colors && t.colors[1] && t.colors[0] === c) ? t.colors[1] : (d2 && d2[String(id)]) || shade(c, 0.55);
      return { colors: [c, sec] };
    };
  }, [data, d2]);
}

const catOfSeasonGroup = (g) => (['Attacco', 'Difesa', 'Disciplina'].includes(g) ? g : 'Gioco');
const PARTS = [{ value: 'tot', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }];
const CATS = [{ value: 'all', label: 'Tutte' }, { value: 'Attacco', label: 'Attacco' }, { value: 'Difesa', label: 'Difesa' }, { value: 'Disciplina', label: 'Disciplina' }, { value: 'Gioco', label: 'Gioco' }];
const hasPlayer = (st, id) => !!(st && st.players && Object.keys(st.players).some((k) => !k.startsWith('_') && (st.players[k] || []).some((r) => String(r[0]) === String(id))));

export const SkCards = ({ C }) => (
  <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 16 }}>
    {[70, 220, 180].map((h, i) => <View key={i} style={{ height: h, borderRadius: 18, backgroundColor: C.skBase }} />)}
  </View>
);
export const Msg = ({ C, children }) => <Text style={{ color: C.ink3, fontSize: 13, textAlign: 'center', paddingVertical: 56, paddingHorizontal: 20 }}>{children}</Text>;

export default function GiocatorePast({ C, id, fm, sk, current = false, teamName = '', openRoute }) {
  const [part, setPart] = useState('tot');
  const [cat, setCat] = useState('all');
  const col = useTeamColors();
  const { data: res, loading } = useAsync(async () => ({ stats: await (part === 'tot' ? loadPlayerStatsFor(fm, sk, id) : statsFromMatches(fm, sk, part)) }), [fm, sk, part, id]);
  const { data: split } = useAsync(async () => hasPlayer(await statsFromMatches(fm, sk), id), [fm, sk, id]);
  // cambiando Totale/Casa/Trasferta restano i numeri di prima (appena piu' chiari) finche' arrivano i nuovi: l'altezza non crolla e la pagina non salta
  const lastRes = useRef(null);
  if (res) lastRes.current = res;
  const shown = res || lastRes.current;
  const stats = shown ? shown.stats : undefined;
  const { data: season } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  if (loading && !stats) return <SkCards C={C} />;
  const lists = stats && playerViewLists(stats, id);
  const pills = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}>
      {split ? <Segmented C={C} options={PARTS} value={part} onChange={setPart} /> : null}
      <Segmented C={C} options={CATS} value={cat} onChange={setCat} />
    </View>
  );
  if (!lists) return <>{pills}<Msg C={C}>Dati non disponibili</Msg></>;
  const names = (season && season.teams) || {};
  const groups = {};
  let me = null;
  Object.keys(lists).forEach((k) => {
    if (k.startsWith('_')) return;
    const list = lists[k];
    const idx = list.findIndex((r) => String(r[0]) === String(id));
    const zero = idx < 0 && list.length > 0 && zeroFor(stats, k, id);
    if (idx < 0 && !zero) return;
    if (idx >= 0) me = me || list[idx];
    const g = groupOf(k.replace(/_team$/, ''));
    if (cat !== 'all' && catOfSeasonGroup(g) !== cat) return;
    (groups[g] = groups[g] || []).push({ k, p90: playerStatIsP90(stats, k), st: zero ? zeroStandingOf(list, k, poolAvg(stats, k, list, id)) : standingOf(list, idx, k, poolAvg(stats, k, list, id)), title: SEASON_STAT_IT[k] || PLAYER_STAT_IT[k] || prettyKey(k) });
  });
  if (!me && Object.keys(groups).length) me = ((stats.players && stats.players.mins_played) || []).find((r) => String(r[0]) === String(id)) || null;
  if (!me) return <>{pills}<Msg C={C}>Dati non disponibili</Msg></>;
  const tid = me[2] || (teamName ? teamIdByName(names, teamName) : null);
  const tname = names[tid] || '';
  const club = col(tid, tname).colors[0];
  const order = Object.keys(groups).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const f2 = (v) => Number(v).toFixed(2).replace('.', ',');
  return (
    <>
      {pills}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 }}>
        <Pressable disabled={!tid || !openRoute} onPress={() => tid && openRoute && openRoute(`/squadra/fm-${tid}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: `${club}2e`, borderWidth: 1, borderColor: `${club}66` }}>
          {tid ? <Image source={{ uri: teamLogo(tid) }} style={{ width: 30, height: 30 }} contentFit="contain" cachePolicy="memory-disk" /> : null}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{tname}</Text>
            <Text style={{ color: C.ink3, fontSize: 11 }}>{current ? 'Stagione attuale' : `Stagione ${seasonLabel(sk)}`}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ color: C.ink, fontSize: 17, fontWeight: '600' }}>{me[5] || 0}</Text><Text style={{ color: C.ink3, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>presenze</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ color: C.ink, fontSize: 17, fontWeight: '600' }}>{me[4] || 0}&apos;</Text><Text style={{ color: C.ink3, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>minuti</Text></View>
        </Pressable>
        {order.map((g) => (
          <Panel key={g} C={C} style={{ borderRadius: 18, backgroundColor: `${club}1c`, borderColor: `${club}55` }}>
            <Text style={{ color: C.ink, fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>{g}</Text>
            {groups[g].map((r, i) => (
              <BarRow key={r.k} C={C} first={i === 0} label={r.title} valueText={r.p90 ? f2(r.st.v) : fmtVal(r.k, r.st.v)} frac={r.st.frac} width={r.st.width} avgPos={r.st.avgPos} avgText={r.p90 ? f2(r.st.avg) : fmtVal(r.k, r.st.avg)} rank={r.st.rank} delay={Math.min(i, 8) * 40} />
            ))}
          </Panel>
        ))}
        <Text style={{ color: C.ink3, fontSize: 10.5, paddingHorizontal: 4 }}>La lineetta con il numero è la media del campionato. Colori: rosso = parte bassa della classifica, giallo = metà, verde = parte alta.</Text>
      </View>
    </>
  );
}
