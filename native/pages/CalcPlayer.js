// Calcolatore: scheda Affidabilità giocatore (nativa). Stessa logica di components/calc/PlayerTab.jsx del sito, con i dati e i calcoli condivisi.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import { CALC_IN } from '../shared/calcIn';
import { PLAYERS, playerById } from '@/data/players';
import { teamById, teamByName } from '@/data/teams';
import { allTeamMatches, nextMatchOf, nextMatchVs } from '@/data/extras';
import { romeDay } from '@/data/util';
import { calcTeamsOf, calcLeagues, leagueName, cupOf, domesticKey, nextFixture, fixtureAt, prefillShots, splitBoxes, teamShots } from '@/data/calcData';
import { emptyFouls, fillFrom, hitFromValues, hitRows, initialForm, isFouls, natHitOf, resultFromForm, resultFromFouls, viewFor } from '@/data/calcPlayer';
import { fmTeamIn, foulKeysFor, foulSeasonOf, leaguePlayerAvg, playerFoulsOf, rosterFouls, teamFoulStats, useFouls } from '@/data/calcFouls';
import { FALLI_KEYS, cardRole, autoDuelIds, falliKeysFor, playerRoles, roleBreakdown, useFalli } from '@/data/calcRoles';
import { resolvePid } from '@/data/playerPid';
import { careerByFm, carriereOf, loadCarriere } from '@/data/carriere';
import { loadRose, rosePlayer } from '@/data/rose';
import { playerFace } from '@/data/archive';
import { playerComps, calcComp } from '@/components/calc/calcComp';
import { comma } from '@/lib/format';
import { parseDash, parseNum, fmtLine, HIT_OPTIONS, LINE_OPTIONS, SEDE_OPTIONS, COMPETITION_OPTIONS, NATIONS_OPTION, NATIONS_WEIGHTS, SEASON_COMPETITIONS, lineHintText } from '@/lib/calc';
import { Panel, PanelTitle, Segmented, FieldRow, NumInput, PickerModal, TeamCrest, Face } from '../shared/ui';
import ResultCard from '../shared/ResultCard';

const STATS = [{ value: 'tiri', label: 'Tiri' }, { value: 'porta', label: 'In porta' }, { value: 'fc', label: 'Commessi' }, { value: 'fs', label: 'Subiti' }];
const STAT_NAME = { tiri: 'tiri', porta: 'tiri in porta', fc: 'falli commessi', fs: 'falli subiti' };
const LINES = ['0,5', '1,5', '2,5', '3,5'];
const initial = () => ({ ...initialForm(), dashTarget: 'shots' });
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
    <Text style={{ color: '#2e2100', fontSize: 11, fontWeight: '800' }}>{role}</Text>
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
            <Text style={{ color: C.ink, fontSize: 13, fontWeight: '800' }}>{n}</Text>
            <Ionicons name="close" size={11} color={C.ink3} />
          </Pressable>
        ))}
        {!list.length ? <Text style={{ color: C.ink3, fontSize: 14, paddingVertical: 4 }}>—</Text> : null}
      </View>
      {!full ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput value={cur} onChangeText={(t) => setCur(t.replace(/[^0-9]/g, '').slice(0, 3))} onSubmitEditing={add} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.ink3} style={{ width: 56, color: C.ink, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 7, textAlign: 'center', fontSize: 16, fontWeight: '700' }} />
          <Pressable onPress={add} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.accent }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Aggiungi</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

// tendina a scelta (valore linea, hit rate, competizione): apre una finestra con le voci
function Select({ C, value, options, onChange, placeholder, title }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12 }}>
        <Text numberOfLines={1} style={{ color: cur ? C.ink : C.ink3, fontSize: 15, fontWeight: '700' }}>{cur ? cur.label : placeholder || '—'}</Text>
        <Ionicons name="chevron-down" size={14} color={C.ink3} />
      </Pressable>
      <PickerModal C={C} open={open} title={title || ''} options={options} onSelect={(o) => onChange(o.value)} onClose={() => setOpen(false)} />
    </>
  );
}

function PlayerPick({ C, form, set, player, onSelectPlayer, stat, onStat, role, natHit, openRoute, hitN }) {
  const [picker, setPicker] = useState(false);
  const club = player ? (player.nat && player.club ? player.club : player) : null;
  const team = club ? teamById(club.teamId) : null;
  const col = team && team.colors ? team.colors[0] : C.accent;
  const comps = useMemo(() => playerComps(player), [player]);
  const hitTitle = form.playerId && hitN > 0 && hitN < 5 ? `Hit rate su ${hitN} ${hitN === 1 ? 'partita' : 'partite'}` : 'Hit rate ultime 5';
  const ownId = form.team && form.team.id ? form.team.id : club && club.teamId;
  const comp = form.competizione === 'coppa' ? cupOf(teamById(ownId)) || 'nessuna' : (form.team && form.team.leagueId) || undefined;
  const nm = useMemo(() => {
    if (!ownId) return null;
    const first = nextMatchOf ? nextMatchOf(ownId, comp) : null;
    const vs0 = form.opp && form.opp.id ? nextMatchVs(ownId, form.opp.id) : null;
    const vs = vs0 && (!comp || vs0.leagueId === comp) ? vs0 : null;
    return vs && (!first || Math.abs(vs.ts - first.ts) < 3 * 864e5) ? vs : first;
  }, [ownId, comp, form.opp && form.opp.id, form.playerId]);
  const options = useMemo(() => (picker ? PLAYERS.filter((p) => !(p.nat && p.club)).map((p) => {
    const t = p.nat ? null : teamById(p.teamId);
    const sub = [t ? t.name : p.teamName || '', p.nat && p.clubName ? p.clubName : '', p.natView ? p.natView.teamName : p.nat ? p.teamName : ''].filter(Boolean).join(' · ');
    return { value: p.id, label: p.name, sub, color: t && t.colors && t.colors[0], face: p.photo, alias: [p.nick, p.natView && p.natView.name !== p.name ? p.natView.name : null].filter(Boolean).join(' ') };
  }) : []), [picker]);
  const opp = nm ? teamById(nm.homeId === ownId || (teamById(nm.homeId) || {}).name === (teamById(ownId) || {}).name ? nm.awayId : nm.homeId) : null;
  return (
    <View>
      <PanelTitle C={C}>Giocatore</PanelTitle>
      <Panel C={C}>
        {player ? (
          <View style={{ padding: 14, backgroundColor: col + '33' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => openRoute && openRoute(`/giocatore/${club.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View><Face uri={player.photo} color={col} size={56} /><RoleBadge C={C} role={role} /></View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: C.ink, fontSize: 17, fontWeight: '800' }}>{player.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    {team ? <TeamCrest team={team} size={15} C={C} /> : null}
                    <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 12.5, flexShrink: 1 }}>{club.teamName}{player.natView ? ` · ${player.natView.teamName}` : ''}</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable onPress={() => setPicker(true)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.accent }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Cambia</Text></Pressable>
            </View>
            {nm ? (
              <Pressable onPress={() => openRoute && openRoute(`/match/${nm.id}`)} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.chip, borderWidth: 1, borderColor: C.hair }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink3, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }}>PROSSIMA PARTITA</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={{ color: C.ink3, fontSize: 13.5, fontWeight: '700' }}>vs</Text>
                    {opp ? <TeamCrest team={opp} size={16} C={C} /> : null}
                    <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13.5, fontWeight: '700', flexShrink: 1 }}>{opp ? opp.name : ''}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={C.ink3} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Pressable onPress={() => setPicker(true)} style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>Cerca e seleziona</Text>
            <Ionicons name="search" size={18} color={C.ink3} />
          </Pressable>
        )}
        <FieldRow C={C} label="Statistiche"><Select C={C} title="Statistiche" value={stat} options={STATS.map((o) => ({ ...o }))} onChange={onStat} /></FieldRow>
        <FieldRow C={C} label="Tipo linea"><Segmented C={C} options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} /></FieldRow>
        <FieldRow C={C} label="Valore linea"><Select C={C} title="Valore linea" value={form.line} options={LINES.map((x) => ({ value: x, label: x }))} onChange={(v) => set('line', v)} /></FieldRow>
        <FieldRow C={C} label="Quota"><NumInput C={C} value={form.odds} onChange={(v) => set('odds', v)} /></FieldRow>
        <FieldRow C={C} label="Sede"><Segmented C={C} options={SEDE_OPTIONS} value={form.sede} onChange={(v) => set('sede', v)} /></FieldRow>
        {comps.length ? <FieldRow C={C} label="Competizione"><Select C={C} title="Competizione" value={form.competizione} options={comps.map((o) => ({ value: o.value, label: o.comp.name, sub: o.sub.toUpperCase(), color: o.comp.colors && /^#/.test(o.comp.colors[0]) ? o.comp.colors[0] : undefined }))} onChange={(v) => set('competizione', v)} /></FieldRow> : null}
        <FieldRow C={C} label={hitTitle}><Select C={C} title={hitTitle} value={form.hitRate} placeholder="Nessuna" options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]} onChange={(v) => set('hitRate', v)} /></FieldRow>
        {natHit ? <FieldRow C={C} label="Hit rate nazionale"><Text style={{ color: C.ink, fontSize: 15, fontWeight: '700', textAlign: 'right' }}>{natHit.hit}/{natHit.n}</Text></FieldRow> : null}
      </Panel>
      <PickerModal C={C} open={picker} title="Giocatore" searchable requireQuery placeholder="Cerca giocatore o squadra" options={options} onClose={() => setPicker(false)} onSelect={(o) => onSelectPlayer(o.value)} />
    </View>
  );
}

function Last5({ C, title, shots, minutes, onShots, onMinutes }) {
  return (
    <View>
      <PanelTitle C={C}>{title} e minuti ultime 5</PanelTitle>
      <Panel C={C}>
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
      <Panel C={C}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ flex: 1, color: C.ink3, fontSize: 11, fontWeight: '800' }}>COMPETIZIONE</Text>
          <Text style={{ width: 60, textAlign: 'center', color: C.ink3, fontSize: 11, fontWeight: '800' }}>{label.toUpperCase()}</Text>
          <Text style={{ width: 60, textAlign: 'center', color: C.ink3, fontSize: 11, fontWeight: '800' }}>MINUTI</Text>
        </View>
        <View style={{ gap: 6, paddingHorizontal: 10, paddingBottom: 8 }}>
          {rows.map((c) => {
            const o = byVal[c.key];
            const nat = c.key === 'nations' || c.key === 'qualificazioni';
            const out = !nations && nat;
            const w = nations && wTot > 0 && live.has(wk(c.key)) ? NATIONS_WEIGHTS[wk(c.key)] / wTot : null;
            const sub = out ? 'Non nel calcolo' : w ? `${KIND[c.key]} · ${Math.round(w * 100)}%` : KIND[c.key];
            const name = o ? o.comp.name : GENERIC[c.key];
            const bg = hexOr(o && o.comp.colors[0], C.chip);
            return (
              <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 8, paddingLeft: 10, paddingRight: 6, backgroundColor: bg + (bg === C.chip ? '' : '55'), borderWidth: 1.5, borderColor: c.key === comp ? hexOr(o && o.comp.colors[1], C.accent) : 'transparent', opacity: out ? 0.55 : 1 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.ink, fontSize: 13.5, fontWeight: '700' }}>{name}</Text>
                  <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 11 }}>{sub}</Text>
                </View>
                <NumInput C={C} value={String(season[c.key].tiri ?? '')} onChange={(v) => onChange(c.key, { tiri: v })} style={{ width: 60, textAlign: 'center', paddingHorizontal: 4 }} />
                <NumInput C={C} value={String(season[c.key].minuti ?? '')} onChange={(v) => onChange(c.key, { minuti: v })} style={{ width: 60, textAlign: 'center', paddingHorizontal: 4 }} />
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.hair }}>
          <Text style={{ flex: 1, color: C.ink3, fontSize: 11, fontWeight: '800' }}>TASSO NORMALIZZATO A 90'</Text>
          <Text style={{ color: C.ink, fontSize: 15, fontWeight: '700' }}>{rate90 === null || rate90 === undefined ? '—' : comma(rate90, 2)}</Text>
        </View>
      </Panel>
    </View>
  );
}

// squadra con i tiri (Tiri fatti / subiti, totali e in porta)
function ShotsTeam({ C, title, mode, family, block, onChange }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const stats = teamShots(block.id, block.leagueId);
  const boxes = splitBoxes(stats, mode, family);
  const sl = mode === 'against' ? 'Tiri subiti' : 'Tiri fatti';
  const tiles = [['tot', `${sl} totali`, block.totali, (v) => onChange({ totali: v })], ['sot', `${sl} in porta`, block.inPorta, (v) => onChange({ inPorta: v })]];
  return (
    <TeamCard C={C} title={title} right={`Nel calcolo: ${family === 'inPorta' ? 'In porta' : 'Totali'}`} block={block} team={team} tiles={tiles}
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
  <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: C.chip }}>
    <Text style={{ color: C.ink3, fontSize: 10.5 }}>{label}</Text>
    <Text style={{ color: C.ink, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{value}</Text>
  </View>
);

function TeamCard({ C, title, right, block, team, tiles, footer, picker, setPicker, onLeague, onTeam }) {
  const col = team && team.colors ? team.colors[0] : C.accent;
  const leagueOptions = calcLeagues().map((l) => { const cc = calcComp(l.id); return { value: l.id, label: cc.name, sub: (cc.country || cc.kind).toUpperCase(), color: hexOr(cc.colors[0]) }; });
  const teamOptions = calcTeamsOf(block.leagueId).map((n) => teamByName(n)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId).toUpperCase(), color: t.colors && t.colors[0], icon: <TeamCrest team={t} size={28} C={C} /> }));
  return (
    <View>
      <PanelTitle C={C} right={right}>{title}</PanelTitle>
      <Panel C={C}>
        <View style={{ padding: 12 }}>
          <Pressable onPress={() => setPicker('league')} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.accTint, borderWidth: 1, borderColor: C.accRing }}>
            <Text numberOfLines={1} style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{leagueName(block.leagueId) || 'Campionato'}</Text>
            <Ionicons name="chevron-down" size={14} color={C.ink2} />
          </Pressable>
          <View style={{ width: 2, height: 10, marginLeft: 16, backgroundColor: C.accRing }} />
          {team ? (
            <View style={{ borderRadius: 16, padding: 12, backgroundColor: col + '33', borderWidth: 1, borderColor: C.hair }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TeamCrest team={team} size={34} C={C} />
                <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 18, fontWeight: '800' }}>{team.name}</Text>
                <Pressable onPress={() => setPicker('team')} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}><Ionicons name="swap-horizontal" size={17} color={C.ink} /></Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {tiles.map(([k, l, v, f]) => (
                  <View key={k} style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: C.chip, borderWidth: 1, borderColor: C.hair }}>
                    <Text numberOfLines={1} style={{ color: C.ink2, fontSize: 11, fontWeight: '600' }}>{l}</Text>
                    <NumInput C={C} value={v} onChange={f} style={{ marginTop: 6, textAlign: 'left', backgroundColor: 'transparent', paddingHorizontal: 0, fontSize: 20 }} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setPicker('team')} style={{ borderRadius: 16, padding: 16, backgroundColor: C.chip, borderWidth: 1, borderColor: C.hair, alignItems: 'center' }}>
              <Text style={{ color: C.accent, fontSize: 15, fontWeight: '700' }}>Scegli la squadra</Text>
            </Pressable>
          )}
        </View>
        {footer}
      </Panel>
      <PickerModal C={C} open={picker === 'league'} title="Campionato" options={leagueOptions} onClose={() => setPicker(null)} onSelect={onLeague} />
      <PickerModal C={C} open={picker === 'team'} title="Squadra" searchable placeholder="Cerca squadra" options={teamOptions} onClose={() => setPicker(null)} onSelect={onTeam} />
    </View>
  );
}

function FoulsTeam({ C, title, statLabel, block, stats, value, onValue, onChange }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const boxes = stats ? [['Casa', stats.casa], ['Trasferta', stats.trasferta]].filter((b) => b[1] !== null && b[1] !== undefined) : [];
  return (
    <TeamCard C={C} title={title} block={block} team={team} tiles={[['f', statLabel, value, onValue]]}
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
      <Panel C={C}>
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
              <View style={{ width: 46, borderRadius: 6, paddingVertical: 4, alignItems: 'center', backgroundColor: col + '2B' }}><Text style={{ color: col, fontSize: 12.5, fontWeight: '800' }}>{r.role}</Text></View>
              <View style={{ flex: 1, height: 9, borderRadius: 3, backgroundColor: C.hair, overflow: 'hidden' }}><View style={{ height: 9, borderRadius: 3, width: `${Math.max(3, (r.pct / max) * 100)}%`, backgroundColor: col }} /></View>
              <Text style={{ width: 28, textAlign: 'right', color: C.ink, fontSize: 14, fontWeight: '800' }}>{Math.round(r.n)}</Text>
              <Text style={{ width: 44, textAlign: 'right', color: gold ? C.gold : C.ink, fontSize: 14, fontWeight: '800' }}>{pct(r.pct)}</Text>
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
      <Panel C={C}>
        <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
          {sel.map((r, i) => <View key={r.id} style={{ marginLeft: i ? -10 : 0 }}><Face uri={playerFace(r.id)} color={c0} size={28} /></View>)}
          <Text numberOfLines={1} style={{ flex: 1, color: sel.length ? C.ink : C.ink3, fontSize: 14.5, fontWeight: sel.length ? '700' : '400' }}>{sel.length === 0 ? 'Scegli avversario' : sel.length === 1 ? sel[0].name : `${sel.length} avversari`}</Text>
          {avg !== null ? <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>{comma(avg, 2)}</Text> : null}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.ink3} />
        </Pressable>
        {open ? (
          <View style={{ borderTopWidth: 1, borderTopColor: C.hair }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: c0 + '66' }}>
              {team ? <TeamCrest team={team} size={18} C={C} /> : null}
              <Text numberOfLines={1} style={{ flex: 1, color: C.ink, fontSize: 12, fontWeight: '800' }}>{team ? team.name.toUpperCase() : ''}</Text>
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
                  <Text style={{ color: C.ink, fontSize: 15, fontWeight: '800' }}>{comma(r.avg90, 2)}</Text>
                  <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.accent : 'transparent', borderWidth: 2, borderColor: on ? C.accent : C.hair }}>{on ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}</View>
                </Pressable>
              );
            })}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <Text style={{ flex: 1, color: C.ink3, fontSize: 12, fontWeight: '700' }}>{picked.length}/{MAXD} selezionati{avg !== null ? ` · media ${comma(avg, 2)}` : ''}</Text>
              <Pressable disabled={!picked.length} onPress={() => setOpen(false)} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: C.accent, opacity: picked.length ? 1 : 0.4 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Fatto</Text></Pressable>
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
  const myRole = (fmPid && roles[String(fmPid)]) || (player && fmPid !== null && ps !== undefined && (fl || !fmPid) ? cardRole(player.position, ps, rp && rp.r ? rp.r[2] : null) : null);
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

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
      <PlayerPick C={C} form={vform} set={vset} player={player} onSelectPlayer={selectPlayer} stat={form.stat || 'tiri'} onStat={onStat} role={myRole} natHit={natHit} openRoute={openRoute} hitN={vform.hitN} />
      <Gap />
      {fouls ? (
        <>
          <Last5 C={C} title={statTitle} shots={f.last5} minutes={f.min5} onShots={(v) => setF({ last5: v })} onMinutes={(v) => setF({ min5: v })} />
          <Gap />
          <SeasonPanel C={C} season={f.season} onChange={(k, patch) => setF({ season: { ...f.season, [k]: { ...f.season[k], ...patch } } })} rate90={result.rate90} label={form.stat === 'fc' ? 'Commessi' : 'Subiti'} player={player} comp={form.competizione} />
          <Gap />
          <FoulsTeam C={C} title="Squadra del giocatore" statLabel={statTitle} block={form.team} stats={ownStats} value={f.team} onValue={(v) => setF({ team: v })} onChange={(p) => setBlock('team', p)} />
          {rb ? <><Gap /><Roles C={C} rb={rb} title={form.stat === 'fc' ? 'Ruoli avversari · falli commessi' : 'Ruoli avversari · falli subiti'} /></> : null}
          <Gap />
          <Duel C={C} team={opp} roster={roster} picked={f.duel || []} onChange={(d) => setF({ duel: d, duelManual: true })} statLabel={oppTitle} roles={roles} />
          <Gap />
          <FoulsTeam C={C} title="Squadra avversaria" statLabel={oppTitle} block={form.opp} stats={oppStats} value={f.opp} onValue={(v) => setF({ opp: v })} onChange={(p) => setBlock('opp', p)} />
        </>
      ) : (
        <>
          <Last5 C={C} title="Tiri" shots={form.shots5} minutes={form.minutes5} onShots={(v) => set('shots5', v)} onMinutes={(v) => set('minutes5', v)} />
          <Gap />
          <SeasonPanel C={C} season={form.season} onChange={setSeason} rate90={result.rate90} label="Tiri" player={player} comp={form.competizione} />
          <Gap />
          <ShotsTeam C={C} title="Squadra del giocatore" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
          <Gap />
          <ShotsTeam C={C} title="Squadra avversaria" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
        </>
      )}
      <Gap />
      <PanelTitle C={C}>Risultato</PanelTitle>
      <Text style={{ color: C.ink3, fontSize: 11.5, marginBottom: 12 }}>{player && team && opp ? `${player.name} · ${team.name} contro ${opp.name}` : 'Completa i campi per il calcolo'}</Text>
      <ResultCard C={C} result={result} kind="player" />
    </View>
  );
}
