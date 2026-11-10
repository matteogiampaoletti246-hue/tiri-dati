import PanelTitle from '@/components/PanelTitle';
import { NATIONS_WEIGHTS, SEASON_COMPETITIONS } from '@/lib/calc';
import { comma } from '@/lib/format';
import FieldRow from './FieldRow';
import NumInput from './NumInput';
import TintSweep, { ringStyle } from './TintSweep';
import { CompLogo } from './CompBannerSelect';
import { compAccent, compBg, playerComps } from './calcComp';

const GENERIC = { campionato: 'Campionato', coppa: 'Coppa europea', nations: 'Nations League', qualificazioni: 'Qualificazioni Mondiali' };
const KIND = { campionato: 'Campionato', coppa: 'Coppa', nations: 'Nazionale', qualificazioni: 'Nazionale' };
const filled = (x) => x && ((x.tiri !== '' && x.tiri != null) || (x.minuti !== '' && x.minuti != null));
const pct = (w) => `${Math.round(w * 100)}%`;

// Medie stagione (concept B, scelto dall'utente l'8/11/2026): ogni competizione del giocatore e' un mini banner nei suoi colori, con
// logo e nome veri (es. "Süper Lig", "Europa League", "Nations League A") al posto di "Campionato" / "Coppa europea".
// Nel calcolo (seasonRate90): con Nations League scelta pesano nazionale 50%, campionato 25%, coppa europea 25%; con campionato o coppa
// la nazionale non si conta (riga attenuata, "Non nel calcolo"). Righe senza competizione e senza valori non si mostrano.
export default function PlayerSeasonPanel({ season, onChange, rate90, label = 'Tiri', tint, player = null, comp = 'campionato' }) {
  const opts = playerComps(player);
  const byVal = Object.fromEntries(opts.map((o) => [o.value, o]));
  const nations = comp === 'nations';
  // pesi mostrati = pesi usati davvero: ridistribuiti sulle competizioni con minuti (es. senza coppa: campionato 33%, nazionale 67%)
  const wk = (k) => (k === 'qualificazioni' ? 'nations' : k);
  const live = new Set(SEASON_COMPETITIONS.filter((c) => NATIONS_WEIGHTS[wk(c.key)] && parseFloat(String(season[c.key].minuti).replace(',', '.')) > 0).map((c) => wk(c.key)));
  const wTot = [...live].reduce((a, k) => a + NATIONS_WEIGHTS[k], 0);
  const rows = SEASON_COMPETITIONS.filter((c) => (player ? byVal[c.key] || (c.key === 'qualificazioni' && filled(season[c.key])) : c.key === 'campionato' || c.key === 'coppa'));

  return (
    <section>
      <PanelTitle>Medie stagione</PanelTitle>
      <div className="panel has-tint overflow-hidden" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <div className="flex items-center gap-2 px-5 py-2.5">
          <p className="label-sm">Competizione</p>
          <p className="label-sm ml-auto text-center" style={{ width: player ? 54 : 64 }}>{label}</p>
          <p className="label-sm text-center" style={{ width: player ? 54 : 64, marginRight: player ? 14 : 0 }}>Minuti</p>
        </div>
        {player ? (
          <div className="flex flex-col gap-1.5 px-3 pb-2">
            {rows.map((c) => {
              const o = byVal[c.key];
              const nat = c.key === 'nations' || c.key === 'qualificazioni';
              const out = !nations && nat;
              const w = nations && wTot > 0 && live.has(wk(c.key)) ? NATIONS_WEIGHTS[wk(c.key)] / wTot : null;
              const sub = out ? 'Non nel calcolo' : w ? `${KIND[c.key]} · ${pct(w)}` : KIND[c.key];
              const on = c.key === comp;
              const name = o ? o.comp.name : GENERIC[c.key];
              return (
                <div
                  key={c.key}
                  data-season-row={c.key}
                  className="flex items-center gap-2 rounded-xl py-2 pl-2 pr-1.5"
                  style={{ background: compBg(o ? o.comp : null), border: `1.5px solid ${on ? compAccent(o ? o.comp : null) : 'transparent'}`, opacity: out ? 0.55 : 1, transition: 'opacity .25s ease, border-color .25s ease' }}
                >
                  <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 30, height: 30, background: 'var(--banner-chip)' }}>
                    {o ? <CompLogo comp={o.comp} size={20} /> : <span className="text-[10px] font-extrabold" style={{ color: 'var(--banner-neutral)' }}>{name.slice(0, 2).toUpperCase()}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold leading-tight" style={{ color: 'var(--on-banner)', overflowWrap: 'anywhere' }}>{name}</span>
                    <span className="block truncate text-[11px]" style={{ color: 'var(--on-banner-2)' }}>{sub}</span>
                  </span>
                  <NumInput onBanner value={season[c.key].tiri} onChange={(v) => onChange(c.key, { tiri: v })} width={54} ariaLabel={`${label} ${name}`} />
                  <NumInput onBanner value={season[c.key].minuti} onChange={(v) => onChange(c.key, { minuti: v })} width={54} ariaLabel={`Minuti ${name}`} />
                </div>
              );
            })}
          </div>
        ) : (
          rows.map((c) => (
            <FieldRow key={c.key} label={GENERIC[c.key]}>
              <NumInput value={season[c.key].tiri} onChange={(v) => onChange(c.key, { tiri: v })} width={64} ariaLabel={`${label} ${GENERIC[c.key]}`} />
              <NumInput value={season[c.key].minuti} onChange={(v) => onChange(c.key, { minuti: v })} width={64} ariaLabel={`Minuti ${GENERIC[c.key]}`} />
            </FieldRow>
          ))
        )}
        <div className="flex items-baseline gap-3 px-5 py-3.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <p className="label-sm min-w-0 leading-tight">Tasso normalizzato a 90&apos;</p>
          <p className="tnum ml-auto text-[15px]" style={{ color: 'var(--ink)' }}>
            {rate90 === null || rate90 === undefined ? '—' : comma(rate90, 2)}
          </p>
        </div>
      </div>
    </section>
  );
}
