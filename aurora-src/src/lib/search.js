import { TEAMS, teamById, teamByFm } from '@/data/teams';
import { LEAGUES, leagueById } from '@/data/leagues';
import { PLAYERS } from '@/data/players';
import { REFEREES } from '@/data/referees';
import { bootData } from '@/data';
import { countryIt, flagCode } from '@/data/carriere';
import { getTheme, setTheme } from '@/lib/theme';
import { perfEnabled, setPerf } from '@/lib/perfMon';

// Ricerca unica (tendina della Home del sito e Home nativa): stessi risultati, stesso ordine, stesse sezioni.
export const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // lettere che NFD non scompone: si cercano con la lettera semplice (Tıknaz = tiknaz, Ødegaard = odegaard, Łukasz = lukasz)
    .replace(/[ı]/g, 'i').replace(/[øœ]/g, 'o').replace(/ł/g, 'l').replace(/[đð]/g, 'd').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/þ/g, 'th');

// nomi gia' normalizzati (legati all'oggetto: spariscono con lui, nessuna cache che cresce)
const NN = new WeakMap();
const nn = (o, key = 'name') => {
  let m = NN.get(o);
  if (!m) { m = {}; NN.set(o, m); }
  if (m[key] === undefined) m[key] = norm(o[key] || '');
  return m[key];
};
// distanza di modifica con scambio di lettere vicine (Damerau, OSA), ferma appena supera `k`
function dist(a, b, k) {
  const la = a.length; const lb = b.length;
  if (Math.abs(la - lb) > k) return k + 1;
  let p2 = null; let p1 = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const c = [i]; let low = i;
    for (let j = 1; j <= lb; j++) {
      let v = Math.min(p1[j] + 1, c[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
      c.push(v); if (v < low) low = v;
    }
    if (low > k) return k + 1;
    p2 = p1; p1 = c;
  }
  return p1[lb];
}
// ricerca tollerante (concept "Smart Tag Input"): una lettera sbagliata, mancante, in piu' o due lettere scambiate non
// fanno sparire il risultato ("romaldo" trova Ronaldo, "lautraro" trova Lautaro). Vale per parole di almeno 4 lettere;
// dalla 8a lettera in su si tollerano due errori. Si confronta con ogni parola del nome e con il suo inizio (si sta ancora scrivendo).
const tol = (n) => (n >= 8 ? 2 : n >= 4 ? 1 : 0);
export function fuzzyScore(name, needle) {
  const k = tol(needle.length);
  if (!k) return 99;
  const words = name.split(/[\s\-']+/).filter(Boolean);
  let best = 99;
  const parts = needle.split(' ').filter(Boolean);
  if (parts.length > 1) {
    // piu' parole: ognuna deve trovare una parola del nome
    let tot = 0;
    for (const q of parts) { let b = 99; const kk = Math.max(tol(q.length), q.length >= 3 ? 0 : 0); for (const w of words) { if (w.startsWith(q)) { b = 0; break; } if (kk) { b = Math.min(b, dist(q, w.slice(0, q.length), kk), dist(q, w, kk)); } } if (b > Math.max(kk, 0)) return 99; tot += b; }
    return tot;
  }
  for (const w of words) {
    best = Math.min(best, dist(needle, w, k));
    if (w.length > needle.length) best = Math.min(best, dist(needle, w.slice(0, needle.length), k));
    if (!best) break;
  }
  return best <= k ? best : 99;
}

export function searchAll(q) {
  const needle = norm(q).trim();
  if (!needle) return { needle, leagues: [], teams: [], players: [], referees: [], fuzzy: false };
  const rank = (n) => { const x = norm(n); return x.startsWith(needle) ? 0 : x.split(' ').some((w) => w.startsWith(needle)) ? 1 : 2; };
  const byRel = (a, b) => rank(a.name) - rank(b.name);
  let fuzzy = false;
  // prima le corrispondenze esatte; se sono poche si aggiungono quelle "quasi giuste", dalla piu' vicina
  const withFuzzy = (list, exact, max, names) => {
    // solo da 5 lettere e solo se le corrispondenze esatte sono meno di 3 (scrivendo "Laut" non escono Lahti o Lausanne)
    if (exact.length >= 3 || needle.length < 5) return exact.slice(0, max);
    const seen = new Set(exact);
    const extra = [];
    for (const o of list) {
      if (seen.has(o)) continue;
      const sc = Math.min(...names(o).map((x) => fuzzyScore(x, needle)));
      if (sc < 99) extra.push([sc, o]);
    }
    extra.sort((a, b) => a[0] - b[0]);
    if (extra.length) fuzzy = true;
    return exact.concat(extra.slice(0, max - exact.length).map((e) => e[1]));
  };
  const teams = withFuzzy(TEAMS, TEAMS.filter((t) => nn(t).includes(needle)).sort(byRel), 8, (t) => [nn(t)]);
  // competizioni: per nome o per paese ("danimarca" = tutte le danesi), prima quelle dell'app, poi l'archivio (fino a 30)
  const leagues = LEAGUES.filter((l) => nn(l).includes(needle) || nn(l, 'country').includes(needle))
    .sort((a, b) => (a.arch ? 1 : 0) - (b.arch ? 1 : 0) || (nn(a).includes(needle) ? 0 : 1) - (nn(b).includes(needle) ? 0 : 1)).slice(0, 30);
  // il profilo della nazionale di un giocatore di club non e' un risultato a parte: compare sotto il club
  // si trova anche col nome scritto come nel profilo della nazionale (es. club "Demir Ege Tıknaz", nazionale "Demir Tıknaz")
  const hit = (p) => p && (nn(p).includes(needle) || (p.nick && nn(p, 'nick').includes(needle)));
  const pool = PLAYERS.filter((p) => !(p.nat && p.club));
  const pnames = (p) => [nn(p), p.nick ? nn(p, 'nick') : '', p.natView ? nn(p.natView) : ''].filter(Boolean);
  const players = withFuzzy(pool, pool.filter((p) => hit(p) || hit(p.natView)).sort(byRel), 8, pnames);
  const referees = withFuzzy(REFEREES, REFEREES.filter((r) => nn(r).includes(needle)), 8, (r) => [nn(r)]);
  return { needle, leagues, teams, players, referees, fuzzy };
}

// parte del nome che corrisponde a quanto scritto (per evidenziarla mentre si scrive): [inizio, fine] o null
export function matchSpan(name, q) {
  const n = norm(name); const needle = norm(q).trim();
  if (!needle) return null;
  const i = n.indexOf(needle);
  if (i >= 0) return [i, i + needle.length];
  // corrispondenza tollerante: la parola piu' vicina, per la lunghezza scritta
  let at = 0; let best = null;
  for (const w of n.split(' ')) { const d = Math.min(dist(needle, w.slice(0, needle.length), 2), dist(needle, w, 2)); if (d <= 2 && (!best || d < best[2])) best = [at, at + Math.min(w.length, needle.length), d]; at += w.length + 1; }
  return best ? [best[0], best[1]] : null;
}

const initials = (name) => String(name).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// risultati in forma semplice per la Home nativa (solo cio' che serve a disegnare e aprire)
function forNative(q) {
  const r = searchAll(q);
  const color = (t) => (t && t.colors && t.colors[0]) || null;
  const sp = (n) => matchSpan(n, q);
  return {
    fuzzy: r.fuzzy,
    leagues: r.leagues.map((l) => ({ id: l.id, name: l.name, country: l.country || '', logo: l.logo || null, logoDark: l.logoDark || null, path: `/campionato/${l.id}`, hl: sp(l.name) })),
    teams: r.teams.map((t) => {
      const l = leagueById(t.leagueId);
      const c = l ? l.country || '' : '';
      return { id: t.id, name: t.name, crest: t.crest || null, initials: t.initials || initials(t.name), sub: `${c}${c && l ? ' · ' : ''}${l ? l.name : ''}`, logo: l ? l.logo || null : null, path: `/squadra/${t.id}`, hl: sp(t.name) };
    }),
    players: r.players.map((p) => {
      // un solo banner: prima stemma e club, poi bandiera e nazionale. Chi ha solo il profilo della nazionale: club dalle carriere
      // (calc_extra.py); senza club noto la bandiera prende il posto dello stemma
      if (p.nat) {
        const fc = flagCode(p.teamName);
        const ct = p.clubName ? teamByFm(p.clubFm) : null;
        const crest = ct ? ct.crest || null : p.clubFm ? `https://images.fotmob.com/image_resources/logo/teamlogo/${p.clubFm}.png` : null;
        return p.clubName
          ? { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: ct ? ct.name : p.clubName, crest, color: color(ct), color2: ct && ct.colors ? ct.colors[1] || null : null, nat: { name: countryIt(p.teamName), fc }, path: `/giocatore/${p.id}` }
          : { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: countryIt(p.teamName), crest: fc ? new URL(`${import.meta.env.BASE_URL}flags/${fc}.png`, window.location.href).href : null, color: null, color2: null, nat: null, path: `/giocatore/${p.id}` };
      }
      const t = teamById(p.teamId);
      return { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: t ? t.name : p.teamName || '', crest: t ? t.crest || null : null, color: color(t), color2: t && t.colors ? t.colors[1] || null : null, nat: p.natView ? { name: countryIt(p.natView.teamName), fc: flagCode(p.natView.teamName) } : p.nat ? { name: countryIt(p.teamName), fc: flagCode(p.teamName) } : null, path: `/giocatore/${p.id}` };
    }),
    referees: r.referees.map((x) => ({ id: x.id, name: x.name, initials: initials(x.name), path: `/arbitro/${x.id}`, hl: sp(x.name) })),
  };
}

const post = (m) => { try { window.ReactNativeWebView.postMessage(m); } catch (e) { /* ignora */ } };

// comandi della Home nativa: ricerca (`srch:<seq>:<json>`), tema e diagnostica del menu a tendina (`ui:state:<tema>:<0|1>`)
export function installNativeBridge() {
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return;
  window.__slSearch = (q, seq) => { bootData().then(() => post(`srch:${seq}:${JSON.stringify(forNative(q))}`)).catch(() => {}); };
  window.__slCmd = (cmd, v) => {
    if (cmd === 'theme') setTheme(v);
    else if (cmd === 'perf') setPerf(!!v);
    post(`ui:state:${getTheme()}:${perfEnabled() ? 1 : 0}`);
  };
}
