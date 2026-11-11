// Squadra: scheda Partite. Stagione in corso (partite dell'app + calendari d'archivio) o stagione passata dall'archivio, a gruppi per competizione.
import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import useAsync from '@/hooks/useAsync';
import { useArchAny } from '@/hooks/useArchFresh';
import { allTeamMatches } from '@/data/extras';
import { teamCompetitions } from '@/data/competitions';
import { teamHistory, teamFmId } from '@/data/teamIndex';
import { FM_ID, loadSeason, teamIdByName, archIndex } from '@/data/archive';
import { leagueById, leagueTint } from '@/data/leagues';
import { teamById } from '@/data/teams';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';
import { Segmented, LeagueLogo } from '../shared/ui';
import { useSel } from '../shared/hooks';
import { useTeamView, useAnnounceComp, curSkOf } from '../shared/teamView';
import CompBarN from '../shared/CompBarN';
import PaneN from '../shared/PaneN';
import { PanelSkN } from '../shared/TabsN';
import { MatchRowN, ArchRowN } from '../shared/MatchRowsN';
import { fmtDate, dayKey } from '../shared/fmt';

const CUP_FMS = [42, 73, 10216];
const LID_BY_FM = Object.fromEntries(Object.entries(FM_ID).map(([k, v]) => [v, k]));
const FILTERS = [{ value: 'all', label: 'Tutte' }, { value: 'results', label: 'Risultati' }, { value: 'upcoming', label: 'Programmate' }];

const fmsFor = (team, comp) => (comp === 'all' ? [...new Set([FM_ID[team.leagueId], ...CUP_FMS].filter(Boolean))] : [FM_ID[comp]].filter(Boolean));
const dayHeadLive = (iso) => {
  const idx = DATES.findIndex((d) => isoDate(d) === iso);
  return idx >= 0 ? dayLabel(DATES[idx], TODAY_INDEX, idx) : longDate(new Date(`${iso}T12:00:00`));
};

// Partite consecutive della stessa competizione: un riquadro a pillola per gruppo, col colore della competizione
function Pills({ C, items, row, dayHead }) {
  const { data: idx } = useAsync(() => archIndex(), []);
  const groups = [];
  items.forEach((it) => {
    const g = groups[groups.length - 1];
    const gk = it.lid || (it.fm ? `fm-${it.fm}` : '');
    if (g && g.gk === gk) g.items.push(it); else groups.push({ gk, lid: it.lid, fm: it.fm || FM_ID[it.lid], items: [it] });
  });
  return (
    <View>
      {groups.map((g, gi) => {
        // competizione non in elenco (coppe e campionati d'archivio): logo FotMob (chiaro/scuro) e nome dall'indice, mai intestazione vuota
        const ix = idx && g.fm ? idx[String(g.fm)] : null;
        const lg = leagueById(g.lid) || (g.fm ? { id: `fm-${g.fm}`, name: (ix && ix.n) || '', logo: `https://images.fotmob.com/image_resources/logo/leaguelogo/${g.fm}.png`, logoDark: `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${g.fm}.png` } : null);
        const tint = leagueTint(g.lid);
        return (
          <View key={`${g.gk}-${gi}-${g.items[0].key}`} style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: `${tint}55` }}>
            <LinearGradient pointerEvents="none" colors={[`${tint}45`, `${tint}08`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
              {lg ? <LeagueLogo league={lg} size={20} C={C} /> : null}
              <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{lg ? lg.name : ''}</Text>
              <Text style={{ color: C.ink3, fontSize: 11 }}>{g.items.length}</Text>
            </View>
            {g.items.map((it, i) => (
              <View key={it.key}>
                {i === 0 || it.day !== g.items[i - 1].day ? <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2, borderTopWidth: 1, borderTopColor: C.hair }}>{dayHead(it.day)}</Text> : null}
                {row(it)}
              </View>
            ))}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </View>
  );
}

const Msg = ({ C, children }) => <Text style={{ color: C.ink3, fontSize: 13, textAlign: 'center', paddingVertical: 56, paddingHorizontal: 20 }}>{children}</Text>;

function PastSeason({ C, team, comp, sk, filter, openRoute }) {
  const { data, loading } = useAsync(async () => {
    const out = [];
    for (const fm of fmsFor(team, comp)) {
      const s = await loadSeason(fm, sk);
      if (!s || !s.teams) continue;
      const tid = teamIdByName(s.teams, team.name);
      if (!tid) continue;
      (s.fix || []).forEach((m) => {
        if (String(m[2]) !== String(tid) && String(m[3]) !== String(tid)) return;
        out.push({ key: `${fm}-${m[0]}`, day: dayKey(m[4]), date: String(m[4]), lid: LID_BY_FM[fm], fm, m, s, names: s.teams, tid, played: !!m[6] });
      });
    }
    return out;
  }, [team.name, comp, sk]);
  const ver = useArchAny();
  const list = useMemo(() => {
    const rows = new Map();
    const now = (it) => {
      if (!rows.has(it.s)) rows.set(it.s, new Map((it.s.fix || []).map((m) => [m[0], m])));
      const m = rows.get(it.s).get(it.m[0]) || it.m;
      return m === it.m ? it : { ...it, m, played: !!m[6] };
    };
    const l = (data || []).map(now).filter((it) => (filter === 'all' ? true : filter === 'results' ? it.played : !it.played));
    return l.sort((a, b) => (filter === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [data, filter, ver]);
  if (loading) return <PanelSkN C={C} />;
  if (!list.length) return <Msg C={C}>Nessuna partita</Msg>;
  return <Pills C={C} items={list} dayHead={(d) => fmtDate(d)} row={(it) => <ArchRowN C={C} m={it.m} names={it.names} fm={it.fm} sk={sk} tid={it.tid} openRoute={openRoute} />} />;
}

// partite della stagione in corso che non sono in memoria: tutte le competizioni giocate quest'anno dal calendario archiviato
async function archCurrent(team, comp) {
  await archIndex();
  const hist = (await teamHistory(team)) || {};
  const lids = new Set(Object.keys(hist));
  if (team.leagueId && FM_ID[team.leagueId]) lids.add(team.leagueId);
  const out = [];
  await Promise.all([...lids].map(async (lid) => {
    if (comp !== 'all' && lid !== comp) return;
    const fm = FM_ID[lid];
    const sk = curSkOf(lid);
    if (!fm || !sk || (hist[lid] && !hist[lid].includes(sk) && lid !== team.leagueId)) return;
    const s = await loadSeason(fm, sk).catch(() => null);
    if (!s || !s.teams) return;
    const fid = teamFmId(team);
    const tid = teamIdByName(s.teams, team.name) || (fid && s.teams[String(fid)] ? String(fid) : null);
    if (!tid) return;
    (s.fix || []).forEach((m) => {
      if (String(m[2]) !== String(tid) && String(m[3]) !== String(tid)) return;
      const ts = new Date(m[4]).getTime();
      if (!Number.isFinite(ts)) return;
      out.push({ key: `${fm}-${m[0]}`, day: dayKey(m[4]), ts, lid, a: { m, s, fm, sk, tid } });
    });
  }));
  return out;
}
const doneOf = (it) => (it.a ? !!it.a.m[6] : it.m.status === 'finished');

function CurrentSeason({ C, teamId, comp, filter, openRoute, anchor }) {
  const team = teamById(teamId);
  const { data: arch } = useAsync(() => archCurrent(team, comp).catch(() => []), [teamId, comp]);
  const ver = useArchAny();
  const [more, setMore] = useSel(teamId, `more-${comp}`, false);
  const { list, hidden } = useMemo(() => {
    const mem = allTeamMatches(teamId).filter((m) => comp === 'all' || m.leagueId === comp);
    const days = new Set(mem.map((m) => m.date));
    const rows = new Map();
    const fresh = (it) => {
      if (!rows.has(it.a.s)) rows.set(it.a.s, new Map((it.a.s.fix || []).map((m) => [m[0], m])));
      const m = rows.get(it.a.s).get(it.a.m[0]) || it.a.m;
      return m === it.a.m ? it : { ...it, a: { ...it.a, m } };
    };
    const extra = (arch || []).filter((it) => !days.has(it.day)).map(fresh);
    const all = [...mem.map((m) => ({ key: m.id, day: m.date, ts: m.ts, lid: m.leagueId, m })), ...extra];
    const items = all.filter((it) => (filter === 'all' ? true : filter === 'results' ? doneOf(it) : !doneOf(it)));
    if (filter !== 'all') return { list: items.sort((a, b) => (filter === 'upcoming' ? a.ts - b.ts : b.ts - a.ts)), hidden: 0 };
    items.sort((a, b) => a.ts - b.ts);
    const fi = items.findIndex((it) => !doneOf(it));
    const start = Math.max(0, (fi < 0 ? items.length : fi) - 2);
    return { list: items, hidden: start };
  }, [teamId, comp, filter, arch, ver]);
  if (!list.length && !arch) return <PanelSkN C={C} />;
  if (!list.length) return <Msg C={C}>Nessuna partita</Msg>;
  const shown = filter === 'all' && !more ? list.slice(hidden) : list;
  return (
    <View>
      {filter === 'all' && hidden > 0 && !more ? (
        <Pressable onPress={() => { anchor.on = true; setMore(true); }} style={({ pressed }) => [{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 16, paddingVertical: 8 }, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-up" size={15} color={C.accent} /><Text style={{ color: C.accent, fontSize: 12.5, fontWeight: '800' }}>Partite precedenti ({hidden})</Text>
        </Pressable>
      ) : null}
      <Pills C={C} items={shown} dayHead={dayHeadLive} row={(it) => (it.a ? <ArchRowN C={C} m={it.a.m} names={it.a.s.teams} fm={it.a.fm} sk={it.a.sk} tid={it.a.tid} openRoute={openRoute} /> : <MatchRowN C={C} match={it.m} teamId={teamId} openRoute={openRoute} />)} />
    </View>
  );
}

export default function SquadraPartite({ C, teamId, openRoute, bottom }) {
  const team = teamById(teamId);
  const anchor = useRef({ on: false }).current;
  const [filter, setFilter] = useSel(teamId, 'mf', 'all');
  const { comp, setComp, season: sk, setSeason, comps, seasons, noCur } = useTeamView(team, 'mt', teamCompetitions(teamId), 'all', true);
  const tap = useAnnounceComp(teamId, comp, sk);
  const first = useRef(`${comp}|${sk}|${filter}`);
  const key = `${comp}|${sk}|${filter}`;
  return (
    <PaneN bottom={bottom} anchor={anchor}>
      <CompBarN C={C} comps={comps} comp={comp} allLabel="Tutte le competizioni" onComp={tap(setComp)} seasons={seasons} season={sk} onSeason={tap(setSeason)} noCur={noCur} />
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><Segmented C={C} options={FILTERS} value={filter} onChange={setFilter} /></View>
      <Animated.View key={key} entering={first.current !== key ? FadeIn.duration(220) : undefined}>
        {sk === 'cur' ? <CurrentSeason C={C} teamId={teamId} comp={comp} filter={filter} openRoute={openRoute} anchor={anchor} /> : <PastSeason C={C} team={team} comp={comp} sk={sk} filter={filter} openRoute={openRoute} />}
      </Animated.View>
    </PaneN>
  );
}
