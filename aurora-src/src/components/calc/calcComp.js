// Competizione del Calcolatore come oggetto da mostrare (nome, colori, logo): campionati dell'app (leagues.js) e competizioni solo del
// Calcolatore (Superliga Danimarca, Nations League A-D) con logo FotMob. Usato da tendina Competizione, Medie stagione, banner squadra
// e scelta del campionato: stessi colori e loghi ovunque.
import { PALETTE, leagueById } from '@/data/leagues';
import { CUPS, NATIONS_KEYS, calcLeagues, calcTeamsOf, domesticKeyOf, leagueName } from '@/data/calcData';
import { LOGO_COLORS } from '@/data/compColors';
import { teamById, teamByName } from '@/data/teams';
import { logoFm } from '@/data/util';
import { natByFm } from '@/data/players';
import { allTeamMatches } from '@/data/extras';
import { RAW } from '@/data/load';
import { domCupKey, domCupFm, domCupInfo, TOP_CUP } from '@/data/domCups';
import { lruGet, lruSet } from '@/lib/lru';

const FM_LOGO = (fm) => `https://images.fotmob.com/image_resources/logo/leaguelogo/${logoFm(fm)}.png`;
const FM_LOGO_DARK = (fm) => `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${logoFm(fm)}.png`;
const CUP_FM = { 'champions-league': 42, 'europa-league': 73, 'conference-league': 10216 }; // logo FotMob se data.json non ha ancora portato quello della coppa
const MEMO = new Map();
const abs = (u) => (typeof u === 'string' && /^https?:/.test(u) ? u : null); // logo locale (es. Europa League in nativo senza base URL): si usa quello FotMob

export function calcComp(key) {
  if (!key) return null;
  if (MEMO.has(key)) return MEMO.get(key);
  const l = leagueById(key);
  const fm = /^fm-(\d+)$/.exec(key);
  const pal = PALETTE[key];
  const colors = (pal && pal.colors) || (l && l.colors) || LOGO_COLORS[key] || ['var(--banner-neutral)', 'var(--accent)'];
  const out = {
    id: key,
    name: leagueName(key) || (l && l.name) || key,
    colors,
    logo: abs(l && l.logo) || (fm ? FM_LOGO(fm[1]) : CUP_FM[key] ? FM_LOGO(CUP_FM[key]) : null),
    logoDark: abs(l && l.logoDark) || (fm ? FM_LOGO_DARK(fm[1]) : CUP_FM[key] ? FM_LOGO_DARK(CUP_FM[key]) : null),
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

// profilo della nazionale di un giocatore di club: anche per le schede ricostruite dall'archivio (aperte da una partita o dalla rosa),
// che non avevano il collegamento e nel Calcolatore restavano col solo campionato (17/11/2026)
export function natOf(player) {
  if (!player) return null;
  if (player.nat) return player;
  if (player.natView) return player.natView;
  const v = player.fmId ? natByFm(player.fmId) : null;
  if (v) { player.natView = v; if (!v.club) v.club = player; }
  return v || null;
}

const seasonStart = () => { const d = new Date(); const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; return { n: y * 10000 + 701, ts: Date.UTC(y, 6, 1) }; };
// coppa nazionale della squadra in questa stagione: prossima partita di coppa (calendari), poi l'ultima giocata (partite dell'app),
// poi le ultime partite del giocatore (`h`: giorno e id FotMob della competizione)
const DC = new Map(); // giocatore -> coppa nazionale (al massimo 300, rifatto ogni 10 minuti)
export function domCupOf(club) {
  if (!club) return null;
  const hit = lruGet(DC, club.id);
  if (hit && Date.now() - hit.t < 600000) return hit.v;
  const v = domCupFind(club);
  lruSet(DC, club.id, { v, t: Date.now() }, 300);
  return v;
}
function domCupFind(club) {
  const st = seasonStart();
  const today = new Date().toISOString().slice(0, 10);
  const fix = ((RAW.giocatori && RAW.giocatori.fix) || {})[club.teamName] || [];
  const nf = fix.find((f) => f[0] >= today && domCupFm(f[3]));
  if (nf) return domCupKey(domCupFm(nf[3]));
  const team = teamById(club.teamId);
  if (team) {
    const cupFm = (m) => domCupFm(m.leagueId) || (leagueById(m.leagueId) && domCupFm(`fm-${leagueById(m.leagueId).fm}`)) || null;
    const ms = allTeamMatches(team.id).filter((m) => m.ts >= st.ts && cupFm(m));
    const up = ms.find((m) => m.status === 'scheduled' && m.ts >= Date.now());
    const m = up || ms[ms.length - 1];
    if (m) return domCupKey(cupFm(m));
  }
  const h = (club.h || []).find((x) => Number(x[5]) >= st.n && domCupKey(Number(x[6])));
  if (h) return domCupKey(Number(h[6]));
  const dom = domesticKeyOf(club.teamName);
  return dom && TOP_CUP[dom] ? domCupKey(TOP_CUP[dom]) : null;
}

// competizioni del giocatore per la tendina Competizione e le Medie stagione: campionato della squadra di club (se e' nel Calcolatore),
// coppa nazionale se la squadra la gioca in questa stagione, coppa europea se la gioca, Nations League della nazionale.
// player puo' essere il profilo di club o quello della nazionale.
export function playerComps(player) {
  if (!player) return [];
  const club = player.nat ? player.club || null : player;
  const nat = player.nat ? player : natOf(player);
  const out = [];
  const dom = club ? domesticKeyOf(club.teamName) : null;
  if (dom) out.push({ value: 'campionato', key: dom, comp: calcComp(dom), sub: `Campionato${calcComp(dom).country ? ` · ${calcComp(dom).country}` : ''}` });
  const dc = club ? domCupOf(club) : null;
  if (dc) {
    const info = domCupInfo(dc);
    const base = calcComp(dc);
    const comp = { ...base, name: info.name, country: info.country, kind: 'Coppa nazionale', logo: base.logo || FM_LOGO(info.fm), logoDark: base.logoDark || FM_LOGO_DARK(info.fm) };
    out.push({ value: 'coppaNaz', key: dc, comp, sub: `Coppa nazionale · ${info.country}` });
  }
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
