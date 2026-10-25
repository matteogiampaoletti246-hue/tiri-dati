import { useState } from 'react';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import { LEAGUES } from '@/data/leagues';
import { teamById, teamsOf } from '@/data/teams';
import { leagueName, prefillShots, rankNote, splitBoxes, teamShots } from '@/data/calcData';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import SelectRow from './SelectRow';
import StatBox from './StatBox';

// Blocco squadra riusato nel calcolo: campionato, squadra, tiri (totali e in porta),
// nota di posizione e riquadri casa / trasferta / ultime 5.
export default function TeamBlock({ title, mode = 'for', family = 'totali', block, onChange }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const stats = teamShots(block.id);
  const boxes = splitBoxes(stats, mode, family);
  const shotsLabel = mode === 'against' ? 'Tiri concessi' : 'Tiri fatti';

  const leagueOptions = LEAGUES.map((l) => ({ value: l.id, label: l.name, sub: l.country }));
  const teamOptions = teamsOf(block.leagueId).map((t) => ({
    value: t.id,
    label: t.name,
    sub: leagueName(t.leagueId),
    avatar: <Crest team={t} size={26} />,
  }));

  return (
    <section>
      <PanelTitle right={<span className="label-sm">Nel calcolo: {family === 'inPorta' ? 'In porta' : 'Totali'}</span>}>{title}</PanelTitle>
      <div className="panel overflow-hidden">
        <SelectRow first label="Campionato" value={leagueName(block.leagueId)} onClick={() => setPicker('league')} />
        <SelectRow
          label="Squadra"
          value={team ? team.name : null}
          avatar={team ? <Crest team={team} size={22} /> : null}
          onClick={() => setPicker('team')}
        />
        <FieldRow label={`${shotsLabel} totali`}>
          <NumInput value={block.totali} onChange={(v) => onChange({ totali: v })} ariaLabel={`${shotsLabel} totali`} />
        </FieldRow>
        <FieldRow label={`${shotsLabel} in porta`}>
          <NumInput value={block.inPorta} onChange={(v) => onChange({ inPorta: v })} ariaLabel={`${shotsLabel} in porta`} />
        </FieldRow>

        {stats ? (
          <div className="px-5 pb-5 pt-2">
            <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
              {rankNote(stats, mode)}
            </p>
            <div className="mt-3 flex gap-2">
              {boxes.map((b) => (
                <StatBox key={b.label} label={b.label} value={b.value} />
              ))}
            </div>
          </div>
        ) : (
          <p className="px-5 pb-5 pt-2 text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
            Seleziona la squadra per medie, posizione in classifica e riquadri casa / trasferta.
          </p>
        )}
      </div>

      <PickerSheet
        open={picker === 'league'}
        title="Campionato"
        options={leagueOptions}
        onSelect={(o) => onChange({ leagueId: o.value, id: null, totali: '', inPorta: '' })}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === 'team'}
        title="Squadra"
        placeholder="Cerca squadra"
        options={teamOptions}
        onSelect={(o) => onChange({ id: o.value, ...prefillShots(teamShots(o.value), mode) })}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
