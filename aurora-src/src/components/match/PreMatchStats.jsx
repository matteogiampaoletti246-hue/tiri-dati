import { useState } from 'react';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { teamsOf } from '@/data/teams';
import { hasMetrics, metricOf } from '@/data/standings';
import { bandColor } from '@/components/player/playerCalc';
import { comma } from '@/lib/format';

const cptOf = () => { try { return 'a'; } catch { return 'a'; } };
// [statistica fatta, stessa statistica subita dall'avversaria, etichetta]
const PAIRS = [
  ['gol', 'golSubiti', 'Gol'],
  ['xg', 'xgSubiti', 'xG'],
  ['tiri', 'tiriConcessi', 'Tiri'],
  ['tiriInPorta', 'tiriInPortaConcessi', 'Tiri in porta'],
  ['occasioni', 'occasioniConcesse', 'Occasioni nitide'],
  ['corner', 'cornerConcessi', 'Corner'],
  ['falli', 'fallisubiti', 'Falli'],
];
const rk = (team, key) => {
  const rows = teamsOf(team.leagueId).filter((t) => hasMetrics(t.id)).map((t) => ({ id: t.id, v: metricOf(t.id, key) })).sort((a, b) => b.v - a.v);
  const i = rows.findIndex((r) => r.id === team.id);
  return { rank: i + 1, total: rows.length, v: metricOf(team.id, key), max: rows.length ? rows[0].v : 1 };
};
const frac = (r) => (r.total > 1 ? (r.total - r.rank) / (r.total - 1) : 1);
const f2 = (v) => comma(v, 2);
const ord = (r) => `${r.rank}º`;

function build(me, op) {
  const rows = PAIRS.map(([a, b, label]) => {
    const m = rk(me, a);
    const o = rk(op, b);
    return { key: a, label, m, o, s: (frac(m) + frac(o)) / 2, hl: a !== 'falli' };
  });
  const best = rows.filter((r) => r.hl && frac(r.m) >= 0.6 && frac(r.o) >= 0.6).sort((x, y) => y.s - x.s).slice(0, 3);
  return { rows, best };
}

const Pill = ({ r }) => (
  <span className="tnum rounded-full px-1.5 py-[1px] text-[10px] font-extrabold text-white" style={{ background: bandColor(frac(r)) }}>{ord(r)}</span>
);

function TeamTable({ me, op, concept, side }) {
  if (!me || !op || !hasMetrics(me.id) || !hasMetrics(op.id)) return null;
  const { rows, best } = build(me, op);
  const isBest = (k) => best.some((b) => b.key === k);
  const head = (
    <div className="flex items-center gap-2.5 px-4 pb-2 pt-3.5">
      <Crest team={me} size={26} />
      <div className="min-w-0 flex-1">
        <TeamLink team={me} className="block truncate text-[14.5px] font-extrabold">{me.name}</TeamLink>
        <p className="truncate text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{side} · {me.short || me.name} fatti vs {op.short || op.name} subiti</p>
      </div>
      <Crest team={op} size={20} />
    </div>
  );
  const colHead = (
    <div className="grid items-center gap-2 px-4 pb-1 text-[9.5px] font-bold uppercase tracking-[.08em]" style={{ gridTemplateColumns: '1fr 74px 74px', color: 'var(--ink-3)' }}>
      <span>Statistica</span><span className="text-right">{me.short || me.name} fatti</span><span className="text-right">{op.short || op.name} subiti</span>
    </div>
  );

  const bestBox = best.length ? (
    concept === 'a' ? (
      <div className="mx-4 mb-3 rounded-[18px] px-3.5 py-3" style={{ background: 'var(--accent-soft)', border: '1px solid var(--glass-border)' }}>
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Punti forti del match</p>
        {best.map((b) => (
          <div key={b.key} className="flex items-center gap-2 py-[3px] text-[12.5px]">
            <span className="font-bold">{b.label}</span>
            <span className="ml-auto flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}><Pill r={b.m} />fatti<span style={{ color: 'var(--ink-3)' }}>vs</span><Pill r={b.o} />subiti</span>
          </div>
        ))}
      </div>
    ) : concept === 'b' ? (
      <div className="mx-4 mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${best.length}, 1fr)` }}>
        {best.map((b) => (
          <div key={b.key} className="rounded-[16px] px-2 py-2.5 text-center" style={{ background: 'var(--accent-soft)', border: '1px solid var(--glass-border)' }}>
            <p className="text-[10px] font-bold" style={{ color: 'var(--ink-3)' }}>{b.label}</p>
            <p className="tnum mt-0.5 text-[16px] font-extrabold leading-none" style={{ color: 'var(--accent)' }}>{ord(b.m)} <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>↔</span> {ord(b.o)}</p>
            <p className="mt-1 text-[9px] leading-tight" style={{ color: 'var(--ink-3)' }}>{b.label.toLowerCase()} fatti vs subiti</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="mx-4 mb-3">
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Top del match</p>
        {best.map((b, i) => (
          <div key={b.key} className="flex items-center gap-2.5 py-1.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <span className="tnum flex h-[20px] w-[20px] items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>{i + 1}</span>
            <span className="text-[13px] font-bold">{b.label}</span>
            <span className="tnum ml-auto text-[12px]" style={{ color: 'var(--ink-2)' }}>{ord(b.m)} fatti · {ord(b.o)} subiti</span>
          </div>
        ))}
      </div>
    )
  ) : null;

  const body = rows.map((r) => {
    const hot = isBest(r.key);
    if (concept === 'b') {
      const w1 = r.m.max > 0 ? (r.m.v / r.m.max) * 100 : 0;
      const w2 = r.o.max > 0 ? (r.o.v / r.o.max) * 100 : 0;
      return (
        <div key={r.key} className="px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)', background: hot ? 'var(--accent-soft)' : 'transparent' }}>
          <p className="mb-1.5 text-[12px] font-bold">{r.label}{hot ? <span className="ml-1.5" style={{ color: 'var(--accent)' }}>★</span> : null}</p>
          {[[r.m, w1, 'var(--accent)', 'fa'], [r.o, w2, '#FF8A1F', 'subisce']].map(([x, w, c, t]) => (
            <div key={t} className="mb-1 flex items-center gap-2">
              <span className="w-[44px] text-[9.5px]" style={{ color: 'var(--ink-3)' }}>{t}</span>
              <span className="h-[7px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}><i className="block h-full rounded-full" style={{ width: `${Math.max(4, w)}%`, background: c }} /></span>
              <span className="tnum w-[34px] text-right text-[12px] font-extrabold">{f2(x.v)}</span>
              <span className="w-[30px] text-right"><Pill r={x} /></span>
            </div>
          ))}
        </div>
      );
    }
    if (concept === 'c') {
      return (
        <div key={r.key} className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <i className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: bandColor(r.s) }} />
          <span className="w-[92px] shrink-0 text-[12.5px] font-bold">{r.label}</span>
          <span className="tnum flex-1 text-right text-[12.5px] font-extrabold">{f2(r.m.v)} <span className="text-[10px] font-semibold" style={{ color: 'var(--ink-3)' }}>{ord(r.m)}</span></span>
          <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>vs</span>
          <span className="tnum flex-1 text-[12.5px] font-extrabold">{f2(r.o.v)} <span className="text-[10px] font-semibold" style={{ color: 'var(--ink-3)' }}>{ord(r.o)}</span></span>
        </div>
      );
    }
    return (
      <div key={r.key} className="relative grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1fr 74px 74px', borderTop: '1px solid var(--hair-2)', background: hot ? 'var(--accent-soft)' : 'transparent' }}>
        {hot ? <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full" style={{ background: 'var(--accent)' }} /> : null}
        <span className="text-[12.5px] font-semibold">{r.label}</span>
        <span className="flex items-center justify-end gap-1.5"><span className="tnum text-[12.5px] font-extrabold">{f2(r.m.v)}</span><Pill r={r.m} /></span>
        <span className="flex items-center justify-end gap-1.5"><span className="tnum text-[12.5px] font-extrabold">{f2(r.o.v)}</span><Pill r={r.o} /></span>
      </div>
    );
  });

  return (
    <section className="glass mx-4 overflow-hidden rounded-[24px] pb-1">
      {head}
      {bestBox}
      {concept === 'a' ? colHead : null}
      {concept === 'c' ? (
        <div className="flex items-center gap-2 px-4 pb-1 text-[9.5px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>
          <span className="w-[101px]" /><span className="flex-1 text-right">{me.short || me.name} fa</span><span className="w-[16px]" /><span className="flex-1">{op.short || op.name} subisce</span>
        </div>
      ) : null}
      {body}
    </section>
  );
}

export default function PreMatchStats({ home, away, concept = cptOf() }) {
  const [, force] = useState(0);
  void force;
  if (!home || !away) return null;
  const ok = hasMetrics(home.id) && hasMetrics(away.id);
  if (!ok) return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche non disponibili per questa partita</p>;
  return (
    <div className="flex flex-col gap-5 pb-4 pt-3">
      <TeamTable me={home} op={away} concept={concept} side="In casa" />
      <TeamTable me={away} op={home} concept={concept} side="In trasferta" />
    </div>
  );
}
