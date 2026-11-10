// Nome giocatore toccabile (come PlayerLink del sito): partita non iniziata -> pannello da destra; iniziata o finita -> scheda del giocatore.
import React from 'react';
import { Text } from 'react-native';
import { ourPlayerId } from '@/data/playerSheet';
import { matchStarted, openPanel } from '@/data/playerPanel';

const TBD = /^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i;

export default function PlayerLinkN({ match, name, fmId, openRoute, style, children, numberOfLines }) {
  if (!name || TBD.test(String(name).trim())) return <Text style={style}>{children}</Text>;
  const onPress = () => {
    const id = ourPlayerId(match, name, fmId);
    if (!id) return;
    if (matchStarted(match)) openRoute('/giocatore/' + id);
    else openPanel(id);
  };
  return <Text onPress={onPress} numberOfLines={numberOfLines} style={style}>{children || name}</Text>;
}
