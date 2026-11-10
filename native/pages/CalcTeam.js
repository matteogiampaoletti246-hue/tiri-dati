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
import { ShotsTeam } from './CalcPlayer';

const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });
const initialForm = () => ({ tipoTiri: 'totali', lineType: 'over', line: '9,5', odds: '', sede: 'neutro', team: emptyBlock(), opp: emptyBlock() });

const TeamBlock = ShotsTeam;

export default function CalcTeam({ C, openRoute }) {
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
      <TeamBlock C={C} openRoute={openRoute} title="Squadra" mode="for" family={family} block={form.team} onChange={(p) => setBlock('team', p)} />
      <View style={{ height: 28 }} />
      <TeamBlock C={C} openRoute={openRoute} title="Avversario" mode="against" family={family} block={form.opp} onChange={(p) => setBlock('opp', p)} />
      <View style={{ height: 28 }} />
      <PanelTitle C={C}>Giocata</PanelTitle>
      <Panel ring C={C}>
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
