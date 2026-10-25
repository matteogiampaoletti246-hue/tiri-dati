import { useEffect, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import TextFilter from '@/components/TextFilter';
import { teamById } from '@/data/teams';
import { LINE_OPTIONS, SEDE_OPTIONS, SHOTS_OPTIONS, computeTeamResult, fmtLine, lineHintText, parseNum } from '@/lib/calc';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import ResultCard from './ResultCard';
import TeamBlock from './TeamBlock';

const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });

const initialForm = () => ({
  tipoTiri: 'totali',
  lineType: 'over',
  line: '9,5',
  odds: '',
  sede: 'neutro',
  team: emptyBlock(),
  opp: emptyBlock(),
});

export default function TeamTab({ onSave }) {
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const id = setTimeout(() => setSaved(false), 2600);
    return () => clearTimeout(id);
  }, [saved]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setBlock = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));

  const team = teamById(form.team.id);
  const opp = teamById(form.opp.id);
  const family = form.tipoTiri;
  const line = parseNum(form.line);
  const odds = parseNum(form.odds);

  const result = computeTeamResult({
    teamFor: parseNum(form.team[family]),
    teamOpp: parseNum(form.opp[family]),
    sede: form.sede,
    line,
    lineType: form.lineType,
    odds,
  });

  const play = () => {
    if (!result.ready) return;
    const sedeLabel = SEDE_OPTIONS.find((o) => o.value === form.sede)?.label ?? '';
    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      kind: 'team',
      title: team && opp ? `${team.name} – ${opp.name}` : 'Media tiri squadra',
      subtitle: `${form.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(line)} ${family === 'inPorta' ? 'tiri in porta' : 'tiri'} · ${sedeLabel}`,
      score: result.score,
      probModel: result.probModel,
      probFinal: result.probFinal,
      odds,
      impliedProb: result.impliedProb,
      tierLabel: result.tier.label,
      tierValue: result.tier.value,
      comboValue: result.combo.value,
      comboLabel: result.combo.label,
      stake: result.stake.stake,
      lambda: result.lambda,
      line,
      lineType: form.lineType,
      hitLabel: null,
      note: result.note.text,
      sede: form.sede,
    });
    setSaved(true);
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <TeamBlock title="Squadra" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
      <div className="mt-7">
        <TeamBlock title="Avversario" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
      </div>

      <div className="mt-7">
        <PanelTitle>Giocata</PanelTitle>
        <div className="panel overflow-hidden">
          <FieldRow label="Tipo tiri" first noSwipe>
            <TextFilter options={SHOTS_OPTIONS} value={form.tipoTiri} onChange={(v) => set('tipoTiri', v)} />
          </FieldRow>
          <FieldRow label="Tipo linea" noSwipe>
            <TextFilter options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} />
          </FieldRow>
          <FieldRow label="Valore linea" hint={lineHintText(result.lambda, line)}>
            <NumInput value={form.line} onChange={(v) => set('line', v)} ariaLabel="Valore linea" />
          </FieldRow>
          <FieldRow label="Quota">
            <NumInput value={form.odds} onChange={(v) => set('odds', v)} ariaLabel="Quota" />
          </FieldRow>
          <FieldRow label="Sede" noSwipe>
            <TextFilter options={SEDE_OPTIONS} value={form.sede} onChange={(v) => set('sede', v)} />
          </FieldRow>
        </div>
      </div>

      <div className="mt-7">
        <PanelTitle>Risultato</PanelTitle>
        <p className="mb-3 text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
          {team && opp ? `${team.name} contro ${opp.name}` : 'Completa i campi per il calcolo'}
        </p>
        <ResultCard result={result} kind="team" onPlay={play} saved={saved} />
      </div>
    </div>
  );
}
