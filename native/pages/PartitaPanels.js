// Schede della pagina Partita (si portano una alla volta). `hasPanel` decide se la scheda compare (mai riquadri vuoti).
import React from 'react';
import { View } from 'react-native';
import { LeagueStandings, ArchiveStandings } from '../shared/Standings';
import { peekBracket } from '@/data/bracket';

function Classifica({ C, match, openRoute }) {
  if (match.archive && match.season) {
    const { fm, sk, hid, aid } = match.archive;
    return <ArchiveStandings C={C} season={match.season} fm={fm} sk={sk} highlight={[hid, aid]} openRoute={openRoute} />;
  }
  return <View style={{ paddingTop: 12 }}><LeagueStandings C={C} leagueId={match.leagueId} highlight={[match.homeId, match.awayId]} openRoute={openRoute} /></View>;
}

export const PANELS = { standings: Classifica };

export function hasPanel(key, raw, view, home, away, pre, cup) {
  if (!PANELS[key]) return false; // scheda non ancora portata
  if (key === 'standings') return cup ? !!((peekBracket(raw.archive.fm, raw.archive.sk) || {}).rounds || []).length && false : !raw.archive || !!(raw.season && (raw.season.table || (raw.season.groups && raw.season.groups.length)));
  return true;
}
