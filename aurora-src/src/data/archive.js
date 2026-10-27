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
export const loadSeason = (lid, sk) => json(`arch/${lid}/${sk}.json`);
export const loadSeasonStats = (lid, sk) => json(`arch/${lid}/${sk}_s.json`);
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
