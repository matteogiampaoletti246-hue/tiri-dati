import { lruGet, lruSet } from '@/lib/lru';
// Archivio storico (FotMob): classifiche, calendari, statistiche stagionali e dettaglio partite dal 2010.
// I file stanno nel repository dati (arch/ e partite/) e si scaricano solo quando servono.
import { BASE } from './load';

// file scaricati una volta sola; quelli grandi (partite della stagione .gz, statistiche) con capienza fissa: la memoria non cresce all'infinito
const cache = new Map();
const cap = (key) => (/\.gz$/.test(key) ? 10 : /_s\.json$|^(sfm|tps)\//.test(key) ? 30 : 0);
const BIG = new Map();
const once = (key, fn) => {
  const c = cap(key);
  if (c) { const hit = lruGet(BIG, key); if (hit) return hit; const p = fn().catch(() => null); lruSet(BIG, key, p, c); return p; }
  if (!cache.has(key)) cache.set(key, fn().catch(() => null));
  return cache.get(key);
};
const json = (path) => once(path, () => fetch(`${BASE}${path}`).then((r) => (r.ok ? r.json() : null)));
const gz = (path) => once(path, async () => {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok || !r.body || typeof DecompressionStream === 'undefined') return null;
  return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
});

// id dell'app → id FotMob
export const FM_ID = { 'serie-a': 55, 'premier-league': 47, 'la-liga': 87, bundesliga: 54, 'ligue-1': 53, 'champions-league': 42, 'europa-league': 73, 'conference-league': 10216, eredivisie: 57, 'super-lig': 71, 'liga-portugal': 61, 'pro-league': 40, 'scottish-premiership': 64, 'aut-bundesliga': 38, 'nor-eliteserien': 59, 'gre-super-league-1': 135, 'championship': 48, 'serie-b': 86, 'bundesliga-2': 146, 'laliga-2': 140, 'ligue-2': 110, 'liga-portugal-2': 185, 'eerste-divisie': 111, 'turchia-1-lig': 165, 'brasileirao': 268, 'arg-liga-profesional': 112, 'mls': 130, 'liga-mx': 230, 'coppa-italia': 141, 'dfb-pokal': 209, 'coupe-de-france': 134, 'taca-de-portugal': 186, 'efl-cup': 133, 'belgian-cup': 149, 'austrian-cup': 278, 'scottish-league-cup': 180, 'copa-do-brasil': 9067 };

let IDX = null; // indice gia' caricato (per le letture sincrone)
export const archIndex = () => once('index', async () => {
  const [a, b] = await Promise.all([json('arch/index.json'), json('arch/index_top.json')]);
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([k, v]) => {
    const o = out[k];
    out[k] = o ? { ...o, ...v, s: [...new Set([...(o.s || []), ...(v.s || [])])] } : v;
  });
  IDX = out;
  return out;
});
// stagione in corso senza attese (null se l'indice non e' ancora arrivato)
export const curSeasonSync = (fm) => {
  const e = IDX && IDX[String(fm)];
  return e && e.s && e.s.length ? [...e.s].sort((a, b) => String(b).localeCompare(String(a)))[0] : null;
};
export const loadColors = () => json('arch/colors.json');
// Classifica ricostruita dalle partite giocate, per le stagioni in cui FotMob non ha la tabella (solo campionati nazionali).
const CUPS = new Set([42, 73, 10216]);
function tableFromFix(season, lid) {
  const fix = (season && season.fix) || [];
  if (CUPS.has(Number(lid)) || !fix.length) return null;
  const names = season.teams || {};
  const mk = () => ({});
  const T = { all: mk(), home: mk(), away: mk() };
  let played = 0;
  const add = (tab, id, gf, ga) => {
    const r = tab[id] || (tab[id] = { id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0 });
    r.played += 1; r.gf += gf; r.ga += ga;
    if (gf > ga) { r.wins += 1; r.pts += 3; } else if (gf === ga) { r.draws += 1; r.pts += 1; } else r.losses += 1;
  };
  fix.forEach((m) => {
    if (!m[6] || m[8]) return;
    const sc = String(m[5] || '').split(' - ').map(Number);
    if (sc.length !== 2 || sc.some(Number.isNaN)) return;
    played += 1;
    add(T.all, m[2], sc[0], sc[1]); add(T.all, m[3], sc[1], sc[0]);
    add(T.home, m[2], sc[0], sc[1]); add(T.away, m[3], sc[1], sc[0]);
  });
  const n = Object.keys(T.all).length;
  if (!played || n < 8 || n > 30) return null;
  const out = {};
  Object.keys(T).forEach((k) => {
    out[k] = Object.values(T[k])
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || String(names[a.id]).localeCompare(String(names[b.id])))
      .map((r, i) => ({ name: names[r.id] || '', shortName: names[r.id] || '', id: r.id, played: r.played, wins: r.wins, draws: r.draws, losses: r.losses, scoresStr: `${r.gf}-${r.ga}`, goalConDiff: r.gf - r.ga, pts: r.pts, idx: i + 1 }));
  });
  return out;
}
// campionati con gironi/conference o punti dimezzati dopo la prima fase (MLS, Argentina, Austria, Belgio, Grecia) e coppe
const ZONES_NOT_BY_POINTS = new Set([130, 112, 38, 40, 135, 42, 73, 10216]);
export const loadSeason = (lid, sk) => json(`arch/${lid}/${sk}.json`).then((d) => {
  if (d && !d.table && !d.__tc) {
    d.__tc = true;
    const t = tableFromFix(d, lid);
    if (t) {
      d.table = t; d.legend = d.legend || []; d.tableComputed = true;
      // le zone (Champions, retrocessione...) della fonte hanno le posizioni: si colorano le righe solo dove la classifica finale e' quella a punti
      // (non nei campionati a gironi/conference, ne' dove i punti si dimezzano dopo la prima fase: li' le posizioni non coincidono e non si inventa nulla)
      if (!ZONES_NOT_BY_POINTS.has(Number(lid)) && Array.isArray(d.legend)) {
        const zoned = {};
        d.legend.forEach((z) => (z.indices || []).forEach((i) => { if (!zoned[i]) zoned[i] = z.color; }));
        Object.keys(t).forEach((k) => t[k].forEach((r, i) => { if (zoned[i]) r.qualColor = zoned[i]; }));
      }
    }
  }
  return d;
});
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

// "2025-2026" → "2025/26"; "2025-2026 - Clausura" → "2025/26 Clausura"; "2026 - Apertura" → "2026 Apertura"
export const seasonLabel = (sk) => {
  const m = /^(\d{4})-(\d{4})(?: - (.+))?$/.exec(sk || '');
  if (m) return `${m[1]}/${m[2].slice(2)}${m[3] ? ` ${m[3]}` : ''}`;
  const y = /^(\d{4}) - (.+)$/.exec(sk || '');
  return y ? `${y[1]} ${y[2]}` : String(sk || '').replace('-', '/');
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
  expected_goals_on_target_faced: 'Gol attesi subiti (xGOT)', errors_led_to_goal: 'Errori che portano a gol', conceded_penalties: 'Rigori concessi', last_man_tackle: 'Ultimo uomo', penalties_won: 'Rigori procurati',
  clearance_off_the_line: 'Salvataggi sulla linea', owngoal: 'Autogol', missed_penalty: 'Rigori sbagliati', saved_penalties: 'Rigori parati', keeper_diving_save: 'Parate in tuffo', saves_inside_box: 'Parate in area',
  keeper_high_claim: 'Uscite alte', keeper_sweeper: 'Uscite basse', expected_assists: 'Assist attesi (xA)', expected_goals: 'Gol attesi (xG)', expected_goals_non_penalty: 'xG senza rigori', ground_duels_won: 'Duelli a terra vinti',
  long_balls_accurate: 'Lanci lunghi riusciti', line_breaking_passes: 'Passaggi che rompono la linea', headed_clearance: 'Respinte di testa', dribbled_past: 'Dribblato', corners: 'Calci d\'angolo', Offsides: 'Fuorigioco',
  big_chance_missed_title: 'Palle gol sbagliate', accurate_crosses: 'Cross riusciti', shots_woodwork: 'Legni colpiti', rating_title: 'Voto medio',
};
export const prettyKey = (k) => String(k).replace(/_t$/, '').replace(/^matchstats\.headers\./, '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// stagioni passate di un campionato (la piu' recente dell'indice e' quella in corso, mostrata dai dati live)
export const pastSeasons = async (fm) => {
  const idx = await archIndex();
  const e = idx && idx[String(fm)];
  return sortSeasons((e && e.s) || []).slice(1);
};
// Statistiche dei giocatori ricavate dalle partite della stagione (quando le statistiche stagionali ufficiali non ci sono ancora).
// Stessa forma delle statistiche v2: chiave -> [[id, nome, squadra, valore, minuti, partite, ruoli]] in ordine di classifica.
const SKIP_KEY = /_t$|^physical_|^minutes_played$|^goals_prevented$|^xg_and_xa$|^shot_accuracy$|variant$|_team_title$|^player_throws$|^punches$/;
export const statsFromMatches = (lid, sk) => once(`sfm/${lid}/${sk}`, async () => {
  const d = await loadSeasonMatches(lid, sk);
  if (!d || !d.m) return null;
  const tot = {};
  const acc = {};
  const who = {}; // id giocatore -> [squadra, nome] dalle formazioni della partita (titolari e panchina)
  Object.values(d.m).forEach((m) => {
    [m && m.h, m && m.a].forEach((side) => {
      if (!side || !side.id) return;
      Object.values(side).forEach((list) => { if (Array.isArray(list)) list.forEach((r) => { if (Array.isArray(r) && r[0] != null) who[String(r[0])] = [String(side.id), r[1] || '']; }); });
    });
    Object.entries((m && m.p) || {}).forEach(([pid, v]) => {
      const mins = Number(v.minutes_played) || 0;
      if (!mins) return;
      const t = (tot[pid] = tot[pid] || { min: 0, n: 0 });
      t.min += mins;
      t.n += 1;
      Object.entries(v).forEach(([k, val]) => {
        if (typeof val !== 'number' || SKIP_KEY.test(k) || HIDDEN_STAT.test(k)) return;
        const a = ((acc[k] = acc[k] || {})[pid] = acc[k][pid] || { s: 0, n: 0 });
        a.s += val;
        a.n += 1;
      });
    });
  });
  const players = {};
  Object.entries(acc).forEach(([k, per]) => {
    const isRating = k === 'rating_title';
    const rows = Object.entries(per)
      .map(([pid, a]) => [pid, (who[pid] || [])[1] || '', (who[pid] || [])[0] || null, isRating ? a.s / a.n : a.s, tot[pid].min, tot[pid].n, null])
      .filter((r) => (isRating ? r[4] >= 90 : r[3] > 0));
    if (rows.length < 3) return;
    rows.sort((x, y) => y[3] - x[3]);
    players[k] = rows;
  });
  return Object.keys(players).length ? { v: 2, players, teams: {}, fromMatches: true } : null;
});
// statistiche squadre di una stagione: quelle ufficiali se ci sono, altrimenti le medie a partita dalle partite archiviate
// (stagione in corso dei campionati aggiunti: il file ufficiale esiste ma e' ancora vuoto)
export const loadTeamStats = async (lid, sk) => {
  const st = await loadSeasonStats(lid, sk);
  if (st && st.teams && Object.keys(st.teams).length) return st;
  return teamPartStats(lid, sk, 'tot');
};
// statistiche giocatori di una stagione: quelle ufficiali se ci sono, altrimenti quelle calcolate dalle partite
export const loadPlayerStats = async (lid, sk) => {
  const st = await loadSeasonStats(lid, sk);
  if (st && st.players && Object.keys(st.players).length) return st;
  return statsFromMatches(lid, sk);
};
// campionati con storico completo; gli altri hanno statistiche solo dal 2020
const TOP20 = new Set([47, 87, 55, 54, 53, 57, 61, 48, 86, 146, 71, 40, 64, 268, 112, 130, 230, 38, 59, 135, 42, 73, 10216]);
export const noStats = (fm, sk) => !TOP20.has(Number(fm)) && Number(String(sk).slice(0, 4)) < 2020;
// Arbitri di un campionato: per tutte le stagioni solo top 5 e coppe europee; per gli altri solo la stagione in corso
const REFS_ALL = new Set([55, 47, 87, 54, 53, 42, 73, 10216]);
export const refsAllSeasons = (fm) => REFS_ALL.has(Number(fm));
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
// stagioni passate in cui il giocatore (id FotMob) compare davvero nelle statistiche di quella competizione
const PS = {};
export const playerSeasons = (fm, pid) => {
  const k = `${fm}|${pid}`;
  if (!PS[k]) {
    PS[k] = pastSeasons(fm).then((list) => Promise.all(list.map((sk) => loadPlayerStats(fm, sk)
      .then((st) => {
        const L = (st && st.players) || {};
        return Object.keys(L).some((n) => !n.startsWith('_') && (L[n] || []).some((r) => String(r[0]) === String(pid))) ? sk : null;
      })
      .catch(() => null)))).then((h) => h.filter(Boolean));
  }
  return PS[k];
};
import { norm, acr, sameSquad } from './teamMatch';
// id FotMob di una squadra dentro i dati di una stagione, dal nome: prima uguale, poi sigla, poi nome contenuto (mai due squadre diverse che si somigliano)
export const teamIdByName = (teams, name) => {
  const n = norm(name);
  if (!n || !teams) return null;
  const ent = Object.entries(teams).filter(([, v]) => sameSquad(v, name)); // mai la prima squadra al posto della B (o viceversa)
  let hit = ent.find(([, v]) => norm(v) === n);
  if (!hit) { const a = acr(name); hit = ent.find(([, v]) => { const m = norm(v); return m === a || (a.length >= 3 && acr(v) === n); }); }
  if (!hit) {
    const cand = ent.filter(([, v]) => { const m = norm(v); return m && m.length >= 4 && n.length >= 4 && (m.includes(n) || n.includes(m)); });
    if (cand.length === 1) hit = cand[0];
  }
  return hit ? hit[0] : null;
};

// Statistiche di squadra di una stagione calcolate partita per partita (media a partita, in casa o in trasferta):
// stessa forma delle statistiche stagionali: chiave -> [[null, nome, id squadra, valore, 0, partite]] in ordine di classifica.
const NUMV = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const TEAM_PART_KEYS = ['BallPossesion', 'expected_goals', 'total_shots', 'ShotsOnTarget', 'ShotsOffTarget', 'blocked_shots', 'shots_woodwork', 'shots_inside_box', 'shots_outside_box', 'big_chance', 'big_chance_missed_title',
  'touches_opp_box', 'corners', 'passes', 'accurate_passes', 'own_half_passes', 'opposition_half_passes', 'long_balls_accurate', 'accurate_crosses', 'player_throws', 'Offsides', 'matchstats.headers.tackles', 'interceptions',
  'shot_blocks', 'clearances', 'keeper_saves', 'duel_won', 'ground_duels_won', 'aerials_won', 'dribbles_succeeded', 'yellow_cards', 'red_cards', 'fouls'];
export const teamPartStats = (lid, sk, part) => once(`tps/${lid}/${sk}/${part}`, async () => {
  const d = await loadSeasonMatches(lid, sk);
  if (!d || !d.m) return null;
  const season = await loadSeason(lid, sk);
  const names = (season && season.teams) || {};
  const acc = {};
  Object.values(d.m).forEach((m) => {
    if (!m || !m.s || !m.h || !m.a) return;
    [[0, m.h.id, 'home'], [1, m.a.id, 'away']].forEach(([side, tid, where]) => {
      if (part === 'home' && where !== 'home') return;
      if (part === 'away' && where !== 'away') return;
      TEAM_PART_KEYS.forEach((k) => {
        const arr = m.s[k];
        const v = arr ? NUMV(arr[side]) : null;
        if (v === null) return;
        const a = ((acc[k] = acc[k] || {})[tid] = acc[k][tid] || { s: 0, n: 0 });
        a.s += v; a.n += 1;
      });
    });
  });
  const teams = {};
  Object.entries(acc).forEach(([k, per]) => {
    const rows = Object.entries(per).filter(([, a]) => a.n > 0).map(([tid, a]) => [null, names[tid] || '', Number(tid), a.s / a.n, 0, a.n]);
    if (rows.length < 3) return;
    rows.sort((x, y) => y[3] - x[3]);
    teams[k] = rows;
  });
  return Object.keys(teams).length ? { v: 2, teams, players: {}, fromMatches: true } : null;
});
