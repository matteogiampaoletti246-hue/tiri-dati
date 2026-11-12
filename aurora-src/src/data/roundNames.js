// Nome italiano di un turno del calendario (colonna 1 di arch/<fm>/<stagione>.json): FotMob li da' in inglese e in forme diverse
// ("12", "1/8", "8th Finals", "2nd Round", "Apertura - Semi-finals", "Championship Round - Round 3"). Una sola funzione per sito e app nativa.
const FIXED = {
  final: 'Finale', finals: 'Finale', 'grand final': 'Finalissima', 'semi-finals': 'Semifinali', 'semi-final': 'Semifinali', '1/2': 'Semifinali',
  'quarter-finals': 'Quarti di finale', 'quarter-final': 'Quarti di finale', '1/4': 'Quarti di finale', '8th finals': 'Ottavi di finale', '1/8': 'Ottavi di finale',
  '16th finals': 'Sedicesimi', '1/16': 'Sedicesimi', '32nd finals': 'Trentaduesimi', '1/32': 'Trentaduesimi', '64th finals': 'Sessantaquattresimi', '1/64': 'Sessantaquattresimi',
  playoff: 'Playoff', 'play-off': 'Playoff', 'play-offs': 'Playoff', playoffs: 'Playoff', 'knockout round play-offs': 'Spareggi', '3rd': 'Finale 3° posto', bronze: 'Finale 3° posto',
  'third place': 'Finale 3° posto', 'preliminary round': 'Turno preliminare', 'qualifying round': 'Turno di qualificazione', 'group stage': 'Fase a gironi',
  'championship round': 'Poule scudetto', 'relegation round': 'Poule salvezza', 'promotion round': 'Poule promozione', 'promotion play-offs': 'Playoff promozione',
  'relegation play-offs': 'Playout', 'championship play-offs': 'Playoff scudetto', quadrangular: 'Quadrangolare', 'preliminary final': 'Finale preliminare',
  'qualification final': 'Finale di qualificazione', 'elimination final': 'Finale a eliminazione', apertura: 'Apertura', clausura: 'Clausura',
  'copa sudamericana play-off': 'Playoff Copa Sudamericana', 'copa libertadores play-off': 'Playoff Copa Libertadores',
};
const part = (p) => {
  const t = String(p).trim();
  const k = t.toLowerCase();
  if (FIXED[k]) return FIXED[k];
  if (/^\d+$/.test(t)) return `Giornata ${t}`;
  let m = /^round (\d+)$/i.exec(t);
  if (m) return `Giornata ${m[1]}`;
  m = /^(\d+)(?:st|nd|rd|th) round$/i.exec(t);
  if (m) return `${m[1]}° turno`;
  m = /^(\d+)(?:st|nd|rd|th) qualifying round$/i.exec(t);
  if (m) return `${m[1]}° turno di qualificazione`;
  m = /^(\d+)\/(\d+)$/.exec(t); // finali di piazzamento ("5/6")
  if (m && Number(m[2]) === Number(m[1]) + 1) return `Finale ${m[1]}°-${m[2]}° posto`;
  return t.replace(/^\w/, (c) => c.toUpperCase());
};
const MEM = new Map();
export const roundIt = (r) => {
  if (r == null || r === '') return '';
  const x = String(r);
  let v = MEM.get(x);
  if (v === undefined) {
    v = x.split(' - ').map(part).join(' · ');
    if (MEM.size < 400) MEM.set(x, v);
  }
  return v;
};
