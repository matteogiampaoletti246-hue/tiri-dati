import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/FmImg';
import { loadSeason, loadSeasonStats, loadSeasonMatches, seasonLabel } from '@/data/archive';
import { ArchRow, fmtDate, dayKey } from '@/components/archive/parts';
import { tintGrad } from '@/lib/tint';
import { RatingPill } from '@/components/player/PlayerTabs';
import { leagueById } from '@/data/leagues';
import { FM_ID } from '@/data/archive';

const LID_BY_FM = {};
Object.keys(FM_ID).forEach((k) => { LID_BY_FM[FM_ID[k]] = k; });

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
  <div ref={box} className="px-5 py-6 text-center text-[11.5px]" style={{ color: 'var(--ink-3)', minHeight: 40 }}>
    {busy ? 'Carico la stagione precedente…' : done ? (empty ? 'Nessuna partita precedente' : 'Fine delle partite disponibili') : ''}
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
export function PastPlayerMatches({ fm: fm0, seasons, fmPid, items }) {
  // items: [[fm, stagione]] di tutte le competizioni giocate; senza, solo il campionato fm0
  const list = (items || seasons.map((sk) => [fm0, sk])).map(([f, sk]) => `${f}|${sk}`);
  const { parts: parts0, busy, done, box } = useOlder(list, async (key) => {
    const [fm, sk] = key.split('|');
    const [s, det, st] = await Promise.all([loadSeason(fm, sk), loadSeasonMatches(fm, sk), loadSeasonStats(fm, sk)]);
    if (!s || !det) return null;
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
      const home = myTeam ? myTeam === hid : false;
      const opp = home ? aid : hid;
      rows.push({ mid, date: f ? f[4] : '', opp, oppName: s.teams[opp] || '', home, score: f ? f[5] : '', p });
    });
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return { rows, fm };
  });
  const parts = parts0.map((x) => ({ ...x, key: x.sk, sk: String(x.sk).split('|')[1], fm: String(x.sk).split('|')[0] }));
  return (
    <div className="px-5">
      {parts.map(({ key, sk, fm, res }) => (res && res.rows.length ? (
        <div key={key}>
          <div className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{items ? `${(leagueById(LID_BY_FM[fm]) || {}).name || ''} · ` : ''}Stagione {seasonLabel(sk)}</div>
          <div className="flex flex-col gap-2.5">
            {res.rows.map((m) => (
              <Link key={m.mid} to={`/match/a-${fm}-${sk}-${m.mid}`} className="club-card flex items-center gap-3 rounded-2xl px-3.5 py-3 active:opacity-60" style={{ background: 'var(--panel-solid, rgba(255,255,255,.04))' }}>
                <TeamLogo id={m.opp} name={m.oppName} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">{m.home ? 'vs' : '@'} {m.oppName || '—'} <span className="tnum" style={{ color: 'var(--ink-3)' }}>{m.score}</span></p>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                    {fmtDate(m.date)} · {Math.round(m.p.minutes_played)}&apos;{m.p.goals ? ` · ⚽ ${m.p.goals}` : ''}{m.p.goal_assist || m.p.assists ? ` · 🅰 ${m.p.goal_assist || m.p.assists}` : ''}
                  </p>
                </div>
                {m.p.rating_title ? <RatingPill r={m.p.rating_title} /> : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null))}
      <Foot box={box} busy={busy} done={done} empty={!parts.some((p) => p.res && p.res.rows.length)} />
    </div>
  );
}
