import { useMemo } from 'react';
import Crest from '@/components/Crest';
import { rankOf, hasMetrics } from '@/data/standings';
import { teamById } from '@/data/teams';
import { teamFinished, upcomingMatches } from '@/data/extras';
import { teamRow, standings } from '@/data/standings';
import { conceptOf } from '@/components/match/FormCard';
import { bandColor } from '@/components/player/playerCalc';

const AXES = [['xg', 'xG'], ['tiri', 'Tiri'], ['tiriInPorta', 'In porta'], ['possesso', 'Possesso'], ['corner', 'Corner'], ['precisione', 'Passaggi']];
const fracOf = (t, key) => {
  const r = rankOf(t.leagueId, key, t.id);
  return r && r.rank && r.total > 1 ? (r.total - r.rank) / (r.total - 1) : null;
};

function Radar({ home, away }) {
  const S = 220; const C = S / 2; const R = 78;
  const pt = (i, f) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
    const r = R * (0.18 + 0.82 * f);
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  const poly = (t) => AXES.map(([k], i) => pt(i, fracOf(t, k) ?? 0).join(',')).join(' ');
  const hc = '#E0443A'; const ac = '#3B9DFF';
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto block w-full max-w-[300px]">
      {[0.25, 0.5, 0.75, 1].map((g) => <polygon key={g} points={AXES.map((_, i) => pt(i, g).join(',')).join(' ')} fill="none" stroke="var(--hair-2)" strokeWidth="1" />)}
      {AXES.map(([k, l], i) => {
        const [x, y] = pt(i, 1.18);
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-3)">{l}</text>;
      })}
      <polygon points={poly(home)} fill={`${hc}55`} stroke={hc} strokeWidth="2" />
      <polygon points={poly(away)} fill={`${ac}55`} stroke={ac} strokeWidth="2" />
    </svg>
  );
}

const rate = (teamId, fn, n = 10) => {
  const l = teamFinished(teamId).slice(0, n);
  if (!l.length) return null;
  return Math.round((l.filter((m) => fn(m, m.homeId === teamId)).length / l.length) * 100);
};
const TREND = [
  ['Over 1,5', (m) => m.score[0] + m.score[1] > 1.5],
  ['Over 2,5', (m) => m.score[0] + m.score[1] > 2.5],
  ['Gol/Gol', (m) => m.score[0] > 0 && m.score[1] > 0],
  ['Porta inviolata', (m, h) => (h ? m.score[1] : m.score[0]) === 0],
];

function Ring({ pct, label }) {
  const c = bandColor(pct === null ? null : pct / 100);
  const R = 19; const L = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={R} fill="none" stroke="var(--hair-2)" strokeWidth="5" />
        <circle cx="26" cy="26" r={R} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${((pct || 0) / 100) * L} ${L}`} transform="rotate(-90 26 26)" />
        <text x="26" y="29.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ink)">{pct === null ? '–' : pct}</text>
      </svg>
      <span className="text-[9.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{label}</span>
    </div>
  );
}

function Path({ teamId }) {
  const t = teamById(teamId);
  const ups = upcomingMatches(teamId, 4).slice(1, 4);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2"><Crest team={t} size={18} /><span className="text-[12.5px] font-bold">{t ? t.name : ''}</span></div>
      <div className="grid grid-cols-3 gap-1.5">
        {ups.map((m) => {
          const oppId = m.homeId === teamId ? m.awayId : m.homeId;
          const opp = teamById(oppId);
          const rows = standings(opp ? opp.leagueId : m.leagueId, 'total');
          const i = rows.findIndex((r) => r.teamId === oppId);
          const frac = i >= 0 && rows.length > 1 ? i / (rows.length - 1) : null; // alto in classifica = avversario difficile
          const col = frac === null ? '#8A93A6' : bandColor(1 - frac);
          const [y, mo, d] = String(m.date).split('-').map(Number);
          return (
            <div key={m.id} className="flex flex-col items-center gap-1 rounded-[12px] py-2" style={{ background: `${col}1F`, boxShadow: `inset 0 -2px 0 ${col}` }}>
              <Crest team={opp} size={22} />
              <span className="text-[9.5px]" style={{ color: 'var(--ink-3)' }}>{new Date(y, mo - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '')} · {m.homeId === teamId ? 'C' : 'F'}</span>
              <span className="tnum text-[11px] font-bold">{i >= 0 ? `${i + 1}°` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IdeaSection({ match, home, away, concept = 'a' }) {
  const ok = home && away && hasMetrics(match.homeId) && hasMetrics(match.awayId);
  if (concept === 'b') {
    return (
      <section className="glass tint-card mx-4 overflow-hidden rounded-[24px] px-4 py-4">
        <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">Tendenze · ultime 10</h3>
        {[match.homeId, match.awayId].map((id, i) => (
          <div key={id} className="mt-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none', paddingTop: i ? 12 : 0 }}>
            <div className="mb-2 flex items-center gap-2"><Crest team={teamById(id)} size={18} /><span className="text-[12.5px] font-bold">{teamById(id) ? teamById(id).name : ''}</span></div>
            <div className="grid grid-cols-4">{TREND.map(([l, fn]) => <Ring key={l} label={l} pct={rate(id, fn)} />)}</div>
          </div>
        ))}
      </section>
    );
  }
  if (concept === 'c') {
    return (
      <section className="glass tint-card mx-4 overflow-hidden rounded-[24px] px-4 py-4">
        <h3 className="mb-3 text-[12.5px] font-extrabold uppercase tracking-wider">Cammino dopo questa gara</h3>
        <div className="flex flex-col gap-4"><Path teamId={match.homeId} /><Path teamId={match.awayId} /></div>
        <p className="mt-3 text-[10px]" style={{ color: 'var(--ink-3)' }}>Colore = difficoltà dell'avversario in base alla classifica (verde facile, rosso difficile).</p>
      </section>
    );
  }
  return (
    <section className="glass tint-card mx-4 overflow-hidden rounded-[24px] px-4 py-4">
      <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">Duello in numeri</h3>
      {ok ? <div className="mt-2"><Radar home={home} away={away} /></div> : <p className="py-6 text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>Dati non disponibili</p>}
      <div className="mt-1 flex items-center justify-center gap-5 text-[11.5px] font-bold">
        <span className="flex items-center gap-1.5"><i className="h-[9px] w-[9px] rounded-full" style={{ background: "#E0443A" }} /><Crest team={home} size={16} />{home ? home.short : ""}</span>
        <span className="flex items-center gap-1.5"><i className="h-[9px] w-[9px] rounded-full" style={{ background: "#3B9DFF" }} /><Crest team={away} size={16} />{away ? away.short : ""}</span>
      </div>
      <p className="mt-1 text-center text-[10px]" style={{ color: 'var(--ink-3)' }}>Più il vertice è lontano dal centro, meglio si piazza la squadra in campionato su quella voce.</p>
    </section>
  );
}
