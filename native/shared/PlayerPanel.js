// Pannello giocatore da destra (nativo): partite non ancora iniziate. Velo, pannello al 68%, swipe a destra per chiuderlo,
// tasto Profilo verso la scheda. Stessi dati del sito (@/data/playerPanel); l'apertura la decide solo matchStarted.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './shim';
import { bootShared } from './boot';
import { Face, TeamCrest } from './ui';
import { resetSel } from './hooks';
import { closePanel, usePlayerPanel } from '@/data/playerPanel';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { injuryOf } from '@/data/injuries';
import { playerFace } from '@/data/archive';
import { parseArchiveId, makeArchivePlayer } from '@/data/archivePlayer';
import { useBioPid, usePlayerCareer } from '@/data/playerIndex';
import { money } from '@/data/carriere';
import GiocatoreStat, { playerHasCurStats } from '../pages/GiocatoreStat';
import { useBio, Flag } from '../pages/Giocatore';

const DUR = 420;
const EASE = Easing.bezier(0.45, 0, 0.55, 1);
const VEIL = 0.45;
const LBL = { fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase' };
const needArchive = (id) => { const p = playerById(id); return !p || !!p.lite; };

// le Statistiche si disegnano larghe come la scheda giocatore e si riducono alla larghezza del pannello (stesso rapporto)
function Scaled({ w, full, children }) {
  const [h, setH] = useState(0);
  const k = Math.min(1, w / full);
  return (
    <View style={{ width: w, height: h * k, overflow: 'hidden' }}>
      <View onLayout={(e) => setH(e.nativeEvent.layout.height)} style={{ position: 'absolute', left: 0, top: 0, width: full, transform: [{ translateX: -(full - w) / 2 }, { translateY: -(h - h * k) / 2 }, { scale: k }] }}>{children}</View>
    </View>
  );
}

function Cell({ C, k, v, gold, flag }) {
  return (
    <View style={{ width: '48.5%', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: C.chip }}>
      <Text style={[LBL, { color: C.ink3 }]}>{k}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
        {flag ? <Flag name={flag} size={14} C={C} /> : null}
        <Text numberOfLines={1} style={{ flexShrink: 1, color: gold ? C.gold : C.ink, fontSize: gold ? 13 : 12 }}>{v}</Text>
      </View>
    </View>
  );
}

function Body({ C, player, onProfile, panelW, full, showStats }) {
  const team = teamById(player.teamId);
  const pid = useBioPid(player);
  const photo = player.photo || (pid ? playerFace(pid) : null);
  const car = usePlayerCareer(player);
  const { c, cells } = useBio(player);
  const m = Object.fromEntries(cells.filter(([, v]) => v !== '—'));
  const nat = m['Nazionalità'];
  const tiles = [
    nat ? ['Nazionalità', nat.text, false, nat.flag] : null,
    m.Ruolo ? ['Ruolo', m.Ruolo] : null,
    m.Piede ? ['Piede', m.Piede] : null,
    c.mv ? ['Valore', money(c.mv), true] : null,
  ].filter(Boolean);
  const hasStats = playerHasCurStats(player) || !!car.loading || car.rows.length > 0;
  const c0 = team && team.colors ? team.colors[0] : C.accent;
  const inj = injuryOf(player.id);
  const shirt = m.Maglia;
  return (
    <>
      <View style={{ borderBottomWidth: 2, borderBottomColor: c0 }}>
        <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingRight: 30 }}>
            <Face uri={photo} color={c0} size={Math.round(panelW * 0.3)} />
            <View style={{ flex: 1, paddingBottom: 2 }}>
              <Text style={{ color: C.ink, fontSize: 16, fontWeight: '800', lineHeight: 19 }}>{player.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <TeamCrest team={team} size={14} C={C} />
                <Text numberOfLines={1} style={{ flex: 1, color: C.ink3, fontSize: 11 }}>{team ? team.name : player.teamName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {shirt ? <Text style={{ color: C.ink, fontSize: 24, fontWeight: '800' }}><Text style={{ color: C.ink3, fontSize: 12 }}>#</Text>{shirt}</Text> : null}
                <Pressable onPress={onProfile} style={{ borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.accent }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Profilo</Text>
                </Pressable>
              </View>
            </View>
          </View>
          {tiles.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {tiles.map(([k, v, g, f]) => <Cell key={k} C={C} k={k} v={v} gold={g} flag={f} />)}
            </View>
          ) : null}
        </View>
      </View>
      {inj ? (
        <View style={{ marginHorizontal: 14, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: `${C.live}22`, borderWidth: 1, borderColor: `${C.live}55` }}>
          <Text style={{ color: C.live, fontWeight: '800', fontSize: 12 }}>Infortunato</Text>
          <Text style={{ color: C.ink2, fontSize: 11.5, marginTop: 2 }}>{inj.reason}{inj.label ? ` · Rientro previsto: ${inj.label}` : ''}</Text>
        </View>
      ) : null}
      {hasStats && showStats ? <View style={{ paddingTop: 8 }}><Scaled w={panelW} full={full}><GiocatoreStat C={C} player={player} team={team} car={car} /></Scaled></View> : null}
    </>
  );
}

export default function PlayerPanelHost({ C, top = 0, bottom = 0, openRoute }) {
  const st = usePlayerPanel();
  const { width: W } = useWindowDimensions();
  const panelW = Math.round(W * 0.68);
  const x = useRef(new Animated.Value(panelW)).current; // 0 = aperto
  const [shown, setShown] = useState(null);
  const [ready, setReady] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const open = useRef(false);

  const animate = (to, then) => Animated.timing(x, { toValue: to, duration: DUR, easing: EASE, useNativeDriver: true }).start(({ finished }) => { if (finished && then) then(); });
  const finish = () => { open.current = false; setShown(null); setReady(false); setShowStats(false); };

  useEffect(() => {
    if (st) {
      resetSel(st.id);
      setShown(st.id);
      setShowStats(false);
      let live = true;
      (async () => {
        await bootShared();
        const arc = parseArchiveId(st.id);
        if (arc && needArchive(st.id)) await makeArchivePlayer(arc.fm, arc.sk, arc.pid);
        if (live) setReady(!!playerById(st.id));
      })().catch(() => { if (live) closePanel(); });
      return () => { live = false; };
    }
    if (shown) animate(panelW, finish);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  const player = shown && ready ? playerById(shown) : null;
  useEffect(() => {
    if (!player) return undefined;
    if (!open.current) { open.current = true; x.setValue(panelW); }
    animate(0, () => setShowStats(true));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player && player.id]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
    onPanResponderRelease: (_, g) => { if (g.dx > panelW * 0.3 || g.vx > 0.6) closePanel(); else animate(0); },
    onPanResponderTerminate: () => animate(0),
  })).current;

  if (!shown) return null;
  const veil = x.interpolate({ inputRange: [0, panelW], outputRange: [VEIL, 0], extrapolate: 'clamp' });
  const toProfile = () => { const id = shown; closePanel(); finish(); if (openRoute) openRoute(`/giocatore/${id}`); };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 20 }}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000', opacity: veil }}>
        <Pressable style={{ flex: 1 }} onPress={() => closePanel()} />
      </Animated.View>
      <Animated.View {...pan.panHandlers} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: panelW, backgroundColor: C.bg, borderLeftWidth: 1, borderLeftColor: C.border, transform: [{ translateX: x }] }}>
        <Pressable onPress={() => closePanel()} hitSlop={10} style={{ position: 'absolute', right: 10, top: top + 8, zIndex: 2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <Ionicons name="close" size={16} color={C.ink2} />
        </Pressable>
        <ScrollView contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false}>
          {player ? <Body C={C} player={player} onProfile={toProfile} panelW={panelW} full={W} showStats={showStats} /> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
