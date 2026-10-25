import PanelTitle from '@/components/PanelTitle';
import { CATEGORY_DEFS, metricOf, rankLabel } from '@/data/standings';
import { num } from '@/lib/format';

export default function TeamStatsPanel({ team }) {
  return (
    <div className="flex flex-col gap-7 pt-3">
      {CATEGORY_DEFS.map((cat) => (
        <section key={cat.key} className="px-5">
          <PanelTitle>{cat.title}</PanelTitle>
          <div className="panel-solid px-4 py-1">
            {cat.metrics.map((mt, i) => (
              <div
                key={mt.key}
                className="flex items-center gap-3 py-2.5"
                style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
                  {mt.label}
                </span>
                <span className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                  {num(metricOf(team.id, mt.key))}
                </span>
                <span className="w-[62px] text-right text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
                  {rankLabel(team.leagueId, mt.key, team.id)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
