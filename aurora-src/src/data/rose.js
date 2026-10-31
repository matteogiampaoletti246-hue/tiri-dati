// Rose dei campionati minori (rose.json, scaricate da FotMob): stessi ruoli e stesse righe dei campionati maggiori.
import { BASE, WORKER } from './load';
import { sameSquad } from './teamMatch';
import { lruGet, lruSet } from '@/lib/lru';

let DATA = null;
let PROM = null;
let IDX = null;
const nrm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const loadRose = () => {
  if (!PROM) {
    PROM = fetch(`${BASE}rose.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((d) => { DATA = d || {}; BYID = null; BYNORM = null; IDX = null; return DATA; });
  }
  return PROM;
};
export const roseLoaded = () => DATA !== null;
let BYID = null;
let BYNORM = null;
// La rosa di una squadra si trova per id FotMob (sicuro), poi per nome uguale, poi per nome normalizzato e, solo se unico, per nome contenuto.
export const roseOf = (team) => {
  if (!DATA || !team) return null;
  if (DATA[team.name]) return DATA[team.name];
  if (!BYID) {
    BYID = {}; BYNORM = {};
    Object.entries(DATA).forEach(([k, v]) => { if (v && v.id) BYID[String(v.id)] = v; const n = nrm(k); (BYNORM[n] = BYNORM[n] || []).push(v); });
  }
  if (team.fmId && BYID[String(team.fmId)]) return BYID[String(team.fmId)];
  const n = nrm(team.name);
  const same = BYNORM[n];
  if (same) { const hit = same.find((v) => !team.leagueId || v.lg === team.leagueId) || (same.length === 1 ? same[0] : null); if (hit) return hit; }
  // "Eintracht Frankfurt" = "Frankfurt": nome contenuto, solo se una sola squadra combacia
  if (n.length >= 5) {
    const cand = Object.entries(DATA).filter(([k, v]) => { const m = nrm(k); return m.length >= 5 && (m.includes(n) || n.includes(m)) && sameSquad(k, team.name) && (!team.leagueId || v.lg === team.leagueId); });
    if (cand.length === 1) return cand[0][1];
  }
  return null;
};
// giocatore di una rosa dall'id FotMob
export const rosePlayer = (fid) => {
  if (!DATA) return null;
  if (!IDX) {
    IDX = {};
    Object.entries(DATA).forEach(([team, v]) => (v.p || []).forEach((r) => { IDX[String(r[0])] = { r, team, lg: v.lg }; }));
  }
  return IDX[String(fid)] || null;
};

// Rose di tutte le squadre dell'indice (rosa/<id%100>.json, rose_tutte.py): per ruolo, con allenatore. Capienza fissa.
const RS = new Map();
const rosaShard = (n) => {
  const hit = lruGet(RS, n);
  if (hit) return hit;
  const p = fetch(`${BASE}rosa/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  lruSet(RS, n, p, 12);
  return p;
};
export const rosaOf = async (team) => {
  const fid = team && (team.fmId || (/teamlogo\/(\d+)\.png/.exec(String(team.crest || '')) || [])[1]);
  if (!fid) return null;
  return (await rosaShard(Number(fid) % 100))[String(fid)] || null;
};
// rose.json insufficiente: pochi giocatori o senza ruoli (si cerca quella completa)
// Rose di LiveScore (Cloudflare KV, via worker /r): per le squadre dove FotMob non ha la rosa o e' povera. Una chiave per campionato; mappa id FotMob -> campionato.
// Ruoli e numeri solo come li da la fonte (mai indovinati); id negativo = senza collegamento al giocatore (non e' un id FotMob).
const LSR = new Map();
const lsGet = (k) => {
  const hit = lruGet(LSR, k);
  if (hit) return hit;
  const p = fetch(`${WORKER}/r?k=${k}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  lruSet(LSR, k, p, 24);
  return p;
};
const LS_ROLE = { goalkeeper: 'GK', defender: 'DEF', midfielder: 'MID', forward: 'ATT' };
export const lsRoster = async (team, fm) => {
  const map = await lsGet('idx:fmmap');
  if (!map || !team) return null;
  const fid = team.fmId || (/teamlogo\/(\d+)\.png/.exec(String(team.crest || '')) || [])[1];
  const key = (fid && map.t && map.t[String(fid)]) || (fm && map.l && map.l[String(fm)]);
  if (!key) return null;
  const lg = await lsGet(`idx:lg/${key}`);
  const list = (lg && lg.t) || [];
  const hit = list.find((t) => fid && t.fm && String(t.fm) === String(fid)) || list.find((t) => nrm(t.n) === nrm(team.name) && sameSquad(t.n, team.name));
  if (!hit || !(hit.p || []).length) return null;
  const p = hit.p.map((r, i) => [-(Number(r[0]) || 900000000 + i), r[1], LS_ROLE[r[2]] || 'UNK', r[3] || null, r[4] || null, null, null, null, 0, 0, 0, 0]);
  return { p, co: (hit.co && hit.co[0]) || null };
};
export const rosePoor = (r) => { const p = (r && r.p) || []; return p.length < 11 || p.some((x) => x[2] === 'UNK'); };

// Rosa ricavata dalla stagione in corso quando la squadra non e' in rose.json (squadre delle competizioni dell'archivio, squadre B,
// rose vuote): chi ha giocato la stagione per quella squadra, da tutte le fonti dell'archivio insieme (molte competizioni minori hanno
// solo alcune di queste): minuti e formazioni delle partite, classifiche ufficiali della stagione (pannello Giocatori), gol e cartellini.
// Righe come quelle di rose.json: [id FotMob, nome, ruolo 'UNK', numero, paese, eta', altezza, voto, -, -, -, minuti]. null = nessuna fonte.
export const seasonRoster = async (team) => {
  const { FM_ID, currentSeason, loadSeason, loadSeasonStats, loadSeasonMatches, statsFromMatches, teamIdByName } = await import('./archive');
  const fm = team && FM_ID[team.leagueId];
  const R = await rosaOf(team);
  const sk = fm ? await currentSeason(fm) : null;
  // prima la rosa scaricata (per ruolo); le competizioni servono solo per aprire i giocatori
  if (R && R.p && R.p.length && !rosePoor(R)) return { fm, sk, p: R.p, co: R.co, ci: R.ci };
  // rosa FotMob assente o povera: rosa di LiveScore (per ruolo) se ne ha di piu'
  const L = await lsRoster(team, fm).catch(() => null);
  if (L && L.p.length > ((R && R.p) || []).length) return { fm, sk, p: L.p, co: L.co || (R && R.co), ci: R && R.ci };
  if (R && R.p && R.p.length) return { fm, sk, p: R.p, co: R.co, ci: R.ci };
  if (!fm || !sk) return null;
  const safe = (p) => p.catch(() => null);
  const [season, st, off, det] = await Promise.all([safe(loadSeason(fm, sk)), safe(statsFromMatches(fm, sk)), safe(loadSeasonStats(fm, sk)), safe(loadSeasonMatches(fm, sk))]);
  const tid = String((season && teamIdByName(season.teams, team.name)) || team.fmId || '');
  if (!tid) return null;
  const out = new Map();
  const add = (id, name, min = 0) => {
    if (!id || !name) return;
    const k = String(id);
    const r = out.get(k);
    if (r) { r[11] = Math.max(r[11], min); return; }
    out.set(k, [Number(id), name, 'UNK', null, null, null, null, null, 0, 0, 0, min]);
  };
  ((st && st.players && st.players.mins_played) || []).forEach((r) => { if (String(r[2]) === tid) add(r[0], r[1], r[3] || 0); });
  Object.entries((off && off.players) || {}).forEach(([k, l]) => { if (!k.startsWith('_') && Array.isArray(l)) l.forEach((r) => { if (String(r[2]) === tid) add(r[0], r[1]); }); });
  const sides = {};
  ((season && season.fix) || []).forEach((f) => { sides[String(f[0])] = [String(f[2]), String(f[3])]; });
  Object.entries((det && det.m) || {}).forEach(([mid, m]) => {
    if (!m) return;
    [m.h, m.a].forEach((side) => {
      if (side && String(side.id) === tid) Object.values(side).forEach((l) => { if (Array.isArray(l)) l.forEach((r) => { if (Array.isArray(r)) add(r[0], r[1]); }); });
    });
    const sd = sides[mid];
    if (sd) (m.e || []).forEach((e) => { if (e && Array.isArray(e.p) && (e.isHome ? sd[0] : sd[1]) === tid) add(e.p[0], e.p[1]); });
  });
  return out.size ? { fm, sk, p: [...out.values()], co: R && R.co, ci: R && R.ci } : null;
};
