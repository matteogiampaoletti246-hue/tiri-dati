// Bandiera tonda come nel sito (FlagDot): immagine che riempie il cerchio, anello del colore della bandiera; mai emoji.
// Prova prima la cartella della Home nativa, poi quella del sito.
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { carriereOf, countryIt, flagCode } from '@/data/carriere';

const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const SRC = [`${SITE}native-link/flags/`, `${SITE}aurora/flags/`];

export const FlagN = ({ code, name, size = 15, C }) => {
  const c = code || flagCode(name);
  const [k, setK] = useState(0);
  if (!c) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: C ? C.chip : 'rgba(128,128,128,.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}>
      {k < SRC.length ? <Image source={{ uri: `${SRC[k]}${c}.png` }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" transition={0} onError={() => setK(k + 1)} /> : null}
    </View>
  );
};

// nazionalita' del giocatore: dalla nazionale collegata o dalla carriera; { code, name } oppure null
export const natOf = (p) => {
  if (!p) return null;
  let en = p.natView ? p.natView.teamName : null;
  if (!en) { try { const c = carriereOf(p.id); en = c && c.c; } catch (e) { en = null; } }
  const code = en ? flagCode(en) : '';
  return code ? { code, name: countryIt(en) } : null;
};

// riga "stemma squadra | bandiera nazione" sotto il nome (stessa del sito: ClubNatLine)
export const ClubNatN = ({ C, team, teamName, nat, size = 15, style, own }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 7 }, style]}>
    {team ? <Image source={{ uri: team.crest }} style={{ width: size + 3, height: size + 3 }} contentFit="contain" cachePolicy="memory-disk" /> : null}
    <Text numberOfLines={1} style={{ flexShrink: 1, color: own || C.ink2, fontSize: 12.5 }}>{teamName}</Text>
    {nat ? <View style={{ width: 1, height: 13, backgroundColor: C.ink3, opacity: 0.5 }} /> : null}
    {nat ? <FlagN code={nat.code} size={size} C={C} /> : null}
    {nat ? <Text numberOfLines={1} style={{ flexShrink: 1, color: own || C.ink2, fontSize: 12.5 }}>{nat.name}</Text> : null}
  </View>
);
