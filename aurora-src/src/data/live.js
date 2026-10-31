// Punteggi e minuti in tempo reale dal Worker (/s = lista partite ESPN). Si abbina alle nostre
// partite per data e nome squadra e aggiorna stato, minuto e risultato.
import { WORKER } from './load';
import { MATCHES } from './matches';
import { teamById } from './teams';
import { norm } from './util';
import { sameSquad } from './teamMatch';

const STOP = new Set(['fc', 'ac', 'as', 'sc', 'afc', 'fk', 'cf', 'ssc', 'us', 'rc', 'og', 'de', 'ca', 'cd', 'ud', 'sv', 'vfl', 'vfb', 'tsg', '1', 'ca', 'rb', 'ogc', 'cp']);
const ALIAS = { internazionale: 'inter', 'stade rennais': 'rennes', 'bayern munich': 'bayern monaco', 'bayern munchen': 'bayern monaco', 'manchester united': 'manchester united' };

const clean = (s) => {
  let n = norm(s);
  if (ALIAS[n]) n = ALIAS[n];
  return n
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .join(' ');
};
export const same = (a, b) => {
  const x = clean(a);
  const y = clean(b);
  if (!x || !y || !sameSquad(a, b)) return false; // la squadra B non e' la prima squadra
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const tx = x.split(' ').filter((t) => t.length > 3);
  const ty = y.split(' ');
  return tx.some((t) => ty.includes(t));
};

let LAST = 0;
let timer = null;

export async function pullLive() {
  try {
    const r = await fetch(`${WORKER}/s`, { cache: 'no-store' });
    if (!r.ok) return false;
    const d = await r.json();
    (d.ev || []).forEach((e) => {
      if (e.st === 'pre') return;
      const ts = new Date(e.d).getTime();
      const m = MATCHES.find((x) => {
        if (Math.abs(x.ts - ts) > 3 * 3600000) return false;
        const h = teamById(x.homeId);
        const a = teamById(x.awayId);
        return h && a && same(h.name, e.h) && same(a.name, e.a);
      });
      if (!m) return;
      const sh = parseInt(e.sh, 10) || 0;
      const sa = parseInt(e.sa, 10) || 0;
      if (e.st === 'in') {
        m.status = 'live';
        // ESPN e' piu' lenta di FotMob: non abbassa mai un risultato gia' aggiornato (un gol non "sparisce" e ricompare)
        if (!m.liveScore || m.liveScore[0] + m.liveScore[1] <= sh + sa) m.liveScore = [sh, sa];
        const mm = parseInt(String(e.clk || e.det), 10);
        m.liveMinute = e.det === 'HT' ? 45 : Number.isFinite(mm) ? mm : m.liveMinute || null;
        m.liveHalf = e.det === 'HT';
      } else if (e.st === 'post' && (m.status !== 'finished' || !m.score)) {
        m.status = 'finished';
        m.score = [sh, sa];
        m.minute = 90;
        m.liveScore = null;
        m.liveHalf = false;
      }
    });
    LAST = Date.now();
    return true;
  } catch {
    return false;
  }
}

export function startLive() {
  if (timer) return;
  pullLive();
  timer = setInterval(pullLive, 10000);
}
export const lastLive = () => LAST;
