import { useMemo, useState } from 'react';
import { goBack } from '@/lib/carousel';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ChevronLeft } from 'lucide-react';
import LeagueBadge from '@/components/LeagueBadge';
import LeagueLink from '@/components/LeagueLink';
import { leagueById, leagueTint } from '@/data/leagues';
import { StandingsPanel, useTeamColors } from '@/components/archive/parts';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import SwipeTabs from '@/components/SwipeTabs';
import Skeleton from '@/components/Skeleton';
import StatIcon from '@/components/StatIcon';
import { TeamLogo, PlayerFace } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { FM_ID, loadSeason, loadSeasonMatches, seasonLabel, STAT_IT, STAT_GROUPS, PLAYER_STAT_IT, prettyKey } from '@/data/archive';
import { scoreColorSmooth } from '@/lib/calc';

const TABS = [
  { key: 'overview', label: 'Riepilogo' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'lineups', label: 'Formazioni' },
  { key: 'players', label: 'Giocatori' },
  { key: 'standings', label: 'Classifica' },
];
const HDR = new Set(['shots', 'passes', 'defense', 'duels', 'discipline']);

const Empty = ({ children }) => (
  <p className="px-6 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>
);

function RatingPill({ v }) {
  if (v == null) return null;
  return <span className="tnum rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: `${scoreColorSmooth(v)}26`, color: scoreColorSmooth(v) }}>{Number(v).toFixed(1)}</span>;
}

function Overview({ d, hn, an, fx }) {
  const ev = (d && d.e) || [];
  const info = (d && d.i) || {};
  const goals = ev.filter((e) => e.type === 'Goal');
  if (!ev.length && !Object.keys(info).length) return <Empty>Eventi non disponibili per questa partita</Empty>;
  return (
    <div className="pt-4">
      <section className="glass mx-4 overflow-hidden rounded-[26px] py-2">
        {ev.map((e, i) => {
          const home = e.isHome;
          const t = `${e.time}${e.overloadTime ? `+${e.overloadTime}` : ''}'`;
          let body = null;
          if (e.type === 'Goal') body = <span><b>{e.nameStr || (e.p && e.p[1])}</b>{e.assistStr ? <span style={{ color: 'var(--ink-3)' }}> · {String(e.assistStr).replace(/^assist by\s*/i, 'assist ')}</span> : null}</span>;
          else if (e.type === 'Card') body = <span>{(e.p && e.p[1]) || e.nameStr}</span>;
          else if (e.type === 'Substitution') body = <span className="flex items-center gap-1.5"><ArrowLeftRight size={13} style={{ color: 'var(--ink-3)' }} />{(e.swap || []).map((x) => x.name).join(' / ') || (e.p && e.p[1])}</span>;
          else body = <span style={{ color: 'var(--ink-2)' }}>{e.type}{e.p ? ` · ${e.p[1]}` : ''}</span>;
          const mark = e.type === 'Goal' ? <StatIcon k="shots" size={16} /> : e.type === 'Card' ? <span className="h-[14px] w-[10px] rounded-[2px]" style={{ background: /Red/i.test(e.card || '') ? '#E5484D' : '#F5C84C' }} /> : null;
          return (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none', flexDirection: home ? 'row' : 'row-reverse', textAlign: home ? 'left' : 'right' }}>
              <span className="tnum w-9 flex-none text-[11.5px] font-bold" style={{ color: 'var(--ink-3)', textAlign: home ? 'left' : 'right' }}>{t}</span>
              {mark}
              <div className="min-w-0 flex-1">{body}</div>
            </div>
          );
        })}
        {!ev.length ? <Empty>Nessun evento registrato</Empty> : null}
      </section>
      {Object.keys(info).length ? (
        <section className="glass mx-4 mt-3 overflow-hidden rounded-[26px]">
          {[['Arbitro', info.ref], ['Stadio', info.st], ['Spettatori', info.att]].filter((r) => r[1]).map((r, i) => (
            <div key={r[0]} className="flex items-center justify-between px-4 py-3 text-[13px]" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <span className="label-sm">{r[0]}</span><span className="tnum font-semibold">{r[1]}</span>
            </div>
          ))}
        </section>
      ) : null}
      <div className="h-6" />
    </div>
  );
}

function Stats({ d }) {
  const s = (d && d.s) || {};
  if (!Object.keys(s).length) return <Empty>Statistiche non disponibili per questa partita</Empty>;
  const known = new Set(STAT_GROUPS.flatMap((g) => g[1]));
  const groups = STAT_GROUPS.map(([title, keys]) => [title, keys.filter((k) => s[k])]).filter((g) => g[1].length);
  const rest = Object.keys(s).filter((k) => !known.has(k) && !HDR.has(k));
  if (rest.length) groups.push(['Altro', rest]);
  return (
    <div className="space-y-3 px-4 pt-4">
      {groups.map(([title, keys]) => (
        <section key={title} className="glass overflow-hidden rounded-[26px] px-4 py-3">
          <p className="label-sm pb-1">{title}</p>
          {keys.map((k) => {
            const [a, b] = s[k];
            const na = Number(a); const nb = Number(b);
            const tot = Math.abs(na) + Math.abs(nb);
            const pa = tot > 0 ? (Math.abs(na) / tot) * 100 : 50;
            return (
              <div key={k} className="py-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="tnum font-bold">{k === 'BallPossesion' ? `${a}%` : a}</span>
                  <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{STAT_IT[k] || prettyKey(k)}</span>
                  <span className="tnum font-bold">{k === 'BallPossesion' ? `${b}%` : b}</span>
                </div>
                <div className="mt-1 flex h-[4px] gap-[3px] overflow-hidden rounded-full">
                  <span style={{ width: `${pa}%`, background: 'var(--accent)', opacity: na >= nb ? 1 : 0.45, borderRadius: 4 }} />
                  <span style={{ width: `${100 - pa}%`, background: 'var(--ink-2)', opacity: nb >= na ? 0.9 : 0.35, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </section>
      ))}
      <div className="h-6" />
    </div>
  );
}

function Lineup({ side, name, logoId }) {
  if (!side) return null;
  const row = (p, sub) => (
    <div key={p[0]} className="flex items-center gap-3 px-4 py-2" style={{ opacity: sub ? 0.85 : 1 }}>
      <span className="tnum w-5 text-right text-[11.5px] font-bold" style={{ color: 'var(--ink-3)' }}>{p[2]}</span>
      <PlayerFace id={p[0]} name={p[1]} size={34} />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{p[1]}{p[5] === 'C' ? <span style={{ color: 'var(--ink-3)' }}> (C)</span> : null}</span>
      <RatingPill v={p[4]} />
    </div>
  );
  return (
    <section className="glass mx-4 mt-3 overflow-hidden rounded-[26px]">
      <div className="flex items-center gap-3 px-4 py-3">
        <TeamLogo id={logoId} name={name} size={26} />
        <span className="flex-1 truncate text-[14px] font-extrabold">{name}</span>
        {side.f ? <span className="tnum text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>{side.f}</span> : null}
        <RatingPill v={side.r} />
      </div>
      <div style={{ borderTop: '1px solid var(--hair-2)' }}>{(side.st || []).map((p) => row(p, false))}</div>
      {side.sb && side.sb.length ? <p className="label-sm px-4 pb-1 pt-3" style={{ borderTop: '1px solid var(--hair-2)' }}>Panchina</p> : null}
      {(side.sb || []).map((p) => row(p, true))}
      {side.co ? <p className="px-4 pb-3 pt-2 text-[12px]" style={{ color: 'var(--ink-3)' }}>Allenatore: {side.co}</p> : null}
    </section>
  );
}

function Lineups({ d, hn, an, fx }) {
  if (!d || (!d.h && !d.a)) return <Empty>Formazioni non disponibili per questa partita</Empty>;
  return <div className="pb-6"><Lineup side={d.h} name={hn} logoId={fx[2]} /><Lineup side={d.a} name={an} logoId={fx[3]} /></div>;
}

function Players({ d }) {
  const [open, setOpen] = useState(null);
  const ps = (d && d.p) || {};
  const names = useMemo(() => {
    const m = {};
    ['h', 'a'].forEach((s) => d && d[s] && [...d[s].st, ...d[s].sb].forEach((p) => { m[p[0]] = { name: p[1], team: s, rating: p[4] }; }));
    return m;
  }, [d]);
  const rows = Object.entries(ps).map(([id, v]) => ({ id, v, ...(names[id] || { name: `#${id}` }) })).sort((a, b) => (b.v.rating_title || b.rating || 0) - (a.v.rating_title || a.rating || 0));
  if (!rows.length) return <Empty>Statistiche dei giocatori non disponibili per questa partita</Empty>;
  return (
    <section className="glass mx-4 mt-4 overflow-hidden rounded-[26px]">
      {rows.map((r, i) => {
        const on = open === r.id;
        const ks = Object.keys(r.v).filter((k) => !k.endsWith('_t') && !/^poss_?won_?att_?3rd/i.test(k) && k !== 'rating_title' && r.v[k]);
        return (
          <div key={r.id} style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <button type="button" onClick={() => setOpen(on ? null : r.id)} className="press flex w-full items-center gap-3 px-4 py-2.5 text-left">
              <PlayerFace id={r.id} name={r.name} size={36} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{r.name}</span>
              <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{r.v.minutes_played ? `${r.v.minutes_played}'` : ''}</span>
              <RatingPill v={r.v.rating_title || r.rating} />
            </button>
            {on ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-1 px-5 pb-3 text-[12px]">
                {ks.map((k) => (
                  <div key={k} className="flex justify-between"><span style={{ color: 'var(--ink-3)' }}>{PLAYER_STAT_IT[k] || prettyKey(k)}</span><span className="tnum font-bold">{r.v[`${k}_t`] ? `${r.v[k]}/${r.v[`${k}_t`]}` : r.v[k]}</span></div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="h-1" />
    </section>
  );
}

export default function ArchiveMatch() {
  const { fm, sk, mid } = useParams();
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const col = useTeamColors();
  const { data: season, loading } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: det, loading: l2 } = useAsync(() => loadSeasonMatches(fm, sk), [fm, sk]);
  const fx = season && season.fix.find((m) => String(m[0]) === String(mid));
  if (loading || l2) {
    return (
      <PageShell bar={false}><TopBar title="Partita" /><div className="space-y-3 px-5 pt-6"><Skeleton className="h-[150px] w-full rounded-[26px]" /><Skeleton className="h-[200px] w-full rounded-[26px]" /></div></PageShell>
    );
  }
  if (!fx) {
    return <PageShell bar={false}><TopBar title="Partita" /><Empty>Partita non trovata</Empty></PageShell>;
  }
  const d = det && det.m && det.m[String(mid)];
  const hn = season.teams[fx[2]] || '—';
  const an = season.teams[fx[3]] || '—';
  const sc = String(fx[5] || '').split(' - ');
  const dt = new Date(fx[4]);
  const when = Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });
  const lid = Object.keys(FM_ID).find((k) => String(FM_ID[k]) === String(fm));
  const league = lid ? leagueById(lid) : null;
  const tint = lid ? leagueTint(lid) : '#38A2FF';
  const goals = ((d && d.e) || []).filter((e) => e.type === 'Goal');
  const hc = col(fx[2], hn).colors[0];
  const ac = col(fx[3], an).colors[0];
  const shortName = (n) => { const q = String(n || '').trim().split(/\s+/); return q.length < 2 ? q[0] || '' : `${q[0][0]}. ${q.slice(1).join(' ')}`; };
  const scorers = (home) => goals.filter((g) => !!g.isHome === home);
  const Scorers = ({ list, right }) => (list.length ? (
    <div className={`mt-2 flex w-full flex-col gap-[3px] ${right ? 'items-end text-right' : 'items-start text-left'}`}>
      {list.map((g, i) => (
        <span key={i} className="max-w-full truncate text-[11.5px] leading-tight" style={{ color: 'var(--ink-2)' }}>
          <span className="tnum" style={{ color: 'var(--ink-3)' }}>{g.time}{g.overloadTime ? `+${g.overloadTime}` : ''}&apos;</span> {shortName(g.nameStr || (g.p && g.p[1]))}{g.ownGoal ? ' (aut.)' : ''}
        </span>
      ))}
    </div>
  ) : null);
  const panels = [<Overview key="o" d={d} hn={hn} an={an} fx={fx} />, <Stats key="s" d={d} />, <Lineups key="l" d={d} hn={hn} an={an} fx={fx} />, <Players key="p" d={d} />, <StandingsPanel key="c" season={season} fm={fm} sk={sk} highlight={null} />];
  return (
    <PageShell swipeBack={false}>
      <div style={{ '--tint': tint }}>
      <section className="safe-top px-4 pb-3">
        <div className="flex items-center gap-2">
          <button type="button" className="glass press flex h-9 w-9 items-center justify-center rounded-full" aria-label="Indietro" onClick={() => goBack(navigate)}><ChevronLeft size={19} /></button>
          {league ? (
            <LeagueLink league={league} className="mx-auto flex items-center gap-2 transition-opacity active:opacity-60">
              <LeagueBadge league={league} size={20} />
              <span className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>{league.name} · {seasonLabel(sk)}</span>
            </LeagueLink>
          ) : <span className="mx-auto text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>{seasonLabel(sk)}</span>}
          <span className="h-9 w-9" />
        </div>
        <div className="glass mt-3 rounded-[28px] px-4 pb-4 pt-5" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${hc} 55%, transparent) 0%, transparent 38%, transparent 62%, color-mix(in srgb, ${ac} 50%, transparent) 100%), var(--glass-bg)` }}>
          <div className="flex items-start">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <Link to={`/storico/${fm}/${sk}/squadra/${fx[2]}`} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
                <TeamLogo id={fx[2]} name={hn} size={54} /><span className="text-center text-[13px] font-semibold leading-tight">{hn}</span>
              </Link>
            </div>
            <div className="flex w-[104px] flex-none flex-col items-center pt-3">
              {fx[6] && sc.length === 2 ? <span className="title-xl tnum text-[32px]">{sc[0]} – {sc[1]}</span> : <span className="text-[14px]" style={{ color: 'var(--ink-3)' }}>{fx[8] ? 'Annullata' : 'Non giocata'}</span>}
              <span className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>{fx[6] ? 'Finita' : when}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <Link to={`/storico/${fm}/${sk}/squadra/${fx[3]}`} className="flex flex-col items-center gap-2 transition-opacity active:opacity-60">
                <TeamLogo id={fx[3]} name={an} size={54} /><span className="text-center text-[13px] font-semibold leading-tight">{an}</span>
              </Link>
            </div>
          </div>
          <div className="mt-1 flex gap-3"><div className="flex-1"><Scorers list={scorers(true)} /></div><div className="flex-1"><Scorers list={scorers(false)} right /></div></div>
          <p className="tnum mt-3 text-center text-[11px]" style={{ color: 'var(--ink-3)' }}>{when}{fx[1] ? ` · ${/^\d+$/.test(String(fx[1])) ? `Giornata ${fx[1]}` : String(fx[1])}` : ''}</p>
        </div>
      </section>
      <SwipeTabs tabs={TABS} panels={panels} index={tab} onChange={setTab} className="pt-2" stickyTop="0px" edgeBack={false} />
      </div>
    </PageShell>
  );
}
