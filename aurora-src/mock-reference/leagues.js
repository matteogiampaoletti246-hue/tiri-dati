// Campionati — dati MOCK (la UI è separata dai dati, il collegamento reale arriva dopo)
export const LEAGUES = [
  { id: 'serie-a', name: 'Serie A', country: 'Italia', countryUpper: 'ITALIA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#0B2A5B', '#1E8E9C'] },
  { id: 'premier-league', name: 'Premier League', country: 'Inghilterra', countryUpper: 'INGHILTERRA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#2C1157', '#0E7A72'] },
  { id: 'laliga', name: 'LaLiga', country: 'Spagna', countryUpper: 'SPAGNA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#14213D', '#C8473C'] },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germania', countryUpper: 'GERMANIA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#7A1420', '#2B2B33'] },
  { id: 'ligue-1', name: 'Ligue 1', country: 'Francia', countryUpper: 'FRANCIA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#0A1A3C', '#3C6E9E'] },
  { id: 'champions-league', name: 'Champions League', country: 'Europa', countryUpper: 'EUROPA', season: '2025/26', logo: null, logoDark: null, banner: null, colors: ['#0A1C5E', '#7FB6E8'] },
];

export const leagueById = (id) => LEAGUES.find((l) => l.id === id) || null;

// Iniziali di fallback quando manca il logo (stesse regole del tassello logo).
export const initialsOf = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
