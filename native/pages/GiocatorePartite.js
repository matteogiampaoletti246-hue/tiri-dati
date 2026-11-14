// Partite del giocatore (nativo): un'unica lista dalla piu' recente, con la competizione di ognuna; le stagioni si caricano a gruppi scorrendo.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { TeamCrest, LeagueLogo } from '../shared/ui';
import Dropdown from '../shared/Dropdown';
import { onNearEnd } from '../shared/hooks';
import { BallIcon, BootIcon } from '../shared/Icons';
import { RAW } from '@/data/load';
import { leagueById } from '@/data/leagues';
import { teamByName } from '@/data/teams';
import { matchTint } from '@/data/matchTint';
import { carriereOf } from '@/data/carriere';
import { loadSeason, loadSeasonStats, loadSeasonMatches, seasonLabel, teamLogo, LID_BY_FM } from '@/data/archive';
import { dateIt, ratingColor } from '@/components/player/playerCalc';
import { comma } from '@/lib/format';
import { lruGet, lruSet } from '@/lib/lru';

const yearOf = (sk) => parseInt(String(sk).slice(0, 4), 10) || 0;
const romeDayOf = (iso) => { try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); } };
export const ownFirst = (score, home) => {
  const m = String(score || '').match(/^(\d+)\s*-\s*(\d+)(.*)$/);
  if (!m) return score || '';
  return home ? `${m[1]} - ${m[2]}${m[3]}` : `${m[2]} - ${m[1]}${m[3]}`;
};

// partite giocate (minuti > 0) in una competizione e stagione dell'archivio.
// Le statistiche di stagione servono solo come ultima risorsa per sapere se giocava in casa: si caricano solo se manca altro (prima si aspettava sempre il file).
async function seasonRows0(fm, sk, fmPid) {
  const [s, det] = await Promise.all([loadSeason(fm, sk), loadSeasonMatches(fm, sk)]);
  if (!s || !det) return [];
  const fx = {};
  s.fix.forEach((m) => { fx[m[0]] = m; });
  const rows = [];
  const later = [];
  const build = (mid, x, f, p, home, hid, aid) => {
    const opp = home ? aid : hid;
    const date = f ? f[4] : '';
    return { key: `a-${fm}-${sk}-${mid}`, to: `/match/a-${fm}-${sk}-${mid}`, day: date ? romeDayOf(date) : '', date, fm, sk, oppId: opp, oppName: s.teams[opp] || '', score: f ? ownFirst(f[5], home) : '', minutes: Math.round(p.minutes_played), goals: p.goals || 0, assists: p.goal_assist || p.assists || 0, rating: p.rating_title || null };
  };
  Object.entries(det.m || {}).forEach(([mid, x]) => {
    const p = x.p && x.p[fmPid];
    if (!p || !(p.minutes_played > 0)) return;
    const f = fx[mid];
    const hid = String((x.h && x.h.id) || (f && f[2]) || '');
    const aid = String((x.a && x.a.id) || (f && f[3]) || '');
    const inH = x.h && [...(x.h.st || []), ...(x.h.sb || [])].some((r) => String(r[0]) === String(fmPid));
    const inA = x.a && [...(x.a.st || []), ...(x.a.sb || [])].some((r) => String(r[0]) === String(fmPid));
    const side = x.pn && x.pn[fmPid] ? x.pn[fmPid][1] : null;
    if (inH || inA || side) rows.push(build(mid, x, f, p, inH ? true : inA ? false : side === 'h', hid, aid));
    else { const i = rows.length; rows.push(null); later.push([i, mid, x, f, p, hid, aid]); }
  });
  if (later.length) {
    const st = await loadSeasonStats(fm, sk).catch(() => null);
    let myTeam = null;
    const lists = (st && st.players) || {};
    Object.keys(lists).some((k) => { const r = (lists[k] || []).find((y) => String(y[0]) === String(fmPid)); if (r) { myTeam = String(r[2]); return true; } return false; });
    later.forEach(([i, mid, x, f, p, hid, aid]) => { rows[i] = build(mid, x, f, p, myTeam ? myTeam === hid : false, hid, aid); });
  }
  return rows;
}

// una sola lettura per giocatore/stagione: la scheda Partite trova gia' pronto cio' che si e' caricato in anticipo all'apertura del giocatore
const SR = new Map();
function seasonRows(fm, sk, fmPid) {
  const k = `${fm}|${sk}|${fmPid}`;
  const hit = lruGet(SR, k);
  if (hit) return hit;
  const pr = seasonRows0(fm, sk, fmPid).catch(() => { SR.delete(k); return []; });
  lruSet(SR, k, pr, 24);
  return pr;
}

// precarico (all'apertura del giocatore, a pagina ferma): l'ultimo gruppo di stagioni, quello che la scheda Partite mostra per primo
export function prefetchPartite(P) {
  if (!P || !P.fmPid || !P.items.length) return;
  const y = Math.max(...P.items.map(([, sk]) => yearOf(sk)));
  P.items.filter(([, sk]) => yearOf(sk) === y).forEach(([fm, sk]) => { seasonRows(fm, sk, P.fmPid); });
}

// competizioni/stagioni giocate + ultime partite dell'app (aurora_indice, con la partita dal vivo)
export function usePartiteItems(player, car) {
  const fmPid = car.pid || (carriereOf(player.id) || {}).fm;
  const items = car.rows.filter((r) => leagueById(LID_BY_FM[r[0]])).map((r) => [r[0], r[1]]);
  const IM = {};
  ((RAW.indice && RAW.indice.m) || []).forEach((m) => { IM[m[0]] = m; });
  const recent = (player.recent || []).filter((m) => m.matchId).map((m) => ({
    key: `r-${m.matchId}`, to: `/match/${m.matchId}`, day: String(m.date || '').slice(0, 10), date: m.date, dateText: dateIt(m.date),
    league: IM[m.matchId] ? leagueById(IM[m.matchId][1]) : null, score: IM[m.matchId] && IM[m.matchId][5] != null ? ownFirst(`${IM[m.matchId][5]} - ${IM[m.matchId][6]}`, m.home) : '',
    oppTeam: teamByName(m.opp), oppName: m.opp, minutes: m.minutes, goals: m.goals, assists: m.assists, rating: m.rating,
  }));
  return { has: !!(recent.length || (fmPid && items.length)), items: fmPid ? items : [], fmPid, recent };
}

// stagione calcistica (luglio-giugno) di una data: anno d'inizio. I tornei in anno solare (Europei, Mondiali, amichevoli) cadono cosi' nella stagione giusta
const seasonOfDate = (iso) => { const d = new Date(iso); if (isNaN(d)) return 0; const y = d.getUTCFullYear(); return d.getUTCMonth() >= 6 ? y : y - 1; };
const candSeasons = (sk) => (String(sk).includes('/') || String(sk).includes('-') ? [yearOf(sk)] : [yearOf(sk) - 1, yearOf(sk)]);
const spanLabel = (y) => `${y}/${y + 1}`;

export default function GiocatorePartite({ C, parts: P, openRoute }) {
  const [comp, setComp] = useState('all');
  const [season, setSeason] = useState('all');
  const filtered = comp !== 'all' || season !== 'all';
  const cache = useRef(new Map());
  const [, setVer] = useState(0);
  const [busy, setBusy] = useState(false);
  const live = useRef(true);
  const got0 = useRef([]);
  const [late, setLate] = useState(false); // lo scheletro dura al massimo 2,5 s: poi le partite compaiono man mano che arrivano
  const compOpts = [{ value: 'all', label: 'Tutte le competizioni' }];
  const seenC = new Set();
  P.items.forEach(([fm]) => { const lg = leagueById(LID_BY_FM[fm]); if (lg && !seenC.has(lg.id)) { seenC.add(lg.id); compOpts.push({ value: lg.id, label: lg.name, icon: <LeagueLogo league={lg} size={22} C={C} /> }); } });
  const seasonOpts = [{ value: 'all', label: 'Tutte le stagioni' }];
  const ys = new Set();
  const nowY = seasonOfDate(new Date().toISOString());
  P.items.filter(([fm]) => comp === 'all' || LID_BY_FM[fm] === comp).forEach(([, sk]) => candSeasons(sk).forEach((y) => { if (y <= nowY) ys.add(y); }));
  [...ys].sort((x, y) => y - x).forEach((y) => seasonOpts.push({ value: String(y), label: spanLabel(y) }));
  const its = P.items.filter(([fm, sk]) => (comp === 'all' || LID_BY_FM[fm] === comp) && (season === 'all' || candSeasons(sk).includes(Number(season))));
  const itsRef = useRef(its);
  itsRef.current = its;
  const more = async () => {
    if (busy) return;
    const todo = itsRef.current.filter(([fm, sk]) => !cache.current.has(`${fm}|${sk}`));
    if (!todo.length) return;
    // le due stagioni piu' recenti insieme (la prima volta la lista e' corta e le serve di solito il secondo gruppo)
    const ysAll = [...new Set(todo.map(([, sk]) => yearOf(sk)))].sort((x, z) => z - x).slice(0, got0.current.length < 8 ? 2 : 1);
    const grp = todo.filter(([, sk]) => ysAll.includes(yearOf(sk)));
    setBusy(true);
    const res = await Promise.all(grp.map(([fm, sk]) => seasonRows(fm, sk, P.fmPid).catch(() => [])));
    if (!live.current) return;
    grp.forEach(([fm, sk], i) => cache.current.set(`${fm}|${sk}`, res[i]));
    setBusy(false);
    setVer((v) => v + 1);
  };
  const moreRef = useRef(more);
  moreRef.current = more;
  useEffect(() => { live.current = true; const off = onNearEnd(() => { if (!filtered) moreRef.current(); }); return () => { live.current = false; off(); }; }, [filtered]);
  const got = its.flatMap(([fm, sk]) => cache.current.get(`${fm}|${sk}`) || []);
  got0.current = got;
  const pending = its.some(([fm, sk]) => !cache.current.has(`${fm}|${sk}`));
  // senza filtro: finche' la lista e' corta si carica il gruppo dopo; con un filtro si caricano tutte le partite scelte
  useEffect(() => { if (!busy && pending && (filtered || got.length < 8)) moreRef.current(); });
  const recentSel = P.recent.filter((r) => (comp === 'all' || (r.league && r.league.id === comp)) && (season === 'all' || seasonOfDate(r.date) === Number(season)));
  const recentDays = new Set(recentSel.map((r) => r.day).filter(Boolean));
  const seen = new Set();
  const all = [...recentSel, ...got.filter((r) => !recentDays.has(r.day) && (season === 'all' || seasonOfDate(r.date) === Number(season)))]
    .filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)))
    .sort((a, b) => b.day.localeCompare(a.day) || String(b.date).localeCompare(String(a.date)));
  const waiting = busy || (filtered && pending);
  useEffect(() => { if (!waiting) { setLate(false); return undefined; } const t = setTimeout(() => setLate(true), 2500); return () => clearTimeout(t); }, [waiting]);
  const sk = (h, w) => <View style={{ height: h, width: w || '100%', borderRadius: 16, backgroundColor: C.skBase, marginBottom: 10 }} />;
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <Dropdown C={C} options={compOpts} value={comp} onChange={(v) => { setComp(v); setSeason('all'); }} side="left" width={260} fill style={{ flex: 1.3 }} icon={(o) => o.icon || null} />
        <Dropdown C={C} options={seasonOpts} value={season} onChange={setSeason} side="right" width={190} fill style={{ flex: 1 }} />
      </View>
      {all.map((m) => {
        const lg = m.league || leagueById(LID_BY_FM[Number(m.fm)]);
        const tint = lg ? matchTint(lg.id, lg) : null;
        return (
          <Pressable key={m.key} onPress={() => openRoute && openRoute(m.to)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: tint ? `${tint}22` : C.card2, borderWidth: 1.5, borderColor: tint ? `${tint}D0` : C.border }}>
            {m.oppTeam ? <TeamCrest team={m.oppTeam} size={26} C={C} /> : m.oppId ? <Image source={{ uri: teamLogo(m.oppId) }} style={{ width: 26, height: 26 }} contentFit="contain" cachePolicy="memory-disk" /> : <View style={{ width: 26 }} />}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5 }}>vs {m.oppName || ''}{m.score ? <Text style={{ color: C.ink3 }}>  {m.score}</Text> : null}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {lg ? <><LeagueLogo league={lg} size={12} C={C} /><Text numberOfLines={1} style={{ color: C.ink3, fontSize: 11, flexShrink: 1 }}>{lg.name} ·</Text></> : null}
                <Text style={{ color: C.ink3, fontSize: 11 }}>{m.dateText || dateIt(m.date)} · {m.minutes}&apos;</Text>
                {m.goals ? <><BallIcon size={12} /><Text style={{ color: C.ink3, fontSize: 11 }}>{m.goals}</Text></> : null}
                {m.assists ? <><BootIcon size={12} /><Text style={{ color: C.ink3, fontSize: 11 }}>{m.assists}</Text></> : null}
              </View>
            </View>
            {m.rating ? <View style={{ minWidth: 36, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ratingColor(Number(m.rating)) }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{comma(Number(m.rating), 1)}</Text></View> : null}
          </Pressable>
        );
      })}
      {waiting && !late ? <>{sk(64)}{sk(64)}{sk(64)}</> : null}
    </View>
  );
}
