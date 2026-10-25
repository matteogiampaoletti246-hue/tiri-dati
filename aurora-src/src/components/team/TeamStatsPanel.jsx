import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import PanelTitle from '@/components/PanelTitle';
import { CATEGORY_DEFS, TILE_METRICS, metricOf } from '@/data/standings';
import { teamsOf } from '@/data/teams';
import { hasMetrics } from '@/data/standings';
import { comma } from '@/lib/format';

const rankIn = (team, key, part) => {
  const rows = teamsOf(team.leagueId).filter((t) => hasMetrics(t.id)).map((t) => ({ id: t.id, v: metricOf(t.id, key, part) })).sort((a, b) => b.v - a.v);
  const i = rows.findIndex((r) => r.id === team.id);
  return { rank: i + 1, total: rows.length };
};
const badge = (r, t) => (r < t / 3 ? '#1FA45B' : r < (2 * t) / 3 ? '#E0B400' : '#E5484D');

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
              <span className="tnum mt-1 inline-block rounded-full px-2 py-[1px] text-[10px] font-extrabold text-white" style={{ background: badge(r.rank, r.total) }}>{r.rank}°</span>
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
            return (
              <div key={mt.key} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
                <span className="min-w-0 flex-1 truncate text-[13.5px]">{mt.label}</span>
                <span className="tnum text-[15px] font-extrabold">{comma(metricOf(team.id, mt.key, part), 2)}</span>
                <span className="tnum w-[38px] rounded-full py-[2px] text-center text-[10.5px] font-extrabold text-white" style={{ background: badge(r.rank, r.total) }}>{r.rank}°</span>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
