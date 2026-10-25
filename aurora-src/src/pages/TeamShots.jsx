import { useState } from 'react';
import PageShell from '@/components/PageShell';
import ListHeader from '@/components/ListHeader';
import TextFilter from '@/components/TextFilter';
import SearchOverlay from '@/components/SearchOverlay';
import Skeleton from '@/components/Skeleton';
import TeamShotsTable, { SHOT_COLUMNS } from '@/components/shots/TeamShotsTable';
import useInitialLoad from '@/hooks/useInitialLoad';
import { LEAGUES } from '@/data/leagues';

const METRICS = [
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'In porta' },
  { key: 'tiriFuori', label: 'Fuori' },
  { key: 'tiriFuoriArea', label: 'Da fuori' },
  { key: 'xg', label: 'xG' },
  { key: 'corner', label: 'Corner' },
];

export default function TeamShots() {
  const [leagueId, setLeagueId] = useState('serie-a');
  const [metricKey, setMetricKey] = useState('tiri');
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();

  return (
    <PageShell>
      <ListHeader title="Tiri Squadre" subtitle="Tiri e xG per campionato" onSearch={() => setSearchOpen(true)} />

      <div className="px-5 pt-2">
        <TextFilter options={LEAGUES.map((l) => ({ value: l.id, label: l.name }))} value={leagueId} onChange={setLeagueId} />
      </div>

      <div className="mt-4 px-5">
        <p className="label-sm mb-3">Ordina per</p>
        <TextFilter options={METRICS.map((m) => ({ value: m.key, label: m.label }))} value={metricKey} onChange={setMetricKey} />
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3 px-5 pt-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[42px] w-full" />
            ))}
          </div>
        ) : (
          <TeamShotsTable leagueId={leagueId} sortKey={metricKey} />
        )}
      </div>

      <p className="px-5 pt-4 text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
        {SHOT_COLUMNS.map((c) => c.label).join(' · ')}
      </p>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}
