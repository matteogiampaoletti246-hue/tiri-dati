// Calcolatore: scheda Affidabilità giocatore (nativa). Stessa logica di components/calc/PlayerTab.jsx del sito, con i dati e i calcoli condivisi.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import { CALC_IN } from '../shared/calcIn';
import { PLAYERS, playerById } from '@/data/players';
import { teamById, teamByName } from '@/data/teams';
import { useUpcoming } from '../shared/useUpcoming';
import { allTeamMatches, nextMatchOf, nextMatchVs } from '@/data/extras';
import { romeDay } from '@/data/util';
import { NATIONS_KEYS, calcTeamsOf, calcLeagues, leagueName, cupOf, domesticKey, nextFixture, fixtureAt, prefillShots, splitBoxes, teamShots } from '@/data/calcData';
import { emptyFouls, fillFrom, hitFromValues, hitRows, initialForm, isFouls, natHitOf, resultFromForm, resultFromFouls, viewFor } from '@/data/calcPlayer';
import { fmTeamIn, foulKeysFor, foulSeasonOf, leaguePlayerAvg, playerFoulsOf, rosterFouls, teamFoulStats, useFouls } from '@/data/calcFouls';
import { FALLI_KEYS, loadFalli, cardRole, autoDuelIds, falliKeysFor, playerRoles, roleBreakdown, useFalli } from '@/data/calcRoles';
import { resolvePid } from '@/data/playerPid';
import { careerByFm, carriereOf, loadCarriere, countryIt, flagCode } from '@/data/carriere';
import { FlagN } from '../shared/FlagN';
import { FLAG_COLORS } from '../shared/flagColors';
const FLAG_BASE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/native-link/flags43/';
import { loadRose, rosePlayer } from '@/data/rose';
import { playerFace, archIndex, loadSeason } from '@/data/archive';
import { playerComps, calcComp } from '@/components/calc/calcComp';
import { comma } from '@/lib/format';
import { parseDash, parseNum, fmtLine, HIT_OPTIONS, LINE_OPTIONS, SEDE_OPTIONS, COMPETITION_OPTIONS, NATIONS_OPTION, NATIONS_WEIGHTS, SEASON_COMPETITIONS, lineHintText } from '@/lib/calc';
import { MATCHES } from '@/data/matches';
import { RAW } from '@/data/load';
import { leagueById } from '@/data/leagues';
import { teamRow } from '@/data/standings';
import { BAND_COLORS, bandOf } from '@/components/player/playerCalc';
import { mixHex, SedeButtonsN, Panel, PanelTitle, Segmented, FieldRow, NumInput, PickerModal, TeamCrest, Face, TintProvider, CompLogo } from '../shared/ui';
import Dropdown from '../shared/Dropdown';
import FullPicker from '../shared/FullPicker';
import HitChart from '../shared/HitChart';
import PlayerSearch from '../shared/PlayerSearch';
import StatIconN from '../shared/StatIconN';
import ResultCard from '../shared/ResultCard';

const STATS = [{ value: 'tiri', label: 'Tiri', ic: 'shots' }, { value: 'porta', label: 'Tiri in Porta', ic: 'sot' }, { value: 'fc', label: 'Falli Commessi', ic: 'fc' }, { value: 'fs', label: 'Falli Subiti', ic: 'fs' }];
const STAT_NAME = { tiri: 'tiri', porta: 'tiri in porta', fc: 'falli commessi', fs: 'falli subiti' };
const LINES = ['0,5', '1,5', '2,5', '3,5'];
const initial = () => ({ ...initialForm(), dashTarget: 'shots' });
const whenOf = (ts) => {
  try {
    const d = new Date(ts);
    const w = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).replace(/\./g, '');
    const t = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    return `${w.charAt(0).toUpperCase()}${w.slice(1)} · ${t}`;
  } catch (e) { return ''; }
};
const Gap = () => <View style={{ height: 28 }} />;

// prossima partita di una squadra: se quella di oggi e' gia' finita vale la successiva
function upcoming(teamName) {
  const fx = nextFixture(teamName);
  const t = teamByName(teamName);
  if (!fx || !t || romeDay(fx.ts) !== romeDay(Date.now())) return fx;
  const done = allTeamMatches(t.id).some((m) => m.status === 'finished' && romeDay(m.ts) === romeDay(fx.ts));
  return done ? nextFixture(teamName, true) || fx : fx;
}

const RoleBadge = ({ C, role }) => (role ? (
  <View style={{ position: 'absolute', right: -8, bottom: -4, minWidth: 30, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold, borderWidth: 1.5, borderColor: C.hair }}>
    <Text style={{ color: '#2e2100', fontSize: 11, fontWeight: '700' }}>{role}</Text>
  </View>
) : null);

// pillole delle ultime 5 partite: si aggiunge un numero alla volta
function ChipList({ C, value, onChange, max = 5 }) {
  const list = String(value || '').split('-').filter((x) => x !== '');
  const [cur, setCur] = useState('');
  const full = list.length >= max;
  const commit = (arr) => onChange(arr.join('-'));
  const add = () => { const v = cur.replace(/[^0-9]/g, ''); if (!v || full) return; commit([...list, String(Number(v))]); setCur(''); };
  return (
    <View style={{ alignItems: 'flex-end', gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 }}>
        {list.map((n, i) => (
          <Pressable key={i} onPress={() => commit(list.filter((_, k) => k !== i))} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 9, borderRadius: 14, backgroundColor: C.accTint, borderWidth: 1, borderColor: C.accRing }}>
            <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{n}</Text>
            <Ionicons name="close" size={11} color={C.ink3} />
          </Pressable>
        ))}
        {!list.length ? <Text style={{ color: C.ink3, fontSize: 14, paddingVertical: 4 }}>—</Text> : null}
      </View>
      {!full ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput value={cur} onChangeText={(t) => setCur(t.replace(/[^0-9]/g, '').slice(0, 3))} onSubmitEditing={add} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.ink3} style={{ width: 56, color: C.ink, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 7, textAlign: 'center', fontSize: 16, fontWeight: '700' }} />
          <Pressable onPress={add} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.accent }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Aggiungi</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

// tendina a scelta (valore linea, hit rate, competizione): si apre sotto la pillola
function Select({ C, value, options, onChange, placeholder }) {
  const rich = options.some((o) => o.comp);
  const logo = (o, size) => (o.comp && o.comp.logo ? <CompLogo uri={o.comp.logo} size={size} C={C} /> : <Text style={{ color: o.color || C.ink2, fontSize: 11, fontWeight: '700' }}>{String(o.label).slice(0, 2).toUpperCase()}</Text>);
  const opts = rich ? options.map((o) => ({ ...o, logoNode: logo(o, 28) })) : options;
  return <Dropdown C={C} fill options={opts} value={value} onChange={onChange} placeholder={placeholder || '—'} pillKey="label"
    icon={options.some((o) => o.ic) ? (o, col) => (o.ic ? <StatIconN k={o.ic} size={20} color={col} /> : null) : rich ? (o) => <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.92)' }}>{logo(o, 20)}</View> : undefined} />;
}

function NextMatchBtn({ C, ownId, oppId, comp, col, openRoute, style, altId }) {
  useUpcoming(!!ownId); // le partite delle nazionali (Nations League…) arrivano dai file dei giorni: senza, la prossima partita risultava quella del club
  const nm = useMemo(() => {
    if (!ownId) return null;
    // senza partite nella competizione scelta (es. Nations League) vale la prossima del club: ogni giocatore ha la sua
    const own = (id, c) => { const first = nextMatchOf(id, c); const vs0 = oppId ? nextMatchVs(id, oppId) : null; const vs = vs0 && (!c || vs0.leagueId === c) ? vs0 : null; const m = vs && (!first || Math.abs(vs.ts - first.ts) < 3 * 864e5) ? vs : first; return m ? { m, id } : null; };
    return own(ownId, comp) || (altId ? own(altId) : null);
  }, [ownId, oppId, comp, altId, MATCHES.length]);
  if (!nm) return null;
  const mine = nm.id;
  const mm = nm.m;
  const me = teamById(mine);
  const opp = teamById(mm.homeId === mine || (teamById(mm.homeId) || {}).name === (me || {}).name ? mm.awayId : mm.homeId);
  return (
    <Pressable onPress={() => openRoute && openRoute(`/match/${mm.id}`)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: col + '22', borderWidth: 1.5, borderColor: col + 'B3' }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 1 }}>PROSSIMA PARTITA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Text style={{ color: C.ink3, fontSize: 13.5, fontWeight: '600' }}>vs</Text>
          {opp ? <TeamCrest team={opp} size={18} C={C} /> : null}
          <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14.5, fontWeight: '700', flexShrink: 1 }}>{opp ? opp.name : ''}</Text>
        </View>
      </View>
      {mm.ts ? <Text style={{ color: C.ink2, fontSize: 12.5 }}>{whenOf(mm.ts)}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={C.ink2} />
    </Pressable>
  );
}

// colore del giocatore secondo la competizione scelta: con una competizione di nazionali il colore della nazionale (bandiera), altrimenti quello del club
function natColorOf(player) {
  if (!player) return null;
  const natName = player.natView ? player.natView.teamName : player.nat ? player.teamName : null;
  if (!natName) return null;
  // colore della maglia della nazionale (Belgio rosso, Turchia rosso...); la bandiera solo se manca o e' troppo scuro/chiaro
  const lum = (h) => { const m = /^#?([0-9a-f]{6})/i.exec(String(h || '')); if (!m) return null; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const ok = (h) => { const l = lum(h); return l !== null && l > 0.18 && l < 0.88; };
  const nt = teamByName(natName);
  const tc = nt && nt.colors ? nt.colors.find(ok) : null;
  if (tc) return tc;
  const fc = flagCode(natName);
  const fcol = fc && FLAG_COLORS[fc] ? FLAG_COLORS[fc].find(ok) : null;
  return fcol || null;
}
const playerColor = (player, competizione, clubCol) => (competizione === 'nations' || (player && player.nat && !player.club) ? natColorOf(player) || clubCol : clubCol);

// scelta giocatore: mentre la finestra di ricerca si chiude (circa 400 ms) si scaldano ruolo, carriera/rosa, dati falli e immagini
// (foto, stemma, bandiera, loghi competizioni), cosi' il banner appare gia' completo e il telefono (anche lento o caldo) non lo disegna a pezzi
function warmPlayer(id) {
  try {
    const p = playerById(id);
    if (!p) return;
    const club = p.nat && p.club ? p.club : p;
    const t = teamById(club.teamId);
    resolvePid(p).catch(() => {});
    loadCarriere().catch(() => {});
    loadRose().catch(() => {});
    falliKeysFor(!!p.nat && !p.club).forEach((k) => { try { Promise.resolve(loadFalli(k)).catch(() => {}); } catch (e) { /* ignora */ } });
    const nn = p.natView ? p.natView.teamName : p.nat ? p.teamName : null;
    const fc = nn ? flagCode(nn) : null;
    const urls = [p.photo, club.photo, t && t.crest, fc ? `${FLAG_BASE}${fc}.png` : null];
    playerComps(p).forEach((o) => { if (o.comp && o.comp.logo) urls.push(o.comp.logo); });
    const u = urls.filter((x) => typeof x === 'string' && x);
    if (u.length) Image.prefetch(u, 'memory-disk');
  } catch (e) { /* il banner si completa comunque */ }
}

function PlayerPick({ C, form, set, player, onSelectPlayer, stat, onStat, role, natHit, openRoute, hitN, hitChart }) {
  const [picker, setPicker] = useState(false);
  const club = player ? (player.nat && player.club ? player.club : player) : null;
  const team = club ? teamById(club.teamId) : null;
  const col = playerColor(player, form.competizione, team && team.colors ? team.colors[0] : C.accent);
  const comps = useMemo(() => playerComps(player), [player]);
  const natName = player ? (player.natView ? player.natView.teamName : player.nat ? player.teamName : null) : null;
  const natFc = natName ? flagCode(natName) : null;
  const hitTitle = form.playerId && hitN > 0 && hitN < 5 ? `Hit rate su ${hitN} ${hitN === 1 ? 'partita' : 'partite'}` : 'Hit rate ultime 5';
  const ownId = form.team && form.team.id ? form.team.id : club && club.teamId;
  const comp = form.competizione === 'coppa' ? cupOf(teamById(ownId)) || 'nessuna' : (form.team && form.team.leagueId) || undefined;
  return (
    <View>
      <PanelTitle C={C}>Giocatore</PanelTitle>
      <Panel ring C={C} tint={col}>
        {player ? (
          <View style={{ backgroundColor: C.sheet }}>
            <LinearGradient pointerEvents="none" colors={[col + 'CC', col + '40', col + '14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => openRoute && openRoute(`/giocatore/${club.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 56, height: 56 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: col, overflow: 'hidden' }}><Face uri={player.photo} color={col} size={51} /></View>
                  <RoleBadge C={C} role={role} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: C.ink, fontSize: 18, fontWeight: '700' }}>{player.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    {team ? <TeamCrest team={team} size={16} C={C} /> : null}
                    <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>{club.teamName}</Text>
                    {natName ? <View style={{ width: StyleSheet.hairlineWidth * 2, height: 16, backgroundColor: C.ink3 }} /> : null}
                    {natName && natFc ? <Image source={{ uri: `${FLAG_BASE}${natFc}.png` }} style={{ width: 20, height: 15, borderRadius: 3 }} contentFit="cover" cachePolicy="memory-disk" /> : null}
                    {natName ? <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>{countryIt(natName)}</Text> : null}
                  </View>
                </View>
              </Pressable>
              <Pressable onPress={() => setPicker(true)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.accent }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>Cambia</Text></Pressable>
            </View>
            <NextMatchBtn C={C} ownId={ownId} altId={club && club.teamId} oppId={form.opp && form.opp.id} comp={comp} col={col} openRoute={openRoute} style={{ marginHorizontal: 14, marginBottom: 14 }} />
          </View>
        ) : (
          <Pressable onPress={() => setPicker(true)} style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>Cerca e seleziona</Text>
            <Ionicons name="search" size={18} color={C.ink3} />
          </Pressable>
        )}
        <FieldRow C={C} label="Statistiche"><Select C={C} title="Statistiche" value={stat} options={STATS} onChange={onStat} /></FieldRow>
        <FieldRow C={C} label="Tipo linea"><Segmented hug="end" C={C} options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} /></FieldRow>
        <FieldRow C={C} label="Valore linea"><Select C={C} title="Valore linea" value={form.line} options={LINES.map((x) => ({ value: x, label: x }))} onChange={(v) => set('line', v)} /></FieldRow>
        <FieldRow C={C} label="Quota"><NumInput ring C={C} value={form.odds} onChange={(v) => set('odds', v)} /></FieldRow>
        <SedeButtonsN C={C} value={form.sede} onChange={(v) => set('sede', v)} />
        {comps.length ? <FieldRow C={C} label="Competizione"><Select C={C} title="Competizione" value={form.competizione} options={comps.map((o) => ({ value: o.value, label: o.comp.name, sub: o.sub, comp: o.comp, color: hexOr(o.comp.colors && o.comp.colors[0], '#1F2A44'), color2: hexOr(o.comp.colors && o.comp.colors[1], undefined) }))} onChange={(v) => set('competizione', v)} /></FieldRow> : null}
        {form.playerId && hitChart ? null : <FieldRow C={C} label={hitTitle}><Select C={C} title={hitTitle} value={form.hitRate} placeholder="Nessuna" options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]} onChange={(v) => set('hitRate', v)} /></FieldRow>}
      </Panel>
      <PlayerSearch C={C} open={picker} onClose={() => setPicker(false)} onSelect={onSelectPlayer} onWarm={warmPlayer} />
    </View>
  );
}


// ultime partite del giocatore con avversario e id partita. Le righe dell'Hit Rate portano giorno e competizione (`r[5]` AAAAMMGG, `r[6]`):
// con quelli l'abbinamento e' esatto; senza (dati vecchi) si abbina per tiri e minuti nello stesso ordine.
const hitProf = (player) => (player && player.nat && player.club ? player.club : player);
function gamesFor(player, key, vals, mins) {
  const prof = hitProf(player);
  const rec = (prof && prof.recent) || [];
  const rows = hitRows(prof);
  const dated = rows.length && rows.every((r) => r[5]);
  const out = [];
  let j = 0;
  vals.forEach((v, i) => {
    let hit = null;
    if (dated) {
      const ymd = String(rows[i] && rows[i][5]);
      hit = rec.find((m) => String(m.date || '').replace(/-/g, '').slice(0, 8) === ymd) || null;
    } else {
      for (let k = j; k < rec.length; k += 1) {
        const m = rec[k];
        if (Number(m[key]) === v && (mins[i] == null || Number(m.minutes) === mins[i])) { hit = m; j = k + 1; break; }
      }
    }
    out.push(hit && hit.opp ? gameOf(hit) : null);
  });
  return out;
}

// avversari che l'indice dell'app non ha (partite piu' vecchie / altre competizioni): dall'archivio delle competizioni (calendario del giorno)
function useHitGames(player, key2, vals, mins) {
  const prof = hitProf(player);
  const sig = `${prof && prof.id}|${key2}|${vals.join(',')}|${mins.join(',')}`;
  const base = useMemo(() => (key2 ? gamesFor(player, key2, vals, mins) : null), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ext, setExt] = useState({});
  useEffect(() => {
    setExt({});
    if (!key2 || !base) return undefined;
    const rows = hitRows(prof);
    const mine = teamById(prof && prof.teamId);
    const isMine = (name) => { const t = teamByName(name); return !!(t && mine && t.id === mine.id) || (!!mine && String(name).toLowerCase() === String(mine.name).toLowerCase()); };
    let on = true;
    (async () => {
      const idx = await archIndex();
      for (let i = 0; i < base.length; i += 1) {
        const r = rows[i];
        if (base[i] || !r || !r[5] || !r[6]) continue; // eslint-disable-line no-continue
        const ymd = String(r[5]);
        const y = +ymd.slice(0, 4); const mo = +ymd.slice(4, 6);
        const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
        const day = (d) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
        const days = [iso, day(-1), day(1)];
        const ent = idx && idx[String(r[6])];
        if (!ent || !ent.s) continue; // eslint-disable-line no-continue
        const st = mo >= 7 ? y : y - 1;
        const sks = [`${st}-${st + 1}`, `${y}`, `${y - 1}-${y}`].filter((x) => ent.s.includes(x));
        let found = null;
        for (const sk of sks) {
          const se = await loadSeason(r[6], sk); // eslint-disable-line no-await-in-loop
          if (!se || !se.fix) continue; // eslint-disable-line no-continue
          for (const d of days) {
            const f = se.fix.find((x) => String(x[4]).slice(0, 10) === d && (isMine(se.teams[x[2]]) || isMine(se.teams[x[3]])));
            if (f) { const oppName = isMine(se.teams[f[2]]) ? se.teams[f[3]] : se.teams[f[2]]; found = { opp: oppName, id: `a-${r[6]}-${sk}-${f[0]}` }; break; }
          }
          if (found) break;
        }
        if (found && on) setExt((e) => ({ ...e, [i]: gameOf({ opp: found.opp, matchId: found.id }) }));
      }
    })().catch(() => {});
    return () => { on = false; };
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(() => (base ? base.map((g, i) => g || ext[i] || null) : null), [base, ext]);
}

const CUP_IDS = ['champions-league', 'europa-league', 'conference-league'];
const SHORT_OPP = { 'borussia dortmund': 'BVB 09', 'atletico madrid': 'ATL. Madrid', 'atlético madrid': 'ATL. Madrid', 'paris saint-germain': 'PSG', 'paris saint germain': 'PSG', 'manchester united': 'Man Utd', 'manchester city': 'Man City', 'bayer leverkusen': 'Leverkusen', 'bayer 04 leverkusen': 'Leverkusen', 'eintracht frankfurt': 'Frankfurt', "borussia m'gladbach": "M'gladbach", 'borussia monchengladbach': "M'gladbach", 'tottenham hotspur': 'Tottenham', 'newcastle united': 'Newcastle', 'west ham united': 'West Ham', 'wolverhampton wanderers': 'Wolves', 'brighton & hove albion': 'Brighton', 'athletic club': 'Athletic', 'real sociedad': 'R. Sociedad', 'inter milan': 'Inter', 'internazionale': 'Inter', 'bayern munich': 'Bayern', 'bayern münchen': 'Bayern', 'sporting cp': 'Sporting', 'sporting lisbon': 'Sporting' };
const shortOpp = (n) => {
  const k = String(n || '').toLowerCase().trim();
  if (SHORT_OPP[k]) return SHORT_OPP[k];
  if (k.length <= 12) return n;
  const t = String(n).replace(/^(1\. ?)?(FC|AC|AS|SC|SSC|US|VfB|VfL|TSG|SV|FK|SK|RC|CF|UD|RCD|Real|Sporting)\s+/i, '');
  if (t.length <= 13) return t;
  const w = t.split(' ');
  return w[w.length - 1].length >= 4 ? w[w.length - 1] : t;
};
const gameOf = (m) => {
  const t = teamByName(m.opp);
  return { opp: m.opp, label: shortOpp(m.opp), matchId: m.matchId || null, team: t || { name: m.opp, initials: String(m.opp).split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() } };
};

// pagine del grafico: la prima e' sempre "Tutte le competizioni" (le ultime 5 del calcolo); poi una per competizione (scelta per prima).
// Le pagine per competizione sono solo da guardare: nel calcolo conta l'Hit Rate totale (e, per le nazionali, la quota Nations League).
function hitPages(player, key2, vals, mins, comp, g) {
  const opts = playerComps(player);
  const byVal = Object.fromEntries(opts.map((o) => [o.value, o]));
  const all = { key: 'tutte', name: 'Tutte le competizioni', logo: null, values: [...vals].reverse(), games: null };
  if (!key2) return [all];
  if (g && g.some(Boolean)) all.games = [...g].reverse();
  const IM = {};
  ((RAW.indice && RAW.indice.m) || []).forEach((m) => { IM[m[0]] = m; });
  const srcs = [player.nat && player.club ? player.club : player, player.natView, player.nat ? player : null].filter((x) => x && x.recent);
  const seen = new Set();
  const rec = [];
  srcs.forEach((x) => x.recent.forEach((m) => { if (m.matchId && !seen.has(m.matchId)) { seen.add(m.matchId); rec.push(m); } }));
  rec.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const kindOf = (m) => { const lid = IM[m.matchId] && IM[m.matchId][1]; if (!lid) return null; if (NATIONS_KEYS.includes(lid)) return 'nations'; if (CUP_IDS.includes(lid)) return 'coppa'; return leagueById(lid) ? 'campionato' : null; };
  const order = [comp, 'campionato', 'coppa', 'nations'].filter((k, i, a) => a.indexOf(k) === i);
  const out = [all];
  order.forEach((k) => {
    if (!byVal[k]) return;
    const ms = rec.filter((m) => kindOf(m) === k && Number(m.minutes) >= 50 && m[key2] != null && m.opp).slice(0, 5);
    if (!ms.length) return;
    out.push({ key: k, name: byVal[k].comp.name, logo: byVal[k].comp.logo, values: ms.map((m) => Number(m[key2])).reverse(), games: ms.map(gameOf).reverse() });
  });
  return out;
}

// Hit Rate a colonne al posto delle pillole: una colonna per partita (la piu' vecchia a sinistra), una pagina per competizione
function HitPanel({ C, player, vals, mins, key2, line, under, label, openRoute, comp, hitSel }) {
  const games = useHitGames(player, key2, vals, mins);
  const pages = useMemo(() => hitPages(player, key2, vals, mins, comp, games), [player, key2, vals.join(','), mins.join(','), comp, games]); // eslint-disable-line react-hooks/exhaustive-deps
  const head = hitSel ? <View><Dropdown C={C} slim options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]} value={hitSel.value} onChange={hitSel.onChange} placeholder="Nessuna" pillKey="label" labelKey="label" width={150} /></View> : null;
  return (
    <View>
      <Panel ring C={C}><HitChart C={C} pages={pages} line={line} under={under} statLabel={label} openRoute={openRoute} headRight={head} /></Panel>
    </View>
  );
}

function Last5({ C, title, shots, minutes, onShots, onMinutes }) {
  return (
    <View>
      <PanelTitle C={C}>{title} e minuti ultime 5</PanelTitle>
      <Panel ring C={C}>
        <FieldRow C={C} label={title} first><ChipList C={C} value={shots} onChange={onShots} /></FieldRow>
        <FieldRow C={C} label="Minuti"><ChipList C={C} value={minutes} onChange={onMinutes} /></FieldRow>
      </Panel>
    </View>
  );
}

const GENERIC = { campionato: 'Campionato', coppa: 'Coppa europea', nations: 'Nations League', qualificazioni: 'Qualificazioni Mondiali' };
const KIND = { campionato: 'Campionato', coppa: 'Coppa', nations: 'Nazionale', qualificazioni: 'Nazionale' };
const filled = (x) => x && ((x.tiri !== '' && x.tiri != null) || (x.minuti !== '' && x.minuti != null));
const hexOr = (c, d) => (c && /^#/.test(c) ? c : d);

function SeasonPanel({ C, season, onChange, rate90, label, player, comp }) {
  const opts = playerComps(player);
  const byVal = Object.fromEntries(opts.map((o) => [o.value, o]));
  const nations = comp === 'nations';
  const wk = (k) => (k === 'qualificazioni' ? 'nations' : k);
  const live = new Set(SEASON_COMPETITIONS.filter((c) => NATIONS_WEIGHTS[wk(c.key)] && parseFloat(String(season[c.key].minuti).replace(',', '.')) > 0).map((c) => wk(c.key)));
  const wTot = [...live].reduce((a, k) => a + NATIONS_WEIGHTS[k], 0);
  const rows = SEASON_COMPETITIONS.filter((c) => (player ? byVal[c.key] || (c.key === 'qualificazioni' && filled(season[c.key])) : c.key === 'campionato' || c.key === 'coppa'));
  return (
    <View>
      <PanelTitle C={C}>Medie stagione</PanelTitle>
      <Panel ring C={C}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ flex: 1, color: C.ink3, fontSize: 11, fontWeight: '700' }}>COMPETIZIONE</Text>
          <Text style={{ width: 60, textAlign: 'center', color: C.ink3, fontSize: 11, fontWeight: '700' }}>{label.toUpperCase()}</Text>
          <Text style={{ width: 60, textAlign: 'center', color: C.ink3, fontSize: 11, fontWeight: '700' }}>MINUTI</Text>
        </View>
        <View style={{ gap: 6, paddingHorizontal: 10, paddingBottom: 8 }}>
          {rows.map((c) => {
            const o = byVal[c.key];
            const nat = c.key === 'nations' || c.key === 'qualificazioni';
            const out = !nations && nat;
            const w = nations && wTot > 0 && live.has(wk(c.key)) ? NATIONS_WEIGHTS[wk(c.key)] / wTot : null;
            const sub = out ? 'Non nel calcolo' : w ? `${KIND[c.key]} · ${Math.round(w * 100)}%` : KIND[c.key];
            const name = o ? o.comp.name : GENERIC[c.key];
            const c0 = hexOr(o && o.comp.colors[0], null);
            const c1 = hexOr(o && (o.comp.colors[1] || o.comp.colors[0]), c0);
            const ink = c0 ? '#FFFFFF' : C.ink;
            return (
              <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, overflow: 'hidden', paddingVertical: 8, paddingLeft: 8, paddingRight: 6, backgroundColor: c0 ? c0 : C.chip, borderWidth: 1.5, borderColor: c.key === comp ? (c1 || C.accent) : 'transparent', opacity: out ? 0.55 : 1 }}>
                {c0 ? <LinearGradient pointerEvents="none" colors={[c0, mixHex(c0, c1, 0.38)]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
                <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.92)' }}>
                  {o && o.comp.logo ? <CompLogo uri={o.comp.logo} size={20} /> : <Text style={{ color: c0 || C.ink2, fontSize: 10, fontWeight: '700' }}>{String(name).slice(0, 2).toUpperCase()}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: ink, fontSize: 13.5, fontWeight: '700' }}>{name}</Text>
                  <Text numberOfLines={1} style={{ color: c0 ? 'rgba(255,255,255,.78)' : C.ink2, fontSize: 11 }}>{sub}</Text>
                </View>
                <NumInput C={C} value={String(season[c.key].tiri ?? '')} onChange={(v) => onChange(c.key, { tiri: v })} style={{ width: 60, textAlign: 'center', paddingHorizontal: 4 }} />
                <NumInput C={C} value={String(season[c.key].minuti ?? '')} onChange={(v) => onChange(c.key, { minuti: v })} style={{ width: 60, textAlign: 'center', paddingHorizontal: 4 }} />
              </View>
            );
          })}
        </View>
        {rate90 === null || rate90 === undefined ? null : (
          <View style={{ alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.hair }}>
            <Text style={{ color: C.ink, fontSize: 22, fontWeight: '900' }}>Media x 90' = <Text style={{ color: C.accent }}>{comma(rate90, 2)}</Text></Text>
          </View>
        )}
      </Panel>
    </View>
  );
}

// squadra con i tiri (Tiri fatti / subiti, totali e in porta)
export function ShotsTeam({ C, title, mode, family, block, onChange, openRoute, vsId, matchComp }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const stats = teamShots(block.id, block.leagueId);
  const boxes = splitBoxes(stats, mode, family);
  const sl = mode === 'against' ? 'Tiri subiti' : 'Tiri fatti';
  const rk = (r) => (stats && !stats.cup && r ? { r, size: stats.size, col: BAND_COLORS[bandOf(stats.size > 1 ? (stats.size - r) / (stats.size - 1) : 1)] } : null);
  const row = team ? teamRow(block.leagueId, team.id) : null;
  const tiles = [['tot', `${sl} totali`, block.totali, (v) => onChange({ totali: v }), rk(mode === 'against' ? stats && stats.rankAgainst : stats && stats.rankFor)], ['sot', `${sl} in porta`, block.inPorta, (v) => onChange({ inPorta: v }), rk(mode === 'against' ? stats && stats.rankSotAgainst : stats && stats.rankSotFor)]];
  return (
    <TeamCard C={C} openRoute={openRoute} oppId={vsId} matchComp={matchComp} sub={row && row.played > 0 ? `${row.rank}° in classifica` : null} title={title} right={`Nel calcolo: ${family === 'inPorta' ? 'In porta' : 'Totali'}`} block={block} team={team} tiles={tiles}
      footer={stats && boxes.length ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 18, paddingTop: 2 }}>
          {stats.strength < 1 ? <Text style={{ color: C.ink3, fontSize: 11.5 }}>Campionato meno prestigioso: lo scarto dalla media pesa ×{String(stats.strength).replace('.', ',')}.</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>{boxes.map((b) => <Box key={b.label} C={C} label={b.label} value={b.value} />)}</View>
        </View>
      ) : null}
      picker={picker} setPicker={setPicker}
      onLeague={(o) => { const keep = team && calcTeamsOf(o.value).some((n) => n === team.name || (teamByName(n) || {}).id === team.id); onChange(keep ? { leagueId: o.value, ...prefillShots(teamShots(team.id, o.value), mode) } : { leagueId: o.value, id: null, totali: '', inPorta: '' }); }}
      onTeam={(o) => onChange({ id: o.value, ...prefillShots(teamShots(o.value, block.leagueId), mode) })} />
  );
}

const Box = ({ C, label, value }) => (
  <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: C.tileBg, borderWidth: 1, borderColor: C.hair }}>
    <Text style={{ color: C.ink3, fontSize: 10.5 }}>{label}</Text>
    <Text style={{ color: C.ink, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{value}</Text>
  </View>
);

function compLogoN(cc, size, C) {
  return cc && cc.logo ? <CompLogo uri={cc.logo} size={size} C={C} /> : <Text style={{ color: C.ink2, fontSize: 10, fontWeight: '700' }}>{String((cc && cc.name) || '').slice(0, 2).toUpperCase()}</Text>;
}

function TeamCard({ C, title, right, block, team, sub, tiles, matchComp, oppId, footer, picker, setPicker, onLeague, onTeam, openRoute }) {
  const col = team && team.colors && hexOr(team.colors[0]) ? team.colors[0] : C.accent;
  const cc = calcComp(block.leagueId);
  const c0 = hexOr(cc && cc.colors[0], null);
  const c1 = hexOr(cc && (cc.colors[1] || cc.colors[0]), c0);
  const leagueOptions = calcLeagues().map((l) => { const x = calcComp(l.id); return { value: l.id, label: x.name, sub: (x.country || x.kind).toUpperCase(), color: hexOr(x.colors[0]), color2: hexOr(x.colors[1]), icon: compLogoN(x, 30, C) }; });
  const teamOptions = calcTeamsOf(block.leagueId).map((n) => teamByName(n)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => {
      const fc = flagCode(t.name);
      const fcol = fc && FLAG_COLORS[fc] ? FLAG_COLORS[fc] : null;
      const base = { value: t.id, label: t.name, sub: leagueName(block.leagueId).toUpperCase() };
      if (fcol && cc && cc.kind === 'Nazionale') return { ...base, soft: true, bare: true, color: fcol[0], color2: fcol[1] || fcol[0], icon: <FlagN code={fc} size={40} C={C} bare /> };
      return { ...base, soft: true, color: hexOr(t.colors && t.colors[0]), color2: hexOr(t.colors && t.colors[1]), icon: <TeamCrest team={t} size={32} C={C} /> };
    });
  return (
    <View>
      <PanelTitle C={C} right={right}>{title}</PanelTitle>
      <Panel ring C={C} tint={col}>
        <View style={{ padding: 12, paddingTop: 14 }}>
          <Pressable onPress={() => setPicker('league')} style={{ alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 12, borderRadius: 999, overflow: 'hidden', backgroundColor: c0 || C.chip, borderWidth: 1, borderColor: c1 || C.accRing }}>
            {c0 ? <LinearGradient pointerEvents="none" colors={[c0, mixHex(c0, c1, 0.38)]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} /> : null}
            <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.92)' }}>{compLogoN(cc, 18, C)}</View>
            <Text numberOfLines={1} style={{ flexShrink: 1, color: c0 ? '#fff' : C.ink, fontSize: 13.5, fontWeight: '700' }}>{(cc && cc.name) || 'Campionato'}</Text>
            <Ionicons name="chevron-down" size={14} color={c0 ? '#fff' : C.ink2} />
          </Pressable>
          <View style={{ width: 2, height: 10, marginLeft: 16, backgroundColor: c1 || C.accRing }} />
          {team ? (
            <View style={{ borderRadius: 16, padding: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.hair }}>
              <LinearGradient pointerEvents="none" colors={[col + '66', col + '22', col + '00']} locations={[0, 0.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View pointerEvents="none" style={{ position: 'absolute', right: -18, top: -16, opacity: 0.14 }}><TeamCrest team={team} size={110} C={C} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable onPress={() => openRoute && openRoute(`/squadra/${team.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TeamCrest team={team} size={34} C={C} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Text numberOfLines={1} style={{ flexShrink: 1, color: C.ink, fontSize: 18, fontWeight: '700' }}>{team.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.ink3} />
                    </View>
                    {sub ? <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12 }}>{sub}</Text> : null}
                  </View>
                </Pressable>
                <Pressable onPress={() => setPicker('team')} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}><Ionicons name="swap-horizontal" size={17} color={C.ink} /></Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {tiles.map(([k, l, v, f, rk]) => (
                  <View key={k} style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: C.tileBg, borderWidth: 1, borderColor: C.hair }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text numberOfLines={1} style={{ flex: 1, color: C.ink2, fontSize: 11, fontWeight: '600' }}>{l}</Text>
                      {rk ? <Text style={{ color: rk.col || C.ink, fontSize: 11, fontWeight: '700' }}>{rk.r}°<Text style={{ color: C.ink3, fontWeight: '400' }}>/{rk.size}</Text></Text> : null}
                    </View>
                    <View style={{ marginTop: 6 }}><NumInput C={C} value={v} onChange={f} ring tint={rk && rk.col} width="100%" /></View>
                  </View>
                ))}
              </View>
              <NextMatchBtn C={C} ownId={team.id} oppId={oppId} comp={matchComp || block.leagueId} col={col} openRoute={openRoute} style={{ marginTop: 12 }} />
            </View>
          ) : (
            <Pressable onPress={() => setPicker('team')} style={{ borderRadius: 16, padding: 16, backgroundColor: C.chip, borderWidth: 1, borderColor: C.hair, alignItems: 'center' }}>
              <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>Scegli la squadra</Text>
            </Pressable>
          )}
        </View>
        {footer}
      </Panel>
      <FullPicker C={C} open={picker === 'league'} title="Campionato" value={block.leagueId} options={leagueOptions} onClose={() => setPicker(null)} onSelect={onLeague} />
      <FullPicker C={C} open={picker === 'team'} title="Squadra" placeholder="Cerca squadra" value={block.id} options={teamOptions} onClose={() => setPicker(null)} onSelect={onTeam} />
    </View>
  );
}

function FoulsTeam({ C, title, statLabel, block, stats, value, onValue, onChange, openRoute, vsId, matchComp }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const boxes = stats ? [['Casa', stats.casa], ['Trasferta', stats.trasferta]].filter((b) => b[1] !== null && b[1] !== undefined) : [];
  return (
    <TeamCard C={C} openRoute={openRoute} oppId={vsId} matchComp={matchComp} title={title} block={block} team={team} tiles={[['f', statLabel, value, onValue, stats && stats.rank ? { r: stats.rank.r, size: stats.rank.size, col: null } : null]]}
      footer={stats ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 18, paddingTop: 2 }}>
          {stats.mix ? <Text style={{ color: C.ink3, fontSize: 11.5 }}>Media tra campionato ({comma(stats.mix[0].v, 2)}) e coppa ({comma(stats.mix[1].v, 2)})</Text> : null}
          {boxes.length ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>{boxes.map((b) => <Box key={b[0]} C={C} label={b[0]} value={comma(b[1], 1)} />)}</View> : null}
        </View>
      ) : null}
      picker={picker} setPicker={setPicker}
      onLeague={(o) => onChange({ leagueId: o.value, id: null })} onTeam={(o) => onChange({ id: o.value })} />
  );
}

function Roles({ C, rb, title }) {
  if (!rb || !rb.rows.length) return null;
  const max = rb.rows[0].pct;
  const pct = (v) => `${Math.round(v)}%`;
  return (
    <View>
      <PanelTitle C={C}>{title}</PanelTitle>
      <Panel ring C={C}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
          <Text style={{ width: 46, color: C.ink3, fontSize: 11, fontWeight: '700' }}>Ruolo</Text><View style={{ flex: 1 }} />
          <Text style={{ width: 28, textAlign: 'right', color: C.ink3, fontSize: 11, fontWeight: '700' }}>Falli</Text>
          <Text style={{ width: 44, textAlign: 'right', color: C.ink3, fontSize: 11, fontWeight: '700' }}>% tot.</Text>
          <Text style={{ width: 46, textAlign: 'right', color: C.ink3, fontSize: 11, fontWeight: '700' }}>% ruolo</Text>
        </View>
        {rb.rows.map((r) => {
          const gold = rb.main.includes(r.role);
          const col = gold ? C.gold : C.accent;
          return (
            <View key={r.role} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 38 }}>
              <View style={{ width: 46, borderRadius: 6, paddingVertical: 4, alignItems: 'center', backgroundColor: col + '2B' }}><Text style={{ color: col, fontSize: 12.5, fontWeight: '700' }}>{r.role}</Text></View>
              <View style={{ flex: 1, height: 9, borderRadius: 3, backgroundColor: C.hair, overflow: 'hidden' }}><View style={{ height: 9, borderRadius: 3, width: `${Math.max(3, (r.pct / max) * 100)}%`, backgroundColor: col }} /></View>
              <Text style={{ width: 28, textAlign: 'right', color: C.ink, fontSize: 14, fontWeight: '700' }}>{Math.round(r.n)}</Text>
              <Text style={{ width: 44, textAlign: 'right', color: gold ? C.gold : C.ink, fontSize: 14, fontWeight: '700' }}>{pct(r.pct)}</Text>
              <Text style={{ width: 46, textAlign: 'right', color: C.ink3, fontSize: 12.5 }}>{pct(r.rolePct)}</Text>
            </View>
          );
        })}
        <View style={{ height: 8 }} />
      </Panel>
    </View>
  );
}

const MAXD = 3;
function Duel({ C, team, roster, picked, onChange, statLabel, roles }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [team && team.id]);
  const c0 = hexOr(team && team.colors && team.colors[0], '#2C3E66');
  const sel = picked.map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const avg = sel.length ? sel.reduce((s, r) => s + r.avg90, 0) / sel.length : null;
  const toggle = (id) => { if (picked.includes(id)) onChange(picked.filter((x) => x !== id)); else if (picked.length < MAXD) onChange([...picked, id]); };
  return (
    <View>
      <PanelTitle C={C}>Duello avversario</PanelTitle>
      <Panel ring C={C}>
        <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
          {sel.map((r, i) => <View key={r.id} style={{ marginLeft: i ? -10 : 0 }}><Face uri={playerFace(r.id)} color={c0} size={28} /></View>)}
          <Text numberOfLines={1} style={{ flex: 1, color: sel.length ? C.ink : C.ink3, fontSize: 14.5, fontWeight: sel.length ? '700' : '400' }}>{sel.length === 0 ? 'Scegli avversario' : sel.length === 1 ? sel[0].name : `${sel.length} avversari`}</Text>
          {avg !== null ? <Text style={{ color: C.ink, fontSize: 15, fontWeight: '700' }}>{comma(avg, 2)}</Text> : null}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.ink3} />
        </Pressable>
        {open ? (
          <View style={{ borderTopWidth: 1, borderTopColor: C.hair }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: c0 + '66' }}>
              {team ? <TeamCrest team={team} size={18} C={C} /> : null}
              <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 12, fontWeight: '700' }}>{team ? team.name.toUpperCase() : ''}</Text>
              <Text style={{ color: C.ink2, fontSize: 11.5 }}>{statLabel} a 90'</Text>
            </View>
            {roster.map((r) => {
              const on = picked.includes(r.id);
              const dis = !on && picked.length >= MAXD;
              return (
                <Pressable key={r.id} disabled={dis} onPress={() => toggle(r.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.hair, opacity: dis ? 0.4 : 1, backgroundColor: on ? C.accTint : 'transparent' }}>
                  <View><Face uri={playerFace(r.id)} color={c0} size={40} /><RoleBadge C={C} role={roles && roles[r.id]} /></View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '700' }}>{r.name}</Text>
                    <Text style={{ color: C.ink3, fontSize: 11 }}>{r.n} partite · {Math.round(r.min)}'</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 15, fontWeight: '700' }}>{comma(r.avg90, 2)}</Text>
                  <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.accent : 'transparent', borderWidth: 2, borderColor: on ? C.accent : C.hair }}>{on ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}</View>
                </Pressable>
              );
            })}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <Text style={{ flex: 1, color: C.ink3, fontSize: 12, fontWeight: '700' }}>{picked.length}/{MAXD} selezionati{avg !== null ? ` · media ${comma(avg, 2)}` : ''}</Text>
              <Pressable disabled={!picked.length} onPress={() => setOpen(false)} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: C.accent, opacity: picked.length ? 1 : 0.4 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Fatto</Text></Pressable>
            </View>
          </View>
        ) : null}
      </Panel>
    </View>
  );
}

export default function CalcPlayer({ C, openRoute }) {
  const restored = useRef(CALC_KEEP.player != null);
  const ran = useRef(new Set());
  const skipRestore = (name) => { if (!restored.current || ran.current.has(name)) return false; ran.current.add(name); return true; };
  const [form, setForm] = useState(() => (CALC_KEEP.player ? { stat: 'tiri', f: emptyFouls(), ...CALC_KEEP.player } : initial()));
  CALC_KEEP.player = form;
  useEffect(() => { saveCalcKeep(); }, [form]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!saved) return undefined; const id = setTimeout(() => setSaved(false), 2600); return () => clearTimeout(id); }, [saved]);

  // arrivo da Migliori Giocatori: giocatore, linea, partita e statistica gia' inseriti (una volta sola)
  useEffect(() => {
    const st = CALC_IN.v;
    if (!st) return;
    CALC_IN.v = null;
    const p = playerById(st.playerId);
    if (!p) return;
    const hasLine = st.line !== undefined && st.line !== null;
    const fx = (st.ts && fixtureAt(p.teamName, st.ts)) || nextFixture(p.teamName);
    const withStat = (f) => (st.stat ? { ...f, stat: st.stat, tipoTiri: st.stat === 'porta' ? 'inPorta' : 'totali', lineType: 'over' } : f);
    setForm((f) => { const g = withStat(hasLine ? { ...f, line: String(st.line).replace('.', ',') } : f); return fillFrom(g, p, g.tipoTiri, fx); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeason = (key, patch) => setForm((f) => ({ ...f, season: { ...f.season, [key]: { ...f.season[key], ...patch } } }));
  const setBlock = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));

  const player = playerById(form.playerId);
  const team = teamById(form.team.id);
  const opp = teamById(form.opp.id);
  const mcomp = form.competizione === 'coppa' ? cupOf(team) || 'nessuna' : undefined;
  const family = form.tipoTiri;
  const line = parseNum(form.line);
  const odds = parseNum(form.odds);

  const fouls = isFouls(form);
  const f = form.f || emptyFouls();
  const setF = (patch) => setForm((x) => ({ ...x, f: { ...(x.f || emptyFouls()), ...patch } }));
  const oppStat = form.stat === 'fc' ? 'fs' : 'fc';
  const keys = useMemo(() => (fouls ? foulKeysFor(player, [team && team.name, opp && opp.name], [form.team.leagueId, form.opp.leagueId]) : []), [fouls, player, team, opp, form.team.leagueId, form.opp.leagueId]);
  const fd = useFouls(keys);
  const fmOf = (t) => fmTeamIn(fd, t);
  const [fmRes, setFmRes] = useState({ p: null, v: null });
  const fmPid = fmRes.p === form.playerId ? fmRes.v : null;
  useEffect(() => {
    let live = true;
    const pid = form.playerId;
    if (player) resolvePid(player).then((x) => { if (live) setFmRes({ p: pid, v: x || 0 }); }, () => { if (live) setFmRes({ p: pid, v: 0 }); });
    return () => { live = false; };
  }, [form.playerId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownStats = fouls ? teamFoulStats(fd, fmOf(team), form.team.leagueId, team && team.name, form.stat) : null;
  const oppStats = fouls ? teamFoulStats(fd, fmOf(opp), form.opp.leagueId, opp && opp.name, oppStat) : null;
  const oppDom = opp ? domesticKey(opp.name) : null;
  const roster = fouls && oppDom ? rosterFouls(fd, oppDom, fmOf(opp), oppStat) : [];
  const duelSel = (f.duel || []).map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const duelAvg = duelSel.length ? duelSel.reduce((a, r) => a + r.avg90, 0) / duelSel.length : null;
  const duelLeagueAvg = fouls && oppDom ? leaguePlayerAvg(fd, oppDom, oppStat) : null;
  const roleKeys = falliKeysFor(form.competizione === 'nations');
  const fl = useFalli(player ? FALLI_KEYS : []);
  const rb = fouls && fl && fmPid ? roleBreakdown(fl, roleKeys, fmPid, form.stat) : null;
  const roles = useMemo(() => playerRoles(fl, roleKeys), [fl, form.competizione]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ps, setPs] = useState(undefined);
  const [roseOk, setRoseOk] = useState(false);
  useEffect(() => {
    let live = true;
    setPs(undefined);
    if (player && fmPid !== null) {
      Promise.all([loadCarriere(), loadRose()]).then(async () => {
        const c = carriereOf(player.id);
        const cf = c && c.ps ? null : fmPid ? await careerByFm(fmPid).catch(() => null) : null;
        if (live) { setRoseOk(true); setPs((c && c.ps) || (cf && cf.ps) || null); }
      });
    }
    return () => { live = false; };
  }, [form.playerId, fmPid]); // eslint-disable-line react-hooks/exhaustive-deps
  const rp = fmPid && roseOk ? rosePlayer(fmPid) : null;
  const myRole = (fmPid && roles[String(fmPid)]) || (player && (ps !== undefined || fmPid === null) ? cardRole(player.position, ps === undefined ? null : ps, rp && rp.r ? rp.r[2] : null) : null);
  const autoSig = (rb && roster.length ? autoDuelIds(rb, roster, roles) : []).join(',');

  useEffect(() => {
    if (!fouls || !fd || !player || !fmPid) return;
    const sig = ['v3', form.stat, form.playerId, form.team.id, form.team.leagueId, form.opp.id, form.opp.leagueId].join('|');
    if (restored.current && f.sig === sig) return;
    const pf = playerFoulsOf(fd, fmPid, player, form.stat, hitRows);
    const cupOk = playerComps(player).some((o) => o.value === 'coppa');
    setF({
      last5: pf ? pf.last5.join('-') : '',
      min5: pf ? pf.min5.join('-') : '',
      season: foulSeasonOf(pf, cupOk),
      natVals: pf && (player.nat ? player.club : player.natView) ? pf.natVals : [],
      team: ownStats ? comma(ownStats.v, 2) : '',
      opp: oppStats ? comma(oppStats.v, 2) : '',
      sig,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, fd, fmPid, form.stat, form.playerId, form.team.id, form.team.leagueId, form.opp.id, form.opp.leagueId]);
  useEffect(() => {
    if (skipRestore('hit') || !fouls) return;
    setF({ hitRate: hitFromValues(parseDash(f.last5), parseNum(form.line), form.lineType) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, f.last5, form.line, form.lineType]);
  useEffect(() => { if (skipRestore('duel')) return; setF({ duel: [], duelManual: false }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [form.opp.id, form.stat, form.playerId]);
  useEffect(() => {
    if (!fouls || f.duelManual) return;
    setF({ duel: autoSig ? autoSig.split(',') : [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fouls, autoSig, f.duelManual, form.opp.id, form.stat, form.playerId]);

  const result = fouls ? resultFromFouls(form, duelAvg, duelLeagueAvg, ownStats && ownStats.avg, oppStats && oppStats.avg) : resultFromForm(form);
  const hitLabel = fouls ? (HIT_OPTIONS.find((o) => o.value === f.hitRate)?.label ?? null) : (HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null);
  const statTitle = form.stat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const oppTitle = oppStat === 'fc' ? 'Falli commessi' : 'Falli subiti';
  const onStat = (v) => setForm((x) => ({ ...x, stat: v, tipoTiri: v === 'porta' ? 'inPorta' : v === 'tiri' ? 'totali' : x.tipoTiri }));
  const vform = fouls ? { ...form, hitRate: f.hitRate, hitN: form.playerId ? parseDash(f.last5).length : null } : form;
  const natHit = form.playerId && form.competizione === 'nations' ? natHitOf(fouls ? f.natVals : form.natVals, line, form.lineType) : null;

  const setCompetition = (value) => {
    const p0 = playerById(form.playerId);
    const p = p0 && p0.nat && p0.club ? p0.club : p0;
    if (!p || !p.natView) { set('competizione', value); return; }
    const v = viewFor(p, value);
    setForm((x) => ({ ...fillFrom(x, v, x.tipoTiri, nextFixture(v.teamName)), competizione: value }));
  };
  const vset = (key, value) => (fouls && key === 'hitRate' ? setF({ hitRate: value }) : key === 'competizione' ? setCompetition(value) : set(key, value));
  const selectPlayer = (id) => {
    const p = playerById(id);
    if (!p) return;
    const club = p.nat ? p.club || null : p;
    const nat = p.nat ? p : p.natView || null;
    const fxC = club ? upcoming(club.teamName) : null;
    const fxN = nat ? upcoming(nat.teamName) : null;
    const useNat = !!nat && (!club || (fxN && (!fxC || fxN.ts < fxC.ts)));
    const v = useNat ? nat : club;
    const fx = useNat ? fxN : fxC;
    setForm((x) => { const g = fillFrom(x, v, x.tipoTiri, fx); return fx ? g : { ...g, competizione: useNat ? 'nations' : 'campionato' }; });
  };
  useEffect(() => {
    if (skipRestore('fam') || !form.playerId) return;
    const p0 = playerById(form.playerId);
    if (!p0) return;
    const base = p0.nat && p0.club ? p0.club : p0;
    const p = base.nat ? base : viewFor(base, form.competizione);
    setForm((x) => {
      const g = fillFrom(x, p, x.tipoTiri, null);
      return { ...x, shots5: g.shots5, minutes5: g.minutes5, hitRate: g.hitRate, hitN: g.hitN, natVals: g.natVals, season: g.season,
        team: { ...x.team, ...prefillShots(teamShots(x.team.id, x.team.leagueId), 'for') },
        opp: { ...x.opp, ...prefillShots(teamShots(x.opp.id, x.opp.leagueId), 'against') } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipoTiri, form.line, form.lineType]);

  const teamCol = (() => { const c = player ? teamById((player.nat && player.club ? player.club : player).teamId) : null; return playerColor(player, form.competizione, c && c.colors ? c.colors[0] : null); })();
  return (
    <TintProvider color={teamCol}>
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
      <PlayerPick C={C} form={vform} set={vset} player={player} onSelectPlayer={selectPlayer} stat={form.stat || 'tiri'} onStat={onStat} role={myRole} natHit={natHit} openRoute={openRoute} hitN={vform.hitN} hitChart={!!player && (fouls ? parseDash(f.last5).length : parseDash(form.shots5).length) > 0} />
      <Gap />
      {fouls ? (
        <>
          {player && parseDash(f.last5).length ? <HitPanel C={C} player={player} vals={parseDash(f.last5)} mins={parseDash(f.min5)} key2={null} line={parseNum(form.line)} under={form.lineType === 'under'} label={statTitle} openRoute={openRoute} comp={form.competizione} hitSel={{ value: f.hitRate, onChange: (v) => setF({ hitRate: v }) }} /> : <Last5 C={C} title={statTitle} shots={f.last5} minutes={f.min5} onShots={(v) => setF({ last5: v })} onMinutes={(v) => setF({ min5: v })} />}
          <Gap />
          <SeasonPanel C={C} season={f.season} onChange={(k, patch) => setF({ season: { ...f.season, [k]: { ...f.season[k], ...patch } } })} rate90={result.rate90} label={form.stat === 'fc' ? 'Commessi' : 'Subiti'} player={player} comp={form.competizione} />
          <Gap />
          <FoulsTeam C={C} openRoute={openRoute} vsId={form.opp.id} matchComp={mcomp} title="Squadra del giocatore" statLabel={statTitle} block={form.team} stats={ownStats} value={f.team} onValue={(v) => setF({ team: v })} onChange={(p) => setBlock('team', p)} />
          {rb ? <><Gap /><Roles C={C} rb={rb} title={form.stat === 'fc' ? 'Ruoli avversari · falli commessi' : 'Ruoli avversari · falli subiti'} /></> : null}
          <Gap />
          <Duel C={C} team={opp} roster={roster} picked={f.duel || []} onChange={(d) => setF({ duel: d, duelManual: true })} statLabel={oppTitle} roles={roles} />
          <Gap />
          <FoulsTeam C={C} openRoute={openRoute} vsId={form.team.id} title="Squadra avversaria" statLabel={oppTitle} block={form.opp} stats={oppStats} value={f.opp} onValue={(v) => setF({ opp: v })} onChange={(p) => setBlock('opp', p)} />
        </>
      ) : (
        <>
          {player && parseDash(form.shots5).length ? <HitPanel C={C} player={player} vals={parseDash(form.shots5)} mins={parseDash(form.minutes5)} key2={form.tipoTiri === 'inPorta' ? 'sot' : 'shots'} line={parseNum(form.line)} under={form.lineType === 'under'} label={form.tipoTiri === 'inPorta' ? 'Tiri in porta' : 'Tiri'} openRoute={openRoute} comp={form.competizione} hitSel={{ value: form.hitRate, onChange: (v) => set('hitRate', v) }} /> : <Last5 C={C} title="Tiri" shots={form.shots5} minutes={form.minutes5} onShots={(v) => set('shots5', v)} onMinutes={(v) => set('minutes5', v)} />}
          <Gap />
          <SeasonPanel C={C} season={form.season} onChange={setSeason} rate90={result.rate90} label="Tiri" player={player} comp={form.competizione} />
          <Gap />
          <ShotsTeam C={C} openRoute={openRoute} vsId={form.opp.id} matchComp={mcomp} title="Squadra del giocatore" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
          <Gap />
          <ShotsTeam C={C} openRoute={openRoute} vsId={form.team.id} title="Squadra avversaria" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
        </>
      )}
      <Gap />
      <PanelTitle C={C}>Risultato</PanelTitle>
      <Text style={{ color: C.ink3, fontSize: 11.5, marginBottom: 12 }}>{player && team && opp ? `${player.name} · ${team.name} contro ${opp.name}` : 'Completa i campi per il calcolo'}</Text>
      <ResultCard C={C} result={result} kind="player" />
    </View>
    </TintProvider>
  );
}
