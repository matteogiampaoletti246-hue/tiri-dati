import { useEffect, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { nextFixture, pickLeagueKey, prefillShots, teamShots } from '@/data/calcData';
import { teamByName } from '@/data/teams';
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
  const teamStats = teamShots(form.team.id, form.team.leagueId);
  const oppStats = teamShots(form.opp.id, form.opp.leagueId);
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
    teamAvgFor: teamStats ? teamStats.avg.for[family] : null,
    teamStrength: teamStats?.strength ?? null,
    oppConceded: parseNum(form.opp[family]),
    oppAvg: oppStats ? oppStats.avg.against[family] : null,
    oppStrength: oppStats?.strength ?? null,
  });

  // precompila i campi dal giocatore reale (media stagionale, ultime 5, squadre, prossima partita)
  const fillFrom = (f, p, fam, fx) => {
    const k = fam === 'inPorta' ? 1 : 0;
    const rows = ((p.h && p.h.length >= 5 ? p.h : p.r) || []).slice(0, 5);
    const lineV = parseNum(f.line) ?? 0;
    const hit = rows.filter((x) => (f.lineType === 'under' ? (x[k] || 0) < lineV : (x[k] || 0) > lineV)).length;
    const season = { ...f.season, campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' } };
    [['campionato', p.l], ['coppa', p.c]].forEach(([key, a]) => {
      if (a && a[0] > 0 && a[3] > 0) season[key] = { tiri: String(Math.round((a[1 + k] / a[0]) * 100) / 100), minuti: String(Math.round(a[3] / a[0])) };
    });
    const own = teamByName(p.teamName);
    const ownKey = pickLeagueKey(p.teamName, fx && fx.cup ? fx.comp : null);
    const team = { leagueId: ownKey || 'serie-a', id: own ? own.id : null, totali: '', inPorta: '' };
    if (own && ownKey) Object.assign(team, prefillShots(teamShots(own.id, ownKey), 'for'));
    let opp = f.opp;
    let sede = f.sede;
    let competizione = f.competizione;
    if (fx) {
      const o = teamByName(fx.opp);
      const oKey = pickLeagueKey(fx.opp, fx.cup ? fx.comp : null);
      opp = { leagueId: oKey || 'serie-a', id: o ? o.id : null, totali: '', inPorta: '' };
      if (o && oKey) Object.assign(opp, prefillShots(teamShots(o.id, oKey), 'against'));
      sede = fx.home ? 'casa' : 'trasferta';
      competizione = fx.cup ? 'coppa' : 'campionato';
    }
    const fixed = rows.length >= 3 ? String(hit === 0 ? '0' : [0, 0.2, 0.4, 0.6, 0.8, 1][Math.min(5, Math.round((hit / rows.length) * 5))]) : '';
    return {
      ...f,
      playerId: p.id,
      tipoTiri: fam,
      shots5: rows.map((x) => x[k] || 0).join('-'),
      minutes5: rows.map((x) => x[2] || 0).join('-'),
      hitRate: fixed,
      season,
      team,
      opp,
      sede,
      competizione,
    };
  };

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
