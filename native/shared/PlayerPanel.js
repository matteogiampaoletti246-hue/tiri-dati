// Pannello giocatore da destra (nativo): partite non ancora iniziate. Velo, pannello al 68%, swipe a destra per chiuderlo,
// tasto Profilo verso la scheda. Stessi dati del sito (@/data/playerPanel); l'apertura la decide solo matchStarted.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import './shim';
import { bootShared } from './boot';
import { TeamCrest } from './ui';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FlagN, ClubNatN, natOf } from './FlagN';
import { playerCtx } from './playerCtx';
import { presetSel, peekSel } from './hooks';
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
import { useBio } from '../pages/Giocatore';

const DUR = 420;
const EASE = Easing.bezier(0.45, 0, 0.55, 1);
const VEIL = 0.45;
const LBL = { fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase' };
const needArchive = (id) => { const p = playerById(id); return !p || !!p.lite; };

// le Statistiche si disegnano larghe come la scheda giocatore e si riducono alla larghezza del pannello (stesso rapporto)
function Scaled({ w, full, children }) {
  const [h, setH] = useState(0);
  const hRef = useRef(0);
  const tm = useRef(null);
  const k = Math.min(1, w / full);
  // altezza: sale subito, scende dopo un attimo (cambiando categoria la lista si accorcia e lo scroll saltava per un fotogramma)
  const onLay = (e) => {
    const nh = e.nativeEvent.layout.height;
    clearTimeout(tm.current);
    if (nh >= hRef.current) { hRef.current = nh; setH(nh); } else tm.current = setTimeout(() => { hRef.current = nh; setH(nh); }, 450);
  };
  useEffect(() => () => clearTimeout(tm.current), []);
  return (
    <View style={{ width: w, height: h * k, overflow: 'hidden' }}>
      <View onLayout={onLay} style={{ position: 'absolute', left: 0, top: 0, width: full, transform: [{ translateX: -(full - w) / 2 }, { translateY: -(h - h * k) / 2 }, { scale: k }] }}>{children}</View>
    </View>
  );
}

function Cell({ C, k, v, gold, flag }) {
  return (
    <View style={{ width: '48.5%', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: C.chip }}>
      <Text style={[LBL, { color: C.ink3 }]}>{k}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
        {flag ? <FlagN name={flag} size={15} C={C} /> : null}
        <Text numberOfLines={1} style={{ flexShrink: 1, color: gold ? C.gold : C.ink, fontSize: gold ? 13 : 12 }}>{v}</Text>
      </View>
    </View>
  );
}

function Body({ C, player: player1, onProfile, panelW, full, showStats, top }) {
  const { player, dataP, clubE, natE } = playerCtx(player1);
  if (player1.nat && natE && peekSel(dataP.id, 'sc') === undefined) presetSel(dataP.id, 'sc', natE.leagueId);
  const team = teamById(player.teamId);
  const clubTeam = teamById(clubE.teamId) || team;
  const natI = natOf(clubE) || natOf(player1);
  const pid = useBioPid(player);
  const photo = player.photo || (pid ? playerFace(pid) : null);
  const car = usePlayerCareer(dataP);
  const { c, cells } = useBio(player);
  const m = Object.fromEntries(cells.filter(([, v]) => v !== '—'));
  const nat = m['Nazionalità'];
  const tiles = [
    nat ? ['Nazionalità', nat.text, false, nat.flag] : null,
    m.Ruolo ? ['Ruolo', m.Ruolo] : null,
    m.Piede ? ['Piede', m.Piede] : null,
    c.mv ? ['Valore', money(c.mv), true] : null,
  ].filter(Boolean);
  const hasStats = playerHasCurStats(dataP) || !!car.loading || car.rows.length > 0;
  const c0 = team && team.colors ? team.colors[0] : C.accent;
  const inj = injuryOf(player.id);
  const shirt = m.Maglia;
  return (
    <>
      <View style={{ borderBottomWidth: 2, borderBottomColor: c0, overflow: 'hidden' }}>
        <LinearGradient pointerEvents="none" colors={[`${c0}88`, `${c0}00`]} locations={[0, 0.62]} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 0.9 }} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={[`${c0}00`, `${c0}66`]} start={{ x: 0.25, y: 0.3 }} end={{ x: 0.3, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ paddingHorizontal: 14, paddingTop: top + 12, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingRight: 30 }}>
            <View style={{ width: Math.round((panelW - 28) * 0.4), aspectRatio: 1 }}>
              {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="contain" contentPosition="top" cachePolicy="memory-disk" /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 2 }}>
              <Text style={{ color: C.ink, fontSize: 17, fontWeight: '700', lineHeight: 20 }}>{player.name}</Text>
              <ClubNatN C={C} team={clubTeam} teamName={clubTeam ? clubTeam.name : clubE.teamName} nat={natI} size={13} style={{ marginTop: 4, flexWrap: 'wrap', rowGap: 3 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {shirt ? <Text style={{ color: C.ink, fontSize: 26, fontWeight: '700' }}><Text style={{ color: C.ink3, fontSize: 13 }}>#</Text>{shirt}</Text> : null}
                <Pressable onPress={onProfile} style={{ borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: C.accent }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Profilo</Text>
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
      {hasStats && showStats ? <View style={{ paddingTop: 8 }}><Scaled w={panelW} full={full}><GiocatoreStat C={C} player={dataP} team={team} car={car} /></Scaled></View> : null}
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
        <ScrollView contentContainerStyle={{ paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false}>
          {player ? <Body C={C} top={top} player={player} onProfile={toProfile} panelW={panelW} full={W} showStats={showStats} /> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
