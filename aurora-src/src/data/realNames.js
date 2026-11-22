// Nome mostrato = quello di FotMob (regola fissa 22/11/2026, richiesta utente: "Koke", non "Jorge Resurreccion").
// nomi_fm.json (nomi_fm.py) = {id FotMob: nome FotMob} per i giocatori che in qualche fonte hanno un nome diverso. Si cambia SOLO il nome
// mostrato: id e nomi delle fonti restano le chiavi degli abbinamenti (niente schede doppie, formazioni invariate). Senza voce resta il nome
// della fonte (FotMob nella gran parte dei casi; diretta.it / LiveScore per chi FotMob non ha). Il vecchio "nome vero" da Wikidata
// (nomi.json, regola del 09/11/2026) non si mostra piu'.
import { RAW } from './load';

const nk = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function realName(fid, name) {
  const N = RAW.nomiFm;
  if (!N || !fid || Number(fid) <= 0) return name;
  const r = N[String(fid)];
  return typeof r === 'string' && r ? r : name;
}

// Una partita: i nomi degli eventi (gol, assist, cartellini, cambi) seguono quelli delle formazioni, cosi' gli abbinamenti per nome
// tra eventi e giocatori (scheda in partita, statistiche) restano gli stessi anche col nome vero.
export function renameEvents(m) {
  if (!m || !m.events || !m.lineup) return m;
  const map = {};
  ['home', 'away'].forEach((s) => {
    const l = m.lineup[s];
    if (l) [...(l.xi || []), ...(l.bench || [])].forEach((e) => { if (e && e.rawName && e.rawName !== e.name) map[nk(e.rawName)] = e.name; });
  });
  if (!Object.keys(map).length) return m;
  const fix = (n) => (n && map[nk(n)]) || n;
  m.events = m.events.map((e) => ({ ...e, name: fix(e.name), inName: e.inName ? fix(e.inName) : e.inName, assist: e.assist ? fix(e.assist) : e.assist }));
  return m;
}
