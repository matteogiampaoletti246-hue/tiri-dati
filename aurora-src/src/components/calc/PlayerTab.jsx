import { useEffect, useMemo, useState } from 'react';
import { CALC_KEEP } from '@/data/calcKeep';
import { useLocation } from 'react-router-dom';
import PanelTitle from '@/components/PanelTitle';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { fixtureAt, nextFixture, prefillShots, teamShots } from '@/data/calcData';
import { emptyFouls, fillFrom, hitFromValues, initialForm, isFouls, resultFromForm, resultFromFouls } from '@/data/calcPlayer';
import { domesticKey } from '@/data/calcData';
import { fmTeamIn, foulKeys, leaguePlayerAvg, playerFouls, rosterFouls, teamFoulStats, useFouls } from '@/data/calcFouls';
import { resolvePid } from '@/data/playerIndex';
import { comma } from '@/lib/format';
import { parseDash } from '@/lib/calc';
import DuelPicker from './DuelPicker';
import FoulsTeamBlock from './FoulsTeamBlock';
import {
  COMPETITION_OPTIONS,
  HIT_OPTIONS,
  SEDE_OPTIONS,
  fmtLine,
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
  const [form, setForm] = useState(() => (CALC_KEEP.player ? { stat: 'tiri', f: emptyFouls(), ...CALC_KEEP.player } : initial()));
  CALC_KEEP.player = form;
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
    if (!st || CALC_KEEP.stKey === loc.key) return; // tornando indietro dalla scheda del giocatore non si rifa' il riempimento
    CALC_KEEP.stKey = loc.key;
    const p = playerById(st.playerId);
    if (!p) return;
    const hasLine = st.line !== undefined && st.line !== null;
    const fx = (st.ts && fixtureAt(p.teamName, st.ts)) || nextFixture(p.teamName);
    setForm((f) => fillFrom(hasLine ? { ...f, line: String(st.line).replace('.', ',') } : f, p, f.tipoTiri, fx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeason = (key, patch) => setForm((f) => ({ ...f, season: { ...f.season, [key]: { ...f.season[key], ...patch } } }));
  const setBlock = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));

  const player = playerById(form.playerId);
  const team = teamById(form.team.id);
  const opp = teamById(form.opp.id);
  const family = form.tipoTiri;
  // colori: pannelli del giocatore nei colori della sua squadra, pannelli dell'avversario nei colori dell'avversaria; l'onda riparte cambiando giocatore o avversaria
  const tOwn = (delay) => (player && team ? { k: `p${player.id}`, color: team.colors[0], delay } : null);
  const tOpp = (delay) => (player && opp ? { k: `o${player.id}-${opp.id}`, color: opp.colors[0], delay } : null);

  const line = parseNum(form.line);
  const odds = parseNum(form.odds);

  // ── falli: dati a parte, i tiri restano quelli di sempre ──
  const fouls = isFouls(form);
  const f = form.f || emptyFouls();
  const setF = (patch) => setForm((x) => ({ ...x, f: { ...(x.f || emptyFouls()), ...patch } }));
  const oppStat = form.stat === 'fc' ? 'fs' : 'fc'; // la statistica dell'avversario e' l'opposta
  const keys = useMemo(() => (fouls ? foulKeys([team && team.name, opp && opp.name], [form.team.leagueId, form.opp.leagueId]) : []), [fouls, team, opp, form.team.leagueId, form.opp.leagueId]);
  const fd = useFouls(keys);
  const fmOf = (t) => fmTeamIn(fd, t);
  const [fmPid, setFmPid] = useState(null);
  useEffect(() => {
    let live = true;
    setFmPid(null);
    if (fouls && player) resolvePid(player).then((x) => { if (live) setFmPid(x); });
    return () => { live = false; };
  }, [fouls, form.playerId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownStats = fouls ? teamFoulStats(fd, fmOf(team), form.team.leagueId, team && team.name, form.stat) : null;
  const oppStats = fouls ? teamFoulStats(fd, fmOf(opp), form.opp.leagueId, opp && opp.name, oppStat) : null;
  const oppDom = opp ? domesticKey(opp.name) : null;
  const roster = fouls && oppDom ? rosterFouls(fd, oppDom, fmOf(opp), oppStat) : [];
  const duelSel = (f.duel || []).map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const duelAvg = duelSel.length ? duelSel.reduce((a, r) => a + r.avg90, 0) / duelSel.length : null;
  const duelLeagueAvg = fouls && oppDom ? leaguePlayerAvg(fd, oppDom, oppStat) : null;

  // precompila i falli dai dati (ultime 5, medie stagione, medie squadre) quando cambiano giocatore, squadre o statistica
  useEffect(() => {
    if (!fouls || !fd || !player || !fmPid) return;
    const pf = playerFouls(fd, fmPid, team && domesticKey(team.name), form.stat);
    const season = { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } };
    ['campionato', 'coppa'].forEach((k) => { if (pf && pf[k]) season[k] = { tiri: comma(Math.round(pf[k].v * 100) / 100, 2), minuti: String(Math.round(pf[k].min)) }; });
    setF({
      last5: pf ? pf.last5.join('-') : '',
      min5: pf ? pf.min5.join('-') : '',
      season,
      team: ownStats ? comma(ownStats.v, 2) : '',
      opp: oppStats ? comma(oppStats.v, 2) : '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, fd, fmPid, form.stat, form.playerId, form.team.id, form.team.leagueId, form.opp.id, form.opp.leagueId]);
  // hit rate dalle ultime 5 e dalla linea
  useEffect(() => {
    if (!fouls) return;
    setF({ hitRate: hitFromValues(parseDash(f.last5), parseNum(form.line), form.lineType) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, f.last5, form.line, form.lineType]);
  // cambiando squadra avversaria o statistica il duello riparte vuoto
  useEffect(() => { setF({ duel: [] }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [form.opp.id, form.stat, form.playerId]);

  const result = fouls ? resultFromFouls(form, duelAvg, duelLeagueAvg, ownStats && ownStats.avg, oppStats && oppStats.avg) : resultFromForm(form);
  const hitLabel = fouls ? (HIT_OPTIONS.find((o) => o.value === f.hitRate)?.label ?? null) : (HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null);
  const statName = { tiri: 'tiri', porta: 'tiri in porta', fc: 'falli commessi', fs: 'falli subiti' }[form.stat || 'tiri'];
  const statTitle = form.stat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const oppTitle = oppStat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const onStat = (v) => setForm((x) => ({ ...x, stat: v, tipoTiri: v === 'porta' ? 'inPorta' : v === 'tiri' ? 'totali' : x.tipoTiri }));
  // negli schermi dei falli l'hit rate letto/scritto dal pannello di base e' quello dei falli
  const vform = fouls ? { ...form, hitRate: f.hitRate } : form;
  const vset = (key, value) => (fouls && key === 'hitRate' ? setF({ hitRate: value }) : set(key, value));

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
      subtitle: `${form.lineType === 'under' ? 'Under' : 'Over'} ${fmtLine(line)} ${fouls ? statName : family === 'inPorta' ? 'tiri in porta' : 'tiri'} · ${competitionLabel}${fouls ? '' : ` · ${sedeLabel}`}`,
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
      stat: form.stat || 'tiri',
      note: result.note.text,
      sede: form.sede,
    });
    setSaved(true);
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <PlayerPickPanel
        form={vform}
        set={vset}
        player={player}
        onSelectPlayer={selectPlayer}
        stat={form.stat || 'tiri'}
        onStat={onStat}
        tint={tOwn(0)}
      />
      {fouls ? (
        <>
          <div className="mt-7">
            <PlayerLast5Panel form={{ shots5: f.last5, minutes5: f.min5 }} set={(k, v) => setF(k === 'shots5' ? { last5: v } : { min5: v })} label={statTitle} tint={tOwn(120)} />
          </div>
          <div className="mt-7">
            <PlayerSeasonPanel season={f.season} onChange={(k, patch) => setF({ season: { ...f.season, [k]: { ...f.season[k], ...patch } } })} rate90={result.rate90} label={form.stat === 'fc' ? 'Commessi' : 'Subiti'} tint={tOwn(240)} />
          </div>
          <div className="mt-7">
            <FoulsTeamBlock title="Squadra del giocatore" statLabel={statTitle} block={form.team} stats={ownStats} value={f.team} onValue={(v) => setF({ team: v })} onChange={(p) => setBlock('team', p)} tint={tOwn(360)} />
          </div>
          <div className="mt-7">
            <DuelPicker team={opp} roster={roster} picked={f.duel || []} onChange={(d) => setF({ duel: d })} statLabel={oppTitle} tint={tOpp(480)} />
          </div>
          <div className="mt-7">
            <FoulsTeamBlock title="Squadra avversaria" statLabel={oppTitle} block={form.opp} stats={oppStats} value={f.opp} onValue={(v) => setF({ opp: v })} onChange={(p) => setBlock('opp', p)} tint={tOpp(600)} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-7">
            <PlayerLast5Panel form={form} set={set} tint={tOwn(120)} />
          </div>
          <div className="mt-7">
            <PlayerSeasonPanel season={form.season} onChange={setSeason} rate90={result.rate90} tint={tOwn(240)} />
          </div>
          <div className="mt-7">
            <TeamBlock title="Squadra del giocatore" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} tint={tOwn(360)} />
          </div>
          <div className="mt-7">
            <TeamBlock title="Squadra avversaria" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} tint={tOpp(480)} />
          </div>
        </>
      )}
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
