import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import StatLists from '@/components/stats/StatLists';
import { teamGrad } from '@/lib/tint';
import Crest from '@/components/Crest';
import { teamsOf } from '@/data/teams';
import { CATEGORY_DEFS, hasMetrics, metricOf } from '@/data/standings';
import { comma } from '@/lib/format';

// Classifiche delle statistiche di squadra (medie a partita), come nella vecchia app.
export default function LeagueTeamsPanel({ leagueId }) {
  const [part, setPart] = useState(0);
  const teams = teamsOf(leagueId).filter((t) => hasMetrics(t.id));
  const sections = [];
  CATEGORY_DEFS.forEach((cat) =>
    cat.metrics.forEach((mt) => {
      const rows = teams
        .map((t) => ({ t, v: metricOf(t.id, mt.key, part) }))
        .sort((a, b) => b.v - a.v)
        .map(({ t, v }) => ({ id: t.id, to: `/squadra/${t.id}`, left: <Crest team={t} size={24} />, name: t.name, bg: teamGrad(t, 0x55), value: comma(v, 2) }));
      sections.push({ id: mt.key, group: cat.title, title: mt.label, rows });
    }),
  );
  if (!teams.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche non ancora disponibili</p>;
  return (
    <StatLists
      sections={sections}
      controls={<TextFilter options={[{ value: 0, label: 'Totale' }, { value: 1, label: 'Casa' }, { value: 2, label: 'Trasferta' }]} value={part} onChange={setPart} />}
    />
  );
}
