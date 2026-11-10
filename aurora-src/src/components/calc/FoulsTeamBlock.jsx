import TintSweep, { ringStyle } from './TintSweep';
import { useState } from 'react';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import { calcTeamsOf, leagueName } from '@/data/calcData';
import TeamCompCard from './TeamCompCard';
import { calcLeagueOptions } from './calcComp';
import { teamById, teamByName } from '@/data/teams';
import { comma } from '@/lib/format';
import PickerSheet from './PickerSheet';
import StatBox from './StatBox';

// Squadra nel calcolo dei falli: campionato, squadra, media della statistica scelta (con posizione) e riquadri casa / trasferta.
export default function FoulsTeamBlock({ title, statLabel, block, stats, value, onValue, onChange, tint }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const leagueOptions = calcLeagueOptions();
  // nazionali (Nations League): scelta a banner come i campionati (concept A), nei colori della nazionale con la bandiera
  // squadre e nazionali a banner colorati (colori sociali, stemma), come nella ricerca e come i campionati
  const teamOptions = calcTeamsOf(block.leagueId)
    .map((n) => teamByName(n))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId), avatar: <Crest team={t} size={26} />, team: t, sub: leagueName(block.leagueId).toUpperCase() }));
  const boxes = stats ? [['Casa', stats.casa], ['Trasferta', stats.trasferta]].filter((b) => b[1] !== null && b[1] !== undefined) : [];
  return (
    <section>
      <PanelTitle>{title}</PanelTitle>
      <div className="panel has-tint overflow-hidden" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <TeamCompCard
          leagueId={block.leagueId}
          team={team}
          onLeague={() => setPicker('league')}
          onTeam={() => setPicker('team')}
          tiles={[{ key: 'f', label: statLabel, rank: stats && stats.rank ? { r: stats.rank.r, size: stats.rank.size } : null, value, onChange: onValue }]}
        />
        {stats ? (
          <div className="px-5 pb-5 pt-2">
            {stats.mix ? <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-3)' }}>Media tra campionato ({comma(stats.mix[0].v, 2)}) e coppa ({comma(stats.mix[1].v, 2)})</p> : null}
            {boxes.length ? <div className={`${stats.mix ? 'mt-3' : ''} flex gap-2`}>{boxes.map((b) => <StatBox key={b[0]} label={b[0]} value={comma(b[1], 1)} />)}</div> : null}
          </div>
        ) : null}
      </div>
      <PickerSheet open={picker === 'league'} title="Campionato" banners options={leagueOptions} onSelect={(o) => onChange({ leagueId: o.value, id: null })} onClose={() => setPicker(null)} />
      <PickerSheet open={picker === 'team'} title="Squadra"
        banners placeholder="Cerca squadra" options={teamOptions} onSelect={(o) => onChange({ id: o.value })} onClose={() => setPicker(null)} />
    </section>
  );
}
