// Home di prova NATIVA (React Native): stessi dati veri della pagina /prova/, ma liste e swipe sono elementi nativi di iOS.
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, SafeAreaView, StatusBar, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';

const BASE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const W = Dimensions.get('window').width;
const rome = (d) => { try { return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); } catch (e) { return d.toISOString().slice(0, 10); } };
const hhmm = (iso) => { try { return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }); } catch (e) { return ''; } };
const logo = (id) => `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
const getJ = async (u) => { const r = await fetch(BASE + u); if (!r.ok) throw new Error(u); return r.json(); };

const Row = memo(({ m }) => (
  <View style={s.row}>
    <View style={s.team}><Image source={{ uri: logo(m[3]) }} style={s.logo} /><Text numberOfLines={1} style={s.name}>{m[5]}</Text></View>
    <View style={s.mid}><Text style={s.score}>{m[7] || hhmm(m[2])}</Text><Text style={s.sub}>{m[8] === 'l' ? 'LIVE' : m[8] === 'f' ? 'Fin' : ''}</Text></View>
    <View style={[s.team, s.teamR]}><Text numberOfLines={1} style={[s.name, { textAlign: 'right' }]}>{m[6]}</Text><Image source={{ uri: logo(m[4]) }} style={s.logo} /></View>
  </View>
));
const Head = memo(({ t }) => <View style={s.head}><Text style={s.headT}>{t}</Text></View>);

const buildItems = (ms, idx) => {
  const g = {};
  ms.slice().sort((a, b) => (a[2] < b[2] ? -1 : 1)).forEach((m) => { (g[m[1]] = g[m[1]] || []).push(m); });
  const out = [];
  Object.keys(g).forEach((fm) => {
    out.push({ k: `h${fm}`, h: (idx[fm] || {}).n || `Competizione ${fm}` });
    g[fm].forEach((m) => out.push({ k: `m${m[0]}`, m }));
  });
  return out;
};

const Day = memo(({ items }) => {
  const render = useCallback(({ item }) => (item.h ? <Head t={item.h} /> : <Row m={item.m} />), []);
  if (!items.length) return <View style={{ width: W }}><Text style={s.empty}>Nessuna partita</Text></View>;
  return (
    <View style={{ width: W }}>
      <FlatList data={items} renderItem={render} keyExtractor={(i) => i.k} initialNumToRender={16} maxToRenderPerBatch={12} windowSize={7} removeClippedSubviews />
    </View>
  );
});

export default function App() {
  const [days, setDays] = useState(null);
  const [cur, setCur] = useState(3);
  const pager = useRef(null);
  const strip = useRef(null);
  const slow = useRef({ n: 0, max: 0, last: 0 });
  const [hud, setHud] = useState('');

  useEffect(() => {
    (async () => {
      const keys = [];
      for (let i = -3; i <= 6; i++) { const d = new Date(); d.setDate(d.getDate() + i); keys.push(rome(d)); }
      const idx = await getJ('arch/index.json').catch(() => ({}));
      const seen = new Set(); const by = {};
      const files = await Promise.all(keys.map((k) => getJ(`giorni/${k}.json`).catch(() => ({ m: [] }))));
      files.forEach((f) => (f.m || []).forEach((m) => {
        if (seen.has(m[0])) return; seen.add(m[0]);
        const k = rome(new Date(m[2])); (by[k] = by[k] || []).push(m);
      }));
      setDays(keys.map((k) => ({ k, items: buildItems(by[k] || [], idx) })));
    })();
  }, []);

  // misuratore: fotogrammi lenti (> 50 ms)
  useEffect(() => {
    let id; const st = slow.current; let n = 0;
    const tick = (t) => { if (st.last) { const d = t - st.last; if (d > 50) st.n += 1; if (d > st.max) st.max = d; } st.last = t; n += 1; if (n % 30 === 0) setHud(`lenti(>50ms): ${st.n} | peggiore: ${Math.round(st.max)} ms`); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const onEnd = useCallback((e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    setCur(i);
    if (strip.current) strip.current.scrollTo({ x: Math.max(0, i * 70 - W / 2 + 35), animated: true });
  }, []);
  const go = (i) => { setCur(i); pager.current && pager.current.scrollToIndex({ index: i, animated: true }); };

  if (!days) return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color="#3b82f6" /></View>;
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.bar}>
        <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10, gap: 6 }}>
          {days.map((d, i) => { const dt = new Date(`${d.k}T12:00:00`); return (
            <Pressable key={d.k} onPress={() => go(i)} style={[s.chip, i === cur && s.chipOn]}>
              <Text style={s.chipT}>{dt.toLocaleDateString('it-IT', { weekday: 'short' })}</Text><Text style={s.chipT}>{dt.getDate()}/{dt.getMonth() + 1}</Text>
            </Pressable>); })}
        </ScrollView>
        <Text style={s.hud}>{hud}</Text>
      </View>
      <FlatList
        ref={pager} data={days} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(d) => d.k} renderItem={({ item }) => <Day items={item.items} />}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })} initialScrollIndex={3}
        onMomentumScrollEnd={onEnd} windowSize={3} initialNumToRender={1} maxToRenderPerBatch={1} decelerationRate="fast"
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0d12' },
  bar: { backgroundColor: '#11141b', borderBottomWidth: 1, borderBottomColor: '#222836' },
  hud: { color: '#8b93a7', fontSize: 11, paddingHorizontal: 12, paddingBottom: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#1a1f2b', minWidth: 58, alignItems: 'center' },
  chipOn: { backgroundColor: '#3b82f6' },
  chipT: { color: '#fff', fontWeight: '600' },
  head: { marginTop: 10, marginHorizontal: 10, padding: 10, backgroundColor: '#151a24', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  headT: { color: '#aab3c8', fontWeight: '700' },
  row: { marginHorizontal: 10, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#151a24', borderTopWidth: 1, borderTopColor: '#1d2331' },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamR: { justifyContent: 'flex-end' },
  logo: { width: 22, height: 22 },
  name: { color: '#e8eaf0', fontSize: 14, flexShrink: 1 },
  mid: { width: 54, alignItems: 'center' },
  score: { color: '#e8eaf0', fontWeight: '700' },
  sub: { color: '#8b93a7', fontSize: 10 },
  empty: { color: '#8b93a7', textAlign: 'center', padding: 50 },
});
