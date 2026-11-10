// Schede della pagina Partita (si portano una alla volta). `hasPanel` decide se la scheda compare (mai riquadri vuoti).
import React from 'react';
import { View } from 'react-native';
import { LeagueStandings, ArchiveStandings } from '../shared/Standings';
import { peekBracket } from '@/data/bracket';
import Riepilogo from './PartitaRiepilogo';
import Formazioni, { hasLineups } from './PartitaLineups';
import Panoramica from './PartitaPanoramica';
import { preStatsOk } from './PartitaPre';
import Statistiche, { hasPlayedStats } from './PartitaStats';
import Tabellone from './PartitaBracket';
import Affidabilita, { hasReliability } from './PartitaRel';
import { ALL_KEYS } from '@/data/calcData';

function Classifica({ C, match, openRoute, cup }) {
  if (cup) return <Tabellone C={C} match={match} openRoute={openRoute} />;
  if (match.archive && match.season) {
    const { fm, sk, hid, aid } = match.archive;
    return <ArchiveStandings C={C} season={match.season} fm={fm} sk={sk} highlight={[hid, aid]} openRoute={openRoute} />;
  }
  return <View style={{ paddingTop: 12 }}><LeagueStandings C={C} leagueId={match.leagueId} highlight={[match.homeId, match.awayId]} openRoute={openRoute} /></View>;
}

export const PANELS = { summary: Riepilogo, overview: Panoramica, stats: Statistiche, lineups: Formazioni, rel: Affidabilita, standings: Classifica };

export function hasPanel(key, raw, view, home, away, pre, cup) {
  if (!PANELS[key]) return false; // scheda non ancora portata
  if (key === 'stats') return pre ? preStatsOk(raw, home, away) : hasPlayedStats(view);
  if (key === 'lineups') return hasLineups(view);
  if (key === 'rel') return (!raw.archive || ALL_KEYS.includes(raw.leagueId)) && hasReliability(raw);
  if (key === 'standings') return cup ? !!((peekBracket(raw.archive.fm, raw.archive.sk) || {}).rounds || []).length : !raw.archive || !!(raw.season && (raw.season.table || (raw.season.groups && raw.season.groups.length)));
  return true;
}
