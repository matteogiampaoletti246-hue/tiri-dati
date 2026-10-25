import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import { Image } from '@/components/ui/image';
import { refereesOf } from '@/data/referees';
import { comma } from '@/lib/format';

const METRICS = [
  { key: 'y', label: 'Gialli', tot: 'yellows', avg: 'yellowsAvg' },
  { key: 'r', label: 'Rossi', tot: 'reds', avg: 'redsAvg' },
  { key: 'f', label: 'Falli', tot: 'fouls', avg: 'foulsAvg' },
  { key: 'p', label: 'Rigori', tot: 'penalties', avg: 'penaltiesAvg' },
  { key: 'g', label: 'Partite', tot: 'games', avg: 'games' },
];

export default function LeagueRefereesPanel({ leagueId }) {
  const [mode, setMode] = useState('avg');
  const list = refereesOf(leagueId);
  if (!list.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun arbitro disponibile</p>;
  const sections = METRICS.map((m) => ({
    id: m.key,
    group: 'Arbitri',
    title: mode === 'avg' && m.key !== 'g' ? `${m.label} a partita` : m.label,
    rows: list
      .map((r) => ({ r, v: mode === 'avg' ? r[m.avg] : r[m.tot] }))
      .sort((a, b) => b.v - a.v)
      .map(({ r, v }) => ({
        id: r.id,
        to: `/arbitro/${r.id}`,
        left: <span className="avatar h-[30px] w-[30px] text-[10px]">{r.photo ? <Image src={r.photo} alt={r.name} className="h-full w-full" fittingType="fill" /> : r.name.slice(0, 1)}</span>,
        name: r.name,
        sub: `${r.country || ''}${r.country ? ' · ' : ''}${r.games} gare`,
        value: Number.isInteger(v) ? String(v) : comma(v, 2),
      })),
  }));
  return (
    <StatLists
      sections={sections}
      controls={<TextFilter options={[{ value: 'avg', label: 'A partita' }, { value: 'tot', label: 'Totale' }]} value={mode} onChange={setMode} />}
    />
  );
}
