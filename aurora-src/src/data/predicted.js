// Statistiche previste di una partita non iniziata: UN SOLO calcolo per la pagina partita (nativo e sito) e Migliori Matchup (regola fissa 25/11/2026).
// Se la partita e' in Migliori Matchup (angoli.json, `update_angoli.py`) si usano quei numeri: casa = (fatti in casa della casa + subiti in trasferta
// dell'ospite) / 2, stagione in corso, in coppa europea coppa + campionato con l'handicap dei minori; fattore casa +15% / -15% su tiri, tiri in porta
// e corner. Falli e fuorigioco: fatti + subiti dell'avversaria di tutte le partite, senza handicap ne' fattore casa. Cartellini: calcolo di sempre.
// Partite fuori da Migliori Matchup (passate, oltre 8 giorni, competizioni non coperte): media stagionale (fatti + subiti) / 2 con lo stesso fattore casa.
import { metricOf } from './standings';
import { archiveMetrics } from './archiveMetrics';
import { RAW } from './load';
import { teamByName } from './teams';

export const HOME_F = 1.15;
export const AWAY_F = 0.85;
// [etichetta, metrica fatti, metrica subiti, fattore casa, campo di Migliori Matchup]
const ROWS = [
  ['Tiri', 'tiri', 'tiriConcessi', true, 'tiri'],
  ['Tiri in porta', 'tiriInPorta', 'tiriInPortaConcessi', true, 'sot'],
  ['Corner', 'corner', 'cornerConcessi', true, 'corners'],
  ['Falli', 'falli', 'fallisubiti', false, 'falli'],
  ['Fuorigioco', 'fuorigioco', 'fuorigiocoAvv', false, 'off'],
  ['Cartellini', 'gialli', 'gialliAvv', false, null],
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const sameTeam = (name, team) => { if (!name || !team) return false; const t = teamByName(name); return (t && t.id === team.id) || norm(name) === norm(team.name); };

// riga di Migliori Matchup della partita (stesso giorno, stesse squadre, stessa sede)
export function matchupFor(match, home, away) {
  const days = RAW.angoli && RAW.angoli.days;
  if (!days || !match || !home || !away) return null;
  const ds = [match.date].filter(Boolean);
  for (const d of ds) {
    const r = ((days[d] && days[d].tutte) || []).find((x) => sameTeam(x.home, home) && sameTeam(x.away, away));
    if (r) return r;
  }
  return null;
}

export function predictedRows(home, away, match) {
  if (!home || !away) return [];
  const mu = match && match.status !== 'finished' ? matchupFor(match, home, away) : null;
  const am = match && match.archive ? archiveMetrics(match) : null;
  const val = (team, key) => (am ? am.value(team.id === home.id ? match.archive.hid : match.archive.aid, key) : metricOf(team.id, key));
  const ok = (v) => typeof v === 'number' && Number.isFinite(v);
  return ROWS.map(([label, own, conc, hf, mk]) => {
    if (mu && mk && ok(mu[`${mk}_home`]) && ok(mu[`${mk}_away`])) {
      const h = mu[`${mk}_home`]; const a = mu[`${mk}_away`];
      return h + a > 0 ? { label, h, a, hf, src: 'matchup' } : null;
    }
    const a1 = val(home, own); const a2 = val(away, conc);
    const b1 = val(away, own); const b2 = val(home, conc);
    if ([a1, a2, b1, b2].some((v) => v === null || v === undefined || Number.isNaN(v))) return null;
    const h = ((a1 + a2) / 2) * (hf ? HOME_F : 1);
    const a = ((b1 + b2) / 2) * (hf ? AWAY_F : 1);
    if (!(h + a > 0)) return null;
    return { label, h, a, hf };
  }).filter(Boolean);
}
