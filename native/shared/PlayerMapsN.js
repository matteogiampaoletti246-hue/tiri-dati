// Mappe del campo del giocatore (nativo): Tiri, Tiri in porta, Falli commessi, Falli subiti, partite sommate.
// Filtri propri (competizione e stagione, diversi da quelli delle statistiche) e tendina avversari = una sola partita.
// Pallini come nella pagina partita (DotShape), toccabili: sotto compaiono i dettagli. Il giocatore attacca sempre verso destra.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Circle, Polyline, G } from 'react-native-svg';
import { Panel, DropBtn, LeagueLogo } from './ui';
import { DotShape, shotColor, situationOf, zoneOf, outcomeOf, isBlocked, HIT, PITCH, LINE, TRACE } from './ShotMap';
import { FM_ID, teamLogo, playerFace } from '@/data/archive';
import { usePlayerMaps, mapSeasons, loadPlayerMaps } from '@/data/playerMaps';
import { comma } from '@/lib/format';

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const dateIt = (ts) => { const d = ts ? new Date(ts) : null; return d && !Number.isNaN(d.getTime()) ? `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}` : ''; };
const lumOf = (h) => { const m = /^#?([0-9a-f]{6})/i.exec(String(h || '')); if (!m) return 1; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const hexOk = (c) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : null);

const RIGHT = [[[105, 13.84], [88.5, 13.84], [88.5, 54.16], [105, 54.16]], [[105, 24.84], [99.5, 24.84], [99.5, 43.16], [105, 43.16]]];
const mir = (pts) => pts.map(([x, y]) => [105 - x, y]);
const pl = (pts) => pts.map((p) => p.join(',')).join(' ');

function Pitch({ list, color, sel, onSel, kind, cur, sk, C }) {
  const big = list.length > 250;
  const goalPt = cur && cur.gy != null ? [105, cur.gy] : null;
  const bp = cur && isBlocked(cur) && cur.bx != null ? [cur.bx, cur.by] : null;
  return (
    <Svg width="100%" viewBox="-1 -1 107 70" style={{ aspectRatio: 107 / 70, backgroundColor: sk ? C.skBase : PITCH, borderRadius: 10 }}>
      <Rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
      <Line x1="52.5" x2="52.5" y1="0" y2="68" stroke={LINE} strokeWidth="0.5" />
      <Circle cx="52.5" cy="34" r="9.15" fill="none" stroke={LINE} strokeWidth="0.5" />
      {RIGHT.map((l, i) => <Polyline key={`r${i}`} points={pl(l)} fill="none" stroke={LINE} strokeWidth="0.5" />)}
      {RIGHT.map((l, i) => <Polyline key={`l${i}`} points={pl(mir(l))} fill="none" stroke={LINE} strokeWidth="0.5" />)}
      {kind === 'shot' && cur ? (bp ? (
        <>
          <Line x1={cur.px} y1={cur.py} x2={bp[0]} y2={bp[1]} stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.3 1.1" />
          <Line x1={bp[0] - 1.5} y1={bp[1]} x2={bp[0] + 1.5} y2={bp[1]} stroke={TRACE} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : goalPt && !isBlocked(cur) ? <Line x1={cur.px} y1={cur.py} x2={goalPt[0]} y2={goalPt[1]} stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.4 1.2" /> : null) : null}
      {list.map((s, i) => {
        const cx = Math.max(1, Math.min(104, s.px)); const cy = Math.max(1, Math.min(67, s.py));
        return (
          <G key={i} x={cx} y={cy} onPress={() => onSel(i === sel ? null : i)}>
            {i === sel ? <Circle r={3.6} fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
            <Circle r={big ? 2.4 : 4.2} fill={HIT} />
            {big && !(kind === 'shot' && s.outcome === 'Gol') ? <Circle r={1.2} fill={color} fillOpacity={0.7} /> : <DotShape c={color} goal={kind === 'shot' && s.outcome === 'Gol'} on={kind === 'shot' ? !!s.onTarget : true} r={1.9} />}
          </G>
        );
      })}
    </Svg>
  );
}

const Crest = ({ fid, size = 18 }) => (fid ? <Image source={{ uri: teamLogo(fid) }} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory-disk" /> : null);

function Duel({ C, e, onPrev, onNext }) {
  const cs = (e.oppTeam && e.oppTeam.colors) || ['#2a3a66', '#2a3a66'];
  const c0 = [cs[0], cs[1], '#2a3a66'].map(hexOk).find((x) => x && lumOf(x) <= 0.72) || '#2a3a66';
  const photo = e.other.id ? playerFace(e.other.id) : null;
  return (
    <View style={{ borderRadius: 18, overflow: 'hidden' }}>
      <LinearGradient colors={[c0, `${c0}66`, `${c0}00`]} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 18, borderWidth: 1.2, borderColor: `${c0}66` }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
        <Pressable onPress={onPrev} hitSlop={10}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
        <View style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'flex-end' }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 46, height: 46 }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={36} color="rgba(255,255,255,.7)" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 10.5 }}>{e.kind === 'fc' ? 'Fallo su' : 'Fallo di'}</Text>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>{e.other.name || '—'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {e.oppTeam ? <Crest fid={e.oppTeam.fid} size={14} /> : null}
            <Text numberOfLines={1} style={{ flex: 1, color: 'rgba(255,255,255,.78)', fontSize: 12 }}>{e.oppTeam ? e.oppTeam.name : ''}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: C.ink, fontSize: 20, fontWeight: '800' }}>{e.min}&apos;</Text>
          <Text style={{ color: C.ink2, fontSize: 11 }}>{dateIt(e.ts)}</Text>
        </View>
        <Pressable onPress={onNext} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={C.ink} /></Pressable>
      </View>
    </View>
  );
}

function ShotDetail({ C, s, onPrev, onNext }) {
  return (
    <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: C.chip, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={onPrev} hitSlop={10}><Ionicons name="chevron-back" size={20} color={C.accent} /></Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {s.opp ? <Crest fid={s.opp.fid} size={18} /> : null}
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: C.ink, flexShrink: 1 }}>{s.opp ? `vs ${s.opp.name}` : s.playerName}</Text>
          </View>
          <Text style={{ color: C.ink3, fontSize: 11.5 }}>{dateIt(s.ts)} · {s.minute}&apos;</Text>
        </View>
        <Pressable onPress={onNext} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={C.accent} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 }}>
        {[
          // tiri presi da ESPN (seconda fonte): niente xG/xGOT ne' zona del gol, le voci senza dato non si mostrano
          s.src === 'e' ? null : ['xG', comma(s.xg, 2)],
          s.src === 'e' ? null : ['xGOT', s.onTarget || s.outcome === 'Gol' ? comma(s.xgot, 2) : '—'],
          ['Esito', outcomeOf(s)],
          ['Situazione', situationOf(s.situation)],
          ['Tipo di tiro', s.body === 'Testa' ? 'Colpo di testa' : s.body === 'Destro' ? 'Piede destro' : s.body === 'Sinistro' ? 'Piede sinistro' : 'Altro'],
          ['Zona gol', zoneOf(s)],
        ].filter((x) => x && x[1] !== '—').map(([k, v]) => (
          <View key={k} style={{ width: '33.33%', alignItems: 'center' }}>
            <Text style={{ color: C.ink3, fontSize: 10.5 }}>{k}</Text>
            <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '700', textAlign: 'center' }}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// comps: competizioni del giocatore [{id, name, logo...}]; fmPid: id FotMob del giocatore
export default function PlayerMapsN({ C, comps, fmPid, name, color, openRoute }) {
  const [comp, setComp] = useState('all');
  const [season, setSeason] = useState('cur');
  const [opp, setOpp] = useState('all');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(null);
  const [W, setW] = useState(0);
  const [sList, setSList] = useState([]);
  const fms = useMemo(() => (comp === 'all' ? comps.map((c) => FM_ID[c.id]) : [FM_ID[comp]]).filter(Boolean), [comp, comps]); // eslint-disable-line react-hooks/exhaustive-deps
  const fm1 = comp === 'all' ? null : FM_ID[comp];
  const fmsSig = fms.join(',');
  useEffect(() => {
    let on = true;
    setSList([]);
    Promise.all(fms.map((f) => mapSeasons(f))).then((ls) => { if (on) setSList([...new Set(ls.flat())].sort((a, b) => String(b).localeCompare(String(a)))); });
    return () => { on = false; };
  }, [fmsSig]); // eslint-disable-line react-hooks/exhaustive-deps
  // stagioni sempre come 2025/26, 2024/25... (dal 1 agosto al 31 luglio, per tutte le competizioni: quelle a anno solare, tipo "2025", rientrano nelle due stagioni che coprono)
  // niente "Tutte le stagioni" (rallentava troppo l'app): ultime 5, stagione attuale, poi le altre in ordine cronologico inverso
  const nowY = (() => { const d = new Date(); return d.getUTCFullYear() - (d.getUTCMonth() < 7 ? 1 : 0); })();
  const ys = useMemo(() => {
    const set = new Set();
    sList.forEach((sk) => { const a = Number(String(sk).slice(0, 4)); if (!a) return; if (/^\d{4}-\d{4}$/.test(String(sk))) set.add(a); else { set.add(a - 1); set.add(a); } });
    return [...set].filter((y) => y >= 2019 && y < nowY).sort((a, b) => b - a);
  }, [sList]);
  const sOpts = [{ value: 'l5', label: 'Ultime 5' }, { value: 'cur', label: 'Stagione attuale' }, ...ys.map((y) => ({ value: `y${y}`, label: `${y}/${String(y + 1).slice(2)}` }))];
  const sEff = sOpts.some((o) => o.value === season) ? season : 'cur';
  const data = usePlayerMaps({ pid: fmPid, name, fms, seasonSel: sEff });
  const col = shotColor([hexOk(color) || '#ffffff']);
  // appena la mappa scelta e' pronta si scarica in silenzio la stagione precedente: passare da una stagione all'altra e' istantaneo
  useEffect(() => {
    if (data === undefined || !ys[0] || !fms.length) return undefined;
    const t = setTimeout(() => { loadPlayerMaps({ pid: fmPid, name, fms, seasonSel: `y${ys[0]}` }).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [data, ys[0], fmsSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = data || { shots: [], fouls: [] };
  const opps = useMemo(() => {
    const o = new Map();
    [...all.shots, ...all.fouls].forEach((e) => { if (!o.has(e.mid)) o.set(e.mid, e); });
    return [...o.values()].sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || '')));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const oEff = opp === 'all' || opps.some((e) => e.mid === opp) ? opp : 'all';
  const f = (l) => (oEff === 'all' ? l : l.filter((e) => e.mid === oEff));
  const pages = [
    ['Tiri', f(all.shots), 'shot'],
    ['Tiri in porta', f(all.shots).filter((s) => s.onTarget || s.outcome === 'Gol'), 'shot'],
    ['Falli commessi', f(all.fouls.filter((e) => e.kind === 'fc')), 'fc'],
    ['Falli subiti', f(all.fouls.filter((e) => e.kind === 'fs')), 'fs'],
  ].filter((x) => x[1].length);
  const sig = `${comp}|${sEff}|${oEff}|${pages.length}`;
  useEffect(() => { setPage(0); setSel(null); }, [sig]);
  const pi = Math.min(page, Math.max(0, pages.length - 1));
  const cur = pages[pi];
  const curE = cur && sel != null && cur[1][sel] ? cur[1][sel] : null;
  const step = (d) => { if (cur) setSel((i) => (((i == null ? -1 : i) + d + cur[1].length) % cur[1].length)); };
  const cOpts = [{ value: 'all', label: 'Tutte le competizioni' }, ...comps.map((c) => ({ value: c.id, label: c.name, icon: <LeagueLogo league={c} size={26} C={C} /> }))];
  const cLg = comps.find((c) => c.id === comp);
  const oOpts = [{ value: 'all', label: 'Tutti gli avversari' }, ...opps.map((e) => ({ value: e.mid, label: `${e.opp ? `vs ${e.opp.name}` : 'Partita'}${e.ts ? ` · ${dateIt(e.ts)}` : ''}`, icon: e.opp ? <Crest fid={e.opp.fid} size={24} /> : undefined }))];
  const oLbl = (oOpts.find((o) => o.value === oEff) || oOpts[0]).label;
  const oIcon = oEff !== 'all' ? (opps.find((e) => e.mid === oEff) || {}).opp : null;
  if (!comps.length) return null;
  const pw = Math.max(0, Math.min(W - 24, 280));
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <DropBtn C={C} title="Competizione" label={cLg ? cLg.name : 'Tutte le competizioni'} icon={cLg ? <LeagueLogo league={cLg} size={24} C={C} /> : undefined} options={cOpts} value={comp} onChange={(v) => { setComp(v); setSeason('l5'); setOpp('all'); }} />
        <DropBtn C={C} title="Stagione" label={(sOpts.find((o) => o.value === sEff) || sOpts[0]).label} options={sOpts} value={sEff} onChange={(v) => { setSeason(v); setOpp('all'); }} />
      </View>
      {data === undefined ? (
        // scheletro con la forma vera: cornice, titolo, tendina avversari e il campo con le sue linee (visibile subito, nessuna rotella)
        <Panel C={C} tint={color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
            <View style={{ width: 80, height: 16, borderRadius: 8, backgroundColor: C.skBase, marginLeft: 2 }} />
            <View style={{ width: 150, height: 40, borderRadius: 20, backgroundColor: C.skBase }} />
          </View>
          <View style={{ alignItems: 'center' }}><View style={{ width: '100%', maxWidth: 280 }}><Pitch list={[]} sk C={C} color={col} kind="shot" sel={null} onSel={() => {}} cur={null} /></View></View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 }}>
            {[0, 1, 2, 3].map((k) => <View key={k} style={{ width: k ? 6 : 16, height: 6, borderRadius: 3, backgroundColor: C.border }} />)}
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}><View style={{ height: 14, borderRadius: 7, backgroundColor: C.skBase, width: '60%', alignSelf: 'center' }} /></View>
        </Panel>
      ) : !pages.length ? null : (
        <Panel C={C} tint={color}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
            <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800', paddingLeft: 2 }}>{cur[0]}</Text>
            <View style={{ flexShrink: 1, minWidth: 0 }}><DropBtn C={C} title="Avversario" label={oLbl} icon={oIcon ? <Crest fid={oIcon.fid} size={22} /> : undefined} options={oOpts} value={oEff} onChange={(v) => setOpp(v)} /></View>
          </View>
          <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
            {W ? (
              <ScrollView key={sig} horizontal pagingEnabled showsHorizontalScrollIndicator={false} nestedScrollEnabled onMomentumScrollEnd={(e) => { setPage(Math.round(e.nativeEvent.contentOffset.x / W)); setSel(null); }} style={{ width: W }}>
                {pages.map(([nm, list, kind], k) => (
                  <View key={nm} style={{ width: W, alignItems: 'center' }}>
                    <View style={{ width: pw }}><Pitch list={list} color={col} kind={kind} sel={k === pi ? sel : null} onSel={setSel} cur={k === pi && kind === 'shot' ? curE : null} /></View>
                  </View>
                ))}
              </ScrollView>
            ) : <View style={{ height: 160 }} />}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 }}>
            {pages.map((x, k) => <View key={x[0]} style={{ width: k === pi ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === pi ? col : C.border }} />)}
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            {curE ? (cur[2] === 'shot' ? <ShotDetail C={C} s={curE} onPrev={() => step(-1)} onNext={() => step(1)} /> : <Duel C={C} e={curE} onPrev={() => step(-1)} onNext={() => step(1)} />)
              : <Text style={{ color: C.ink3, fontSize: 11.5, textAlign: 'center' }}>Tocca un pallino per vedere i dettagli</Text>}
          </View>
        </Panel>
      )}
    </View>
  );
}
