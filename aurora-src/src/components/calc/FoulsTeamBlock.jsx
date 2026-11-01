import TintSweep from './TintSweep';
import { useState } from 'react';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import { calcLeagues, calcTeamsOf, leagueName } from '@/data/calcData';
import { teamById, teamByName } from '@/data/teams';
import { comma } from '@/lib/format';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import SelectRow from './SelectRow';
import StatBox from './StatBox';

// Squadra nel calcolo dei falli: campionato, squadra, media della statistica scelta (con posizione) e riquadri casa / trasferta.
export default function FoulsTeamBlock({ title, statLabel, block, stats, value, onValue, onChange, tint }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const leagueOptions = calcLeagues().map((l) => ({ value: l.id, label: l.name, sub: l.cup ? 'Coppa europea' : '' }));
  const teamOptions = calcTeamsOf(block.leagueId)
    .map((n) => teamByName(n))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId), avatar: <Crest team={t} size={26} /> }));
  const boxes = stats ? [['Casa', stats.casa], ['Trasferta', stats.trasferta]].filter((b) => b[1] !== null && b[1] !== undefined) : [];
  return (
    <section>
      <PanelTitle>{title}</PanelTitle>
      <div className="panel has-tint overflow-hidden">
        <TintSweep tint={tint} />
        <SelectRow first label="Campionato" value={leagueName(block.leagueId)} onClick={() => setPicker('league')} />
        <SelectRow label="Squadra" value={team ? team.name : null} avatar={team ? <Crest team={team} size={22} /> : null} onClick={() => setPicker('team')} />
        <FieldRow label={statLabel}>
          {stats && stats.rank ? <span className="tnum whitespace-nowrap text-[15px] font-extrabold">{stats.rank.r}° <span className="text-[10.5px] font-normal" style={{ color: 'var(--ink-3)' }}>su {stats.rank.size}</span></span> : null}
          <NumInput value={value} onChange={onValue} ariaLabel={statLabel} />
        </FieldRow>
        {stats ? (
          <div className="px-5 pb-5 pt-2">
            {stats.mix ? <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>Media tra campionato ({comma(stats.mix[0].v, 2)}) e coppa ({comma(stats.mix[1].v, 2)})</p> : null}
            {boxes.length ? <div className={`${stats.mix ? 'mt-3' : ''} flex gap-2`}>{boxes.map((b) => <StatBox key={b[0]} label={b[0]} value={comma(b[1], 1)} />)}</div> : null}
          </div>
        ) : null}
      </div>
      <PickerSheet open={picker === 'league'} title="Campionato" options={leagueOptions} onSelect={(o) => onChange({ leagueId: o.value, id: null })} onClose={() => setPicker(null)} />
      <PickerSheet open={picker === 'team'} title="Squadra" placeholder="Cerca squadra" options={teamOptions} onSelect={(o) => onChange({ id: o.value })} onClose={() => setPicker(null)} />
    </section>
  );
}
