// Coppe nazionali (regola fissa 17/11/2026): nel Calcolatore ogni giocatore ha anche la coppa nazionale della sua squadra
// (Coppa Italia, Copa del Rey, DFB Pokal, FA Cup...) se la squadra la gioca in questa stagione. Elenco dall'indice dell'archivio
// FotMob (arch/index.json, solo coppe di club di un paese). Le statistiche di squadra e del giocatore sono quelle del campionato:
// nelle coppe nazionali le squadre giocano poche partite e non c'e' una media affidabile.
import { FM_ID } from './archive';

const PAESE = {
  ARG: 'Argentina', AUT: 'Austria', BEL: 'Belgio', BRA: 'Brasile', COL: 'Colombia', CRO: 'Croazia', CZE: 'Rep. Ceca', ENG: 'Inghilterra', ESP: 'Spagna',
  FRA: 'Francia', GER: 'Germania', GRE: 'Grecia', IRL: 'Irlanda', ITA: 'Italia', NED: 'Olanda', POL: 'Polonia', POR: 'Portogallo', ROU: 'Romania',
  SCO: 'Scozia', SRB: 'Serbia', SUI: 'Svizzera', SVK: 'Slovacchia', SVN: 'Slovenia', TUR: 'Turchia', USA: 'Stati Uniti',
};
// id FotMob -> [nome, paese]
const LIST = {
  9305: ['Copa Argentina', 'ARG'], 278: ['Austrian Cup', 'AUT'], 149: ['Belgian Cup', 'BEL'], 9067: ['Copa do Brasil', 'BRA'], 9490: ['Copa Colombia', 'COL'],
  275: ['Croatian Cup', 'CRO'], 254: ['Czech Cup', 'CZE'], 132: ['FA Cup', 'ENG'], 133: ['EFL Cup', 'ENG'], 138: ['Copa del Rey', 'ESP'], 134: ['Coupe de France', 'FRA'],
  209: ['DFB Pokal', 'GER'], 145: ['Greece Cup', 'GRE'], 219: ['FAI Cup', 'IRL'], 141: ['Coppa Italia', 'ITA'], 235: ['KNVB Cup', 'NED'], 198: ['Puchar Polski', 'POL'],
  187: ['Taça da Liga', 'POR'], 186: ['Taça de Portugal', 'POR'], 190: ['Cupa României', 'ROU'], 180: ['Scottish League Cup', 'SCO'], 137: ['Scottish Cup', 'SCO'],
  183: ['Kup Srbije', 'SRB'], 164: ['Swiss Cup', 'SUI'], 177: ['Slovak Cup', 'SVK'], 174: ['Slovenia Cup', 'SVN'], 151: ['Turkish Cup', 'TUR'], 9441: ['Open Cup', 'USA'],
};
const KEY_BY_FM = {};
Object.entries(FM_ID).forEach(([k, fm]) => { if (LIST[fm]) KEY_BY_FM[fm] = k; });

// chiave dell'app per la coppa (es. 'coppa-italia'; le altre 'fm-<id>')
export const domCupKey = (fm) => (LIST[fm] ? KEY_BY_FM[fm] || `fm-${fm}` : null);
export const domCupFm = (key) => {
  if (!key) return null;
  const fm = FM_ID[key] || Number((/^fm-(\d+)$/.exec(key) || [])[1]);
  return fm && LIST[fm] ? fm : null;
};
export const isDomCupKey = (key) => !!domCupFm(key);
export const domCupInfo = (key) => {
  const fm = domCupFm(key);
  return fm ? { fm, name: LIST[fm][0], country: PAESE[LIST[fm][1]] || LIST[fm][1] } : null;
};

// prima divisione -> coppa nazionale: le squadre del massimo campionato la giocano sempre, anche quando entrano nei turni successivi
// (Roma, Barcellona, Monaco... a novembre non l'hanno ancora giocata)
export const TOP_CUP = { 'serie-a': 141, 'la-liga': 138, bundesliga: 209, 'ligue-1': 134, 'premier-league': 133, eredivisie: 235, 'liga-portugal': 186, 'pro-league': 149, 'super-lig': 151, 'gre-super-league-1': 145, 'scottish-premiership': 137, 'aut-bundesliga': 278 };
