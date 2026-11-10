// Competizione del Calcolatore come oggetto da mostrare (nome, colori, logo): campionati dell'app (leagues.js) e competizioni solo del
// Calcolatore (Superliga Danimarca, Nations League A-D) con logo FotMob. Usato da tendina Competizione, Medie stagione, banner squadra
// e scelta del campionato: stessi colori e loghi ovunque.
import { PALETTE, leagueById } from '@/data/leagues';
import { CUPS, NATIONS_KEYS, calcLeagues, calcTeamsOf, domesticKeyOf, leagueName } from '@/data/calcData';
import { teamById, teamByName } from '@/data/teams';

const FM_LOGO = (fm) => `https://images.fotmob.com/image_resources/logo/leaguelogo/${fm}.png`;
const FM_LOGO_DARK = (fm) => `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${fm}.png`;
const CUP_FM = { 'champions-league': 42, 'europa-league': 73, 'conference-league': 10216 }; // logo FotMob se data.json non ha ancora portato quello della coppa
const MEMO = new Map();

export function calcComp(key) {
  if (!key) return null;
  if (MEMO.has(key)) return MEMO.get(key);
  const l = leagueById(key);
  const fm = /^fm-(\d+)$/.exec(key);
  const pal = PALETTE[key];
  const colors = (pal && pal.colors) || (l && l.colors) || ['var(--banner-neutral)', 'var(--accent)'];
  const out = {
    id: key,
    name: leagueName(key) || (l && l.name) || key,
    colors,
    logo: (l && l.logo) || (fm ? FM_LOGO(fm[1]) : CUP_FM[key] ? FM_LOGO(CUP_FM[key]) : null),
    logoDark: (l && l.logoDark) || (fm ? FM_LOGO_DARK(fm[1]) : CUP_FM[key] ? FM_LOGO_DARK(CUP_FM[key]) : null),
    country: NATIONS_KEYS.includes(key) ? 'Nazionali' : CUPS.includes(key) ? 'Europa' : (l && l.country) || '',
    kind: NATIONS_KEYS.includes(key) ? 'Nazionale' : CUPS.includes(key) ? 'Coppa europea' : 'Campionato',
  };
  // il logo dei campionati dell'app arriva da data.json dopo l'avvio: si memorizza solo quando c'e'
  if (out.logo || fm) MEMO.set(key, out);
  return out;
}

// sfondo scuro del banner: colore scuro della competizione con un velo del colore vivo
export const compBg = (c) => (c ? `linear-gradient(120deg, ${c.colors[0]} 0%, color-mix(in srgb, ${c.colors[1] || c.colors[0]} 38%, ${c.colors[0]}) 100%)` : 'var(--banner-neutral)');
export const compAccent = (c) => (c ? c.colors[1] || c.colors[0] : 'var(--accent)');

// competizioni del giocatore per la tendina Competizione e le Medie stagione: campionato della squadra di club (se e' nel Calcolatore),
// coppa europea se la squadra la gioca, Nations League della nazionale. player puo' essere il profilo di club o quello della nazionale.
export function playerComps(player) {
  if (!player) return [];
  const club = player.nat ? player.club || null : player;
  const nat = player.nat ? player : player.natView || null;
  const out = [];
  const dom = club ? domesticKeyOf(club.teamName) : null;
  if (dom) out.push({ value: 'campionato', key: dom, comp: calcComp(dom), sub: `Campionato${calcComp(dom).country ? ` · ${calcComp(dom).country}` : ''}` });
  const team = club ? teamById(club.teamId) : null;
  const cup = team ? CUPS.find((c) => calcTeamsOf(c).some((n) => n === team.name || (teamByName(n) || {}).id === team.id)) : null;
  if (cup) out.push({ value: 'coppa', key: cup, comp: calcComp(cup), sub: 'Coppa europea' });
  if (nat && NATIONS_KEYS.includes(nat.leagueId)) out.push({ value: 'nations', key: nat.leagueId, comp: calcComp(nat.leagueId), sub: `Nazionale · ${nat.teamName}` });
  return out;
}

// scelta del campionato (concept A, 8/11/2026): ogni competizione e' un banner a tutta larghezza nei suoi colori, logo e paese
export const calcLeagueOptions = () => calcLeagues().map((l) => {
  const comp = calcComp(l.id);
  return { value: l.id, label: comp.name, sub: (comp.country || comp.kind).toUpperCase(), comp };
});
