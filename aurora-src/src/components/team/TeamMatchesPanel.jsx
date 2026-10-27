import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import MatchDayList from '@/components/MatchDayList';
import { allTeamMatches } from '@/data/extras';
import CompSelect from '@/components/CompSelect';
import { teamCompetitions } from '@/data/competitions';
import { PastTeamMatches } from '@/components/past/PastMatches';
import { useSeasonList, announceComp } from '@/components/past/PastBits';
import { FM_ID, teamIdByName } from '@/data/archive';
import { leagueTint } from '@/data/leagues';
import { teamById } from '@/data/teams';

const MATCH = {
  all: () => true,
  results: (m) => m.status === 'finished',
  upcoming: (m) => m.status !== 'finished',
};

export default function TeamMatchesPanel({ teamId }) {
  const [filter, setFilter] = useState('all');
  const [comp, setComp] = useState('all');
  const comps = teamCompetitions(teamId);
  const team = teamById(teamId);
  const fm = FM_ID[team && team.leagueId];
  const seasons = useSeasonList(fm);
  const shown = allTeamMatches(teamId).filter(MATCH[filter]).filter((m) => comp === 'all' || m.leagueId === comp);

  return (
    <div className="pt-0">
      <CompSelect options={comps} value={comp} onChange={(c) => { setComp(c); announceComp(teamId, c); }} allLabel="Tutte le competizioni" />
      <div className="px-5 pt-2">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'results', label: 'Risultati' },
            { value: 'upcoming', label: 'Programmate' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {shown.length ? (
        <div key={comp + filter} className="comp-in"><MatchDayList matches={shown} teamId={teamId} /></div>
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}
      {fm && seasons.length && filter !== 'upcoming' && (comp === 'all' || comp === team.leagueId) ? <PastTeamMatches fm={fm} seasons={seasons} teamName={team.name} tint={leagueTint(team.leagueId)} teamIdByName={teamIdByName} /> : null}
    </div>
  );
}
