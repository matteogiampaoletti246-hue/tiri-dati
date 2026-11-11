// Corpo a schede con swipe laterale dentro una pagina che scorre tutta insieme (Partita): le schede scorrono davvero col dito
// (come lo swipe tra i giorni della Home): la scheda vicina si monta appena il dito inizia a trascinare e arriva da lato insieme a quella attuale.
// La barra segue con `pos` (indice frazionario). Thread UI.
import { useBackGate, pagerTouch } from './backGate';
import React, { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, runOnJS, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function Pane({ i, pos, W, children, absolute }) {
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: (i - pos.value) * W }] }));
  return <Animated.View style={[absolute ? { position: 'absolute', left: 0, right: 0, top: 0 } : null, st]}>{children}</Animated.View>;
}

export default function SwipeBodyN({ index, count, onIndex, pos, render }) {
  const { width: W } = useWindowDimensions();
  useBackGate(index > 0, true);
  const [nb, setNb] = useState(null); // indice della scheda vicina montata durante il trascinamento
  const start = useSharedValue(index);
  const dirSet = useSharedValue(0);
  const prev = useRef(index);
  useEffect(() => { pos.value = index; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (prev.current !== index) {
      prev.current = index;
      // cambio da tasto barra: le schede scorrono dalla vecchia alla nuova
      pos.value = withTiming(index, { duration: 260, easing: Easing.out(Easing.cubic) });
    }
    setNb(null);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const pan = Gesture.Pan().activeOffsetX([-12, index > 0 ? 12 : 100000]).failOffsetY([-14, 14])
    .onTouchesDown(() => { pagerTouch.value = 1; })
    .onTouchesUp(() => { pagerTouch.value = 0; })
    .onFinalize(() => { pagerTouch.value = 0; })
    .onStart(() => { cancelAnimation(pos); start.value = Math.round(pos.value); dirSet.value = 0; })
    .onUpdate((e) => {
      let v = start.value - e.translationX / W;
      if (v < 0) v *= 0.25; else if (v > count - 1) v = count - 1 + (v - (count - 1)) * 0.25;
      pos.value = v;
      const d = v > start.value ? 1 : v < start.value ? -1 : 0;
      if (d && d !== dirSet.value) { dirSet.value = d; const n = start.value + d; if (n >= 0 && n < count) runOnJS(setNb)(n); }
    })
    .onEnd((e) => {
      let t = Math.round(pos.value - (e.velocityX / W) * 0.25);
      t = Math.max(start.value - 1, Math.min(start.value + 1, t));
      t = Math.max(0, Math.min(count - 1, t));
      pos.value = withTiming(t, { duration: 240, easing: Easing.out(Easing.cubic) }, (d) => { if (d && t !== start.value) runOnJS(onIndex)(t); });
    });
  const shownNb = nb != null && nb !== index && nb >= 0 && nb < count ? nb : null;
  return (
    <GestureDetector gesture={pan}>
      <View style={{ overflow: 'hidden' }}>
        {(shownNb != null ? [index, shownNb] : [index]).map((i) => <Pane key={i} i={i} pos={pos} W={W} absolute={i !== index}>{render(i)}</Pane>)}
      </View>
    </GestureDetector>
  );
}
