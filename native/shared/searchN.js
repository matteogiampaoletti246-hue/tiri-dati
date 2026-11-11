// Ricerca della Home nativa: stessi risultati, ordine e sezioni del sito (lib/search.js), in forma semplice per disegnare e aprire.
import './shim';
import { teamById, teamByFm } from '@/data/teams';
import { leagueById, leagueTint } from '@/data/leagues';
import { teamCompetitions } from '@/data/competitions';
import { countryIt, flagCode, carriereOf } from '@/data/carriere';
import { FLAG_COLORS } from './flagColors';
import { searchAll, matchSpan } from '@/lib/search';

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const initials = (name) => String(name).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function searchN(q) {
  const r = searchAll(q);
  const color = (t) => (t && t.colors && t.colors[0]) || null;
  const sp = (n) => matchSpan(n, q);
  const natFor = (p) => {
    let en = p.natView ? p.natView.teamName : p.nat ? p.teamName : null;
    if (!en) { try { const c = carriereOf(p.id); en = c && c.c; } catch (e) { en = null; } }
    const fc = en ? flagCode(en) : '';
    return fc ? { name: countryIt(en), fc } : null;
  };
  return {
    fuzzy: r.fuzzy,
    leagues: r.leagues.map((l) => ({ id: l.id, name: l.name, country: l.country || '', logo: l.logo || null, logoDark: l.logoDark || null, color: leagueTint(l.id), path: `/campionato/${l.id}`, hl: sp(l.name) })),
    teams: r.teams.map((t) => {
      let l = leagueById(t.leagueId);
      if (!l) { try { l = teamCompetitions(t.id)[0] || null; } catch (e) { l = null; } }
      const c = l ? l.country || '' : '';
      const nf = flagCode(t.name);
      const fcol = nf && FLAG_COLORS[nf] ? FLAG_COLORS[nf] : null;
      return { id: t.id, name: t.name, flag: nf || null, flagColors: fcol, crest: t.crest || null, initials: t.initials || initials(t.name), sub: `${c}${c && l ? ' · ' : ''}${l ? l.name : ''}`, logo: l ? l.logo || null : null, color: fcol ? fcol[0] : color(t), color2: fcol ? fcol[1] || null : null, color3: fcol ? fcol[2] || null : null, path: `/squadra/${t.id}`, hl: sp(t.name) };
    }),
    players: r.players.map((p) => {
      if (p.nat) {
        const fc = flagCode(p.teamName);
        const ct = p.clubName ? teamByFm(p.clubFm) : null;
        const crest = ct ? ct.crest || null : p.clubFm ? `https://images.fotmob.com/image_resources/logo/teamlogo/${p.clubFm}.png` : null;
        return p.clubName
          ? { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: ct ? ct.name : p.clubName, crest, color: color(ct), color2: ct && ct.colors ? ct.colors[1] || null : null, nat: { name: countryIt(p.teamName), fc }, path: `/giocatore/${p.id}` }
          : { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: countryIt(p.teamName), crest: fc ? `${SITE}native-link/flags43/${fc}.png` : null, color: null, color2: null, nat: null, path: `/giocatore/${p.id}` };
      }
      const t = teamById(p.teamId);
      return { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: t ? t.name : p.teamName || '', crest: t ? t.crest || null : null, color: color(t), color2: t && t.colors ? t.colors[1] || null : null, nat: natFor(p), fmId: p.fmId || null, path: `/giocatore/${p.id}` };
    }),
    referees: r.referees.map((x) => ({ id: x.id, name: x.name, initials: initials(x.name), path: `/arbitro/${x.id}`, hl: sp(x.name) })),
  };
}
