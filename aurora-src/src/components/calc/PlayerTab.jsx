import { useEffect, useMemo, useRef, useState } from 'react';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import { useLocation } from 'react-router-dom';
import PanelTitle from '@/components/PanelTitle';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { fixtureAt, nextFixture, prefillShots, teamShots } from '@/data/calcData';
import { emptyFouls, fillFrom, hitFromValues, hitRows, initialForm, isFouls, resultFromForm, resultFromFouls, viewFor } from '@/data/calcPlayer';
import { domesticKey } from '@/data/calcData';
import { fmTeamIn, foulKeys, leaguePlayerAvg, playerFouls, rosterFouls, teamFoulStats, useFouls } from '@/data/calcFouls';
import { resolvePid } from '@/data/playerIndex';
import { comma } from '@/lib/format';
import { parseDash } from '@/lib/calc';
import DuelPicker from './DuelPicker';
import RolesPanel from './RolesPanel';
import { FALLI_KEYS, cardRole, autoDuelIds, falliKeysFor, playerRoles, roleBreakdown, useFalli } from '@/data/calcRoles';
import FoulsTeamBlock from './FoulsTeamBlock';
import {
  COMPETITION_OPTIONS,
  NATIONS_OPTION,
  HIT_OPTIONS,
  SEDE_OPTIONS,
  fmtLine,
  parseNum,
} from '@/lib/calc';
import PlayerLast5Panel from './PlayerLast5Panel';
import { careerByFm, carriereOf, loadCarriere } from '@/data/carriere';
import { loadRose, rosePlayer } from '@/data/rose';
import PlayerPickPanel from './PlayerPickPanel';
import PlayerSeasonPanel from './PlayerSeasonPanel';
import ResultCard from './ResultCard';
import TeamBlock from './TeamBlock';

const extra = { dashTarget: 'shots' };
const initial = () => ({ ...initialForm(), ...extra });

export default function PlayerTab({ onSave }) {
  // ritorno al Calcolatore (dalla scheda del giocatore, dalla partita, da un'altra scheda): i ricalcoli automatici non partono
  // al rimontaggio, cosi' i valori cambiati a mano restano; ripartono solo quando si cambia davvero qualcosa
  const restored = useRef(CALC_KEEP.player != null);
  const ran = useRef(new Set());
  const skipRestore = (name) => { if (!restored.current || ran.current.has(name)) return false; ran.current.add(name); return true; };
  const [form, setForm] = useState(() => (CALC_KEEP.player ? { stat: 'tiri', f: emptyFouls(), ...CALC_KEEP.player } : initial()));
  CALC_KEEP.player = form;
  useEffect(() => { saveCalcKeep(); }, [form]);
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
    CALC_KEEP.stKey = loc.key; saveCalcKeep();
    const p = playerById(st.playerId);
    if (!p) return;
    const hasLine = st.line !== undefined && st.line !== null;
    const fx = (st.ts && fixtureAt(p.teamName, st.ts)) || nextFixture(p.teamName);
    // statistica scelta in Migliori Giocatori (tiri, tiri in porta, falli commessi/subiti)
    const withStat = (f) => (st.stat ? { ...f, stat: st.stat, tipoTiri: st.stat === 'porta' ? 'inPorta' : 'totali', lineType: 'over' } : f);
    setForm((f) => { const g = withStat(hasLine ? { ...f, line: String(st.line).replace('.', ',') } : f); return fillFrom(g, p, g.tipoTiri, fx); });
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
  // id FotMob legato al giocatore per cui e' stato cercato: cambiando giocatore non si usa mai l'id del precedente
  // (prima le medie stagione si calcolavano con l'id del giocatore di prima e restavano vuote o sbagliate)
  const [fmRes, setFmRes] = useState({ p: null, v: null });
  const fmPid = fmRes.p === form.playerId ? fmRes.v : null;
  useEffect(() => {
    let live = true;
    const pid = form.playerId;
    if (player) resolvePid(player).then((x) => { if (live) setFmRes({ p: pid, v: x || 0 }); }, () => { if (live) setFmRes({ p: pid, v: 0 }); }); // 0 = cercato ma senza id FotMob // anche per i tiri e senza statistica: serve al badge del ruolo
    return () => { live = false; };
  }, [form.playerId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownStats = fouls ? teamFoulStats(fd, fmOf(team), form.team.leagueId, team && team.name, form.stat) : null;
  const oppStats = fouls ? teamFoulStats(fd, fmOf(opp), form.opp.leagueId, opp && opp.name, oppStat) : null;
  const oppDom = opp ? domesticKey(opp.name) : null;
  const roster = fouls && oppDom ? rosterFouls(fd, oppDom, fmOf(opp), oppStat) : [];
  const duelSel = (f.duel || []).map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const duelAvg = duelSel.length ? duelSel.reduce((a, r) => a + r.avg90, 0) / duelSel.length : null;
  const duelLeagueAvg = fouls && oppDom ? leaguePlayerAvg(fd, oppDom, oppStat) : null;
  // ruoli avversari e duello automatico (ruolo con la % piu' alta; anche il secondo se dista al massimo 5 punti)
  const roleKeys = falliKeysFor(form.competizione === 'nations');
  const fl = useFalli(player ? FALLI_KEYS : []); // sempre (non solo falli): da qui viene il ruolo del giocatore
  const rb = fouls && fl && fmPid ? roleBreakdown(fl, roleKeys, fmPid, form.stat) : null;
  const roles = useMemo(() => playerRoles(fl, roleKeys), [fl, form.competizione]); // eslint-disable-line react-hooks/exhaustive-deps
  // ruolo dalla scheda giocatore per chi non ce l'ha nei falli
  const [ps, setPs] = useState(undefined);
  const [roseOk, setRoseOk] = useState(false);
  useEffect(() => {
    let live = true;
    setPs(undefined); // undefined = carriere non ancora lette
    if (player && fmPid !== null) {
      // come il riquadro "Ruolo" della scheda: carriere.json, poi carriera per id FotMob (car/), poi rosa
      Promise.all([loadCarriere(), loadRose()]).then(async () => {
        const c = carriereOf(player.id);
        const cf = c && c.ps ? null : fmPid ? await careerByFm(fmPid).catch(() => null) : null;
        if (live) { setRoseOk(true); setPs((c && c.ps) || (cf && cf.ps) || null); }
      });
    }
    return () => { live = false; };
  }, [form.playerId, fmPid]); // eslint-disable-line react-hooks/exhaustive-deps
  const rp = fmPid && roseOk ? rosePlayer(fmPid) : null;
  const myRole = (fmPid && roles[String(fmPid)]) || (player && fmPid !== null && ps !== undefined && (fl || !fmPid) ? cardRole(player.position, ps, rp && rp.r ? rp.r[2] : null) : null);
  const autoSig = (rb && roster.length ? autoDuelIds(rb, roster, roles) : []).join(',');

  // precompila i falli dai dati (ultime 5, medie stagione, medie squadre) quando cambiano giocatore, squadre o statistica
  useEffect(() => {
    if (!fouls || !fd || !player || !fmPid) return;
    const sig = ['v2', form.stat, form.playerId, form.team.id, form.team.leagueId, form.opp.id, form.opp.leagueId].join('|');
    if (restored.current && f.sig === sig) return; // stessi giocatore, squadre e statistica di prima: restano i valori com'erano
    const pv = viewFor(player, form.competizione);
    const pf = playerFouls(fd, fmPid, team && domesticKey(team.name), form.stat, pv.hn != null ? hitRows(pv) : null);
    const season = { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } };
    ['campionato', 'coppa'].forEach((k) => { if (pf && pf[k]) season[k] = { tiri: comma(Math.round(pf[k].v * 100) / 100, 2), minuti: String(Math.round(pf[k].min)) }; });
    setF({
      last5: pf ? pf.last5.join('-') : '',
      min5: pf ? pf.min5.join('-') : '',
      season,
      team: ownStats ? comma(ownStats.v, 2) : '',
      opp: oppStats ? comma(oppStats.v, 2) : '',
      sig,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, fd, fmPid, form.stat, form.playerId, form.team.id, form.team.leagueId, form.opp.id, form.opp.leagueId]);
  // hit rate dalle ultime 5 e dalla linea
  useEffect(() => {
    if (skipRestore('hit') || !fouls) return;
    setF({ hitRate: hitFromValues(parseDash(f.last5), parseNum(form.line), form.lineType) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, f.last5, form.line, form.lineType]);
  // cambiando squadra avversaria o statistica il duello riparte vuoto
  useEffect(() => { if (skipRestore('duel')) return; setF({ duel: [], duelManual: false }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [form.opp.id, form.stat, form.playerId]);
  // il duello automatico viene dopo il ripristino: stesse dipendenze, ordine degli effetti
  useEffect(() => {
    if (!fouls || f.duelManual) return;
    setF({ duel: autoSig ? autoSig.split(',') : [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, autoSig, f.duelManual, form.opp.id, form.stat, form.playerId]);

  const result = fouls ? resultFromFouls(form, duelAvg, duelLeagueAvg, ownStats && ownStats.avg, oppStats && oppStats.avg) : resultFromForm(form);
  const hitLabel = fouls ? (HIT_OPTIONS.find((o) => o.value === f.hitRate)?.label ?? null) : (HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null);
  const statName = { tiri: 'tiri', porta: 'tiri in porta', fc: 'falli commessi', fs: 'falli subiti' }[form.stat || 'tiri'];
  const statTitle = form.stat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const oppTitle = oppStat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const onStat = (v) => setForm((x) => ({ ...x, stat: v, tipoTiri: v === 'porta' ? 'inPorta' : v === 'tiri' ? 'totali' : x.tipoTiri }));
  // negli schermi dei falli l'hit rate letto/scritto dal pannello di base e' quello dei falli
  // partite usate per l'Hit Rate (meno di 5: il pannello lo scrive, es. "su 3 partite")
  const vform = fouls ? { ...form, hitRate: f.hitRate, hitN: form.playerId ? parseDash(f.last5).length : null } : form;
  const vset = (key, value) => (fouls && key === 'hitRate' ? setF({ hitRate: value }) : key === 'competizione' ? setCompetition(value) : set(key, value));

  const selectPlayer = (id) => {
    const p = playerById(id);
    if (!p) return;
    // un giocatore di sola nazionale (senza profilo di club) parte da Nations League; gli altri dalla squadra di club
    setForm((f) => { const v = p.nat ? p : viewFor(p, f.competizione); return fillFrom(f, v, f.tipoTiri, nextFixture(v.teamName)); });
  };
  // Nations League <-> campionato/coppa: stesso giocatore, squadra / prossima partita / statistiche dell'altro profilo
  const setCompetition = (value) => {
    const p = playerById(form.playerId);
    if (!p || !p.natView) { set('competizione', value); return; }
    const v = viewFor(p, value);
    setForm((f) => ({ ...fillFrom(f, v, f.tipoTiri, nextFixture(v.teamName)), competizione: value }));
  };

  // cambio famiglia (totali / in porta) o linea: ricalcola i dati del giocatore scelto
  useEffect(() => {
    if (skipRestore('fam') || !form.playerId) return;
    const p0 = playerById(form.playerId);
    if (!p0) return;
    const p = p0.nat ? p0 : viewFor(p0, form.competizione);
    setForm((f) => {
      const g = fillFrom(f, p, f.tipoTiri, null);
      return { ...f, shots5: g.shots5, minutes5: g.minutes5, hitRate: g.hitRate, hitN: g.hitN, season: g.season,
        team: { ...f.team, ...prefillShots(teamShots(f.team.id, f.team.leagueId), 'for') },
        opp: { ...f.opp, ...prefillShots(teamShots(f.opp.id, f.opp.leagueId), 'against') } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipoTiri, form.line, form.lineType]);

  const play = () => {
    if (!result.ready) return;
    const sedeLabel = SEDE_OPTIONS.find((o) => o.value === form.sede)?.label ?? '';
    const competitionLabel = [...COMPETITION_OPTIONS, NATIONS_OPTION].find((o) => o.value === form.competizione)?.label ?? '';
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
        role={myRole}
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
          {rb ? (
            <div className="mt-7">
              <RolesPanel rb={rb} title={form.stat === 'fc' ? 'Ruoli avversari · falli commessi' : 'Ruoli avversari · falli subiti'} tint={tOpp(420)} runKey={`${form.playerId}-${form.stat}`} />
            </div>
          ) : null}
          <div className="mt-7">
            <DuelPicker team={opp} roster={roster} picked={f.duel || []} onChange={(d) => setF({ duel: d, duelManual: true })} statLabel={oppTitle} tint={tOpp(480)} roles={roles} />
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
            <TeamBlock title="Squadra del giocatore" mode="for" family={family} block={form.team} vsId={form.opp && form.opp.id} onChange={(p) => setBlock('team', p)} tint={tOwn(360)} />
          </div>
          <div className="mt-7">
            <TeamBlock title="Squadra avversaria" mode="against" family={family} block={form.opp} vsId={form.team && form.team.id} onChange={(p) => setBlock('opp', p)} tint={tOpp(480)} />
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
