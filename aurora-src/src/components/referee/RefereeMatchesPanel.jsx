import PanelTitle from '@/components/PanelTitle';
import MatchDayList from '@/components/MatchDayList';
import { matchesByReferee } from '@/data/extras';

export default function RefereeMatchesPanel({ refereeId }) {
  const list = matchesByReferee(refereeId);

  return (
    <div>
      <div className="px-5 pt-3">
        <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{list.length}</span>}>
          Dirette
        </PanelTitle>
      </div>
      {list.length ? (
        <MatchDayList matches={list} />
      ) : (
        <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Nessuna partita
        </p>
      )}
    </div>
  );
}
