import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import PlayerRow from '@/components/PlayerRow';
import { PLAYERS } from '@/data/players';
import { teamsOf } from '@/data/teams';
import { comma } from '@/lib/format';

const fmt = (v) => (Number.isInteger(v) ? String(v) : comma(v, 2));

const METRICS = [
  { key: 'goals', label: 'Gol', value: (p) => p.goals },
  { key: 'assists', label: 'Assist', value: (p) => p.assists },
  { key: 'rating', label: 'Voto', value: (p) => p.ultime5 },
  { key: 'xg', label: 'xG', value: (p) => p.xg },
  { key: 'shots', label: 'Tiri', value: (p) => p.shots },
];

export default function LeaguePlayersPanel({ leagueId }) {
  const [metricKey, setMetricKey] = useState('goals');
  const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];
  const ids = new Set(teamsOf(leagueId).map((t) => t.id));
  const list = PLAYERS.filter((p) => ids.has(p.teamId))
    .map((p) => ({ player: p, value: metric.value(p) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 25);

  return (
    <div className="pt-2">
      <div className="px-5">
        <TextFilter options={METRICS.map((m) => ({ value: m.key, label: m.label }))} value={metricKey} onChange={setMetricKey} />
      </div>
      <div className="mt-3">
        {list.map((row, i) => (
          <PlayerRow
            key={row.player.id}
            player={row.player}
            rank={i + 1}
            value={fmt(row.value)}
            valueLabel={metric.label}
            divider={i > 0}
            link
          />
        ))}
      </div>
    </div>
  );
}
