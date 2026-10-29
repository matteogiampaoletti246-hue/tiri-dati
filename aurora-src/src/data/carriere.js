import { BASE } from './load';

let DATA = null;
let PROM = null;

export const carriereLoaded = () => DATA;
export function loadCarriere() {
  if (PROM) return PROM;
  PROM = fetch(`${BASE}carriere.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((d) => {
      DATA = d || {};
      return DATA;
    });
  return PROM;
}
export const setCarriere = (id, v) => { if (!DATA) DATA = {}; if (!DATA[id]) DATA[id] = v; };
export const carriereOf = (id) => (DATA ? DATA[id] || null : null);

// Carriere di tutti i giocatori delle rose (car/<id FotMob % 100>.json, carriere_extra.py): squadre senior, giovanili e nazionali
const SH = {};
const shard = (n) => { if (!SH[n]) SH[n] = fetch(`${BASE}car/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return SH[n]; };
export const careerByFm = async (fid) => {
  if (!fid) return null;
  const d = await shard(Number(fid) % 100);
  return d[String(fid)] || null;
};

const IT = {
  Albania: 'Albania', Algeria: 'Algeria', Angola: 'Angola', Argentina: 'Argentina', Armenia: 'Armenia', Australia: 'Australia', Austria: 'Austria', Belgium: 'Belgio', Benin: 'Benin',
  'Bosnia and Herzegovina': 'Bosnia ed Erzegovina', Brazil: 'Brasile', Bulgaria: 'Bulgaria', 'Burkina Faso': 'Burkina Faso', Burundi: 'Burundi', Cameroon: 'Camerun', Canada: 'Canada',
  'Cape Verde': 'Capo Verde', 'Central African Rep.': 'Rep. Centrafricana', Chile: 'Cile', Colombia: 'Colombia', Comoros: 'Comore', Congo: 'Congo', 'Costa Rica': 'Costa Rica', Croatia: 'Croazia',
  Czechia: 'Rep. Ceca', 'DR Congo': 'RD Congo', Denmark: 'Danimarca', 'Dominican Republic': 'Rep. Dominicana', Ecuador: 'Ecuador', Egypt: 'Egitto', England: 'Inghilterra',
  'Equatorial Guinea': 'Guinea Equatoriale', Estonia: 'Estonia', Finland: 'Finlandia', France: 'Francia', Gabon: 'Gabon', Georgia: 'Georgia', Germany: 'Germania', Ghana: 'Ghana', Greece: 'Grecia',
  Guadeloupe: 'Guadalupa', Guinea: 'Guinea', 'Guinea-Bissau': 'Guinea-Bissau', Haiti: 'Haiti', Hungary: 'Ungheria', Iceland: 'Islanda', Indonesia: 'Indonesia', Ireland: 'Irlanda', Israel: 'Israele',
  Italy: 'Italia', 'Ivory Coast': "Costa d'Avorio", Jamaica: 'Giamaica', Japan: 'Giappone', Jordan: 'Giordania', Kenya: 'Kenya', Kosovo: 'Kosovo', Lithuania: 'Lituania', Luxembourg: 'Lussemburgo',
  Mali: 'Mali', Mauritania: 'Mauritania', Mexico: 'Messico', Montenegro: 'Montenegro', Morocco: 'Marocco', Mozambique: 'Mozambico', Netherlands: 'Paesi Bassi', 'New Zealand': 'Nuova Zelanda',
  Niger: 'Niger', Nigeria: 'Nigeria', 'North Macedonia': 'Macedonia del Nord', 'Northern Ireland': 'Irlanda del Nord', Norway: 'Norvegia', Paraguay: 'Paraguay', Peru: 'Perù', Philippines: 'Filippine',
  Poland: 'Polonia', Portugal: 'Portogallo', Romania: 'Romania', Russia: 'Russia', 'Saudi Arabia': 'Arabia Saudita', Scotland: 'Scozia', Senegal: 'Senegal', Serbia: 'Serbia', 'Sierra Leone': 'Sierra Leone',
  Slovakia: 'Slovacchia', Slovenia: 'Slovenia', 'South Korea': 'Corea del Sud', Spain: 'Spagna', Suriname: 'Suriname', Sweden: 'Svezia', Switzerland: 'Svizzera', Tanzania: 'Tanzania',
  Thailand: 'Thailandia', 'The Gambia': 'Gambia', Togo: 'Togo', Tunisia: 'Tunisia', Turkiye: 'Turchia', USA: 'Stati Uniti', Ukraine: 'Ucraina', Uruguay: 'Uruguay', Uzbekistan: 'Uzbekistan',
  Venezuela: 'Venezuela', Wales: 'Galles', Zambia: 'Zambia',
};
export const countryIt = (c) => IT[c] || c || '—';

// Bandierina (emoji) dal nome inglese della nazione
const ISO2 = {"Albania": "AL", "Algeria": "DZ", "Angola": "AO", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", "Belgium": "BE", "Benin": "BJ", "Bosnia and Herzegovina": "BA", "Brazil": "BR", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV", "Central African Rep.": "CF", "Chile": "CL", "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Czechia": "CZ", "DR Congo": "CD", "Denmark": "DK", "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "Equatorial Guinea": "GQ", "Estonia": "EE", "Finland": "FI", "France": "FR", "Gabon": "GA", "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Guadeloupe": "GP", "Guinea": "GN", "Guinea-Bissau": "GW", "Haiti": "HT", "Hungary": "HU", "Iceland": "IS", "Indonesia": "ID", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Ivory Coast": "CI", "Jamaica": "JM", "Japan": "JP", "Jordan": "JO", "Kenya": "KE", "Kosovo": "XK", "Lithuania": "LT", "Luxembourg": "LU", "Mali": "ML", "Mauritania": "MR", "Mexico": "MX", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ", "Netherlands": "NL", "New Zealand": "NZ", "Niger": "NE", "Nigeria": "NG", "North Macedonia": "MK", "Norway": "NO", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Russia": "RU", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Sierra Leone": "SL", "Slovakia": "SK", "Slovenia": "SI", "South Korea": "KR", "Spain": "ES", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Tanzania": "TZ", "Thailand": "TH", "The Gambia": "GM", "Togo": "TG", "Tunisia": "TN", "Turkiye": "TR", "USA": "US", "Ukraine": "UA", "Uruguay": "UY", "Uzbekistan": "UZ", "Venezuela": "VE", "Zambia": "ZM"};
const SPECIAL = {"England": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}","Scotland": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}","Wales": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}","Northern Ireland": "\u{1F1EC}\u{1F1E7}"};
export const flagOf = (c) => {
  if (!c) return '';
  if (SPECIAL[c]) return SPECIAL[c];
  const k = ISO2[c];
  return k ? String.fromCodePoint(...[...k].map((ch) => 127397 + ch.charCodeAt(0))) : '';
};
export const FOOT = { right: 'Destro', left: 'Sinistro', both: 'Ambidestro' };
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
export const monthIt = (ym) => (ym && ym.length >= 7 ? `${MESI[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : '');
export const dateLong = (iso) => (iso && iso.length >= 10 ? `${Number(iso.slice(8, 10))} ${MESI[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : '—');
export const ageOf = (iso) => {
  if (!iso) return null;
  const b = new Date(iso);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a -= 1;
  return a;
};
export const money = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',')} M €` : v >= 1e3 ? `${Math.round(v / 1e3)} K €` : '—');
