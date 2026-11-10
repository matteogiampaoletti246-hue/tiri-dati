// Classifiche statistiche di una stagione d'archivio (giocatori o squadre) come sezioni per StatListsN.
// Stessa logica di statSections in components/archive/ArchiveLeague.jsx del sito.
import React from 'react';
import { SEASON_STAT_IT, prettyKey, playerFace } from '@/data/archive';
import { Face } from './ui';
import { TeamLogoN } from './Standings';
import { groupOf, fmtVal, ORDER } from './StatBars';

export const MIN_MIN = 180;
const exactAgrees = (ex, official) => {
  const by = new Map(ex.map((r) => [String(r[0]), r]));
  let n = 0;
  let g = 0;
  (official || []).forEach((r) => { const e = by.get(String(r[0])); if (!e || !(e[4] > 0)) return; n += 1; if (Math.abs((e[3] * 90) / e[4] - r[3]) <= 0.06) g += 1; });
  return n >= 8 && g / n >= 0.95;
};
export const P90_OFFICIAL = {
  fouls: 'fouls', total_scoring_att: 'total_shots', ontarget_scoring_att: 'ShotsOnTarget', accurate_pass: 'accurate_passes',
  accurate_long_balls: 'long_balls_accurate', lbp_total: 'line_breaking_passes', won_contest: 'dribbles_succeeded',
  defensive_contributions: 'defensive_actions', total_tackle: 'matchstats.headers.tackles', interception: 'interceptions',
  effective_clearance: 'clearances', outfielder_block: 'shot_blocks', ball_recovery: 'recoveries', saves: 'saves',
  goals_conceded: 'goals_conceded', total_high_claim: 'keeper_high_claim', total_keeper_sweeper: 'keeper_sweeper', poss_won_att_3rd: null,
};
const NO90 = /rating|mins_played|percentage|^_|per_90|clean_sheet|matches|appear/i;
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');

export function statSections(C, stats, kind, names, col, fm, sk, mode = 'tot', onlyTeam = null, exact = null) {
  const lists = stats && stats[kind];
  if (!lists) return [];
  const isP = kind === 'players';
  const p90 = isP && mode === 'p90';
  const secs = [];
  Object.keys(lists).forEach((k) => {
    let list = lists[k];
    if (list && onlyTeam) list = list.filter((r) => String(r[2]) === String(onlyTeam));
    if (list && isP && !onlyTeam) list = list.filter((r) => Number(r[4]) >= MIN_MIN);
    if (!list || !list.length || k.startsWith('_')) return;
    let title = SEASON_STAT_IT[k] || prettyKey(k);
    let kk = k;
    if (isP && !stats.fromMatches && k in P90_OFFICIAL) {
      const exAll = P90_OFFICIAL[k] && exact && exact.players && exact.players[P90_OFFICIAL[k]];
      let ex = exAll && exactAgrees(exAll, lists[k]) ? exAll : null;
      if (ex && onlyTeam) ex = ex.filter((r) => String(r[2]) === String(onlyTeam));
      if (ex && !onlyTeam) ex = ex.filter((r) => Number(r[4]) >= MIN_MIN);
      if (p90) {
        if (ex && ex.length) list = ex.filter((r) => Number(r[4]) > 0).map((r) => [r[0], r[1], r[2], (Number(r[3]) * 90) / r[4], r[4], r[5], r[6]]);
        else list = list.filter((r) => r[3] != null && (onlyTeam || Number(r[4]) >= MIN_MIN));
        list.sort((x, y) => y[3] - x[3]);
        title = `${title} / 90'`;
        kk = `${k}_per_90`;
      } else {
        if (!ex || !ex.length) return;
        list = ex;
      }
    } else if (isP) {
      const isRate = /per_90/.test(k);
      if (p90) {
        if (isRate) { /* gia' ogni 90' */ } else if (NO90.test(k)) return;
        else {
          list = list.filter((r) => r[4] >= MIN_MIN && r[3] != null).map((r) => [r[0], r[1], r[2], (Number(r[3]) * 90) / r[4], r[4], r[5], r[6]]).sort((x, y) => y[3] - x[3]);
          if (!list.length) return;
          title = `${title} / 90'`;
          kk = `${k}_per_90`;
        }
      } else if (isRate) return;
    }
    secs.push({
      id: kk,
      group: groupOf(k),
      title,
      rows: list.map((r, i) => {
        const tc = hex6(col(r[2], names[r[2]] || r[1]).colors[0]);
        return {
          id: `${r[0]}-${i}`,
          to: isP ? `/storico/${fm}/${sk}/giocatore/${r[0]}` : `/storico/${fm}/${sk}/squadra/${r[2]}`,
          left: isP ? <Face uri={playerFace(r[0])} color={tc} size={30} /> : <TeamLogoN id={r[2]} name={r[1]} size={24} C={C} />,
          name: r[1],
          sub: isP ? (names[r[2]] || '') : undefined,
          bg: true,
          tc,
          value: fmtVal(p90 && kk !== k ? 'per_90' : k, r[3]),
        };
      }),
    });
  });
  secs.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || (SEASON_STAT_IT[a.id] ? 0 : 1) - (SEASON_STAT_IT[b.id] ? 0 : 1));
  return secs;
}
