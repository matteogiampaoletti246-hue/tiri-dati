import { TEAMS, teamById } from '@/data/teams';
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
    .replace(/[̀-ͯ]/g, '');

export function searchAll(q) {
  const needle = norm(q).trim();
  if (!needle) return { needle, leagues: [], teams: [], players: [], referees: [] };
  const rank = (n) => { const x = norm(n); return x.startsWith(needle) ? 0 : x.split(' ').some((w) => w.startsWith(needle)) ? 1 : 2; };
  const byRel = (a, b) => rank(a.name) - rank(b.name);
  const teams = TEAMS.filter((t) => norm(t.name).includes(needle)).sort(byRel).slice(0, 8);
  // competizioni: per nome o per paese ("danimarca" = tutte le danesi), prima quelle dell'app, poi l'archivio (fino a 30)
  const leagues = LEAGUES.filter((l) => norm(l.name).includes(needle) || norm(l.country || '').includes(needle))
    .sort((a, b) => (a.arch ? 1 : 0) - (b.arch ? 1 : 0) || (norm(a.name).includes(needle) ? 0 : 1) - (norm(b.name).includes(needle) ? 0 : 1)).slice(0, 30);
  // il profilo della nazionale di un giocatore di club non e' un risultato a parte: compare sotto il club
  const players = PLAYERS.filter((p) => !(p.nat && p.club) && (norm(p.name).includes(needle) || (p.nick && norm(p.nick).includes(needle)))).sort(byRel).slice(0, 8);
  const referees = REFEREES.filter((r) => norm(r.name).includes(needle)).slice(0, 8);
  return { needle, leagues, teams, players, referees };
}

const initials = (name) => String(name).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// risultati in forma semplice per la Home nativa (solo cio' che serve a disegnare e aprire)
function forNative(q) {
  const r = searchAll(q);
  const color = (t) => (t && t.colors && t.colors[0]) || null;
  return {
    leagues: r.leagues.map((l) => ({ id: l.id, name: l.name, country: l.country || '', logo: l.logo || null, logoDark: l.logoDark || null, path: `/campionato/${l.id}` })),
    teams: r.teams.map((t) => {
      const l = leagueById(t.leagueId);
      const c = l ? l.country || '' : '';
      return { id: t.id, name: t.name, crest: t.crest || null, initials: t.initials || initials(t.name), sub: `${c}${c && l ? ' · ' : ''}${l ? l.name : ''}`, logo: l ? l.logo || null : null, path: `/squadra/${t.id}` };
    }),
    players: r.players.map((p) => {
      const t = teamById(p.teamId);
      return { id: p.id, name: p.name, photo: p.photo || null, team: t ? t.name : p.teamName || '', crest: t ? t.crest || null : null, color: color(t), color2: t && t.colors ? t.colors[1] || null : null, nat: p.natView ? { name: countryIt(p.natView.teamName), fc: flagCode(p.natView.teamName) } : p.nat ? { name: countryIt(p.teamName), fc: flagCode(p.teamName) } : null, path: `/giocatore/${p.id}` };
    }),
    referees: r.referees.map((x) => ({ id: x.id, name: x.name, initials: initials(x.name), path: `/arbitro/${x.id}` })),
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
