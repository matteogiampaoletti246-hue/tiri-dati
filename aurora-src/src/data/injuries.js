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

// rientro previsto da FotMob: chiave (early/mid/late + mese, circa N settimane, ecc.) -> data stimata + testo italiano
const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function parseReturn(v) {
  const e = (v.x && v.x.expectedReturn) || {};
  const key = String(e.expectedReturnKey || '').replace('expected_return_date_', '');
  const base = v.s || new Date().toISOString().slice(0, 10);
  const rel = { a_few_days: [4, 'Pochi giorni'], about_a_week: [7, 'Circa una settimana'], about_1_2_weeks: [14, '1-2 settimane circa'], a_few_weeks: [21, 'Alcune settimane'], back_in_training: [7, 'Di nuovo in gruppo'] }[key];
  if (rel) return { ed: addDays(base, rel[0]), text: rel[1] };
  if (key === 'out_for_season') return { ed: null, text: 'Fuori per la stagione' };
  if (key === 'doubtful') return { ed: null, text: 'Dubbio' };
  const prm = String(e.expectedReturnDateParam || '').toLowerCase().split(' ');
  const mi = MONTHS_EN.indexOf(prm[0]);
  if (mi >= 0 && /^(early|mid|late)$/.test(key)) {
    const y = Number(prm[1]);
    const day = key === 'early' ? 10 : key === 'mid' ? 20 : new Date(Date.UTC(y, mi + 1, 0)).getUTCDate();
    const pre = key === 'early' ? 'Inizio' : key === 'mid' ? 'Metà' : 'Fine';
    return { ed: `${y}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, text: `${pre} ${MESI[mi]} ${y}` };
  }
  return { ed: v.ed || null, text: v.e || null };
}

export function injuryOf(playerId) {
  const d = RAW.infortuni && RAW.infortuni.p;
  const v = d && d[playerId];
  if (!v) return null;
  const { ed, text } = parseReturn(v);
  if (ed && ed < new Date().toISOString().slice(0, 10)) return null; // rientro previsto già passato
  const label = text || null;
  return { reason: reasonIt(v.r), ed, label };
}

// il giocatore è fuori alla data della partita (ISO)? Senza data di rientro resta fuori.
export function isOutOn(playerId, matchISO) {
  const i = injuryOf(playerId);
  if (!i) return false;
  if (i.ed && matchISO) return matchISO < i.ed;
  return true;
}
