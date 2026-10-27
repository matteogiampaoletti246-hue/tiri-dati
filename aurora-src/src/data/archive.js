// Archivio storico (FotMob): classifiche, calendari, statistiche stagionali e dettaglio partite dal 2010.
// I file stanno nel repository dati (arch/ e partite/) e si scaricano solo quando servono.
import { BASE } from './load';

const cache = {};
const once = (key, fn) => { if (!cache[key]) cache[key] = fn().catch(() => null); return cache[key]; };
const json = (path) => once(path, () => fetch(`${BASE}${path}`).then((r) => (r.ok ? r.json() : null)));
const gz = (path) => once(path, async () => {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok || !r.body || typeof DecompressionStream === 'undefined') return null;
  return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
});

// id dell'app → id FotMob
export const FM_ID = { 'serie-a': 55, 'premier-league': 47, 'la-liga': 87, bundesliga: 54, 'ligue-1': 53, 'champions-league': 42, 'europa-league': 73, 'conference-league': 10216 };

export const archIndex = () => once('index', async () => {
  const [a, b] = await Promise.all([json('arch/index.json'), json('arch/index_top.json')]);
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([k, v]) => {
    const o = out[k];
    out[k] = o ? { ...o, ...v, s: [...new Set([...(o.s || []), ...(v.s || [])])] } : v;
  });
  return out;
});
export const loadColors = () => json('arch/colors.json');
export const loadSeason = (lid, sk) => json(`arch/${lid}/${sk}.json`);
// le statistiche vecchie (v1) erano della stagione sbagliata: si usano solo quelle riscaricate (v2)
// statistiche nascoste ovunque (significato poco chiaro)
const HIDDEN_STAT = /^poss_?won_?att_?3rd/i;
const strip = (o) => { if (o) for (const k of Object.keys(o)) if (HIDDEN_STAT.test(k)) delete o[k]; return o; };
export const loadSeasonStats = (lid, sk) => json(`arch/${lid}/${sk}_s.json`).then((d) => {
  if (!d || d.v !== 2) return null;
  strip(d.players); strip(d.teams);
  return d;
});
export const loadSeasonMatches = (lid, sk) => gz(`partite/${lid}/${sk}.json.gz`);

export const teamLogo = (id) => `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
export const playerFace = (id) => `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

// "2025-2026" → "2025/26"
export const seasonLabel = (sk) => {
  const m = /^(\d{4})-(\d{4})$/.exec(sk || '');
  return m ? `${m[1]}/${m[2].slice(2)}` : String(sk || '').replace('-', '/');
};
export const sortSeasons = (list) => [...list].sort((a, b) => String(b).localeCompare(String(a)));

export const STAT_IT = {
  BallPossesion: 'Possesso palla', expected_goals: 'Gol attesi (xG)', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori',
  blocked_shots: 'Tiri bloccati', shots_woodwork: 'Legni', shots_inside_box: 'Tiri in area', shots_outside_box: 'Tiri da fuori area', big_chance: 'Palle gol',
  big_chance_missed_title: 'Palle gol sbagliate', touches_opp_box: 'Tocchi in area avversaria', corners: 'Calci d\'angolo', accurate_passes: 'Passaggi riusciti',
  passes: 'Passaggi', own_half_passes: 'Nella propria metà', opposition_half_passes: 'Nella metà avversaria', long_balls_accurate: 'Lanci lunghi riusciti',
  accurate_crosses: 'Cross riusciti', player_throws: 'Rimesse laterali', Offsides: 'Fuorigioco', 'matchstats.headers.tackles': 'Contrasti', interceptions: 'Intercetti',
  shot_blocks: 'Tiri murati', clearances: 'Respinte', keeper_saves: 'Parate', duel_won: 'Duelli vinti', ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti',
  dribbles_succeeded: 'Dribbling riusciti', yellow_cards: 'Cartellini gialli', red_cards: 'Cartellini rossi', fouls: 'Falli commessi', shots: 'Tiri', defense: 'Difesa', duels: 'Duelli', discipline: 'Disciplina',
};
// gruppi di statistiche di squadra, nell'ordine di lettura
export const STAT_GROUPS = [
  ['Principali', ['BallPossesion', 'expected_goals', 'total_shots', 'ShotsOnTarget', 'big_chance', 'big_chance_missed_title', 'corners', 'Offsides', 'fouls', 'yellow_cards', 'red_cards']],
  ['Tiri', ['ShotsOffTarget', 'blocked_shots', 'shots_woodwork', 'shots_inside_box', 'shots_outside_box']],
  ['Passaggi', ['accurate_passes', 'passes', 'own_half_passes', 'opposition_half_passes', 'long_balls_accurate', 'accurate_crosses', 'touches_opp_box', 'player_throws']],
  ['Difesa', ['matchstats.headers.tackles', 'interceptions', 'shot_blocks', 'clearances', 'keeper_saves']],
  ['Duelli', ['duel_won', 'ground_duels_won', 'aerials_won', 'dribbles_succeeded']],
];

// classifiche stagionali (giocatori / squadre)
export const SEASON_STAT_IT = {
  goals: 'Gol', goal_assist: 'Assist', _goals_and_goal_assist: 'Gol + assist', rating: 'Voto medio', mins_played: 'Minuti giocati', expected_goals: 'Gol attesi (xG)',
  expected_assists: 'Assist attesi (xA)', ontarget_scoring_att: 'Tiri in porta', total_scoring_att: 'Tiri', accurate_pass: 'Passaggi riusciti', big_chance_created: 'Palle gol create',
  total_att_assist: 'Passaggi chiave', accurate_long_balls: 'Lanci lunghi riusciti', won_contest: 'Dribbling riusciti', big_chance_missed: 'Palle gol sbagliate', penalty_won: 'Rigori procurati',
  total_tackle: 'Contrasti', interception: 'Intercetti', effective_clearance: 'Respinte', outfielder_block: 'Tiri murati', ball_recovery: 'Recuperi', penalty_conceded: 'Rigori concessi',
  clean_sheet: 'Porta inviolata', saves: 'Parate', goals_conceded: 'Gol subiti', fouls: 'Falli commessi', yellow_card: 'Cartellini gialli', red_card: 'Cartellini rossi', goals_per_90: 'Gol ogni 90\'',
  expected_goals_per_90: 'xG ogni 90\'', rating_team: 'Voto medio', goals_team_match: 'Gol a partita', goals_conceded_team_match: 'Gol subiti a partita', possession_percentage_team: 'Possesso palla',
  clean_sheet_team: 'Porta inviolata', expected_goals_team: 'Gol attesi (xG)', ontarget_scoring_att_team: 'Tiri in porta', big_chance_team: 'Palle gol', accurate_pass_team: 'Passaggi riusciti',
  accurate_cross_team: 'Cross riusciti', corner_taken_team: 'Calci d\'angolo', total_yel_card_team: 'Cartellini gialli', total_red_card_team: 'Cartellini rossi', fk_foul_lost_team: 'Falli subiti',
  saves_team: 'Parate', total_tackle_team: 'Contrasti', interception_team: 'Intercetti', penalty_won_team: 'Rigori procurati', penalty_conceded_team: 'Rigori concessi',
  touches_in_opp_box_team: 'Tocchi in area', expected_goals_conceded_team: 'xG subiti', effective_clearance_team: 'Respinte', accurate_long_balls_team: 'Lanci lunghi riusciti',
};
export const PLAYER_STAT_IT = {
  rating_title: 'Voto', minutes_played: 'Minuti', goals: 'Gol', assists: 'Assist', total_shots: 'Tiri', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri bloccati',
  accurate_passes: 'Passaggi riusciti', chances_created: 'Occasioni create', touches: 'Tocchi', fouls: 'Falli commessi', was_fouled: 'Falli subiti', interceptions: 'Intercetti',
  'matchstats.headers.tackles': 'Contrasti', clearances: 'Respinte', recoveries: 'Recuperi', duel_won: 'Duelli vinti', duel_lost: 'Duelli persi', aerials_won: 'Duelli aerei vinti',
  dribbles_succeeded: 'Dribbling riusciti', saves: 'Parate', goals_conceded: 'Gol subiti', dispossessed: 'Palle perse', crosses: 'Cross', passes_into_final_third: 'Passaggi nell\'ultimo terzo',
  shot_blocks: 'Tiri murati', defensive_actions: 'Azioni difensive', touches_opp_box: 'Tocchi in area',
};
export const prettyKey = (k) => String(k).replace(/_t$/, '').replace(/^matchstats\.headers\./, '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// stagioni passate di un campionato (la piu' recente dell'indice e' quella in corso, mostrata dai dati live)
export const pastSeasons = async (fm) => {
  const idx = await archIndex();
  const e = idx && idx[String(fm)];
  return sortSeasons((e && e.s) || []).slice(1);
};
// stagione piu' recente dell'indice (quella in corso)
export const currentSeason = async (fm) => {
  const idx = await archIndex();
  const e = idx && idx[String(fm)];
  return e && e.s && e.s.length ? sortSeasons(e.s)[0] : null;
};
// stagioni passate in cui la squadra ha davvero giocato quella competizione
export const teamSeasons = async (fm, name) => {
  const list = await pastSeasons(fm);
  const hit = await Promise.all(list.map((sk) => loadSeason(fm, sk).then((s) => (s && s.teams && teamIdByName(s.teams, name) ? sk : null)).catch(() => null)));
  return hit.filter(Boolean);
};
const norm = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(fc|ac|as|ss|us|afc|cf|sc|calcio|1\w*)\b/g, ' ').replace(/\s+/g, ' ').trim();
// id FotMob di una squadra dentro i dati di una stagione, dal nome
export const teamIdByName = (teams, name) => {
  const n = norm(name);
  if (!n || !teams) return null;
  const ent = Object.entries(teams);
  let hit = ent.find(([, v]) => norm(v) === n);
  if (!hit) hit = ent.find(([, v]) => { const m = norm(v); return m && (m.includes(n) || n.includes(m)); });
  return hit ? hit[0] : null;
};
