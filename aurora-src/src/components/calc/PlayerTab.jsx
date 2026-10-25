import { useEffect, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { leagueAverage, playerLast5Minutes, prefillShots, teamShots } from '@/data/calcData';
import {
  COMPETITION_OPTIONS,
  HIT_OPTIONS,
  SEASON_COMPETITIONS,
  SEDE_OPTIONS,
  computePlayerResult,
  fmtLine,
  lineHintText,
  parseDash,
  parseNum,
  sanitizeNum,
} from '@/lib/calc';
import PlayerLast5Panel from './PlayerLast5Panel';
import PlayerPickPanel from './PlayerPickPanel';
import PlayerSeasonPanel from './PlayerSeasonPanel';
import ResultCard from './ResultCard';
import TeamBlock from './TeamBlock';

const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });

const initialForm = () => ({
  playerId: null,
  tipoTiri: 'totali',
  lineType: 'over',
  line: '2,5',
  odds: '',
  sede: 'neutro',
  competizione: 'campionato',
  hitRate: '',
  shots5: '',
  minutes5: '',
  dashTarget: 'shots',
  season: {
    campionato: { tiri: '', minuti: '' },
    coppa: { tiri: '', minuti: '' },
    nations: { tiri: '', minuti: '' },
    qualificazioni: { tiri: '', minuti: '' },
  },
  team: emptyBlock(),
  opp: emptyBlock(),
});

export default function PlayerTab({ onSave }) {
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const id = setTimeout(() => setSaved(false), 2600);
    return () => clearTimeout(id);
  }, [saved]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeason = (key, patch) => setForm((f) => ({ ...f, season: { ...f.season, [key]: { ...f.season[key], ...patch } } }));
  const setBlock = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));

  const player = playerById(form.playerId);
  const team = teamById(form.team.id);
  const opp = teamById(form.opp.id);
  const teamStats = teamShots(form.team.id);
  const oppStats = teamShots(form.opp.id);
  const family = form.tipoTiri;

  const line = parseNum(form.line);
  const odds = parseNum(form.odds);
  const hitRate = form.hitRate === '' ? null : parseNum(form.hitRate);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null;

  const result = computePlayerResult({
    season: SEASON_COMPETITIONS.map((c) => ({
      shots: parseNum(form.season[c.key].tiri) ?? 0,
      minutes: parseNum(form.season[c.key].minuti) ?? 0,
    })),
    last5: { shots: parseDash(form.shots5), minutes: parseDash(form.minutes5) },
    line,
    lineType: form.lineType,
    odds,
    sede: form.sede,
    hitRate,
    hitLabel,
    teamShots: parseNum(form.team[family]),
    teamAvgFor: leagueAverage(teamStats?.leagueId, 'for', family),
    teamStrength: teamStats?.strength ?? null,
    oppConceded: parseNum(form.opp[family]),
    oppAvg: leagueAverage(oppStats?.leagueId, 'against', family),
    oppStrength: oppStats?.strength ?? null,
  });

  const selectPlayer = (id) => {
    const p = playerById(id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      playerId: id,
      shots5: (p.shots5 || []).join('-'),
      minutes5: playerLast5Minutes(p).join('-'),
      season: { ...f.season, campionato: { tiri: String(p.shots), minuti: String(p.minutes) } },
      team: { ...f.team, leagueId: p.leagueId, id: p.teamId, ...prefillShots(teamShots(p.teamId), 'for') },
    }));
  };

  const addDash = () =>
    setForm((f) => {
      const key = f.dashTarget === 'minutes' ? 'minutes5' : 'shots5';
      return { ...f, [key]: sanitizeNum(`${f[key] || ''}-`, true) };
    });

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
        <PlayerLast5Panel form={form} set={set} onDash={addDash} />
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
