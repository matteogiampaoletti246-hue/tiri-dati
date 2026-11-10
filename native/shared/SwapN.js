// Cambio di selezione (competizione, stagione, filtro): il contenuto nuovo prende il posto del vecchio con una dissolvenza, senza schermo nero.
// Il primo disegno non si anima.
import React, { useRef } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function SwapN({ k, children, style }) {
  const first = useRef(k);
  return <Animated.View key={String(k)} entering={first.current !== k ? FadeIn.duration(260) : undefined} style={style}>{children}</Animated.View>;
}
