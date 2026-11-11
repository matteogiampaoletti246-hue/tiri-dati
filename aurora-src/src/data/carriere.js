import { BASE } from './load';
import { lruGet, lruSet } from '@/lib/lru';

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
// capienza fissa: con tutti i giocatori dell'indice ogni file e' grande, in memoria restano gli ultimi 8
const SH = new Map();
const shard = (n) => {
  const hit = lruGet(SH, n);
  if (hit) return hit;
  const p = fetch(`${BASE}car/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  lruSet(SH, n, p, 8);
  return p;
};
export const careerByFm = async (fid) => {
  if (!fid) return null;
  const d = await shard(Number(fid) % 100);
  return d[String(fid)] || null;
};

const IT = {
  Cyprus: 'Cipro', Moldova: 'Moldavia', Latvia: 'Lettonia', 'San Marino': 'San Marino', Kazakhstan: 'Kazakistan', 'Faroe Islands': 'Isole Fær Øer', Belarus: 'Bielorussia', Liechtenstein: 'Liechtenstein', Malta: 'Malta', Azerbaijan: 'Azerbaigian', Andorra: 'Andorra', Gibraltar: 'Gibilterra',
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
const ISO2 = {"Cyprus": "CY", "Moldova": "MD", "Latvia": "LV", "San Marino": "SM", "Kazakhstan": "KZ", "Faroe Islands": "FO", "Belarus": "BY", "Liechtenstein": "LI", "Malta": "MT", "Azerbaijan": "AZ", "Andorra": "AD", "Gibraltar": "GI", "Albania": "AL", "Algeria": "DZ", "Angola": "AO", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", "Belgium": "BE", "Benin": "BJ", "Bosnia and Herzegovina": "BA", "Brazil": "BR", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV", "Central African Rep.": "CF", "Chile": "CL", "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Czechia": "CZ", "DR Congo": "CD", "Denmark": "DK", "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "Equatorial Guinea": "GQ", "Estonia": "EE", "Finland": "FI", "France": "FR", "Gabon": "GA", "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Guadeloupe": "GP", "Guinea": "GN", "Guinea-Bissau": "GW", "Haiti": "HT", "Hungary": "HU", "Iceland": "IS", "Indonesia": "ID", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Ivory Coast": "CI", "Jamaica": "JM", "Japan": "JP", "Jordan": "JO", "Kenya": "KE", "Kosovo": "XK", "Lithuania": "LT", "Luxembourg": "LU", "Mali": "ML", "Mauritania": "MR", "Mexico": "MX", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ", "Netherlands": "NL", "New Zealand": "NZ", "Niger": "NE", "Nigeria": "NG", "North Macedonia": "MK", "Norway": "NO", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Russia": "RU", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Sierra Leone": "SL", "Slovakia": "SK", "Slovenia": "SI", "South Korea": "KR", "Spain": "ES", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Tanzania": "TZ", "Thailand": "TH", "The Gambia": "GM", "Togo": "TG", "Tunisia": "TN", "Turkiye": "TR", "USA": "US", "Ukraine": "UA", "Uruguay": "UY", "Uzbekistan": "UZ", "Venezuela": "VE", "Zambia": "ZM"};
// altri nomi FotMob delle nazioni (bandiera per tutti i giocatori, non solo per i top campionati)
const EXTRA_ISO2 = {"Korea Republic": "KR", "Iran": "IR", "China": "CN", "South Africa": "ZA", "Türkiye": "TR", "Bolivia": "BO", "Panama": "PA", "Guatemala": "GT", "Republic of Ireland": "IE", "United Arab Emirates": "AE", "Qatar": "QA", "China PR": "CN", "Côte d'Ivoire": "CI", "Honduras": "HN", "Iraq": "IQ", "India": "IN", "Congo DR": "CD", "El Salvador": "SV", "Vietnam": "VN", "Syria": "SY", "Uganda": "UG", "Trinidad and Tobago": "TT", "Libya": "LY", "Malaysia": "MY", "Lebanon": "LB", "Sudan": "SD", "Zimbabwe": "ZW", "Liberia": "LR", "Palestine": "PS", "Kuwait": "KW", "Oman": "OM", "Gambia": "GM", "Turkmenistan": "TM", "UAE": "AE", "Madagascar": "MG", "Ethiopia": "ET", "Tajikistan": "TJ", "Rwanda": "RW", "Singapore": "SG", "Botswana": "BW", "Cambodia": "KH", "South Sudan": "SS", "Nicaragua": "NI", "Martinique": "MQ", "Myanmar": "MM", "Bahrain": "BH", "Lesotho": "LS", "Afghanistan": "AF", "Namibia": "NA", "Malawi": "MW", "Cuba": "CU", "St. Kitts and Nevis": "KN", "Grenada": "GD", "Somalia": "SO", "Eswatini": "SZ", "Kyrgyzstan": "KG", "Puerto Rico": "PR", "Bermuda": "BM", "Antigua and Barbuda": "AG", "Cabo Verde": "CV", "Guyana": "GY", "Aruba": "AW", "Central African Republic": "CF", "Belize": "BZ", "Curacao": "CW", "Bangladesh": "BD", "Chad": "TD", "Yemen": "YE", "Barbados": "BB", "Laos": "LA", "Pakistan": "PK", "Taiwan": "TW", "Dominica": "DM", "Curaçao": "CW", "Mongolia": "MN", "Hong Kong, China": "HK", "Montserrat": "MS", "Korea DPR": "KP", "Anguilla": "AI", "St. Vincent and the Grenadines": "VC", "Cayman Islands": "KY", "Bahamas": "BS", "British Virgin Islands": "VG", "Kyrgyz Republic": "KG", "Eritrea": "ER", "Djibouti": "DJ", "Nepal": "NP", "Turks and Caicos Islands": "TC", "Sao Tome and Principe": "ST", "French Guiana": "GF", "Maldives": "MV", "Mauritius": "MU", "Hong Kong": "HK", "St. Lucia": "LC", "Guam": "GU", "US Virgin Islands": "VI", "Seychelles": "SC", "Chinese Taipei": "TW", "Sri Lanka": "LK", "Fiji": "FJ", "São Tomé e Príncipe": "ST", "New Caledonia": "NC", "Brunei Darussalam": "BN", "Bhutan": "BT", "Saint Vincent and The Grenadines": "VC", "East Timor": "TL", "Bonaire": "BQ", "North Korea": "KP", "Macao": "MO", "French Polynesia": "PF", "Saint Martin": "MF", "Timor-Leste": "TL", "Sint Maarten": "SX", "Saint Lucia": "LC", "Vanuatu": "VU", "Brunei": "BN", "Papua New Guinea": "PG", "Solomon Islands": "SB", "Tahiti": "PF", "Tonga": "TO", "U.S. Virgin Islands": "VI", "Samoa": "WS", "Jersey": "JE", "Reunion": "RE", "Greenland": "GL", "Isle of Man": "IM", "Réunion": "RE", "Zanzibar": "TZ", "Cook Islands": "CK", "Guernsey": "GG", "American Samoa": "AS"};
const SPECIAL = {"England": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}","Scotland": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}","Wales": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}","Northern Ireland": "\u{1F1EC}\u{1F1E7}"};
export const flagOf = (c) => {
  if (!c) return '';
  if (SPECIAL[c]) return SPECIAL[c];
  const k = ISO2[c] || EXTRA_ISO2[c];
  return k ? String.fromCodePoint(...[...k].map((ch) => 127397 + ch.charCodeAt(0))) : '';
};
// codice bandiera (flag-icons, minuscolo) dal nome inglese della nazione; Inghilterra, Scozia, Galles e Irlanda del Nord hanno la propria
const SPECIAL_CODE = { England: 'gb-eng', Scotland: 'gb-sct', Wales: 'gb-wls', 'Northern Ireland': 'gb-nir' };
export const flagCode = (c) => (c ? SPECIAL_CODE[c] || ((ISO2[c] || EXTRA_ISO2[c]) ? (ISO2[c] || EXTRA_ISO2[c]).toLowerCase() : '') : '');
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
