import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ChevronDown, ChevronRight } from 'lucide-react';
import Crest from '@/components/Crest';
import { teamColor } from '@/lib/tint';
import NumInput from './NumInput';
import { CompLogo } from './CompBannerSelect';
import { calcComp, compAccent, compBg } from './calcComp';

// Squadra del giocatore / avversaria (concept B, scelto dall'utente l'8/11/2026): in alto la pillola della competizione nei suoi colori
// (logo + nome, apre la scelta), un filo nel colore della competizione la collega alla scheda della squadra nei colori della squadra
// (stemma, nome che apre la scheda squadra, tasto per cambiarla) con le medie in due tessere (posizione + valore modificabile).
// Sotto, `children` (es. tasto Prossima partita). Stesso componente per tiri e falli.
// tiles: [{ key, label, rank: { r, size, col } | null, value, onChange }]
export default function TeamCompCard({ leagueId, team, sub, tiles = [], onLeague, onTeam, children }) {
  const navigate = useNavigate();
  const comp = calcComp(leagueId);
  const c = team ? teamColor(team) : null;
  return (
    <div className="px-3 pb-3 pt-3.5">
      <button
        type="button"
        onClick={onLeague}
        data-league-pill
        className="press flex max-w-full items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-bold"
        style={{ background: compBg(comp), border: `1px solid ${compAccent(comp)}`, color: 'var(--on-banner)' }}
        aria-label="Scegli la competizione"
      >
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: 'var(--banner-chip)' }}>
          <CompLogo comp={comp} size={16} />
        </span>
        <span className="truncate">{comp ? comp.name : 'Campionato'}</span>
        <ChevronDown size={14} strokeWidth={2} className="shrink-0" />
      </button>
      <div aria-hidden="true" style={{ width: 2, height: 10, marginLeft: 16, background: compAccent(comp) }} />
      {team ? (
        <div className="relative overflow-hidden rounded-[16px] p-3" style={{ background: `linear-gradient(135deg, ${c}66, ${c}22 70%, transparent)`, border: '1px solid var(--hair)' }}>
          <span className="pointer-events-none absolute" style={{ right: -18, top: -16, opacity: 0.14 }} aria-hidden="true">
            <Crest team={team} size={110} />
          </span>
          <div className="relative flex items-center gap-2.5">
            <button type="button" onClick={() => navigate(`/squadra/${team.id}`)} className="press flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-label={`Apri la scheda di ${team.name}`}>
              <Crest team={team} size={34} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[18px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>
                  <span className="truncate">{team.name}</span>
                  <ChevronRight size={16} strokeWidth={2} className="shrink-0" style={{ color: 'var(--ink-3)' }} />
                </span>
                {sub ? <span className="block truncate text-[12px] tnum" style={{ color: 'var(--ink-2)' }}>{sub}</span> : null}
              </span>
            </button>
            <button type="button" onClick={onTeam} className="press flex shrink-0 items-center justify-center rounded-full" style={{ width: 34, height: 34, background: 'color-mix(in srgb, var(--ink) 12%, transparent)', color: 'var(--ink)' }} aria-label="Cambia squadra">
              <ArrowLeftRight size={16} strokeWidth={2} />
            </button>
          </div>
          {tiles.length ? (
            <div className={`relative mt-3 grid gap-2 ${tiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {tiles.map((t) => (
                <div key={t.key} className="rounded-xl p-2.5" style={{ background: 'color-mix(in srgb, var(--sky-2) 62%, transparent)', border: '1px solid var(--hair)' }}>
                  <p className="flex items-baseline gap-1 text-[11px] font-semibold" style={{ color: 'var(--ink-2)' }}>
                    <span className="truncate">{t.label}</span>
                    {t.rank ? <span className="tnum ml-auto shrink-0 font-extrabold" style={{ color: t.rank.col || 'var(--ink)' }}>{t.rank.r}°<span className="font-normal" style={{ color: 'var(--ink-3)' }}>/{t.rank.size}</span></span> : null}
                  </p>
                  <div className="mt-1.5">
                    <NumInput value={t.value} tint={t.rank ? t.rank.col : null} onChange={t.onChange} width="100%" ariaLabel={t.label} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {children ? <div className="relative">{children}</div> : null}
        </div>
      ) : (
        <button type="button" onClick={onTeam} className="press flex w-full items-center justify-between rounded-[16px] px-4 py-3.5 text-left text-[15px]" style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-3)' }}>
          Scegli la squadra
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
