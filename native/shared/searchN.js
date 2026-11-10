// Ricerca della Home nativa: stessi risultati, ordine e sezioni del sito (lib/search.js), in forma semplice per disegnare e aprire.
import './shim';
import { teamById, teamByFm } from '@/data/teams';
import { leagueById, leagueTint } from '@/data/leagues';
import { countryIt, flagCode } from '@/data/carriere';
import { searchAll, matchSpan } from '@/lib/search';

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const initials = (name) => String(name).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function searchN(q) {
  const r = searchAll(q);
  const color = (t) => (t && t.colors && t.colors[0]) || null;
  const sp = (n) => matchSpan(n, q);
  return {
    fuzzy: r.fuzzy,
    leagues: r.leagues.map((l) => ({ id: l.id, name: l.name, country: l.country || '', logo: l.logo || null, logoDark: l.logoDark || null, color: leagueTint(l.id), path: `/campionato/${l.id}`, hl: sp(l.name) })),
    teams: r.teams.map((t) => {
      const l = leagueById(t.leagueId);
      const c = l ? l.country || '' : '';
      return { id: t.id, name: t.name, crest: t.crest || null, initials: t.initials || initials(t.name), sub: `${c}${c && l ? ' · ' : ''}${l ? l.name : ''}`, logo: l ? l.logo || null : null, color: color(t), path: `/squadra/${t.id}`, hl: sp(t.name) };
    }),
    players: r.players.map((p) => {
      if (p.nat) {
        const fc = flagCode(p.teamName);
        const ct = p.clubName ? teamByFm(p.clubFm) : null;
        const crest = ct ? ct.crest || null : p.clubFm ? `https://images.fotmob.com/image_resources/logo/teamlogo/${p.clubFm}.png` : null;
        return p.clubName
          ? { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: ct ? ct.name : p.clubName, crest, color: color(ct), color2: ct && ct.colors ? ct.colors[1] || null : null, nat: { name: countryIt(p.teamName), fc }, path: `/giocatore/${p.id}` }
          : { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: countryIt(p.teamName), crest: fc ? `${SITE}native-link/flags/${fc}.png` : null, color: null, color2: null, nat: null, path: `/giocatore/${p.id}` };
      }
      const t = teamById(p.teamId);
      return { hl: sp(p.name), id: p.id, name: p.name, photo: p.photo || null, team: t ? t.name : p.teamName || '', crest: t ? t.crest || null : null, color: color(t), color2: t && t.colors ? t.colors[1] || null : null, nat: p.natView ? { name: countryIt(p.natView.teamName), fc: flagCode(p.natView.teamName) } : p.nat ? { name: countryIt(p.teamName), fc: flagCode(p.teamName) } : null, path: `/giocatore/${p.id}` };
    }),
    referees: r.referees.map((x) => ({ id: x.id, name: x.name, initials: initials(x.name), path: `/arbitro/${x.id}`, hl: sp(x.name) })),
  };
}
