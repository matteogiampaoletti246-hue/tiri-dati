import { teamGrad } from '@/lib/tint';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { primeKeyboard } from '@/lib/keyboard';
import { useMemo, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import TextFilter from '@/components/TextFilter';
import { PLAYERS } from '@/data/players';
import { teamById } from '@/data/teams';
import { COMPETITION_OPTIONS, HIT_OPTIONS, LINE_OPTIONS, SEDE_OPTIONS, SHOTS_OPTIONS } from '@/lib/calc';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import MiniSelect from './MiniSelect';
import Crest from '@/components/Crest';
import { PlayerFace } from '@/components/SearchOverlay';
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
        return {
          value: p.id,
          label: p.name,
          sub: t ? t.name : p.teamName || '',
          avatar: <PlayerFace p={p} size={52} />,
          bg: teamGrad(t, 0x55),
          subNode: (
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
              {t ? <Crest team={t} size={14} /> : null}
              <span className="truncate">{t ? t.name : p.teamName}</span>
            </span>
          ),
        };
      }),
    [],
  );

  return (
    <section>
      <PanelTitle>Giocatore</PanelTitle>
      <div className="panel relative z-10">
        {player ? (
          <button
            type="button"
            onClick={() => { primeKeyboard(); setPicker('player'); }}
            className="press flex w-full items-center gap-3 px-4 py-3.5 text-left"
            style={{ background: team ? `linear-gradient(110deg, ${team.colors[0]}8c, ${team.colors[1]}40 70%, transparent)` : undefined, borderRadius: 'inherit', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <PlayerFace p={player} size={56} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[17px] font-extrabold"><span className="truncate">{player.name}</span>{injuryOf(player.id) ? <InjuryIcon size={17} /> : null}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                {team ? <Crest team={team} size={15} /> : null}
                <span className="truncate">{team ? team.name : player.teamName}</span>
              </span>
            </span>
            <span className="text-[12px] font-bold" style={{ color: 'var(--accent)' }}>Cambia</span>
          </button>
        ) : (
          <SelectRow
            first
            label="Giocatore"
            value={null}
            sub={null}
            placeholder="Cerca e seleziona"
            onClick={() => { primeKeyboard(); setPicker('player'); }}
          />
        )}
        <FieldRow label="Tipo tiri" noSwipe>
          <TextFilter options={SHOTS_OPTIONS} value={form.tipoTiri} onChange={(v) => set('tipoTiri', v)} />
        </FieldRow>
        <FieldRow label="Tipo linea" noSwipe>
          <TextFilter options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} />
        </FieldRow>
        <FieldRow label="Valore linea" hint={hint}>
          <MiniSelect
            ariaLabel="Valore linea"
            width={96}
            value={form.line}
            onChange={(v) => set('line', v)}
            options={['0,5', '1,5', '2,5', '3,5'].map((x) => ({ value: x, label: x }))}
          />
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
        <FieldRow label="Hit rate ultime 5">
          <MiniSelect
            ariaLabel="Hit rate ultime 5"
            width={124}
            value={form.hitRate}
            placeholder="Nessuna"
            onChange={(v) => set('hitRate', v)}
            options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]}
          />
        </FieldRow>
      </div>

      <PickerSheet
        open={picker === 'player'}
        title="Giocatore"
        placeholder="Cerca giocatore o squadra"
        cards
        requireQuery
        hint="Cerca per nome o per squadra, poi tocca per selezionare."
        options={playerOptions}
        onSelect={(o) => onSelectPlayer(o.value)}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
