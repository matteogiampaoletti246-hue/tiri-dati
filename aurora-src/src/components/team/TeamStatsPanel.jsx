import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import PanelTitle from '@/components/PanelTitle';
import { CATEGORY_DEFS, TILE_METRICS, metricOf } from '@/data/standings';
import { teamsOf } from '@/data/teams';
import { hasMetrics } from '@/data/standings';
import { comma } from '@/lib/format';
import { bandColor } from '@/components/player/playerCalc';

// statistiche negative: meno ce ne sono, meglio e' (subiti/concessi e fuorigioco)
export const NEG = ['golSubiti', 'xgSubiti', 'tiriConcessi', 'tiriInPortaConcessi', 'occasioniConcesse', 'cornerConcessi', 'fuorigioco'];
const rankIn = (team, key, part) => {
  const rows = teamsOf(team.leagueId).filter((t) => hasMetrics(t.id)).map((t) => ({ id: t.id, v: metricOf(t.id, key, part) })).sort((a, b) => (NEG.includes(key) ? a.v - b.v : b.v - a.v));
  const i = rows.findIndex((r) => r.id === team.id);
  const total = rows.length;
  const avg = total ? rows.reduce((a, r) => a + r.v, 0) / total : 0;
  const max = rows.reduce((m, r) => Math.max(m, r.v), 0);
  return { rank: i + 1, total, avg, max, frac: total > 1 ? (total - (i + 1)) / (total - 1) : 1 };
};
const badge = (r, t, frac) => bandColor(frac !== undefined ? frac : t > 1 ? (t - r) / (t - 1) : 1);

// Statistiche della squadra (medie a partita) con posizione in campionato.
export default function TeamStatsPanel({ team }) {
  const [part, setPart] = useState(0);
  const [cat, setCat] = useState('all');
  const cats = CATEGORY_DEFS.filter((c) => cat === 'all' || c.key === cat);
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      <div className="grid grid-cols-4 gap-2 px-4">
        {TILE_METRICS.slice(0, 4).map((t) => {
          const r = rankIn(team, t.key, part);
          return (
            <div key={t.key} className="glass rounded-[18px] px-2 py-2.5 text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{t.label}</p>
              <p className="tnum mt-1 text-[17px] font-extrabold">{comma(metricOf(team.id, t.key, part), t.key === 'possesso' ? 0 : 1)}{t.key === 'possesso' ? '%' : ''}</p>
              <span className="tnum mt-1 inline-block rounded-full px-2 py-[1px] text-[10px] font-extrabold text-white" style={{ background: badge(r.rank, r.total, r.frac) }}>{r.rank}°</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 px-4">
        <TextFilter options={[{ value: 0, label: 'Totale' }, { value: 1, label: 'Casa' }, { value: 2, label: 'Trasferta' }]} value={part} onChange={setPart} />
        <TextFilter options={[{ value: 'all', label: 'Tutte' }, ...CATEGORY_DEFS.map((c) => ({ value: c.key, label: c.title }))]} value={cat} onChange={setCat} />
      </div>
      {cats.map((c) => (
        <section key={c.key} className="glass mx-4 overflow-hidden rounded-[24px]">
          <h3 className="px-4 pb-1 pt-3.5 text-[12.5px] font-extrabold uppercase tracking-wider">{c.title}</h3>
          {c.metrics.map((mt, i) => {
            const r = rankIn(team, mt.key, part);
            const v = metricOf(team.id, mt.key, part);
            const col = bandColor(r.frac);
            const top = Math.max(r.max * 1.08, r.avg * 1.6, 0.0001);
            const w = Math.max(3, Math.min(100, (v / top) * 100));
            const ax = Math.min(100, (r.avg / top) * 100);
            const lx = Math.min(88, Math.max(12, ax));
            return (
              <div key={mt.key} className="px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{mt.label}</span>
                  <span className="tnum rounded-full text-[14px] font-extrabold" style={{ color: col, background: `${col}26`, padding: '1px 9px' }}>{comma(v, 2)}</span>
                  <span className="tnum w-[34px] text-right text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>{r.rank}°</span>
                </div>
                <div className="relative" style={{ marginTop: 20, height: 9 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: 'var(--hair-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${col}88, ${col})` }} />
                  </div>
                  <span className="absolute" style={{ left: `${ax}%`, top: -5, bottom: -5, borderLeft: '2px dashed var(--ink)', opacity: 0.85 }} />
                  <span className="tnum absolute whitespace-nowrap text-[9.5px] font-bold leading-none" style={{ left: `${lx}%`, top: -21, transform: 'translateX(-50%)', color: 'var(--ink-2)', background: 'var(--hair-2)', padding: '2px 5px', borderRadius: 6 }}>media {comma(r.avg, 2)}</span>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
