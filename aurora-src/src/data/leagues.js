// Campionati. I colori dei banner sono scelti qui; i loghi arrivano da data.json.
// Per aggiungere un campionato alla Home basta una riga in LEAGUES.
import { RAW } from './load';

export const LEAGUES = [
  { id: 'serie-a', name: 'Serie A', country: 'Italia', countryUpper: 'ITALIA', colors: ['#0B2A5B', '#1E8E9C'] },
  { id: 'premier-league', name: 'Premier League', country: 'Inghilterra', countryUpper: 'INGHILTERRA', colors: ['#2C1157', '#0E7A72'] },
  { id: 'la-liga', name: 'LaLiga', country: 'Spagna', countryUpper: 'SPAGNA', colors: ['#14213D', '#C8473C'] },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germania', countryUpper: 'GERMANIA', colors: ['#7A1420', '#2B2B33'] },
  { id: 'ligue-1', name: 'Ligue 1', country: 'Francia', countryUpper: 'FRANCIA', colors: ['#0A1A3C', '#3C6E9E'] },
  { id: 'champions-league', name: 'Champions League', country: 'Europa', countryUpper: 'EUROPA', colors: ['#0A1C5E', '#7FB6E8'] },
  { id: 'europa-league', name: 'Europa League', country: 'Europa', countryUpper: 'EUROPA', colors: ['#7A3A06', '#E08A2B'] },
].map((l) => ({ season: '', logo: null, logoDark: null, banner: null, ...l }));

// Campionati presenti solo nel calcolatore (da data.json): nome + id.
export const CALC_LEAGUES = [];

export const TOP5 = ['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1'];

// Colore del campionato: lo usano le schede neutre di una partita (che riguardano entrambe le squadre).
export const LEAGUE_TINT = {
  'serie-a': '#38A2FF',
  'premier-league': '#9B6BFF',
  'la-liga': '#F28B82',
  bundesliga: '#E5484D',
  'ligue-1': '#4FC3F7',
  'champions-league': '#2F5BE0',
  'europa-league': '#F5902B',
  'conference-league': '#2FBF71',
};
export const leagueTint = (id) => LEAGUE_TINT[id] || '#38A2FF';

export const leagueById = (id) => LEAGUES.find((l) => l.id === id) || null;

// Iniziali di fallback quando manca il logo (stesse regole del tassello logo).
export const initialsOf = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function buildLeagues() {
  const L = (RAW.data && RAW.data.leagues) || {};
  LEAGUES.forEach((l) => {
    const d = L[l.id];
    if (!d) return;
    l.logo = d.logo || null;
    l.season = d.season || '';
  });
  // Europa League: coppa disegnata, bianca di notte e nera di giorno
  const el = LEAGUES.find((l) => l.id === 'europa-league');
  if (el) {
    el.logo = `${import.meta.env.BASE_URL}el-light.png`;
    el.logoDark = `${import.meta.env.BASE_URL}el-night.png`;
  }
  CALC_LEAGUES.length = 0;
  Object.keys(L)
    .sort((a, b) => (L[a].label || a).localeCompare(L[b].label || b))
    .forEach((id) => {
      const known = LEAGUES.find((l) => l.id === id);
      CALC_LEAGUES.push({ id, name: known ? known.name : L[id].label || id, country: L[id].country || '', cup: id === 'champions-league' || id === 'europa-league' });
    });
}
