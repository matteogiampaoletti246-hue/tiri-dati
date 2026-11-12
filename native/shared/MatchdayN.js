// Elenchi per giornata del Campionato (nativo): riquadri col colore del campionato, una giornata per riquadro, con "Giornate precedenti".
// Stessi calcoli del sito: MatchdayList (campionato attuale) e MatchesPanel di ArchiveLeague (stagioni d'archivio, data/rounds.js).
import { roundIt } from '@/data/roundNames';
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RingBox } from './ui';
import { MatchRowN, ArchRowN } from './MatchRowsN';
import { fmtDate, dayKey } from './fmt';
import { roundBlocks, blockTag, currentBlock } from '@/data/rounds';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';

const SHORT_FMT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
const shortDate = (iso) => { const d = new Date(`${iso}T12:00:00`); return Number.isNaN(d.getTime()) ? '' : SHORT_FMT.format(d); };
const dayHead = (iso) => {
  const idx = DATES.findIndex((d) => isoDate(d) === iso);
  return idx >= 0 ? dayLabel(DATES[idx], TODAY_INDEX, idx) : longDate(new Date(`${iso}T12:00:00`));
};
// numero di giornata: n-esima partita di campionato della squadra (la piu' alta tra le due)
const giornateOf = (all) => {
  const cnt = {};
  const out = {};
  [...all].sort((a, b) => a.ts - b.ts).forEach((m) => {
    cnt[m.homeId] = (cnt[m.homeId] || 0) + 1;
    cnt[m.awayId] = (cnt[m.awayId] || 0) + 1;
    out[m.id] = Math.max(cnt[m.homeId], cnt[m.awayId]);
  });
  return out;
};
const okHex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#38A2FF');
const roundTitle = (r) => roundIt(r);

export const MATCH_FILTERS = [{ value: 'all', label: 'Tutte' }, { value: 'live', label: 'Live' }, { value: 'results', label: 'Risultati' }, { value: 'upcoming', label: 'Programmate' }];
export const APP_PASS = { all: () => true, live: (m) => m.status === 'live', results: (m) => m.status === 'finished', upcoming: (m) => m.status === 'scheduled' };
export const ARCH_PASS = { all: () => true, live: (m) => m[7] && !m[6] && !m[8], results: (m) => !!m[6], upcoming: (m) => !m[6] && !m[7] && !m[8] };

function PrevBtn({ C, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ alignSelf: 'center', marginTop: 16 }, pressed && { opacity: 0.7 }]}>
      <RingBox C={C} style={{ height: 38 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 }}>
          <Ionicons name="chevron-up" size={15} color={C.ink} />
          <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '800' }}>{label}</Text>
        </View>
      </RingBox>
    </Pressable>
  );
}

function Block({ C, tint, title, tag, range, children }) {
  const t = okHex(tint);
  const done = tag === 'Conclusa';
  return (
    <View style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: `${t}55`, paddingBottom: 4 }}>
      <LinearGradient pointerEvents="none" colors={[`${t}45`, `${t}08`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      {/* titoli lunghi ("Apertura · Semifinali"): le date scendono intere sulla riga sotto, mai titolo o date spezzati a meta' */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <Text numberOfLines={1} style={{ color: C.ink, fontSize: 15, fontWeight: '800', flexShrink: 1 }}>{title}</Text>
        <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: done ? C.hair : C.accTint }}>
          <Text style={{ color: done ? C.ink3 : C.accent, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>{tag}</Text>
        </View>
        <Text numberOfLines={1} style={{ marginLeft: 'auto', color: C.ink3, fontSize: 10.5 }}>{range}</Text>
      </View>
      {children}
    </View>
  );
}

const DayHead = ({ C, children, first }) => <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2, borderTopWidth: 1, borderTopColor: C.hair }}>{children}</Text>;

// campionato attuale: partite dell'app
export function MatchdayListN({ C, matches, all, tint, openRoute, anchor }) {
  const [extra, setExtra] = useState(0);
  const gmap = useMemo(() => giornateOf(all), [all]);
  const first = [...all].sort((a, b) => a.ts - b.ts).find((m) => m.status !== 'finished');
  const nums = [...new Set(all.map((m) => gmap[m.id]))].sort((a, b) => a - b);
  const cur = first ? gmap[first.id] : nums[nums.length - 1];
  const from = cur - extra;
  const byG = {};
  matches.forEach((m) => { (byG[gmap[m.id]] = byG[gmap[m.id]] || []).push(m); });
  const shownG = Object.keys(byG).map(Number).filter((g) => g >= from).sort((a, b) => a - b);
  const prev = Object.keys(byG).map(Number).filter((g) => g < from).sort((a, b) => b - a)[0];
  const daysOf = (list) => {
    const out = [];
    [...list].sort((a, b) => a.ts - b.ts).forEach((m) => { const l = out[out.length - 1]; if (l && l.date === m.date) l.matches.push(m); else out.push({ date: m.date, matches: [m] }); });
    return out;
  };
  return (
    <View>
      {prev ? <PrevBtn C={C} label="Giornate precedenti" onPress={() => { if (anchor) anchor.on = true; setExtra(cur - prev); }} /> : null}
      {shownG.map((g) => {
        const list = byG[g];
        const days = daysOf(list);
        const done = list.filter((m) => m.status === 'finished').length;
        const live = list.some((m) => m.status === 'live');
        const tag = g === cur ? (live || done ? 'In corso' : 'Prossima') : g < cur ? 'Conclusa' : 'Prossima';
        const range = days.length > 1 ? `${shortDate(days[0].date)} – ${shortDate(days[days.length - 1].date)}` : shortDate(days[0].date);
        return (
          <Block key={g} C={C} tint={tint} title={`Giornata ${g}`} tag={tag} range={range}>
            {days.map((d) => (
              <View key={d.date}>
                <DayHead C={C}>{dayHead(d.date)}</DayHead>
                {d.matches.map((m) => <MatchRowN key={m.id} C={C} match={m} openRoute={openRoute} />)}
              </View>
            ))}
          </Block>
        );
      })}
      <View style={{ height: 16 }} />
    </View>
  );
}

// stagione d'archivio: giornate dalle date (recuperi nella loro data), "in corso" / "prossima" dal calendario
export function ArchRoundsN({ C, season, fm, sk, filter, tint, openRoute, anchor }) {
  const [extra, setExtra] = useState(0);
  const fix = season ? season.fix : [];
  const blocks = useMemo(() => roundBlocks(fix), [fix]);
  if (!season || !fix.length) return null;
  const pass = ARCH_PASS[filter];
  const vis0 = blocks.map((b) => ({ ...b, shown: b.list.filter(pass) }));
  const curI = currentBlock(blocks);
  const from = Math.max(0, curI - extra);
  const vis = vis0.slice(from).filter((b) => b.shown.length);
  const hiddenPrev = vis0.slice(0, from).filter((b) => b.shown.length);
  const prev = hiddenPrev[hiddenPrev.length - 1];
  const prevI = prev ? vis0.indexOf(prev) : null;
  const names = season.teams || {};
  return (
    <View>
      {prev ? <PrevBtn C={C} label={prev.rec || /^\d+$/.test(String(prev.r)) ? 'Giornate precedenti' : 'Turni precedenti'} onPress={() => { if (anchor) anchor.on = true; setExtra(curI - prevI); }} /> : null}
      {vis.map((b) => {
        const list = [...b.shown].sort((x, y) => String(x[4]).localeCompare(String(y[4])));
        const tag = blockTag(b.list);
        const days = [];
        list.forEach((m) => { const k = dayKey(m[4]); const l = days[days.length - 1]; if (l && l.k === k) l.m.push(m); else days.push({ k, m: [m] }); });
        const range = days.length > 1 ? `${fmtDate(days[0].m[0][4])} – ${fmtDate(days[days.length - 1].m[0][4])}` : fmtDate(days[0].m[0][4]);
        return (
          <Block key={b.key} C={C} tint={tint} title={b.rec ? 'Recuperi' : roundTitle(b.r)} tag={tag} range={range}>
            {days.map((d) => (
              <View key={d.k}>
                <DayHead C={C}>{fmtDate(d.m[0][4])}{b.rec ? ` · ${[...new Set(d.m.map((m) => roundTitle(m[1])))].join(', ')}` : ''}</DayHead>
                {d.m.map((m) => <ArchRowN key={m[0]} C={C} m={m} names={names} fm={fm} sk={sk} openRoute={openRoute} />)}
              </View>
            ))}
          </Block>
        );
      })}
      <View style={{ height: 16 }} />
    </View>
  );
}
