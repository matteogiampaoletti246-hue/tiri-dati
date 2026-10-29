// Paese di una competizione (codice a 3 lettere dell'indice dell'archivio, o dal nome italiano per quelle dell'app) e bandiera.
// Il paese si ricava sempre dai dati della competizione: una competizione aggiunta in futuro finisce da sola nella sua finestra.
const ISO2 = {
  ALB: 'AL', ALG: 'DZ', ARG: 'AR', ARM: 'AM', AUS: 'AU', AUT: 'AT', AZE: 'AZ', BEL: 'BE', BIH: 'BA', BLR: 'BY', BOL: 'BO', BRA: 'BR', BUL: 'BG', CAN: 'CA',
  CHI: 'CL', CHN: 'CN', COL: 'CO', CRC: 'CR', CRO: 'HR', CYP: 'CY', CZE: 'CZ', DEN: 'DK', ECU: 'EC', EGY: 'EG', ESP: 'ES', EST: 'EE', FIN: 'FI', FRA: 'FR',
  FRO: 'FO', GEO: 'GE', GER: 'DE', GHA: 'GH', GRE: 'GR', GUA: 'GT', HON: 'HN', HUN: 'HU', IRL: 'IE', IRN: 'IR', ISL: 'IS', ISR: 'IL', ITA: 'IT', JPN: 'JP',
  KAZ: 'KZ', KOR: 'KR', KSA: 'SA', LTU: 'LT', LUX: 'LU', LVA: 'LV', MAR: 'MA', MDA: 'MD', MEX: 'MX', MKD: 'MK', MNE: 'ME', NED: 'NL', NGA: 'NG', NIR: 'GB',
  NOR: 'NO', PAN: 'PA', PAR: 'PY', PER: 'PE', POL: 'PL', POR: 'PT', QAT: 'QA', ROU: 'RO', RSA: 'ZA', RUS: 'RU', SLV: 'SV', SRB: 'RS', SUI: 'CH', SVK: 'SK',
  SVN: 'SI', SWE: 'SE', TUN: 'TN', TUR: 'TR', UAE: 'AE', UKR: 'UA', URU: 'UY', USA: 'US', VEN: 'VE', URY: 'UY',
};
const TAG = { ENG: 'gbeng', SCO: 'gbsct', WAL: 'gbwls' };
// competizioni dell'app senza codice: dal nome del paese
const BY_NAME = {
  Italia: 'ITA', Inghilterra: 'ENG', Spagna: 'ESP', Germania: 'GER', Francia: 'FRA', 'Paesi Bassi': 'NED', Turchia: 'TUR', Portogallo: 'POR', Belgio: 'BEL',
  Scozia: 'SCO', Austria: 'AUT', Norvegia: 'NOR', Grecia: 'GRE', Brasile: 'BRA', Argentina: 'ARG', 'Stati Uniti': 'USA', Messico: 'MEX',
};
const INTL = new Set(['', 'Europa', 'Internazionale', 'Mondo']);

// codice del paese, null per le competizioni internazionali (o senza paese)
export const countryCode = (L) => {
  if (!L) return null;
  if (L.cc) return L.cc === 'INT' ? null : L.cc;
  if (INTL.has(L.country || '')) return null;
  return BY_NAME[L.country] || `N:${L.country}`;
};

export const flagEmoji = (cc) => {
  if (!cc) return '';
  if (TAG[cc]) return String.fromCodePoint(0x1F3F4, ...[...TAG[cc]].map((c) => 0xE0000 + c.charCodeAt(0)), 0xE007F);
  const k = ISO2[cc];
  return k ? String.fromCodePoint(...[...k].map((ch) => 127397 + ch.charCodeAt(0))) : '';
};

// importanza dentro un paese: campionati maschili (prima la serie maggiore, ordine dell'indice), poi femminili/giovanili, poi coppe e supercoppe
const CUP = /\b(cup|coppa|copa|coupe|pokal|ta[cç]a|beker|kupa|cupa|puchar|pohar|kup|kupen|cupen|supercopa|supercoppa|supercup|super cup|shield|trophy|troph[ée]e|recopa|campe[oó]n de campeones|community|league cup|open cup|emperor)\b/i;
const WOMEN_YOUTH = /(women|femen|f[ée]minin|frauen|femminile|\bwe league|liga f\b|damallsvenskan|toppserien|wsl|\bu-?\d{2}\b|primavera|youth|juvenil|reserve|next pro|\bii\b)/i;
export const importance = (L) => (CUP.test(L.name || '') ? 2 : WOMEN_YOUTH.test(L.name || '') ? 1 : 0);
