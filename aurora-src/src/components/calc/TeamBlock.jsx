import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamRow } from '@/data/standings';
import { NextMatchButton } from './PlayerPickPanel';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import { CUPS, calcTeamsOf, leagueName, prefillShots, rankNote, splitBoxes, teamShots } from '@/data/calcData';
import { teamById, teamByName } from '@/data/teams';
import PickerSheet from './PickerSheet';
import StatBox from './StatBox';
import TintSweep, { ringStyle } from './TintSweep';
import TeamCompCard from './TeamCompCard';
import { calcLeagueOptions } from './calcComp';
import { bandColor } from '@/components/player/playerCalc';

// Blocco squadra riusato nel calcolo: campionato, squadra, tiri (totali e in porta),
// nota di posizione e riquadri casa / trasferta.
// Banner della squadra scelta (concept B, scelto dall'utente l'8/11/2026): grande nei colori della squadra, stemma grande in filigrana,
// competizione in una pillola (apre la scelta), icona per cambiare squadra, nome che apre la scheda squadra e sotto il tasto
// Prossima partita della squadra NELLA competizione scelta (campionato o coppa europea), che apre la partita sopra il Calcolatore.
// coppa europea della squadra (Champions o Europa League), per il tasto Prossima partita con Competizione = Coppa europea
export const cupOf = (team) => (team ? CUPS.find((c) => calcTeamsOf(c).some((n) => n === team.name || (teamByName(n) || {}).id === team.id)) || null : null);

// riga sotto il nome della squadra: posizione in classifica (solo campionati)
const bannerSub = (team, block) => {
  if (!team) return null;
  const row = teamRow(block.leagueId, team.id);
  return row && row.played > 0 ? `${row.rank}° in classifica` : null;
};

// matchComp: competizione della prossima partita nel banner quando la decide il tasto Competizione della scheda giocatore (coppa europea)
export default function TeamBlock({ title, mode = 'for', family = 'totali', block, onChange, tint, vsId, matchComp }) {
  const [picker, setPicker] = useState(null);
  const navigate = useNavigate();
  const team = teamById(block.id);
  const stats = teamShots(block.id, block.leagueId);
  const boxes = splitBoxes(stats, mode, family);
  const shotsLabel = mode === 'against' ? 'Tiri subiti' : 'Tiri fatti';

  const rk = (r) => (stats && !stats.cup && r ? { r, col: bandColor(stats.size > 1 ? (stats.size - r) / (stats.size - 1) : 1) } : null);
  const rankTot = rk(mode === 'against' ? stats?.rankAgainst : stats?.rankFor);
  const rankSot = rk(mode === 'against' ? stats?.rankSotAgainst : stats?.rankSotFor);

  const leagueOptions = calcLeagueOptions();
  // nazionali (Nations League): scelta a banner come i campionati (concept A), nei colori della nazionale con la bandiera
  // squadre e nazionali a banner colorati (colori sociali, stemma), come nella ricerca e come i campionati
  const teamOptions = calcTeamsOf(block.leagueId)
    .map((n) => teamByName(n))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId), avatar: <Crest team={t} size={26} />, team: t, sub: leagueName(block.leagueId).toUpperCase() }));

  return (
    <section>
      <PanelTitle right={<span className="label-sm">Nel calcolo: {family === 'inPorta' ? 'In porta' : 'Totali'}</span>}>{title}</PanelTitle>
      <div className="panel has-tint overflow-hidden" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <TeamCompCard
          leagueId={block.leagueId}
          team={team}
          sub={bannerSub(team, block, mode)}
          onLeague={() => setPicker('league')}
          onTeam={() => setPicker('team')}
          tiles={[
            { key: 'tot', label: `${shotsLabel} totali`, rank: rankTot ? { ...rankTot, size: stats.size } : null, value: block.totali, onChange: (v) => onChange({ totali: v }) },
            { key: 'sot', label: `${shotsLabel} in porta`, rank: rankSot ? { ...rankSot, size: stats.size } : null, value: block.inPorta, onChange: (v) => onChange({ inPorta: v }) },
          ]}
        >
          {team ? <NextMatchButton glass ownId={team.id} oppId={vsId} comp={matchComp || block.leagueId} onOpen={(id) => navigate(`/match/${id}`)} /> : null}
        </TeamCompCard>

        {stats ? (
          <div className="px-5 pb-5 pt-2">
            {stats.cup ? (
              <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
                {rankNote(stats, mode)}
              </p>
            ) : null}
            {stats.strength < 1 ? (
              <p className="mt-1 text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>
                Campionato meno prestigioso: lo scarto dalla media pesa ×{String(stats.strength).replace('.', ',')}.
              </p>
            ) : null}
            {boxes.length ? (
              <div className="mt-3 flex gap-2">
                {boxes.map((b) => (
                  <StatBox key={b.label} label={b.label} value={b.value} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <PickerSheet
        open={picker === 'league'}
        title="Campionato"
        banners
        options={leagueOptions}
        onSelect={(o) => {
          // la squadra resta se gioca anche nella competizione scelta (medie di quella competizione); altrimenti si riparte da zero
          const keep = team && calcTeamsOf(o.value).some((n) => n === team.name || (teamByName(n) || {}).id === team.id);
          onChange(keep ? { leagueId: o.value, ...prefillShots(teamShots(team.id, o.value), mode) } : { leagueId: o.value, id: null, totali: '', inPorta: '' });
        }}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        open={picker === 'team'}
        title="Squadra"
        banners
        placeholder="Cerca squadra"
        options={teamOptions}
        onSelect={(o) => onChange({ id: o.value, ...prefillShots(teamShots(o.value, block.leagueId), mode) })}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
