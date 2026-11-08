import { BallIcon, BootIcon } from '@/components/match/EventIcons';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/FmImg';
import { loadSeason, loadSeasonStats, loadSeasonMatches, seasonLabel } from '@/data/archive';
import { ArchRow, fmtDate, dayKey } from '@/components/archive/parts';
import { tintGrad } from '@/lib/tint';
import { RatingPill, openPlayerState, pickLineups } from '@/components/player/PlayerTabs';
import { leagueById } from '@/data/leagues';
import { LID_BY_FM } from '@/data/archive';
import Crest from '@/components/Crest';
import LeagueBadge from '@/components/LeagueBadge';
import { PanelSkeleton } from '@/components/PageSkeletons';

// Carica a una a una le stagioni precedenti quando si scorre in fondo all'elenco delle partite.
function useOlder(seasons, build) {
  const [parts, setParts] = useState([]);
  const [busy, setBusy] = useState(false);
  const next = useRef(0);
  const box = useRef(null);
  const done = next.current >= seasons.length && !busy;
  const more = async () => {
    if (busy || next.current >= seasons.length) return;
    setBusy(true);
    const sk = seasons[next.current];
    next.current += 1;
    let res = null;
    try { res = await build(sk); } catch (e) { res = null; }
    setParts((p) => [...p, { sk, res }]);
    setBusy(false);
  };
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) more(); }, { rootMargin: '500px' });
    io.observe(el);
    return () => io.disconnect();
  });
  return { parts, busy, done, box };
}

const Foot = ({ box, busy, done, empty }) => (
  <div ref={box} className={busy ? '' : 'px-5 py-6 text-center text-[11.5px]'} style={{ color: 'var(--ink-3)', minHeight: 40 }}>
    {busy ? <PanelSkeleton top={560} rowH={64} /> : done ? (empty ? 'Nessuna partita precedente' : 'Fine delle partite disponibili') : ''}
  </div>
);

const Head = ({ sk }) => <div className="mb-1 mt-5 px-5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Stagione {seasonLabel(sk)}</div>;

// partite di una squadra nelle stagioni passate (dal calendario archiviato)
export function PastTeamMatches({ fm, seasons, teamName, tint, teamIdByName }) {
  const { parts, busy, done, box } = useOlder(seasons, async (sk) => {
    const s = await loadSeason(fm, sk);
    if (!s) return null;
    const tid = teamIdByName(s.teams, teamName);
    if (!tid) return null;
    const list = s.fix.filter((m) => String(m[2]) === tid || String(m[3]) === tid).sort((a, b) => String(b[4]).localeCompare(String(a[4])));
    return { s, list };
  });
  return (
    <div>
      {parts.map(({ sk, res }) => (res && res.list.length ? (
        <div key={sk}>
          <Head sk={sk} />
          <section className="glass mx-4 mt-2 overflow-hidden rounded-[24px] pb-1" style={{ background: tintGrad(tint, 0x45) }}>
            {res.list.map((m, i) => (
              <div key={m[0]} style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
                {i === 0 || dayKey(res.list[i - 1][4]) !== dayKey(m[4]) ? <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{fmtDate(m[4])}</div> : null}
                <ArchRow m={m} names={res.s.teams} fm={fm} sk={sk} />
              </div>
            ))}
          </section>
        </div>
      ) : null))}
      <Foot box={box} busy={busy} done={done} empty={!parts.some((p) => p.res && p.res.list.length)} />
    </div>
  );
}

// partite di un giocatore nelle stagioni passate (dai dettagli delle partite archiviate)
const romeDayOf = (iso) => { try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); } };

// partite giocate (minuti > 0) in una competizione e stagione dell'archivio
async function seasonRows(fm, sk, fmPid) {
  const [s, det, st] = await Promise.all([loadSeason(fm, sk), loadSeasonMatches(fm, sk), loadSeasonStats(fm, sk)]);
  if (!s || !det) return [];
  let myTeam = null;
  const lists = (st && st.players) || {};
  Object.keys(lists).some((k) => { const r = (lists[k] || []).find((x) => String(x[0]) === String(fmPid)); if (r) { myTeam = String(r[2]); return true; } return false; });
  const fx = {};
  s.fix.forEach((m) => { fx[m[0]] = m; });
  const rows = [];
  Object.entries(det.m || {}).forEach(([mid, x]) => {
    const p = x.p && x.p[fmPid];
    if (!p || !(p.minutes_played > 0)) return;
    const f = fx[mid];
    const hid = String((x.h && x.h.id) || (f && f[2]) || '');
    const aid = String((x.a && x.a.id) || (f && f[3]) || '');
    // squadra del giocatore: dalla formazione della partita, altrimenti dalle classifiche della stagione
    const inH = x.h && [...(x.h.st || []), ...(x.h.sb || [])].some((r) => String(r[0]) === String(fmPid));
    const inA = x.a && [...(x.a.st || []), ...(x.a.sb || [])].some((r) => String(r[0]) === String(fmPid));
    const side = x.pn && x.pn[fmPid] ? x.pn[fmPid][1] : null;
    const home = inH ? true : inA ? false : side ? side === 'h' : myTeam ? myTeam === hid : false;
    const opp = home ? aid : hid;
    const date = f ? f[4] : '';
    rows.push({ key: `a-${fm}-${sk}-${mid}`, to: `/match/a-${fm}-${sk}-${mid}`, day: date ? romeDayOf(date) : '', date, fm, oppId: opp, oppName: s.teams[opp] || '', score: f ? ownFirst(f[5], home) : '', minutes: Math.round(p.minutes_played), goals: p.goals || 0, assists: p.goal_assist || p.assists || 0, rating: p.rating_title || null });
  });
  return rows;
}

// Tutte le partite del giocatore in UN'unica lista, dalla piu' recente alla piu' vecchia, con la competizione di ognuna
// (stemma + nome piccolo). Le stagioni si caricano a gruppi (anno di inizio) scorrendo in fondo; `recent` = ultime partite dell'app
// (aurora_indice, con la partita dal vivo): stesso giorno = stessa partita, quella dell'archivio non si ripete.
const yearOf = (sk) => parseInt(String(sk).slice(0, 4), 10) || 0;
// risultato dal lato del giocatore: prima i gol della sua squadra (Inghilterra 7-0 in Croazia, non "0 - 7")
export const ownFirst = (score, home) => {
  const m = String(score || '').match(/^(\d+)\s*-\s*(\d+)(.*)$/);
  if (!m) return score || '';
  return home ? `${m[1]} - ${m[2]}${m[3]}` : `${m[2]} - ${m[1]}${m[3]}`;
};
export function PlayerAllMatches({ items, fmPid, playerName, recent = [] }) {
  const years = [...new Set((items || []).map(([, sk]) => yearOf(sk)))].sort((a, b) => b - a);
  const { parts, busy, done, box } = useOlder(years, async (y) => {
    const lists = await Promise.all(items.filter(([, sk]) => yearOf(sk) === y).map(([fm, sk]) => seasonRows(fm, sk, fmPid).catch(() => [])));
    return lists.flat();
  });
  const recentDays = new Set(recent.map((r) => r.day).filter(Boolean));
  const seen = new Set();
  const all = [...recent, ...parts.flatMap((p) => p.res || []).filter((r) => !recentDays.has(r.day))]
    .filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)))
    .sort((a, b) => b.day.localeCompare(a.day) || String(b.date).localeCompare(String(a.date)));
  return (
    <div className="px-5 pt-5">
      <div className="flex flex-col gap-2.5">
        {all.map((m) => {
          const lg = m.league || leagueById(LID_BY_FM[Number(m.fm)]);
          return (
            <Link key={m.key} to={m.to} state={openPlayerState(playerName, fmPid)} onClick={() => pickLineups(m.to.slice(7))} className="club-card flex items-center gap-3 rounded-2xl px-3.5 py-3 active:opacity-60" style={{ background: 'var(--panel-solid, rgba(255,255,255,.04))' }}>
              {m.oppTeam ? <Crest team={m.oppTeam} size={26} /> : <TeamLogo id={m.oppId} name={m.oppName} size={26} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>vs {m.oppName || '—'} {m.score ? <span className="tnum" style={{ color: 'var(--ink-3)' }}>{m.score}</span> : null}</p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {lg ? <><LeagueBadge league={lg} size={12} /><span className="truncate">{lg.name}</span><span>·</span></> : null}
                  <span className="shrink-0 whitespace-nowrap">
                    {m.dateText || fmtDate(m.date)} · {m.minutes}&apos;
                    {m.goals ? <span className="inline-flex items-center gap-0.5 align-middle"> · <BallIcon size={12} />{m.goals}</span> : null}
                    {m.assists ? <span className="inline-flex items-center gap-0.5 align-middle"> · <BootIcon size={12} />{m.assists}</span> : null}
                  </span>
                </p>
              </div>
              {m.rating ? <RatingPill r={m.rating} /> : null}
            </Link>
          );
        })}
      </div>
      {items && items.length ? <Foot box={box} busy={busy} done={done} empty={!all.length} /> : null}
    </div>
  );
}
