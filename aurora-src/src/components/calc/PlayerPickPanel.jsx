import { useMemo, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import TextFilter from '@/components/TextFilter';
import { PLAYERS } from '@/data/players';
import { teamById } from '@/data/teams';
import { COMPETITION_OPTIONS, HIT_OPTIONS, LINE_OPTIONS, SEDE_OPTIONS, SHOTS_OPTIONS } from '@/lib/calc';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import SelectRow from './SelectRow';

// Impostazioni di base della giocata su un giocatore.
export default function PlayerPickPanel({ form, set, player, hint, onSelectPlayer }) {
  const [picker, setPicker] = useState(null);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null;
  const team = player ? teamById(player.teamId) : null;

  const playerOptions = useMemo(
    () =>
      [...PLAYERS].sort((a, b) => a.name.localeCompare(b.name)).map((p) => {
        const t = teamById(p.teamId);
        return { value: p.id, label: p.name, sub: t ? `${t.name} · ${p.position}` : p.position };
      }),
    [],
  );

  return (
    <section>
      <PanelTitle>Giocatore</PanelTitle>
      <div className="panel overflow-hidden">
        <SelectRow
          first
          label="Giocatore"
          value={player ? player.name : null}
          sub={team ? team.name : null}
          placeholder="Cerca e seleziona"
          onClick={() => setPicker('player')}
        />
        <FieldRow label="Tipo tiri" noSwipe>
          <TextFilter options={SHOTS_OPTIONS} value={form.tipoTiri} onChange={(v) => set('tipoTiri', v)} />
        </FieldRow>
        <FieldRow label="Tipo linea" noSwipe>
          <TextFilter options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} />
        </FieldRow>
        <FieldRow label="Valore linea" hint={hint}>
          <NumInput value={form.line} onChange={(v) => set('line', v)} ariaLabel="Valore linea" />
        </FieldRow>
        <FieldRow label="Quota">
          <NumInput value={form.odds} onChange={(v) => set('odds', v)} ariaLabel="Quota" />
        </FieldRow>
        <FieldRow label="Sede" noSwipe>
          <TextFilter options={SEDE_OPTIONS} value={form.sede} onChange={(v) => set('sede', v)} />
        </FieldRow>
        <FieldRow label="Competizione" noSwipe>
          <TextFilter options={COMPETITION_OPTIONS} value={form.competizione} onChange={(v) => set('competizione', v)} />
        </FieldRow>
        <SelectRow label="Hit rate ultime 5" value={hitLabel} onClick={() => setPicker('hit')} />
      </div>

      <PickerSheet
        open={picker === 'player'}
        title="Giocatore"
        placeholder="Cerca giocatore o squadra"
        hint="Cerca per nome o per squadra, poi tocca per selezionare."
        options={playerOptions}
        onSelect={(o) => onSelectPlayer(o.value)}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === 'hit'}
        title="Hit rate ultime 5"
        options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]}
        onSelect={(o) => set('hitRate', o.value)}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
