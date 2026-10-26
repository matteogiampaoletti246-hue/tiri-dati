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
export const carriereOf = (id) => (DATA ? DATA[id] || null : null);

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
