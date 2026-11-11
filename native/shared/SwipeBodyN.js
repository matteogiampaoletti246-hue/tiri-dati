// Corpo a schede con swipe laterale dentro una pagina che scorre tutta insieme (Partita): il dito sposta la scheda e la linea della barra segue;
// a fine gesto la scheda vicina entra da lato. Solo la scheda attiva e' montata. Thread UI.
import { useBackGate } from './backGate';
import React, { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function SwipeBodyN({ index, count, onIndex, pos, children }) {
  const { width: W } = useWindowDimensions();
  useBackGate(index > 0);
  const x = useSharedValue(0);
  const prev = useRef(index);
  useEffect(() => { pos.value = index; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (prev.current !== index) {
      const dir = index > prev.current ? 1 : -1;
      prev.current = index;
      x.value = dir * W * 0.35;
      x.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      pos.value = withTiming(index, { duration: 260, easing: Easing.out(Easing.cubic) });
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const pan = Gesture.Pan().activeOffsetX([-18, index > 0 ? 18 : 100000]).failOffsetY([-14, 14])
    .onUpdate((e) => {
      let v = e.translationX;
      if ((index === 0 && v > 0) || (index === count - 1 && v < 0)) v *= 0.25;
      x.value = v;
      pos.value = index - v / W;
    })
    .onEnd((e) => {
      const dir = (e.translationX < -W * 0.22 || e.velocityX < -600) ? 1 : (e.translationX > W * 0.22 || e.velocityX > 600) ? -1 : 0;
      const n = index + dir;
      if (!dir || n < 0 || n >= count) { x.value = withTiming(0, { duration: 200 }); pos.value = withTiming(index, { duration: 200 }); return; }
      pos.value = withTiming(n, { duration: 180 });
      x.value = withTiming(-dir * W * 0.6, { duration: 150 }, (d) => { if (d) runOnJS(onIndex)(n); });
    });
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: 1 - Math.min(0.6, Math.abs(x.value) / W) }));
  return <GestureDetector gesture={pan}><Animated.View style={st}>{children}</Animated.View></GestureDetector>;
}
