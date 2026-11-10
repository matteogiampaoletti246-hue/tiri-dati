// Nome giocatore toccabile (come PlayerLink del sito): partita non iniziata -> pannello da destra; iniziata o finita -> tendina dal basso.
import React from 'react';
import { Text } from 'react-native';
import { ourPlayerId, openPlayer } from '@/data/playerSheet';
import { matchStarted, openPanel } from '@/data/playerPanel';

const TBD = /^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i;

export default function PlayerLinkN({ match, name, fmId, openRoute, style, children, numberOfLines }) {
  if (!name || TBD.test(String(name).trim())) return <Text style={style}>{children}</Text>;
  const onPress = () => {
    if (matchStarted(match)) { openPlayer({ matchId: match.id, name, fmId }); return; }
    const id = ourPlayerId(match, name, fmId);
    if (id) openPanel(id);
  };
  return <Text onPress={onPress} numberOfLines={numberOfLines} style={style}>{children || name}</Text>;
}
