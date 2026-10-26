// Infortuni (FotMob, via GitHub Action): { idGiocatore: { r: motivo inglese, ed: data rientro ISO, e: testo rientro } }
import { RAW } from './load';

const IT = [
  [/cruciate/i, 'Lesione al legamento crociato'], [/meniscus/i, 'Lesione al menisco'], [/hamstring/i, 'Problema ai flessori'],
  [/thigh/i, 'Problema alla coscia'], [/calf/i, 'Problema al polpaccio'], [/groin/i, 'Problema all\'inguine'], [/sprained ankle/i, 'Distorsione alla caviglia'],
  [/broken ankle/i, 'Frattura alla caviglia'], [/ankle/i, 'Problema alla caviglia'], [/achilles/i, 'Problema al tendine d\'Achille'], [/knee/i, 'Problema al ginocchio'],
  [/muscle|strain/i, 'Problema muscolare'], [/broken nose/i, 'Frattura al naso'], [/broken jaw/i, 'Frattura alla mascella'], [/broken leg/i, 'Frattura alla gamba'],
  [/broken wrist/i, 'Frattura al polso'], [/broken finger/i, 'Frattura al dito'], [/collarbone/i, 'Problema alla clavicola'], [/dislocated shoulder/i, 'Lussazione alla spalla'],
  [/shoulder/i, 'Problema alla spalla'], [/elbow/i, 'Problema al gomito'], [/hand/i, 'Problema alla mano'], [/foot/i, 'Problema al piede'], [/heel/i, 'Problema al tallone'],
  [/shin/i, 'Problema alla tibia'], [/hip/i, 'Problema all\'anca'], [/back/i, 'Problema alla schiena'], [/concussion/i, 'Commozione cerebrale'], [/head/i, 'Trauma alla testa'],
  [/eye/i, 'Problema all\'occhio'], [/leg/i, 'Problema alla gamba'], [/tendon/i, 'Problema al tendine'], [/illness/i, 'Malattia'], [/gastro/i, 'Problema gastrointestinale'],
  [/knock/i, 'Colpo'], [/discomfort/i, 'Fastidio fisico'], [/fitness/i, 'Non al meglio della forma'], [/injur/i, 'Infortunio'],
];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export const reasonIt = (r) => {
  if (!r) return 'Infortunato';
  const hit = IT.find(([re]) => re.test(r));
  return hit ? hit[1] : r;
};

// rientro: cerca in qualsiasi campo extra una data (YYYY-MM-DD) o un testo
function parseReturn(v) {
  let ed = v.ed || null;
  let text = v.e || null;
  const x = v.x || {};
  const scan = (o) => {
    if (!o) return;
    if (typeof o === 'string') {
      const m = o.match(/(\d{4}-\d{2}-\d{2})/);
      if (m && !ed && /return|rientro/i.test(o) === false) { /* data generica */ }
      return;
    }
    if (typeof o === 'object') Object.entries(o).forEach(([k, val]) => {
      if (/return/i.test(k)) {
        if (typeof val === 'string') { text = text || val; const m = val.match(/(\d{4}-\d{2}-\d{2})/); if (m) ed = ed || m[1]; }
        else if (val && typeof val === 'object') {
          const u = val.utcTime || val.date || val.value;
          if (typeof u === 'string' && /\d{4}-\d{2}-\d{2}/.test(u)) ed = ed || u.slice(0, 10);
          if (val.fallback || val.text) text = text || val.fallback || val.text;
        }
      } else if (val && typeof val === 'object') scan(val);
    });
  };
  scan(x);
  return { ed, text };
}

export function injuryOf(playerId) {
  const d = RAW.infortuni && RAW.infortuni.p;
  const v = d && d[playerId];
  if (!v) return null;
  const { ed, text } = parseReturn(v);
  if (ed && ed < new Date().toISOString().slice(0, 10)) return null; // rientro previsto già passato
  let label = null;
  if (ed) { const [y, m, dd] = ed.split('-').map(Number); label = `${dd} ${MESI[m - 1]} ${y}`; }
  else if (text) label = text;
  return { reason: reasonIt(v.r), ed, label };
}

// il giocatore è fuori alla data della partita (ISO)? Senza data di rientro resta fuori.
export function isOutOn(playerId, matchISO) {
  const i = injuryOf(playerId);
  if (!i) return false;
  if (i.ed && matchISO) return matchISO < i.ed;
  return true;
}
