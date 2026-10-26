// Competizioni a cui partecipa una squadra: prima il campionato, poi le coppe presenti nel calendario.
import { MATCHES } from './matches';
import { teamById } from './teams';
import { leagueById } from './leagues';

export function teamCompetitions(teamId) {
  const t = teamById(teamId);
  const ids = [];
  if (t && t.leagueId) ids.push(t.leagueId);
  MATCHES.forEach((m) => {
    if ((m.homeId === teamId || m.awayId === teamId) && m.leagueId && !ids.includes(m.leagueId)) ids.push(m.leagueId);
  });
  return ids.map(leagueById).filter(Boolean);
}
