import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { teamColor } from '@/lib/tint';
import { teamRow } from '@/data/standings';
import { NextMatchButton } from './PlayerPickPanel';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import { CUPS, calcLeagues, calcTeamsOf, leagueName, prefillShots, rankNote, splitBoxes, teamShots } from '@/data/calcData';
import { teamById, teamByName } from '@/data/teams';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import SelectRow from './SelectRow';
import StatBox from './StatBox';
import TintSweep from './TintSweep';
import { bandColor } from '@/components/player/playerCalc';

// Blocco squadra riusato nel calcolo: campionato, squadra, tiri (totali e in porta),
// nota di posizione e riquadri casa / trasferta.
// Banner della squadra scelta (concept B, scelto dall'utente l'8/11/2026): grande nei colori della squadra, stemma grande in filigrana,
// competizione in una pillola (apre la scelta), icona per cambiare squadra, nome che apre la scheda squadra e sotto il tasto
// Prossima partita della squadra NELLA competizione scelta (campionato o coppa europea), che apre la partita sopra il Calcolatore.
// coppa europea della squadra (Champions o Europa League), per il tasto Prossima partita con Competizione = Coppa europea
export const cupOf = (team) => (team ? CUPS.find((c) => calcTeamsOf(c).some((n) => n === team.name || (teamByName(n) || {}).id === team.id)) || null : null);

function TeamBanner({ team, block, mode, vsId, matchComp, onLeague, onTeam }) {
  const navigate = useNavigate();
  const c = teamColor(team);
  const row = teamRow(block.leagueId, team.id);
  const rank = row && row.played > 0 ? `${row.rank}° in classifica` : null;
  const per = block.totali !== '' && block.totali != null ? `${String(block.totali).replace('.', ',')} tiri ${mode === 'against' ? 'subiti' : 'fatti'} a partita` : null;
  const sub = [rank, per].filter(Boolean).join(' · ');
  return (
    <div className="relative overflow-hidden px-4 pb-3.5 pt-4" style={{ background: `linear-gradient(135deg, ${c}78, ${c}24 62%, transparent)` }}>
      <span className="pointer-events-none absolute" style={{ right: -22, top: -18, opacity: 0.16 }} aria-hidden="true">
        <Crest team={team} size={124} />
      </span>
      <div className="relative flex items-start justify-between gap-2">
        <button type="button" onClick={onLeague} className="press flex min-w-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ background: 'color-mix(in srgb, var(--ink) 12%, transparent)', color: 'var(--ink)' }} aria-label="Scegli la competizione">
          <span className="truncate">{leagueName(block.leagueId)}</span>
          <ChevronDown size={14} strokeWidth={2} />
        </button>
        <button type="button" onClick={onTeam} className="press flex shrink-0 items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'color-mix(in srgb, var(--ink) 14%, transparent)', color: 'var(--ink)' }} aria-label="Cambia squadra">
          <ArrowLeftRight size={16} strokeWidth={2} />
        </button>
      </div>
      <button type="button" onClick={() => navigate(`/squadra/${team.id}`)} className="press relative mt-2.5 block max-w-full text-left" aria-label={`Apri la scheda di ${team.name}`}>
        <span className="block truncate text-[24px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>{team.name}</span>
        {sub ? <span className="mt-0.5 block truncate text-[12.5px] tnum" style={{ color: 'var(--ink-2)' }}>{sub}</span> : null}
      </button>
      <div className="relative">
        <NextMatchButton glass ownId={team.id} oppId={vsId} comp={matchComp || block.leagueId} onOpen={(id) => navigate(`/match/${id}`)} />
      </div>
    </div>
  );
}

// matchComp: competizione della prossima partita nel banner quando la decide il tasto Competizione della scheda giocatore (coppa europea)
export default function TeamBlock({ title, mode = 'for', family = 'totali', block, onChange, tint, vsId, matchComp }) {
  const [picker, setPicker] = useState(null);
  const team = teamById(block.id);
  const stats = teamShots(block.id, block.leagueId);
  const boxes = splitBoxes(stats, mode, family);
  const shotsLabel = mode === 'against' ? 'Tiri subiti' : 'Tiri fatti';

  const rk = (r) => (stats && !stats.cup && r ? { r, col: bandColor(stats.size > 1 ? (stats.size - r) / (stats.size - 1) : 1) } : null);
  const rankTot = rk(mode === 'against' ? stats?.rankAgainst : stats?.rankFor);
  const rankSot = rk(mode === 'against' ? stats?.rankSotAgainst : stats?.rankSotFor);
  const RankTag = ({ x }) => (x ? <span className="tnum whitespace-nowrap text-[15px] font-extrabold" style={{ color: x.col }}>{x.r}° <span className="text-[10.5px] font-normal" style={{ color: 'var(--ink-3)' }}>su {stats.size}</span></span> : null);

  const leagueOptions = calcLeagues().map((l) => ({ value: l.id, label: l.name, sub: l.cup ? 'Coppa europea' : '' }));
  const teamOptions = calcTeamsOf(block.leagueId)
    .map((n) => teamByName(n))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, sub: leagueName(block.leagueId), avatar: <Crest team={t} size={26} /> }));

  return (
    <section>
      <PanelTitle right={<span className="label-sm">Nel calcolo: {family === 'inPorta' ? 'In porta' : 'Totali'}</span>}>{title}</PanelTitle>
      <div className="panel has-tint overflow-hidden">
        <TintSweep tint={tint} />
        {team ? (
          <TeamBanner team={team} block={block} mode={mode} vsId={vsId} matchComp={matchComp} onLeague={() => setPicker('league')} onTeam={() => setPicker('team')} />
        ) : (
          <>
            <SelectRow first label="Campionato" value={leagueName(block.leagueId)} onClick={() => setPicker('league')} />
            <SelectRow label="Squadra" value={null} onClick={() => setPicker('team')} />
          </>
        )}
        <FieldRow label={`${shotsLabel} totali`}>
          <RankTag x={rankTot} />
          <NumInput value={block.totali} tint={rankTot ? rankTot.col : null} onChange={(v) => onChange({ totali: v })} ariaLabel={`${shotsLabel} totali`} />
        </FieldRow>
        <FieldRow label={`${shotsLabel} in porta`}>
          <RankTag x={rankSot} />
          <NumInput value={block.inPorta} tint={rankSot ? rankSot.col : null} onChange={(v) => onChange({ inPorta: v })} ariaLabel={`${shotsLabel} in porta`} />
        </FieldRow>

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
        placeholder="Cerca squadra"
        options={teamOptions}
        onSelect={(o) => onChange({ id: o.value, ...prefillShots(teamShots(o.value, block.leagueId), mode) })}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
