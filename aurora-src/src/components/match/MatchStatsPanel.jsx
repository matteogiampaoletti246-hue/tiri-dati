import PanelTitle from '@/components/PanelTitle';
import CompareBars from '@/components/CompareBars';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { CATEGORY_DEFS, metricOf } from '@/data/standings';
import { comma, num } from '@/lib/format';

const LIVE_STATS = [
  { key: 'possesso', label: 'Possesso', format: (v) => `${comma(v, 0)}%` },
  { key: 'xg', label: 'xG', format: (v) => comma(v, 2) },
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'Tiri in porta' },
  { key: 'occasioni', label: 'Occasioni nitide' },
  { key: 'corner', label: 'Corner' },
  { key: 'falli', label: 'Falli' },
  { key: 'cartellini', label: 'Cartellini' },
  { key: 'passaggi', label: 'Passaggi' },
  { key: 'fuorigioco', label: 'Fuorigioco' },
];

export default function MatchStatsPanel({ match, view, home, away, pre }) {
  if (pre) {
    return (
      <div className="flex flex-col gap-7 pt-2">
        <div className="flex items-center gap-2 px-5">
          <TeamLink team={home} className="flex min-w-0 items-center gap-2 transition-opacity active:opacity-60">
            <Crest team={home} size={20} />
            <span className="truncate text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
              {home ? home.name : ''}
            </span>
          </TeamLink>
          <TeamLink
            team={away}
            className="ml-auto flex min-w-0 items-center gap-2 transition-opacity active:opacity-60"
          >
            <span className="truncate text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
              {away ? away.name : ''}
            </span>
            <Crest team={away} size={20} />
          </TeamLink>
        </div>
        {CATEGORY_DEFS.map((cat) => (
          <section key={cat.key} className="px-5">
            <PanelTitle>{cat.title}</PanelTitle>
            <CompareBars
              rows={cat.metrics.map((mt) => ({
                label: mt.label,
                home: metricOf(match.homeId, mt.key),
                away: metricOf(match.awayId, mt.key),
              }))}
              format={num}
            />
          </section>
        ))}
      </div>
    );
  }

  const stats = view.stats || {};
  const rows = LIVE_STATS.filter((s) => stats[s.key]).map((s) => ({
    label: s.label,
    home: stats[s.key][0],
    away: stats[s.key][1],
    format: s.format || num,
  }));

  return (
    <div className="px-5 pt-4">
      <CompareBars rows={rows} />
    </div>
  );
}
