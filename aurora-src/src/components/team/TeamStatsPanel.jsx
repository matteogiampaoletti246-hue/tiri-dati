import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import PanelTitle from '@/components/PanelTitle';
import { CATEGORY_DEFS, TILE_METRICS, metricOf as metricOf0, teamsInComp, hasMetrics as hasMetrics0 } from '@/data/standings';
import { teamById } from '@/data/teams';
import { upcomingMatches } from '@/data/extras';
import Crest from '@/components/Crest';
import { Link } from 'react-router-dom';
import { comma } from '@/lib/format';
import { bandColor, ratioColor } from '@/components/player/playerCalc';
import CompSeasonBar from '@/components/CompSeasonBar';
import { PastTeamStats } from '@/components/past/PastTeam';
import { useTeamView, announceComp, GrowBar, RollText } from '@/components/past/PastBits';
import { teamCompetitions } from '@/data/competitions';
import { teamShots } from '@/data/calcData';
import { MATCHES } from '@/data/matches';
import { teamByName } from '@/data/teams';

// statistiche negative: meno ce ne sono, meglio e' (subiti/concessi e fuorigioco)
export const NEG = ['golSubiti', 'xgSubiti', 'tiriConcessi', 'tiriInPortaConcessi', 'occasioniConcesse', 'cornerConcessi', 'fuorigioco'];
const rankInC = (comp, team, key, part) => {
  const rows = teamsInComp(comp).filter((t) => hasMetrics0(t.id, comp)).map((t) => ({ id: t.id, v: metricOf0(t.id, key, part, comp) })).sort((a, b) => (NEG.includes(key) ? a.v - b.v : b.v - a.v));
  const i = rows.findIndex((r) => r.id === team.id);
  const total = rows.length;
  const avg = total ? rows.reduce((a, r) => a + r.v, 0) / total : 0;
  const max = rows.reduce((m, r) => Math.max(m, r.v), 0);
  return { rank: i + 1, total, avg, max, frac: total > 1 ? (total - (i + 1)) / (total - 1) : 1 };
};
// collegamento attacco di una squadra <-> cio' che l'avversaria concede (e viceversa)
const PAIR = { gol: 'golSubiti', xg: 'xgSubiti', tiri: 'tiriConcessi', tiriInPorta: 'tiriInPortaConcessi', occasioni: 'occasioniConcesse', corner: 'cornerConcessi', golSubiti: 'gol', xgSubiti: 'xg', tiriConcessi: 'tiri', tiriInPortaConcessi: 'tiriInPorta', occasioniConcesse: 'occasioni', cornerConcessi: 'corner' };
const KEY_ROWS = [['gol', 'Gol'], ['xg', 'xG'], ['tiri', 'Tiri'], ['tiriInPorta', 'Tiri in porta'], ['corner', 'Corner']];
const VS = {
  tiri: { opp: 'tiriConcessi', mode: 'att', t: 'concede' },
  tiriInPorta: { opp: 'tiriInPortaConcessi', mode: 'att', t: 'concede' },
  corner: { opp: 'cornerConcessi', mode: 'att', t: 'concede' },
  falli: { opp: 'fallisubiti', mode: 'foul', t: 'subisce' },
  gialli: { opp: 'gialli', mode: 'cmp', t: 'ne ha' },
  fuorigioco: { opp: 'fuorigioco', mode: 'cmp', more: true, t: 'ne ha' },
};
const AZ = '#3B9DFF';
const badge = (r, t, frac) => bandColor(frac !== undefined ? frac : t > 1 ? (t - r) / (t - 1) : 1);

// Statistiche della squadra (medie a partita) con posizione in campionato.
function DomesticStats({ team, comp }) {
  const metricOf = (id, k, p = 0) => metricOf0(id, k, p, comp);
  const hasMetrics = (id) => hasMetrics0(id, comp);
  const rankIn = (t, k, p) => rankInC(comp, t, k, p);
  const [part, setPart] = useState(0);
  const [cat, setCat] = useState('all');
  const cats = CATEGORY_DEFS.filter((c) => cat === 'all' || c.key === cat);
  const concept = 'c';
  const [vsOn, setVsOn] = useState(() => { try { return localStorage.getItem('sl-vs-on') !== '0'; } catch { return true; } });
  const next = upcomingMatches(team.id, 60).find((m) => m.leagueId === comp);
  const opp = next ? teamById(next.homeId === team.id ? next.awayId : next.homeId) : null;
  const isHome = next ? next.homeId === team.id : true;
  const oppOk = opp && hasMetrics(opp.id) && hasMetrics(team.id);
  // confronto con la prossima avversaria solo su alcune statistiche, con un criterio di favorevole / sfavorevole
  const vsOf = (key) => {
    const cfg = VS[key];
    if (!oppOk || !cfg) return null;
    const ro = rankIn(opp, cfg.opp, 0);
    const vo = metricOf(opp.id, cfg.opp, 0);
    const rm = rankIn(team, key, part);
    const vm = metricOf(team.id, key, part);
    let fav;
    if (cfg.mode === 'att') {
      const q = ro.avg > 0 ? vo / ro.avg : 1; // l'avversaria concede piu' della media = favorevole
      fav = q >= 1.08 ? 2 : q <= 0.92 ? 0 : 1;
    } else if (cfg.mode === 'foul') {
      const q = ((rm.avg > 0 ? vm / rm.avg : 1) + (ro.avg > 0 ? vo / ro.avg : 1)) / 2; // tanti falli commessi da noi e subiti da lei = sfavorevole
      fav = q >= 1.08 ? 0 : q <= 0.92 ? 2 : 1;
    } else {
      const q = vo > 0 ? vm / vo : 1; // meno di lei = favorevole
      // di norma meno di lei = favorevole; per i fuorigioco vale il contrario (conta chi ne fa di piu')
      fav = cfg.more ? (q >= 1.1 ? 2 : q <= 0.9 ? 0 : 1) : (q <= 0.9 ? 2 : q >= 1.1 ? 0 : 1);
    }
    return { v: vo, mine: vm, rank: ro.rank, total: ro.total, fav, cfg };
  };
  const favColor = (f) => ['#E0443A', '#E8C23A', '#1FA45B'][f];
  const verdict = (f) => ['sfavorevole', 'equilibrato', 'favorevole'][f];
  return (
    <div className="flex flex-col gap-4 pb-6 pt-3">
      <div className="grid grid-cols-4 gap-2 px-4">
        {TILE_METRICS.slice(0, 4).map((t) => {
          const r = rankIn(team, t.key, part);
          return (
            <div key={t.key} className="glass rounded-[18px] px-2 py-2.5 text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{t.label}</p>
              <p className="tnum mt-1 text-[17px] font-extrabold">{comma(metricOf(team.id, t.key, part), t.key === 'possesso' ? 0 : 1)}{t.key === 'possesso' ? '%' : ''}</p>
              <span className="tnum mt-1 inline-block rounded-full px-2 py-[1px] text-[10px] font-extrabold text-white" style={{ background: badge(r.rank, r.total, r.frac) }}>{r.rank}°</span>
            </div>
          );
        })}
      </div>
      {opp ? (
        <Link to={`/match/${next.id}`} className="glass press mx-4 flex items-center gap-3 rounded-[20px] px-4 py-3">
          <Crest team={team} size={22} />
          <span className="text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Prossima</span>
          <span className="ml-auto flex items-center gap-2 text-[13.5px] font-extrabold">VS <Crest team={opp} size={22} />{opp.name}<span className="rounded-full px-2 py-[1px] text-[10.5px] font-bold" style={{ background: 'var(--hair-2)', color: 'var(--ink-2)' }}>{isHome ? 'Casa' : 'Trasferta'}</span></span>
        </Link>
      ) : null}
      <div className="flex flex-col gap-2 px-4">
        <TextFilter options={[{ value: 0, label: 'Totale' }, { value: 1, label: 'Casa' }, { value: 2, label: 'Trasferta' }]} value={part} onChange={setPart} />
        <TextFilter options={[{ value: 'all', label: 'Tutte' }, ...CATEGORY_DEFS.map((c) => ({ value: c.key, label: c.title }))]} value={cat} onChange={setCat} />
        {concept === 'c' && oppOk ? (
          <button type="button" onClick={() => setVsOn((x) => { const n = !x; try { localStorage.setItem('sl-vs-on', n ? '1' : '0'); } catch { /* ignora */ } return n; })} className="press flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-bold" style={{ background: vsOn ? AZ : 'var(--hair-2)', color: vsOn ? '#fff' : 'var(--ink-2)' }}>
            <Crest team={opp} size={16} />Confronta con {opp.short || opp.name}
          </button>
        ) : null}
      </div>
      {cats.map((c) => (
        <section key={c.key} className="glass club-card mx-4 overflow-hidden rounded-[24px]">
          <h3 className="px-4 pb-1 pt-3.5 text-[12.5px] font-extrabold uppercase tracking-wider">{c.title}</h3>
          {c.metrics.map((mt, i) => {
            const r = rankIn(team, mt.key, part);
            const v = metricOf(team.id, mt.key, part);
            const col = bandColor(r.frac);
            const o = oppOk && vsOn ? vsOf(mt.key) : null;
            const top = Math.max(r.max * 1.08, r.avg * 1.6, o ? o.v * 1.06 : 0, 0.0001);
            const w = Math.max(3, Math.min(100, (v / top) * 100));
            const ax = Math.min(100, (r.avg / top) * 100);
            const lx = Math.min(88, Math.max(12, ax));
            return (
              <div key={mt.key} className="px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{mt.label}</span>
                  <RollText value={v} fmt={(x) => comma(x, 2)} className="rounded-full text-[14px] font-extrabold" style={{ color: col, backgroundColor: `${col}26`, padding: '1px 9px', transition: 'color .9s ease, background-color .9s ease' }} />
                  <span className="tnum w-[34px] text-right text-[11px] font-bold" style={{ color: 'var(--ink-3)' }}>{r.rank}°</span>
                </div>
                <GrowBar width={w} col={col} avgPos={ax} avgText={comma(r.avg, 2)} marginTop={20} labelTop={-21} />
                {o ? (
                  <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--ink-2)' }}>
                    <Crest team={opp} size={14} />
                    <span>{o.cfg.mode === 'cmp' ? <>{opp.short || opp.name}: <b className="tnum">{comma(o.v, 2)}</b> (tu {comma(o.mine, 2)})</> : <>{opp.short || opp.name} {o.cfg.t} <b className="tnum">{comma(o.v, 2)}</b> · {o.rank}° su {o.total}</>}</span>
                    <span className="ml-auto rounded-full px-2 py-[1px] text-[10px] font-extrabold text-white" style={{ background: favColor(o.fav) }}>{verdict(o.fav)}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}


export default function TeamStatsPanel({ team }) {
  const { comp, setComp, season, eff, setSeason, comps, seasons, fm } = useTeamView(team, 'sx', teamCompetitions(team.id), team.leagueId);
  return (
    <div>
      <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); announceComp(team.id, c); }} seasons={seasons} season={season} onSeason={setSeason} />
      {eff !== 'cur' && fm ? <PastTeamStats fm={fm} sk={eff} team={team} comp={comp} cur={season === 'cur'} /> : (
        <div key={comp} className="comp-in">
          <DomesticStats team={team} comp={comp} />
        </div>
      )}
    </div>
  );
}
