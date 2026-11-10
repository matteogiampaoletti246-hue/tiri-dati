// Calcolatore: scheda Affidabilità squadra (nativa). Calcoli di lib/calc.js e data/calcData.js del sito, condivisi.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CALC_KEEP, saveCalcKeep } from '@/data/calcKeep';
import { teamShots, prefillShots, splitBoxes, calcTeamsOf, calcLeagues, leagueName } from '@/data/calcData';
import { teamById, teamByName } from '@/data/teams';
import { LINE_OPTIONS, SEDE_OPTIONS, SHOTS_OPTIONS, computeTeamResult, lineHintText, parseNum } from '@/lib/calc';
import { SedeButtonsN, Panel, PanelTitle, Segmented, FieldRow, NumInput, PickerModal, TeamCrest } from '../shared/ui';
import ResultCard from '../shared/ResultCard';

const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });
const initialForm = () => ({ tipoTiri: 'totali', lineType: 'over', line: '9,5', odds: '', sede: 'neutro', team: emptyBlock(), opp: emptyBlock() });

function TeamBlock({ C, title, mode, family, block, onChange }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const stats = teamShots(block.id, block.leagueId);
  const boxes = splitBoxes(stats, mode, family);
  const shotsLabel = mode === 'against' ? 'Tiri subiti' : 'Tiri fatti';
  const col = team && team.colors ? team.colors[0] : C.accent;
  const leagueOptions = calcLeagues().map((l) => ({ value: l.id, label: l.name, sub: l.cup ? 'COPPA EUROPEA' : 'CAMPIONATO' }));
  const teamOptions = calcTeamsOf(block.leagueId).map((n) => teamByName(n)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId).toUpperCase(), color: t.colors && t.colors[0], icon: <TeamCrest team={t} size={28} C={C} /> }));
  return (
    <View>
      <PanelTitle C={C} right={`Nel calcolo: ${family === 'inPorta' ? 'In porta' : 'Totali'}`}>{title}</PanelTitle>
      <Panel C={C} tint={col}>
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
                {[['tot', `${shotsLabel} totali`, block.totali, (v) => onChange({ totali: v })], ['sot', `${shotsLabel} in porta`, block.inPorta, (v) => onChange({ inPorta: v })]].map(([k, l, v, f]) => (
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
        {stats && boxes.length ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 18, paddingTop: 2 }}>
            {stats.strength < 1 ? <Text style={{ color: C.ink3, fontSize: 11.5 }}>Campionato meno prestigioso: lo scarto dalla media pesa ×{String(stats.strength).replace('.', ',')}.</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {boxes.map((b) => (
                <View key={b.label} style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: C.chip }}>
                  <Text style={{ color: C.ink3, fontSize: 10.5 }}>{b.label}</Text>
                  <Text style={{ color: C.ink, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{b.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Panel>
      <PickerModal C={C} open={picker === 'league'} title="Campionato" options={leagueOptions} onClose={() => setPicker(null)}
        onSelect={(o) => {
          const keep = team && calcTeamsOf(o.value).some((n) => n === team.name || (teamByName(n) || {}).id === team.id);
          onChange(keep ? { leagueId: o.value, ...prefillShots(teamShots(team.id, o.value), mode) } : { leagueId: o.value, id: null, totali: '', inPorta: '' });
        }} />
      <PickerModal C={C} open={picker === 'team'} title="Squadra" searchable placeholder="Cerca squadra" options={teamOptions} onClose={() => setPicker(null)}
        onSelect={(o) => onChange({ id: o.value, ...prefillShots(teamShots(o.value, block.leagueId), mode) })} />
    </View>
  );
}

export default function CalcTeam({ C }) {
  const [form, setForm] = useState(() => CALC_KEEP.team || initialForm());
  CALC_KEEP.team = form;
  const upd = (f) => { setForm(f); saveCalcKeep(); };
  const set = (k, v) => upd({ ...form, [k]: v });
  const setBlock = (k, p) => upd({ ...form, [k]: { ...form[k], ...p } });
  const team = teamById(form.team.id); const opp = teamById(form.opp.id);
  const family = form.tipoTiri; const line = parseNum(form.line); const odds = parseNum(form.odds);
  const fs = teamShots(form.team.id, form.team.leagueId); const os = teamShots(form.opp.id, form.opp.leagueId);
  const result = computeTeamResult({
    teamFor: parseNum(form.team[family]), teamOpp: parseNum(form.opp[family]),
    forAvg: fs ? fs.avg.for[family] : null, forStrength: fs ? fs.strength : null,
    oppAvg: os ? os.avg.against[family] : null, oppStrength: os ? os.strength : null,
    sede: form.sede, line, lineType: form.lineType, odds,
  });
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
      <TeamBlock C={C} title="Squadra" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
      <View style={{ height: 28 }} />
      <TeamBlock C={C} title="Avversario" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
      <View style={{ height: 28 }} />
      <PanelTitle C={C}>Giocata</PanelTitle>
      <Panel C={C}>
        <FieldRow C={C} label="Tipo tiri" first><Segmented C={C} options={SHOTS_OPTIONS} value={form.tipoTiri} onChange={(v) => set('tipoTiri', v)} /></FieldRow>
        <FieldRow C={C} label="Tipo linea"><Segmented C={C} options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} /></FieldRow>
        <FieldRow C={C} label="Valore linea" hint={lineHintText(result.lambda, line)}><NumInput C={C} value={form.line} onChange={(v) => set('line', v)} /></FieldRow>
        <FieldRow C={C} label="Quota"><NumInput C={C} value={form.odds} onChange={(v) => set('odds', v)} /></FieldRow>
        <SedeButtonsN C={C} value={form.sede} onChange={(v) => set('sede', v)} />
      </Panel>
      <View style={{ height: 28 }} />
      <PanelTitle C={C}>Risultato</PanelTitle>
      <Text style={{ color: C.ink3, fontSize: 11.5, marginBottom: 12 }}>{team && opp ? `${team.name} contro ${opp.name}` : 'Completa i campi per il calcolo'}</Text>
      <ResultCard C={C} result={result} kind="team" />
    </View>
  );
}
