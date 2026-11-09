// Nomi veri dei giocatori chiamati con un soprannome (nomi.json di nomi.py: Wikidata, verificato con la data di nascita).
// "Pote" (id FotMob 875133) -> "Pedro Gonçalves". Si cambia solo il nome mostrato: i nomi di FotMob restano le chiavi per gli abbinamenti,
// e la ricerca trova il giocatore anche col soprannome. Senza nome vero (o se il nome non e' piu' il soprannome salvato) resta com'e'.
import { RAW } from './load';

const nk = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Giocatori che tutti chiamano col soprannome (o che hanno solo un nome di battesimo): restano coi nomi soliti.
// Il nome vero si mostra solo per chi nessuno chiama davvero col soprannome (es. Pote -> Pedro Gonçalves).
const TENGO = new Set(('gavi pedri rodri isco raphinha endrick estevao marquinhos richarlison joelinton antony ederson talisca vitinha gabriel pepelu oso paulinho fabinho angelino beto dodo jota pepe vitinho chiquinho allan arthur emerson bernardo amorim costinha evanilson murillo natan rayan robinho samu xeka kaka djene souza juan kevin anderson abner florentino savio vanderson pedrinho deivison janderson ewandro thalisson welinton cassiano brenner anilson calegari romulo talles newerton fabiano rodinei wesley otavio maestro viery lucao barbero').split(' '));

export function realName(fid, name) {
  const N = RAW.nomi;
  if (!N || !fid || Number(fid) <= 0) return name;
  if (TENGO.has(nk(name))) return name;
  const r = N[String(fid)];
  if (!r || !r[0]) return name;
  if (name && r[3] && nk(r[3]) !== nk(name)) return name;
  return r[0];
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
