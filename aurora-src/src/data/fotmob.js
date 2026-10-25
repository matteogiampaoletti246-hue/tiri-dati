// Dettaglio partita in diretta da FotMob (tramite il Worker): cronologia, statistiche per tempo,
// mappa tiri, momentum e formazioni. Vale per partite live, di oggi e anche per quelle passate.
import { WORKER } from './load';
import { buildLineup } from './matches';
import { teamById } from './teams';
import { same } from './live';
import { slug } from './util';

const dayCache = {};
const fxCache = {};

const jget = async (url) => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

async function fmDay(iso) {
  const key = iso.replace(/-/g, '');
  if (dayCache[key] && Date.now() - dayCache[key].at < 25000) return dayCache[key].list;
  const d = await jget(`${WORKER}/f?date=${key}`);
  dayCache[key] = { at: Date.now(), list: d.m || [] };
  return dayCache[key].list;
}

export async function findFmId(m) {
  if (m.fmId) return m.fmId;
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  if (!home || !away) return null;
  const list = await fmDay(m.date);
  const hit = list.find((x) => same(home.name, x.h) && same(away.name, x.a));
  if (hit) m.fmId = hit.id;
  return m.fmId || null;
}

// ───── traduzioni ─────
const GROUP = {
  top_stats: 'Statistiche principali', shots: 'Tiri', expected_goals: 'Expected goals (xG)', passes: 'Passaggi',
  defense: 'Difesa', duels: 'Duelli', discipline: 'Disciplina', physical_metrics: 'Prestazione fisica', attack: 'Attacco',
};
const LABEL = {
  BallPossesion: 'Possesso palla', expected_goals: 'Expected goals (xG)', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta',
  touches_opp_box: 'Tocchi in area avversaria', big_chance: 'Occasioni nitide', big_chance_missed_title: 'Occasioni nitide sbagliate',
  accurate_passes: 'Passaggi riusciti', yellow_cards: 'Ammonizioni', red_cards: 'Espulsioni', corners: 'Calci d\'angolo',
  ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri bloccati', shots_woodwork: 'Legni colpiti', shots_inside_box: 'Tiri da dentro l\'area',
  shots_outside_box: 'Tiri da fuori area', expected_goals_open_play: 'xG da azione', expected_goals_set_play: 'xG da palla inattiva',
  expected_goals_non_penalty: 'xG senza rigori', expected_goals_on_target: 'xG sui tiri in porta (xGOT)',
  physical_metrics_distance_covered: 'Distanza percorsa', physical_metrics_running: 'Distanza in corsa', physical_metrics_sprinting: 'Distanza in sprint',
  physical_metrics_number_of_sprints: 'Numero di sprint', passes: 'Passaggi', own_half_passes: 'Nella propria metà campo',
  opposition_half_passes: 'Nella metà campo avversaria', long_balls_accurate: 'Lanci lunghi riusciti', accurate_crosses: 'Cross riusciti',
  player_throws: 'Rimesse laterali', Offsides: 'Fuorigioco', 'matchstats.headers.tackles': 'Contrasti', interceptions: 'Intercetti',
  shot_blocks: 'Blocchi', clearances: 'Respinte', keeper_saves: 'Parate del portiere', duel_won: 'Duelli vinti',
  ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti', dribbles_succeeded: 'Dribbling riusciti',
  fouls: 'Falli commessi',
};
export const labelIt = (key, fallback) => LABEL[key] || fallback;

const ptsFmt = (fmt, v, tot) => {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : parseFloat(v);
  const f = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100).replace('.', ','));
  if (fmt === 'integerWithPercentage' || fmt === 'fractionWithPercentage') {
    if (tot) return `${f(n)}/${f(tot)} (${Math.round((n / tot) * 100)}%)`;
    return f(n);
  }
  if (fmt === 'percent') return `${f(n)}%`;
  return f(n);
};

function buildStats(periodGroups) {
  if (!periodGroups) return null;
  return periodGroups.map(([key, title, rows]) => ({
    key,
    title: GROUP[key] || title,
    rows: rows.map(([k, lab, a, b, ta, tb, fmt]) => ({
      key: k,
      label: LABEL[k] || lab,
      home: Number(a) || 0,
      away: Number(b) || 0,
      homeText: key === 'top_stats' && k === 'BallPossesion' ? `${a}%` : ptsFmt(fmt, a, ta),
      awayText: key === 'top_stats' && k === 'BallPossesion' ? `${b}%` : ptsFmt(fmt, b, tb),
    })),
  }));
}

const bucket = (mo) => {
  if (!mo || !mo.length) return [];
  const out = [];
  for (let start = 0; start < 96; start += 3) {
    const vals = mo.filter((p) => p.minute >= start && p.minute < start + 3).map((p) => p.value);
    if (vals.length) out.push(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
  }
  return out;
};

const OUT = { Goal: 'Gol', AttemptSaved: 'Parato', Miss: 'Fuori', Post: 'Fuori', Blocked: 'Murato' };
const BODY = { RightFoot: 'Destro', LeftFoot: 'Sinistro', Header: 'Testa', OtherBodyParts: 'Altro' };

export function applyFm(m, d, playerLookup) {
  if (!d) return m;
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);

  // eventi
  const events = [];
  (d.ev || []).forEach((e) => {
    const team = e.h ? 'home' : 'away';
    const minute = e.a ? `${e.t}+${e.a}` : e.t;
    if (e.ty === 'Goal') events.push({ minute, type: 'goal', team, name: e.n, assist: e.as, pen: !!e.pen, og: !!e.og, score: e.sc ? [e.sc[0], e.sc[1]] : null });
    else if (e.ty === 'Card') events.push({ minute, type: /red/i.test(e.cd || '') ? 'red' : 'yellow', team, name: e.n, second: /yellowred|second/i.test(e.cd || '') });
    else if (e.ty === 'Substitution') events.push({ minute, type: 'sub', team, name: e.o, inName: e.n });
  });
  if (events.length || d.started) m.events = events;

  // stato e risultato
  if (d.sc && d.sc[0] != null) {
    if (d.st) {
      m.liveScore = [Number(d.sc[0]), Number(d.sc[1])];
      const mm = parseInt(String(d.clk), 10);
      if (Number.isFinite(mm)) m.liveMinute = mm;
      m.liveHalf = !!d.ht;
      m.status = 'live';
    } else if (d.fin) {
      m.score = [Number(d.sc[0]), Number(d.sc[1])];
      m.status = 'finished';
      m.minute = 90;
      m.liveScore = null;
      m.liveHalf = false;
    }
  }

  // statistiche per tempo
  const all = buildStats(d.stats && d.stats.All);
  if (all) {
    m.statPeriods = { all, first: buildStats(d.stats.FirstHalf), second: buildStats(d.stats.SecondHalf) };
    m.statGroups = all.map((g) => ({ title: g.title, rows: g.rows }));
    const flat = {};
    all.forEach((g) => g.rows.forEach((r) => { flat[r.key] = [r.home, r.away]; }));
    m.stats = {
      possesso: flat.BallPossesion, xg: flat.expected_goals, tiri: flat.total_shots, tiriInPorta: flat.ShotsOnTarget,
      occasioni: flat.big_chance, corner: flat.corners, falli: flat.fouls, cartellini: flat.yellow_cards, passaggi: flat.passes, fuorigioco: flat.Offsides,
    };
    Object.keys(m.stats).forEach((k) => !m.stats[k] && delete m.stats[k]);
  }

  m.momentum = bucket(d.mo);

  // mappa tiri
  m.shots = (d.sh || []).map((s) => ({
    side: s[2] === d.hi ? 'home' : 'away',
    outcome: s[7] ? 'Murato' : OUT[s[6]] || 'Fuori',
    onTarget: !!s[8],
    playerName: s[3],
    minute: s[1] ? `${s[0]}+${s[1]}` : s[0],
    min: s[0],
    body: BODY[s[15]] || 'Altro',
    situation: s[16],
    xg: s[13] || 0,
    xgot: s[14] || 0,
    period: s[18],
    own: !!s[17],
    px: s[4],
    py: s[5],
    x: Math.max(0, Math.min(1, s[4] / 105)),
    y: Math.max(0, Math.min(1, s[5] / 68)),
  }));
  m.shotsFm = true;

  // formazioni
  if ((d.h && d.h.s && d.h.s.length) || (d.a && d.a.s && d.a.s.length)) {
    const evRows = [];
    (d.ev || []).forEach((e) => {
      const side = e.h ? 'h' : 'a';
      if (e.ty === 'Card') evRows.push([/red/i.test(e.cd || '') ? 'redcard' : 'yellowcard', e.t, 0, '', side, e.n]);
      if (e.ty === 'Substitution') evRows.push(['substitution', e.t, 0, '', side, e.o, 0, 0, 0, 0, e.n]);
    });
    const make = (side, raw, team) => {
      if (!raw || !raw.s || !raw.s.length) return null;
      const pl = [];
      [...raw.s, ...(raw.b || [])].forEach((p) => pl.push([p[0], side, p[6] == null ? null : Math.round(p[6] * 10) / 10]));
      const pseudo = { ev: evRows, pl };
      const lu = buildLineup(side, { f: raw.f, s: raw.s.map((p) => [p[0], p[1], p[2], p[3], p[4], null]), b: (raw.b || []).map((p) => [p[0], p[1], 0, 0, false, null]), co: raw.co && raw.co.n }, pseudo, team, playerLookup);
      const byName = {};
      [...raw.s, ...(raw.b || [])].forEach((p) => { byName[p[0]] = p; });
      const fix = (e) => {
        const src = byName[e.name];
        if (src) {
          if (!e.photo) e.photo = src[5];
          e.fmId = src[7];
          e.captain = !!src[4];
        }
        return e;
      };
      lu.xi = lu.xi.map(fix);
      lu.bench = lu.bench.map(fix);
      return lu;
    };
    m.lineup = { home: make('h', d.h, home), away: make('a', d.a, away) };
  }

  if (d.ref && d.ref.n) {
    m.refereeName = d.ref.n;
    m.refereeId = slug(d.ref.n);
  }
  m.detail = true;
  m.fm = true;
  m.fmAt = Date.now();
  return m;
}

export async function loadFm(m, playerLookup, force = false) {
  if (!m || m.placeholder && !m.date) return m;
  if (m.status === 'scheduled' && m.ts - Date.now() > 2 * 3600000) return m;
  if (!force && m.fm && m.status !== 'live' && Date.now() - (m.fmAt || 0) < 300000) return m;
  try {
    const id = await findFmId(m);
    if (!id) return m;
    const c = fxCache[id];
    let d;
    if (c && Date.now() - c.at < 15000) d = c.d;
    else {
      d = await jget(`${WORKER}/fx?id=${id}`);
      fxCache[id] = { at: Date.now(), d };
    }
    applyFm(m, d, playerLookup);
  } catch {
    /* dettaglio non raggiungibile: si resta con i dati già presenti */
  }
  return m;
}
