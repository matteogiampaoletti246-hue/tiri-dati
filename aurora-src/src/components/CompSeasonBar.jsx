import CompSelect from '@/components/CompSelect';
import Dropdown from '@/components/archive/Dropdown';
import { seasonLabel } from '@/data/archive';

// Riga con la tendina della competizione e, accanto, quella delle stagioni (se ce ne sono di passate).
export default function CompSeasonBar({ comps, comp, onComp, allLabel = null, seasons = [], season, onSeason }) {
  const opts = seasons.length ? [{ key: 'cur', label: 'Stagione attuale' }, ...seasons.map((s) => ({ key: s, label: seasonLabel(s) }))] : null;
  return (
    <div className="relative z-[25] flex flex-wrap items-center gap-2 px-4 pb-1 pt-3" data-no-swipe="true">
      {comps && comps.length ? <CompSelect inline options={comps} value={comp} onChange={onComp} allLabel={allLabel} /> : null}
      {opts ? <Dropdown options={opts} value={season || 'cur'} onChange={onSeason} width={190} /> : null}
    </div>
  );
}
