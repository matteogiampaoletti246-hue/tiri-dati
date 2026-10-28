import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import Radar from './Radar';
import { comma } from '@/lib/format';
import { POS_IT, POS_PL, percentiles, ratingColor, dateIt, rankOf, statValue, roleAverage, standing, bandColor, bandOf, BAND_COLORS, GROUPS } from './playerCalc';
import { per90, EX_COLS } from '@/data/players';
import { upcomingMatches } from '@/data/extras';
import { playerReliability } from '@/data/topPlayers';
import { scoreColor } from '@/lib/calc';
import { teamById } from '@/data/teams';
import { teamByName } from '@/data/teams';
import CompSelect from '@/components/CompSelect';
import { teamCompetitions } from '@/data/competitions';
import { leagueById } from '@/data/leagues';
import { MATCHES } from '@/data/matches';
import { useState } from 'react';
import { teamGrad } from '@/lib/tint';
import CompSeasonBar from '@/components/CompSeasonBar';
import PastStats from '@/components/past/PastStats';
import { PastPlayerMatches } from '@/components/past/PastMatches';
import { useSeasonList, initSeason, useSel } from '@/components/past/PastBits';
import useAsync from '@/hooks/useAsync';
import { currentSeason, loadPlayerStats } from '@/data/archive';
import { FM_ID } from '@/data/archive';
import { fixedColors } from '@/data/teamColorFix';
import { carriereOf, countryIt, flagOf, FOOT, dateLong, ageOf, money, monthIt } from '@/data/carriere';

const L = { fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' };

export function RatingPill({ r, big }) {
  if (r === null || r === undefined) return <span className="tnum text-[12px]" style={{ color: 'var(--ink-3)' }}>—</span>;
  return (
    <span
      className="tnum inline-flex items-center justify-center rounded-lg font-semibold"
      style={{ background: ratingColor(r), color: '#fff', minWidth: big ? 44 : 36, height: big ? 28 : 22, fontSize: big ? 14 : 12 }}
    >
      {comma(r, 1)}
    </span>
  );
}

function Bars({ values, color }) {
  const vs = values.slice().reverse();
  return (
    <div className="flex h-[54px] items-end gap-1.5">
      {vs.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="tnum text-[9.5px]" style={{ color: 'var(--ink-3)' }}>{comma(v, 1)}</span>
          <span className="w-full rounded-t-md" style={{ height: `${Math.max(8, ((v - 4) / 6) * 36)}px`, background: ratingColor(v), opacity: 0.9 }} />
        </div>
      ))}
    </div>
  );
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function BioCard({ player, team }) {
  const c = carriereOf(player.id) || {};
  const age = ageOf(c.b);
  const cells = [
    ['Nazionalità', c.c ? `${flagOf(c.c)} ${countryIt(c.c)}`.trim() : '—'],
    ['Nato il', c.b ? `${dateLong(c.b)}${age ? ` · ${age} anni` : ''}` : '—'],
    ['Altezza', c.h ? `${c.h} cm` : '—'],
    ['Piede', FOOT[c.f] || '—'],
    ['Ruolo', POS_IT[player.position] || '—'],
    ['Maglia', c.n || player.number || '—'],
  ];
  return (
    <section>
      <PanelTitle>Informazioni</PanelTitle>
      <div className="panel-solid rounded-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Crest team={team} size={30} />
          <div className="min-w-0">
            <p className="truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>{team ? team.name : player.teamName}</p>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{c.ce ? `Contratto fino al ${dateLong(c.ce)}` : ' '}</p>
          </div>
        </div>
        {injuryOf(player.id) ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(229,72,77,.12)', border: '1px solid rgba(229,72,77,.4)' }}>
            <InjuryIcon size={24} />
            <div className="min-w-0">
              <p className="text-[14px] font-bold" style={{ color: '#E5484D' }}>Infortunato</p>
              <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{injuryOf(player.id).reason}{injuryOf(player.id).label ? ` · Rientro previsto: ${injuryOf(player.id).label}` : ''}</p>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {cells.map(([k, v]) => (
            <div key={k}>
              <p style={L}>{k}</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {c.mv ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(127,160,200,.1)' }}>
            <span style={L}>Valore di mercato</span>
            <span className="tnum text-[17px] font-medium" style={{ color: '#e0a528' }}>{money(c.mv)}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- PROFILO ---------- */
export function ProfiloPanel({ player, team, concept }) {
  const pc = percentiles(player).filter((x) => x.key !== 'foulsCommitted');
  const colors = team ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const r5 = player.ratings5 || [];
  const facts = [
    ['Squadra', team ? team.name : player.teamName],
    ['Ruolo', POS_IT[player.position] || '—'],
    ['Campionato', player.leagueId ? String(player.leagueId).toUpperCase() : '—'],
    ['Presenze', player.appearances],
    ['Minuti', player.minutes],
  ];
  const season = [
    ['Presenze', player.appearances],
    ['Gol', player.goals],
    ['Assist', player.assists],
    ['Voto', player.rating ? comma(player.rating, 2) : '—'],
  ];

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {season.map(([k, v]) => (
            <div key={k} className="panel-solid rounded-2xl px-4 py-4">
              <p style={L}>{k}</p>
              <p className="tnum mt-1 text-[30px] font-light leading-none" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {r5.length ? (
          <section>
            <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>media {comma(avg(r5), 2)}</span>}>Forma</PanelTitle>
            <div className="panel-solid rounded-2xl px-4 py-4"><Bars values={r5} /></div>
          </section>
        ) : null}
        <section>
          <PanelTitle>Punti di forza</PanelTitle>
          <div className="flex flex-wrap gap-2">
            {pc.filter((x) => x.pct !== null).sort((a, b) => b.pct - a.pct).slice(0, 4).map((x) => (
              <span key={x.key} className="glass-pill rounded-full px-3 py-1.5 text-[12px]" style={{ color: 'var(--ink)' }}>
                {x.label} <b className="tnum" style={{ color: 'var(--accent)' }}>{x.pct}°</b>
              </span>
            ))}
          </div>
        </section>
        <section>
          <PanelTitle>Informazioni</PanelTitle>
          <div className="panel-solid rounded-2xl px-4 py-1">
            {facts.map(([k, v], i) => (
              <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
                <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (concept === 'c') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="panel-solid flex items-center gap-5 rounded-3xl px-5 py-5">
          <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--hair-2)" strokeWidth="7" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={ratingColor(player.rating)} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(1, ((player.rating || 5) - 5) / 4)) * 276} 276`} transform="rotate(-90 50 50)" />
            </svg>
            <span className="tnum text-[26px] font-light" style={{ color: 'var(--ink)' }}>{player.rating ? comma(player.rating, 1) : '—'}</span>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[['Pres.', player.appearances], ['Gol', player.goals], ['Assist', player.assists]].map(([k, v]) => (
              <div key={k}>
                <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
                <p style={L}>{k}</p>
              </div>
            ))}
          </div>
        </div>
        <BioCard player={player} team={team} />
        <section>
          <PanelTitle>Profilo di gioco</PanelTitle>
          <div className="panel-solid rounded-3xl px-2 py-4"><Radar items={pc} color={colors[0]} /></div>
        </section>
      </div>
    );
  }

  // A — stile FotMob
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
      <div className="panel-solid rounded-2xl px-4 py-1">
        {facts.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
            <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
      </div>
      <section>
        <PanelTitle>Stagione</PanelTitle>
        <div className="panel-solid grid grid-cols-4 rounded-2xl px-2 py-4 text-center">
          {season.map(([k, v]) => (
            <div key={k}>
              <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
              <p style={L}>{k}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <PanelTitle>Radar</PanelTitle>
        <div className="panel-solid rounded-2xl px-2 py-4"><Radar items={pc} color="var(--accent)" /></div>
        <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Percentile per 90&apos; tra i {POS_PL[player.position] || 'giocatori'} dei campionati</p>
      </section>
    </div>
  );
}

/* ---------- PARTITE ---------- */
export function PartitePanel({ player, concept }) {
  const rows = player.recent || [];
  const lg = player.archive ? player.leagueId : (teamById(player.teamId) || {}).leagueId;
  const fm = FM_ID[lg];
  const c = carriereOf(player.id);
  const fmPid = c && c.fm;
  const seasons = useSeasonList(fm, null, fmPid);
  if (!rows.length && !(fm && fmPid && seasons.length)) {
    return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita disponibile</p>;
  }
  return (
    <div className="pb-8">
    <div className="px-5 pt-5">
      <div className={concept === 'b' ? 'flex flex-col gap-2.5' : 'panel-solid rounded-2xl px-4 py-1'}>
        {rows.map((m, i) => {
          const opp = teamByName(m.opp);
          const body = (
            <>
              <Crest team={opp} size={26} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
                  vs {m.opp}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {dateIt(m.date)} · {m.minutes}&apos;
                  {m.goals ? ` · ⚽ ${m.goals}` : ''}
                  {m.assists ? ` · 🅰 ${m.assists}` : ''}
                </p>
              </div>
              <RatingPill r={m.rating} big={concept === 'c'} />
            </>
          );
          const cls = 'flex items-center gap-3 py-3 active:opacity-60';
          const st = concept === 'b'
            ? { background: 'var(--panel-solid, rgba(255,255,255,.04))', borderRadius: 16, padding: '12px 14px' }
            : { borderTop: i ? '1px solid var(--hair-2)' : 'none' };
          return m.matchId ? (
            <Link key={i} to={`/match/${m.matchId}`} state={{ openPlayer: { name: player.name } }} onClick={() => { try { sessionStorage.setItem(`sl-tab-match-${m.matchId}`, '2'); } catch (e) { /* ignore */ } }} className={cls} style={st}>{body}</Link>
          ) : (
            <div key={i} className={cls} style={st}>{body}</div>
          );
        })}
      </div>
    </div>
    {fm && fmPid && seasons.length ? <PastPlayerMatches fm={fm} seasons={seasons} fmPid={fmPid} /> : null}
    </div>
  );
}

/* ---------- STATISTICHE ---------- */
const f1 = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : comma(Math.round(v * 10 ** d) / 10 ** d, d));
const CARD = { backgroundColor: 'var(--panel-solid, rgba(255,255,255,.04))', border: '1px solid var(--hair-2)', borderRadius: 18 };

function Affidabilita({ player, team, comp }) {
  const next = upcomingMatches(player.teamId, 40).find((m) => !comp || m.leagueId === comp);
  const opp = next ? teamById(next.homeId === player.teamId ? next.awayId : next.homeId) : null;
  return (
    <section className="px-0">
      <div className="club-card rounded-2xl px-4 py-3.5" style={CARD}>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Affidabilità prossima partita</span>
          {opp ? (
            <span className="ml-auto flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-2)' }}>
              VS <Crest team={opp} size={18} /> {opp.name}
            </span>
          ) : <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>nessuna partita</span>}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[['Over 0,5', 0.5], ['Over 1,5', 1.5], ['Over 2,5', 2.5]].map(([k, ln]) => {
            const r = next ? playerReliability(player, next.date, ln, true) : null;
            const col = r ? scoreColor(r.voto) : 'var(--ink-3)';
            return (
            <div key={k} className="rounded-xl py-3 text-center" style={{ background: 'rgba(127,160,200,.1)' }}>
              <p className="tnum text-[22px] font-semibold" style={{ color: col }}>{r ? comma(r.voto, 2) : '—'}</p>
              <p style={L}>{k}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function useStatConcept() {
  try { return 'b'; } catch { return 'b'; }
}

function RankRow({ x }) {
  const concept = useStatConcept();
  const col = bandColor(x.r.frac);
  const w = Math.max(4, x.r.frac * 100);
  return (
    <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 52px 96px' }}>
        <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{x.label}</span>
        <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{comma(x.v, 2)}</span>
        <span className="tnum justify-self-end text-right text-[14px] font-semibold" style={concept === 'b' ? { color: col, background: `${col}26`, padding: '1px 9px', borderRadius: 999 } : { color: col }}>
          {x.r.rank}° <span className="text-[10.5px] font-normal" style={{ color: 'var(--ink-3)' }}>su {x.r.of}</span>
        </span>
      </div>
      {concept === 'c' ? (
        <div className="relative mt-2 h-[6px]">
          <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-full">
            {BAND_COLORS.map((c, k) => <span key={c} className="h-full flex-1" style={{ background: c, opacity: k <= bandOf(x.r.frac) ? 0.95 : 0.16 }} />)}
          </div>
          <span className="absolute top-1/2 h-[12px] w-[12px] rounded-full" style={{ left: `${w}%`, transform: 'translate(-50%,-50%)', background: '#fff', border: `3px solid ${col}` }} />
        </div>
      ) : (
        <div className="mt-2 rounded-full" style={{ height: concept === 'b' ? 8 : 5, background: 'var(--hair-2)' }}>
          <div className="h-full rounded-full" style={{ width: `${w}%`, background: concept === 'b' ? `linear-gradient(90deg, ${col}88, ${col})` : col }} />
        </div>
      )}
    </div>
  );
}

function StatRow({ player, row, i }) {
  const s = statValue(player, row);
  const l = statValue(player, row, true);
  if (s === null && l === null) return null;
  const concept = useStatConcept();
  const pct = row[2] === 'pct';
  const ref = roleAverage(player, row);
  const fmt = (v) => (v === null ? '–' : pct ? `${Math.round(v)}%` : f1(v, v < 10 ? 2 : 1));
  const top = ref ? Math.max(ref.p95 || 0, ref.avg * 1.6, s || 0, 0.0001) : null;
  const frac = ref && s !== null ? standing(player, row, s) : null;
  const col = bandColor(frac);
  const barW = ref && s !== null ? Math.max(2, Math.min(100, (s / top) * 100)) : 0;
  const avgX = ref ? Math.min(100, (ref.avg / top) * 100) : 0;
  const lab = ref ? fmt(ref.avg) : '';
  const labelX = Math.min(88, Math.max(12, avgX));
  const valStyle = concept === 'b' && frac !== null
    ? { color: col, background: `${col}26`, padding: '1px 8px', borderRadius: 999 }
    : { color: frac !== null ? col : 'var(--ink)' };
  return (
    <div className="px-4 py-2.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
      <div className="grid items-baseline gap-2" style={{ gridTemplateColumns: '1fr 64px 52px' }}>
        <span className="text-[12.5px] leading-tight" style={{ color: 'var(--ink-2)' }}>{row[1]}</span>
        <span className="tnum justify-self-end text-right text-[14px] font-semibold" style={valStyle}>{fmt(s)}</span>
        <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{fmt(l)}</span>
      </div>
      {ref && s !== null ? (
        <div className="relative" style={{ marginTop: 17, height: concept === 'b' ? 9 : 6 }}>
          {concept === 'c' ? (
            <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-full">
              {BAND_COLORS.map((c, k) => <span key={c} className="h-full flex-1" style={{ background: c, opacity: k <= bandOf(frac) ? 0.95 : 0.16 }} />)}
            </div>
          ) : (
            <div className="absolute inset-0 rounded-full" style={{ background: 'var(--hair-2)' }}>
              <div className="h-full rounded-full" style={{ width: `${barW}%`, background: concept === 'b' ? `linear-gradient(90deg, ${col}88, ${col})` : col }} />
            </div>
          )}
          {concept === 'c' ? (
            <span className="absolute top-1/2 h-[12px] w-[12px] rounded-full" style={{ left: `${barW}%`, transform: 'translate(-50%,-50%)', background: '#fff', border: `3px solid ${col}`, boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
          ) : null}
          <span className="absolute" style={{ left: `${avgX}%`, top: concept === 'b' ? -5 : -4, bottom: concept === 'b' ? -5 : -4, width: 0, borderLeft: concept === 'b' ? '2px dashed var(--ink)' : '2px solid var(--ink)', opacity: 0.85 }} />
          <span
            className="tnum absolute whitespace-nowrap text-[9.5px] font-bold leading-none"
            style={{ left: `${labelX}%`, top: -17, transform: 'translateX(-50%)', color: 'var(--ink-2)', ...(concept === 'b' ? { background: 'var(--hair-2)', padding: '2px 5px', borderRadius: 6, top: -20 } : {}) }}
          >
            {concept === 'c' ? '▼ ' : ''}{lab}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Group({ title, children }) {
  return (
    <section>
      <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
        <div className="grid items-end gap-2 px-4 pb-1.5 pt-3.5" style={{ gridTemplateColumns: '1fr 56px 56px' }}>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
          <span className="text-right text-[9.5px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>Stagione</span>
          <span className="text-right text-[9.5px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>Ultime 5</span>
        </div>
        {children}
      </div>
    </section>
  );
}

// statistiche di una coppa (tiri e minuti della competizione)
function CupSummary({ p }) {
  const c = p.c || [0, 0, 0, 0];
  const g = c[0] || 0;
  const mn = c[3] || 0;
  const p90 = (v) => (mn > 0 ? comma((v * 90) / mn, 2) : '–');
  const rows = [['Partite giocate', g], ['Minuti', Math.round(mn)], ['Tiri totali', Math.round(c[1] || 0)], ['Tiri in porta', Math.round(c[2] || 0)], ["Tiri ogni 90'", p90(c[1] || 0)], ["Tiri in porta ogni 90'", p90(c[2] || 0)]];
  return (
    <section>
      <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
        <div className="px-4 pb-1 pt-3.5"><span className="text-[14px] font-semibold">Statistiche della competizione</span></div>
        {g ? rows.map(([k, v], i) => (
          <div key={k} className="flex items-baseline px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
            <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{k}</span>
            <span className="tnum ml-auto text-[14px] font-semibold">{v}</span>
          </div>
        )) : <p className="px-4 pb-4 pt-2 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>Nessuna presenza in questa competizione</p>}
      </div>
    </section>
  );
}

// Competizione diversa dal campionato, stagione in corso: stesso aspetto delle altre stagioni
// (riquadri col colore della squadra, valori a pillola, barre con la media della competizione).
function CupCurrent({ p, fm, fmPid, team }) {
  const { data, loading } = useAsync(async () => {
    const sk = await currentSeason(fm);
    const st = sk ? await loadPlayerStats(fm, sk) : null;
    return { sk, st };
  }, [fm]);
  if (loading && !data) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Carico le statistiche…</p>;
  if (data && data.sk && data.st && fmPid) return <PastStats kind="players" id={fmPid} fm={fm} sk={data.sk} current teamName={team && team.name} />;
  return <div className="px-5 pb-10 pt-4"><CupSummary p={p} /></div>;
}

export function StatistichePanel({ player, team }) {
  const p = player;
  const comps = (() => {
    const c = teamCompetitions(p.teamId);
    const l = p.archive && p.leagueId ? leagueById(p.leagueId) : null;
    return l ? [l, ...c.filter((x) => x.id !== l.id)] : c;
  })();
  const [comp, setComp] = useSel(p.id, 'sc', comps.length ? comps[0].id : null);
  const [season, setSeason] = useSel(p.id, 'ss', () => (p.archive ? p.sk : initSeason(FM_ID[comps.length ? comps[0].id : null])));
  const fmL = FM_ID[comp];
  const fmPid = (carriereOf(p.id) || {}).fm;
  const seasons = useSeasonList(fmL, null, fmPid);
  // giocatore dell'archivio: non c'e' una "stagione attuale" da mostrare, si parte dall'ultima in cui ha giocato
  const seasonEff = p.archive && season === 'cur' ? (seasons[0] || null) : season;
  const dom = comps.length ? comps[0].id : null;
  const rk = [['goals', 'Gol'], ['assists', 'Assist'], ['shots', 'Tiri'], ['shotsOnTarget', 'Tiri in porta'], ['xg', 'xG'], ['foulsDrawn', 'Falli subiti']]
    .map(([k, label]) => ({ k, label, r: rankOf(p, k), v: per90(p[k] || 0, p.minutes) }))
    .filter((x) => x.r);
  const exv = (k, last) => {
    const arr = last ? p.exL5 : p.exS;
    const i = EX_COLS.indexOf(k);
    return arr && i >= 0 ? arr[i] : null;
  };
  const mpp = (m, g) => (g ? Math.round(m / g) : null);
  const gen = [
    ['Partite giocate', p.appearances, p.l5g],
    ['Gol', p.goals, exv('goals', true)],
    ['Assist', p.assists, exv('assists', true)],
    ['Minuti a partita', mpp(p.minutes, p.appearances) === null ? '–' : `${mpp(p.minutes, p.appearances)}'`, mpp(p.l5min, p.l5g) === null ? '–' : `${mpp(p.l5min, p.l5g)}'`],
  ];
  const disc = [
    ['Gialli', p.yellows, p.l5y], ['Rossi', p.reds, p.l5r],
  ];
  const simple = (rows) => rows.map(([k, v, l], i) => (
    <div key={k} className="grid items-baseline gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1fr 56px 56px', borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
      <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{k}</span>
      <span className="tnum text-right text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{v ?? '–'}</span>
      <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{l ?? '–'}</span>
    </div>
  ));
  const isGk = p.position === 'GK';
  const mk = (rows) => rows.map((r, i) => <StatRow key={r[0] + r[2] + i} player={p} row={r} i={i} />);
  const gShots = [['total_shots', "Tiri ogni 90'", 'p90'], ['ShotsOnTarget', "Tiri in porta ogni 90'", 'p90']];
  const gDisc = [['fouls', "Falli commessi ogni 90'", 'p90', 1], ['was_fouled', "Falli subiti ogni 90'", 'p90'], ['Offsides', "Fuorigioco ogni 90'", 'p90', 1]];

  return (
    <div className="-mt-1">
    <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); setSeason('cur'); }} seasons={fmPid ? (p.archive && p.sk && !seasons.includes(p.sk) ? [p.sk, ...seasons] : seasons) : []} season={seasonEff || 'cur'} onSeason={setSeason} noCur={!!p.archive} />
    {p.archive && !seasonEff ? <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna stagione in questa competizione</p> : seasonEff && seasonEff !== 'cur' && fmL && fmPid ? <PastStats kind="players" id={fmPid} fm={fmL} sk={seasonEff} teamName={team && team.name} /> : (
    <div key={comp} className="comp-in">
    <div className="flex flex-col gap-4 px-5 pt-4"><Affidabilita player={p} team={team} comp={comp} /></div>
    {comp !== dom ? <CupCurrent p={p} fm={fmL} fmPid={fmPid} team={team} /> : (
    <div className="flex flex-col gap-4 px-5 pb-10 pt-4">
      {comp === dom && rk.length ? (
        <section>
          <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
            <div className="px-4 pb-1 pt-3.5">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>Classifica per ruolo</span>
              <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Posizione tra {{ GK: 'i portieri', DEF: 'i difensori', MID: 'i centrocampisti', WNG: 'le ali', ATT: 'gli attaccanti' }[p.position] || 'i giocatori'} del suo campionato (valori ogni 90&apos;)</p>
            </div>
            {rk.map((x) => <RankRow key={x.k} x={x} />)}
          </div>
        </section>
      ) : null}
      {comp === dom ? <Group title="Generale">{simple(gen)}</Group> : null}
      {comp === dom ? <Group title="Tiri">{mk(gShots)}</Group> : null}
      {comp === dom ? <Group title="Disciplina">{simple(disc)}{mk(gDisc)}</Group> : null}
      {comp === dom ? GROUPS.filter((g) => g.title !== 'Fisico' && (g.gk ? isGk : true)).map((g) => {
        const rows = mk(g.rows).filter(Boolean);
        return rows.length ? <Group key={g.title} title={g.title}>{rows}</Group> : null;
      }) : null}
      {comp === dom ? <p className="px-1 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>La lineetta con il numero è la media del campionato per quel ruolo. Colori: rosso = nella parte bassa della classifica, giallo = a metà, verde = nella parte alta.</p> : null}
    </div>
    )}
    </div>
    )}
    </div>
  );
}

/* ---------- CARRIERA ---------- */
export function CarrieraPanel({ player }) {
  const c = carriereOf(player.id);
  const raw = (c && c.car) || [];
  const now = new Date().toISOString().slice(0, 7);
  // FotMob registra anche i "rientri" dal prestito (stesso mese, zero presenze) e il futuro: non sono periodi giocati
  const isStub = (r) => (r[3] === null || r[3] === undefined) && (r[1] === r[2] || String(r[1]) > now);
  const rows = raw
    .map((r, i) => {
      const prev = raw[i + 1];
      const next = raw[i - 1];
      const loan = !isStub(r) && prev && next && isStub(prev) && isStub(next) && prev[0] === next[0];
      return { r, loan: !!loan, from: loan ? prev[0] : null };
    })
    .filter((x) => !isStub(x.r));
  if (!rows.length) {
    return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Carriera non disponibile per questo giocatore</p>;
  }
  return (
    <div className="px-5 pb-8 pt-5">
      <div className="flex flex-col gap-2.5">
        {rows.map(({ r, loan, from }, i) => {
          const t = teamByName(r[0]);
          const cols = fixedColors(r[0]) || (t && t.colors) || ['#37507a', '#5a7bb0'];
          return (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: teamGrad({ colors: cols }, 0x55) }}>
              <Crest team={t || { name: r[0], initials: String(r[0] || '').slice(0, 2).toUpperCase(), colors: ['#37507a', '#5a7bb0'] }} size={30} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--ink)' }}>
                  <span className="truncate">{r[0]}</span>{loan ? <span className="shrink-0 rounded-full px-1.5 text-[9.5px]" style={{ color: 'var(--ink-3)', border: '1px solid var(--hair-2)' }}>PRESTITO{from ? ` · ${from}` : ''}</span> : null}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {monthIt(r[1])} – {r[7] ? 'oggi' : monthIt(r[2]) || '—'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Pres.', r[3]], ['Gol', r[4]], ['Ass.', r[5]]].map(([k, v]) => (
                  <div key={k} className="w-8">
                    <p className="tnum text-[14px]" style={{ color: 'var(--ink)' }}>{v || '0'}</p>
                    <p style={{ ...L, fontSize: 8 }}>{k}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
