// Campionati. I colori dei banner sono scelti qui; i loghi arrivano da data.json.
// Per aggiungere un campionato alla Home basta una riga in LEAGUES.
import { RAW } from './load';


// Colori scelti dall'utente per i campionati/coppe aggiunti: [scuro, vivace] per i banner e colore delle pillole in Home.
export const PALETTE = {
  'coppa-italia': { colors: ['#0A2A6E', '#1E5AC8'], tint: '#2F6FE0' },
  'dfb-pokal': { colors: ['#0B3B1E', '#C9A227'], tint: '#2FA85A' },
  'coupe-de-france': { colors: ['#0A1F5E', '#3C6AE0'], tint: '#3C6AE0' },
  'taca-de-portugal': { colors: ['#7A1420', '#1E9C5A'], tint: '#E5484D' },
  'serie-b': { colors: ['#04302A', '#1E9C7C'], tint: '#1FA36F' },
  championship: { colors: ['#6E0E1A', '#E0443A'], tint: '#E5484D' },
  'bundesliga-2': { colors: ['#1A1A20', '#C8202E'], tint: '#E5484D' },
  'laliga-2': { colors: ['#1A1A20', '#F0614F'], tint: '#F0614F' },
  'ligue-2': { colors: ['#10181C', '#18B8B0'], tint: '#18B8B0' },
  eredivisie: { colors: ['#0A1F5E', '#D2282E'], tint: '#3C6AE0' },
  'pro-league': { colors: ['#14110A', '#C9A227'], tint: '#E5B23A' },
  'scottish-premiership': { colors: ['#0A2A6E', '#3C7AE0'], tint: '#3C7AE0' },
  'nor-eliteserien': { colors: ['#0A2A6E', '#3C7AE0'], tint: '#3C7AE0' },
  'gre-super-league-1': { colors: ['#0A3A8E', '#4C9AE8'], tint: '#4C9AE8' },
  'super-lig': { colors: ['#1A1014', '#C8202E'], tint: '#E5484D' },
  'aut-bundesliga': { colors: ['#1A1014', '#C8202E'], tint: '#E5484D' },
  brasileirao: { colors: ['#0E3A1E', '#E0B400'], tint: '#3DB85A' },
  'copa-do-brasil': { colors: ['#0E3A1E', '#E0B400'], tint: '#3DB85A' },
  'arg-liga-profesional': { colors: ['#0C2A6E', '#5AB0F0'], tint: '#5AB0F0' },
  mls: { colors: ['#0A1F5E', '#C8202E'], tint: '#3C6AE0' },
  'liga-mx': { colors: ['#0A3A1E', '#C8202E'], tint: '#2FBF71' },
  'belgian-cup': { colors: ['#14110A', '#C9A227'], tint: '#E5B23A' },
  'austrian-cup': { colors: ['#1A1014', '#C8202E'], tint: '#E5484D' },
  'scottish-league-cup': { colors: ['#0A2A6E', '#3C7AE0'], tint: '#3C7AE0' },
};
// coppe nazionali: le squadre che le giocano appartengono al loro campionato, non alla coppa
export const CUP_IDS = new Set(['coppa-italia', 'dfb-pokal', 'coupe-de-france', 'taca-de-portugal', 'efl-cup', 'belgian-cup', 'austrian-cup', 'scottish-league-cup', 'copa-do-brasil']);

export const LEAGUES = [
  { id: 'serie-a', name: 'Serie A', country: 'Italia', countryUpper: 'ITALIA', colors: ['#0B2A5B', '#1E8E9C'] },
  { id: 'premier-league', name: 'Premier League', country: 'Inghilterra', countryUpper: 'INGHILTERRA', colors: ['#2C1157', '#0E7A72'] },
  { id: 'la-liga', name: 'LaLiga', country: 'Spagna', countryUpper: 'SPAGNA', colors: ['#14213D', '#C8473C'] },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germania', countryUpper: 'GERMANIA', colors: ['#7A1420', '#2B2B33'] },
  { id: 'ligue-1', name: 'Ligue 1', country: 'Francia', countryUpper: 'FRANCIA', colors: ['#0A1A3C', '#3C6E9E'] },
  { id: 'champions-league', name: 'Champions League', country: 'Europa', countryUpper: 'EUROPA', colors: ['#0A1C5E', '#7FB6E8'] },
  { id: 'europa-league', name: 'Europa League', country: 'Europa', countryUpper: 'EUROPA', colors: ['#7A3A06', '#E08A2B'] },
  // campionati extra: solo partite in Home + pagina campionato dall'archivio (niente Migliori giocatori/matchup)
  { id: 'eredivisie', fm: 57, extra: true, name: 'Eredivisie', country: 'Paesi Bassi', countryUpper: 'PAESI BASSI', colors: ['#7A2A06', '#E8863A'] },
  { id: 'super-lig', fm: 71, extra: true, name: 'Süper Lig', country: 'Turchia', countryUpper: 'TURCHIA', colors: ['#6E0E1A', '#C8352E'] },
  { id: 'liga-portugal', fm: 61, extra: true, name: 'Liga Portugal', country: 'Portogallo', countryUpper: 'PORTOGALLO', colors: ['#0B3B2A', '#2E9E6B'] },
  { id: 'pro-league', fm: 40, extra: true, name: 'Pro League', country: 'Belgio', countryUpper: 'BELGIO', colors: ['#3A2A06', '#C9A227'] },
  { id: 'scottish-premiership', fm: 64, extra: true, name: 'Premiership', country: 'Scozia', countryUpper: 'SCOZIA', colors: ['#0A2A5E', '#3C7AC8'] },
  { id: 'aut-bundesliga', fm: 38, extra: true, name: 'Bundesliga Austria', country: 'Austria', countryUpper: 'AUSTRIA', colors: ['#5E0E14', '#D2483E'] },
  { id: 'nor-eliteserien', fm: 59, extra: true, name: 'Eliteserien', country: 'Norvegia', countryUpper: 'NORVEGIA', colors: ['#0A2A4E', '#C8372E'] },
  { id: 'gre-super-league-1', fm: 135, extra: true, name: 'Super League', country: 'Grecia', countryUpper: 'GRECIA', colors: ['#0A3A6E', '#4C9AE0'] },
  { id: 'championship', fm: 48, extra: true, name: 'Championship', country: 'Inghilterra', countryUpper: 'INGHILTERRA', colors: ['#3A3210', '#B39C51'] },
  { id: 'serie-b', fm: 86, extra: true, name: 'Serie B', country: 'Italia', countryUpper: 'ITALIA', colors: ['#04302A', '#1E9C7C'] },
  { id: 'bundesliga-2', fm: 146, extra: true, name: '2. Bundesliga', country: 'Germania', countryUpper: 'GERMANIA', colors: ['#2B2B33', '#8A1420'] },
  { id: 'laliga-2', fm: 140, extra: true, name: 'LaLiga2', country: 'Spagna', countryUpper: 'SPAGNA', colors: ['#2A2433', '#C8473C'] },
  { id: 'ligue-2', fm: 110, extra: true, name: 'Ligue 2', country: 'Francia', countryUpper: 'FRANCIA', colors: ['#14213D', '#3C6E9E'] },
  { id: 'liga-portugal-2', fm: 185, extra: true, name: 'Liga Portugal 2', country: 'Portogallo', countryUpper: 'PORTOGALLO', colors: ['#001F51', '#2E9E6B'] },
  { id: 'eerste-divisie', fm: 111, extra: true, name: 'Eerste Divisie', country: 'Paesi Bassi', countryUpper: 'PAESI BASSI', colors: ['#115030', '#E8863A'] },
  { id: 'turchia-1-lig', fm: 165, extra: true, name: '1. Lig', country: 'Turchia', countryUpper: 'TURCHIA', colors: ['#5A1F26', '#C8352E'] },
  { id: 'brasileirao', fm: 268, extra: true, name: 'Brasileirão Série A', country: 'Brasile', countryUpper: 'BRASILE', colors: ['#0E3A1E', '#E0B400'] },
  { id: 'arg-liga-profesional', fm: 112, extra: true, name: 'Liga Profesional', country: 'Argentina', countryUpper: 'ARGENTINA', colors: ['#0C1B55', '#5AA9E6'] },
  { id: 'mls', fm: 130, extra: true, name: 'MLS', country: 'Stati Uniti', countryUpper: 'STATI UNITI', colors: ['#7A1420', '#0A2A5E'] },
  { id: 'liga-mx', fm: 230, extra: true, name: 'Liga MX', country: 'Messico', countryUpper: 'MESSICO', colors: ['#072146', '#2E8B57'] },
  { id: 'coppa-italia', fm: 141, extra: true, name: 'Coppa Italia', country: 'Italia', countryUpper: 'ITALIA', colors: ['#1E5A26', '#2EA736'] },
  { id: 'dfb-pokal', fm: 209, extra: true, name: 'DFB Pokal', country: 'Germania', countryUpper: 'GERMANIA', colors: ['#004941', '#C8472E'] },
  { id: 'coupe-de-france', fm: 134, extra: true, name: 'Coupe de France', country: 'Francia', countryUpper: 'FRANCIA', colors: ['#2B2B33', '#3C6E9E'] },
  { id: 'taca-de-portugal', fm: 186, extra: true, name: 'Taça de Portugal', country: 'Portogallo', countryUpper: 'PORTOGALLO', colors: ['#004000', '#2E9E6B'] },
  { id: 'efl-cup', fm: 133, extra: true, name: 'EFL Cup', country: 'Inghilterra', countryUpper: 'INGHILTERRA', colors: ['#006B45', '#2C1157'] },
  { id: 'belgian-cup', fm: 149, extra: true, name: 'Belgian Cup', country: 'Belgio', countryUpper: 'BELGIO', colors: ['#8A2208', '#F93C05'] },
  { id: 'austrian-cup', fm: 278, extra: true, name: 'Austrian Cup', country: 'Austria', countryUpper: 'AUSTRIA', colors: ['#212121', '#D2483E'] },
  { id: 'scottish-league-cup', fm: 180, extra: true, name: 'League Cup', country: 'Scozia', countryUpper: 'SCOZIA', colors: ['#00237A', '#3C7AC8'] },
  { id: 'copa-do-brasil', fm: 9067, extra: true, name: 'Copa do Brasil', country: 'Brasile', countryUpper: 'BRASILE', colors: ['#1C5A29', '#34A348'] },
].map((l) => ({ season: '', logo: null, logoDark: null, banner: null, ...l, ...(PALETTE[l.id] || {}) }));

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
  eredivisie: '#F28B3A',
  'super-lig': '#E5484D',
  'liga-portugal': '#2FBF71',
  'pro-league': '#E5B23A',
  'scottish-premiership': '#4C8EE0',
  'aut-bundesliga': '#E5484D',
  'nor-eliteserien': '#4C8EE0',
  'gre-super-league-1': '#4FA3F0',
};
export const leagueTint = (id) => (PALETTE[id] && PALETTE[id].tint) || LEAGUE_TINT[id] || ((leagueById(id) || {}).tint) || '#38A2FF';

// ricerca su mappa (si ricostruisce solo quando si aggiungono competizioni): chiamata migliaia di volte negli abbinamenti squadra
let BY_ID = null;
let BY_N = -1;
export const leagueById = (id) => {
  if (BY_N !== LEAGUES.length) { BY_ID = new Map(); LEAGUES.forEach((l) => { if (!BY_ID.has(l.id)) BY_ID.set(l.id, l); }); BY_N = LEAGUES.length; }
  return BY_ID.get(id) || null;
};

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
    // campionati e coppe aggiunti: logo ufficiale FotMob (chiaro e scuro) se non c'e' nel calcolatore
    if (l.extra && l.fm && !(d && d.logo)) {
      l.logo = `https://images.fotmob.com/image_resources/logo/leaguelogo/${l.fm}.png`;
      l.logoDark = `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${l.fm}.png`;
    }
    if (!d) return;
    if (!(l.extra && l.logo)) l.logo = d.logo || null;
    l.season = l.extra ? '' : d.season || '';
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
