// Statistiche del giocatore (nativo): competizione e stagione, Affidabilita' prossima partita, classifica per ruolo, gruppi con barre e media.
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import useAsync from '@/hooks/useAsync';
import { Panel, Segmented, DropBtn, LeagueLogo, TeamCrest } from '../shared/ui';
import SwapN from '../shared/SwapN';
import { useUpcoming } from '../shared/useUpcoming';
import Dropdown from '../shared/Dropdown';
import StatIconN from '../shared/StatIconN';
import { scoreColorSmooth } from '@/lib/calc';
import { useSel } from '../shared/hooks';
import GiocatorePast, { SkCards, Msg } from './GiocatorePast';
import { comma } from '@/lib/format';
import { POS_PL, rankOf, statValue, roleAverage, standing, bandColor, GROUPS } from '@/components/player/playerCalc';
import { per90, EX_COLS } from '@/data/players';
import { nextMatchOf } from '@/data/extras';
import { NATIONS_KEYS } from '@/data/calcData';
import { playerReliability, loadPlayerFouls, TOP_STATS, isFoulStat } from '@/data/topPlayers';
import { teamById } from '@/data/teams';
import { teamCompetitions } from '@/data/competitions';
import { leagueById } from '@/data/leagues';
import { carriereOf } from '@/data/carriere';
import { currentSeason, loadPlayerStatsFor, sortSeasons, seasonLabel, pastSeasons, playerSeasons, teamSeasons, FM_ID, LID_BY_FM } from '@/data/archive';

export const playerHasCurStats = (p) => !!p && ((p.appearances || 0) > 0 || (p.minutes || 0) > 0 || !!(p.c && p.c[0]))
  && (teamCompetitions(p.teamId).length > 0 || !!(p.archive && p.leagueId) || !!p.domFm || !!p.natView);

const f1 = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : comma(Math.round(v * 10 ** d) / 10 ** d, d));
const REL_LINES = [['Over 0,5', 0.5], ['Over 1,5', 1.5], ['Over 2,5', 2.5]];
const LBL = { fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' };

function useSeasonList(fm, pid) {
  const { data } = useAsync(() => (fm ? (pid ? playerSeasons(fm, pid) : pastSeasons(fm)) : Promise.resolve([])), [fm, pid]);
  return data || [];
}

function Affidabilita({ C, player: club, comp }) {
  const player = club.natView && NATIONS_KEYS.includes(comp) ? club.natView : club;
  const [stat, setStat] = useState('tiri');
  const [fouls, setFouls] = useState(null);
  const next = nextMatchOf(player.teamId, comp);
  useUpcoming(!next && String(comp || '').startsWith('fm-'));
  const opp = next ? teamById(next.homeId === player.teamId ? next.awayId : next.homeId) : null;
  const isF = isFoulStat(stat);
  const fk = next ? `${player.id}|${next.date}|${stat}` : '';
  useEffect(() => {
    if (!isF || !next) return undefined;
    let on = true;
    loadPlayerFouls(player, next.date, REL_LINES.map((x) => x[1]), stat).then((v) => { if (on) setFouls({ k: fk, v }); });
    return () => { on = false; };
  }, [fk, isF]); // eslint-disable-line
  const vals = REL_LINES.map(([, ln], i) => {
    if (!next) return null;
    if (isF) return fouls && fouls.k === fk ? fouls.v[i] : undefined;
    const r = playerReliability(player, next.date, ln, true, stat === 'porta' ? 'inPorta' : 'totali');
    return r ? r.voto : null;
  });
  if (!next) return null;
  return (
    <Panel C={C} style={{ borderRadius: 18, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text style={{ color: C.ink, fontSize: 13.5, fontWeight: '600', flex: 1 }}>Affidabilità prossima partita</Text>
        {opp ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: C.ink2, fontSize: 12 }}>VS</Text><TeamCrest team={opp} size={18} C={C} /><Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12, maxWidth: 110 }}>{opp.name}</Text></View> : null}
      </View>
      <View style={{ marginBottom: 12, flexDirection: 'row' }}><Dropdown C={C} options={TOP_STATS} value={stat} onChange={setStat} side="right" width={222} fill style={{ flex: 1 }} icon={(o, col) => <StatIconN k={o.icon} size={17} color={col} />} /></View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {REL_LINES.map(([k], i) => {
          const v = vals[i];
          return (
            <View key={k} style={{ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: C.chip }}>
              <Text style={{ color: typeof v === 'number' ? scoreColorSmooth(v) : C.ink3, fontSize: 22, fontWeight: '600' }}>{typeof v === 'number' ? comma(v, 2) : v === undefined ? ' ' : '—'}</Text>
              <Text style={[LBL, { color: C.ink3 }]}>{k}</Text>
            </View>
          );
        })}
      </View>
    </Panel>
  );
}

function RankRow({ C, x }) {
  const col = bandColor(x.r.frac);
  const w = Math.max(4, x.r.frac * 100);
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ flex: 1, color: C.ink2, fontSize: 12.5 }}>{x.label}</Text>
        <Text style={{ width: 52, textAlign: 'right', color: C.ink3, fontSize: 13 }}>{comma(x.v, 2)}</Text>
        <Text style={{ color: col, backgroundColor: `${col}26`, paddingHorizontal: 9, paddingVertical: 1, borderRadius: 99, overflow: 'hidden', fontSize: 14, fontWeight: '600' }}>{x.r.rank}° <Text style={{ fontSize: 10.5, fontWeight: '400', color: C.ink3 }}>su {x.r.of}</Text></Text>
      </View>
      <View style={{ marginTop: 8, height: 8, borderRadius: 99, backgroundColor: C.border }}><View style={{ height: '100%', width: `${w}%`, borderRadius: 99, backgroundColor: col }} /></View>
    </View>
  );
}

function StatRow({ C, player, row, i }) {
  const s = statValue(player, row);
  const l = statValue(player, row, true);
  if (s === null && l === null) return null;
  const pct = row[2] === 'pct';
  const ref = roleAverage(player, row);
  const fmt = (v) => (v === null ? '–' : pct ? `${Math.round(v)}%` : f1(v, v < 10 ? 2 : 1));
  const top = ref ? Math.max(ref.p95 || 0, ref.avg * 1.6, s || 0, 0.0001) : null;
  const frac = ref && s !== null ? standing(player, row, s) : null;
  const col = bandColor(frac);
  const barW = ref && s !== null ? Math.max(2, Math.min(100, (s / top) * 100)) : 0;
  const avgX = ref ? Math.min(100, (ref.avg / top) * 100) : 0;
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ flex: 1, color: C.ink2, fontSize: 12.5 }}>{row[1]}</Text>
        <Text style={frac !== null ? { color: col, backgroundColor: `${col}26`, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 99, overflow: 'hidden', fontSize: 14, fontWeight: '600' } : { color: C.ink, fontSize: 14, fontWeight: '600' }}>{fmt(s)}</Text>
        <Text style={{ width: 52, textAlign: 'right', color: C.ink3, fontSize: 13 }}>{fmt(l)}</Text>
      </View>
      {ref && s !== null ? (
        <View style={{ marginTop: 20, height: 9 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 99, backgroundColor: C.border, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${barW}%`, borderRadius: 99, backgroundColor: col }} />
          </View>
          <View style={{ position: 'absolute', left: `${avgX}%`, top: -5, bottom: -5, width: 2, marginLeft: -1, justifyContent: 'space-between', opacity: 0.85 }}>{[0, 1, 2].map((k) => <View key={k} style={{ width: 2, height: 4, backgroundColor: C.ink }} />)}</View>
          <View style={{ position: 'absolute', left: `${Math.min(88, Math.max(12, avgX))}%`, top: -20, transform: [{ translateX: -24 }], width: 48, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 9.5, fontWeight: '700', backgroundColor: C.chip, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }}>{fmt(ref.avg)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Group({ C, title, children }) {
  return (
    <Panel C={C} style={{ borderRadius: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <Text style={{ flex: 1, color: C.ink, fontSize: 14, fontWeight: '600' }}>{title}</Text>
        <Text style={[LBL, { width: 64, textAlign: 'right', color: C.ink3, fontSize: 9.5 }]}>Stagione</Text>
        <Text style={[LBL, { width: 52, textAlign: 'right', color: C.ink3, fontSize: 9.5 }]}>Ultime 5</Text>
      </View>
      {children}
    </Panel>
  );
}

function CupSummary({ C, p }) {
  const c = p.c || [0, 0, 0, 0];
  const g = c[0] || 0;
  const mn = c[3] || 0;
  const p90 = (v) => (mn > 0 ? comma((v * 90) / mn, 2) : '–');
  const rows = [['Partite giocate', g], ['Minuti', Math.round(mn)], ['Tiri totali', Math.round(c[1] || 0)], ['Tiri in porta', Math.round(c[2] || 0)], ["Tiri ogni 90'", p90(c[1] || 0)], ["Tiri in porta ogni 90'", p90(c[2] || 0)]];
  if (!g) return null;
  return (
    <Panel C={C} style={{ borderRadius: 18 }}>
      <Text style={{ color: C.ink, fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>Statistiche della competizione</Text>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border }}>
          <Text style={{ color: C.ink2, fontSize: 12.5, flex: 1 }}>{k}</Text><Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{v}</Text>
        </View>
      ))}
    </Panel>
  );
}

function CupCurrent({ C, p, fm, fmPid, team, openRoute }) {
  const { data, loading } = useAsync(async () => {
    const sk = await currentSeason(fm);
    const st = sk ? await loadPlayerStatsFor(fm, sk, fmPid) : null;
    return { sk, st };
  }, [fm, fmPid]);
  if (loading && !data) return <SkCards C={C} />;
  if (data && data.sk && data.st && fmPid) return <GiocatorePast C={C} id={fmPid} fm={fm} sk={data.sk} current teamName={team && team.name} openRoute={openRoute} />;
  if (!(p.c && p.c[0])) return null;
  return <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}><CupSummary C={C} p={p} /></View>;
}

export default function GiocatoreStat({ C, player: p, team, car, openRoute }) {
  const natLg = p.natView ? leagueById(p.natView.leagueId) : null;
  const baseComps = (() => {
    const c = teamCompetitions(p.teamId);
    const l = p.archive && p.leagueId ? leagueById(p.leagueId) : p.domFm ? leagueById(LID_BY_FM[p.domFm]) : null;
    const b = l ? [l, ...c.filter((x) => x.id !== l.id)] : c;
    return natLg && !b.some((x) => x.id === natLg.id) ? [...b, natLg] : b;
  })();
  const hasCurApp = (p.appearances || 0) > 0 || (p.minutes || 0) > 0;
  const withData = (id, i) => i === 0 || !!(car.bySeason[id] && car.bySeason[id].length) || (baseComps.some((c) => c.id === id) && !!(p.c && p.c[0]));
  const comps = [...baseComps, ...car.order.filter((id) => !baseComps.some((c) => c.id === id)).map(leagueById).filter(Boolean)]
    .filter((c, i) => car.loading || withData(c.id, i) || (natLg && c.id === natLg.id));
  const [comp, setComp] = useSel(p.id, 'sc', comps.length ? comps[0].id : null);
  const [season, setSeason] = useSel(p.id, 'ss', () => (p.archive ? p.sk : 'cur'));
  const fmL = FM_ID[comp];
  const fmPid = car.pid || (carriereOf(p.id) || {}).fm;
  const inBase = baseComps.some((c) => c.id === comp);
  const idxSeasons = car.bySeason[comp];
  const oldSeasons = useSeasonList(idxSeasons || car.loading ? null : fmL, fmPid);
  const seasons = idxSeasons ? sortSeasons(idxSeasons).filter((s) => !inBase || p.archive || s !== car.cur[fmL]) : oldSeasons;
  const noCur = !!p.archive || !inBase;
  const seasonEff = noCur && season === 'cur' ? (seasons[0] || null) : season;
  const dom = comps.length ? comps[0].id : null;
  const rk = [['goals', 'Gol'], ['assists', 'Assist'], ['shots', 'Tiri'], ['shotsOnTarget', 'Tiri in porta'], ['xg', 'xG'], ['foulsDrawn', 'Falli subiti']]
    .map(([k, label]) => ({ k, label, r: rankOf(p, k), v: per90(p[k] || 0, p.minutes) })).filter((x) => x.r);
  const exv = (k, last) => { const arr = last ? p.exL5 : p.exS; const i = EX_COLS.indexOf(k); return arr && i >= 0 ? arr[i] : null; };
  const mpp = (m, g) => (g ? Math.round(m / g) : null);
  const gen = [
    ['Partite giocate', p.appearances, p.l5g], ['Gol', p.goals, exv('goals', true)], ['Assist', p.assists, exv('assists', true)],
    ['Minuti a partita', mpp(p.minutes, p.appearances) === null ? '–' : `${mpp(p.minutes, p.appearances)}'`, mpp(p.l5min, p.l5g) === null ? '–' : `${mpp(p.l5min, p.l5g)}'`],
  ];
  const disc = [['Gialli', p.yellows, p.l5y], ['Rossi', p.reds, p.l5r]];
  const simple = (rows) => rows.map(([k, v, l], i) => (
    <View key={k} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
      <Text style={{ flex: 1, color: C.ink2, fontSize: 12.5 }}>{k}</Text>
      <Text style={{ width: 64, textAlign: 'right', color: C.ink, fontSize: 14, fontWeight: '600' }}>{v ?? '–'}</Text>
      <Text style={{ width: 52, textAlign: 'right', color: C.ink3, fontSize: 13 }}>{l ?? '–'}</Text>
    </View>
  ));
  const isGk = p.position === 'GK';
  const mk = (rows) => rows.map((r, i) => <StatRow key={r[0] + r[2] + i} C={C} player={p} row={r} i={i} />);
  const gShots = [['total_shots', "Tiri ogni 90'", 'p90'], ['ShotsOnTarget', "Tiri in porta ogni 90'", 'p90']];
  const gDisc = [['fouls', "Falli commessi ogni 90'", 'p90', 1], ['was_fouled', "Falli subiti ogni 90'", 'p90'], ['Offsides', "Fuorigioco ogni 90'", 'p90', 1]];
  const seasonOpts = (fmPid ? (p.archive && p.sk && comp === p.leagueId && !seasons.includes(p.sk) ? [p.sk, ...seasons] : seasons) : []);
  const sOpts = seasonOpts.length ? [...(noCur ? [] : [{ value: 'cur', label: 'Stagione attuale' }]), ...seasonOpts.map((s) => ({ value: s, label: seasonLabel(s) }))] : null;
  const curLg = leagueById(comp);
  const sLabel = sOpts ? (sOpts.find((o) => o.value === (seasonEff || 'cur')) || sOpts[0]).label : '';
  const curFm = fmL && fmPid && car.cur[fmL] && (car.bySeason[comp] || []).includes(car.cur[fmL]);

  let body;
  if (noCur && !seasonEff) body = <Msg C={C}>Dati non disponibili</Msg>;
  else if (seasonEff && seasonEff !== 'cur' && fmL && fmPid) body = <GiocatorePast key={`${comp}-${seasonEff}`} C={C} id={fmPid} fm={fmL} sk={seasonEff} teamName={team && team.name} openRoute={openRoute} />;
  else if (curFm) {
    body = (
      <View key={comp}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}><Affidabilita key={comp} C={C} player={p} comp={comp} /></View>
        <GiocatorePast C={C} id={fmPid} fm={fmL} sk={car.cur[fmL]} current teamName={team && team.name} openRoute={openRoute} />
      </View>
    );
  } else if (car.loading) body = <SkCards C={C} />;
  else if (comp === dom && !hasCurApp) body = <Msg C={C}>Dati non disponibili</Msg>;
  else {
    body = (
      <View key={comp}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}><Affidabilita key={comp} C={C} player={p} comp={comp} /></View>
        {comp !== dom ? <CupCurrent C={C} p={p} fm={fmL} fmPid={fmPid} team={team}  openRoute={openRoute} /> : (
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 }}>
            {rk.length ? (
              <Panel C={C} style={{ borderRadius: 18 }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
                  <Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>Classifica per ruolo</Text>
                  <Text style={{ color: C.ink3, fontSize: 10.5, marginTop: 2 }}>Posizione tra {POS_PL[p.position] || 'i giocatori'} del suo campionato (valori ogni 90&apos;)</Text>
                </View>
                {rk.map((x) => <RankRow key={x.k} C={C} x={x} />)}
              </Panel>
            ) : null}
            <Group C={C} title="Generale">{simple(gen)}</Group>
            <Group C={C} title="Tiri">{mk(gShots)}</Group>
            <Group C={C} title="Disciplina">{simple(disc)}{mk(gDisc)}</Group>
            {GROUPS.filter((g) => g.title !== 'Fisico' && (g.gk ? isGk : true)).map((g) => {
              const rows = mk(g.rows).filter(Boolean);
              return rows.length ? <Group key={g.title} C={C} title={g.title}>{rows}</Group> : null;
            })}
            <Text style={{ color: C.ink3, fontSize: 10.5, paddingHorizontal: 4 }}>La lineetta con il numero è la media del campionato per quel ruolo. Colori: rosso = nella parte bassa della classifica, giallo = a metà, verde = nella parte alta.</Text>
          </View>
        )}
      </View>
    );
  }
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        {comps.length ? <DropBtn C={C} title="Competizione" label={curLg ? curLg.name : ''} icon={<LeagueLogo league={curLg} size={24} C={C} />} options={comps.map((c) => ({ value: c.id, label: c.name, icon: <LeagueLogo league={c} size={26} C={C} /> }))} value={comp} onChange={(c) => { setComp(c); setSeason('cur'); }} /> : null}
        {sOpts ? <DropBtn C={C} title="Stagione" label={sLabel} options={sOpts} value={seasonEff || 'cur'} onChange={setSeason} /> : null}
      </View>
      <SwapN k={`${comp}|${seasonEff}`}>{body}</SwapN>
    </View>
  );
}
