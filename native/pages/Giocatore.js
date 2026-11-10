// Scheda Giocatore nativa (tappa 3): testata, Profilo, Partite, Statistiche, Carriera. Stessi dati e calcoli del sito (@/data, playerCalc).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import './../shared/shim';
import { bootShared } from '../shared/boot';
import { Face, TeamCrest, Panel, PanelTitle, TintProvider } from '../shared/ui';
import EntityBannerN from '../shared/EntityBannerN';
import TabsN from '../shared/TabsN';
import PaneN from '../shared/PaneN';
import { InjuryIconN } from '../shared/Icons';
import Radar from '../shared/Radar';
import { resetSel, presetSel, useSel } from '../shared/hooks';
import useAsync from '@/hooks/useAsync';
import { BASE } from '@/data/load';
import { playerById } from '@/data/players';
import { teamById, teamByName } from '@/data/teams';
import { injuryOf } from '@/data/injuries';
import { rosePlayer } from '@/data/rose';
import { playerFace } from '@/data/archive';
import { parseArchiveId, makeArchivePlayer } from '@/data/archivePlayer';
import { carriereOf, careerByFm, countryIt, flagCode, FOOT, dateLong, ageOf, money, monthIt } from '@/data/carriere';
import { fixedColors } from '@/data/teamColorFix';
import { usePlayerCareer, useBioPid, useArchivePct, usePlayerSeason } from '@/data/playerIndex';
import { resolvePid } from '@/data/playerPid';
import { POS_IT, percentiles, ratingColor } from '@/components/player/playerCalc';
import { comma } from '@/lib/format';
import GiocatoreStat, { playerHasCurStats } from './GiocatoreStat';
import GiocatorePartite, { usePartiteItems } from './GiocatorePartite';

const PS_POS = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF', DM: 'MID', CDM: 'MID', CM: 'MID', AM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID', LW: 'ATT', RW: 'ATT', ST: 'ATT', CF: 'ATT' };
const LBL = { fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const hex = (c, a) => `${c}${a}`;

export const Flag = ({ name, size = 20, C }) => {
  const c = flagCode(name);
  if (!c) return null;
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: C.chip }}><Image source={{ uri: `${BASE}flags/${c}.png` }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" /></View>;
};

// campi del riquadro Informazioni
export function useBio(player) {
  const c0 = carriereOf(player.id) || {};
  const pidB = useBioPid(player);
  const rp = pidB ? rosePlayer(pidB) : null;
  const R = rp ? rp.r : null;
  const { data: cf } = useAsync(() => (pidB && !c0.b ? careerByFm(pidB) : Promise.resolve(null)), [pidB]);
  const c = { ...(R ? { c: R[4], h: R[6], n: R[3] } : {}), ...(cf || {}), ...c0 };
  const age = ageOf(c.b) || (R && R[5]) || null;
  const cells = [
    ['Nazionalità', c.c ? { flag: c.c, text: countryIt(c.c) } : '—'],
    ['Nato il', c.b ? `${dateLong(c.b)}${age ? ` · ${age} anni` : ''}` : age ? `${age} anni` : '—'],
    ['Altezza', c.h ? `${c.h} cm` : '—'],
    ['Piede', FOOT[c.f] || '—'],
    ['Ruolo', POS_IT[player.position] || POS_IT[PS_POS[c.ps]] || (R && POS_IT[R[2]]) || '—'],
    ['Maglia', c.n || player.number || '—'],
  ];
  return { c, cells };
}

function BioCard({ C, player, team }) {
  const { c, cells } = useBio(player);
  const inj = injuryOf(player.id);
  return (
    <View>
      <PanelTitle C={C}>Informazioni</PanelTitle>
      <Panel C={C} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TeamCrest team={team} size={30} C={C} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14.5 }}>{team ? team.name : player.teamName}</Text>
            {c.ce ? <Text style={{ color: C.ink3, fontSize: 11.5 }}>Contratto fino al {dateLong(c.ce)}</Text> : null}
          </View>
        </View>
        {inj ? (
          <View style={{ marginBottom: 16, padding: 12, borderRadius: 14, backgroundColor: hex(C.live, '22'), borderWidth: 1, borderColor: hex(C.live, '55') }}>
            <Text style={{ color: C.live, fontWeight: '800', fontSize: 13 }}>Infortunato</Text>
            <Text style={{ color: C.ink2, fontSize: 12.5, marginTop: 2 }}>{inj.reason}{inj.label ? ` · Rientro previsto: ${inj.label}` : ''}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
          {cells.map(([k, v]) => (
            <View key={k} style={{ width: '50%', paddingRight: 8 }}>
              <Text style={[LBL, { color: C.ink3 }]}>{k}</Text>
              {typeof v === 'object' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}><Flag name={v.flag} C={C} /><Text style={{ color: C.ink, fontSize: 14 }}>{v.text}</Text></View>
              ) : <Text style={{ color: C.ink, fontSize: 14, marginTop: 4 }}>{v}</Text>}
            </View>
          ))}
        </View>
        {c.mv ? (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.chip }}>
            <Text style={[LBL, { color: C.ink3 }]}>Valore di mercato</Text>
            <Text style={{ color: C.gold, fontSize: 17, fontWeight: '600' }}>{money(c.mv)}</Text>
          </View>
        ) : null}
      </Panel>
    </View>
  );
}

function Profilo({ C, player: player0, team }) {
  const player = usePlayerSeason(player0);
  const pc0 = percentiles(player0);
  const ap = useArchivePct(player0, !pc0.some((x) => x.pct !== null));
  const pc = (ap || pc0).filter((x) => x.key !== 'foulsCommitted');
  const colors = team ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const rt = player.rating;
  const frac = Math.max(0, Math.min(1, ((rt || 5) - 5) / 4));
  const rc = rt ? ratingColor(rt) : C.ink3;
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, gap: 24 }}>
      <Panel C={C} style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20 }}>
        <View style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={92} height={92} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
            <Circle cx="50" cy="50" r="44" fill="none" stroke={C.border} strokeWidth="7" />
            <Circle cx="50" cy="50" r="44" fill="none" stroke={rc} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${frac * 276} 276`} transform="rotate(-90 50 50)" />
          </Svg>
          <Text style={{ color: C.ink, fontSize: 26, fontWeight: '300' }}>{rt ? comma(rt, 1) : '—'}</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {[['Pres.', player.appearances], ['Gol', player.goals], ['Assist', player.assists]].map(([k, v]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: C.ink, fontSize: 22, fontWeight: '300' }}>{v ?? 0}</Text>
              <Text style={[LBL, { color: C.ink3 }]}>{k}</Text>
            </View>
          ))}
        </View>
      </Panel>
      <BioCard C={C} player={player} team={team} />
      {pc.some((x) => x.pct !== null) ? (
        <View>
          <PanelTitle C={C}>Profilo di gioco</PanelTitle>
          <Panel C={C} style={{ paddingVertical: 16 }}><Radar C={C} items={pc} color={colors[0]} /></Panel>
        </View>
      ) : null}
    </View>
  );
}

/* ---------- CARRIERA ---------- */
const sumN = (a, b) => (a == null && b == null ? null : (Number(a) || 0) + (Number(b) || 0));
export function mergeConsecutive(rows) {
  const out = [];
  rows.forEach((x) => {
    const last = out[out.length - 1];
    if (last && last.r[0] === x.r[0]) {
      const o = x.r;
      last.r = [last.r[0], o[1] && (!last.r[1] || String(o[1]) < String(last.r[1])) ? o[1] : last.r[1], last.r[2], sumN(last.r[3], o[3]), sumN(last.r[4], o[4]), sumN(last.r[5], o[5]), last.r[6], last.r[7], last.r[8]];
      last.loan = last.loan && x.loan;
      last.n += 1;
    } else out.push({ r: [...x.r], loan: x.loan, from: x.from, n: 1 });
  });
  return out;
}
const natBase = (n) => { let x = String(n || '').trim(); for (let i = 0; i < 3; i++) x = x.replace(/\s*\(?\b(U-?\d{2}|Women|W|Olympic|Olympics|Amateur|B)\b\)?$/i, '').trim(); return x; };

function CareerRows({ C, rows, national }) {
  return (
    <View style={{ gap: 10 }}>
      {rows.map(({ r, loan, from }, i) => {
        const t = teamByName(r[0]);
        const cols = fixedColors(r[0]) || (t && t.colors) || ['#37507a', '#5a7bb0'];
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: hex(cols[0], '30'), borderWidth: 1, borderColor: hex(cols[0], '55') }}>
            {national && flagCode(natBase(r[0])) ? <Flag name={natBase(r[0])} size={30} C={C} /> : <TeamCrest C={C} size={30} team={t || { name: r[0], initials: String(r[0] || '').slice(0, 2).toUpperCase() }} />}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, flexShrink: 1 }}>{r[0]}</Text>
                {loan ? <Text style={{ color: C.ink3, fontSize: 9.5, borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 6 }}>PRESTITO{from ? ` · ${from}` : ''}</Text> : null}
              </View>
              <Text style={{ color: C.ink3, fontSize: 11, marginTop: 2 }}>{monthIt(r[1])}{monthIt(r[1]) ? ' – ' : ''}{r[7] ? 'oggi' : monthIt(r[2])}</Text>
            </View>
            {r[3] != null || r[4] != null || r[5] != null ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[['Pres.', r[3]], ['Gol', r[4]], ['Ass.', r[5]]].map(([k, v]) => (
                  <View key={k} style={{ width: 32, alignItems: 'center' }}>
                    <Text style={{ color: C.ink, fontSize: 14 }}>{v || '0'}</Text>
                    <Text style={[LBL, { color: C.ink3, fontSize: 8 }]}>{k}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// periodi della carriera (senior, nazionale, giovanili); null se non ce ne sono
export function useCareerLists(player) {
  const c = carriereOf(player.id);
  const { data: rec } = useAsync(async () => { const pid = await resolvePid(player); return pid ? careerByFm(pid) : null; }, [player.id]);
  if (rec === undefined && !(c && c.ok)) return undefined;
  const raw = (rec && rec.car && rec.car.length ? rec.car : (c && c.car) || []);
  const now = new Date().toISOString().slice(0, 7);
  const isStub = (r) => (r[3] === null || r[3] === undefined) && (r[1] === r[2] || String(r[1]) > now);
  const senior = mergeConsecutive(raw.map((r, i) => {
    const prev = raw[i + 1]; const next = raw[i - 1];
    const loan = !isStub(r) && prev && next && isStub(prev) && isStub(next) && prev[0] === next[0];
    return { r, loan: !!loan, from: loan ? prev[0] : null };
  }).filter((x) => !isStub(x.r)));
  const plain = (list) => mergeConsecutive((list || []).filter((r) => !isStub(r)).map((r) => ({ r, loan: false, from: null })));
  const youth = plain(rec && rec.yo);
  const nat = plain(rec && rec.nt);
  return { senior, nat, youth, any: !!(senior.length || nat.length || youth.length) };
}

function Carriera({ C, lists }) {
  const T = ({ children }) => <Text style={{ color: C.ink3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 }}>{children}</Text>;
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>
      {lists.senior.length ? <CareerRows C={C} rows={lists.senior} /> : null}
      {lists.nat.length ? <><T>Nazionale</T><CareerRows C={C} rows={lists.nat} national /></> : null}
      {lists.youth.length ? <><T>Giovanili</T><CareerRows C={C} rows={lists.youth} national /></> : null}
    </View>
  );
}

/* ---------- PAGINA ---------- */
const POS = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', WNG: 'Ala', ATT: 'Attaccante' };

function Skel({ C }) {
  const b = (h, w, r = 16) => <View style={{ height: h, width: w || '100%', borderRadius: r, backgroundColor: C.skBase, marginBottom: 14 }} />;
  return <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>{b(84, 84, 42)}<View style={{ flex: 1 }}>{b(22, 160)}{b(12, 110)}{b(14, 200)}</View></View>{b(40)}{b(120)}{b(180)}</View>;
}

const TAB_LBL = { profilo: 'Profilo', partite: 'Partite', stat: 'Statistiche', carriera: 'Carriera' };

function Body({ C, player, openRoute, onBack, bottom, top }) {
  const team = teamById(player.teamId);
  const pid = useBioPid(player);
  const photo = player.photo || (pid ? playerFace(pid) : null);
  const colors = team && team.colors ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const car = usePlayerCareer(player);
  const parts = usePartiteItems(player, car);
  const careerL = useCareerLists(player);
  const hasStats = playerHasCurStats(player) || !!car.loading || car.rows.length > 0;
  const tabs = [['profilo', true], ['partite', parts.has], ['stat', hasStats], ['carriera', !!(careerL && careerL.any)]].filter((t) => t[1]).map((t) => ({ key: t[0], label: TAB_LBL[t[0]] }));
  const [tabKey, setTabKey] = useSel(player.id, 'tab', 'profilo');
  const idx = Math.max(0, tabs.findIndex((t) => t.key === tabKey));
  const inj = injuryOf(player.id);
  const sub = [team ? team.name : player.teamName, POS[player.position] || player.position].filter(Boolean).join(' · ');
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <EntityBannerN C={C} top={top} onBack={onBack} name={player.name} subtitle={sub} colors={colors} photoUrl={photo} nameExtra={inj ? <InjuryIconN size={20} /> : null}
        below={player.rating ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={{ color: C.ink, fontSize: 14, fontWeight: '500' }}>{comma(player.rating, 2)}</Text><Text style={[LBL, { color: C.ink3 }]}>voto stagione</Text></View> : null} />
      <TintProvider color={colors[0]}>
        <TabsN C={C} tabs={tabs} index={idx} onIndex={(i) => setTabKey(tabs[i].key)} render={(i) => {
          const k = tabs[i].key;
          return (
            <PaneN key={k} bottom={bottom}>
              {k === 'profilo' ? <Profilo C={C} player={player} team={team} /> : null}
              {k === 'partite' ? <GiocatorePartite C={C} player={player} parts={parts} openRoute={openRoute} /> : null}
              {k === 'stat' ? <GiocatoreStat C={C} player={player} team={team} car={car} openRoute={openRoute} /> : null}
              {k === 'carriera' && careerL ? <Carriera C={C} lists={careerL} /> : null}
            </PaneN>
          );
        }} />
      </TintProvider>
    </View>
  );
}

export default function Giocatore({ C, top, onBack, bottom = 90, openRoute, params }) {
  const id = params && params.id ? decodeURIComponent(params.id) : null;
  const [st, setSt] = useState('load'); // load | ok | err
  useEffect(() => {
    let live = true;
    setSt('load');
    resetSel(id);
    if (params && params.tab) presetSel(id, 'tab', params.tab);
    if (params && params.sk) { presetSel(id, 'ss', params.sk); if (params.lid) presetSel(id, 'sc', params.lid); }
    (async () => {
      await bootShared();
      const arc = parseArchiveId(id);
      const p = playerById(id);
      if (arc && (!p || p.lite)) await makeArchivePlayer(arc.fm, arc.sk, arc.pid);
      if (live) setSt(playerById(id) ? 'ok' : 'err');
    })().catch(() => { if (live) setSt('err'); });
    return () => { live = false; };
  }, [id]);
  const player = st === 'ok' ? playerById(id) : null;
  useEffect(() => { if (st === 'err') onBack && onBack(); }, [st]);
  if (!player) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ paddingHorizontal: 20, height: 44, justifyContent: 'center' }}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        {st === 'load' ? <Skel C={C} /> : null}
      </View>
    );
  }
  return <Body C={C} player={player} openRoute={openRoute} onBack={onBack} bottom={bottom} top={top} />;
}
