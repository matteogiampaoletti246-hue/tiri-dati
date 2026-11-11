// Tendina del giocatore dal basso (nativa): partite iniziate o finite. Volto col voto, gol/assist/cartellini/cambi, 4 numeri,
// mappa tiri del giocatore (porta + minuti + metà campo + dettagli) e statistiche a schede. Due altezze (55% / 92%), trascinando
// l'intestazione si cambia altezza o si chiude; swipe laterale = compagno prima/dopo. Stessi dati del sito (@/data/playerSheet).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Rect, Line, Circle, Polyline } from 'react-native-svg';
import './shim';
import { closePlayer, openPlayer, findInMatch, matchOf, ourPlayerId, usePlayerSheet } from '@/data/playerSheet';
import { norm } from '@/data/util';
import { comma } from '@/lib/format';
import { scoreColorSmooth } from '@/lib/calc';
import { TeamCrest, Segmented } from './ui';
import { BallIcon } from './Icons';
import { CardIcon, SubIcon } from '../pages/PartitaInfo';
import { DotShape, shotColor, situationOf, zoneOf, outcomeOf, isBlocked, HIT, PITCH, LINE, GOALBG, GOALLINE, TRACE } from './ShotMap';

const lum = (c) => { const m = /^#([0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return 1; const n = parseInt(m[1], 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
const seen = (c) => (lum(c) < 0.42 ? '#ffffff' : c);

const IT = {
  rating_title: 'Voto', minutes_played: 'Minuti giocati', goals: 'Gol', assists: 'Assist', expected_assists: 'Assist previsti (xA)',
  xg_and_xa: 'xG + xA', accurate_passes: 'Passaggi riusciti', chances_created: 'Occasioni create', defensive_actions: 'Azioni difensive',
  touches: 'Tocchi', touches_opp_box: 'Tocchi in area avversaria', passes_into_final_third: "Passaggi nell'ultimo terzo",
  accurate_crosses: 'Cross riusciti', long_balls_accurate: 'Lanci lunghi riusciti', dispossessed: 'Palle perse', Offsides: 'Fuorigioco',
  'matchstats.headers.tackles': 'Contrasti', shot_blocks: 'Tiri bloccati', clearances: 'Respinte', headed_clearance: 'Respinte di testa',
  interceptions: 'Intercetti', recoveries: 'Palle recuperate', dribbled_past: 'Dribblato', ground_duels_won: 'Duelli a terra vinti',
  aerials_won: 'Duelli aerei vinti', fouls: 'Falli commessi', duel_won: 'Duelli vinti', duel_lost: 'Duelli persi',
  expected_goals: 'Gol attesi (xG)', expected_goals_on_target_variant: 'xG in porta (xGOT)', total_shots: 'Tiri totali',
  big_chance_created_team_title: 'Grandi occasioni create', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori',
  blocked_shots: 'Tiri murati', shot_accuracy: 'Precisione di tiro', dribbles_succeeded: 'Dribbling riusciti', corners: "Calci d'angolo",
  expected_goals_non_penalty: 'xG senza rigori', was_fouled: 'Falli subiti', big_chance_missed_title: 'Grandi occasioni mancate',
  errors_led_to_goal: 'Errori che portano a gol', saves: 'Parate', goals_conceded: 'Gol subiti', expected_goals_on_target_faced: 'xGOT subiti',
  goals_prevented: 'Gol evitati', keeper_diving_save: 'Parate in tuffo', saves_inside_box: 'Parate in area', keeper_sweeper: 'Uscite da libero',
  punches: 'Pugni', player_throws: 'Rimesse con le mani', keeper_high_claim: 'Uscite alte', clearance_off_the_line: 'Respinte sulla linea',
  conceded_penalties: 'Rigori concessi',
};
const GROUP = { top_stats: 'Statistiche top', attack: 'Attacco', defense: 'Difesa', duels: 'Duelli' };
const pct = (a, b) => (b ? ` (${Math.round((a / b) * 100)}%)` : '');
const fmt = (v, tot, type) => {
  if (v == null) return '—';
  if (type === 'fractionWithPercentage' || type === 'integerWithPercentage') return tot != null ? `${comma(v, 0)}/${comma(tot, 0)}${pct(v, tot)}` : comma(v, 0);
  if (type === 'percent') return `${comma(v, 0)}%`;
  return Number.isInteger(v) ? String(v) : comma(v, 2);
};
const shortName = (nm) => {
  const t = String(nm || '').trim().split(/\s+/);
  if (t.length < 2) return t[0] || '';
  if (/^[A-Za-zÀ-ÿ]\.$/.test(t[0])) return t.join(' ');
  return `${t[0][0].toUpperCase()}. ${t.slice(1).join(' ')}`;
};

// ── dati della scheda (stessa logica del sito)
function useCard(sheet) {
  return useMemo(() => {
    if (!sheet) return null;
    const match = matchOf(sheet.matchId);
    if (!match) return null;
    const f = findInMatch(match, sheet.name, sheet.fmId);
    const fmId = (f && f.fmId) || sheet.fmId || null;
    const raw = fmId && match.playerStats ? match.playerStats[fmId] : null;
    const groups = raw ? raw[3].map(([key, title, rows]) => ({ key, title: GROUP[key] || title, rows: rows.map(([k, lab, v, tot, type]) => ({ k, label: IT[k] || lab, v, tot, type, text: fmt(v, tot, type) })) })) : [];
    const flat = {};
    groups.forEach((g) => g.rows.forEach((r) => { if (!(r.k in flat)) flat[r.k] = r; }));
    const n = norm(sheet.name);
    const shots = (match.shots || []).filter((s) => norm(s.playerName) === n);
    const evs = (match.events || []).filter((e) => norm(e.name) === n || (e.type === 'sub' && norm(e.inName) === n) || (e.type === 'goal' && e.assist && norm(e.assist) === n));
    const rating = (flat.rating_title && flat.rating_title.v) || (f && f.entry.rating) || null;
    const photo = (f && f.entry.photo) || (fmId ? `https://images.fotmob.com/image_resources/playerimages/${fmId}.png` : null);
    const lu = f && match.lineup ? match.lineup[f.side] : null;
    const roster = lu ? [...(lu.xi || []), ...(lu.bench || [])].filter((p) => p && p.name) : [];
    const idx = roster.findIndex((p) => norm(p.name) === norm(sheet.name) || (fmId && String(p.fmId) === String(fmId)));
    // minuti dal cronometro della partita live (solo se la fonte non da' gia' i minuti)
    let liveMins = null;
    if (match.status === 'live' && !flat.minutes_played && idx >= 0) {
      const mn = (x) => String(x == null ? '' : x).split('+').reduce((t, q) => t + (parseInt(q, 10) || 0), 0);
      const now = match.liveHalf ? 45 : (Number(match.liveMinute) || 0);
      const nxi = lu && lu.xi ? lu.xi.length : 0;
      const inEv = (match.events || []).find((e) => e.type === 'sub' && norm(e.inName) === n);
      const outEv = (match.events || []).find((e) => e.type === 'sub' && norm(e.name) === n);
      const redEv = (match.events || []).find((e) => e.type === 'red' && norm(e.name) === n);
      let start = null;
      if (idx < nxi) start = 0; else if (inEv) start = mn(inEv.minute);
      if (start != null) {
        let end = now;
        if (outEv) end = Math.min(end, mn(outEv.minute));
        if (redEv) end = Math.min(end, mn(redEv.minute));
        liveMins = Math.max(0, end - start);
      }
    }
    return { liveMins, match, f, fmId, groups, flat, shots, evs, rating, photo, roster, idx, team: f && f.team, side: f && f.side, ourId: ourPlayerId(match, sheet.name, fmId), name: sheet.name };
  }, [sheet]);
}

const KPI_KEYS = ['minutes_played', 'goals', 'assists', 'expected_goals'];
const KPI_FALLBACK = { minutes_played: 'Minuti giocati', goals: 'Gol', assists: 'Assist', expected_goals: 'xG' };

const TABS = [
  ['Tiri', ['goals', 'total_shots', 'ShotsOnTarget', 'ShotsOffTarget', 'blocked_shots', 'shot_accuracy', 'expected_goals', 'expected_goals_on_target_variant', 'expected_goals_non_penalty', 'big_chance_missed_title', 'shots_woodwork']],
  ['Passaggi', ['assists', 'expected_assists', 'xg_and_xa', 'accurate_passes', 'passes_into_final_third', 'accurate_crosses', 'long_balls_accurate', 'line_breaking_passes', 'chances_created', 'big_chance_created_team_title', 'touches', 'touches_opp_box', 'corners']],
  ['Dribbling', ['dribbles_succeeded', 'was_fouled', 'dispossessed']],
  ['Difesa', ['Offsides', 'yellow', 'red', 'fouls', 'defensive_actions', 'matchstats.headers.tackles', 'shot_blocks', 'clearances', 'headed_clearance', 'interceptions', 'recoveries', 'dribbled_past', 'duel_won', 'duel_lost', 'ground_duels_won', 'aerials_won']],
];
const DEF = { goals: 'Gol', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri murati', shot_accuracy: 'Precisione di tiro', expected_goals: 'Gol attesi (xG)', expected_goals_on_target_variant: 'xG in porta (xGOT)', big_chance_missed_title: 'Grandi occasioni mancate', shots_woodwork: 'Pali e traverse', dribbles_succeeded: 'Dribbling riusciti', was_fouled: 'Falli subiti', dispossessed: 'Palle perse' };
const FULL = new Set(['Tiri', 'Dribbling']);
const SKIP = new Set(['rating_title', 'minutes_played']);
function tabRows(c) {
  const used = new Set();
  const y = c.evs.filter((e) => e.type === 'yellow' && norm(e.name) === norm(c.name)).length;
  const r = c.evs.filter((e) => e.type === 'red' && norm(e.name) === norm(c.name)).length;
  const virt = { yellow: { k: 'yellow', label: 'Gialli', text: String(y) }, red: { k: 'red', label: 'Rossi', text: String(r) } };
  const out = TABS.map(([title, keys]) => ({ title, rows: keys.map((k) => { used.add(k); return virt[k] || c.flat[k] || (FULL.has(title) && DEF[k] ? { k, label: DEF[k], text: k === 'shot_accuracy' ? '0%' : '0' } : null); }).filter(Boolean) }));
  const rest = [];
  c.groups.forEach((g) => g.rows.forEach((x) => { if (!used.has(x.k) && !SKIP.has(x.k)) { used.add(x.k); rest.push(x); } }));
  out[3].rows.push(...rest);
  return out;
}

function StatTabs({ C, c }) {
  const [i, setI] = useState(0);
  const tabs = tabRows(c).filter((t) => t.rows.length); // scheda senza righe = nascosta
  const cur = tabs[Math.min(i, tabs.length - 1)];
  if (!cur) return null;
  return (
    <View style={{ gap: 12 }}>
      <Segmented C={C} options={tabs.map((t, k) => ({ value: k, label: t.title }))} value={Math.min(i, tabs.length - 1)} onChange={setI} />
      <View style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: C.chip }}>
        {cur.rows.map((r, k) => (
          <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: k ? 1 : 0, borderTopColor: C.hair }}>
            <Text style={{ color: C.ink2, fontSize: 13.5 }}>{r.label}</Text>
            <Text style={{ color: C.ink, fontSize: 13.5, fontWeight: '700' }}>{r.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── mappa tiri del giocatore (concept A: porta, minuti, metà campo e dettagli)
const px = (v) => Math.max(66, Math.min(104.5, v));
const py = (v) => Math.max(12, Math.min(54, v));
const bodyOf = (b) => (b === 'Testa' ? 'Di testa' : b === 'Destro' ? 'Di destro' : b === 'Sinistro' ? 'Di sinistro' : '—');
const dist = (s) => (s.px != null ? Math.round(Math.hypot(105 - s.px, 34 - s.py)) : null);
const dotCol = (s) => (s.outcome === 'Gol' ? '#2FBF71' : s.onTarget ? '#4aa3ff' : s.outcome === 'Bloccato' ? '#9aa4b2' : '#e5a84a');

function Dot({ s, i, sel, cx, cy, r, color, onPress }) {
  return (
    <G x={cx} y={cy} onPress={onPress} opacity={sel == null || sel === i ? 1 : 0.35}>
      {sel === i ? <Circle r={r + 1.6} fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
      <Circle r={4.6} fill={HIT} />
      <DotShape c={color} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={r} />
    </G>
  );
}

function ShotExplorer({ C, shots, colors }) {
  const color = shotColor(colors);
  const list = useMemo(() => [...shots].filter((s) => s.px != null).sort((a, b) => (a.minute || 0) - (b.minute || 0)), [shots]);
  const [sel, setSel] = useState(null);
  const chipsRef = useRef(null);
  const pick = (i) => setSel((p) => (i === p ? null : i));
  const cur = sel != null ? list[sel] : null;
  const tc = seen(color); const onTc = lum(tc) > 0.6 ? '#111' : '#fff';
  useEffect(() => { if (chipsRef.current) chipsRef.current.scrollTo({ x: sel == null ? 0 : Math.max(0, (sel + 1) * 50 - 60), animated: true }); }, [sel]);
  if (!list.length) return null; // senza tiri il riquadro non si mostra
  const Wg = 11.5 * 0.9; const x0 = 14;
  const rows = cur ? [['xG', comma(cur.xg, 2)], ['xGOT', cur.onTarget || cur.outcome === 'Gol' ? comma(cur.xgot, 2) : '—'], ['Esito', outcomeOf(cur)], ['Situazione', situationOf(cur.situation)], ['Tipo di tiro', bodyOf(cur.body)], ['Zona gol', zoneOf(cur)], ['Distanza', dist(cur) != null ? `${dist(cur)} m` : '—'], ['Minuto', `${cur.minute}'`]] : [];
  return (
    <View style={{ gap: 12, borderRadius: 20, padding: 12, backgroundColor: C.chip }}>
      <View style={{ borderRadius: 14, paddingHorizontal: 8, paddingTop: 8, backgroundColor: 'rgba(8,16,28,.55)' }}>
        <Svg width="100%" viewBox="0 0 100 52" style={{ aspectRatio: 100 / 52, backgroundColor: GOALBG, borderRadius: 10 }}>
          <Line x1="2" x2="98" y1="44" y2="44" strokeWidth="0.5" stroke={GOALLINE} />
          <Rect x={x0} y={44 - 2.44 * Wg} width={7.32 * Wg} height={2.44 * Wg} strokeWidth="1.2" fill="rgba(255,255,255,.05)" stroke="#ffffff" />
          {list.map((s, i) => {
            if (s.gy == null || s.gz == null || isBlocked(s)) return null; // la porta non mostra i tiri murati
            const cx = Math.max(3, Math.min(97, x0 + (s.gy - 30.34) * Wg));
            return <Dot key={i} s={s} i={i} sel={sel} cx={cx} cy={44 - Math.max(0, Math.min(s.gz, 3.4)) * Wg} r={2.2} color={color} onPress={() => pick(i)} />;
          })}
        </Svg>
      </View>
      <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4, paddingVertical: 6, alignItems: 'center' }} style={{ flexGrow: 0 }}>
        <Pressable onPress={() => setSel(null)} style={{ width: 54, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: sel == null ? C.accent : C.thumb }}>
          <Text style={{ color: sel == null ? '#fff' : C.ink, fontSize: 12, fontWeight: '800' }}>Tutti</Text>
        </Pressable>
        {list.map((s, i) => {
          const full = s.outcome === 'Gol' || (s.onTarget && !isBlocked(s));
          const goal = s.outcome === 'Gol';
          return (
            <Pressable key={i} onPress={() => pick(i)} style={{ minWidth: 40, paddingHorizontal: String(s.minute).length > 2 ? 10 : 0, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: full ? tc : C.sheet, borderWidth: 2.5, borderColor: tc, opacity: sel == null || sel === i ? 1 : 0.55, transform: [{ scale: sel === i ? 1.1 : 1 }], ...(goal ? { shadowColor: '#f5c542', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 } : null) }}>
              <Text numberOfLines={1} style={{ color: full ? onTc : C.ink, fontSize: 12, fontWeight: '800' }}>{s.minute}'</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ flex: 0.9 }}>
          <Svg width="100%" viewBox="64 10 42 46" style={{ aspectRatio: 42 / 46, backgroundColor: PITCH, borderRadius: 12 }}>
            <Rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
            <Polyline points="105,13.84 88.5,13.84 88.5,54.16 105,54.16" fill="none" stroke={LINE} strokeWidth="0.5" />
            <Polyline points="105,24.84 99.5,24.84 99.5,43.16 105,43.16" fill="none" stroke={LINE} strokeWidth="0.5" />
            <Circle cx="94" cy="34" r="0.5" fill={LINE} />
            {cur && cur.px != null ? (isBlocked(cur) ? (cur.bx != null ? <Line x1={px(cur.px)} y1={py(cur.py)} x2={px(cur.bx)} y2={py(cur.by)} stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.3 1.1" /> : null) : <Line x1={px(cur.px)} y1={py(cur.py)} x2="105" y2="34" stroke={TRACE} strokeWidth="0.45" strokeDasharray="1.3 1.1" />) : null}
            {list.map((s, i) => <Dot key={i} s={s} i={i} sel={sel} cx={px(s.px)} cy={py(s.py)} r={2} color={color} onPress={() => pick(i)} />)}
          </Svg>
        </View>
        <View style={{ flex: 1.1 }}>
          {cur ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }}>
              {rows.map(([k, v]) => (
                <View key={k} style={{ width: '50%', paddingRight: 6 }}>
                  <Text style={{ color: C.ink3, fontSize: 10.5 }}>{k}</Text>
                  <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{v}</Text>
                </View>
              ))}
            </View>
          ) : <Text style={{ color: C.ink3, fontSize: 12, textAlign: 'center' }}>Scegli un minuto per vedere posizione e coordinate verso la porta</Text>}
        </View>
      </View>
    </View>
  );
}

// ── intestazione e corpo
function Face({ c, size = 78 }) {
  const cs = (c.team && c.team.colors) || ['#2a3a66', '#2a3a66'];
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
        <LinearGradient colors={[cs[0], cs[1] || cs[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        {c.photo ? <Image source={{ uri: c.photo }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" /> : <Ionicons name="person" size={size * 0.8} color="rgba(255,255,255,.55)" style={{ marginBottom: -size * 0.08 }} />}
      </View>
      {c.rating != null ? (
        <View style={{ position: 'absolute', right: -8, bottom: -4, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: scoreColorSmooth(c.rating), borderWidth: 2, borderColor: 'rgba(0,0,0,.25)' }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{comma(c.rating, 1)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Badges({ C, c, onOpen }) {
  const me = norm(c.name);
  const chip = (key, children) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.chip }}>{children}</View>;
  const tx = (t) => <Text style={{ color: C.ink, fontSize: 12, fontWeight: '700' }}>{t}</Text>;
  const items = [];
  const goals = c.evs.filter((e) => e.type === 'goal' && norm(e.name) === me);
  if (goals.length) items.push(chip('g', <><BallIcon size={15} />{tx(goals.map((g) => `${g.minute}'`).join(' '))}</>));
  const ass = c.evs.filter((e) => e.type === 'goal' && e.assist && norm(e.assist) === me);
  if (ass.length) items.push(chip('a', tx(`Assist ${ass.map((g) => `${g.minute}'`).join(' ')}`)));
  c.evs.filter((e) => (e.type === 'yellow' || e.type === 'red') && norm(e.name) === me).forEach((e, i) => items.push(chip(`c${i}`, <><CardIcon red={e.type === 'red'} size={15} />{tx(`${e.minute}'`)}</>)));
  const subs = c.evs.filter((e) => e.type === 'sub');
  const outs = subs.filter((e) => norm(e.inName) !== me);
  const ins = subs.filter((e) => norm(e.inName) === me);
  if (!items.length && !outs.length && !ins.length) return null;
  const rows = [...ins.map((e) => ({ e, who: e.name, label: 'Entra', d: -1 })), ...outs.map((e) => ({ e, who: e.inName, label: 'Esce', d: 1 }))];
  return (
    <View style={{ gap: 8 }}>
      {items.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{items}</View> : null}
      {rows.map(({ e, who, label, d }, i) => {
        const f = findInMatch(c.match, who, null);
        const fm = f && f.fmId;
        const photo = (f && f.entry && f.entry.photo) || (fm ? `https://images.fotmob.com/image_resources/playerimages/${fm}.png` : null);
        return (
          <Pressable key={`o${i}`} onPress={() => onOpen({ matchId: c.match.id, name: who, fmId: fm || undefined }, d)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 6, paddingLeft: 12, paddingRight: 8, backgroundColor: C.chip }, pressed && { opacity: 0.7 }]}>
            <SubIcon size={15} />
            <Text style={{ color: C.ink, fontSize: 12, fontWeight: '700' }}>{label} {e.minute}'</Text>
            <View style={{ width: 1, height: 16, backgroundColor: C.hair }} />
            <View style={{ width: 26, height: 26, borderRadius: 13, overflow: 'hidden', backgroundColor: C.hair }}>{photo ? <Image source={{ uri: photo }} style={{ width: 26, height: 26 }} contentFit="cover" cachePolicy="memory-disk" /> : null}</View>
            <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 12, fontWeight: '700' }}>{shortName(who)}</Text>
            <Ionicons name="chevron-forward" size={15} color={C.ink3} />
          </Pressable>
        );
      })}
    </View>
  );
}

function Body({ C, c, onOpen }) {
  const noStats = !c.groups.length;
  const kpi = KPI_KEYS.map((k) => ({ k, label: (c.flat[k] && c.flat[k].label) || KPI_FALLBACK[k], text: c.flat[k] ? c.flat[k].text : (k === 'minutes_played' && c.liveMins != null ? String(c.liveMins) : '—') }));
  return (
    <View style={{ gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
      <Badges C={C} c={c} onOpen={onOpen} />
      {!noStats ? (
        <View style={{ flexDirection: 'row' }}>
          {kpi.map((r) => (
            <View key={r.k} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: C.ink, fontSize: 22, fontWeight: '300' }}>{r.text.replace(/ \(\d+%\)/, '')}</Text>
              <Text style={{ color: C.ink3, fontSize: 10.5, marginTop: 6, textAlign: 'center' }}>{r.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <ShotExplorer key={c.name} C={C} shots={c.shots} colors={c.team ? c.team.colors : null} />
      {!noStats ? <StatTabs key={`${c.name}t`} C={C} c={c} /> : null}
    </View>
  );
}

const DUR = 360;
const EASE = Easing.bezier(0.22, 0.8, 0.24, 1);

export default function PlayerSheetHost({ C, bottom = 0, openRoute }) {
  const sheet = usePlayerSheet();
  const cNow = useCard(sheet);
  const lastC = useRef(null);
  if (cNow) lastC.current = cNow;
  const c = cNow || lastC.current; // durante la chiusura la scheda resta disegnata finche' la tendina non e' scesa
  const { height: H } = useWindowDimensions();
  const SH = Math.round(H * 0.92);
  const HALF = Math.round(SH - H * 0.72); // distanza dalla posizione aperta al 72%
  const y = useRef(new Animated.Value(SH)).current; // 0 = alto, HALF = 55%, SH = chiusa
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const base = useRef(HALF);
  const [mounted, setMounted] = useState(false);
  const live = useRef({});
  const busy = useRef(false);

  const open = !!(sheet && c);
  live.current = { c, sheet, open };
  const [full, setFull] = useState(false); // altezza piena: niente spazio in piu' sotto la lista
  const snap = (to, then) => { base.current = to; setFull(to === 0); y.stopAnimation(); Animated.timing(y, { toValue: to, duration: DUR, easing: EASE, useNativeDriver: true }).start(({ finished }) => { if (finished && then) then(); }); };
  // apertura e chiusura: se si riapre mentre sta ancora chiudendo (altra tendina subito dopo) si risale senza smontare; la fine della chiusura smonta solo se nel frattempo non si e' riaperta
  useEffect(() => {
    if (open) {
      if (!mounted) { y.setValue(SH); setMounted(true); } else snap(0);
      return undefined;
    }
    if (mounted) snap(SH, () => { if (!live.current.open) { setMounted(false); lastC.current = null; } });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => { if (mounted && live.current.open) snap(0); }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // passaggio a un compagno / al sostituto: dissolvenza con piccolo scorrimento
  const switchTo = (to, d) => {
    if (busy.current) return false;
    busy.current = true;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -d * 40, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      const sh = live.current.sheet;
      openPlayer({ matchId: sh.matchId, name: to.name, fmId: to.fmId });
      slide.setValue(d * 40);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 170, easing: EASE, useNativeDriver: true }),
      ]).start(() => { busy.current = false; });
    });
    return true;
  };
  const go = (d) => {
    const cc = live.current.c;
    if (!cc || cc.idx < 0) return false;
    const to = cc.roster[cc.idx + d];
    return to ? switchTo({ name: to.name, fmId: to.fmId }, d) : false;
  };

  // intestazione: trascinare cambia altezza o chiude
  const head = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => y.setValue(Math.max(0, Math.min(SH, base.current + g.dy))),
    onPanResponderRelease: (_, g) => {
      const v = base.current + g.dy;
      if (g.vy > 0.9 && v > HALF * 0.6) { closePlayer(); return; }
      if (g.vy < -0.9) { snap(0); return; }
      const opts = [0, HALF, SH];
      const near = opts.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
      if (near === SH) closePlayer(); else snap(near);
    },
    onPanResponderTerminate: () => snap(base.current),
  })).current;
  // corpo: swipe laterale tra compagni
  const side = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) > 70 || Math.abs(g.vx) > 0.5) go(g.dx < 0 ? 1 : -1); },
  })).current;

  if (!mounted || !c) return null;
  const veil = y.interpolate({ inputRange: [0, HALF, SH], outputRange: [0.55, 0.4, 0], extrapolate: 'clamp' });
  const foot = y.interpolate({ inputRange: [0, HALF, SH], outputRange: [0, -HALF, 0], extrapolate: 'clamp' }); // la barra X/Profilo resta sul fondo dello schermo anche con la tendina a meta' (il fondo della tendina e' fuori schermo)
  const t = c.team;
  const toProfile = c.ourId ? () => { closePlayer(); openRoute(`/giocatore/${c.ourId}`); } : null;
  const pos = c.idx >= 0 && c.roster.length ? `${c.idx + 1}/${c.roster.length}` : null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 30 }}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000', opacity: veil }}>
        <Pressable style={{ flex: 1 }} onPress={() => closePlayer()} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: SH, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: C.sheet, borderWidth: 1, borderColor: C.border, transform: [{ translateY: y }] }}>
        <LinearGradient pointerEvents="none" colors={[`${t ? t.colors[0] : '#2a3a66'}88`, 'rgba(0,0,0,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 230 }} />
        <View {...head.panHandlers} style={{ paddingTop: 8, paddingBottom: 10 }}>
          <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: C.hair, marginBottom: 10 }} />
          <Animated.View style={{ alignItems: 'center', paddingHorizontal: 20, opacity: fade, transform: [{ translateX: slide }] }}>
            <Pressable onPress={toProfile || undefined}><Face c={c} size={78} /></Pressable>
            <Text onPress={toProfile || undefined} style={{ color: C.ink, fontSize: 19, fontWeight: '800', marginTop: 12 }}>{c.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {t ? <TeamCrest team={t} size={16} C={C} /> : null}
              <Text style={{ color: C.ink3, fontSize: 12.5 }}>{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}{pos ? ` · ${pos}` : ''}</Text>
            </View>
          </Animated.View>
        </View>
        <Animated.View {...side.panHandlers} style={{ flex: 1, opacity: fade, transform: [{ translateX: slide }] }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 + bottom + (full ? 0 : HALF) }}>
            <Body C={C} c={c} onOpen={switchTo} />
          </ScrollView>
        </Animated.View>
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(14, bottom), transform: [{ translateY: foot }] }}>
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', C.sheet]} locations={[0, 0.3]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Pressable onPress={() => closePlayer()} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip, borderWidth: 1, borderColor: C.border }}><Ionicons name="close" size={20} color={C.ink} /></Pressable>
          <View style={{ flex: 1 }} />
          {toProfile ? <Pressable onPress={toProfile} style={{ borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.accent }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Profilo</Text></Pressable> : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
