import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PanelTitle from '@/components/PanelTitle';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { fixtureAt, nextFixture, prefillShots, teamShots } from '@/data/calcData';
import { fillFrom, initialForm, resultFromForm } from '@/data/calcPlayer';
import {
  COMPETITION_OPTIONS,
  HIT_OPTIONS,
  SEDE_OPTIONS,
  fmtLine,
  lineHintText,
  parseNum,
} from '@/lib/calc';
import PlayerLast5Panel from './PlayerLast5Panel';
import PlayerPickPanel from './PlayerPickPanel';
import PlayerSeasonPanel from './PlayerSeasonPanel';
import ResultCard from './ResultCard';
import TeamBlock from './TeamBlock';

const extra = { dashTarget: 'shots' };
const initial = () => ({ ...initialForm(), ...extra });

export default function PlayerTab({ onSave }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const id = setTimeout(() => setSaved(false), 2600);
    return () => clearTimeout(id);
  }, [saved]);

  // arrivo dai Migliori Giocatori: giocatore, linea e partita già inseriti
  const loc = useLocation();
  useEffect(() => {
    const st = loc.state && loc.state.calc;
    if (!st) return;
    const p = playerById(st.playerId);
    if (!p) return;
    const lineStr = String(st.line).replace('.', ',');
    const fx = (st.ts && fixtureAt(p.teamName, st.ts)) || nextFixture(p.teamName);
    setForm((f) => fillFrom({ ...f, line: lineStr }, p, f.tipoTiri, fx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeason = (key, patch) => setForm((f) => ({ ...f, season: { ...f.season, [key]: { ...f.season[key], ...patch } } }));
  const setBlock = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));

  const player = playerById(form.playerId);
  const team = teamById(form.team.id);
  const opp = teamById(form.opp.id);
  const family = form.tipoTiri;

  const line = parseNum(form.line);
  const odds = parseNum(form.odds);

  const result = resultFromForm(form);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null;

  const selectPlayer = (id) => {
    const p = playerById(id);
    if (!p) return;
    setForm((f) => fillFrom(f, p, f.tipoTiri, nextFixture(p.teamName)));
  };

  // cambio famiglia (totali / in porta) o linea: ricalcola i dati del giocatore scelto
  useEffect(() => {
    if (!form.playerId) return;
    const p = playerById(form.playerId);
    if (!p) return;
    setForm((f) => {
      const g = fillFrom(f, p, f.tipoTiri, null);
      return { ...f, shots5: g.shots5, minutes5: g.minutes5, hitRate: g.hitRate, season: g.season,
        team: { ...f.team, ...prefillShots(teamShots(f.team.id, f.team.leagueId), 'for') },
        opp: { ...f.opp, ...prefillShots(teamShots(f.opp.id, f.opp.leagueId), 'against') } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipoTiri, form.line, form.lineType]);

  const play = () => {
    if (!result.ready) return;
    const sedeLabel = SEDE_OPTIONS.find((o) => o.value === form.sede)?.label ?? '';
    const competitionLabel = COMPETITION_OPTIONS.find((o) => o.value === form.competizione)?.label ?? '';
    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      kind: 'player',
      title: player ? player.name : 'Giocatore',
      subtitle: `${form.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(line)} ${family === 'inPorta' ? 'tiri in porta' : 'tiri'} · ${competitionLabel} · ${sedeLabel}`,
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
      hitLabel,
      note: result.note.text,
      sede: form.sede,
    });
    setSaved(true);
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <PlayerPickPanel
        form={form}
        set={set}
        player={player}
        onSelectPlayer={selectPlayer}
        hint={lineHintText(result.lambda, line)}
      />
      <div className="mt-7">
        <PlayerLast5Panel form={form} set={set} />
      </div>
      <div className="mt-7">
        <PlayerSeasonPanel season={form.season} onChange={setSeason} rate90={result.rate90} />
      </div>
      <div className="mt-7">
        <TeamBlock title="Squadra del giocatore" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
      </div>
      <div className="mt-7">
        <TeamBlock title="Squadra avversaria" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
      </div>
      <div className="mt-7">
        <PanelTitle>Risultato</PanelTitle>
        <p className="mb-3 text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
          {player && team && opp ? `${player.name} · ${team.name} contro ${opp.name}` : 'Completa i campi per il calcolo'}
        </p>
        <ResultCard result={result} kind="player" onPlay={play} saved={saved} />
      </div>
    </div>
  );
}
